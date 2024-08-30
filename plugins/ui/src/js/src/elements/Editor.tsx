import { useCallback, useMemo } from 'react';
import { Editor as DHCEditor } from '@deephaven/console';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

type EditorProps = {
  language: string;

  /** The initial value of the model. */
  defaultValue?: string;

  /** The current value of the model. */
  value?: string;

  /** Additional settings for the editor. */
  settings?: Record<string, unknown>;

  /**
   * Triggered when the model has been updated.
   * TODO: This should probably use document diffs to save bandwidth. Not that big a deal for now.
   */
  onChange?: (value: string) => Promise<void>;
};

export function Editor(props: EditorProps): JSX.Element {
  const {
    defaultValue = '',
    language,
    settings: propSettings,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = props;

  const [value, onChange] = useDebouncedOnChange(
    propValue ?? defaultValue,
    propOnChange
  );

  const settings = useMemo(
    () => ({
      ...propSettings,
      value,
      language,
    }),
    [language, propSettings, value]
  );

  const handleEditorInitialized = useCallback(
    (editor: any) => {
      editor.onDidChangeModelContent((change: any) => {
        const newValue = editor.getModel().getValue();
        console.log('Editor change event', editor, change, newValue);
        onChange(newValue);
      });
    },
    [onChange]
  );

  return (
    <DHCEditor
      settings={settings}
      onEditorInitialized={handleEditorInitialized}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

Editor.displayName = 'Editor';

export default Editor;
