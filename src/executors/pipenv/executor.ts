import { ExecutorContext } from '@nx/devkit';
import { PipenvExecutorSchema } from './schema';
import { pipenv } from '../../pipenv/pipenv';

export default async function runPipenv(
  options: PipenvExecutorSchema,
  context: ExecutorContext
) {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;
  const { command, cwd, raw } = options;

  return pipenv(command, { cwd: cwd || projectRoot, raw })
    .then(() => ({
      success: true,
    }))
    .catch((error) => {
      console.error(error);
      return {
        success: false,
      };
    });
}
