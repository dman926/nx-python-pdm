import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';
import {
  writeFileSync,
  PathOrFileDescriptor,
  WriteFileOptions,
  PathLike,
  RmOptions,
} from 'fs';

import { pythonGenerator, pdmInitCommand } from './generator';
import { PythonGeneratorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

jest.mock('fs', () => {
  const mod = jest.requireActual('fs');
  const basename = jest.requireActual('path').basename;
  const dummyFiles = jest.requireActual('./dummyFiles').dummyFiles;
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
        const filename = basename(path.toString());
        if (dummyFiles.includes(filename)) {
          return '[tool.pdm]\n\n[project]\nname = ""\nversion = ""\ndescription = ""\nauthors = []\n';
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
        const filename = basename(file.toString());
        if (dummyFiles.includes(filename)) {
          return;
        } else {
          return mod.writeFileSync(file, data, options);
        }
      }
    ),
    rmSync: jest.fn((path: PathLike, options?: RmOptions) => {
      const filename = basename(path.toString());
      if (dummyFiles.includes(filename)) {
        return;
      } else {
        return mod.rmSync(path, options);
      }
    }),
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
  const expectedPyprojectToml = `[tool.pdm]\n\n[project]\nname = "${options.name}"\nversion = "0.1.0"\ndescription = ""\nauthors = [\n    {name = "Your Name", email = "your@email.com"},\n]\n`;
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
