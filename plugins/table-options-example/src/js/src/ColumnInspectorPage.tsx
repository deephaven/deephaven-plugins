import { Button } from '@deephaven/components';
import { type IrisGridSidebarPageProps } from '@deephaven/iris-grid';

/**
 * Minimal `configPage` demo. Receives `{ model, onBack }` from
 * `IrisGrid`'s page switch (see `IrisGridSidebarPageProps`).
 */
export function ColumnInspectorPage({
  model,
  onBack,
}: IrisGridSidebarPageProps): JSX.Element {
  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <h5>Column Inspector</h5>
      <p>
        This page is contributed by
        `@deephaven/js-plugin-table-options-example`.
      </p>
      <p>
        The current model exposes <strong>{model.columns.length}</strong> column
        {model.columns.length === 1 ? '' : 's'}.
      </p>
      <Button kind="secondary" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

export default ColumnInspectorPage;
