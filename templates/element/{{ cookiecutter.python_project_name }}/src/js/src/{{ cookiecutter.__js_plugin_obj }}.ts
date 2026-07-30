import { type ElementPlugin, PluginType } from '@deephaven/plugin';
import {{ cookiecutter.__js_plugin_view_obj }} from './{{ cookiecutter.__js_plugin_view_obj }}';

// An element plugin can optionally handle events sent from the server via
// `use_send_event`. This is the same mechanism used by built-in deephaven.ui
// events, which are namespaced with `deephaven.ui` (e.g. `deephaven.ui.toast`).
// Plugins should namespace their own events the same way, using their package
// namespace as the prefix. Adding an `eventMapping` is
// optional - leave it as an empty map if your plugin does not handle events.
// Note that on the server side, `use_send_event` must be called from the render
// thread (see https://deephaven.io/core/ui/docs/hooks/use_render_queue/).
type ElementPluginWithEvents = ElementPlugin & {
  eventMapping: Record<string, (params: Record<string, unknown>) => void>;
};

// Register the plugin with Deephaven
export const {{ cookiecutter.__js_plugin_obj }}: ElementPluginWithEvents = {
  // The name of the plugin
  name: '{{ cookiecutter.javascript_project_name }}',
  // The type of plugin - this will generally be ELEMENT_PLUGIN
  type: PluginType.ELEMENT_PLUGIN,
  // The mapping of names to React elements for the plugin. This should match the value returned by `name`
  // in {{ cookiecutter.__component_name }} in {{ cookiecutter.__component_name }}.py
  mapping: {
    '{{ cookiecutter.__element_name }}':
      {{ cookiecutter.__js_plugin_view_obj }},
  },
  // Optional: map event names to handlers to react to events sent from the server
  // via `use_send_event`. The event name must match the name passed to `use_send_event`,
  // and should be namespaced with your package namespace to avoid collisions.
  // Leave it as an empty map (`{}`) if your plugin does not handle events.
  // This example handler shows an alert with the message sent from the server. It is
  // triggered by the `{{ cookiecutter.__event_sender_name }}` function in {{ cookiecutter.__component_name }}.py.
  eventMapping: {
    '{{ cookiecutter.__py_namespace }}.event': (
      params: Record<string, unknown>
    ) => {
      // eslint-disable-next-line no-alert
      window.alert(String(params.message ?? 'Event received from the server'));
    },
  },
};

export default {{ cookiecutter.__js_plugin_obj }};
