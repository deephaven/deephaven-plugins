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
