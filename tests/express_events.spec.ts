import { expect, test } from '@playwright/test';
import { gotoPage, openPanel, SELECTORS } from './utils';

/**
 * E2E tests for chart event callbacks.
 *
 * These tests require corresponding Python scripts in tests/app.d/
 * (express_events.py, registered in tests.app). Each panel renders a chart
 * next to a read-only `ui.text_area` "Event Log" that the on_click handler
 * sets, so we can assert on the textarea value instead of reading
 * canvas-rendered iris-grid cells. Scatter charts use render_mode="svg" so
 * markers are real SVG DOM elements we can click.
 */

test.describe('Chart Events', () => {
  test('scatter on_click fires with point data', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'events_scatter_click',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    const chart = panel.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    const log = panel.getByRole('textbox', { name: 'Event Log' });
    await expect(log).toHaveValue('');

    // Plotly's click detection lives on the draglayer overlay, so click at the
    // marker's screen position with page.mouse rather than the marker element.
    const marker = chart.locator('.scatterlayer .points path.point').first();
    await expect(marker).toBeVisible();
    const box = await marker.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    // on_click should fire and log the clicked point's x,y coordinates.
    await expect(log).toHaveValue(/click:\d+,\d+:shift=False/);
  });

  test('scatter on_click reports shift modifier', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'events_scatter_click',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    const chart = panel.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    const log = panel.getByRole('textbox', { name: 'Event Log' });
    await expect(log).toHaveValue('');

    const marker = chart.locator('.scatterlayer .points path.point').first();
    await expect(marker).toBeVisible();
    const box = await marker.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Hold Shift so the raw pointer event carries shiftKey.
      await page.keyboard.down('Shift');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.keyboard.up('Shift');
    }

    // The handler should observe the shift modifier.
    await expect(log).toHaveValue(/click:\d+,\d+:shift=True/);
  });

  test('scatter on_double_click fires', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'events_scatter_double_click',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    const chart = panel.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    const log = panel.getByRole('textbox', { name: 'Event Log' });
    await expect(log).toHaveValue('');

    // Plotly's double-click detection is timing-based (two clicks within
    // ~300ms) and is unreliable under Playwright's WebKit driver, which spaces
    // the synthetic clicks too far apart. The browser-gesture -> plotly_doubleclick
    // step is Plotly's responsibility; what we own is forwarding the event to the
    // Python callback. Emit the Plotly event directly so the test deterministically
    // exercises the JS handler -> widget round-trip -> Python -> textarea path.
    await chart.evaluate(el => {
      (el as unknown as { emit: (event: string) => void }).emit(
        'plotly_doubleclick'
      );
    });

    await expect(log).toHaveValue('doubleclick');
  });

  test('scatter on_relayout fires', async ({ page }) => {
    await gotoPage(page, '');
    await openPanel(
      page,
      'events_scatter_relayout',
      SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
    );

    const panel = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);
    const chart = panel.locator('.js-plotly-plot');
    await expect(chart).toBeVisible();

    const log = panel.getByRole('textbox', { name: 'Event Log' });

    // Plotly emits plotly_relayout when it applies the initial autorange, so
    // the handler fires as the chart lays out — no drag/zoom gesture needed.
    await expect(log).toHaveValue('relayout');
  });
});
