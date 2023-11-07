import { PANEL_ELEMENT_NAME, isPanelElementNode } from './PanelUtils';

describe('isPanelElementNode', () => {
  test.each([
    [{ props: { title: 'test' } }, false],
    [{ props: { title: 'test' }, __dh_elem_name: 'a different name' }, false],
    [{ props: { title: 'test' }, __dh_elem_name: PANEL_ELEMENT_NAME }, true],
  ])(`isPanelElementNode(%s)`, (element, result) => {
    expect(isPanelElementNode(element)).toBe(result);
  });
});
