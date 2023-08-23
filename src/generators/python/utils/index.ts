import {
  PYTHON_E2E_TEST_RUNNERS,
  type PythonE2ETestRunner,
} from '../constants';
import type { E2ETestRunner, UnitTestRunner } from '../schema';

export * from './get-targets';
export * from './normalize-options';

export const pythonInstallableFilters = {
  /**
   * Filters the E2E test runner to only retrieve installable python packages.
   *
   * @param {E2ETestRunner} e2eTestRunner - The E2E test runner to be filtered.
   * @return {PythonE2ETestRunner | undefined} The filtered E2E test runner, or undefined if no match is found.
   */
  filterE2ERunner: (
    e2eTestRunner?: E2ETestRunner
  ): PythonE2ETestRunner | undefined =>
    e2eTestRunner &&
    PYTHON_E2E_TEST_RUNNERS.includes(e2eTestRunner as PythonE2ETestRunner)
      ? (e2eTestRunner as PythonE2ETestRunner)
      : undefined,
  /**
   * Filters the unit test runner to only retrieve installable python packages.
   * This entails ensuring it is not the 'unittest' package since it can't be installed.
   *
   * @param {UnitTestRunner} unitTestRunner - The unit test runner to filter.
   * @return {UnitTestRunner | undefined} - The filtered unit test runner, or undefined if it does not match the condition.
   */
  filterUnitTestRunner: (
    unitTestRunner?: UnitTestRunner
  ): UnitTestRunner | undefined =>
    unitTestRunner !== 'unittest' ? unitTestRunner : undefined,
};

export const setJoin = <T>(setToJoin: Set<T>, separator?: string) =>
  Array.from(setToJoin).join(separator);
