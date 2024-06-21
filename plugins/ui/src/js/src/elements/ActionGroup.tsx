import {
  ActionGroup as DHActionGroup,
  ActionGroupProps as DHActionGroupProps,
} from '@deephaven/components';
import {
  SerializedSelectionProps,
  useSelectionProps,
} from './hooks/useSelectionProps';

export type SerializedActionGroupProps<T> = Omit<
  DHActionGroupProps<T>,
  'selectionMode' | 'onChange' | 'onSelectionChange'
> &
  SerializedSelectionProps;

export function ActionGroup<T>({
  selectionMode: selectionModeMaybeUppercase,
  onChange: serializedOnChange,
  onSelectionChange: serializedOnSelectionChange,
  ...props
}: SerializedActionGroupProps<T>): JSX.Element {
  const { selectionMode, onChange, onSelectionChange } = useSelectionProps({
    selectionMode: selectionModeMaybeUppercase,
    onChange: serializedOnChange,
    onSelectionChange: serializedOnSelectionChange,
  });

  return (
    <DHActionGroup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      selectionMode={selectionMode}
      onChange={onChange}
      onSelectionChange={onSelectionChange}
    />
  );
}

export default ActionGroup;
