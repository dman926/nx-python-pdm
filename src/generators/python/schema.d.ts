import type { ProjectType } from '@nx/devkit';

type Optional<T> = 'none' | T;

export type Linter = Optional<
  'pylint' | 'flake8' | 'pycodestyle' | 'pylama' | 'mypy'
>;
export type TypeChecker = Optional<'mypy' | 'pyright' | 'pyre'>;
// Technically there is no 'none' option because `unittest` is part of the standard library
export type UnitTestRunner = 'unittest' | 'pytest';
export type E2ETestRunner = Optional<'cypress' | 'robotframework'>;
// Same applies to the build backend since `pdm-backend` will always be default
export type BuildBackend = 'pdm-backend' | 'setuptools' | 'flot' | 'hatchling';

// TODO: Add option to scaffold new project for E2E for non-node e2e runners (robot) (?)
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
