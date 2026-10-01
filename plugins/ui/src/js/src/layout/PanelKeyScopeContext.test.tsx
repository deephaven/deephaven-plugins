import React from 'react';
import { render, screen } from '@testing-library/react';
import type { DashboardLayoutConfig } from '@deephaven/dashboard';
import Column from './Column';
import Row from './Row';
import Stack from './Stack';
import { InitialLayoutConfigContext } from './InitialLayoutConfigContext';
import {
  getPanelKey,
  PanelKeyScopeContext,
  usePanelKeyScope,
} from './PanelKeyScopeContext';
import { type KeyPathProps } from './LayoutUtils';

// Render children as-is, so the probe isn't wrapped in stacks and panels
jest.mock('./LayoutUtils', () => ({
  ...jest.requireActual('./LayoutUtils'),
  normalizeColumnChildren: jest.fn((children: React.ReactNode) => children),
  normalizeRowChildren: jest.fn((children: React.ReactNode) => children),
  normalizeStackChildren: jest.fn((children: React.ReactNode) => children),
  wrapBareChildrenInPanel: jest.fn((children: React.ReactNode) => children),
}));

const mockLayoutConfig = [
  { type: 'row', content: [] },
] as unknown as DashboardLayoutConfig;

function ScopeProbe(): JSX.Element {
  return <div data-testid="scope">{JSON.stringify(usePanelKeyScope())}</div>;
}

describe('getPanelKey', () => {
  it('returns undefined without a key path', () => {
    expect(getPanelKey(['scope'])).toBeUndefined();
    expect(getPanelKey(['scope'], [])).toBeUndefined();
  });

  it('serializes the scope followed by the key path', () => {
    expect(getPanelKey(['a', 'b'], ['c'])).toBe(
      JSON.stringify(['a', 'b', 'c'])
    );
  });

  it('does not collide on keys containing separators', () => {
    expect(getPanelKey([], ['a/b'])).not.toBe(getPanelKey(['a'], ['b']));
  });
});

describe.each([
  ['Row', Row],
  ['Column', Column],
  ['Stack', Stack],
] as [string, React.ComponentType<React.PropsWithChildren<KeyPathProps>>][])(
  '%s',
  (_name, Component) => {
    it.each([
      ['creating the layout', undefined],
      ['rehydrating the layout', mockLayoutConfig],
    ])('adds its key path to the scope when %s', (_, layoutConfig) => {
      render(
        <InitialLayoutConfigContext.Provider value={layoutConfig}>
          <PanelKeyScopeContext.Provider value={['outer']}>
            <Component __dhKeyPath={['inner']}>
              <ScopeProbe />
            </Component>
          </PanelKeyScopeContext.Provider>
        </InitialLayoutConfigContext.Provider>
      );

      expect(screen.getByTestId('scope')).toHaveTextContent(
        JSON.stringify(['outer', 'inner'])
      );
    });

    it('passes the scope through when unkeyed', () => {
      render(
        <PanelKeyScopeContext.Provider value={['outer']}>
          <Component>
            <ScopeProbe />
          </Component>
        </PanelKeyScopeContext.Provider>
      );

      expect(screen.getByTestId('scope')).toHaveTextContent(
        JSON.stringify(['outer'])
      );
    });
  }
);
