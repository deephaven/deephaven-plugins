import fs from 'node:fs';
import path from 'node:path';
import { loadDhModules, NodeHttp2gRPCTransport } from '@deephaven/jsapi-nodejs';
import { dh as DhType } from '@deephaven/jsapi-types';
import type { JsonRpcSuccess } from './jsonRpc.mjs';

export const AUTH_HANDLER_TYPE_PSK =
  'io.deephaven.authentication.psk.PskAuthenticationHandler';

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
 * Get a JsonRpc success response message to send module source to the server.
 * @param id The id of the request to respond to.
 * @param source The source code of the module, or undefined for no source.
 * @param filepath The path to the module source file (defaults to '<string>').
 * @returns A JsonRpc success response message.
 */
export function createModuleSourceResponseMessage(
  id: string,
  source: string | undefined,
  filepath: string = '<string>'
): JsonRpcSuccess {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      filepath,
      source,
    },
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
  const storageDir = path.join(__dirname, '..', 'tmp');

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
