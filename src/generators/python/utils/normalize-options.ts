import { type Tree, offsetFromRoot } from '@nx/devkit';
import {
  type ProjectNameAndRootFormat,
  determineProjectNameAndRootOptions,
} from '@nx/devkit/src/generators/project-name-and-root-utils';
import type {
  BuildBackend,
  E2EBundler,
  E2ETestRunner,
  Linter,
  PythonGeneratorSchema,
  TypeChecker,
  UnitTestRunner,
} from '../schema';

export interface NormalizedOptions extends PythonGeneratorSchema {
  buildBackend: BuildBackend;
  e2eTestRunner: E2ETestRunner;
  linter: Linter;
  typeChecker: TypeChecker;
  unitTestRunner: UnitTestRunner;
  e2eBundler: E2EBundler;
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
    buildBackend,
    e2eTestRunner,
    linter,
    typeChecker,
    unitTestRunner,
    separateE2eProject,
    e2eBundler,
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
    buildBackend: buildBackend || 'pdm-backend',
    e2eTestRunner: e2eTestRunner || 'none',
    linter: linter || 'none',
    typeChecker: typeChecker || 'none',
    unitTestRunner: unitTestRunner || 'unittest',
    e2eBundler: e2eBundler || 'vite',
    ...generatedOptions,
    rootOffset,
    parsedTags,
    separateE2eProject:
      separateE2eProject === undefined ? true : separateE2eProject,
  };
};

export default normalizeOptions;
