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
import { readFileSync, writeFileSync, rmSync } from 'fs';
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

  // if (process.env.NX_DRY_RUN === 'true') {
  const dummyFiles = ['pyproject.toml', '.venv', '.pdm-python', '.gitignore'];
  dummyFiles.forEach((dummyFile) => {
    tree.write(joinPathFragments(projectRoot, dummyFile), '');
  })
  tree.write(joinPathFragments(projectRoot, '.venv'), '');
  tree.write(joinPathFragments(projectRoot, '.pdm-python'), '');
  tree.write(joinPathFragments(projectRoot, '.gitignore'), '');

  await formatFiles(tree);
  
  return async () => {
    const cwd = joinPathFragments(tree.root, projectRoot);
    dummyFiles.forEach((dummyFile) => {
      rmSync(joinPathFragments(cwd, dummyFile));
    });

    await pdm(pdmInitCommand(projectType, buildBackend), {
      cwd,
    });
    
    // Add project name and version as the minimum needed to build
    // PDM automatically gives these values for libraries, but applications do not for some reason
    const tomlPath = joinPathFragments(cwd, 'pyproject.toml');
    const pyprojectContent = readFileSync(tomlPath)
      .toString()
      // Add the project name
      .replace(/(\bname\s?=\s?)("")/g, `$1"${projectName}"`)
      // Add the version
      .replace(/(\bversion\s?=\s?)("")/g, '$1"0.1.0"');
    writeFileSync(tomlPath, pyprojectContent);
  };
}

export default pythonGenerator;
