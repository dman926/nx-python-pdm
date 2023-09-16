import { type ProjectType } from '@nx/devkit';
import {
  checkFilesExist,
  listFiles,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
  runCommandAsync,
  uniq,
} from '@nx/plugin/testing';
import { cleanup, getOptionString } from '../../util';

const projectTypes: ProjectType[] = ['library', 'application'];

projectTypes.forEach((projectType) => {
  describe(`python generator - ${projectType}`, () => {
    const names: string[] = [];
    const baseOptions = {
      name: '',
      projectType,
    };
    const projectContainingFolder =
      projectType === 'application' ? 'apps' : 'libs';

    // I'm lazy
    const options = () => getOptionString(baseOptions);

    beforeAll(() => {
      ensureNxProject('nx-python-pdm', 'dist/nx-python-pdm');
    });

    afterEach(() => {
      jest.restoreAllMocks();
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

    it(
      'should be able to generated project files',
      async () => {
        const name = uniq('generate-proj');
        baseOptions.name = name;
        const baseDir = `${projectContainingFolder}/${name}`;
        await runNxCommandAsync(
          `generate nx-python-pdm:python ${options()} --no-interactive`
        );
        names.push(name);
        expect(() => {
          checkFilesExist(
            ...['src/main.py', 'pyproject.toml'].map((el) => `${baseDir}/${el}`)
          );
        }).not.toThrow();
      },
      10 * 1000
    );

    describe('build target', () => {
      it('should be able to build generated projects', async () => {
        const name = uniq('build-target-test');
        baseOptions.name = name;
        await runNxCommandAsync(
          `generate nx-python-pdm:python ${options()} --no-interactive`
        );
        names.push(name);
        expect(() => {
          runNxCommand(`build ${name}`);
        }).not.toThrow();

        const filesInDirectory = listFiles(
          `dist/${projectContainingFolder}/${name}`
        );
        filesInDirectory.unshift(
          `Files present in dist/${projectContainingFolder}/${name}`
        );

        expect(() =>
          checkFilesExist(
            `dist/${projectContainingFolder}/${name}/${
              // Library projects generate a tarball with underscores
              projectType === 'application' ? name : name.replace(/-/g, '_')
            }-0.1.0.tar.gz`,
            `dist/${projectContainingFolder}/${name}/${name.replace(
              /-/g,
              '_'
            )}-0.1.0-py3-none-any.whl`
          )
        ).not.toThrowWithAdditional(undefined, filesInDirectory.join('\n'));
      });
    });

    describe('serve target', () => {
      it('should be able to serve generated projects', async () => {
        const name = uniq('serve-target-test');
        baseOptions.name = name;
        await runNxCommandAsync(
          `generate nx-python-pdm:python ${options()} --no-interactive`
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
        it(
          `should be able to run tests on generated projects with ${testRunner}`,
          async () => {
            const name = uniq(`${testRunner}-test-target-test`);
            baseOptions.name = name;
            await runNxCommandAsync(
              `generate nx-python-pdm:python ${options()} --unitTestRunner ${testRunner} --no-interactive`
            );
            names.push(name);

            // Create dummy test file
            const testFilePath = `${projectContainingFolder}/${name}/tests/test_dummy.py`;
            await runCommandAsync(
              `echo "def test_dummy():\\n    assert True" > ${testFilePath}`
            );

            let output = '';
            expect(() => {
              output = runNxCommand(`test ${name} --quiet`);
            }).not.toThrowWithAdditional(undefined, output);
          },
          10 * 1000
        );
      });
    });

    describe('lint target', () => {
      [
        {
          testName: 'when no linter is specified',
          projectName: 'no-linter',
          command: '',
        },
        {
          testName: 'when linter: "none" is specified',
          projectName: 'no-linter',
          command: ' --linter none',
        },
      ].forEach(({ testName, projectName, command }) => {
        it(`should not include a lint target ${testName}`, async () => {
          const name = uniq(`${projectName}-lint-target-test`);
          baseOptions.name = name;
          await runNxCommandAsync(
            `generate nx-python-pdm:python ${options()}${command} --no-interactive`
          );
          names.push(name);

          let output = '';
          // Disable the console as it is expected to throw and NX will log it
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          jest.spyOn(console, 'log').mockImplementation(() => {});
          expect(() => {
            output = runNxCommand(`lint ${name}`);
          }).toThrowWithAdditional(undefined, output);

          jest.spyOn(console, 'log').mockRestore();
        });
      });

      ['pylint', 'flake8', 'pycodestyle', 'pylama', 'mypy'].forEach(
        (linter) => {
          it(
            `should be able to run linting on generated projects with ${linter}`,
            async () => {
              const name = uniq(`${linter}-lint-target-test`);
              baseOptions.name = name;
              await runNxCommandAsync(
                `generate nx-python-pdm:python ${options()} --linter ${linter} --no-interactive`
              );
              names.push(name);

              let output = '';
              expect(() => {
                output = runNxCommand(`lint ${name}`);
              }).not.toThrowWithAdditional(undefined, output);
            },
            10 * 1000
          );
        }
      );
    });

    describe('typeCheck target', () => {
      ['mypy', 'pyright', 'pyre-check'].forEach((typeChecker) => {
        it(
          `should be able to run type checking on generated projects with ${typeChecker}`,
          async () => {
            const name = uniq(`${typeChecker}-type-check-target-test`);
            baseOptions.name = name;
            await runNxCommandAsync(
              `generate nx-python-pdm:python ${options()} --typeChecker ${typeChecker} --no-interactive`
            );
            names.push(name);

            let output = '';
            expect(() => {
              output = runNxCommand(`typeCheck ${name} --quiet`);
            }).not.toThrowWithAdditional(undefined, output);
          },
          25 * 1000
        );
      });
    });

    describe('e2e target', () => {
      // TODO
    });
  });
});
