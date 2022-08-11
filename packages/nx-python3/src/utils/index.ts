/* eslint-disable import/prefer-default-export */

import { ExecutorContext, logger } from '@nrwl/devkit';
import { execSync } from 'child_process';

export function runPythonCommand(
  command: string,
  options: { cwd?: string; env?: { [key: string]: string }; cmd?: string } = {}
): { success: boolean; stdout?: Buffer } {
  const cmd = options.cmd || 'python3';
  const cwd = options.cwd || process.cwd();
  const env = {
    ...process.env,
    ...(options.env || {}),
  };

  const execute = `${cmd} ${command}`;

  try {
    logger.info(`Executing command: ${execute}`);
    const stdout = execSync(execute, { cwd, env });
    return { success: true, stdout };
  } catch (e) {
    logger.error(`Failed to execute comand: ${execute}`);
    // eslint-disable-next-line no-console
    console.error(e);
    return { success: false };
  }
}

export function runPipenvCommand(
  context:
    | ExecutorContext
    | {
        workspace: { projects: { [key: string]: { root: string } } };
        projectName: string;
      },
  command: string,
  options: { cwd?: string } = {}
): { success: boolean; stdio?: Buffer } {
  const PIPENV_PIPFILE = `${process.cwd()}/${
    context.workspace.projects[context.projectName].root
  }/Pipfile`;
  const env = {
    PIPENV_PIPFILE,
  };

  return runPythonCommand(command, { ...options, cmd: 'pipenv', env });
}

export const hasFlag = (flag: string) => {
  let found = false;
  process.argv.every((arg) => {
    if (arg === flag) {
      found = true;
      return false;
    }
    return true;
  });
  return found;
};
