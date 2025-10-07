import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { loadDhModules, NodeHttp2gRPCTransport } from '@deephaven/jsapi-nodejs';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Msg, type JsonRpcRequest, type JsonRpcResponse } from './jsonRpc.mjs';
import type PythonModuleMap from './PythonModuleMap.mjs';

export const AUTH_HANDLER_TYPE_PSK =
  'io.deephaven.authentication.psk.PskAuthenticationHandler';

const CN_ID = '12345' as const;

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

/**
 * Create a message handler for the given plugin that responds to fetch_module
 * requests using the given PythonModuleMap.
 * @param plugin The plugin widget to send responses to.
 * @param pythonModuleMap The PythonModuleMap to use for fetching module source.
 * @returns A message event handler function.
 */
export function createModuleSourceRequestHandler(
  plugin: DhType.Widget,
  pythonModuleMap: PythonModuleMap
) {
  return async ({ detail }: DhType.Event<DhType.Widget>): Promise<void> => {
    try {
      const message: JsonRpcRequest = JSON.parse(detail.getDataAsString());
      if (message.method !== 'fetch_module') {
        return;
      }

      const [filepath, source] = await pythonModuleMap.getModuleSource(
        message.params.module_name
      );

      plugin.sendMessage(
        JSON.stringify(Msg.moduleSourceResponse(message.id, source, filepath))
      );
    } catch (e) {
      console.error('Error parsing message from server:', e);
    }
  };
}

/**
 * Get a map of python module names to their file paths in the workspace.
 * @returns A map of module names to file paths.
 */
export async function getPythonModuleMaps(
  workspacePath: string
): Promise<[Set<string>, Map<string, string | null>]> {
  const workspaceEntries = await fs.promises.readdir(workspacePath, {
    recursive: true,
    withFileTypes: true,
  });

  const topLevelModuleNames = new Set<string>();
  const moduleMap = new Map<string, string | null>();

  for (const dirent of workspaceEntries) {
    const relativePath = path
      .join(dirent.parentPath, dirent.name)
      .replace(workspacePath, '');

    const moduleName = relativePath
      .slice(1)
      .replace(/\.py$/, '')
      .replaceAll(path.sep, '.');

    if (dirent.isDirectory()) {
      moduleMap.set(moduleName, null);
      if (!moduleName.includes('.')) {
        topLevelModuleNames.add(moduleName);
      }
      continue;
    }

    const fullPath = path.join(dirent.parentPath, dirent.name);
    moduleMap.set(moduleName, fullPath);
  }

  return [topLevelModuleNames, moduleMap];
}

/**
 * Gets a python script to set the execution context for the remote file source plugin.
 * This includes the connection id and the set of module fullnames that can be
 * loaded.
 * @param connectionId The connection id to set, or null to clear it.
 * @param moduleFullnames The set of module fullnames that can be loaded.
 * @returns A python script to set the execution context.
 */
export function getSetExecutionContextScript(
  connectionId: string,
  moduleFullnames: Iterable<string>
): string {
  const connectionIdStr = `'${connectionId}'`;
  const moduleFullnamesStr = `{${[...moduleFullnames]
    .map(modulePath => `"${modulePath}"`)
    .join(',')}}`;
  return `${PLUGIN_VARIABLE}.set_execution_context(${connectionIdStr}, ${moduleFullnamesStr})`;
}

/**
 * Initialize a Deephaven api, client, connection, and session.
 * @param serverUrl The URL of the Deephaven server.
 * @param psk The pre-shared key for authentication.
 * @param debug Whether to enable debug logging.
 * @returns The initialized dh, client, cn, and session.
 */
export async function initDh(
  serverUrl: URL,
  psk: string,
  debug: boolean = false
): Promise<{
  dh: typeof DhType;
  client: DhType.CoreClient;
  cn: DhType.IdeConnection;
  session: DhType.IdeSession;
}> {
  const storageDir = path.join(import.meta.dirname, '..', 'tmp');

  const dh = await loadDhModules({
    serverUrl,
    storageDir,
    targetModuleType: 'esm',
  });

  const client = new dh.CoreClient(serverUrl.href, {
    debug,
    transportFactory: NodeHttp2gRPCTransport.factory,
  });

  await client.login({
    type: AUTH_HANDLER_TYPE_PSK,
    token: psk,
  });

  console.log('Logged in to Deephaven server');

  const cn = await client.getAsIdeConnection();

  const session = await cn.startSession('python');

  return { dh, client, cn, session };
}

export async function initPlugin(
  pythonModuleMap: PythonModuleMap,
  session: DhType.IdeSession
): Promise<{ runCode: (code: string) => Promise<DhType.ide.CommandResult> }> {
  await session.runCode(DH_PYTHON_REMOTE_SOURCE_PLUGIN_INIT_SCRIPT);
  console.log('Initialized Deephaven VS Code local execution plugin.');

  const plugin: DhType.Widget = await session.getObject(PLUGIN_QUERY);
  plugin.addEventListener<DhType.Widget>(
    DH_WIDGET_EVENT_MESSAGE,
    createModuleSourceRequestHandler(plugin, pythonModuleMap)
  );

  // The connection id must be set on the plugin and match the id used in the
  // execution context in order for server plugin to request source from this
  // client.
  await setConnectionId(plugin, CN_ID);

  return {
    /**
     * Augmented runCode function that sets plugin execution context before
     * running DH code.
     */
    runCode: async (code: string): Promise<DhType.ide.CommandResult> => {
      await setExecutionContext(
        session,
        CN_ID,
        pythonModuleMap.getTopLevelModuleNames()
      );
      return session.runCode(code);
    },
  };
}

/**
 * Set the connection id and top level module names in the server execution context.
 * @param session The ide session to run the code in.
 * @param cnId connection id
 * @param topLevelModuleNames The set of top level module names in the workspace.
 */
async function setExecutionContext(
  session: DhType.IdeSession,
  cnId: string,
  topLevelModuleNames: ReadonlySet<string>
): Promise<void> {
  await session.runCode(
    getSetExecutionContextScript(cnId, topLevelModuleNames)
  );
}

/**
 * Send a set_connection_id request to the plugin and wait for a response.
 * @param plugin The plugin widget to send the request to.
 * @param id The connection id to set.
 */
export async function setConnectionId(
  plugin: DhType.Widget,
  id: string
): Promise<void> {
  const request = Msg.setConnectionId(id);

  const result = new Promise<void>((resolve, reject) => {
    const removeEventListener = plugin.addEventListener<DhType.Widget>(
      DH_WIDGET_EVENT_MESSAGE,
      async ({ detail }) => {
        try {
          const message: JsonRpcResponse | JsonRpcRequest = JSON.parse(
            detail.getDataAsString()
          );

          if ('id' in message && message.id === request.id) {
            console.log('Connection ID set:', message.id);
            resolve();
            removeEventListener();
          }
        } catch (err) {
          console.error('Error parsing message from server:', err);
          reject(err);
        }
      }
    );
  });

  plugin.sendMessage(JSON.stringify(request));

  return result;
}
