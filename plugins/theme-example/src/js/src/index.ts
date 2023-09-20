import acmeDark from './theme_dark.scss?inline';
import acmeLight from './theme_light.scss?inline';
import acmeCool from './theme_cool.scss?inline';

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

const plugin: ThemePlugin = {
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
      name: 'Acme Cool',
      baseTheme: 'light',
      styleContent: acmeCool,
    },
  ],
};

export default plugin;
