import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit';

import { pythonGenerator, pdmInitCommand } from './generator';
import { PythonGeneratorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

const mockPdm = jest.mocked(pdm);

describe('python generator', () => {
  let tree: Tree;
  const options: PythonGeneratorSchema = {
    name: 'test',
    projectType: 'application',
  };

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
    const cwd = joinPathFragments(process.cwd(), options.name);
    expect(mockPdm).toBeCalledWith('rm pyproject.toml', { cwd, raw: true });
    expect(mockPdm).toBeCalledWith(pdmInitCommand(options.projectType), {
      cwd,
    });
  });
});
