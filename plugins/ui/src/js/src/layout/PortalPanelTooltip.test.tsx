import React from 'react';
import { render } from '@testing-library/react';
import PortalPanelTooltip from './PortalPanelTooltip';

describe('PortalPanelTooltip', () => {
  const descriptor = {
    type: 'test.type',
    metadata: {
      name: 'test_component',
    },
  };

  it('renders the formatted type name', () => {
    const { getByText } = render(<PortalPanelTooltip metadata={descriptor} />);
    expect(getByText('Component Name')).toBeInTheDocument();
    expect(getByText('test_component')).toBeInTheDocument();
  });
});
