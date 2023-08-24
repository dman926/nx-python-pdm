expect.extend({
  toBeWithAdditional<T>(
    received: T,
    expected: T,
    additional: unknown
  ): jest.CustomMatcherResult {
    const pass = received === expected;
    // Handle .not being used
    const message = () =>
      [
        `Expected: ${String(received)}`,
        `Received: ${String(expected)}`,
        'Additional Information:',
        String(additional),
      ].join('\n');

    return { message, pass };
  },
  toThrowWithAdditional(
    receivedFn: () => void,
    expected?: Error,
    additional?: unknown
  ): jest.CustomMatcherResult {
    let pass = false;
    let error: unknown = null;

    try {
      receivedFn();
    } catch (e) {
      error = e;
      pass = !expected || e === expected;
    }

    const expectedStringDefault = `It should${
      pass ? ' not' : ''
    } throw an error`;

    const message = () => {
      const errorMessage = error
        ? `Received error: ${String(error)}`
        : 'No error was thrown';
      return [
        `Expected: ${expected ? String(expected) : expectedStringDefault}`,
        errorMessage,
        'Additional Information:',
        String(additional),
      ].join('\n');
    };

    return { message, pass };
  },
});
