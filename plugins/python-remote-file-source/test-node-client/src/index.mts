import path from 'node:path';
import { initDh, initPlugin } from './utils.mjs';
import PythonModuleMap from './PythonModuleMap.js';

console.log('Node.js version:', process.version);

const SERVER_URL = new URL('http://localhost:10000/');
const PSK = 'plugins.repo.test' as const;
const TEST_WORKSPACE_PATH = path.resolve(import.meta.dirname, '../workspace');

const pythonModuleMap = await PythonModuleMap.create(TEST_WORKSPACE_PATH);

const { session } = await initDh(SERVER_URL, PSK);

const plugin = await initPlugin(pythonModuleMap, session);

// session.runCode(
//   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
// );
// session.runCode(
//   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
// );

// process.exit(0);
