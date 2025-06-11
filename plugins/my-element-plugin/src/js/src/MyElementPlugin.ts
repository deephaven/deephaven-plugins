import React from 'react';
import { type ElementPlugin, PluginType } from '@deephaven/plugin';
import type { dh } from '@deephaven/jsapi-types';
import { InfoPanel, ElementPanel } from './components';

export const MyElementPlugin: ElementPlugin<dh.Widget> = {
  name: '@deephaven/js-my-element-plugin',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    'my.element': ElementPanel,
    'my.element.info': InfoPanel,
  },
};

export default MyElementPlugin;
