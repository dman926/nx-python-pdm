import type { TargetConfiguration } from '@nx/devkit';
import type { NormalizedOptions } from './normalize-options';

type PythonTarget = 'build' | 'serve' | 'test' | 'lint' | 'typeCheck' | 'pdm';

// All targets have the same configuration for now
interface PythonTargetOption {
  command: string;
}

type Targets = Partial<{
  [targetName in PythonTarget]: TargetConfiguration<PythonTargetOption>;
}> & {
  [targetName: string]: TargetConfiguration<unknown>;
};

export const getTargets = ({
  rootOffset,
  projectDirectory,
  unitTestRunner,
  linter,
  typeChecker,
}: NormalizedOptions) => {
  const executor = 'nx-python-pdm:pdm';
  const testCommand = (() => {
    switch (unitTestRunner) {
      case 'unittest': {
        return 'run unittest discover .';
      }
      case 'pytest':
      case 'pyre': {
        return `run ${unitTestRunner}`;
      }
      default: {
        throw new Error(
          `Unknown/unhandled unit test runner: ${unitTestRunner}`
        );
      }
    }
  })();
  const targets: Targets = {
    build: {
      executor,
      options: {
        command: `build --dest=${rootOffset}dist/${projectDirectory}`,
      },
    },
    serve: {
      executor,
      options: {
        command: 'run main.py',
      },
    },
    test: {
      executor,
      options: {
        command: testCommand,
      },
    },
  };

  if (linter && linter !== 'none') {
    const lintCommand = (() => {
      switch (linter) {
        case 'pycodestyle': {
          return 'run pycodestyle ./**/*.py';
        }
        case 'flake8':
        case 'pylama': {
          return `run ${linter}`;
        }
        case 'pylint':
        case 'mypy': {
          return `run ${linter} ./**/*.py`;
          break;
        }
        default: {
          throw new Error(`Unknown/unhandled linter: ${linter}`);
        }
      }
    })();
    targets.lint = {
      executor,
      options: {
        command: lintCommand,
      },
    };
  }

  if (typeChecker && typeChecker !== 'none') {
    const typeCheckCommand = (() => {
      switch (typeChecker) {
        case 'mypy': {
          return 'run mypy ./**/*.py';
        }
        case 'pyright':
        case 'pyre': {
          return `run ${typeChecker}`;
        }
        default: {
          throw new Error(`Unknown/unhandled linter: ${linter}`);
        }
      }
    })();
    targets.typeCheck = {
      executor,
      options: {
        command: typeCheckCommand,
      },
    };
  }

  // Placed here to add to end of base target list since
  targets.pdm = {
    executor,
  };

  return targets;
};

export default getTargets;
