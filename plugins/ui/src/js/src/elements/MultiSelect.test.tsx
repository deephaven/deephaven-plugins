import React from 'react';
import { render } from '@testing-library/react';
import { MultiSelect } from './MultiSelect';
import type { SerializedMultiSelectProps } from './hooks/useMultiSelectProps';

// Mock ObjectView and UriObjectView before they trigger deep dependency chains
jest.mock('./ObjectView', () => jest.fn(() => null));
jest.mock('./UriObjectView', () => jest.fn(() => null));
jest.mock('../widget/WidgetErrorUtils', () => ({
  getErrorShortMessage: jest.fn((e: Error) => e.message),
}));

// Mock all heavy dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({})),
}));

jest.mock('./hooks/useMultiSelectProps', () => ({
  useMultiSelectProps: jest.fn((props: Record<string, unknown>) => {
    const {
      onChange,
      onSelectionChange,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      ...rest
    } = props;
    return rest;
  }),
}));

jest.mock('./hooks/useObjectViewObject', () => ({
  useObjectViewObject: jest.fn(() => ({
    widget: null,
    api: null,
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@deephaven/components', () => ({
  MultiSelect: jest.fn(
    ({ children }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid="dh-multi-select">{children}</div>
    )
  ),
}));

jest.mock('@deephaven/jsapi-components', () => ({
  MultiSelect: jest.fn(() => <div data-testid="dh-multi-select-jsapi" />),
}));

jest.mock('@deephaven/react-hooks', () => ({
  isElementOfType: jest.fn(() => false),
}));

jest.mock('@deephaven/jsapi-bootstrap', () => ({
  ApiContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

jest.mock('@deephaven/redux', () => ({
  getSettings: jest.fn(() => ({})),
}));

describe('MultiSelect', () => {
  it('renders DHMultiSelect with children when not an ObjectView', () => {
    const props = {
      children: ['Option A', 'Option B'],
      label: 'Test',
    } as unknown as SerializedMultiSelectProps;

    const { getByTestId } = render(
      <MultiSelect
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    );
    expect(getByTestId('dh-multi-select')).toBeTruthy();
  });

  it('renders loading state when ObjectView with no table', () => {
    const { isElementOfType } = jest.requireMock('@deephaven/react-hooks');
    isElementOfType.mockReturnValue(true);

    const { useObjectViewObject } = jest.requireMock(
      './hooks/useObjectViewObject'
    );
    useObjectViewObject.mockReturnValue({
      widget: null,
      api: null,
      isLoading: true,
      error: null,
    });

    const props = {
      children: React.createElement('div'),
      label: 'Loading test',
    } as unknown as SerializedMultiSelectProps;

    const { getByTestId } = render(
      <MultiSelect
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    );
    const el = getByTestId('dh-multi-select');
    expect(el).toBeTruthy();
  });

  it('renders error state when ObjectView has error', () => {
    const { isElementOfType } = jest.requireMock('@deephaven/react-hooks');
    isElementOfType.mockReturnValue(true);

    const { useObjectViewObject } = jest.requireMock(
      './hooks/useObjectViewObject'
    );
    useObjectViewObject.mockReturnValue({
      widget: null,
      api: null,
      isLoading: false,
      error: new Error('Test error'),
    });

    const props = {
      children: React.createElement('div'),
      label: 'Error test',
    } as unknown as SerializedMultiSelectProps;

    const { getByTestId } = render(
      <MultiSelect
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    );
    const el = getByTestId('dh-multi-select');
    expect(el).toBeTruthy();
  });

  it('renders JSApi MultiSelect when ObjectView has table and api', () => {
    const { isElementOfType } = jest.requireMock('@deephaven/react-hooks');
    isElementOfType.mockReturnValue(true);

    const { useObjectViewObject } = jest.requireMock(
      './hooks/useObjectViewObject'
    );
    useObjectViewObject.mockReturnValue({
      widget: {},
      api: {},
      isLoading: false,
      error: null,
    });

    const props = {
      children: React.createElement('div'),
      label: 'JSApi test',
    } as unknown as SerializedMultiSelectProps;

    const { getByTestId } = render(
      <MultiSelect
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    );
    expect(getByTestId('dh-multi-select-jsapi')).toBeTruthy();
  });
});
