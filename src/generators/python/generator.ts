import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
  joinPathFragments,
  ProjectType,
  ensurePackage,
  NX_VERSION,
  runTasksInSerial,
  GeneratorCallback,
} from '@nx/devkit';
import { Linter as nxLinter } from '@nx/linter';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { DUMMY_FILES } from './constants';
import {
  pythonInstallableFilters,
  getTargets,
  setJoin,
  normalizeOptions,
  type NormalizedOptions,
} from './utils';
import { pdm } from '../../pdm/pdm';
import type { BuildBackend, PythonGeneratorSchema } from './schema';

export const pdmInitCommand = (
  projectType: ProjectType,
  buildBackend?: BuildBackend
) => {
  const pdmInitCommands = new Set<string>();
  if (projectType === 'library') {
    pdmInitCommands.add('--lib');
  }
  if (buildBackend) {
    pdmInitCommands.add(`--backend=${buildBackend}`);
  }
  pdmInitCommands.add('--non-interactive');

  return `init ${setJoin(pdmInitCommands, ' ')}`;
};

export const pdmInstallCommand = ({
  linter,
  typeChecker,
  unitTestRunner,
  e2eTestRunner,
}: NormalizedOptions) => {
  const pdmInstallCommands = new Set<string>(['setuptools']);
  [
    linter,
    typeChecker,
    pythonInstallableFilters.filterUnitTestRunner(unitTestRunner),
    pythonInstallableFilters.filterE2ERunner(e2eTestRunner),
  ]
    // Remove undefined and 'none' values
    .filter(
      (pkg): pkg is Exclude<typeof pkg, undefined | 'none'> =>
        pkg !== undefined && pkg !== 'none'
    )
    .forEach((pkg) => {
      pdmInstallCommands.add(pkg);
    });

  if (pdmInstallCommands.size) {
    return `add -d ${setJoin(pdmInstallCommands, ' ')}`;
  }

  return null;
};

// Only Cypress calls this function for now
// as all others do not require any extra tasks.
const addE2E = async (
  tree: Tree,
  { projectName }: NormalizedOptions
): Promise<GeneratorCallback> => {
  const { cypressE2EConfigurationGenerator } = ensurePackage<
    typeof import('@nx/cypress')
  >('@nx/cypress', NX_VERSION);

  return await cypressE2EConfigurationGenerator(tree, {
    project: projectName,
    linter: nxLinter.EsLint,
  });
};

export async function pythonGenerator(
  tree: Tree,
  options: PythonGeneratorSchema
) {
  const endTasks: GeneratorCallback[] = [];
  const normalizedOptions = normalizeOptions(tree, options);
  const {
    buildBackend,
    e2eTestRunner,
    parsedTags,
    projectName,
    projectRoot,
    projectType,
  } = normalizedOptions;

  // Add main project
  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    projectType: projectType,
    sourceRoot: projectRoot,
    targets: getTargets(normalizedOptions),
    tags: parsedTags,
  });

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    options
  );

  DUMMY_FILES.forEach((dummyFile) => {
    tree.write(joinPathFragments(projectRoot, dummyFile), '');
  });
  tree.write(joinPathFragments(projectRoot, '.venv'), '');
  tree.write(joinPathFragments(projectRoot, '.pdm-python'), '');
  tree.write(joinPathFragments(projectRoot, '.gitignore'), '');

  if (e2eTestRunner === 'cypress') {
    endTasks.push(await addE2E(tree, normalizedOptions));
  }

  await formatFiles(tree);

  return async () => {
    // Initialize PDM specifics
    const cwd = joinPathFragments(tree.root, projectRoot);
    DUMMY_FILES.forEach((dummyFile) => {
      rmSync(joinPathFragments(cwd, dummyFile));
    });

    await pdm(pdmInitCommand(projectType, buildBackend), {
      cwd,
    });

    // Add project name, version, and authors as the minimum needed to build
    // PDM automatically gives project name and version for libraries, but applications do not for some reason
    const tomlPath = joinPathFragments(cwd, 'pyproject.toml');
    const pyprojectContent = readFileSync(tomlPath)
      .toString()
      // Add the project name
      .replace(/(^name\s*=\s*)("")/gm, `$1"${projectName}"`)
      // Add the version if not present
      .replace(/(^version\s*=\s*)("")/gm, '$1"0.1.0"')
      // Add boilerplate to the authors list
      .replace(
        /(^authors\s*=\s*)(\[\s*\{name\s*=\s*"", email\s*=\s*""\},\s*\])/gm,
        '$1[\n    {name = "Your Name", email = "your@email.com"},\n]'
      );
    writeFileSync(tomlPath, pyprojectContent);

    const installCommand = pdmInstallCommand(normalizedOptions);

    if (installCommand) {
      await pdm(installCommand, {
        cwd,
      });
    }

    if (normalizedOptions.typeChecker === 'pyre-check') {
      // Initialize pyre
      // Feed in aditional option for directory
      const pyreInitCommand = `run pyre init <<EOF
./src",!__pycache__,!./.venv
EOF`;
      await pdm(pyreInitCommand, { cwd });
    }

    runTasksInSerial(...endTasks);
  };
}

export default pythonGenerator;
