/**
 * Update all Deephaven Community packages to the latest version.
 *
 * This script is intended to be run from a script named "update-dh-packages" in
 * the package.json of JS plugins.
 *
 * e.g. in `plugins/ui/src/js/package.json`:
 *
 * "scripts": {
 *    "update-dh-packages": "node ../../../../tools/update-dh-packages.mjs"
 * }
 *
 * The script can then be run for all plugins from the root of the repo via:
 * `npm run update-dh-packages`.
 *
 * Or for a specific plugin via:
 * `npm run update-dh-packages --scope=@deephaven/js-plugin-ui`
 */

/* eslint-disable no-console */
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

// Optional targetVersion argument or fallback to 'latest'
const targetVersion = process.argv[2] ?? 'latest';
console.log('targetVersion:', targetVersion);

// Read package.json to get dependency lists
const packageJsonPath = path.join(process.cwd(), 'package.json');
const { dependencies, devDependencies } = JSON.parse(
  String(await fs.readFile(packageJsonPath, 'utf8'))
);

// Get distinct dh package names in the dependencies and devDependencies
const dhPackageNames = [
  ...new Set(
    [...Object.keys(dependencies), ...Object.keys(devDependencies)].filter(
      name => name.startsWith('@deephaven')
    )
  ),
];

console.log('Updating packages:', dhPackageNames);

const cmd = `npm i --save ${dhPackageNames
  .map(name => `${name}@${targetVersion}`)
  .join(' ')}`;

console.log(cmd);

execSync(cmd, { stdio: 'inherit' });
