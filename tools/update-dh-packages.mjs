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
 * `npm run update-dh-packages -- --scope=@deephaven/js-plugin-ui`
 *
 * To target a specific version, pass the version as an argument:
 * `npm run update-dh-packages -- --scope=@deephaven/js-plugin-ui -- 0.70.1-alpha-picker-table.34`
 */

/* eslint-disable no-console */
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

// Optional targetVersionOverride argument
const targetVersionOverride = process.argv[2];
const targetVersionDefault = 'latest';

console.log('targetVersion:', {
  default: targetVersionDefault,
  override: targetVersionOverride,
});

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

const dhPackageUpdates = new Map(
  dhPackageNames.map(name => [
    name,
    // If targetVersionOverride is set, use it for all packages except for
    // `@deephaven/jsapi-types` since it has it's own versioning cadence.
    targetVersionOverride == null || name === '@deephaven/jsapi-types'
      ? targetVersionDefault
      : targetVersionOverride,
  ])
);

if (dhPackageNames.length === 0) {
  console.log(
    'No @deephaven packages found in dependencies or devDependencies.'
  );
  process.exit(0);
}

console.log('Updating packages:', dhPackageUpdates);

const cmd = `npm i --save ${[...dhPackageUpdates.entries()]
  .map(([name, version]) => `${name}@${version}`)
  .join(' ')}`;

console.log(cmd);

execSync(cmd, { stdio: 'inherit' });
