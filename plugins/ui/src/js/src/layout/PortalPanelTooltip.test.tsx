import React from 'react';
import { render } from '@testing-library/react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import PortalPanelTooltip from './PortalPanelTooltip';

describe('PortalPanelTooltip', () => {
  const descriptor = {
    type: 'test.type',
  };

  const mockGlContainer = {
    getConfig: () => ({
      title: 'Test Title',
      variableName: 'test_component',
    }),
  } as DashboardPanelProps['glContainer'];

  it('renders the formatted type name', () => {
    const { getByText } = render(
      <PortalPanelTooltip glContainer={mockGlContainer} metadata={descriptor} />
    );
    expect(getByText('Component Name')).toBeInTheDocument();
    expect(getByText('test_component')).toBeInTheDocument();
  });
});
