import fs from 'node:fs';
import { getPythonModuleMaps } from './utils.mjs';

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

  private map = new Map<string, string | null>();

  private async refresh(): Promise<void> {
    const [set, map] = await getPythonModuleMaps(this.workspacePath);
    this.topLevelModuleNames = set;
    this.map = map;
  }

  /**
   * Get source content for a module.
   * @param moduleName The module name to get the source for.
   * @returns A tuple of the file path and the source content, or undefined if
   * the module
   */
  async getModuleSource(
    moduleName: string
  ): Promise<[string, string | undefined]> {
    const filepath =
      this.map.get(moduleName) ?? this.map.get(`${moduleName}.__init__`);

    if (filepath == null) {
      return ['<string>', undefined];
    }

    return [filepath, await fs.promises.readFile(filepath, 'utf-8')];
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
