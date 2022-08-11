import { ExecutorContext } from '@nrwl/devkit';
import { runPipenvCommand } from '../../utils';
import { BuildExecutorSchema } from './schema';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  return {
    success: runPipenvCommand(context, 'run build').success,
  };
}
