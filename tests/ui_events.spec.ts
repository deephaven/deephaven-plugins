import { expect, test } from '@playwright/test';
import { gotoPage, openPanel, SELECTORS } from './utils';

// The `ui_slow_text_field` panel renders a `ui.text_field` whose on_change
// handler sleeps 1.5s and then writes back the value uppercased. This lets us
// exercise the case where the server sends a new value back after a noticeable
// delay relative to user input.
test('ui.text_field does not overwrite user typing while focused', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_text_field', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('textbox', { name: 'Slow Text' });

  await expect(input).toHaveValue('hello');

  // Replace the text and keep the field focused. The server will respond with
  // an uppercased version after ~1.5s. We must not let that clobber what the
  // user is typing while still focused.
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('abc', { delay: 0 });
  await expect(input).toHaveValue('abc');
  await expect(input).toBeFocused();

  // Wait long enough for the server to complete its slow on_change and send
  // back the transformed value ("ABC"). The fix in useTextInputProps /
  // useDebouncedOnChange should keep the user's "abc" in place while focused.
  await page.waitForTimeout(2500);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('abc');

  // After blurring, the latest server value should now be applied.
  await input.blur();
  await expect(input).toHaveValue('ABC');
});

// The `ui_text_field_events` panel renders a `ui.text_field` whose on_focus,
// on_change, and on_blur handlers append entries to a read-only Event Log
// textarea. Focus events include the input's current value.
test('ui.text_field fires on_focus, on_change, and on_blur with expected payloads', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_text_field_events', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('textbox', { name: 'Events Text' });
  const log = panelLocator.getByRole('textbox', { name: 'Event Log' });

  await expect(input).toHaveValue('hi');
  await expect(log).toHaveValue('');

  // Focus the field. on_focus should fire with value="hi".
  await input.focus();
  await expect(log).toHaveValue(/focus:hi/);

  // Type a character. on_change should fire with the new value.
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('world', { delay: 20 });
  await expect(log).toHaveValue(/change:world/);

  // Blur the field. on_blur should fire with the typed value.
  await input.blur();
  await expect(log).toHaveValue(/blur:world/);

  // Final log should contain focus, at least one change, and blur, in order.
  const logValue = await log.inputValue();
  const focusIdx = logValue.indexOf('focus:hi');
  const changeIdx = logValue.indexOf('change:world');
  const blurIdx = logValue.indexOf('blur:world');
  expect(focusIdx).toBeGreaterThanOrEqual(0);
  expect(changeIdx).toBeGreaterThan(focusIdx);
  expect(blurIdx).toBeGreaterThan(changeIdx);
});

// The `ui_slow_text_area` panel renders a `ui.text_area` whose on_change
// handler sleeps 1.5s and then writes back the value uppercased. `ui.text_area`
// shares the same useTextInputProps hook as `ui.text_field`, so it should
// preserve user input while focused.
test('ui.text_area does not overwrite user typing while focused', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_text_area', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('textbox', { name: 'Slow Area' });

  await expect(input).toHaveValue('hello');

  // Replace the text and keep the field focused. The server will respond with
  // an uppercased version after ~1.5s.
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('abc', { delay: 0 });
  await expect(input).toHaveValue('abc');
  await expect(input).toBeFocused();

  // Wait for the slow on_change to complete and send back "ABC". The user's
  // "abc" should remain in place while focused.
  await page.waitForTimeout(2500);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('abc');

  // After blurring, the latest server value should now be applied.
  await input.blur();
  await expect(input).toHaveValue('ABC');
});

// The `ui_text_area_events` panel renders a `ui.text_area` whose on_focus,
// on_change, and on_blur handlers append entries to a read-only Event Log
// textarea. Focus events include the input's current value.
test('ui.text_area fires on_focus, on_change, and on_blur with expected payloads', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_text_area_events', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('textbox', { name: 'Events Area' });
  const log = panelLocator.getByRole('textbox', { name: 'Event Log' });

  await expect(input).toHaveValue('hi');
  await expect(log).toHaveValue('');

  // Focus the field. on_focus should fire with value="hi".
  await input.focus();
  await expect(log).toHaveValue(/focus:hi/);

  // Type a character. on_change should fire with the new value.
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('world', { delay: 20 });
  await expect(log).toHaveValue(/change:world/);

  // Blur the field. on_blur should fire with the typed value.
  await input.blur();
  await expect(log).toHaveValue(/blur:world/);

  // Final log should contain focus, at least one change, and blur, in order.
  const logValue = await log.inputValue();
  const focusIdx = logValue.indexOf('focus:hi');
  const changeIdx = logValue.indexOf('change:world');
  const blurIdx = logValue.indexOf('blur:world');
  expect(focusIdx).toBeGreaterThanOrEqual(0);
  expect(changeIdx).toBeGreaterThan(focusIdx);
  expect(blurIdx).toBeGreaterThan(changeIdx);
});

// The `ui_slow_number_field` panel renders a `ui.number_field` whose on_change
// handler sleeps 1.5s and then writes back the value incremented by one.
// `ui.number_field` uses the same useTextInputProps hook as `ui.text_field`, so
// it should preserve user input while focused.
test('ui.number_field does not overwrite user typing while focused', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_number_field', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('spinbutton', { name: 'Slow Number' });

  await expect(input).toHaveValue('1');

  // Replace the value and keep the field focused. The server will respond with
  // an incremented value after ~1.5s.
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('5', { delay: 0 });
  await expect(input).toHaveValue('5');
  await expect(input).toBeFocused();

  // Wait for the slow on_change to complete and send back "6". The user's
  // "5" should remain in place while focused.
  await page.waitForTimeout(2500);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('5');

  // After blurring, the latest server value should now be applied.
  await input.blur();
  await expect(input).toHaveValue('6');
});

// The `ui_number_field_events` panel renders a `ui.number_field` whose
// on_focus, on_change, and on_blur handlers append entries to a read-only Event
// Log textarea. Focus events include the input's current value.
test('ui.number_field fires on_focus, on_change, and on_blur with expected payloads', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_number_field_events',
    SELECTORS.REACT_PANEL_VISIBLE
  );

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('spinbutton', { name: 'Events Number' });
  const log = panelLocator.getByRole('textbox', { name: 'Event Log' });

  await expect(input).toHaveValue('1');
  await expect(log).toHaveValue('');

  // Focus the field. on_focus should fire with value="1".
  await input.focus();
  await expect(log).toHaveValue(/focus:1/);

  // Type a new value. on_change should fire with the new number.
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('42', { delay: 20 });
  await expect(log).toHaveValue(/change:42/);

  // Blur the field. on_blur should fire with the typed value.
  await input.blur();
  await expect(log).toHaveValue(/blur:42/);

  // Final log should contain focus, at least one change, and blur, in order.
  const logValue = await log.inputValue();
  const focusIdx = logValue.indexOf('focus:1');
  const changeIdx = logValue.indexOf('change:42');
  const blurIdx = logValue.indexOf('blur:42');
  expect(focusIdx).toBeGreaterThanOrEqual(0);
  expect(changeIdx).toBeGreaterThan(focusIdx);
  expect(blurIdx).toBeGreaterThan(changeIdx);
});

// The `ui_slow_search_field` panel renders a `ui.search_field` whose on_change
// handler sleeps 1.5s and then writes back the value uppercased. `ui.search_field`
// is a free-text input like `ui.text_field`, so it should preserve user input
// while focused.
test('ui.search_field does not overwrite user typing while focused', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_slow_search_field', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('searchbox', { name: 'Slow Search' });

  await expect(input).toHaveValue('hello');

  // Replace the text and keep the field focused. The server will respond with
  // an uppercased version after ~1.5s.
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('abc', { delay: 0 });
  await expect(input).toHaveValue('abc');
  await expect(input).toBeFocused();

  // Wait for the slow on_change to complete and send back "ABC". The user's
  // "abc" should remain in place while focused.
  await page.waitForTimeout(2500);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('abc');

  // After blurring, the latest server value should now be applied.
  await input.blur();
  await expect(input).toHaveValue('ABC');
});

// The `ui_search_field_events` panel renders a `ui.search_field` whose on_focus,
// on_change, and on_blur handlers append entries to a read-only Event Log
// textarea. Focus events include the input's current value.
test('ui.search_field fires on_focus, on_change, and on_blur with expected payloads', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(page, 'ui_search_field_events', SELECTORS.REACT_PANEL_VISIBLE);

  const panelLocator = page.locator(SELECTORS.REACT_PANEL_VISIBLE);
  const input = panelLocator.getByRole('searchbox', { name: 'Events Search' });
  const log = panelLocator.getByRole('textbox', { name: 'Event Log' });

  await expect(input).toHaveValue('hi');
  await expect(log).toHaveValue('');

  // Focus the field. on_focus should fire with value="hi".
  await input.focus();
  await expect(log).toHaveValue(/focus:hi/);

  // Type a character. on_change should fire with the new value.
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('world', { delay: 20 });
  await expect(log).toHaveValue(/change:world/);

  // Blur the field. on_blur should fire with the typed value.
  await input.blur();
  await expect(log).toHaveValue(/blur:world/);

  // Final log should contain focus, at least one change, and blur, in order.
  const logValue = await log.inputValue();
  const focusIdx = logValue.indexOf('focus:hi');
  const changeIdx = logValue.indexOf('change:world');
  const blurIdx = logValue.indexOf('blur:world');
  expect(focusIdx).toBeGreaterThanOrEqual(0);
  expect(changeIdx).toBeGreaterThan(focusIdx);
  expect(blurIdx).toBeGreaterThan(changeIdx);
});
