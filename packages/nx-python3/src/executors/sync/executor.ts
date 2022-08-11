import { ExecutorContext } from '@nrwl/devkit';
import { runPipenvCommand } from '../../utils';
import { SyncExecutorSchema } from './schema';

export default async function runExecutor(
  options: SyncExecutorSchema,
  context: ExecutorContext
) {
  return {
    success: runPipenvCommand(context, 'run sync').success,
  };
}
