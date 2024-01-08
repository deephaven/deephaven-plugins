import {
  PANEL_ELEMENT_NAME,
  ROW_ELEMENT_NAME,
  COLUMN_ELEMENT_NAME,
  isPanelElementNode,
  isRowElementNode,
  isColumnElementNode,
  isStackElementNode,
  STACK_ELEMENT_NAME,
} from './LayoutUtils';

describe('isPanelElementNode', () => {
  test.each([
    [{ props: { title: 'test' } }, false],
    [{ props: { title: 'test' }, __dhElemName: 'a different name' }, false],
    [{ props: { title: 'test' }, __dhElemName: PANEL_ELEMENT_NAME }, true],
  ])(`isPanelElementNode(%s)`, (element, result) => {
    expect(isPanelElementNode(element)).toBe(result);
  });
});

describe('isRowElementNode', () => {
  test.each([
    [{ props: { height: 100 } }, false],
    [{ props: { height: 100 }, __dhElemName: 'a different name' }, false],
    [{ props: { height: 100 }, __dhElemName: ROW_ELEMENT_NAME }, true],
  ])(`isRowElementNode(%s)`, (element, result) => {
    expect(isRowElementNode(element)).toBe(result);
  });
});

describe('isColumnElementNode', () => {
  test.each([
    [{ props: { width: 100 } }, false],
    [{ props: { width: 100 }, __dhElemName: 'a different name' }, false],
    [{ props: { width: 100 }, __dhElemName: COLUMN_ELEMENT_NAME }, true],
  ])(`isColumnElementNode(%s)`, (element, result) => {
    expect(isColumnElementNode(element)).toBe(result);
  });
});

describe('isStackElementNode', () => {
  test.each([
    [{ props: { height: 100, width: 100 } }, false],
    [
      { props: { height: 100, width: 100 }, __dhElemName: 'a different name' },
      false,
    ],
    [
      { props: { height: 100, width: 100 }, __dhElemName: STACK_ELEMENT_NAME },
      true,
    ],
  ])(`isStackElementNode(%s)`, (element, result) => {
    expect(isStackElementNode(element)).toBe(result);
  });
});
