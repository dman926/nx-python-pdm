import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  logger,
} from '@nrwl/devkit';
import { sync as commandExistsSync } from 'command-exists';
import * as path from 'path';
import { appendFileSync } from 'fs';
import { execSync } from 'child_process';
// eslint-disable-next-line import/extensions
import { ApplicationGeneratorSchema } from './schema';
import { runPipenvCommand } from '../../utils';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(/\//g, '-');
  const projectRoot =
    options.directory ||
    `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

// eslint-disable-next-line func-names
export default async function (
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  // eslint-disable-next-line @typescript-eslint/dot-notation
  const inGithubActions = process.env['GITHUB_ACTIONS'] === 'true';
  // See if pipenv, setuptools, wheel, and watchman (if they want a type checker) are installed
  const exitFlag = {
    soft: false,
    hard: false,
  };
  if (!inGithubActions) {
    const cmds = [];
    if (options.typeChecker !== 'none') {
      cmds.push('watchman');
    }
    cmds.forEach((cmd) => {
      if (!commandExistsSync(cmd)) {
        logger.warn(`${cmd} missing from PATH`);
        exitFlag.soft = true;
        exitFlag.hard = true;
      }
    });
    if (exitFlag.soft) {
      logger.error(
        'Please install the above programs with your OS package manager'
      );
      exitFlag.soft = false;
    }
    ['setuptools', 'wheel', 'pipenv'].forEach((cmd) => {
      try {
        execSync(`python3 -c "import ${cmd}"`);
      } catch (e) {
        logger.warn(`${cmd} not in python environment`);
        exitFlag.soft = true;
        exitFlag.hard = true;
      }
    });
    if (exitFlag.soft) {
      logger.error('Please install the above packages with pip');
    }
    if (exitFlag.hard) {
      return () => {};
    }
  }
  const normalizedOptions = normalizeOptions(tree, options);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@daidarabotchi/nx-python:build',
      },
      lint: {
        executor: '@daidarabotchi/nx-python:lint',
      },
      pipenv: {
        executor: '@daidarabotchi/nx-python:pipenv',
      },
      serve: {
        executor: '@daidarabotchi/nx-python:serve',
      },
      test: {
        executor: '@daidarabotchi/nx-python:test',
      },
      clean: {
        executor: '@daidarabotchi/nx-python:pipenv',
        options: {
          command: '--rm',
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
  return () => {
    const context = {
      workspace: {
        projects: {
          [normalizedOptions.projectName]: {
            root: normalizedOptions.projectRoot,
          },
        },
      },
      projectName: normalizedOptions.projectName,
    };
    const cwd = `${process.cwd()}/${
      context.workspace.projects[context.projectName].root
    }`;

    if (!inGithubActions) {
      // pipenv install frequently used dependencies (pipenv-setup [DEV]) (auto creates environment)
      // pipenv install a code formatter (nothing, black, autopep8) (DEV) (optional)
      // pipenv install a test runner (nothing for unittest, robot, pytest) (DEV) (optional)
      // pipenv install a type checker (mypi, pyright, pytype, pyre) (DEV) (optional)
      const packages = ['setuptools', 'wheel'];
      if (normalizedOptions.formatter !== 'none') {
        packages.push(normalizedOptions.formatter);
      }
      if (normalizedOptions.testRunner !== 'none') {
        let testRunnerPackage: string;
        if (normalizedOptions.testRunner === 'robot') {
          testRunnerPackage = 'robotframework';
        } else {
          testRunnerPackage = normalizedOptions.testRunner;
        }
        packages.push(testRunnerPackage);
      }
      if (normalizedOptions.typeChecker !== 'none') {
        let typeCheckerPackage: string;
        if (normalizedOptions.typeChecker === 'pyre') {
          typeCheckerPackage = 'pyre-check';
        } else {
          typeCheckerPackage = normalizedOptions.typeChecker;
        }
        packages.push(typeCheckerPackage);
      }
      logger.info(`Executing command: pipenv install`);
      execSync('pipenv install', { cwd });
      if (normalizedOptions.allowPre) {
        runPipenvCommand(context, 'install --pre');
      }

      const format = normalizedOptions.formatter !== 'none';
      let formatCmd: string;
      const lint = normalizedOptions.typeChecker !== 'none';
      let lintCmd: string;
      let testCmd: string;

      if (format) {
        switch (normalizedOptions.formatter) {
          case 'autopep8':
            formatCmd = 'autopep8 --in-place --recursive .';
            break;
          case 'black':
            formatCmd = 'black .';
            break;
          default:
        }
      }
      if (lint) {
        switch (normalizedOptions.typeChecker) {
          case 'mypy':
            lintCmd = 'mypy tests';
            break;
          case 'pyright':
            lintCmd = 'pyright --watch .';
            break;
          case 'pytype':
            lintCmd = 'pytype .';
            break;
          case 'pyre':
            lintCmd = 'pyre';
            break;
          default:
        }
      }
      switch (normalizedOptions.testRunner) {
        case 'none':
          testCmd = 'unittest discover -s ./ -p';
          break;
        case 'pytest':
          testCmd = 'pytest';
          break;
        case 'robot':
          testCmd = 'robot .';
          break;
        default:
      }
      // const pipfile = readFileSync(`${cwd}/Pipfile`).toString().split('\n');
      const commands = [
        '[scripts]',
        `build = "setup.py sdist bdist_wheel --dist-dir ../../dist/${normalizedOptions.projectName}"`,
      ];
      if (format) {
        commands.push(`format = "python3 -m ${formatCmd}"`);
      }
      if (lint) {
        commands.push(`lint = "python3 -m ${lintCmd}"`);
      }
      commands.push(
        `test = "python3 -m ${testCmd}"`,
        'serve = "python3 main.py"'
      );
      appendFileSync(`${cwd}/Pipfile`, `\n${commands.join('\n')}\n`);
      runPipenvCommand(context, `install --dev ${packages.join(' ')}`);
    }
  };
}
