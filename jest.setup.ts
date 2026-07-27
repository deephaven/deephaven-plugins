import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import Log from '@deephaven/log';

let logLevel = parseInt(process.env.DH_LOG_LEVEL ?? '', 10);
if (!Number.isFinite(logLevel)) {
  logLevel = -1;
}
Log.setLogLevel(logLevel);

// Define the matchMedia property so we can mock out monaco properly
// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
// https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Mock the structuredClone function to use `JSON.stringify` and `JSON.parse`
 * This is necessary because jsdom does not support `structuredClone`.
 * https://github.com/jsdom/jsdom/issues/3363
 */
global.structuredClone = jest.fn(val => JSON.parse(JSON.stringify(val)));

/**
 * Polyfill `crypto.randomUUID` which jsdom's `crypto` implementation does not
 * provide. Uses an incrementing counter so IDs are unique and deterministic
 * within a test run.
 */
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let uuidCounter = 0;
  Object.defineProperty(
    globalThis.crypto ?? (globalThis.crypto = {} as Crypto),
    'randomUUID',
    {
      configurable: true,
      value: () =>
        `00000000-0000-0000-0000-${(uuidCounter += 1)
          .toString()
          .padStart(
            12,
            '0'
          )}` as `${string}-${string}-${string}-${string}-${string}`,
    }
  );
}
