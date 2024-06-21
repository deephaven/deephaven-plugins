import { Icon } from '@deephaven/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIcon, IconElementNode } from './utils/IconElementUtils';
import { ELEMENT_KEY } from './utils/ElementUtils';

export type IconElementViewProps = {
  element: IconElementNode;
};

export function IconElementView({
  element,
}: IconElementViewProps): JSX.Element | null {
  const { [ELEMENT_KEY]: name, props = {} } = element;
  const icon = getIcon(name);
  if (icon == null) {
    throw new Error(`Unknown icon ${name}`);
  }

  return (
    <Icon {...props}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FontAwesomeIcon icon={icon} />
    </Icon>
  );
}

export default IconElementView;
