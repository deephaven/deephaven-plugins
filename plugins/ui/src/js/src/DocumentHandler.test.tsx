import React from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/utils';
import { render } from '@testing-library/react';
import DocumentHandler, { DocumentHandlerProps } from './DocumentHandler';
import { ElementNode } from './ElementUtils';
import { PANEL_ELEMENT_NAME } from './PanelUtils';
import { ReactPanelProps } from './ReactPanel';
import { MixedPanelsError, NoChildrenError } from './errors';

const mockReactPanel = jest.fn((props: ReactPanelProps) => (
  <div>ReactPanel</div>
));
jest.mock(
  './ReactPanel',
  () => (props: ReactPanelProps) => mockReactPanel(props)
);

function makeElement(
  type = 'test-element',
  props: Record<string, unknown> = {}
): ElementNode {
  return {
    __dh_elem: type,
    props,
  };
}

function makeDocument(children: ElementNode[] = []): ElementNode {
  return {
    __dh_elem: 'test-element',
    props: {
      children,
    },
  };
}

function makeDocumentHandler({
  element = makeDocument(),
  definition = TestUtils.createMockProxy<WidgetDefinition>({}),
}: Partial<DocumentHandlerProps> = {}) {
  return <DocumentHandler element={element} definition={definition} />;
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('should throw an error if no children to render', () => {
  const element = makeDocument();
  expect(() => render(makeDocumentHandler({ element }))).toThrow(
    NoChildrenError
  );
});

it('should throw an error if the document mixes panel and non-panel elements', () => {
  const element = makeDocument([
    makeElement(PANEL_ELEMENT_NAME),
    makeElement('not panel element'),
  ]);
  expect(() => render(makeDocumentHandler({ element }))).toThrow(
    MixedPanelsError
  );
});

it('should combine multiple single elements into one panel', () => {
  const element = makeDocument([makeElement('foo'), makeElement('bar')]);
  render(makeDocumentHandler({ element }));
  expect(mockReactPanel).toHaveBeenCalledTimes(1);
});

it('should render multiple panels', () => {
  const element = makeDocument([
    makeElement(PANEL_ELEMENT_NAME),
    makeElement(PANEL_ELEMENT_NAME),
  ]);
  render(makeDocumentHandler({ element }));
  expect(mockReactPanel).toHaveBeenCalledTimes(2);
});
