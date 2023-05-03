import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  runNxCommand,
} from "@nx/plugin/testing";

describe("nx-pipenv e2e", () => {
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

  // Add some tests here to check that your plugin functionality works as expected.
  // A sample test is included below to give you some ideas.
  xit("should be able to build generated projects", async () => {
    const name = "proj";
    const generator = "PLACEHOLDER";
    await runNxCommandAsync(`generate nx-pipenv:${generator} --name ${name}`);
    expect(() => runNxCommand("build ${proj}")).not.toThrow();
    expect(() => checkFilesExist(`dist/${name}/index.js`)).not.toThrow();
  });
});
