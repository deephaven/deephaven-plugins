"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const plugin = require("@deephaven/plugin");
const require$$1 = require("react");
const Log = require("@deephaven/log");
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
const log$1 = Log.module("@deephaven/js-plugin-grid-toolbar");
function GridToolbarMiddleware({
  Component,
  ...props
}) {
  const handleExport = require$$1.useCallback(() => {
    log$1.info("Export clicked");
  }, []);
  const handleResetFilters = require$$1.useCallback(() => {
    log$1.info("[0] Reset Filters clicked", props, Component);
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
const log = Log.module("@deephaven/js-plugin-grid-toolbar");
const CLEAR_ALL_FILTERS_EVENT = "InputFilterEvent.CLEAR_ALL_FILTERS";
function GridToolbarPanelMiddleware({
  Component,
  glEventHub,
  ...props
}) {
  const handleExport = require$$1.useCallback(() => {
    log.info("Export clicked");
  }, []);
  const handleResetFilters = require$$1.useCallback(() => {
    log.info("[0] Reset Filters clicked", props, Component);
    glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
  }, [glEventHub, props, Component]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar-middleware h-100 w-100", children: [
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-toolbar-content h-100 w-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Component, { glEventHub, ...props }) })
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
exports.GridToolbarPlugin = GridToolbarPlugin;
exports.default = GridToolbarPlugin;
