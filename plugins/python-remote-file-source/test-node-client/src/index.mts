import fs from 'node:fs';
import assert from 'node:assert';
import path from 'node:path';
import { initDh, initPlugin } from './utils.mjs';
import { PythonModuleMap } from './PythonModuleMap.mjs';

console.log('Node.js version:', process.version);

const SERVER_URL = new URL('http://localhost:10000/');
const PSK = 'plugins.repo.test' as const;
const TEST_WORKSPACE_PATH = path.resolve(import.meta.dirname, '../workspace');

const TEST_RELATIVE_IMPORTS_SOURCE = await fs.promises.readFile(
  path.join(TEST_WORKSPACE_PATH, 'test_relative_imports.py'),
  'utf-8'
);
const TEST_ABSOLUTE_IMPORTS_SOURCE = await fs.promises.readFile(
  path.join(TEST_WORKSPACE_PATH, 'test_absolute_imports.py'),
  'utf-8'
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
