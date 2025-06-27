import React from 'react';
import { type ElementPlugin, PluginType } from '@deephaven/plugin';
import type { dh } from '@deephaven/jsapi-types';
import Confetti from 'react-confetti';
import FishConfetti from './FishConfetti';

export const ConfettiPlugin: ElementPlugin<dh.Widget> = {
  name: '@deephaven/confetti-plugin',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    'confetti_plugin.confetti': Confetti,
    'confetti_plugin.fish_confetti': FishConfetti,
  },
};

export default ConfettiPlugin;
