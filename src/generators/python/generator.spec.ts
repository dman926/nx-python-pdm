import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { PythonGeneratorSchema } from './schema';
import { pipenv } from '../../pipenv/pipenv';

// Mock the pipenv function
jest.mock('../../pipenv/pipenv', () => ({
  pipenv: jest.fn(() => Promise.resolve('pipenv output')),
}));

const mockPipenv = jest.mocked(pipenv);

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
    expect(mockPipenv).toBeCalledWith(
      'install --dev wheel setuptools pipenv-setup'
    );
  });
});
