import React, { CSSProperties, useState } from 'react';
import { Button, TextField } from '@deephaven/components';

// Create a custom style for the component
export const {{ cookiecutter.__js_plugin_view_obj_style }}: CSSProperties = {
  // CSS variables can be used to style the component according to the theme
  color: 'var(--dh-color-purple-700)',
  fontSize: 'x-large',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  flexDirection: 'column',
};

/**
 * A React component that displays a message and allows the user to send a message to the server.
 * @param text The text to display in the component.
 * @param onClick The callback function to call when the button is clicked.
 * @returns A JSX element representing the component.
 */
export default function {{ cookiecutter.__js_plugin_view_obj }}({
  text,
  onClick,
}: {
  text: string;
  onClick: (value: string) => Promise<void>;
}): JSX.Element {
  // State to hold the text input value until it is sent to the server
  const [formText, setFormText] = useState('');

  return (
    <div style={{ "{" }}{{ cookiecutter.__js_plugin_view_obj_style }}{{ "}" }}>
      <div>{text}</div>
      <div>Send a message to the server:</div>
      <TextField
        value={formText}
        onChange={(value: string) => setFormText(value)}
        marginBottom="size-50"
        aria-label="Message input"
      />
      <Button
        kind="primary"
        onClick={e => {
          // Send the message to the server via the callback
          onClick(formText);
        }}
      >
        Send
      </Button>
    </div>
  );
}
