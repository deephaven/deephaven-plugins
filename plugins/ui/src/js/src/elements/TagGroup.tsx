import {
  TagGroup as DHCAccordion,
  TagGroupProps as DHCTagGroupProps,
} from '@deephaven/components';
import { useConditionalCallback } from './hooks';

export function TagGroup(
  props: DHCTagGroupProps<object> & {
    onRemove?: (keys: React.Key[]) => void;
  }
): JSX.Element {
  const { onRemove: propOnRemove, ...otherProps } = props;

  const onRemove = useConditionalCallback(
    propOnRemove != null,
    (keys: Set<React.Key>) => propOnRemove?.(Array.from(keys)),
    [propOnRemove]
  );

  return (
    <DHCAccordion
      onRemove={onRemove}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...otherProps}
    />
  );
}

export default TagGroup;
