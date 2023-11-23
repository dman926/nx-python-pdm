import { type Tree, offsetFromRoot } from '@nx/devkit';
import {
  ProjectNameAndRootFormat,
  determineProjectNameAndRootOptions,
} from '@nx/devkit/src/generators/project-name-and-root-utils';
import type { PythonGeneratorSchema, UnitTestRunner } from '../schema';

export interface NormalizedOptions extends PythonGeneratorSchema {
  unitTestRunner: UnitTestRunner;
  projectName: string;
  projectRoot: string;
  names: {
    projectFileName: string;
    projectSimpleName: string;
  };
  importPath?: string;
  projectNameAndRootFormat: ProjectNameAndRootFormat;
  rootOffset: string;
  parsedTags: string[];
}

export const normalizeOptions = async (
  tree: Tree,
  options: PythonGeneratorSchema
): Promise<NormalizedOptions> => {
  const {
    name,
    projectType,
    directory,
    tags,
    unitTestRunner,
    separateE2eProject,
  } = options;
  const generatedOptions = await determineProjectNameAndRootOptions(tree, {
    name,
    projectType,
    callingGenerator: '@dman926/nx-python-pdm:python',
    directory,
    rootProject: false,
  });

  const rootOffset = offsetFromRoot(generatedOptions.projectRoot);
  // Split by commas, trim whitespace, or empty array if no tags
  const parsedTags = tags?.split(',').map((s) => s.trim()) || [];
  return {
    ...options,
    // Apply default
    unitTestRunner: unitTestRunner || 'unittest',
    ...generatedOptions,
    rootOffset,
    parsedTags,
    separateE2eProject:
      separateE2eProject === undefined ? true : separateE2eProject,
  };
};

export default normalizeOptions;
