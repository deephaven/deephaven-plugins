import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { {{ cookiecutter.__js_plugin_view_obj }} } from './{{ cookiecutter.__js_plugin_view_obj }}';

// Register the plugin with Deephaven
export const {{ cookiecutter.__js_plugin_obj }}: ElementPlugin = {
  // The name of the plugin
  name: '{{ cookiecutter.javascript_project_name }}',
  // The type of plugin - this will generally be ELEMENT_PLUGIN
  type: PluginType.ELEMENT_PLUGIN,
  // The mapping of names to React elements for the plugin. This should match the value returned by `name`
  // in {{ cookiecutter.__type_name }} in {{ cookiecutter.__type_file_name }}.py
  mapping: {'{{ cookiecutter.__element_name }}': null}
};

export default {{ cookiecutter.__js_plugin_obj }};
