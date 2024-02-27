import type { PlaywrightTestConfig } from '@playwright/test';
import DefaultConfig from './playwright.config';

const config: PlaywrightTestConfig = {
  ...DefaultConfig,
  use: {
    ...DefaultConfig.use,
    baseURL: 'http://deephaven-plugins:10000/ide/',
  }
};

export default config;
