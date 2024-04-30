import React, { CSSProperties, useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { WidgetComponentProps } from '@deephaven/plugin';

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
  width: "100%"
};

export function {{ cookiecutter.__js_plugin_view_obj }}(props: WidgetComponentProps): JSX.Element {
  const { fetch } = props;
  const [text, setText] = useState<string>("Call send_message on the object and the message will appear here.");
  const dh = useApi();

  useEffect(() => {
    async function init() {
       // Fetch the widget from the server
      const widget = await fetch();

      // Add an event listener to the widget to listen for messages from the server
      widget.addEventListener<Widget>(
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
    <div className="{{ cookiecutter.__js_plugin_view_class }}" style={{ "{" }}{{ cookiecutter.__js_plugin_view_obj_style }}{{ "}" }}>
      {text}
    </div>
  );
}

export default {{ cookiecutter.__js_plugin_view_obj }};
