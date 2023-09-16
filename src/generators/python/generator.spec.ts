import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  type Tree,
  joinPathFragments,
  readProjectConfiguration,
} from '@nx/devkit';
import { writeFile } from 'fs/promises';

import { pythonGenerator, pdmInitCommand } from './generator';
import type {
  // E2ETestRunner,
  Linter,
  PythonGeneratorSchema,
  TypeChecker,
  UnitTestRunner,
} from './schema';
import { pdm } from '../../pdm/pdm';
import type { OpenMode } from 'fs';
import type { Abortable } from 'events';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

jest.mock('fs/promises', () => {
  const mod = jest.requireActual<typeof import('fs/promises')>('fs/promises');
  const basename = jest.requireActual('path').basename;
  const dummyFiles = jest.requireActual('./dummyFiles').dummyFiles;
  return {
    ...mod,
    readFile: jest.fn(
      (
        path: Parameters<typeof mod.readFile>[0],
        // Options needs type declared directly since typescript gives the wrong shape
        options?:
          | ({
              encoding?: null | undefined;
              flag?: OpenMode | undefined;
            } & Abortable)
          | null
      ): Promise<string | Buffer> => {
        const filename = basename(path.toString());
        if (dummyFiles.includes(filename)) {
          let out: string | Buffer =
            '[tool.pdm]\n\n[project]\nname = ""\nversion = ""\ndescription = ""\nauthors = [\n    {name = "", email = ""},\n]\n';
          if (!options?.encoding) {
            out = Buffer.from(out);
          }
          return Promise.resolve(out);
        } else {
          return mod.readFile(path, options);
        }
      }
    ),
    writeFile: jest.fn(
      (
        file: Parameters<typeof mod.writeFile>[0],
        data: Parameters<typeof mod.writeFile>[1],
        options?: Parameters<typeof mod.writeFile>[2]
      ): ReturnType<typeof mod.writeFile> => {
        const filename = basename(file.toString());
        if (dummyFiles.includes(filename)) {
          return Promise.resolve();
        } else {
          return mod.writeFile(file, data, options);
        }
      }
    ),
    rm: jest.fn(
      (
        path: Parameters<typeof mod.rm>[0],
        options?: Parameters<typeof mod.rm>[1]
      ): ReturnType<typeof mod.rm> => {
        const filename = basename(path.toString());
        if (dummyFiles.includes(filename)) {
          return Promise.resolve();
        } else {
          return mod.rm(path, options);
        }
      }
    ),
  };
});

const mockPdm = jest.mocked(pdm);
const mockWriteFile = jest.mocked(writeFile);

const linters: { name: Linter; command?: string }[] = [
  { name: 'none' },
  {
    name: 'pylint',
    command: 'run pylint ./**/*.py --ignore=.venv,__pycache__',
  },
  { name: 'flake8', command: 'run flake8 --exclude .venv,__pycache__' },
  {
    name: 'pycodestyle',
    command: 'run pycodestyle ./**/*.py --exclude=.venv,__pycache__',
  },
  { name: 'pylama', command: 'run pylama --skip .venv/**,__pycache__/**' },
  { name: 'mypy', command: 'run mypy ./**/*.py --exclude .venv,__pycache__' },
];
const typeCheckers: { name: TypeChecker; command?: string }[] = [
  { name: 'none' },
  { name: 'mypy', command: 'run mypy ./**/*.py' },
  { name: 'pyright', command: 'run pyright' },
  { name: 'pyre-check', command: 'run pyre' },
];
const unitTestRunners: { name: UnitTestRunner; command?: string }[] = [
  { name: 'unittest', command: 'run python -m unittest discover .' },
  { name: 'pytest', command: 'run pytest .' },
];
// const e2eTestRunners: { name: E2ETestRunner; command?: string }[] = [
//   { name: 'none' },
//   { name: 'cypress', command: '' },
//   { name: 'robot', command: '' },
// ];

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
    expect(mockWriteFile).toBeCalledWith(
      joinPathFragments(cwd, 'pyproject.toml'),
      expectedPyprojectToml
    );
  });

  it('should add a target for test with the correctly specified unit test runner', async () => {
    for (const runner of unitTestRunners) {
      tree = createTreeWithEmptyWorkspace();
      const optionsWithAdditionalTarget: PythonGeneratorSchema = {
        ...options,
        unitTestRunner: runner.name,
      };
      await pythonGenerator(tree, optionsWithAdditionalTarget);
      const config = readProjectConfiguration(tree, 'test');
      expect(config.targets?.test).toBeDefined();
      expect(config.targets?.test.options.command).toContain(runner.command);
    }
  });

  it('should add a target for lint with the correctly specified linter', async () => {
    for (const linter of linters) {
      tree = createTreeWithEmptyWorkspace();
      const optionsWithAdditionalTarget: PythonGeneratorSchema = {
        ...options,
        linter: linter.name,
      };
      await pythonGenerator(tree, optionsWithAdditionalTarget);
      const config = readProjectConfiguration(tree, 'test');
      if (linter.name !== 'none') {
        expect(config.targets?.lint).toBeDefined();
        expect(config.targets?.lint.options.command).toContain(linter.command);
      } else {
        // When 'none' is specified, no lint target is added
        expect(config.targets?.lint).not.toBeDefined();
      }
    }
  });

  it('should add a target for type checking with the correctly specified type check runner', async () => {
    for (const runner of typeCheckers) {
      tree = createTreeWithEmptyWorkspace();
      const optionsWithAdditionalTarget: PythonGeneratorSchema = {
        ...options,
        typeChecker: runner.name,
      };
      await pythonGenerator(tree, optionsWithAdditionalTarget);
      const config = readProjectConfiguration(tree, 'test');
      if (runner.name !== 'none') {
        expect(config.targets?.typeCheck).toBeDefined();
        expect(config.targets?.typeCheck.options.command).toContain(
          runner.command
        );
      } else {
        // When 'none' is specified, no typeCheck target is added
        expect(config.targets?.typeCheck).not.toBeDefined();
      }
    }
  });

  // Skipping for now to merge to main. They technically get added. But they need to be tested.
  it.skip('should add E2E configurations properly', () => {
    expect('E2E TESTS NOT ADDED!').toBeFalsy();
  });
});
