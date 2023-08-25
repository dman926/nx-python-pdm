import {
  ensureNxProject,
  runNxCommand,
  runNxCommandAsync,
  uniq,
} from '@nx/plugin/testing';
import { cleanup } from '../../util';

describe.skip('pdm executor', () => {
  const names: string[] = [];

  beforeAll(() => {
    ensureNxProject('nx-python-pdm', 'dist/nx-python-pdm');
  });

  afterAll(async () => {
    for (const name of names) {
      try {
        await cleanup(name);
      } catch (error) {
        console.log(`Failed to cleanup ${name}`);
      }
    }
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  it('should successfully run pdm commands', async () => {
    const name = uniq('pdm-executor-test');
    names.push(name);
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );

    // pdm info
    let projectInfo: string[] = [];
    expect(() => {
      projectInfo = runNxCommand(`run ${name}:pdm info`).split('\n');
    }).not.toThrow();
    expect(projectInfo.length).toBeGreaterThanOrEqual(4);
    const firstLineOfInfo = projectInfo[3];
    expect(firstLineOfInfo).toBe('PDM version:');

    // pdm run
    let runOutput: string[] = [];
    expect(() => {
      runOutput = runNxCommand(
        `run ${name}:pdm "run python -c \\"print('Hello World')\\""`
      ).split('\n');
    }).not.toThrow();
    expect(runOutput.length).toBeGreaterThanOrEqual(4);
    const firstLineOfPython = runOutput[3];
    expect(firstLineOfPython).toBe('Hello World');
  });
});
