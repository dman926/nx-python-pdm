import { exec } from 'child_process';
import { promisify } from 'util';

export interface PipenvOptions {
  cwd: string;
  raw: boolean;
}

/**
 * Executes the given command using pipenv and returns a promise that
 * resolves with the command's output. If `cwd` is provided, the command
 * will be executed in the specified directory. If `raw` is true, the
 * command will be executed without the "pipenv" prefix.
 *
 * @param command The command to execute using pipenv.
 * @param cwd The directory to execute the command in.
 * @param raw Whether to execute the command without the "pipenv" prefix.
 * @returns A promise that resolves with the command's output.
 */
export const pipenv = (
  command: string,
  { cwd, raw }: Partial<PipenvOptions>
): Promise<string> =>
  promisify(exec)(`${raw ? '' : 'pipenv '}${command}`, {
    env: { ...process.env, PIPENV_VENV_IN_PROJECT: '1' },
    cwd,
  }).then(({ stdout, stderr }) => {
    if (stderr) {
      throw new Error(stderr);
    }
    return stdout.trim();
  });

export default pipenv;
