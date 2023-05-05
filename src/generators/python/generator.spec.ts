import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { PythonGeneratorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

const mockpdm = jest.mocked(pdm);

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
    await generator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });

  it('should return a function that configures pdm', async () => {
    const outputFn = jest.fn(await generator(tree, options));
    await outputFn();
    expect(mockpdm).toBeCalledWith('rm Pipfile Pipfile.lock', { raw: true });
    expect(mockpdm).toBeCalledWith(
      'install --dev wheel setuptools pdm-setup'
    );
  });
});
