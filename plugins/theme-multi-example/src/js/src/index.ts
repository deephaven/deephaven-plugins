import acmeDark from './theme_dark.scss?inline';
import acmeLight from './theme_light.scss?inline';
import acmeOrange from './theme_orange.scss?inline';

/** TODO: Define these types in @deephaven/plugin */

interface ThemePluginConfig {
  name: string;
  baseTheme: 'dark' | 'light';
  styleContent: string;
}

interface ThemePlugin {
  name: string;
  type: 'ThemePlugin';
  themes: ThemePluginConfig | ThemePluginConfig[];
}

/** Plugin */

export const plugin: ThemePlugin = {
  name: 'Acme Theme Plugin',
  type: 'ThemePlugin',
  themes: [
    {
      name: 'Acme Dark',
      baseTheme: 'dark',
      styleContent: acmeDark,
    },
    {
      name: 'Acme Light',
      baseTheme: 'light',
      styleContent: acmeLight,
    },
    {
      name: 'Acme Orange',
      baseTheme: 'dark',
      styleContent: acmeOrange,
    },
  ],
};

export default plugin;
