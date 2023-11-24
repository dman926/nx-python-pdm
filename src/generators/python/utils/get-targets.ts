import type { TargetConfiguration, Tree } from '@nx/devkit';
import type { NormalizedOptions } from './normalize-options';
import { isPythonE2ETestRunner } from '../constants';

type PythonTarget =
  | 'build'
  | 'serve'
  | 'test'
  | 'lint'
  | 'typeCheck'
  | 'e2e'
  | 'pdm';

// All targets have the same configuration for now
interface PythonTargetOption {
  command: string;
}

type Targets = Partial<{
  [targetName in Exclude<
    PythonTarget,
    'e2e'
  >]: TargetConfiguration<PythonTargetOption>;
}> & { e2e?: TargetConfiguration<PythonTargetOption | unknown> } & {
  [targetName in string]: TargetConfiguration<unknown>;
};

export const getTargets = (
  tree: Tree,
  {
    rootOffset,
    projectRoot,
    unitTestRunner,
    linter,
    typeChecker,
    separateE2eProject,
    e2eTestRunner,
  }: NormalizedOptions
) => {
  const executor = '@dman926/nx-python-pdm:pdm';
  const testCommand = (() => {
    switch (unitTestRunner) {
      case 'unittest': {
        return 'run python -m unittest discover .';
      }
      case 'pytest': {
        return 'run pytest .';
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
        command: `build --dest=${rootOffset}dist/${projectRoot}`,
      },
    },
    serve: {
      executor,
      options: {
        command: 'run python -m src',
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
          return 'run pycodestyle ./**/*.py --exclude=.venv,__pycache__';
        }
        case 'flake8': {
          return 'run flake8 --exclude .venv,__pycache__';
        }
        case 'pylama': {
          return 'run pylama --skip .venv/**,__pycache__/**';
        }
        case 'pylint': {
          return 'run pylint ./**/*.py --ignore=.venv,__pycache__';
        }
        case 'mypy': {
          return 'run mypy ./**/*.py --exclude .venv,__pycache__';
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
          return 'run pyright';
        case 'pyre-check': {
          return 'run pyre';
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

  if (e2eTestRunner !== 'none' && !separateE2eProject) {
    if (isPythonE2ETestRunner(e2eTestRunner)) {
      targets.e2e = {
        executor,
        options: {
          command: 'run python -m robot e2e',
        },
      };
    }
    // Node E2E runners should have the target added by the e2e generators
  }

  // Placed here to add to end of base target list
  targets.pdm = {
    executor,
  };

  return targets;
};

export default getTargets;
