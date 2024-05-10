import React, { CSSProperties, useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { WidgetComponentProps } from '@deephaven/plugin';
import type { Widget } from '@deephaven/jsapi-types';

const log = Log.module('{{ cookiecutter.javascript_project_name }}.{{ cookiecutter.__js_plugin_view_obj }}');

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

export function {{ cookiecutter.__js_plugin_view_obj }}(props: WidgetComponentProps): JSX.Element {
  const { fetch } = props;
  const [text, setText] = useState<string>("Call send_message on the object and the message will appear here.");
  const [formText, setFormText] = useState('');
  const [widget, setWidget] = useState<Widget | null>(null);
  const dh = useApi();

  useEffect(() => {
    async function init() {
       // Fetch the widget from the server
      const fetched_widget = await fetch() as Widget;
      setWidget(fetched_widget);


      // Add an event listener to the widget to listen for messages from the server
      fetched_widget.addEventListener<Widget>(
          dh.Widget.EVENT_MESSAGE,
          ({ detail }) => {
            // When a message is received, update the text in the component
            const text = detail.getDataAsString();
            if (text) {
              setText(text);
            }
          }
      );
    }

    init();
  }, [dh, fetch]);

  return (
    <div style={{ "{" }}{{ cookiecutter.__js_plugin_view_obj_style }}{{ "}" }}>
      <div>{text}</div>
      <div>Send a message to the server:</div>
      <div>
        <input
          type="text"
          value={formText}
          onChange={(e) => setFormText(e.target.value)}
        />
        <button
          onClick={() => {
            // Send the message to the server via the widget
            if (widget) {
              widget.sendMessage(formText, []);
            }
          }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default {{ cookiecutter.__js_plugin_view_obj }};
