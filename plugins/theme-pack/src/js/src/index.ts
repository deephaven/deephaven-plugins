import type { ThemePlugin } from '@deephaven/plugin';
import draculaStyleContent from './dracula-theme.css?inline';
import ftStyleContent from './theme.css?inline';
import intellijDarkStyleContent from './intellij-dark-theme.css?inline';
import intellijLightStyleContent from './intellij-light-theme.css?inline';
import kimbieDarkStyleContent from './kimbie-dark-theme.css?inline';
import nightOwlStyleContent from './night-owl-theme.css?inline';
import redStyleContent from './red-theme.css?inline';
import solarizedDarkStyleContent from './solarized-dark-theme.css?inline';
import solarizedLightStyleContent from './solarized-light-theme.css?inline';
import synthwave84StyleContent from './synthwave84-theme.css?inline';
import tomorrowNightBlueStyleContent from './tomorrow-night-blue-theme.css?inline';

const plugin: ThemePlugin = {
  name: 'theme-pack', // match the plugin name in the package.json, and the folder name
  type: 'ThemePlugin',
  themes: [
    {
      name: 'Dracula',
      baseTheme: 'dark',
      styleContent: draculaStyleContent,
    },
    {
      name: 'FT Theme', // A human-readable name for the theme
      baseTheme: 'light', // The base theme to extend from, either 'light' or 'dark'
      styleContent: ftStyleContent, // this is a string containing your .css file contents
    },
    {
      name: 'IntelliJ Dark',
      baseTheme: 'dark',
      styleContent: intellijDarkStyleContent,
    },
    {
      name: 'IntelliJ Light',
      baseTheme: 'light',
      styleContent: intellijLightStyleContent,
    },
    {
      name: 'Kimbie Dark',
      baseTheme: 'dark',
      styleContent: kimbieDarkStyleContent,
    },
    {
      name: 'Night Owl',
      baseTheme: 'dark',
      styleContent: nightOwlStyleContent,
    },
    {
      name: 'Red',
      baseTheme: 'dark',
      styleContent: redStyleContent,
    },
    {
      name: 'Solarized Dark',
      baseTheme: 'dark',
      styleContent: solarizedDarkStyleContent,
    },
    {
      name: 'Solarized Light',
      baseTheme: 'light',
      styleContent: solarizedLightStyleContent,
    },
    {
      name: "SynthWave '84",
      baseTheme: 'dark',
      styleContent: synthwave84StyleContent,
    },
    {
      name: 'Tomorrow Night Blue',
      baseTheme: 'dark',
      styleContent: tomorrowNightBlueStyleContent,
    },
  ],
};

export default plugin;
