import { ExecutorContext } from '@nx/devkit';
import { PipenvExecutorSchema } from './schema';
import runPipenv from './executor';
import { pipenv } from '../../pipenv/pipenv';

// Mock the pipenv function
jest.mock('../../pipenv/pipenv', () => ({
  pipenv: jest.fn(() => Promise.resolve('pipenv output')),
}));

const mockPipenv = jest.mocked(pipenv);

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

describe('Pipenv Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call pipenv with the command and project root', async () => {
    const options: PipenvExecutorSchema = { command: 'install', raw: false };
    await runPipenv(options, mockContext);
    expect(mockPipenv).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      raw: false,
    });
  });

  it('should call pipenv with the provided cwd if specified', async () => {
    const options: PipenvExecutorSchema = {
      command: 'run',
      cwd: '/path/to/cwd',
      raw: false,
    };
    await runPipenv(options, mockContext);
    expect(mockPipenv).toHaveBeenCalledWith('run', {
      cwd: '/path/to/cwd',
      raw: false,
    });
  });

  it('should call pipenv with the "raw" option if specified', async () => {
    const options: PipenvExecutorSchema = { command: 'install', raw: true };
    await runPipenv(options, mockContext);
    expect(mockPipenv).toHaveBeenCalledWith('install', {
      cwd: '/path/to/project',
      raw: true,
    });
  });

  it('should return an object with "success" set to true if pipenv succeeds', async () => {
    mockPipenv.mockResolvedValueOnce('pipenv output');
    const options: PipenvExecutorSchema = { command: 'install', raw: false };
    const result = await runPipenv(options, mockContext);
    expect(result.success).toBe(true);
  });

  it('should return an object with "success" set to false if pipenv fails', async () => {
    const mockConsoleError = jest.fn();
    jest.spyOn(console, 'error').mockImplementationOnce(mockConsoleError);

    const error = new Error('pipenv error');
    mockPipenv.mockRejectedValueOnce(error);
    const options: PipenvExecutorSchema = { command: 'install', raw: false };
    const result = await runPipenv(options, mockContext);
    expect(result.success).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(error);

    jest.spyOn(console, 'error').mockRestore();
  });
});
