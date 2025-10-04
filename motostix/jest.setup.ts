import "@testing-library/jest-dom";

// Keep tests quiet unless explicitly logging. This mirrors the behaviour in Next.js runtime
// where console noise is minimal, but allows manual debugging by restoring the spies.
const consoleError = console.error;
const consoleWarn = console.warn;

let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((...args) => {
    if (process.env.DEBUG_TESTS) {
      consoleError(...args);
    }
  });
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation((...args) => {
    if (process.env.DEBUG_TESTS) {
      consoleWarn(...args);
    }
  });
});

afterEach(() => {
  jest.clearAllMocks();
  consoleErrorSpy?.mockClear();
  consoleWarnSpy?.mockClear();
});

afterAll(() => {
  consoleErrorSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
});
