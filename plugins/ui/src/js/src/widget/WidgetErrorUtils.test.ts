import { MixedPanelsError } from '../errors';
import {
  getErrorName,
  getErrorMessage,
  getErrorShortMessage,
  getErrorStack,
  getErrorAction,
} from './WidgetErrorUtils';
import { WidgetError } from './WidgetTypes';

const longMessage =
  'This is a test error message\nWith a really long message\nThat spans multiple lines';
const testAction = jest.fn();
const error = new Error('Test error');
const widgetError = { name: 'WidgetError', message: 'Widget test error' };
const widgetErrorWithStack: WidgetError = {
  name: 'WidgetStackError',
  message: longMessage,
  stack: 'Test stack',
};
const errorWithAction = {
  name: 'ActionError',
  message: 'Action test error',
  action: {
    title: 'Widget Action',
    action: testAction,
  },
};
const mixedPanelsError = new MixedPanelsError('Mixed error');
const emptyObject = {};
const strError = 'String Error';

describe('getErrorName', () => {
  it('returns the name of the error', () => {
    expect(getErrorName(error)).toBe('Error');
    expect(getErrorName(widgetError)).toBe('WidgetError');
    expect(getErrorName(widgetErrorWithStack)).toBe('WidgetStackError');
    expect(getErrorName(errorWithAction)).toBe('ActionError');
    expect(getErrorName(mixedPanelsError)).toBe('MixedPanelsError');
  });

  it('returns "Unknown error" for an unknown error', () => {
    expect(getErrorName(emptyObject)).toBe('Unknown error');
    expect(getErrorName(strError)).toBe('Unknown error');
  });
});

describe('getErrorMessage', () => {
  it('returns the message of the error', () => {
    expect(getErrorMessage(error)).toBe('Test error');
    expect(getErrorMessage(widgetError)).toBe('Widget test error');
    expect(getErrorMessage(widgetErrorWithStack)).toBe(longMessage);
    expect(getErrorMessage(errorWithAction)).toBe('Action test error');
    expect(getErrorMessage(mixedPanelsError)).toBe('Mixed error');
    expect(getErrorMessage(strError)).toBe('String Error');
  });

  it('returns "Unknown error" for an unknown error', () => {
    expect(getErrorMessage(emptyObject)).toBe('Unknown error');
  });
});

describe('getErrorShortMessage', () => {
  it('returns the short message of the error', () => {
    expect(getErrorShortMessage(error)).toBe('Test error');
    expect(getErrorShortMessage(widgetError)).toBe('Widget test error');
    expect(getErrorShortMessage(widgetErrorWithStack)).toBe(
      'This is a test error message'
    );
    expect(getErrorShortMessage(errorWithAction)).toBe('Action test error');
    expect(getErrorShortMessage(mixedPanelsError)).toBe('Mixed error');
    expect(getErrorShortMessage(strError)).toBe('String Error');
  });

  it('returns "Unknown error" for an unknown error', () => {
    expect(getErrorShortMessage(emptyObject)).toBe('Unknown error');
  });
});

describe('getErrorStack', () => {
  it('returns the stack of the error', () => {
    expect(getErrorStack(error)).toContain(
      'Error: Test error\n    at Object.<anonymous>'
    );
    expect(getErrorStack(widgetError)).toBe('');
    expect(getErrorStack(widgetErrorWithStack)).toBe('Test stack');
    expect(getErrorStack(errorWithAction)).toBe('');
    expect(getErrorStack(mixedPanelsError)).toContain(
      'MixedPanelsError: Mixed error\n    at Object.<anonymous>'
    );
    expect(getErrorStack(strError)).toBe('');
    expect(getErrorStack(emptyObject)).toBe('');
  });
});

describe('getErrorAction', () => {
  it('returns the action of the error', () => {
    expect(getErrorAction(error)).toBeNull();
    expect(getErrorAction(widgetError)).toBeNull();
    expect(getErrorAction(widgetErrorWithStack)).toBeNull();
    expect(getErrorAction(errorWithAction)).toEqual({
      title: 'Widget Action',
      action: testAction,
    });
    expect(getErrorAction(mixedPanelsError)).toBeNull();
    expect(getErrorAction(strError)).toBeNull();
    expect(getErrorAction(emptyObject)).toBeNull();
  });
});
