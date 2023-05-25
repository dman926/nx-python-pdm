import type { ProjectType } from '@nx/devkit';

type BuildBackend = 'pdm-backend' | 'setuptools' | 'flot' | 'hatchling';

export interface PythonGeneratorSchema {
  name: string;
  projectType: ProjectType;
  buildBackend?: BuildBackend;
  directory?: string;
  tags?: string;
}
