declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithAdditional<T>(expected: T, additional: unknown): R;
      toThrowWithAdditional(error?: Error, additional?: unknown): R;
    }
  }
}

export {};
