autobin historgram not working yet

Upgrade to https://github.com/tradingview/lightweight-charts/releases/tag/v5.2.0 and add support for any new features to our Python api. We should maintain full coverage.

How can a user create two python charts and have them synced together? For example, if they zoom in on one chart, the other chart should also zoom in on the same time range. If they pan one chart, the other chart should also pan to the same time range. This is a common requirement for financial charts where you want to compare two different data series side by side. Make a plan to accomplish adding support for syncing two TVL charts together via a python API.

5.2 adds better hover/click event details. How can we expose on_press events similar to deephaven.ui to the python API so that users can get events from the chart and use them in their application? We probably only want to expose actual click events, not hover events as that is to expensive to track back in python. Make a plan to accomplish adding support for click events on TVL charts via a python API.

Tooltips default styling feature

Make a plan to create comprehensive documentation in a /docs folder for the tradingview-lightweight plugin. It should mirror the structure of the plotly-express plugin documention, with simlar sections and approach to documention. We want to comprehensively cover all features of the plugin API in our documentation, arranged logically and with examples for as much as possible. We want to use the same writting style and tone of voice. We need to also cover special aspects of our plugin such as automatic downsampling and autobinning.
