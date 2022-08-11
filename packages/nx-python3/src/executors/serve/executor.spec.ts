// There's a fake eslint error here
// eslint-disable-next-line import/extensions
import { ServeExecutorSchema } from './schema';
import executor from './executor';

jest.mock('../../utils');
// eslint-disable-next-line import/first
import * as utils from '../../utils';

const options: ServeExecutorSchema = {
  cmd: '',
  cwd: '',
  main: '',
  args: [],
};

describe('Build Executor', () => {
  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (utils as any).runPythonCommand = jest.fn(() => ({ success: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (utils as any).runPipenvCommand = jest.fn(() => ({ success: true }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can run', async () => {
    const output = await executor(options, null);
    expect(output.success).toBe(true);
  });
});
