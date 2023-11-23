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
import { readFile, writeFile, rm } from 'fs/promises';
import {
  DUMMY_FILES,
  isNodeE2ETestRunner,
  isPythonE2ETestRunner,
} from './constants';
import {
  pythonInstallableFilters,
  getTargets,
  setJoin,
  normalizeOptions,
  type NormalizedOptions,
} from './utils';
import { PdmOptions, pdm } from '../../pdm/pdm';
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
  {
    e2eTestRunner,
    separateE2eProject,
    e2eDirectory,
    e2eBundler,
    projectName,
    linter,
    tags: tagsInput,
  }: NormalizedOptions
): Promise<GeneratorCallback> => {
  const tags = `${tagsInput ? `${tagsInput},` : ''}e2e`;

  if (isNodeE2ETestRunner(e2eTestRunner)) {
    const { Linter: nxLinter } = ensurePackage<typeof import('@nx/eslint')>(
      '@nx/eslint',
      NX_VERSION
    );

    if (separateE2eProject) {
      const { applicationGenerator } = ensurePackage<typeof import('@nx/web')>(
        '@nx/web',
        NX_VERSION
      );

      await applicationGenerator(tree, {
        name: `${projectName}-e2e`,
        bundler: e2eBundler,
        linter: nxLinter.EsLint,
        e2eTestRunner,
        tags,
      });
    } else {
      if (e2eTestRunner === 'cypress') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/cypress')
        >('@nx/cypress', NX_VERSION);

        return await configurationGenerator(tree, {
          project: projectName,
          linter: nxLinter.EsLint,
          directory: e2eDirectory,
          bundler: e2eBundler,
        });
      } else if (e2eTestRunner === 'playwright') {
        const { configurationGenerator } = ensurePackage<
          typeof import('@nx/playwright')
        >('@nx/playwright', NX_VERSION);

        return await configurationGenerator(tree, {
          project: projectName,
          linter: nxLinter.EsLint,
          directory: '',
          js: false,
          skipFormat: false,
          skipPackageJson: false,
          setParserOptionsProject: false,
        });
      }
    }
  } else if (isPythonE2ETestRunner(e2eTestRunner)) {
    // Is a python E2E test runner. Use python project
    if (separateE2eProject) {
      // Create a separate @dman926/nx-pdm-python:python project for E2E
      return await pythonGenerator(tree, {
        name: `${projectName}-e2e`,
        projectType: 'application',
        e2eTestRunner: e2eTestRunner,
        directory: e2eDirectory,
        linter,
        separateE2eProject: false,
        tags,
      });
    }
    // Otherwise do nothing since pythonGenerator GeneratorCallback will handle it
  }
  return () => {};
};

export async function pythonGenerator(
  tree: Tree,
  options: PythonGeneratorSchema
) {
  const endTasks: GeneratorCallback[] = [];
  const normalizedOptions = await normalizeOptions(tree, options);
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
    targets: getTargets(tree, normalizedOptions),
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

  if (e2eTestRunner !== 'none') {
    endTasks.push(await addE2E(tree, normalizedOptions));
  }

  await formatFiles(tree);

  // TODO: error handling to alert user better
  return async () => {
    // Initialize PDM specifics
    const cwd = joinPathFragments(tree.root, projectRoot);
    await Promise.all(
      DUMMY_FILES.map((dummyFile) => rm(joinPathFragments(cwd, dummyFile)))
    );

    const defaultPDMOptions: Partial<PdmOptions> = {
      cwd,
      quiet: true,
    };

    pdm(pdmInitCommand(projectType, buildBackend), defaultPDMOptions);

    // MODIFYING pyproject.toml
    // Add project name, version, and authors as the minimum needed to build
    // PDM automatically gives project name and version for libraries, but applications do not for some reason
    const tomlPath = joinPathFragments(cwd, 'pyproject.toml');
    await readFile(tomlPath, {
      encoding: 'utf-8',
    })
      .then((file) =>
        file
          // Add the project name
          .replace(/(^name\s*=\s*)("")/gm, `$1"${projectName}"`)
          // Add the version if not present
          .replace(/(^version\s*=\s*)("")/gm, '$1"0.1.0"')
          // Add boilerplate to the authors list
          .replace(
            /(^authors\s*=\s*)(\[\s*\{name\s*=\s*"", email\s*=\s*""\},\s*\])/gm,
            '$1[\n    {name = "Your Name", email = "your@email.com"},\n]'
          )
      )
      .then((outFile) => writeFile(tomlPath, outFile));

    const installCommand = pdmInstallCommand(normalizedOptions);

    if (installCommand) {
      pdm(installCommand, defaultPDMOptions);
    }

    if (normalizedOptions.typeChecker === 'pyre-check') {
      // Initialize pyre
      // Feed in aditional option for directory
      const pyreInitCommand = `run pyre init <<EOF
./
EOF`;
      pdm(pyreInitCommand, defaultPDMOptions);

      // MODIFYING .pyre_configuration
      const exclude = ['.*/__pycache__/.*', '.*/.pyre/.*'];
      const ignoreAllErrors = ['./.venv'];
      const pyreconfPath = joinPathFragments(cwd, '.pyre_configuration');
      await readFile(pyreconfPath, { encoding: 'utf-8' })
        .then((file) => {
          const fileJson = JSON.parse(file);
          fileJson.exclude = exclude;
          fileJson['ignore_all_errors'] = ignoreAllErrors;
          return JSON.stringify(fileJson, null, 2);
        })
        .then((outFile) => writeFile(pyreconfPath, outFile));
    }

    // TODO: configure E2E in project if `separateE2eProject` is false and is a python E2E runner

    runTasksInSerial(...endTasks);
  };
}

export default pythonGenerator;
