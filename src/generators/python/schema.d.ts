import type { ProjectType } from '@nx/devkit';

type Optional<T> = 'none' | T;

// Technically there is no 'none' option because `pdm-backend` will always be default
export type BuildBackend = 'pdm-backend' | 'setuptools' | 'flot' | 'hatchling';
export type E2ETestRunner = Optional<'cypress' | 'playwright' | 'robotframework'>;
export type Linter = Optional<
  'pylint' | 'flake8' | 'pycodestyle' | 'pylama' | 'mypy'
>;
export type TypeChecker = Optional<'mypy' | 'pyright' | 'pyre-check'>;
// Same applies to unit test runner since `unittest` is part of the standard library
export type UnitTestRunner = 'unittest' | 'pytest';
export type E2EBundler = 'webpack' | 'vite' | 'none';

export interface PythonGeneratorSchema {
  // Name of the project.
  name: string;
  // Application or Library.
  projectType: ProjectType;
  // Override the default build backend.
  buildBackend?: BuildBackend;
  // Optionally add and initialize an project for an E2E runner. Default 'none'
  e2eTestRunner?: E2ETestRunner;
  // Optionally add and initialize a linter. Default 'none'
  linter?: Linter;
  // Optionally add and initialize a type checker. Default 'none'
  typeChecker?: TypeChecker;
  // Optionally add and initialize a unit test runner. Default 'unittest'
  unitTestRunner?: UnitTestRunner;
  // A diretory where the project is placed.
  directory?: string;
  // A directory where the E2E project is placed, Only used when separateE2eProject is used.
  e2eDirectory?: string;
  // Generate a separate E2E project.
  separateE2eProject?: boolean;
  // Set the bundler to use for cypress or webpack.
  e2eBundler?: E2EBundler;
  // Add tags to the project (used for linting).
  tags?: string;
}
