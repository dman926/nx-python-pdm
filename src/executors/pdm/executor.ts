import { ExecutorContext } from '@nx/devkit';
import { pdmExecutorSchema } from './schema';
import { pdm } from '../../pdm/pdm';

export default async function runpdm(
  options: pdmExecutorSchema,
  context: ExecutorContext
) {
  if (!(context.projectsConfigurations && context.projectName)) {
    throw new Error('Missing projectsConfigurations or projectName');
  }

  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const { command, cwd, raw, quiet } = options;

  return pdm(command, { cwd: cwd || projectRoot, raw })
    .then(({ stdout, stderr }) => {
      if (!quiet && stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
      return {
        success: true,
      };
    })
    .catch((error) => {
      console.error(error);
      return {
        success: false,
      };
    });
}
