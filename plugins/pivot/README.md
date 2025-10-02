# Deephaven Plugin for Pivot Tables

This plugin adds UI support for Pivot tables in Core+ workers in Enterprise.

## Plugin Structure

`PivotPlugin.ts` registers the plugin with Deephaven. 
`PivotWidget.tsx` defines the plugin panel and widget handling.

## Building the Plugin

Run `npm run build` from the root directory.

## Installation

Add `@deephaven/js-plugin-pivot` js package to `pluginList` in `DhcInDhe/gradle.build`

## Using the Plugin

Refer to the [Pivot Tables documentation](https://deephaven.io/enterprise/docs/user-guide/pivots/) for code examples and links to the Python and Groovy API reference.