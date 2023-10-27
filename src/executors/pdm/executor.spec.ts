import { ExecutorContext } from '@nx/devkit';
import { pdmExecutorSchema } from './schema';
import runpdm from './executor';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

const mockpdm = jest.mocked(pdm);

const getOptions = (options: pdmExecutorSchema): pdmExecutorSchema => ({
  ...options,
  quiet: true,
});

const mockContext: ExecutorContext = {
  root: '',
  cwd: '',
  isVerbose: false,
  projectName: 'my-project',
  projectsConfigurations: {
    projects: {
      'my-project': {
        root: 'path/to/project',
      },
    },
    version: 2,
  },
};

describe('pdm Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call pdm with the command and project root', async () => {
    const options = getOptions({
      command: 'install',
    });
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      quiet: true,
      raw: undefined,
    });
  });

  it('should call pdm with the provided cwd if specified', async () => {
    const options = getOptions({
      command: 'run',
      cwd: '/path/to/cwd',
    });
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('run', {
      cwd: '/path/to/cwd',
      quiet: true,
      raw: undefined,
    });
  });

  it('should call pdm with the "raw" option if specified', async () => {
    const options = getOptions({
      command: 'install',
      raw: true,
    });
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      quiet: true,
      raw: true,
    });
  });

  it('should return an object with "success" set to true if pdm succeeds', async () => {
    mockpdm.mockReturnValueOnce({
      success: true,
      stdout: Buffer.from('pdm output'),
    });
    const options = getOptions({
      command: 'install',
    });
    const result = await runpdm(options, mockContext);
    expect(result.success).toBe(true);
  });

  it('should return an object with "success" set to false if pdm fails', async () => {
    const error = { success: false };
    mockpdm.mockReturnValueOnce(error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const options = getOptions({
      command: 'install',
    });
    const result = await runpdm(options, mockContext);
    expect(result.success).toBe(false);
  });
});
