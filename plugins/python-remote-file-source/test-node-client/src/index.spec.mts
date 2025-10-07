import { beforeEach, describe, expect, it } from 'vitest';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { PSK, SERVER_URL, TEST_WORKSPACE_PATH } from './constants.mjs';
import PythonModuleMap from './PythonModuleMap.mjs';
import {
  assertServerIsReady,
  getWorkspaceFileSource,
  initDh,
  initPlugin,
} from './utils.mjs';

describe('Python remote file source plugin tests', () => {
  let runCode: (code: string) => Promise<DhType.ide.CommandResult>;

  beforeEach(async () => {
    await assertServerIsReady();

    const pythonModuleMap = await PythonModuleMap.create(TEST_WORKSPACE_PATH);
    const { session } = await initDh(SERVER_URL, PSK);
    runCode = (await initPlugin(pythonModuleMap, session)).runCode;
  });

  it('should resolve packages with relative imports', async () => {
    const testScript = await getWorkspaceFileSource('test_relative_imports.py');
    const result = await runCode(testScript);
    expect(result.changes.created[0].title).toBe('simple_ticking');
  });

  it('should resolve packages with absolute imports', async () => {
    const testScript = await getWorkspaceFileSource('test_absolute_imports.py');
    const result = await runCode(testScript);
    expect(result.changes.created[0].title).toBe('simple_ticking_absolute');
  });
});
