import React, {useState} from 'react';
import { Button, TextField } from '@deephaven/components';

// Create a custom style for the component
export const {{ cookiecutter.__js_plugin_view_obj_style }}: CSSProperties = {
  // CSS variables can be used to style the component according to the theme
  color: "var(--dh-color-purple-700)",
  fontSize: "x-large",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  width: "100%",
  flexDirection: "column"
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function {{ cookiecutter.__js_plugin_view_obj }}(
  props: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element {
    const [formText, setFormText] = useState('');

   const {
       text,
       callback,
   } = props;

  return (
    <div style={{ "{" }}{{ cookiecutter.__js_plugin_view_obj_style }}{{ "}" }}>
      <div>{text}</div>
      <div>Send a message to the server:</div>
      <TextField
          value={formText}
          onChange={(value) => setFormText(value)}
          marginBottom='size-50'
      />
      <Button
        kind='primary'
        onClick={() => {
          // Send the message to the server via the callback
          callback(formText)
        }}>
        Send
      </Button>
    </div>
  );
}
