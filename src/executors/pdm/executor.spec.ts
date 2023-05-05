import { ExecutorContext } from '@nx/devkit';
import { pdmExecutorSchema } from './schema';
import runpdm from './executor';
import { pdm } from '../../pdm/pdm';

// Mock the pdm function
jest.mock('../../pdm/pdm', () => ({
  pdm: jest.fn(() => Promise.resolve('pdm output')),
}));

const mockpdm = jest.mocked(pdm);

const mockContext: ExecutorContext = {
  root: '',
  cwd: '',
  isVerbose: false,
  projectName: 'my-project',
  projectsConfigurations: {
    projects: {
      'my-project': {
        root: '/path/to/project',
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
    const options: pdmExecutorSchema = { command: 'install', raw: false };
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      raw: false,
    });
  });

  it('should call pdm with the provided cwd if specified', async () => {
    const options: pdmExecutorSchema = {
      command: 'run',
      cwd: '/path/to/cwd',
      raw: false,
    };
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('run', {
      cwd: '/path/to/cwd',
      raw: false,
    });
  });

  it('should call pdm with the "raw" option if specified', async () => {
    const options: pdmExecutorSchema = { command: 'install', raw: true };
    await runpdm(options, mockContext);
    expect(mockpdm).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      raw: true,
    });
  });

  it('should return an object with "success" set to true if pdm succeeds', async () => {
    mockpdm.mockResolvedValueOnce('pdm output');
    const options: pdmExecutorSchema = { command: 'install', raw: false };
    const result = await runpdm(options, mockContext);
    expect(result.success).toBe(true);
  });

  it('should return an object with "success" set to false if pdm fails', async () => {
    const mockConsoleError = jest.fn();
    jest.spyOn(console, 'error').mockImplementationOnce(mockConsoleError);

    const error = new Error('pdm error');
    mockpdm.mockRejectedValueOnce(error);
    const options: pdmExecutorSchema = { command: 'install', raw: false };
    const result = await runpdm(options, mockContext);
    expect(result.success).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(error);

    jest.spyOn(console, 'error').mockRestore();
  });
});
