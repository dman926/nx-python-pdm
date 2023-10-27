import { ExecutorContext } from '@nx/devkit';
import { pdmExecutorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

export async function runpdm(
  options: pdmExecutorSchema,
  context: ExecutorContext
) {
  if (!(context.projectsConfigurations && context.projectName)) {
    throw new Error('Missing projectsConfigurations or projectName');
  }

  const projectRoot = `${context.root}/${
    context.projectsConfigurations.projects[context.projectName].root
  }`;
  const { command, cwd, raw, quiet } = options;
  let cwdParsed: string | undefined;
  if (cwd) {
    // Provided CWD is an absolute path or relative to the workspace root
    cwdParsed = cwd.startsWith('/') ? cwd : `${context.root}/${cwd}`;
  }

  return pdm(command, { cwd: cwdParsed || projectRoot, raw, quiet });
}

export default runpdm;
