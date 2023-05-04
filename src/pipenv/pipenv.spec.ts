import { promisify } from 'util';
import { exec } from 'child_process';
import { pipenv } from './pipenv';

// Mock the exec function to avoid actually executing commands during the tests.
jest.mock('util', () => ({
  promisify: jest.fn(),
}));

const mockPromisify = jest.mocked(promisify);

const mockStdout = 'mocked stdout';
const mockStderr = 'mocked stderr';

const success = jest.fn(() =>
  Promise.resolve({
    stdout: mockStdout,
    stderr: null,
  })
);

const fail1 = jest.fn(() =>
  Promise.resolve({
    stdout: null,
    stderr: mockStderr,
  })
);

const fail2 = jest.fn(() =>
  Promise.resolve({
    stdout: mockStdout,
    stderr: mockStderr,
  })
);

describe('pipenv', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should promisify exec and call the resulting function', async () => {
    mockPromisify.mockImplementationOnce(() => success);

    await pipenv('version');
    expect(mockPromisify).toHaveBeenCalledWith(exec);
    expect(success).toHaveBeenCalled();
  });

  it('should execute a pipenv command with PIPENV_VENV_IN_PROJECT option', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pipenv('version');
    expect(success).toHaveBeenCalledWith('pipenv version', {
      env: { ...process.env, PIPENV_VENV_IN_PROJECT: '1' },
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a pipenv command with cwd option and return its stdout', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pipenv('version', mockCwd);
    expect(success).toHaveBeenCalledWith('pipenv version', {
      env: { ...process.env, PIPENV_VENV_IN_PROJECT: '1' },
      cwd: mockCwd,
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a pipenv command with cwd option and return its stdout (raw)', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pipenv('version', mockCwd, true);
    expect(success).toHaveBeenCalledWith('version', {
      env: { ...process.env, PIPENV_VENV_IN_PROJECT: '1' },
      cwd: mockCwd,
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a command without the "pipenv" prefix if the "raw" option is set', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pipenv('version', undefined, true);
    expect(success).toHaveBeenCalledWith('version', {
      env: { ...process.env, PIPENV_VENV_IN_PROJECT: '1' },
    });
    expect(output).toEqual(mockStdout);
  });

  it('should throw an error if the executed command has non-empty stderr', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and stderr.
    for (const returnFunc of [fail1, fail2]) {
      mockPromisify.mockImplementationOnce(() => returnFunc);

      await expect(pipenv('non-existent-command')).rejects.toThrowError(
        mockStderr
      );
    }
  });
});
