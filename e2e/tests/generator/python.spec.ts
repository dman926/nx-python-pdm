import {
  checkFilesExist,
  listFiles,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
  runCommandAsync,
  uniq,
} from '@nx/plugin/testing';
import { cleanup } from '../../util';

describe('python generator', () => {
  const names: string[] = [];

  beforeAll(() => {
    ensureNxProject('nx-python-pdm', 'dist/nx-python-pdm');
  });

  afterAll(async () => {
    for (const name of names) {
      try {
        await cleanup(name);
      } catch (error) {
        // Project is not there
        // Don't care
      }
    }
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  }, 60 * 1000);

  it('should be able to generated project files', async () => {
    const name = uniq('generate-proj');
    const baseDir = `apps/${name}`;
    await runNxCommandAsync(
      `generate nx-python-pdm:python --name ${name} --no-interactive`
    );
    names.push(name);
    expect(() => {
      checkFilesExist(
        ...['src/main.py', 'pyproject.toml'].map((el) => `${baseDir}/${el}`)
      );
    }).not.toThrow();
  }, 10 * 1000);

  describe('build target', () => {
    it('should be able to build generated projects', async () => {
      const name = uniq('build-target-test');
      await runNxCommandAsync(
        `generate nx-python-pdm:python --name ${name} --no-interactive`
      );
      names.push(name);
      expect(() => {
        runNxCommand(`build ${name}`);
      }).not.toThrow();

      const filesInDirectory = listFiles(`dist/${name}`);
      filesInDirectory.unshift(`Files present in dist/${name}`);

      expect(() =>
        checkFilesExist(
          `dist/${name}/${name}-0.1.0.tar.gz`,
          `dist/${name}/${name.replace(/-/g, '_')}-0.1.0-py3-none-any.whl`
        )
      ).not.toThrowWithAdditional(undefined, filesInDirectory.join('\n'));
    });
  });

  describe('serve target', () => {
    it('should be able to serve generated projects', async () => {
      const name = uniq('serve-target-test');
      await runNxCommandAsync(
        `generate nx-python-pdm:python --name ${name} --no-interactive`
      );
      names.push(name);
      let serveOutput = '';
      const expectedOutput =
        '\n' +
        `> nx run ${name}:serve\n` +
        '\n' +
        'Hello World\n' +
        '\n' +
        ' \n' +
        '\n' +
        ` >  NX   Successfully ran target serve for project ${name}\n` +
        '\n' +
        '\n';
      expect(() => {
        serveOutput = runNxCommand(`serve ${name}`);
      }).not.toThrow();
      expect(serveOutput).toBe(expectedOutput);
    });
  });

  describe('test target', () => {
    ['unittest', 'pytest'].forEach((testRunner) => {
      it(`should be able to run tests on generated projects with ${testRunner}`, async () => {
        const name = uniq(`${testRunner}-test-target-test`);
        await runNxCommandAsync(
          `generate nx-python-pdm:python --name ${name} --unitTestRunner ${testRunner} --no-interactive`
        );
        names.push(name);

        // Create dummy test file
        const testFilePath = `apps/${name}/tests/test_dummy.py`;
        await runCommandAsync(
          `echo "def test_dummy():\\n    assert True" > ${testFilePath}`
        );

        let output = '';
        expect(() => {
          output = runNxCommand(`test ${name}`);
        }).not.toThrowWithAdditional(undefined, output);
      });
    }, 25 * 1000);
  });

  describe('lint target', () => {
    [
      {
        testName: 'when no linter is specified',
        projectName: 'no-linter',
        command: '',
      },
      {
        testName: 'when no linter is specified',
        projectName: 'no-linter',
        command: ' --linter none',
      },
    ].forEach(({ testName, projectName, command }) => {
      it(`should not include a lint target ${testName}`, async () => {
        const name = uniq(`${projectName}-lint-target-test`);
        await runNxCommandAsync(
          `generate nx-python-pdm:python --name ${name}${command} --no-interactive`
        );
        names.push(name);

        let output = '';
        expect(() => {
          output = runNxCommand(`lint ${name}`);
        }).toThrowWithAdditional(undefined, output);
      });
    });

    ['pylint', 'flake8', 'pycodestyle', 'pylama', 'mypy'].forEach((linter) => {
      it(
        `should be able to run linting on generated projects with ${linter}`,
        async () => {
          const name = uniq(`${linter}-lint-target-test`);
          await runNxCommandAsync(
            `generate nx-python-pdm:python --name ${name} --linter ${linter} --no-interactive`
          );
          names.push(name);

          let output = '';
          expect(() => {
            output = runNxCommand(`lint ${name}`);
          }).not.toThrowWithAdditional(undefined, output);
        },
        10 * 1000
      );
    });
  });

  describe('typeCheck target', () => {
    ['mypy', 'pyright', 'pyre-check'].forEach((typeChecker) => {
      it(
        `should be able to run type checking on generated projects with ${typeChecker}`,
        async () => {
          const name = uniq(`${typeChecker}-type-check-target-test`);
          await runNxCommandAsync(
            `generate nx-python-pdm:python --name ${name} --typeChecker ${typeChecker} --no-interactive`
          );
          names.push(name);

          let output = '';
          expect(() => {
            output = runNxCommand(`typeCheck ${name}`);
          }).not.toThrowWithAdditional(undefined, output);
        },
        25 * 1000
      );
    });
  });

  describe.skip('e2e target', () => {
    // TODO
  });
});
