import assert from 'node:assert';
import { PSK, SERVER_URL, TEST_WORKSPACE_PATH } from './constants.mjs';
import { PythonModuleMap } from './PythonModuleMap.mjs';
import { getWorkspaceFileSource, initDh, initPlugin } from './utils.mjs';

console.log('Node.js version:', process.version);

const TEST_RELATIVE_IMPORTS_SOURCE = await getWorkspaceFileSource(
  'test_relative_imports.py'
);
const TEST_ABSOLUTE_IMPORTS_SOURCE = await getWorkspaceFileSource(
  'test_absolute_imports.py'
);

const pythonModuleMap = await PythonModuleMap.create(TEST_WORKSPACE_PATH);
const { session } = await initDh(SERVER_URL, PSK);
const { runCode } = await initPlugin(pythonModuleMap, session);

console.log('Running test_relative_imports.py');
const result = await runCode(TEST_RELATIVE_IMPORTS_SOURCE);
assert.strictEqual(result.changes.created[0].title, 'simple_ticking');

console.log('Running test_absolute_imports.py');
const result2 = await runCode(TEST_ABSOLUTE_IMPORTS_SOURCE);
assert.strictEqual(result2.changes.created[0].title, 'simple_ticking_absolute');

process.exit(0);
