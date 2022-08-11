/* eslint-disable no-console */

import { ExecutorContext } from '@nrwl/devkit';
import { runPipenvCommand } from '../../utils';
// There's a fake eslint error here
// eslint-disable-next-line import/extensions
import { TestExecutorSchema } from './schema';

export default async function runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  return {
    success: runPipenvCommand(context, 'run test').success,
  };
}
