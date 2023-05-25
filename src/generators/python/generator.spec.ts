import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';
import { writeFileSync, PathOrFileDescriptor, WriteFileOptions } from 'fs';

import { pythonGenerator, pdmInitCommand } from './generator';
import { PythonGeneratorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

jest.mock('fs', () => {
  const mod = jest.requireActual('fs');
  return {
    ...mod,
    readFileSync: jest.fn(
      (
        path: PathOrFileDescriptor,
        options?: {
          encoding?: null | undefined;
          flag?: string | undefined;
        } | null
      ) => {
        if (path.toString().includes('pyproject.toml')) {
          return '[tool.pdm]\n\n[project]\nname = ""\nversion = ""\ndescription = ""\n';
        } else {
          return mod.readFileSync(path, options);
        }
      }
    ),
    writeFileSync: jest.fn(
      (
        file: PathOrFileDescriptor,
        data: string | NodeJS.ArrayBufferView,
        options?: WriteFileOptions
      ) => {
        if (file.toString().includes('pyproject.toml')) {
          return;
        } else {
          return mod.writeFileSync(file, data, options);
        }
      }
    ),
  };
});

const mockPdm = jest.mocked(pdm);
const mockWriteFileSync = jest.mocked(writeFileSync);

describe('python generator', () => {
  let tree: Tree;
  const options: PythonGeneratorSchema = {
    name: 'test',
    projectType: 'application',
  };
  const expectedPyprojectToml = `[tool.pdm]\n\n[project]\nname = "${options.name}"\nversion = "0.0.1"\ndescription = ""\n`;
  const cwd = '/virtual/test';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run successfully', async () => {
    await pythonGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should return a function that configures pdm', async () => {
    const outputFn = await pythonGenerator(tree, options);
    await outputFn();
    // Inits PDM
    expect(mockPdm).toBeCalledWith(pdmInitCommand(options.projectType), {
      cwd,
    });
    // Updates project name and version
    expect(mockWriteFileSync).toBeCalledWith(
      joinPathFragments(cwd, 'pyproject.toml'),
      expectedPyprojectToml
    );
  });
});
