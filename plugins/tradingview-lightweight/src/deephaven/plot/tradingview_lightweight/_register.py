"""Plugin registration for TradingView Lightweight Charts."""

from deephaven.plugin import Registration, Callback
from deephaven.plugin.utilities import create_js_plugin, DheSafeCallbackWrapper

PACKAGE_NAMESPACE = "deephaven.plot.tradingview_lightweight"
JS_NAME = "_js"


class TvlRegistration(Registration):
    """Register the TvlChartType and a JsPlugin."""

    @classmethod
    def register_into(cls, callback: Callback) -> None:
        from . import TvlChartType

        callback = DheSafeCallbackWrapper(callback)
        callback.register(TvlChartType)

        js_plugin = create_js_plugin(PACKAGE_NAMESPACE, JS_NAME)
        callback.register(js_plugin)
