export const PYTHON_E2E_TEST_RUNNERS = ['robotframework'] as const;
export type PythonE2ETestRunner = (typeof PYTHON_E2E_TEST_RUNNERS)[number];

export const DUMMY_FILES = [
  'pyproject.toml',
  '.venv',
  '.pdm-python',
  '.gitignore',
] as const;
