import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  names,
  getWorkspaceLayout,
  Tree,
  offsetFromRoot,
  joinPathFragments,
  ProjectType,
  TargetConfiguration,
  ensurePackage,
  NX_VERSION,
  runTasksInSerial,
} from '@nx/devkit';
import { Linter as nxLinter } from '@nx/linter';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { BuildBackend, PythonGeneratorSchema } from './schema';
import { dummyFiles } from './dummyFiles';
import { pdm } from '../../pdm/pdm';

interface NormalizedOptions extends PythonGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  rootOffset: string;
  parsedTags: string[];
}

type EndTask = () => void | Promise<void>;

const normalizeOptions = (
  tree: Tree,
  options: PythonGeneratorSchema
): NormalizedOptions => {
  const { appsDir, libsDir } = getWorkspaceLayout(tree);
  const { name, projectType, directory, tags } = options;

  const generatedNames = names(name);
  const projectDirectory = directory
    ? joinPathFragments(directory, generatedNames.fileName)
    : generatedNames.fileName;
  const projectName = projectDirectory.replace(/\//g, '-');
  const projectRoot = `${
    projectType === 'application' ? appsDir : libsDir
  }/${projectDirectory}`;
  const rootOffset = offsetFromRoot(projectRoot);
  const parsedTags = tags?.split(',').map((s) => s.trim()) || [];
  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    rootOffset,
    parsedTags,
  };
};

const getTargets = ({
  rootOffset,
  projectDirectory,
  unitTestRunner,
  linter,
  typeChecker,
}: NormalizedOptions) => {
  const executor = 'nx-python-pdm:pdm';
  let testCommand: string;
  if (unitTestRunner === 'unittest') {
    testCommand = 'run unittest discover .';
  } else if (unitTestRunner === 'pytest') {
    testCommand = 'run pytest';
  } else if (unitTestRunner === 'pyre') {
    testCommand = 'run pyre';
  }
  const targets: { [targetName: string]: TargetConfiguration<unknown> } = {
    build: {
      executor,
      options: {
        command: `build --dest=${rootOffset}dist/${projectDirectory}`,
      },
    },
    test: {
      executor,
      options: {
        command: testCommand,
      },
    },
  };

  if (linter && linter !== 'none') {
    let lintCommand: string;
    if (linter === 'pylint') {
      lintCommand = 'run pylint ./**/*.py';
    } else if (linter === 'flake8') {
      lintCommand = 'run flake8';
    } else if (linter == 'pycodestyle') {
      lintCommand = 'run pycodestyle ./**/*.py';
    } else if (linter == 'pylama') {
      lintCommand = 'run pylama';
    } else if (linter == 'mypy') {
      lintCommand = 'run mypy ./**/*.py';
    }
    targets.lint = {
      executor,
      options: {
        command: lintCommand,
      },
    };
  }

  if (typeChecker && typeChecker !== 'none') {
    let typeCheckCommand: string;
    if (typeChecker === 'mypy') {
      typeCheckCommand = 'run mypy ./**/*.py';
    } else if (typeChecker === 'pyright') {
      typeCheckCommand = 'run pyright';
    } else if (typeChecker === 'pyre') {
      typeCheckCommand = 'run pyre';
    }
    targets.typeCheck = {
      executor,
      options: {
        command: typeCheckCommand,
      },
    };
  }

  targets.pdm = {
    executor,
  };

  return targets;
};

export const pdmInitCommand = (
  projectType: ProjectType,
  buildBackend?: BuildBackend
) => {
  let pdmInitCommand = 'init --non-interactive';
  if (projectType === 'library') {
    pdmInitCommand += ' --lib';
  }
  if (buildBackend) {
    pdmInitCommand += ` --backend=${buildBackend}`;
  }
  return pdmInitCommand;
};

export const pdmInstallCommand = ({
  linter,
  typeChecker,
  unitTestRunner,
  e2eTestRunner,
}: NormalizedOptions) => {
  let pdmInstallCommand = `add -d`;
  if (unitTestRunner !== 'unittest') {
    pdmInstallCommand += ` ${unitTestRunner}`;
  }
  // !pdmInstallCommand.includes(`...`) is a safeguard against runners being included
  // multiple times due to shared responsibilities with certain packages.
  if (
    linter &&
    linter !== 'none' &&
    !pdmInstallCommand.includes(` ${linter}`)
  ) {
    pdmInstallCommand += ` ${linter}`;
  }
  if (
    typeChecker &&
    typeChecker !== 'none' &&
    !pdmInstallCommand.includes(` ${typeChecker}`)
  ) {
    pdmInstallCommand += ` ${typeChecker}`;
  }
  // includes is not strictly neccessary. Sanity check
  if (
    e2eTestRunner === 'robot' &&
    !pdmInstallCommand.includes(' robotframework')
  ) {
    pdmInstallCommand += 'robotframework';
  }
  return pdmInstallCommand;
};

// Only Cypress calls this function for now
// as all others do not require any extra tasks.
const addE2E = async (
  tree: Tree,
  { projectName }: NormalizedOptions
): Promise<EndTask> => {
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
  const endTasks: EndTask[] = [];
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

  dummyFiles.forEach((dummyFile) => {
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
    endTasks.unshift(async () => {
      const cwd = joinPathFragments(tree.root, projectRoot);
      dummyFiles.forEach((dummyFile) => {
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

      await pdm(pdmInstallCommand(normalizedOptions), {
        cwd,
      });
    });
    
    runTasksInSerial(...endTasks);
  };
}

export default pythonGenerator;
