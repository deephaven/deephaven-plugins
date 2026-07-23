import { defaultTheme, Provider } from '@adobe/react-spectrum';
import { render, screen } from '@testing-library/react';
import { DndKitCore, DndKitSortable } from '@deephaven/iris-grid';
import {
  AggregateSelectRow,
  type AggregateSelectRowProps,
} from './aggregateRows';

const { DndContext } = DndKitCore;
const { SortableContext } = DndKitSortable;

// The Spectrum Picker inside AggregateSelectRow observes its size on mount;
// jsdom has no ResizeObserver and deephaven-plugins' Jest setup doesn't mock it.
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe(): void {
      // no-op
    }

    unobserve(): void {
      // no-op
    }

    disconnect(): void {
      // no-op
    }
  };
});

function renderRow(overrides: Partial<AggregateSelectRowProps> = {}): void {
  const props: AggregateSelectRowProps = {
    id: 'agg-Sum',
    operation: 'Sum',
    // `present` is in `columnTypes`; `gone` is not, so it should render stale.
    columnLabels: ['present', 'gone'],
    availableOperations: ['Sum', 'Avg'],
    columnTypes: { present: 'int' },
    onOperationChange: () => undefined,
    onDelete: () => undefined,
    ...overrides,
  };
  render(
    <Provider theme={defaultTheme}>
      <DndContext>
        <SortableContext items={[props.id]}>
          <AggregateSelectRow {...props} />
        </SortableContext>
      </DndContext>
    </Provider>
  );
}

describe('AggregateSelectRow stale wiring', () => {
  it('flags plain column labels (no onDeleteColumn) missing from columnTypes as stale', () => {
    renderRow();
    expect(screen.getByText('gone')).toHaveClass('pivot-column-name--stale');
    expect(screen.getByText('present')).not.toHaveClass(
      'pivot-column-name--stale'
    );
  });

  it('flags non-draggable removable column rows missing from columnTypes as stale', () => {
    renderRow({
      onDeleteColumn: () => undefined,
      columnsDraggable: false,
    });
    expect(screen.getByText('gone')).toHaveClass('pivot-column-name--stale');
    expect(screen.getByText('present')).not.toHaveClass(
      'pivot-column-name--stale'
    );
  });

  it('flags draggable column rows missing from columnTypes as stale', () => {
    renderRow({
      onDeleteColumn: () => undefined,
      columnsDraggable: true,
    });
    expect(screen.getByText('gone')).toHaveClass('pivot-column-name--stale');
    expect(screen.getByText('present')).not.toHaveClass(
      'pivot-column-name--stale'
    );
  });
});
