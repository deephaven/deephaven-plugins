/**
 * Example of consuming DH Jsapi from an ESM module.
 */
import path from 'node:path';
import { dh as DhType } from '@deephaven/jsapi-types';
import {
  JsonRpcRequest,
  JsonRpcSuccess,
  type JsonRpcSetConnectionIdRequest,
} from './jsonRpc.mjs';
import {
  createModuleSourceResponseMessage,
  DH_PYTHON_REMOTE_SOURCE_PLUGIN_INIT_SCRIPT,
  getSetExecutionContextScript,
  initDh,
  PLUGIN_QUERY,
} from './utils.mjs';
import PythonModuleMap from './PythonModuleMap.js';

console.log('Node.js version:', process.version);

if (typeof globalThis.__dirname === 'undefined') {
  globalThis.__dirname = import.meta.dirname;
}

const SERVER_URL = new URL('http://localhost:10000/');
const PSK = 'plugins.repo.test' as const;
const TEST_WORKSPACE_PATH = path.resolve(__dirname, '../workspace');
const CN_ID = '1' as const;

const pythonModuleMap = await PythonModuleMap.create(TEST_WORKSPACE_PATH);

const { dh, session } = await initDh(SERVER_URL, PSK);

try {
  await session.runCode(DH_PYTHON_REMOTE_SOURCE_PLUGIN_INIT_SCRIPT);
  console.log('Initialized Deephaven VS Code local execution plugin.');

  const obj: DhType.Widget = await session.getObject(PLUGIN_QUERY);

  const msg: JsonRpcSetConnectionIdRequest = {
    jsonrpc: '2.0',
    id: CN_ID,
    method: 'set_connection_id',
  };

  obj.sendMessage(JSON.stringify(msg));

  obj.addEventListener<DhType.Widget>(
    dh.Widget.EVENT_MESSAGE,
    async ({ detail }) => {
      try {
        const message: JsonRpcRequest = JSON.parse(detail.getDataAsString());
        console.log('Received message from server:', message);
        if (message.method !== 'fetch_module') {
          return;
        }

        const [filepath, source] = await pythonModuleMap.getModuleSource(
          message.params.module_name
        );

        const response: JsonRpcSuccess = createModuleSourceResponseMessage(
          message.id,
          source,
          filepath
        );
        console.log('Sending response to server:', response);
        obj.sendMessage(JSON.stringify(response));
      } catch (e) {
        console.error('Error parsing message from server:', e);
      }
    }
  );

  await session.runCode(
    getSetExecutionContextScript(
      CN_ID,
      pythonModuleMap.getTopLevelModuleNames()
    )
  );

  // session.runCode(
  //   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
  // );
  // session.runCode(
  //   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
  // );
} catch (e) {
  console.log(e);
}

// process.exit(0);
