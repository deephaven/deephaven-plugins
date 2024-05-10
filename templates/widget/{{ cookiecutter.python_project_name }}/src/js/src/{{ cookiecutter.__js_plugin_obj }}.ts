import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { {{ cookiecutter.__js_plugin_view_obj }} } from './{{ cookiecutter.__js_plugin_view_obj }}';

// Register the plugin with Deephaven
export const {{ cookiecutter.__js_plugin_obj }}: WidgetPlugin = {
  // The name of the plugin
  name: '{{ cookiecutter.javascript_project_name }}',
  // The type of plugin - this will generally be WIDGET_PLUGIN
  type: PluginType.WIDGET_PLUGIN,
  // The supported types for the plugin. This should match the value returned by `name`
  // in {{ cookiecutter.__type_name }} in {{ cookiecutter.__type_file_name }}.py
  supportedTypes: '{{ cookiecutter.__registered_object_name }}',
  // The component to render for the plugin
  component: {{ cookiecutter.__js_plugin_view_obj }},
  // The icon to display for the plugin
  icon: vsGraph,
};

export default {{ cookiecutter.__js_plugin_obj }};
