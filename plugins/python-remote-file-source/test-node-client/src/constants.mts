import path from 'node:path';

export const AUTH_HANDLER_TYPE_PSK =
  'io.deephaven.authentication.psk.PskAuthenticationHandler';

export const CN_ID = '12345' as const;

export const DH_PYTHON_REMOTE_SOURCE_PLUGIN_NAME =
  '@deephaven/js-plugin-python-remote-file-source';

// Alias for `dh.Widget.EVENT_MESSAGE` to avoid having to pass in a `dh` instance
// to util functions that only need the event name.
export const DH_WIDGET_EVENT_MESSAGE = 'message' as const;

export const PLUGIN_VARIABLE = '__deephaven_vscode' as const;

export const PLUGIN_CLASS = 'DeephavenPythonRemoteFileSourcePlugin' as const;

export const PLUGIN_QUERY = {
  name: PLUGIN_VARIABLE,
  type: PLUGIN_CLASS,
};

export const DH_PYTHON_REMOTE_SOURCE_PLUGIN_INIT_SCRIPT = [
  'try:',
  `    ${PLUGIN_VARIABLE}`,
  'except NameError:',
  '    from deephaven.python_remote_file_source import PluginObject as DeephavenRemoteFileSourcePlugin',
  `    ${PLUGIN_VARIABLE} = DeephavenRemoteFileSourcePlugin()`,
].join('\n');

export const SERVER_URL = new URL('http://localhost:10000/');
export const PSK = 'plugins.repo.test' as const;
export const TEST_WORKSPACE_PATH = path.resolve(
  import.meta.dirname,
  '../workspace'
);
