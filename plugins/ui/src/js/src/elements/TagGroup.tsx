import {
  TagGroup as DHCTagGroup,
  TagGroupProps as DHCTagGroupProps,
} from '@deephaven/components';
import { useConditionalCallback } from './hooks';

export function TagGroup(
  props: Omit<DHCTagGroupProps<object>, 'onRemove' | 'renderEmptyState'> & {
    onRemove?: (keys: React.Key[]) => void;
    renderEmptyState?: JSX.Element;
  }
): JSX.Element {
  const { onRemove: propOnRemove, renderEmptyState, ...otherProps } = props;

  const onRemove = useConditionalCallback(
    propOnRemove != null,
    (keys: Set<React.Key>) => propOnRemove?.(Array.from(keys)),
    [propOnRemove]
  );

  return (
    <DHCTagGroup
      onRemove={onRemove}
      renderEmptyState={renderEmptyState ? () => renderEmptyState : undefined}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...otherProps}
    />
  );
}

export default TagGroup;
