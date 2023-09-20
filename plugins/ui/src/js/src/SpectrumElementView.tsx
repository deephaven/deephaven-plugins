import React from 'react';
import {
  getSpectrumComponent,
  SpectrumElementNode,
} from './SpectrumElementUtils';

export type SpectrumElementViewProps = {
  children?: React.ReactNode;
  node: SpectrumElementNode;
};

export function SpectrumElementView({
  children,
  node,
}: SpectrumElementViewProps): JSX.Element | null {
  const { name, props = {} } = node;
  const Component = getSpectrumComponent(name);
  if (Component == null) {
    throw new Error(`Unknown Spectrum component ${name}`);
  }
  console.log('MJB SpectrumElementView', name, Component, props, children);
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props}>{children}</Component>;
}

export default SpectrumElementView;
