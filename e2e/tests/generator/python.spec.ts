import {
  checkFilesExist,
  ensureNxProject,
  runNxCommandAsync,
} from "@nx/plugin/testing";

describe("python generator", () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject("nx-pipenv", "dist/./.");
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync("reset");
  });

  it("should be able to generated project files", async () => {
    const name = "generate-proj";
    const baseDir = `app/${name}/`;
    await runNxCommandAsync(`generate nx-pipenv:python --name ${name}`);
    expect(() => checkFilesExist(...['main.py', 'Pipfile', 'Pipfile.lock'].map((el) => `${baseDir}/${el}`))).not.toThrow();
  });
});
