import type { ProjectType } from '@nx/devkit';

export interface PythonGeneratorSchema {
  name: string;
  projectType: ProjectType;
  directory?: string;
  tags?: string;
}
