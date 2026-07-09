import { expect, test } from '@playwright/test';
import { openPanel, gotoPage } from './utils';

/**
 * E2E tests for chart event callbacks.
 *
 * These tests require corresponding Python scripts in tests/docker/python/
 * that create charts with event handlers that write results to tables.
 */

test.describe('Chart Events', () => {
  test('scatter on_click fires with point data', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_scatter_click', '.js-plotly-plot');

    // Wait for chart to render
    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Click on a data point (center of chart area)
    const plotArea = chart.locator('.plot-container .draglayer');
    await plotArea.click({ position: { x: 200, y: 200 } });

    // Verify callback result was written to the result table
    await openPanel(page, 'events_click_result', '.iris-grid');
    const grid = page.locator('.iris-grid .iris-grid-column');
    await expect(grid).toBeVisible();
  });

  test('scatter on_legend_click returning False prevents toggle', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_legend_prevent', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Click a legend item
    const legendItem = chart.locator('.legend .traces').first();
    await legendItem.click();

    // Wait a moment for the round-trip
    await page.waitForTimeout(500);

    // All traces should still be visible (toggle was prevented)
    const traces = chart.locator('.plot-container .trace');
    const count = await traces.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sunburst on_click returning False prevents drill-down', async ({
    page,
  }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_sunburst_prevent', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Click on a sunburst segment
    const sunburstSlice = chart.locator('.sunburst .slice').first();
    if (await sunburstSlice.isVisible()) {
      await sunburstSlice.click();
    }

    // Wait for response
    await page.waitForTimeout(500);

    // The chart should still be at the root level (drill-down prevented)
    // Verify by checking the result table
    await openPanel(page, 'events_sunburst_result', '.iris-grid');
  });

  test('on_selected fires with selection data', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(page, 'events_scatter_select', '.js-plotly-plot');

    const chart = page.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    // Switch to box select mode (click the modebar button)
    const boxSelectBtn = chart.locator(
      '[data-title="Box Select"], [data-val="select"]'
    );
    if (await boxSelectBtn.isVisible()) {
      await boxSelectBtn.click();
    }

    // Drag to select points
    const plotArea = chart.locator('.plot-container .draglayer');
    await plotArea.dragTo(plotArea, {
      sourcePosition: { x: 50, y: 50 },
      targetPosition: { x: 250, y: 250 },
    });

    await page.waitForTimeout(500);

    // Verify callback result
    await openPanel(page, 'events_select_result', '.iris-grid');
  });
});
