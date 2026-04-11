import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

// The default WidgetPanel wrapper may pre-render a hidden instance of
// the component, so use the default '.dh-panel' selector for openPanel
// (which counts correctly) and scope screenshots to the last visible
// chart container.
const tvlChart = (page: import('@playwright/test').Page) =>
  page.locator('.dh-tvl-chart').last();

// --------------------------------------------------------------------------
// Single-series convenience function charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Single Series', () => {
  test('Candlestick chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Bar chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_bar');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Baseline chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_baseline');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Histogram chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_histogram');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Styled and customized charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Styled Charts', () => {
  test('Candlestick with custom colors loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_styled');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Line chart with custom grid loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_line_custom_grid');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Area chart with watermark loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_area_watermark');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Annotations: price lines and markers
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Annotations', () => {
  test('Candlestick with price lines loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_price_lines');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with markers loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_markers');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Multi-series composition charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Multi-Series', () => {
  test('Candlestick with SMA overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_sma');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with volume histogram loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_candlestick_with_volume');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Dual line series overlay loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_dual_line');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Full trading dashboard loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_full_dashboard');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Two price scales loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_two_price_scales');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Panes
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Panes', () => {
  test('Two-pane chart with candlestick and volume loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_basic');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Three-pane chart with custom separators loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_panes_three');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Yield Curve Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Yield Curve', () => {
  test('Yield curve line chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Yield curve area chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_yield_curve_area');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Options Charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Options Chart', () => {
  test('Single series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_single');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Multi-series options chart loads', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_options_multi');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Dynamic Price Lines
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Dynamic Price Lines', () => {
  test('Candlestick with dynamic column-based price lines loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_dynamic_price_lines');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with mixed static and dynamic price lines loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_mixed_price_lines');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Table-Driven Markers
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Table-Driven Markers', () => {
  test('Candlestick with table-driven markers (per-row columns) loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_table_markers');
    await expect(tvlChart(page)).toHaveScreenshot();
  });

  test('Candlestick with table-driven markers (fixed styling) loads', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_table_markers_fixed');
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// By (partitioned) ticking charts
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - By Ticking', () => {
  test('New partition key adds a second trace after button click', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_by_ticking', '.dh-react-panel:visible');

    const panel = page.locator('.dh-react-panel:visible');

    // Wait for initial chart render (1 series: AAPL only)
    await expect(panel.locator('.dh-tvl-chart')).toBeVisible();
    await expect(panel).toHaveScreenshot();

    // Click button to publish GOOG rows
    await panel.getByRole('button', { name: 'Add GOOG' }).click();

    // Wait for button text to confirm callback ran
    await expect(
      panel.getByRole('button', { name: 'Added' })
    ).toBeVisible();

    // Wait for the async chain: PartitionedTable EVENT_KEYADDED →
    // JS getTable(key) → subscribe → data render
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(3000);

    // Chart should now show 2 colored traces (AAPL + GOOG)
    await expect(panel).toHaveScreenshot();
  });
});

// --------------------------------------------------------------------------
// Downsampling (large table)
// --------------------------------------------------------------------------

test.describe('TradingView Lightweight - Downsampling', () => {
  test('10M row line chart loads with downsampling', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'tvl_big_line');

    // Chart should render (not hang or crash) — 10M rows downsampled
    await expect(tvlChart(page)).toBeVisible();
    await expect(tvlChart(page)).toHaveScreenshot();
  });
});

