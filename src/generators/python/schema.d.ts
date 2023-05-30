import type { ProjectType } from '@nx/devkit';

export type Linter =
  | 'none'
  | 'pylint'
  | 'flake8'
  | 'pycodestyle'
  | 'pylama'
  | 'mypy';
export type TypeChecker = 'none' | 'mypy' | 'pyright' | 'pyre';
export type UnitTestRunner = 'unittest' | 'pytest' | 'pyre';
export type E2ETestRunner = 'none' | 'cypress' | 'robot';
export type BuildBackend = 'pdm-backend' | 'setuptools' | 'flot' | 'hatchling';

export interface PythonGeneratorSchema {
  // Name of the project.
  name: string;
  // Application or Library.
  projectType: ProjectType;
  // Optionally add and initialize a linter. Default 'none'
  linter?: Linter;
  // Optionally add and initialize a type checker. Default 'none'
  typeChecker?: TypeChecker;
  // Optionally add and initialize a unit test runner. Default 'unittest'
  unitTestRunner?: UnitTestRunner;
  // Optionally add and initialize an project for an E2E runner. Default 'none'
  e2eTestRunner?: E2ETestRunner;
  // Override the default build backend.
  buildBackend?: BuildBackend;
  // A diretory where the project is placed.
  directory?: string;
  // Add tags to the project (used for linting).
  tags?: string;
}
