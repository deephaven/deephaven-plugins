import { RemoveButton, RowLabel, StaticGrip } from './rowParts';

/** Static (non-dnd) rendering of a column row for use inside DragOverlay. */
export function ColumnRowPreview({
  name,
  invalid = false,
}: {
  name: string;
  invalid?: boolean;
}): JSX.Element {
  return (
    <div
      className={`pivot-row pivot-row--dragging${
        invalid ? ' pivot-drag-invalid' : ''
      }`}
    >
      <RowLabel>{name}</RowLabel>
      <RemoveButton />
      <StaticGrip />
    </div>
  );
}

export default ColumnRowPreview;
