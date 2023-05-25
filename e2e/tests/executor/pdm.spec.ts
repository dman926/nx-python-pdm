import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
} from "@nx/plugin/testing";

describe("pdm executor", () => {
  beforeAll(() => {
    ensureNxProject("nx-python-pdm", "dist/nx-python-pdm");
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync("reset");
  });

  it("should be able to build generated projects", async () => {
    const name = "proj";
    const generator = "python";
    await runNxCommandAsync(`generate nx-python-pdm:${generator} --name ${name} --no-interactive`);
    expect(() => runNxCommand(`build ${name}`)).not.toThrow();
    expect(() => checkFilesExist(`build/${name}/${name}-0.1.0.tar.gz`)).not.toThrow();
    expect(() => checkFilesExist(`build/${name}/${name}-0.1.0-py3-none-any.whl`)).not.toThrow();
  });
});
