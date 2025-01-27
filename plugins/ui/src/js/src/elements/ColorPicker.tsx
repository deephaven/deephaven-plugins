import {
  ColorPicker as DHCColorPicker,
  ColorPickerProps as DHCColorPickerProps,
  ColorEditor as DHCColorEditor,
} from '@deephaven/components';

export function ColorPicker(props: DHCColorPickerProps): JSX.Element {
  const { children, ...otherProps } = props;

  if (Array.isArray(children) && children.length === 0) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <DHCColorPicker {...otherProps}>
        <DHCColorEditor />
      </DHCColorPicker>
    );
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCColorPicker {...otherProps}>{children}</DHCColorPicker>
  );
}

export default ColorPicker;
