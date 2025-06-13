import React from 'react';
import { type ElementPlugin, PluginType } from '@deephaven/plugin';
import type { dh } from '@deephaven/jsapi-types';
import { FishTable, ElementPanel } from './components';

export const MyElementPlugin: ElementPlugin<dh.Widget> = {
  name: '@deephaven/js-my-element-plugin',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    'my.element': ElementPanel,
    'my.fish.panel': FishTable,
  },
};

export default MyElementPlugin;
