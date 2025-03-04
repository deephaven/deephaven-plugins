import {
  ColorEditor as DHCColorEditor,
  ColorEditorProps as DHCColorEditorProps,
} from '@deephaven/components';

export function ColorEditor(props: DHCColorEditorProps): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCColorEditor {...props} />
  );
}

export default ColorEditor;
