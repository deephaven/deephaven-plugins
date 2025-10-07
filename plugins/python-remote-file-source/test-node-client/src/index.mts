import fs from 'node:fs';
import path from 'node:path';
import { initDh, initPlugin } from './utils.mjs';
import { PythonModuleMap } from './PythonModuleMap.mjs';
import { TestLogger } from './TestLogger.mjs';

console.log('Node.js version:', process.version);

const SERVER_URL = new URL('http://localhost:10000/');
const PSK = 'plugins.repo.test' as const;
const TEST_WORKSPACE_PATH = path.resolve(import.meta.dirname, '../workspace');

const aaa_source = await fs.promises.readFile(
  path.join(TEST_WORKSPACE_PATH, 'aaa', 'aaa1.py'),
  'utf-8'
);

const pythonModuleMap = await PythonModuleMap.create(TEST_WORKSPACE_PATH);

const { session } = await initDh(SERVER_URL, PSK);

const { runCode } = await initPlugin(pythonModuleMap, session);

const testLogger = new TestLogger(session);
await testLogger.start();

const result = await runCode(aaa_source);

await testLogger.stop();
console.log('result', testLogger.logItems);

process.exit(0);

// session.runCode(
//   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
// );
// session.runCode(
//   ['__deephaven_vscode.evict_module_cache()', 'import test_ws.bbb'].join('\n')
// );

// process.exit(0);
