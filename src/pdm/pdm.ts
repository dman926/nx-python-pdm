import { execSync } from 'child_process';

export const LARGE_BUFFER = 1024 * 1000000;

export interface PdmOptions {
  cwd: string;
  raw: boolean;
  quiet: boolean;
}

export interface PdmResults {
  success: boolean;
  stdout?: Buffer;
}

/**
 * Executes the given command using pdm and returns a promise that
 * resolves with the command's output. If `cwd` is provided, the command
 * will be executed in the specified directory. If `raw` is true, the
 * command will be executed without the "pdm" prefix.
 *
 * @param command The command to execute using pdm.
 * @param cwd The directory to execute the command in.
 * @param raw Whether to execute the command without the "pdm" prefix.
 * @returns A promise that resolves with the command's output.
 */
export const pdm = (
  command: string,
  { cwd, raw, quiet }: Partial<PdmOptions> = {}
): PdmResults => {
  const execute = raw ? command : `pdm ${command}`;

  try {
    if (!quiet) {
      console.log(`Executing command: ${execute}`);
    }
    const stdout = execSync(execute, {
      maxBuffer: LARGE_BUFFER,
      env: process.env,
      stdio: quiet ? 'ignore' : 'inherit',
      cwd,
    });
    return {
      success: true,
      stdout,
    };
  } catch (e) {
    if (!quiet) {
      console.error(`Failed to execute command: ${execute}`, e);
    }
    return {
      success: false,
    };
  }
};

export default pdm;
