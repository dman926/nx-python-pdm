import type { ProjectType } from '@nx/devkit';

type BuildBackend = 'pdm-backend' | 'setuptools' | 'flot' | 'hatchling';

export interface PythonGeneratorSchema {
  // Name of the project.
  name: string;
  // Application or Library.
  projectType: ProjectType;
  // Override the default build backend.
  buildBackend?: BuildBackend;
  // A diretory where the project is placed.
  directory?: string;
  // Add tags to the project (used for linting).
  tags?: string;
}
