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
import { pdm } from '../../pdm/pdm';

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
        executor: 'nx-python-pdm:pdm',
        dependsOn: ['sync'],
        options: {
          command: `run python setup.py bdist_wheel --bdist-dir=${rootOffset}build/${projectDirectory}`,
        },
      },
      sync: {
        executor: 'nx-python-pdm:pdm',
        options: {
          command: 'run pdm-setup sync',
        },
      },
      pdm: {
        executor: 'nx-python-pdm:pdm',
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
    await pdm('rm Pipfile Pipfile.lock', { cwd, raw: true });
    await pdm('install --dev wheel setuptools pdm-setup', {
      cwd,
    });
    await formatFiles(tree);
  };
}
