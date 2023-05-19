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
} from '@nx/devkit';
import { BuildBackend, PythonGeneratorSchema } from './schema';
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

export async function pythonGenerator(
  tree: Tree,
  options: PythonGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const {
    buildBackend,
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
          command: `build --dest=${rootOffset}build/${projectDirectory}`,
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

    await pdm('rm pyproject.toml', { cwd, raw: true });
    await pdm(pdmInitCommand(projectType, buildBackend), {
      cwd,
    });
    await formatFiles(tree);
  };
}

export default pythonGenerator;
