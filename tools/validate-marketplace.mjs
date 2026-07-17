/**
 * Validates marketplace/marketplace.json against marketplace/marketplace.schema.json,
 * plus checks the schema can't express: unique names, repo owner matches author,
 * each plugin's image being a PNG that exists in marketplace/images/ and is
 * under the size limit, and that every link resolves (repo, href, registry, and
 * the author's GitHub profile). Internal hrefs are checked against the live site.
 *
 * Usage: npm run validate-marketplace [-- --skip-links]
 * Env: MARKETPLACE_LINK_BASE overrides the base URL for internal hrefs
 *      (default https://deephaven.io)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const marketplaceDir = path.join(root, 'marketplace');

const IMAGE_EXTENSIONS = ['.png'];
const MAX_IMAGE_BYTES = 300 * 1024;

const schema = JSON.parse(
  fs.readFileSync(path.join(marketplaceDir, 'marketplace.schema.json'), 'utf-8')
);
const marketplace = JSON.parse(
  fs.readFileSync(path.join(marketplaceDir, 'marketplace.json'), 'utf-8')
);

const errors = [];

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);
if (!validate(marketplace)) {
  validate.errors?.forEach(e => {
    errors.push(`Schema error: ${e.instancePath || '/'} ${e.message}`);
  });
}

const names = new Set();
// local image files referenced by a plugin, so we can flag orphans afterward
const referencedImages = new Set();
for (const plugin of marketplace.plugins ?? []) {
  const label = plugin.name ?? '(unnamed)';

  const key = String(plugin.name ?? '').toLowerCase();
  if (names.has(key)) {
    errors.push(`Duplicate plugin name: ${label}`);
  }
  names.add(key);

  // the repo must belong to the listed author, since the author field
  // determines the official @deephaven badge
  const owner = String(plugin.repo ?? '').match(
    /^https:\/\/github\.com\/([^/]+)/
  )?.[1];
  if (
    owner &&
    plugin.author &&
    owner.toLowerCase() !== plugin.author.toLowerCase()
  ) {
    errors.push(
      `${label}: repo owner "${owner}" does not match author "${plugin.author}"`
    );
  }

  // the directory derives the official tag from the author; it can't be
  // self-assigned
  if ((plugin.tags ?? []).some(t => String(t).toLowerCase() === 'official')) {
    errors.push(
      `${label}: the "official" tag is reserved and applied automatically to Deephaven-owned plugins`
    );
  }

  // the "pre-installed" badge is reserved for Deephaven-owned plugins
  if (plugin.preInstalled && plugin.author?.toLowerCase() !== 'deephaven') {
    errors.push(
      `${label}: "preInstalled" is reserved for Deephaven-owned plugins (author must be "deephaven")`
    );
  }

  // every plugin must ship a card image, and it must be a local PNG file in
  // marketplace/images/ (no external URLs)
  if (!plugin.image) {
    errors.push(`${label}: missing required image`);
  } else if (!plugin.image.startsWith('/marketplace/images/')) {
    errors.push(
      `${label}: image must be a local PNG in marketplace/images/, referenced as /marketplace/images/<file>.png`
    );
  } else {
    const file = plugin.image.slice('/marketplace/images/'.length);
    const imagePath = path.join(marketplaceDir, 'images', file);
    referencedImages.add(file);
    if (file.includes('/') || file.includes('..')) {
      errors.push(`${label}: image must be a file directly in marketplace/images/`);
    } else if (path.extname(file).toLowerCase() !== '.png') {
      errors.push(`${label}: image must be a .png file`);
    } else if (!fs.existsSync(imagePath)) {
      errors.push(`${label}: image not found at marketplace/images/${file}`);
    } else {
      const { size } = fs.statSync(imagePath);
      if (size > MAX_IMAGE_BYTES) {
        errors.push(
          `${label}: image is ${Math.round(size / 1024)} KB, max is ${MAX_IMAGE_BYTES / 1024} KB`
        );
      }
    }
  }
}

// no orphan images: every file in marketplace/images/ must be referenced by a
// plugin (README.md and other non-image docs are ignored)
const imagesDir = path.join(marketplaceDir, 'images');
if (fs.existsSync(imagesDir)) {
  for (const file of fs.readdirSync(imagesDir)) {
    if (!IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
      continue;
    }
    if (!referencedImages.has(file)) {
      errors.push(
        `Orphan image marketplace/images/${file}: not referenced by any plugin`
      );
    }
  }
}

// --- link validation ---

const LINK_BASE = process.env.MARKETPLACE_LINK_BASE || 'https://deephaven.io';
// 402 is accepted to match the site's link validator (see #111)
const ACCEPTED_STATUSES = [402];

async function fetchStatus(url, method) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'deephaven-marketplace-validator' },
  });
  return res;
}

/** Returns an error string for a broken url, or null if it resolves. */
async function checkUrl(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let res = await fetchStatus(url, 'HEAD');
      if (!res.ok && !ACCEPTED_STATUSES.includes(res.status)) {
        // some servers reject HEAD; confirm with GET before failing
        res = await fetchStatus(url, 'GET');
      }
      if (res.ok || ACCEPTED_STATUSES.includes(res.status)) {
        return null;
      }
      if (attempt === 0) {
        continue; // CDNs occasionally throw transient errors, retry once
      }
      return `returned ${res.status}`;
    } catch (e) {
      if (attempt === 0) {
        continue;
      }
      return `failed (${e.cause?.code ?? e.name})`;
    }
  }
  return 'failed';
}

async function checkLinks() {
  // url -> labels of plugins referencing it, deduped so shared urls
  // (e.g. the author profile on monorepo plugins) are fetched once
  const links = new Map();
  const addLink = (url, label) => {
    if (!links.has(url)) {
      links.set(url, []);
    }
    links.get(url).push(label);
  };

  for (const plugin of marketplace.plugins ?? []) {
    const label = plugin.name ?? '(unnamed)';
    if (plugin.repo) {
      addLink(plugin.repo, label);
    }
    if (plugin.author) {
      addLink(`https://github.com/${plugin.author}`, label);
    }
    if (plugin.href) {
      addLink(
        plugin.href.startsWith('/') ? `${LINK_BASE}${plugin.href}` : plugin.href,
        label
      );
    }
    if (plugin.registry?.url) {
      addLink(plugin.registry.url, label);
    }
  }

  console.log(`Checking ${links.size} links...`);
  const results = await Promise.all(
    [...links.entries()].map(async ([url, labels]) => {
      const error = await checkUrl(url);
      return error ? `${labels.join(', ')}: ${url} ${error}` : null;
    })
  );
  return results.filter(Boolean);
}

if (!process.argv.includes('--skip-links')) {
  errors.push(...(await checkLinks()));
}

if (errors.length > 0) {
  console.error(`marketplace.json is invalid:`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(
  `marketplace.json is valid (${marketplace.plugins.length} plugins)`
);
