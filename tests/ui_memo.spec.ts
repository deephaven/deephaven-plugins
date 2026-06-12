import { expect, test } from '@playwright/test';
import { gotoPage, openPanel, SELECTORS } from './utils';

// The `ui_memo_example` panel exercises `@ui.component(memo=True)`.
//
// It renders:
//   - An "Increment" button and a "Count" text driven by parent state.
//   - A "Input value" text field whose value is passed to `memo_greeting`.
//   - `memo_greeting(value)` - a memoized child that renders "Hello, {value}!".
//     It should re-render only when `value` changes, not when `count` changes.
//   - `memo_random_value("constant")` - a memoized child that renders a random
//     value. Its prop never changes, so it should never re-render and the
//     random value should stay the same across parent re-renders.
test('ui.component(memo=True) skips re-render when props are unchanged and re-renders when they change', async ({
  page,
}) => {
  await gotoPage(page, '');
  await openPanel(
    page,
    'ui_memo_example',
    SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE
  );

  const panelLocator = page.locator(SELECTORS.WIDGET_LOADER_ELEMENT_VISIBLE);

  const incrementButton = panelLocator.getByRole('button', {
    name: 'Increment',
  });
  const count = panelLocator.locator('.memo-count');
  const greeting = panelLocator.locator('.memo-greeting');
  const randomValue = panelLocator.locator('.memo-random');
  const input = panelLocator.getByRole('textbox', { name: 'Input value' });

  // Initial render.
  await expect(count).toHaveText('Count: 0');
  await expect(greeting).toHaveText('Hello, World!');
  await expect(input).toHaveValue('World');

  // Capture the initial random value rendered by the memoized component.
  const initialRandom = await randomValue.textContent();
  expect(initialRandom).toMatch(/^Random: \d+$/);

  // Incrementing the count re-renders the parent, but the memoized children's
  // props are unchanged, so neither should re-render.
  await incrementButton.click();
  await expect(count).toHaveText('Count: 1');
  await incrementButton.click();
  await expect(count).toHaveText('Count: 2');

  // The greeting prop (value) did not change, so it stays the same.
  await expect(greeting).toHaveText('Hello, World!');
  // The random value component's prop never changes, so the value is stable.
  await expect(randomValue).toHaveText(initialRandom ?? '');

  // Changing the input changes the prop passed to `memo_greeting`, so the
  // memoized child re-renders and reflects the new value.
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.pressSequentially('Deephaven', { delay: 0 });
  await input.blur();
  await expect(greeting).toHaveText('Hello, Deephaven!');

  // The random value component's prop ("constant") still did not change, so it
  // should remain memoized and keep its original value.
  await expect(randomValue).toHaveText(initialRandom ?? '');
});
