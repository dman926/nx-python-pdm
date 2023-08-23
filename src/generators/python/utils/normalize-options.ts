import {
  names,
  getWorkspaceLayout,
  offsetFromRoot,
  joinPathFragments,
  type Tree,
} from '@nx/devkit';
import type { PythonGeneratorSchema, UnitTestRunner } from '../schema';

export interface NormalizedOptions extends PythonGeneratorSchema {
  unitTestRunner: UnitTestRunner;
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  rootOffset: string;
  parsedTags: string[];
}

export const normalizeOptions = (
  tree: Tree,
  options: PythonGeneratorSchema
): NormalizedOptions => {
  const { appsDir, libsDir } = getWorkspaceLayout(tree);
  const { name, projectType, directory, tags, unitTestRunner } = options;

  const generatedNames = names(name);
  const projectDirectory = directory
    ? joinPathFragments(directory, generatedNames.fileName)
    : generatedNames.fileName;
  // Replace forward slashes with dashes
  const projectName = projectDirectory.replace(/\//g, '-');
  const projectRoot = `${
    projectType === 'application' ? appsDir : libsDir
  }/${projectDirectory}`;
  const rootOffset = offsetFromRoot(projectRoot);
  // Split by commas, trim whitespace, or empty array if no tags
  const parsedTags = tags?.split(',').map((s) => s.trim()) || [];
  return {
    ...options,
    // Apply default
    unitTestRunner: unitTestRunner || 'unittest',
    projectName,
    projectRoot,
    projectDirectory,
    rootOffset,
    parsedTags,
  };
};

export default normalizeOptions;
