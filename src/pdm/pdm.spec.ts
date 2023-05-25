import { promisify } from 'util';
import { exec } from 'child_process';
import { pdm, LARGE_BUFFER } from './pdm';

// Mock the exec function to avoid actually executing commands during the tests.
jest.mock('util', () => ({
  promisify: jest.fn(),
}));

const mockPromisify = jest.mocked(promisify);

const mockStdout = 'mocked stdout';
const mockStderr = 'mocked stderr';

const success = {
  stdout: mockStdout,
  stderr: '',
};
const successP = jest.fn(() => Promise.resolve(success));

const fail1 = {
  stdout: '',
  stderr: mockStderr,
};
const fail1P = jest.fn(() => Promise.resolve(fail1));

const fail2 = {
  stdout: mockStdout,
  stderr: mockStderr,
};
const fail2P = jest.fn(() => Promise.resolve(fail2));

describe('pdm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should promisify exec and call the resulting function', async () => {
    mockPromisify.mockImplementationOnce(() => successP);

    await pdm('version');
    expect(mockPromisify).toHaveBeenCalledWith(exec);
    expect(successP).toHaveBeenCalled();
  });

  it('should execute a pdm command with processEnv option', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => successP);

    const output = await pdm('version');
    expect(successP).toHaveBeenCalledWith('pdm version', {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
    });
    expect(output).toEqual(success);
  });

  it('should execute a pdm command with cwd option and return its stdout', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => successP);

    const output = await pdm('version', { cwd: mockCwd });
    expect(successP).toHaveBeenCalledWith('pdm version', {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      cwd: mockCwd,
    });
    expect(output).toEqual(success);
  });

  it('should execute a pdm command with cwd option and return its stdout (raw)', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    const mockCwd = '/home/user/project';
    mockPromisify.mockImplementationOnce(() => successP);

    const output = await pdm('version', { cwd: mockCwd, raw: true });
    expect(successP).toHaveBeenCalledWith('version', {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      cwd: mockCwd,
    });
    expect(output).toEqual(success);
  });

  it('should execute a command without the "pdm" prefix if the "raw" option is set', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and an empty stderr.
    mockPromisify.mockImplementationOnce(() => successP);

    const output = await pdm('version', { raw: true });
    expect(successP).toHaveBeenCalledWith('version', {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
    });
    expect(output).toEqual(success);
  });

  it('should output non-empty stderr if stderr is generated', async () => {
    // Mock the exec function to return a promise that resolves with mocked stdout and stderr.
    for (const { returnFunc, returnVal } of [
      { returnFunc: fail1P, returnVal: fail1 },
      { returnFunc: fail2P, returnVal: fail2 },
    ]) {
      mockPromisify.mockImplementationOnce(() => returnFunc);

      const output = await pdm('non-existent-command');
      expect(returnFunc).toBeCalledWith('pdm non-existent-command', {
        maxBuffer: LARGE_BUFFER,
        env: process.env,
      });
      expect(output).toEqual(returnVal);
    }
  });
});
