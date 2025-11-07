import fs from 'node:fs';
import { getPythonModuleInfo } from './utils.mjs';
import type { ModuleName, PythonModuleSpecData } from './types.mjs';

export class PythonModuleMap {
  /**
   * Create and initialize a PythonModuleMap for the given workspace path.
   * @param workspacePath
   * @returns The initialized PythonModuleMap.
   */
  static async create(workspacePath: string): Promise<PythonModuleMap> {
    const pythonModuleMap = new PythonModuleMap(workspacePath);
    await pythonModuleMap.refresh();
    return pythonModuleMap;
  }

  private constructor(private workspacePath: string) {}

  private topLevelModuleNames = new Set<string>();

  private map = new Map<ModuleName, PythonModuleSpecData>();

  private async refresh(): Promise<void> {
    const [set, map] = await getPythonModuleInfo(this.workspacePath);
    this.topLevelModuleNames = set;
    this.map = map;
  }

  /**
   * Get source content for a module.
   * @param moduleName The module name to get the source for.
   * @returns A tuple of the Python module spec and the source content or
   * null if no origin path.
   */
  async getModuleSpec(
    moduleName: ModuleName
  ): Promise<[PythonModuleSpecData, string | null]> {
    const spec = this.map.get(moduleName)!;

    if (spec.origin == null) {
      return [spec, null];
    }

    return [spec, await fs.promises.readFile(spec.origin, 'utf-8')];
  }

  /**
   * Get the set of top level module names in the workspace.
   * @returns A readonly set of top level module names.
   */
  getTopLevelModuleNames(): ReadonlySet<string> {
    return this.topLevelModuleNames;
  }
}

export default PythonModuleMap;
