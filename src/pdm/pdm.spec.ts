import { promisify } from 'util';
import { exec } from 'child_process';
import { pdm } from './pdm';

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

describe('pdm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should promisify exec and call the resulting function', async () => {
    mockPromisify.mockImplementationOnce(() => success);

    await pdm('version');
    expect(mockPromisify).toHaveBeenCalledWith(exec);
    expect(success).toHaveBeenCalled();
  });

  it('should execute a pdm command with pdm_VENV_IN_PROJECT option', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pdm('version');
    expect(success).toHaveBeenCalledWith('pdm version', {
      env: { ...process.env, pdm_VENV_IN_PROJECT: '1' },
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a pdm command with cwd option and return its stdout', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pdm('version', { cwd: mockCwd });
    expect(success).toHaveBeenCalledWith('pdm version', {
      env: { ...process.env, pdm_VENV_IN_PROJECT: '1' },
      cwd: mockCwd,
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a pdm command with cwd option and return its stdout (raw)', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pdm('version', { cwd: mockCwd, raw: true });
    expect(success).toHaveBeenCalledWith('version', {
      env: { ...process.env, pdm_VENV_IN_PROJECT: '1' },
      cwd: mockCwd,
    });
    expect(output).toEqual(mockStdout);
  });

  it('should execute a command without the "pdm" prefix if the "raw" option is set', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => success);

    const output = await pdm('version', { raw: true });
    expect(success).toHaveBeenCalledWith('version', {
      env: { ...process.env, pdm_VENV_IN_PROJECT: '1' },
    });
    expect(output).toEqual(mockStdout);
  });

  it('should throw an error if the executed command has non-empty stderr', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and stderr.
    for (const returnFunc of [fail1, fail2]) {
      mockPromisify.mockImplementationOnce(() => returnFunc);

      await expect(pdm('non-existent-command')).rejects.toThrowError(
        mockStderr
      );
    }
  });
});
