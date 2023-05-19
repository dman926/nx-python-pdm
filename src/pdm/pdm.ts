import { exec } from 'child_process';
import { promisify } from 'util';

export const LARGE_BUFFER = 1024 * 1000000;

export interface PdmOptions {
  cwd: string;
  raw: boolean;
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
  { cwd, raw }: Partial<PdmOptions> = {}
): Promise<string> =>
  promisify(exec)(`${raw ? '' : 'pdm '}${command}`, {
    maxBuffer: LARGE_BUFFER,
    env: process.env,
    cwd,
  }).then(({ stdout, stderr }) => {
    if (stderr) {
      throw new Error(stderr);
    }
    return stdout.trim();
  });

export default pdm;
