import { joinPathFragments, type ProjectType } from '@nx/devkit';
import {
  checkFilesExist,
  listFiles,
  ensureNxProject,
  runNxCommandAsync,
  runNxCommand,
  runCommandAsync,
  uniq,
} from '@nx/plugin/testing';
import { cleanup, getOptionString, getProjectRoot } from '../../util';

const projectTypes: ProjectType[] = ['library', 'application'];

projectTypes.forEach((projectType) => {
  describe(`python generator - ${projectType}`, () => {
    const names: string[] = [];
    const baseOptions = {
      name: '',
      projectType,
      separateE2eProject: false,
      tags: ['E2E-TESTING'],
    };

    // I'm lazy
    const options = (overrides: object = {}) =>
      getOptionString({ ...baseOptions, ...overrides });

    beforeAll(() => {
      ensureNxProject('@dman926/nx-python-pdm', 'dist/@dman926/nx-python-pdm');
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
      'should be able to generate project files',
      async () => {
        const name = uniq('generate-proj');
        baseOptions.name = name;
        await runNxCommandAsync(
          `generate @dman926/nx-python-pdm:python ${options()} --no-interactive`
        );
        names.push(name);
        const baseDir = await getProjectRoot(name);
        expect(() => {
          checkFilesExist(
            ...['src/__main__.py', 'pyproject.toml'].map((el) =>
              joinPathFragments(baseDir, el)
            )
          );
        }).not.toThrow();
      },
      10 * 1000
    );

    describe('build target', () => {
      it(
        'should be able to build generated projects',
        async () => {
          const name = uniq('build-target-test');
          baseOptions.name = name;
          await runNxCommandAsync(
            `generate @dman926/nx-python-pdm:python ${options()} --no-interactive`
          );
          names.push(name);

          const distRoot = joinPathFragments(
            'dist',
            await getProjectRoot(name)
          );

          expect(() => {
            runNxCommand(`build ${name}`);
          }).not.toThrow();

          const filesInDirectory = listFiles(distRoot);
          filesInDirectory.unshift(`Files present in ${distRoot}`);

          expect(() =>
            checkFilesExist(
              `${distRoot}/${
                // Library projects generate a tarball with underscores
                projectType === 'application' ? name : name.replace(/-/g, '_')
              }-0.1.0.tar.gz`,
              joinPathFragments(
                distRoot,
                `${name.replace(/-/g, '_')}-0.1.0-py3-none-any.whl`
              )
            )
          ).not.toThrowWithAdditional(undefined, filesInDirectory.join('\n'));
        },
        10 * 1000
      );
    });

    describe('serve target', () => {
      it('should be able to serve generated projects', async () => {
        const name = uniq('serve-target-test');
        baseOptions.name = name;
        await runNxCommandAsync(
          `generate @dman926/nx-python-pdm:python ${options()} --no-interactive`
        );
        names.push(name);
        let serveOutput = '';
        const expectedOutput = 'Hello World';
        expect(() => {
          serveOutput = runNxCommand(`serve ${name}`);
        }).not.toThrow();
        expect(
          serveOutput
            .split('\n')
            .find((line) => line.startsWith(expectedOutput))
        ).toBeDefined();
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
              `generate @dman926/nx-python-pdm:python ${options()} --unitTestRunner ${testRunner} --no-interactive`
            );
            names.push(name);

            // Create dummy test file
            const testFilePath = joinPathFragments(
              await getProjectRoot(name),
              'tests/test_dummy.py'
            );
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
            `generate @dman926/nx-python-pdm:python ${options()}${command} --no-interactive`
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
                `generate @dman926/nx-python-pdm:python ${options()} --linter ${linter} --no-interactive`
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
              `generate @dman926/nx-python-pdm:python ${options()} --typeChecker ${typeChecker} --no-interactive`
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
      [
        {
          testName: 'when no E2E test runner is specified',
          projectName: 'no-e2e-target',
          command: '',
        },
        {
          testName: 'when e2eTestRunner: "none" is specified',
          projectName: 'no-e2e-target',
          command: ' --e2eTestRunner none',
        },
      ].forEach(({ testName, projectName, command }) => {
        it(`should not include an e2e target ${testName}`, async () => {
          const name = uniq(`${projectName}-target-test`);
          baseOptions.name = name;
          await runNxCommandAsync(
            `generate @dman926/nx-python-pdm:python ${options()}${command} --no-interactive`
          );
          names.push(name);

          let output = '';
          // Disable the console as it is expected to throw and NX will log it
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          jest.spyOn(console, 'log').mockImplementation(() => {});
          expect(() => {
            output = runNxCommand(`e2e ${name}`);
          }).toThrowWithAdditional(undefined, output);

          jest.spyOn(console, 'log').mockRestore();
        });
      });

      ['cypress', 'playwright', 'robotframework'].forEach((e2eTestRunner) => {
        [true, false].forEach((doSeparateE2eProject) => {
          it(
            `should be able to run E2E on generated projects with ${e2eTestRunner} ${
              doSeparateE2eProject
                ? 'in a separate project'
                : 'in the same project'
            }`,
            async () => {
              const name = uniq(
                `${e2eTestRunner}-${doSeparateE2eProject}-e2e-target-test`
              );
              baseOptions.name = name;
              await runNxCommandAsync(
                `generate @dman926/nx-python-pdm:python ${options({
                  separateE2eProject: doSeparateE2eProject,
                })} --e2eTestRunner ${e2eTestRunner} --no-interactive`
              );
              names.push(name);

              let desiredName = name;
              if (doSeparateE2eProject) {
                desiredName = `${name}-e2e`;
                names.push(desiredName);
              }

              let output = '';
              expect(() => {
                output = runNxCommand(`e2e ${desiredName} --quiet`);
              }).not.toThrowWithAdditional(undefined, output);
            },
            25 * 1000
          );
        });
      });
    });
  });
});
