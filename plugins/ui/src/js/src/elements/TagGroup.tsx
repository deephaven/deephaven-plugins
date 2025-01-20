import {
  TagGroup as DHCAccordion,
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

  const renderEmptyStateProp = renderEmptyState
    ? { renderEmptyState: () => renderEmptyState }
    : {};

  return (
    <DHCAccordion
      onRemove={onRemove}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...renderEmptyStateProp}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...otherProps}
    />
  );
}

export default TagGroup;
