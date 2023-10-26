import { execSync } from 'child_process';
import { pdm, PdmOptions, PdmResults, LARGE_BUFFER } from './pdm';

// Mock the exec function to avoid actually executing commands during the tests.
jest.mock('child_process', () => {
  const mod = jest.requireActual('child_process');
  return {
    ...mod,
    execSync: jest.fn(),
  };
});

const mockExecSync = jest.mocked(execSync);

describe('pdm function', () => {
  // Test case for successful command execution
  it('executes pdm command successfully', () => {
    const command = 'some-pdm-command';
    const options: Partial<PdmOptions> = {
      cwd: '/path/to/directory',
      raw: false,
      quiet: true,
    };

    // Mock execSync to return a Buffer simulating command execution
    mockExecSync.mockReturnValue(Buffer.from('Mocked Output'));

    const result: PdmResults = pdm(command, options);

    // Assert that the function returns a successful result
    expect(result.success).toBe(true);

    // Assert that execSync is called with the correct parameters
    expect(execSync).toHaveBeenCalledWith(`pdm ${command}`, {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      stdio: 'ignore',
      cwd: '/path/to/directory',
    });
  });

  // Test case for unsuccessful command execution
  it('handles pdm command failure', () => {
    const command = 'failing-pdm-command';
    const options: Partial<PdmOptions> = {
      cwd: '/path/to/directory',
      raw: false,
      quiet: true,
    };

    // Mock execSync to throw an error simulating command failure
    mockExecSync.mockImplementation(() => {
      throw new Error('Command failed');
    });

    const result: PdmResults = pdm(command, options);

    // Assert that the function returns a failure result
    expect(result.success).toBe(false);

    // Assert that execSync is called with the correct parameters
    expect(execSync).toHaveBeenCalledWith(`pdm ${command}`, {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      stdio: 'ignore',
      cwd: '/path/to/directory',
    });
  });

  // Test case for raw command execution
  it('executes raw pdm command successfully', () => {
    const command = 'raw-pdm-command';
    const options: Partial<PdmOptions> = {
      cwd: '/path/to/directory',
      raw: true,
      quiet: true,
    };

    // Mock execSync to return a Buffer simulating command execution
    mockExecSync.mockReturnValue(Buffer.from('Mocked Output'));

    const result: PdmResults = pdm(command, options);

    // Assert that the function returns a successful result
    expect(result.success).toBe(true);

    // Assert that execSync is called with the correct parameters (raw command)
    expect(execSync).toHaveBeenCalledWith(command, {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      stdio: 'ignore',
      cwd: '/path/to/directory',
    });
  });
});