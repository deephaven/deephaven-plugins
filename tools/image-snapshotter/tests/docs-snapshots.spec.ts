/**
 * Docs snapshot capture spec — Pass 2.
 *
 * For each docs page, opens the IDE once, then iterates every block's
 * `order=` names, opens the matching panel, waits for the target widget to
 * settle, screenshots, and merges the resulting PNG path + dims into the
 * matching `<code_md5>.json` envelope.
 *
 * The widget CSS selector and the widget-type string stamped into envelopes
 * come from `SNAPSHOTTER_TARGET_SELECTOR` and `SNAPSHOTTER_WIDGET_TYPE` so
 * this spec can be reused across plugins.
 *
 * If a panel for a given name does not produce a matching element (e.g. the
 * variable is a table), the name is silently skipped — salmon Pass 1 will
 * serialize tables on its own pass and the envelope merge is additive.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page, type Locator } from '@playwright/test';

import { walkDocs, type Block } from '../src/extract.js';
import { readOrInit, writeAtomic } from '../src/merge.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

const WIDGET_TYPE = requireEnv('SNAPSHOTTER_WIDGET_TYPE');
const TARGET_SELECTOR = requireEnv('SNAPSHOTTER_TARGET_SELECTOR');

// Docs screenshot dimensions — 860px wide at 3:2 aspect ratio. The chart
// container is force-sized before each capture so every PNG in the docs
// renders at the same intrinsic size regardless of panel layout.
const SCREENSHOT_WIDTH = 860;
const SCREENSHOT_HEIGHT = 573;

// Resolve plugin paths via SNAPSHOTTER_PLUGIN_ROOT (required). The compose
// pipeline binds the plugin's docs/ at /work/docs and exports
// SNAPSHOTTER_PLUGIN_ROOT=/work; local-dev invocations should point at the
// plugin checkout root.
const PLUGIN_ROOT = requireEnv('SNAPSHOTTER_PLUGIN_ROOT');
const DOCS_DIR = join(PLUGIN_ROOT, 'docs');
const SNAPSHOTS_DIR = join(DOCS_DIR, 'snapshots');
const ASSETS_DIR = join(SNAPSHOTS_DIR, 'assets');

// Optional prefix map written by `image-snapshotter-fixture-gen` next to the generated
// app.d. When present (the docker pipeline), the spec mangles each panel
// name with its block's 8-char md5 prefix so colliding names across pages
// resolve unambiguously. When absent (local-dev / hand-loaded server),
// names are used raw exactly as the user typed them in the docs.
const PREFIX_MAP_PATH = process.env.SNAPSHOTTER_PREFIX_MAP ?? '';
// When SNAPSHOTTER_FORCE is set to anything truthy, ignore the
// "envelope-entry + asset both present" cache and recapture every block.
// Useful when the plugin's JS/Python changed but the doc code block (and
// therefore its md5 envelope key) did not, so the cache would otherwise
// skip recapture and ship a stale PNG.
const FORCE = (process.env.SNAPSHOTTER_FORCE ?? '').trim() !== '' &&
  process.env.SNAPSHOTTER_FORCE !== '0' &&
  process.env.SNAPSHOTTER_FORCE?.toLowerCase() !== 'false';
const prefixMap: Record<string, string> = (() => {
  if (!PREFIX_MAP_PATH) return {};
  try {
    if (!existsSync(PREFIX_MAP_PATH)) return {};
    return JSON.parse(readFileSync(PREFIX_MAP_PATH, 'utf8')) as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
})();

/**
 * Translate a docs-author-visible variable name into the global symbol
 * actually defined in the server. With a prefix map loaded (docker run),
 * each block's exports are namespaced as `<md5_first8>_<name>`. Without
 * a map (local dev), the name is returned unchanged.
 */
function mangle(md5: string, name: string): string {
  const prefix = prefixMap[md5];
  return prefix ? `${prefix}_${name}` : name;
}

// --------------------------------------------------------------------------
// Helpers — copied from tests/utils.ts (the canonical helpers live one
// level up out of reach of this tool's tsconfig). Keep behavior identical.
// --------------------------------------------------------------------------

async function gotoPage(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('progressbar', { name: 'Loading...', exact: true })).toHaveCount(0);
}

async function waitForLoad(page: Page): Promise<void> {
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
}

async function openPanel(page: Page, name: string): Promise<void> {
  const appPanels = page.getByRole('button', { name: 'Panels', exact: true });
  await expect(appPanels).toBeEnabled();
  const before = await page.locator('.dh-panel').count();
  await appPanels.click();
  const search = page.getByRole('searchbox', { name: 'Find Table, Plot or Widget', exact: true });
  await search.fill(name);
  const target = page.getByRole('button', { name, exact: true });
  await expect(target).toBeEnabled();
  await target.click();
  await page.mouse.move(0, 0);
  await expect(page.locator('.dh-panel')).toHaveCount(before + 1);
  await waitForLoad(page);
}

/**
 * Wait until two consecutive RAFs report the same bounding box for `loc`.
 * Mirrors the stability pattern Playwright's toHaveScreenshot uses
 * internally, applied here so we can take a raw .screenshot() and hash it
 * deterministically.
 */
/**
 * If the target element opts in via ``data-snapshot-ready`` (initially
 * ``"false"``), block until the plugin flips it to ``"true"``. This lets
 * the chart say "my initial data has flowed through and I'm done
 * resampling" instead of us guessing via fixed timeouts or just-the-box.
 *
 * Plugins that don't set the attribute (e.g. plotly-express or any chart
 * type that renders synchronously) are still supported — we treat the
 * absence of the attribute as "no opt-in, don't wait".
 */
async function waitForSnapshotReady(
  loc: Locator,
  timeoutMs = 30_000,
): Promise<void> {
  const hasAttr = await loc.evaluate(
    el => (el as HTMLElement).hasAttribute('data-snapshot-ready'),
  );
  if (!hasAttr) return;
  try {
    await loc
      .page()
      .waitForFunction(
        el => el?.getAttribute('data-snapshot-ready') === 'true',
        await loc.elementHandle(),
        { timeout: timeoutMs },
      );
  } catch {
    // Best-effort — fall through and screenshot what we have. The chart
    // may legitimately never become "ready" (e.g. an empty source table).
    // eslint-disable-next-line no-console
    console.log(
      '[snapshotter] data-snapshot-ready did not flip true within',
      timeoutMs,
      'ms — capturing anyway',
    );
  }
}

async function waitForStableBox(loc: Locator, attempts = 30): Promise<void> {
  let prev: { x: number; y: number; w: number; h: number } | null = null;
  for (let i = 0; i < attempts; i += 1) {
    const box = await loc.boundingBox();
    if (box && prev && box.x === prev.x && box.y === prev.y && box.width === prev.w && box.height === prev.h) {
      // Yield two RAFs and re-check once more to be safe.
      await loc.page().evaluate(
        () =>
          new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
      );
      const again = await loc.boundingBox();
      if (
        again &&
        again.x === prev.x &&
        again.y === prev.y &&
        again.width === prev.w &&
        again.height === prev.h
      ) {
        return;
      }
    }
    if (box) prev = { x: box.x, y: box.y, w: box.width, h: box.height };
    await loc.page().evaluate(
      () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    );
  }
}

async function closeLastPanel(page: Page): Promise<void> {
  // Click the close button on the most recently-active panel tab.
  const closeBtn = page.locator('.lm_tab.lm_active .lm_close_tab').last();
  const count = await closeBtn.count();
  if (count === 0) return;
  try {
    await closeBtn.click({ timeout: 2000 });
  } catch {
    // best-effort teardown
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// --------------------------------------------------------------------------
// Capture pass
// --------------------------------------------------------------------------

interface PageGroup {
  page: string;
  blocks: Block[];
}

function groupByPage(blocks: Block[]): PageGroup[] {
  const m = new Map<string, Block[]>();
  for (const b of blocks) {
    if (b.skip) continue;
    if (b.order.length === 0) continue;
    const list = m.get(b.page) ?? [];
    list.push(b);
    m.set(b.page, list);
  }
  return Array.from(m.entries()).map(([page, blocks]) => ({ page, blocks }));
}

const allBlocks = existsSync(DOCS_DIR) ? walkDocs(DOCS_DIR) : [];
const pageGroups = groupByPage(allBlocks);

test.describe.configure({ mode: 'serial' });

if (pageGroups.length === 0) {
  // Empty docs dir — emit a placeholder so the spec runner has *something*.
  test('docs snapshot capture (no pages with capturable blocks)', () => {
    test.skip(true, 'No docs pages with `order=` blocks were found under docs/.');
  });
}

for (const group of pageGroups) {
  test(`capture ${group.page}`, async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    await gotoPage(page, '');

    mkdirSync(ASSETS_DIR, { recursive: true });

    // Counters so the entrypoint summary shows what actually happened.
    let captured = 0;
    let skippedExisting = 0;
    let skippedNoChart = 0;

    for (const block of group.blocks) {
      const envelopePath = join(SNAPSHOTS_DIR, `${block.md5}.json`);
      const envelope = readOrInit(envelopePath, group.page);
      let dirty = false;

      for (const name of block.order) {
        // Skip recapture only when the envelope entry AND the asset it
        // references are both present. A bare envelope hit is not enough —
        // assets/<sha>.png may have been deleted (git clean, dirty checkout,
        // manual cleanup) while the envelope still points at it, and silently
        // skipping would leave dangling image references in the docs build.
        const existing = envelope.objects[name];
        if (existing) {
          const imageRel = (existing as { data?: { image?: string } })?.data?.image;
          if (imageRel === undefined) {
            // Salmon-authored entry (Table or any other non-image type).
            // Pass 2 must never touch entries it doesn't own — deleting them
            // would only succeed in destroying salmon's work without anything
            // to put back (the panel hosts the table, not a chart).
            skippedExisting += 1;
            continue;
          }
          if (!FORCE && existsSync(join(SNAPSHOTS_DIR, imageRel))) {
            // Pass-2 entry whose PNG still exists on disk — nothing to do.
            // FORCE bypasses this cache so plugin-code changes propagate
            // even when the doc block (envelope key) is unchanged.
            skippedExisting += 1;
            continue;
          }
          // Pass-2 entry whose asset went missing (git clean, etc.). Drop
          // the dangling entry and fall through to recapture.
          delete envelope.objects[name];
          dirty = true;
        }

        // Use the mangled global symbol when opening the panel so reused
        // names like `primary` / `stocks` don't collide across pages. The
        // envelope key (below) keeps the original docs name as the
        // user-facing identifier.
        const panelName = mangle(block.md5, name);
        await openPanel(page, panelName);
        const chart = page.locator(TARGET_SELECTOR).last();
        // Allow up to 5s for a chart container to materialize in the new panel.
        try {
          await chart.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
          // Not a chart panel (table / something else, OR the chart simply
          // never rendered). Salmon will cover table cases. Log a hint so the
          // entrypoint summary makes silent skips visible.
          // eslint-disable-next-line no-console
          console.log(
            `[snapshotter] no chart for "${name}" (panel="${panelName}", selector="${TARGET_SELECTOR}") — skipping`,
          );
          skippedNoChart += 1;
          await closeLastPanel(page);
          continue;
        }
        await waitForStableBox(chart);

        // Force a uniform render size before capture so every docs PNG has
        // the same intrinsic dimensions. LWC's autoSize observer refits
        // the canvas to the new container box; waitForStableBox below
        // blocks until that resize has settled.
        await chart.evaluate(
          (el, dims) => {
            const e = el as HTMLElement;
            e.style.width = `${dims.w}px`;
            e.style.height = `${dims.h}px`;
            e.style.flex = 'none';
          },
          { w: SCREENSHOT_WIDTH, h: SCREENSHOT_HEIGHT }
        );
        await waitForStableBox(chart);
        // After the container has settled at its capture dimensions, wait
        // for the chart to signal its data is fully flowed through. This
        // catches charts whose data arrives asynchronously after the box
        // is already stable — most notably `by`-partitioned charts that
        // discover keys and subscribe per-key after panel mount.
        await waitForSnapshotReady(chart);

        const buf = await chart.screenshot();
        const sha = sha256(buf);
        const assetRel = `assets/${sha}.png`;
        const assetAbs = join(SNAPSHOTS_DIR, assetRel);
        if (!existsSync(assetAbs)) {
          writeFileSync(assetAbs, buf);
        }
        const box = await chart.boundingBox();
        envelope.objects[name] = {
          type: WIDGET_TYPE,
          data: {
            image: assetRel,
            width: Math.round(box?.width ?? 0),
            height: Math.round(box?.height ?? 0),
            alt: name,
          },
        };
        captured += 1;
        dirty = true;
        await closeLastPanel(page);
      }

      if (dirty) writeAtomic(envelopePath, envelope);
    }

    // eslint-disable-next-line no-console
    console.log(
      `[snapshotter] ${group.page}: captured=${captured}, skipped(existing)=${skippedExisting}, skipped(no chart)=${skippedNoChart}`,
    );
  });
}
