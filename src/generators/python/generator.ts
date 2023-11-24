import {
  type Tree,
  type GeneratorCallback,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  joinPathFragments,
  runTasksInSerial,
  logger,
  installPackagesTask,
} from '@nx/devkit';
import { readFile, writeFile, rm, mkdir } from 'fs/promises';
import { DUMMY_FILES, isPythonE2ETestRunner } from './constants';
import {
  getTargets,
  normalizeOptions,
  addE2E,
  pdmInitCommand,
  pdmInstallCommand,
} from './utils';
import { type PdmOptions, pdm } from '../../pdm/pdm';
import type { PythonGeneratorSchema } from './schema';

export async function pythonGenerator(
  tree: Tree,
  options: PythonGeneratorSchema
): Promise<GeneratorCallback> {
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

    // Configure Python E2E in project
    if (
      !normalizedOptions.separateE2eProject &&
      isPythonE2ETestRunner(normalizedOptions.e2eTestRunner)
    ) {
      switch (normalizedOptions.e2eTestRunner) {
        case 'robotframework': {
          // Add sample robot file
          const e2eFolderPath = joinPathFragments(cwd, 'e2e');
          const robotSampleFilePath = joinPathFragments(
            e2eFolderPath,
            'sample.robot'
          );
          const robotSampleFileContent = `*** Settings ***
Documentation     This is a sample Robot Framework test file with no actions

*** Test Cases ***
Empty Test
    [Documentation]    This test case does nothing
    No Operation
`;
          await mkdir(e2eFolderPath, { recursive: true });
          await writeFile(robotSampleFilePath, robotSampleFileContent);
          break;
        }
        default:
          logger.warn(
            `Unhandled Python E2E runner: ${normalizedOptions.e2eTestRunner}`
          );
      }
    }

    runTasksInSerial(...endTasks);

    if (
      !(
        normalizedOptions.tags?.includes('JEST-TEST') ||
        normalizedOptions.tags?.includes('E2E-TEST')
      )
    ) {
      logger.info(
        `Project ${projectName} created at ${tree.root}/${projectRoot}`
      );
    }

    // Special case where we don't want to run `npm install` in a jest test because it won't work
    if (!normalizedOptions.tags?.includes('JEST-TEST')) {
      installPackagesTask(tree);
    }
  };
}

export default pythonGenerator;
