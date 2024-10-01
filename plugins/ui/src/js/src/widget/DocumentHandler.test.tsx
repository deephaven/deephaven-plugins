import React from 'react';
import { WidgetDescriptor } from '@deephaven/dashboard';
import { TestUtils } from '@deephaven/test-utils';
import { render } from '@testing-library/react';
import DocumentHandler, { DocumentHandlerProps } from './DocumentHandler';
import { ReactPanelProps } from '../layout/LayoutUtils';
import { MixedPanelsError, NoChildrenError } from '../errors';
import { getComponentForElement } from './WidgetUtils';
import { ELEMENT_NAME } from '../elements/model/ElementConstants';

const mockReactPanel = jest.fn((props: ReactPanelProps) => (
  <div>ReactPanel</div>
));
jest.mock(
  '../layout/ReactPanel',
  () => (props: ReactPanelProps) => mockReactPanel(props)
);

function makeElement(
  type = 'test-element',
  props: Record<string, unknown> = {}
): React.ReactNode {
  return getComponentForElement({
    __dhElemName: type,
    props,
  });
}

function makeDocument(children: React.ReactNode = []): React.ReactNode {
  return getComponentForElement({
    __dhElemName: 'test-element',
    props: {
      children,
    },
  });
}

function makeDocumentHandler({
  children = makeDocument(),
  widget = TestUtils.createMockProxy<WidgetDescriptor>({}),
  onClose = jest.fn(),
}: Partial<DocumentHandlerProps> = {}) {
  return (
    <DocumentHandler widget={widget} onClose={onClose}>
      {children}
    </DocumentHandler>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('should throw an error if no children to render', () => {
  TestUtils.disableConsoleOutput();

  const children = makeDocument();
  expect(() => render(makeDocumentHandler({ children }))).toThrow(
    NoChildrenError
  );
});

it('should throw an error if the document mixes panel and non-panel elements', () => {
  TestUtils.disableConsoleOutput();

  const children = makeDocument([
    makeElement(ELEMENT_NAME.panel),
    makeElement('not panel element'),
  ]);
  expect(() => render(makeDocumentHandler({ children }))).toThrow(
    MixedPanelsError
  );
});

it('should combine multiple single elements into one panel', () => {
  const children = makeDocument([makeElement('foo'), makeElement('bar')]);
  render(makeDocumentHandler({ children }));
  expect(mockReactPanel).toHaveBeenCalledTimes(1);
});

it('should render multiple panels', () => {
  const children = makeDocument([
    makeElement(ELEMENT_NAME.panel),
    makeElement(ELEMENT_NAME.panel),
  ]);
  render(makeDocumentHandler({ children }));
  expect(mockReactPanel).toHaveBeenCalledTimes(2);
});

it('should throw an error if the document mixes dashboard and non-dashboard elements', () => {
  const children = makeDocument([
    makeElement(ELEMENT_NAME.panel),
    makeElement(ELEMENT_NAME.dashboard),
  ]);
  expect(() => render(makeDocumentHandler({ children }))).toThrow(
    MixedPanelsError
  );
});

it('should render a dashboard', () => {
  const children = makeDocument([makeElement(ELEMENT_NAME.dashboard)]);
  render(makeDocumentHandler({ children }));
  expect(mockReactPanel).toHaveBeenCalledTimes(0);
});
