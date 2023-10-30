import React from 'react';
import { render } from '@testing-library/react';
import { LayoutUtils } from '@deephaven/dashboard';
import ReactPanel, { ReactPanelProps } from './ReactPanel';

// Mock LayoutUtils, useListener, and PanelEvent from @deephaven/dashboard package
jest.mock('@deephaven/dashboard', () => {
  const DashboardActual = jest.requireActual('@deephaven/dashboard');
  return {
    ...DashboardActual,
    LayoutUtils: {
      getComponentName: jest.fn(),
      openComponent: jest.fn(),
      closeComponent: jest.fn(),
    },
    useListener: jest.fn(),
    __esModule: true,
    default: jest.fn(),
  };
});
jest.mock('./useLayout', () => jest.fn(() => ({ root: {}, eventHub: {} })));

beforeEach(() => {
  jest.clearAllMocks();
});

function makeReactPanel({
  children,
  metadata,
  onClose,
  onOpen,
  title = 'test title',
}: Partial<ReactPanelProps> = {}) {
  return (
    <ReactPanel
      metadata={metadata}
      onClose={onClose}
      onOpen={onOpen}
      title={title}
    >
      {children}
    </ReactPanel>
  );
}

it('opens panel on mount, and closes panel on unmount', async () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();
  const { unmount } = render(makeReactPanel({ onOpen, onClose }));
  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).not.toHaveBeenCalled();

  unmount();

  expect(LayoutUtils.openComponent).toHaveBeenCalledTimes(1);
  expect(LayoutUtils.closeComponent).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});
