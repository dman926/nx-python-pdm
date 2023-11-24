import type { E2ETestRunner } from '../schema';

export const PYTHON_E2E_TEST_RUNNERS = ['robotframework'] as const;
export type PythonE2ETestRunner = (typeof PYTHON_E2E_TEST_RUNNERS)[number];
export const NODE_E2E_TEST_RUNNERS = ['cypress', 'playwright'] as const;
export type NodeE2ETestRunner = (typeof NODE_E2E_TEST_RUNNERS)[number];

export const DUMMY_FILES = [
  'pyproject.toml',
  '.venv',
  '.pdm-python',
  '.gitignore',
] as const;

export const isPythonE2ETestRunner = (
  testRunner?: E2ETestRunner
): testRunner is PythonE2ETestRunner =>
  Boolean(testRunner) &&
  PYTHON_E2E_TEST_RUNNERS.includes(testRunner as PythonE2ETestRunner);

export const isNodeE2ETestRunner = (
  testRunner?: E2ETestRunner
): testRunner is NodeE2ETestRunner =>
  Boolean(testRunner) &&
  NODE_E2E_TEST_RUNNERS.includes(testRunner as NodeE2ETestRunner);
