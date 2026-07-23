import { render, screen } from '@testing-library/react';
import { DndKitCore, DndKitSortable } from '@deephaven/iris-grid';
import { ColumnRow } from './ColumnRow';

const { DndContext } = DndKitCore;
const { SortableContext } = DndKitSortable;

function renderColumnRow(
  props: Partial<React.ComponentProps<typeof ColumnRow>> = {}
): void {
  const id = props.id ?? 'col-1';
  render(
    <DndContext>
      <SortableContext items={[id]}>
        <ColumnRow
          id={id}
          name="price"
          container="rollup-rows"
          onDelete={() => undefined}
          {...props}
        />
      </SortableContext>
    </DndContext>
  );
}

describe('ColumnRow stale passthrough', () => {
  it('renders a normal (non-stale) label by default', () => {
    renderColumnRow({ name: 'price' });
    expect(screen.getByText('price')).not.toHaveClass('pivot-column-name--stale');
  });

  it('renders a stale label when isStale is true', () => {
    renderColumnRow({ name: 'gone', isStale: true });
    const label = screen.getByText('gone');
    expect(label).toHaveClass('pivot-column-name', 'pivot-column-name--stale');
  });

  it('renders a normal label when isStale is false', () => {
    renderColumnRow({ name: 'region', isStale: false });
    expect(screen.getByText('region')).not.toHaveClass(
      'pivot-column-name--stale'
    );
  });
});
