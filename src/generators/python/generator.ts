import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  names,
  getWorkspaceLayout,
  Tree,
  offsetFromRoot,
  joinPathFragments,
} from '@nx/devkit';
import { PythonGeneratorSchema } from './schema';
import { pipenv } from '../../pipenv/pipenv';

interface NormalizedOptions extends PythonGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  rootOffset: string;
  parsedTags: string[];
}

const normalizeOptions = (
  tree: Tree,
  options: PythonGeneratorSchema
): NormalizedOptions => {
  const { appsDir, libsDir } = getWorkspaceLayout(tree);
  const { name, projectType, directory, tags } = options;

  const generatedNames = names(name);
  const projectDirectory = directory
    ? `${names(directory).fileName}/${generatedNames.fileName}`
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

export default async function (tree: Tree, options: PythonGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const {
    parsedTags,
    projectDirectory,
    projectName,
    projectRoot,
    projectType,
    rootOffset,
  } = normalizedOptions;
  addProjectConfiguration(tree, projectName, {
    root: projectRoot,
    projectType: projectType,
    sourceRoot: projectRoot,
    targets: {
      build: {
        executor: 'nx-pipenv:pipenv',
        dependsOn: ['sync'],
        options: {
          command: `run python setup.py bdist_wheel --bdist-dir=${rootOffset}build/${projectDirectory}`,
        },
      },
      sync: {
        executor: 'nx-pipenv:pipenv',
        options: {
          command: 'run pipenv-setup sync',
        },
      },
      pipenv: {
        executor: 'nx-pipenv:pipenv',
      },
    },
    tags: parsedTags,
  });

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    options
  );

  return async () => {
    const cwd = joinPathFragments(process.cwd(), projectRoot);
    await pipenv('rm Pipfile Pipfile.lock', { cwd, raw: true });
    await pipenv('install --dev wheel setuptools pipenv-setup', {
      cwd,
    });
    await formatFiles(tree);
  };
}
