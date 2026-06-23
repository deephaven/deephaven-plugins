# Deephaven Theme Pack

A pack of additional UI themes for customizing the look of the Deephaven web IDE. Once installed, the bundled themes appear in the theme selector in the top right corner of the app and in the Deephaven **Settings** menu.

## Included themes

| Theme               | Base  |
| ------------------- | ----- |
| Dracula             | dark  |
| FT Theme            | light |
| IntelliJ Dark       | dark  |
| IntelliJ Light      | light |
| Kimbie Dark         | dark  |
| Night Owl           | dark  |
| Red                 | dark  |
| Solarized Dark      | dark  |
| Solarized Light     | light |
| SynthWave '84       | dark  |
| Tomorrow Night Blue | dark  |

## Prerequisites

Requires Deephaven Core version 0.37.0 or higher.

## Installation

Install the plugin from PyPI into the environment running your Deephaven server:

```sh
pip install deephaven-plugin-theme-pack
```

Restart the server, then pick a theme from the theme selector in the top right corner of the app or from the Deephaven **Settings** menu.

To build and install from source instead, refer to the main [README](../../README.md) for instructions on building plugins.

## Creating your own theme

The theme pack also serves as a starting point for authoring your own themes. The JavaScript [README](./src/js/README.md) walks through creating a custom theme from a color palette, and a [CLAUDE.md](./src/js/CLAUDE.md) guide is included to help generate new themes from a supplied palette or an existing VS Code theme using an agentic CLI.

## Contributing

Found a bug? Open an issue or pull request on the [deephaven-plugins](https://github.com/deephaven/deephaven-plugins) repository, or join the [Deephaven Community Slack](https://deephaven.io/slack).
