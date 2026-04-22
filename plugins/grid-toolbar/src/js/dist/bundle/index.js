"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const plugin = require("@deephaven/plugin");
const require$$1 = require("react");
const Log = require("@deephaven/log");
const chart = require("@deephaven/chart");
const irisGrid = require("@deephaven/iris-grid");
const jsapiBootstrap = require("@deephaven/jsapi-bootstrap");
const jsPluginPivot = require("@deephaven/js-plugin-pivot");
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;
function toObject(val) {
  if (val === null || val === void 0) {
    throw new TypeError("Object.assign cannot be called with null or undefined");
  }
  return Object(val);
}
function shouldUseNative() {
  try {
    if (!Object.assign) {
      return false;
    }
    var test1 = new String("abc");
    test1[5] = "de";
    if (Object.getOwnPropertyNames(test1)[0] === "5") {
      return false;
    }
    var test2 = {};
    for (var i = 0; i < 10; i++) {
      test2["_" + String.fromCharCode(i)] = i;
    }
    var order2 = Object.getOwnPropertyNames(test2).map(function(n2) {
      return test2[n2];
    });
    if (order2.join("") !== "0123456789") {
      return false;
    }
    var test3 = {};
    "abcdefghijklmnopqrst".split("").forEach(function(letter) {
      test3[letter] = letter;
    });
    if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
shouldUseNative() ? Object.assign : function(target, source) {
  var from;
  var to = toObject(target);
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);
    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from, symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }
  return to;
};
/** @license React v17.0.2
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = require$$1, g = 60103;
reactJsxRuntime_production_min.Fragment = 60107;
if ("function" === typeof Symbol && Symbol.for) {
  var h = Symbol.for;
  g = h("react.element");
  reactJsxRuntime_production_min.Fragment = h("react.fragment");
}
var m = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, n = Object.prototype.hasOwnProperty, p = { key: true, ref: true, __self: true, __source: true };
function q(c, a, k) {
  var b, d = {}, e = null, l = null;
  void 0 !== k && (e = "" + k);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (l = a.ref);
  for (b in a) n.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: g, type: c, key: e, ref: l, props: d, _owner: m.current };
}
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
const log$2 = Log.module("@deephaven/js-plugin-grid-toolbar");
function GridToolbarMiddleware({
  Component,
  ...props
}) {
  const handleExport = require$$1.useCallback(() => {
    log$2.info("Export clicked");
  }, []);
  const handleResetFilters = require$$1.useCallback(() => {
    log$2.info("[0] Reset Filters clicked", props, Component);
  }, [props, Component]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar-middleware", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          onClick: handleExport,
          children: "Export"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          onClick: handleResetFilters,
          children: "Reset Filters"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-toolbar-content", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Component, { ...props }) })
  ] });
}
const log$1 = Log.module("@deephaven/js-plugin-grid-toolbar/usePivotToggle");
const NUMERIC_TYPES = /* @__PURE__ */ new Set([
  "int",
  "long",
  "short",
  "byte",
  "double",
  "float",
  "java.lang.Integer",
  "java.lang.Long",
  "java.lang.Short",
  "java.lang.Byte",
  "java.lang.Double",
  "java.lang.Float",
  "java.math.BigDecimal",
  "java.math.BigInteger"
]);
function usePivotToggle(dh, fetch, isPivotView, setView, metadata) {
  const [pivotModel, setPivotModel] = require$$1.useState(null);
  const [isBuilding, setIsBuilding] = require$$1.useState(false);
  const pspDescriptor = require$$1.useMemo(() => {
    if (!jsPluginPivot.isCorePlusDh(dh) || metadata == null) {
      return { type: "PivotService", name: "__unavailable__" };
    }
    return {
      ...metadata,
      type: "PivotService",
      name: "psp"
    };
  }, [dh, metadata]);
  const pspFetch = jsapiBootstrap.useObjectFetch(pspDescriptor);
  const isAvailable = jsPluginPivot.isCorePlusDh(dh) && pspFetch.status === "ready";
  require$$1.useEffect(() => {
    if (pspFetch.status === "error") {
      log$1.debug("PivotService (psp) not available on this query");
    }
    if (pspFetch.status === "ready") {
      log$1.info("PivotService (psp) is available on this query");
    }
  }, [pspFetch.status]);
  const pivotModelRef = require$$1.useRef(null);
  require$$1.useEffect(() => {
    pivotModelRef.current = pivotModel;
  }, [pivotModel]);
  require$$1.useEffect(
    () => () => {
      var _a;
      (_a = pivotModelRef.current) == null ? void 0 : _a.close();
    },
    []
  );
  const handleToggle = require$$1.useCallback(async () => {
    if (isPivotView) {
      pivotModel == null ? void 0 : pivotModel.close();
      setPivotModel(null);
      setView("grid");
      return;
    }
    if (!jsPluginPivot.isCorePlusDh(dh)) {
      log$1.error("CorePlus API not available; cannot create pivot");
      return;
    }
    if (pspFetch.status !== "ready") {
      log$1.error("PivotService (psp) not available");
      return;
    }
    setIsBuilding(true);
    try {
      const [table, pspWidget] = await Promise.all([
        fetch(),
        pspFetch.fetch()
      ]);
      if ((table == null ? void 0 : table.columns) == null) {
        log$1.warn("Fetched object has no columns; cannot build pivot");
        return;
      }
      const numericColumns = [];
      const nonNumericColumns = [];
      table.columns.forEach((col) => {
        if (NUMERIC_TYPES.has(col.type)) {
          numericColumns.push(col.name);
        } else {
          nonNumericColumns.push(col.name);
        }
      });
      if (nonNumericColumns.length === 0) {
        log$1.warn("Table has no non-numeric columns for row/column keys");
        return;
      }
      const rowKeys = nonNumericColumns.slice(0, 1);
      const columnKeys = nonNumericColumns.length > 1 ? nonNumericColumns.slice(1, 2) : [];
      const aggregations = numericColumns.length > 0 ? { Sum: numericColumns } : { Count: [nonNumericColumns[0]] };
      const config = {
        source: table,
        rowKeys,
        columnKeys,
        aggregations
      };
      log$1.info("Creating pivot with config:", config);
      const corePlusDh = dh;
      const pivotService = await corePlusDh.coreplus.pivot.PivotService.getInstance(pspWidget);
      log$1.info("PivotService obtained:", pivotService);
      const pivotTable = await pivotService.createPivotTable(config);
      log$1.info("PivotTable created:", pivotTable);
      const model = new jsPluginPivot.IrisGridPivotModel(dh, pivotTable);
      setPivotModel(model);
      setView("pivot");
    } catch (e) {
      log$1.error("Failed to create pivot table", e);
    } finally {
      setIsBuilding(false);
    }
  }, [dh, fetch, isPivotView, pspFetch, pivotModel, setView]);
  return {
    isAvailable,
    pivotModel,
    isBuilding,
    handleToggle
  };
}
const log = Log.module("@deephaven/js-plugin-grid-toolbar");
const CLEAR_ALL_FILTERS_EVENT = "InputFilterEvent.CLEAR_ALL_FILTERS";
function GridToolbarPanelMiddleware({
  Component,
  fetch,
  glEventHub,
  metadata,
  ...props
}) {
  const dh = jsapiBootstrap.useApi();
  const [view, setView] = require$$1.useState("grid");
  const [chartModel, setChartModel] = require$$1.useState(null);
  const [isBuilding, setIsBuilding] = require$$1.useState(false);
  const {
    isAvailable: isPivotAvailable,
    pivotModel,
    isBuilding: isPivotBuilding,
    handleToggle: handlePivot
  } = usePivotToggle(
    dh,
    fetch,
    view === "pivot",
    setView,
    metadata
  );
  const mouseHandlers = jsPluginPivot.usePivotMouseHandlers();
  const renderer = jsPluginPivot.usePivotRenderer();
  const pivotTheme = jsPluginPivot.usePivotTheme();
  require$$1.useEffect(
    () => () => {
      chartModel == null ? void 0 : chartModel.close();
    },
    [chartModel]
  );
  const handleChart = require$$1.useCallback(async () => {
    if (view === "chart") {
      setView("grid");
      return;
    }
    setIsBuilding(true);
    try {
      const table = await fetch();
      if ((table == null ? void 0 : table.columns) == null || table.columns.length < 2) {
        log.warn("Table has fewer than 2 columns; cannot build chart");
        return;
      }
      const settings = {
        type: "LINE",
        series: [table.columns[1].name],
        xAxis: table.columns[0].name
      };
      const model = await chart.ChartModelFactory.makeModelFromSettings(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dh,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        settings,
        table
      );
      setChartModel(model);
      setView("chart");
    } catch (e) {
      log.error("Failed to build chart model", e);
    } finally {
      setIsBuilding(false);
    }
  }, [dh, fetch, view]);
  const handleResetFilters = require$$1.useCallback(() => {
    log.info("Reset Filters clicked");
    glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
  }, [glEventHub]);
  const anyBuilding = isBuilding || isPivotBuilding;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar-middleware h-100 w-100", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          disabled: anyBuilding,
          onClick: handleChart,
          children: view === "chart" ? "Grid" : "Chart"
        }
      ),
      isPivotAvailable && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          disabled: anyBuilding,
          onClick: handlePivot,
          children: view === "pivot" ? "Grid" : "Pivot"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          onClick: handleResetFilters,
          children: "Reset Filters"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar-content h-100 w-100", children: [
      view === "chart" && chartModel != null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-100 w-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(chart.Chart, { model: chartModel }) }),
      view === "pivot" && pivotModel != null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-100 w-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        irisGrid.IrisGrid,
        {
          model: pivotModel,
          mouseHandlers,
          renderer,
          theme: pivotTheme
        }
      ) }),
      view !== "chart" && view !== "pivot" && // eslint-disable-next-line react/jsx-props-no-spreading
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Component,
        {
          fetch,
          glEventHub,
          metadata,
          ...props
        }
      )
    ] })
  ] });
}
const GridToolbarPlugin = {
  name: "@deephaven/js-plugin-grid-toolbar",
  type: plugin.PluginType.WIDGET_PLUGIN,
  supportedTypes: [
    "Table",
    "TreeTable",
    "HierarchicalTable",
    "PartitionedTable"
  ],
  component: GridToolbarMiddleware,
  panelComponent: GridToolbarPanelMiddleware,
  isMiddleware: true
};
exports.GridToolbarMiddleware = GridToolbarMiddleware;
exports.GridToolbarPanelMiddleware = GridToolbarPanelMiddleware;
exports.GridToolbarPlugin = GridToolbarPlugin;
exports.default = GridToolbarPlugin;
exports.usePivotToggle = usePivotToggle;
