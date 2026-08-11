import { render, screen } from '@testing-library/react';
import { RowLabel } from './rowParts';

describe('RowLabel stale styling', () => {
  it('renders the default column-name label without the stale modifier', () => {
    render(<RowLabel>price</RowLabel>);
    const label = screen.getByText('price');
    expect(label).toHaveClass('pivot-row-label', 'pivot-column-name');
    expect(label).not.toHaveClass('pivot-column-name--stale');
  });

  it('adds the stale modifier when `stale` is true', () => {
    render(<RowLabel stale>gone</RowLabel>);
    const label = screen.getByText('gone');
    expect(label).toHaveClass(
      'pivot-row-label',
      'pivot-column-name',
      'pivot-column-name--stale'
    );
  });

  it('does not add the stale modifier when `stale` is explicitly false', () => {
    render(<RowLabel stale={false}>here</RowLabel>);
    expect(screen.getByText('here')).not.toHaveClass(
      'pivot-column-name--stale'
    );
  });

  it('keeps the non-column-name variant (columnName=false) unstyled by default', () => {
    render(<RowLabel columnName={false}>Sum</RowLabel>);
    const label = screen.getByText('Sum');
    expect(label).toHaveClass('pivot-row-label');
    expect(label).not.toHaveClass('pivot-column-name');
    expect(label).not.toHaveClass('pivot-column-name--stale');
  });
});
