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

  const projectRoot =
    `${context.root}/${context.projectsConfigurations.projects[context.projectName].root}`;
  const { command, cwd, raw, quiet } = options;

  return pdm(command, { cwd: cwd || projectRoot, raw, quiet });
}

export default runpdm;
