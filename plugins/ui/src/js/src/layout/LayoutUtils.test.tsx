/* eslint-disable react/jsx-key */
import React from 'react';
import { TestUtils } from '@deephaven/utils';
import Column from './Column';
import {
  PANEL_ELEMENT_NAME,
  ROW_ELEMENT_NAME,
  COLUMN_ELEMENT_NAME,
  isPanelElementNode,
  isRowElementNode,
  isColumnElementNode,
  isStackElementNode,
  STACK_ELEMENT_NAME,
  normalizeDashboardChildren,
  normalizeColumnChildren,
  normalizeRowChildren,
  normalizeStackChildren,
} from './LayoutUtils';
import Row from './Row';
import Stack from './Stack';
import ReactPanel from './ReactPanel';

beforeEach(() => {
  TestUtils.disableConsoleOutput();
});

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

/**
 * Deeply removes keys from a react node and its children.
 * @param node The react node to remove keys from
 * @returns React node without keys
 */
function removeReactKeys(node: React.ReactNode): React.ReactNode {
  if (Array.isArray(node)) {
    return node.map(removeReactKeys);
  }

  if (React.isValidElement(node)) {
    return React.cloneElement(node, { ...node.props, key: null });
  }

  return node;
}

/**
 * Compares 2 react nodes using an expect statement.
 * Removes the key from any react elements before comparing.
 * React.Children.map adds a key attribute to each child, which makes it difficult to compare the normalized children.
 * @param a First react node
 * @param b Second react node
 */
function compareReactNodes(a: React.ReactNode, b: React.ReactNode): void {
  expect(removeReactKeys(a)).toEqual(removeReactKeys(b));
}

describe('normalizeDashboardChildren', () => {
  test('wraps rows with a column', () => {
    compareReactNodes(
      normalizeDashboardChildren([<Row />, <Row />]),
      <Column>
        <Row />
        <Row />
      </Column>
    );

    compareReactNodes(
      normalizeDashboardChildren([<Row />, <Stack />]),
      <Column>
        <Row />
        <Stack />
      </Column>
    );
  });

  test('wraps columns with a row', () => {
    compareReactNodes(
      normalizeDashboardChildren([<Column />, <Column />]),
      <Row>
        <Column />
        <Column />
      </Row>
    );

    compareReactNodes(
      normalizeDashboardChildren([<Column />, <Stack />]),
      <Row>
        <Column />
        <Stack />
      </Row>
    );
  });

  test('wraps mixed rows and columns with a column', () => {
    compareReactNodes(
      normalizeDashboardChildren([<Row />, <Column />]),
      <Column>
        <Row />
        <Column />
      </Column>
    );
  });

  test('does not wrap a single layout child', () => {
    compareReactNodes(normalizeDashboardChildren(<Row />), <Row />);
    compareReactNodes(normalizeDashboardChildren(<Column />), <Column />);
  });

  test('wraps a single non-layout child in a column', () => {
    compareReactNodes(
      normalizeDashboardChildren(<ReactPanel />),
      <Column>
        <ReactPanel />
      </Column>
    );
  });
});

describe('normalizeColumnChildren', () => {
  test('wraps children in rows when needed', () => {
    compareReactNodes(
      normalizeColumnChildren([<Column />, <Row />, <Stack />]),
      [
        <Column />,
        <Row />,
        <Row>
          <Stack />
        </Row>,
      ]
    );

    compareReactNodes(normalizeColumnChildren([<Column />, <Stack />]), [
      <Column />,
      <Row>
        <Stack />
      </Row>,
    ]);
  });

  test('wraps children in stacks when needed', () => {
    compareReactNodes(normalizeColumnChildren(<Stack />), [<Stack />]);

    compareReactNodes(normalizeColumnChildren([<Stack />, <ReactPanel />]), [
      <Stack />,
      <Stack>
        <ReactPanel />
      </Stack>,
    ]);
  });
});

describe('normalizeRowChildren', () => {
  test('wraps children in columns when needed', () => {
    compareReactNodes(normalizeRowChildren([<Column />, <Row />, <Stack />]), [
      <Column />,
      <Row />,
      <Column>
        <Stack />
      </Column>,
    ]);

    compareReactNodes(normalizeRowChildren([<Row />, <Stack />]), [
      <Row />,
      <Column>
        <Stack />
      </Column>,
    ]);
  });

  test('wraps children in stacks when needed', () => {
    compareReactNodes(normalizeRowChildren(<Stack />), [<Stack />]);

    compareReactNodes(normalizeRowChildren([<Stack />, <ReactPanel />]), [
      <Stack />,
      <Stack>
        <ReactPanel />
      </Stack>,
    ]);
  });
});

describe('normalizeStackChildren', () => {
  test('wraps children in panels with Untitled default title when needed', () => {
    compareReactNodes(normalizeStackChildren(<ReactPanel />), [<ReactPanel />]);

    compareReactNodes(normalizeStackChildren([<ReactPanel />, <Row />]), [
      <ReactPanel />,
      <ReactPanel title="Untitled">
        <Row />
      </ReactPanel>,
    ]);
  });
});
