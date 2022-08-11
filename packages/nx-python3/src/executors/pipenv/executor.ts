/* eslint-disable no-console */

import { ExecutorContext } from '@nrwl/devkit';
import { runPipenvCommand } from '../../utils';
// There's a fake eslint error here
// eslint-disable-next-line import/extensions
import { PipenvExecutorSchema } from './schema';

export default async function runExecutor(
  options: PipenvExecutorSchema,
  context: ExecutorContext
) {
  return {
    success: runPipenvCommand(
      context,
      `${options.command}${options.options ? ` ${options.options}` : ''}`
    ).success,
  };
}
