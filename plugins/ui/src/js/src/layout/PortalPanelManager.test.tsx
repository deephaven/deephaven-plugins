import React from 'react';
import { act, render } from '@testing-library/react';
import PortalPanelManager from './PortalPanelManager';

// Mock the usePortalOpenedListener and usePortalClosedListener functions
const mockUsePortalOpenedListener = jest.fn();
const mockUsePortalClosedListener = jest.fn();
jest.mock('./PortalPanelEvent', () => ({
  usePortalClosedListener: jest.fn((...args) => {
    mockUsePortalClosedListener(...args);
  }),
  usePortalOpenedListener: jest.fn((...args) => {
    mockUsePortalOpenedListener(...args);
  }),
}));

const mockProvider = jest.fn(({ children }) => children);
jest.mock('./PortalPanelManagerContext', () => ({
  PortalPanelManagerContext: {
    Provider: jest.fn(props => mockProvider(props)),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PortalPanelManager', () => {
  it('should call the usePortalOpenedListener and usePortalClosedListener with the correct callbacks', () => {
    // Render the PortalPanelManager component
    render(
      <PortalPanelManager>
        <div>Test</div>
      </PortalPanelManager>
    );

    // Verify that the usePortalOpenedListener and usePortalClosedListener functions are called with the correct callbacks
    expect(mockUsePortalOpenedListener).toHaveBeenCalledTimes(1);
    expect(mockUsePortalClosedListener).toHaveBeenCalledTimes(1);
  });

  it('should render the children wrapped in the PortalPanelManagerContext.Provider', () => {
    // Render the PortalPanelManager component with children
    const { getByText } = render(
      <PortalPanelManager>
        <div>Test</div>
      </PortalPanelManager>
    );

    // Verify that the children are rendered and wrapped in the PortalPanelManagerContext.Provider
    expect(getByText('Test')).toBeInTheDocument();
  });

  it('should add portals to the context when they are opened', () => {
    const mockContainer1 = { _config: { id: 'test-container-1' } };
    const mockElement1 = document.createElement('div');
    const mockContainer2 = { _config: { id: 'test-container-2' } };
    const mockElement2 = document.createElement('div');

    // Render the PortalPanelManager component
    render(
      <PortalPanelManager>
        <div>Test</div>
      </PortalPanelManager>
    );

    // Verify that the setPortals function is called when a portal is opened
    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({ value: new Map() })
    );
    mockProvider.mockClear();

    act(() => {
      mockUsePortalOpenedListener.mock.calls[0][1]({
        container: mockContainer1,
        element: mockElement1,
      });
    });

    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        value: new Map([[mockContainer1, mockElement1]]),
      })
    );
    mockProvider.mockClear();

    act(() => {
      mockUsePortalOpenedListener.mock.calls[0][1]({
        container: mockContainer2,
        element: mockElement2,
      });
    });

    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        value: new Map([
          [mockContainer1, mockElement1],
          [mockContainer2, mockElement2],
        ]),
      })
    );
    mockProvider.mockClear();

    // Verify the mock provider gets updated portals when portals are closed
    act(() => {
      mockUsePortalClosedListener.mock.calls[0][1]({
        container: mockContainer1,
      });
    });

    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        value: new Map([[mockContainer2, mockElement2]]),
      })
    );
    mockProvider.mockClear();

    // Close the final portal
    act(() => {
      mockUsePortalClosedListener.mock.calls[0][1]({
        container: mockContainer2,
      });
    });

    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({ value: new Map() })
    );
  });
});
