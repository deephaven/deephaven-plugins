"use strict";
const plugin = require("@deephaven/plugin");
const React = require("react");
const Log = require("@deephaven/log");
const components = require("@deephaven/components");
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n2) {
  if (n2.__esModule) return n2;
  var f2 = n2.default;
  if (typeof f2 == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f2, arguments, this.constructor);
      }
      return f2.apply(this, arguments);
    };
    a.prototype = f2.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n2).forEach(function(k) {
    var d2 = Object.getOwnPropertyDescriptor(n2, k);
    Object.defineProperty(a, k, d2.get ? d2 : {
      enumerable: true,
      get: function() {
        return n2[k];
      }
    });
  });
  return a;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
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
var objectAssign = shouldUseNative() ? Object.assign : function(target, source) {
  var from2;
  var to = toObject(target);
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from2 = Object(arguments[s]);
    for (var key in from2) {
      if (hasOwnProperty$1.call(from2, key)) {
        to[key] = from2[key];
      }
    }
    if (getOwnPropertySymbols) {
      symbols = getOwnPropertySymbols(from2);
      for (var i = 0; i < symbols.length; i++) {
        if (propIsEnumerable.call(from2, symbols[i])) {
          to[symbols[i]] = from2[symbols[i]];
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
var f = React, g = 60103;
reactJsxRuntime_production_min.Fragment = 60107;
if ("function" === typeof Symbol && Symbol.for) {
  var h = Symbol.for;
  g = h("react.element");
  reactJsxRuntime_production_min.Fragment = h("react.fragment");
}
var m = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, n = Object.prototype.hasOwnProperty, p = { key: true, ref: true, __self: true, __source: true };
function q(c, a, k) {
  var b, d2 = {}, e = null, l = null;
  void 0 !== k && (e = "" + k);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (l = a.ref);
  for (b in a) n.call(a, b) && !p.hasOwnProperty(b) && (d2[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d2[b] && (d2[b] = a[b]);
  return { $$typeof: g, type: c, key: e, ref: l, props: d2, _owner: m.current };
}
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
const log$4 = Log.module("@deephaven/js-plugin-grid-toolbar");
function GridToolbarMiddleware({
  Component,
  ...props
}) {
  const handleExport = React.useCallback(() => {
    log$4.info("Export clicked");
  }, []);
  const handleResetFilters = React.useCallback(() => {
    log$4.info("[0] Reset Filters clicked", props, Component);
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
function ownKeys$3(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$3(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$3(Object(t), true).forEach(function(r2) {
      _defineProperty$9(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$3(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$9(e, r, t) {
  return (r = _toPropertyKey$9(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$9(t) {
  var i = _toPrimitive$9(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$9(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var Chart = /* @__PURE__ */ React.lazy(() => Promise.resolve().then(() => require("./Chart-DElXbH_b.cjs")));
function LazyChart(props) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(React.Suspense, {
    fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(components.LoadingOverlay, {}),
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chart, _objectSpread$3({}, props))
  });
}
function removeNullAndUndefined() {
  for (var _len = arguments.length, maybeDefined = new Array(_len), _key = 0; _key < _len; _key++) {
    maybeDefined[_key] = arguments[_key];
  }
  return maybeDefined.filter((m2) => m2 != null);
}
function _defineProperty$8(obj, key, value2) {
  key = _toPropertyKey$8(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$8(arg) {
  var key = _toPrimitive$8(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$8(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
class CanceledPromiseError extends Error {
  constructor() {
    super(...arguments);
    _defineProperty$8(this, "isCanceled", true);
  }
}
function bindAllMethods(instance) {
  var traversePrototypeChain = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
  var methodNames = getAllMethodNames(instance, traversePrototypeChain);
  methodNames.forEach((methodName) => {
    instance[methodName] = instance[methodName].bind(instance);
  });
}
function getAllMethodNames(instance, traversePrototypeChain) {
  var methodNames = /* @__PURE__ */ new Set();
  var current = instance;
  var level = 0;
  while (current != null && current !== Object.prototype && (level <= 1 || traversePrototypeChain)) {
    for (var name of Object.getOwnPropertyNames(current)) {
      var _Object$getOwnPropert;
      if (name !== "constructor" && // Ensure this is a method and not a getter
      typeof ((_Object$getOwnPropert = Object.getOwnPropertyDescriptor(current, name)) === null || _Object$getOwnPropert === void 0 ? void 0 : _Object$getOwnPropert.value) === "function") {
        methodNames.add(name);
      }
    }
    current = Object.getPrototypeOf(current);
    level += 1;
  }
  return [...methodNames.keys()];
}
function _defineProperty$7(obj, key, value2) {
  key = _toPropertyKey$7(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$7(arg) {
  var key = _toPrimitive$7(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$7(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
class TimeoutError extends Error {
  constructor() {
    super(...arguments);
    _defineProperty$7(this, "isTimeout", true);
  }
}
class PromiseUtils {
  /**
   * Creates a promise that can be canceled by calling the `cancel` function
   * Pass an optional `cleanupFunc` to perform actions on the resolved item after promise is cancelled.
   * @param promise The item to resolve
   * @param cleanup Function to cleanup the resolved item after cancelation. Called after both this promise is cancelled and the wrapped item was resolved (order does not matter).
   */
  static makeCancelable(promise2, cleanup) {
    var hasCanceled = false;
    var resolved;
    var rejectFn;
    var wrappedPromise = new Promise((resolve, reject) => {
      rejectFn = reject;
      Promise.resolve(promise2).then((val) => {
        if (hasCanceled) {
          if (cleanup) {
            cleanup(val);
          }
        } else {
          resolved = val;
          resolve(val);
        }
      }).catch((error) => reject(error));
    });
    wrappedPromise.cancel = () => {
      hasCanceled = true;
      rejectFn(new CanceledPromiseError());
      if (resolved != null && cleanup) {
        cleanup(resolved);
      }
    };
    return wrappedPromise;
  }
  static isCanceled(error) {
    return error instanceof CanceledPromiseError;
  }
  static isTimedOut(error) {
    return error instanceof TimeoutError;
  }
  /**
   * Wrap a callback call in a Promise + setTimeout.
   * @param timeoutMs
   * @param callback
   */
  static withTimeout(timeoutMs, callback) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(callback());
        } catch (err) {
          reject(err);
        }
      }, timeoutMs);
    });
  }
}
function assertInstanceOf(instance, type) {
  if (!(instance instanceof type)) {
    throw new Error("Expected instance of ".concat(type.name));
  }
}
function assertNotNull(value2) {
  var message = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "Value is null or undefined";
  if (value2 == null) throw new Error(message);
}
class TextUtils {
  /**
   * Joins a list of strings with a comma, keeping the oxford comma and adding "and" as appropriate.
   * Eg.
   * One
   * One and Two
   * One, Two, and Three
   * @param items The items to join in a list
   * @param conjunction Conjunction to use between the last two items
   */
  static join(items) {
    var conjunction = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "and";
    if (items == null || items.length === 0) {
      return "";
    }
    if (items.length === 1) {
      return items[0];
    }
    if (items.length === 2) {
      return "".concat(items[0], " ").concat(conjunction, " ").concat(items[1]);
    }
    var itemText = items.slice(0, items.length - 1).join(", ");
    var lastItem = items[items.length - 1];
    return "".concat(itemText, ", ").concat(conjunction, " ").concat(lastItem);
  }
  /**
   * Converts text to lower case, handling null if necessary and returning an empty string
   * @param text The text to convert to lower case
   * @param isNullAllowed True if a null string should return an empty string from this function. If false an error is thrown if null is passed in.
   */
  static toLower(text) {
    var isNullAllowed = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    if (text == null) {
      if (isNullAllowed) {
        return "";
      }
      throw new Error("Null string passed in to TextUtils.toLower");
    }
    return text.toLowerCase();
  }
  /**
   *
   * @param a The string to sort
   * @param b Second string to sort
   * @param isAscending Whether to sort ascending or descending
   */
  static sort(a, b) {
    var isAscending = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    if (a < b) {
      return isAscending ? -1 : 1;
    }
    if (a > b) {
      return isAscending ? 1 : -1;
    }
    return 0;
  }
}
function ownKeys$2(object, enumerableOnly) {
  var keys2 = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys2.push.apply(keys2, symbols);
  }
  return keys2;
}
function _objectSpread$2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$2(Object(source), true).forEach(function(key) {
      _defineProperty$6(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach(function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function _defineProperty$6(obj, key, value2) {
  key = _toPropertyKey$6(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$6(arg) {
  var key = _toPrimitive$6(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$6(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
var DATE_TIME_REGEX = /\s*(\d{4})([-./](\d{1,2}|[a-z]+))?([-./](\d{1,2}))?([tT\s](\d{2})([:](\d{2}))?([:](\d{2}))?([.](\d{1,9}))?)?(.*)/;
class DateUtils {
  /**
   *
   * @param timeZone The time zone to parse this time in. E.g. America/New_York
   * @param year The year for the date
   * @param month The month, starting at 0
   * @param day The day, starting at 1
   * @param hour The hours
   * @param minute The minutes
   * @param second The seconds
   * @param ns The nanoseconds
   */
  static makeDateWrapper(dh, timeZone, year) {
    var month = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    var day = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 1;
    var hour = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : 0;
    var minute = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : 0;
    var second = arguments.length > 7 && arguments[7] !== void 0 ? arguments[7] : 0;
    var ns = arguments.length > 8 && arguments[8] !== void 0 ? arguments[8] : 0;
    if (!timeZone) {
      throw new Error("No timezone provided");
    }
    var yearString = "".concat(year).padStart(4, "0");
    var monthString = "".concat(month + 1).padStart(2, "0");
    var dayString = "".concat(day).padStart(2, "0");
    var hourString = "".concat(hour).padStart(2, "0");
    var minuteString = "".concat(minute).padStart(2, "0");
    var secondString = "".concat(second).padStart(2, "0");
    var nanoString = "".concat(ns).padStart(9, "0");
    var dateString = "".concat(yearString, "-").concat(monthString, "-").concat(dayString, " ").concat(hourString, ":").concat(minuteString, ":").concat(secondString, ".").concat(nanoString);
    return dh.i18n.DateTimeFormat.parse(DateUtils.FULL_DATE_FORMAT, dateString, dh.i18n.TimeZone.getTimeZone(timeZone));
  }
  /**
   * Takes the string the user entered and returns the next nanos value
   * @param nanoString The nano string to get the next one of
   * @returns The value of the next nanos
   */
  static getNextNanos(nanoString) {
    var sigNanos = parseInt(nanoString, 10);
    var zeros = "0".repeat(9 - nanoString.length);
    var nextNanoString = "".concat(sigNanos + 1).concat(zeros);
    return parseInt(nextNanoString, 10);
  }
  /**
   * @param components The string components that were parsed from the original string
   * @param values The values that were parsed from the components
   * @param timeZone The time zone to parse the date in. E.g. America/New_York
   * @returns Returns the DateWrapper for the next date, or null if a full date was passed in
   */
  static getNextDate(dh, components2, values, timeZone) {
    var {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos
    } = values;
    if (components2.nanos != null) {
      if (components2.nanos.length === 9) {
        return null;
      }
      nanos = DateUtils.getNextNanos(components2.nanos);
      if (nanos > 999999999) {
        seconds += 1;
        nanos = 0;
      }
    } else if (components2.seconds != null) {
      seconds += 1;
    } else if (components2.minutes != null) {
      minutes += 1;
    } else if (components2.hours != null) {
      hours += 1;
    } else if (components2.date != null) {
      date += 1;
    } else if (components2.month != null) {
      month += 1;
    } else {
      year += 1;
    }
    var jsDate = new Date(year, month, date, hours, minutes, seconds);
    return DateUtils.makeDateWrapper(dh, timeZone, jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate(), jsDate.getHours(), jsDate.getMinutes(), jsDate.getSeconds(), nanos);
  }
  /**
   * Get the JS month value for the provided string.
   * Matches digits or a month name (eg. '1', '01', 'jan', 'january' should all work)
   * @param monthString The string to parse to a JS month value
   * @returns number The JS month value, which starts at 0 for january, or NaN if nothing could be parsed
   */
  static parseMonth(monthString) {
    var month = parseInt(monthString, 10);
    if (!Number.isNaN(month)) {
      if (month >= 1 && month <= 12) {
        return month - 1;
      }
      return NaN;
    }
    var cleanMonthString = monthString.trim().toLowerCase();
    if (cleanMonthString.length >= 3) {
      for (var i = 0; i < DateUtils.months.length; i += 1) {
        if (DateUtils.months[i].startsWith(cleanMonthString)) {
          return i;
        }
      }
    }
    return NaN;
  }
  /**
   * Parse a date object out of the provided string segments.
   * Also using `parseMonth` to get month names like Aug/August rather than
   * simply doing `parseInt`.
   * @param yearString The year part of the string
   * @param monthString The month part of the string
   * @param dayString The day part of the string
   * @param hourString The hour part of the string
   * @param minuteString The minute part of the string
   * @param secondString The second part of the string
   * @param nanoString The milli part of the string
   */
  static parseDateValues(yearString, monthString, dayString, hourString, minuteString, secondString, nanoString) {
    var year = parseInt(yearString, 10);
    var month = monthString != null ? this.parseMonth(monthString) : 0;
    var date = dayString != null ? parseInt(dayString, 10) : 1;
    var hours = hourString != null ? parseInt(hourString, 10) : 0;
    var minutes = minuteString != null ? parseInt(minuteString, 10) : 0;
    var seconds = secondString != null ? parseInt(secondString, 10) : 0;
    var nanos = nanoString != null ? parseInt(nanoString.padEnd(9, "0"), 10) : 0;
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(date) || Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds) || Number.isNaN(nanos)) {
      return null;
    }
    return {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos
    };
  }
  /**
   * Parse out a date time string into it's string components.
   * Anything that is not captured in the string will be undefined.
   *
   * @param dateTimeString The date time string to parse
   * @param allowOverflow If true, will allow overflow characters after the date
   * string
   * @returns Containing the date time components
   */
  static parseDateTimeString(dateTimeString) {
    var allowOverflow = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    var result = DATE_TIME_REGEX.exec(dateTimeString);
    if (result == null) {
      throw new Error("Unexpected date string: ".concat(dateTimeString));
    }
    var [, year, , month, , date, , hours, , minutes, , seconds, , nanos, overflow] = result;
    if (!allowOverflow && overflow != null && overflow.length > 0) {
      throw new Error("Unexpected characters after date string '".concat(dateTimeString, "': ").concat(overflow));
    }
    var dateParts = {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos
    };
    return allowOverflow ? _objectSpread$2(_objectSpread$2({}, dateParts), {}, {
      overflow
    }) : dateParts;
  }
  /**
   * Parses the date range provided from a string of text.
   * @param text The string to parse the date from. Can be a keyword like "today", or in the format "2018-08-04"
   * @param timeZone The time zone to parse this range in. E.g. America/New_York
   * @returns A tuple with the start and end value/null for that date range, or both null
   */
  static parseDateRange(dh, text, timeZone) {
    var cleanText = text.trim().toLowerCase();
    if (cleanText.length === 0) {
      throw new Error("Cannot parse date range from empty string");
    }
    if (cleanText === "null") {
      return [null, null];
    }
    if (cleanText === "today") {
      var now = new Date(Date.now());
      var _startDate = DateUtils.makeDateWrapper(dh, timeZone, now.getFullYear(), now.getMonth(), now.getDate());
      var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      var _endDate = DateUtils.makeDateWrapper(dh, timeZone, tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      return [_startDate, _endDate];
    }
    if (cleanText === "yesterday") {
      var _now = new Date(Date.now());
      var yesterday = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - 1);
      var _startDate2 = DateUtils.makeDateWrapper(dh, timeZone, yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      var _endDate2 = DateUtils.makeDateWrapper(dh, timeZone, _now.getFullYear(), _now.getMonth(), _now.getDate());
      return [_startDate2, _endDate2];
    }
    if (cleanText === "now") {
      var _now2 = new Date(Date.now());
      var date = dh.DateWrapper.ofJsDate(_now2);
      return [date, null];
    }
    var components2 = DateUtils.parseDateTimeString(cleanText);
    if (components2.year == null && components2.month == null && components2.date == null) {
      throw new Error("Unable to extract year, month, or day ".concat(cleanText));
    }
    var values = DateUtils.parseDateValues(components2.year, components2.month, components2.date, components2.hours, components2.minutes, components2.seconds, components2.nanos);
    if (values == null) {
      throw new Error("Unable to extract date values from ".concat(components2));
    }
    var startDate = DateUtils.makeDateWrapper(dh, timeZone, values.year, values.month, values.date, values.hours, values.minutes, values.seconds, values.nanos);
    var endDate = DateUtils.getNextDate(dh, components2, values, timeZone);
    return [startDate, endDate];
  }
  /**
   * Gets the Js Date object from the provided DateWrapper.
   * In unit test, DateWrapper is just a number provided in millis, so handles that case.
   * @param dateWrapper The DateWrapper object, or time in millis
   */
  static getJsDate(dateWrapper) {
    if (typeof dateWrapper === "number") {
      return new Date(dateWrapper);
    }
    return dateWrapper.asDate();
  }
  /**
   * Trim overflow (usually timezone) from a date time string.
   * @param dateTimeString The date time string to trim
   * @returns The date time string without overflow
   */
  static trimDateTimeStringTimeZone(dateTimeString) {
    var {
      overflow = ""
    } = DateUtils.parseDateTimeString(dateTimeString, true);
    if (overflow === "") {
      return dateTimeString;
    }
    if (!/^\s[A-Za-z]+/.test(overflow)) {
      throw new Error("Unexpected timezone format in overflow: '".concat(dateTimeString, "'"));
    }
    return dateTimeString.slice(0, -overflow.length);
  }
}
_defineProperty$6(DateUtils, "FULL_DATE_FORMAT", "yyyy-MM-dd HH:mm:ss.SSSSSSSSS");
_defineProperty$6(DateUtils, "months", ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]);
function createFilterConditionFactory(columnNames, createColumnCondition) {
  var conditionOperator = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "or";
  return function filterConditionFactory(maybeTable) {
    var maybeColumns = maybeTable === null || maybeTable === void 0 ? void 0 : maybeTable.findColumns(typeof columnNames === "string" ? [columnNames] : columnNames);
    if (maybeColumns == null || maybeColumns.length === 0) {
      return null;
    }
    var filterConditions = maybeColumns.map(createColumnCondition);
    return filterConditions.reduce((current, next) => current[conditionOperator](next));
  };
}
function createValueFilter(tableUtils, columnNames, value2, operator) {
  return createFilterConditionFactory(columnNames, (col) => col.filter()[operator](tableUtils.makeFilterValue(col.type, value2)), "or");
}
function _defineProperty$5(obj, key, value2) {
  key = _toPropertyKey$5(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$5(arg) {
  var key = _toPrimitive$5(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$5(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
class Operator {
}
_defineProperty$5(Operator, "not", "not");
_defineProperty$5(Operator, "and", "and");
_defineProperty$5(Operator, "or", "or");
function _defineProperty$4(obj, key, value2) {
  key = _toPropertyKey$4(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$4(arg) {
  var key = _toPrimitive$4(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$4(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
class Type {
}
_defineProperty$4(Type, "eq", "eq");
_defineProperty$4(Type, "eqIgnoreCase", "eqIgnoreCase");
_defineProperty$4(Type, "notEq", "notEq");
_defineProperty$4(Type, "notEqIgnoreCase", "notEqIgnoreCase");
_defineProperty$4(Type, "greaterThan", "greaterThan");
_defineProperty$4(Type, "greaterThanOrEqualTo", "greaterThanOrEqualTo");
_defineProperty$4(Type, "lessThan", "lessThan");
_defineProperty$4(Type, "lessThanOrEqualTo", "lessThanOrEqualTo");
_defineProperty$4(Type, "in", "in");
_defineProperty$4(Type, "inIgnoreCase", "inIgnoreCase");
_defineProperty$4(Type, "notIn", "notIn");
_defineProperty$4(Type, "notInIgnoreCase", "notInIgnoreCase");
_defineProperty$4(Type, "isTrue", "isTrue");
_defineProperty$4(Type, "isFalse", "isFalse");
_defineProperty$4(Type, "isNull", "isNull");
_defineProperty$4(Type, "invoke", "invoke");
_defineProperty$4(Type, "contains", "contains");
_defineProperty$4(Type, "notContains", "notContains");
_defineProperty$4(Type, "containsIgnoreCase", "containsIgnoreCase");
_defineProperty$4(Type, "startsWith", "startsWith");
_defineProperty$4(Type, "endsWith", "endsWith");
_defineProperty$4(Type, "containsAny", "containsAny");
Log.module("ViewportDataUtils");
function getSize(table) {
  return table == null || isClosed(table) ? 0 : table.size;
}
function isClosed(table) {
  if ("isClosed" in table) {
    return table.isClosed;
  }
  return false;
}
function asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value2 = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value2);
  } else {
    Promise.resolve(value2).then(_next, _throw);
  }
}
function _asyncToGenerator$1(fn) {
  return function() {
    var self3 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self3, args);
      function _next(value2) {
        asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "next", value2);
      }
      function _throw(err) {
        asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _defineProperty$3(obj, key, value2) {
  key = _toPropertyKey$3(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value2, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value2;
  }
  return obj;
}
function _toPropertyKey$3(arg) {
  var key = _toPrimitive$3(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _toPrimitive$3(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
var log$3 = Log.module("TableUtils");
class TableUtils {
  // Regex looking for a negative or positive integer or decimal number
  /**
   * Copy a given table and apply filters.
   * @param maybeTable Table to copy and apply filters to
   * @param filterFactories Filter condition factories to apply
   * @returns A derived, filtered table
   */
  static copyTableAndApplyFilters(maybeTable) {
    var _arguments = arguments;
    return _asyncToGenerator$1(function* () {
      if (maybeTable == null) {
        return null;
      }
      var derivedTable = yield maybeTable.copy();
      for (var _len = _arguments.length, filterFactories = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        filterFactories[_key - 1] = _arguments[_key];
      }
      derivedTable.applyFilter(removeNullAndUndefined(...filterFactories.map((f2) => f2(derivedTable))));
      return derivedTable;
    })();
  }
  /**
   * Executes a callback on a given table and returns a Promise that will resolve
   * the next time a particular event type fires on the table.
   * @param exec Callback function to execute.
   * @param table Table that gets passed to the `exec` function and that is
   * subscribed to for a given `eventType`.
   * @param eventType The event type to listen for.
   * @param timeout If the event doesn't fire within the timeout, the returned
   * Promise will be rejected.
   * @returns a Promise to the original table that resolves on next `eventType`
   * event
   */
  static getSortIndex(sort, columnName) {
    for (var i = 0; i < sort.length; i += 1) {
      var _s$column;
      var s = sort[i];
      if (((_s$column = s.column) === null || _s$column === void 0 ? void 0 : _s$column.name) === columnName) {
        return i;
      }
    }
    return null;
  }
  /**
   * @param tableSort The sorts from the table to get the sort from
   * @param columnName The name of the column to get the sort for
   * @returns The sort for the column, or null if it's not sorted
   */
  static getSortForColumn(tableSort, columnName) {
    var sortIndex = TableUtils.getSortIndex(tableSort, columnName);
    if (sortIndex != null) {
      return tableSort[sortIndex];
    }
    return null;
  }
  static getFilterText(filter) {
    if (filter) {
      return filter.toString();
    }
    return null;
  }
  /** Return the valid filter types for the column */
  static getFilterTypes(columnType) {
    if (TableUtils.isBooleanType(columnType)) {
      return [Type.isTrue, Type.isFalse, Type.isNull];
    }
    if (TableUtils.isCharType(columnType) || TableUtils.isNumberType(columnType) || TableUtils.isDateType(columnType)) {
      return [Type.eq, Type.notEq, Type.greaterThan, Type.greaterThanOrEqualTo, Type.lessThan, Type.lessThanOrEqualTo];
    }
    if (TableUtils.isTextType(columnType)) {
      return [Type.eq, Type.eqIgnoreCase, Type.notEq, Type.notEqIgnoreCase, Type.contains, Type.notContains, Type.startsWith, Type.endsWith];
    }
    return [];
  }
  static getNextSort(columns, sorts, columnIndex) {
    var column = columns[columnIndex];
    if (column == null) {
      return null;
    }
    var sort = TableUtils.getSortForColumn(sorts, column.name);
    if (sort === null) {
      return this.makeColumnSort(columns, columnIndex, TableUtils.sortDirection.ascending, false);
    }
    if (sort.direction === TableUtils.sortDirection.ascending) {
      return this.makeColumnSort(columns, columnIndex, TableUtils.sortDirection.descending, false);
    }
    return null;
  }
  static makeColumnSort(columns, columnIndex, direction, isAbs) {
    var column = columns[columnIndex];
    if (column == null) {
      return null;
    }
    if (direction === TableUtils.sortDirection.none) {
      return null;
    }
    return {
      column: {
        name: column.name,
        type: column.type
      },
      isAbs,
      direction
    };
  }
  /**
   * Toggles the sort for the specified column
   * @param sorts The current sorts from IrisGrid.state
   * @param columns The columns to apply the sort to
   * @param columnIndex The column index to apply the sort to
   * @param addToExisting Add this sort to the existing sort
   */
  static toggleSortForColumn(sorts, columns, columnIndex) {
    var addToExisting = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
    if (columns[columnIndex] == null) {
      return [];
    }
    var newSort = TableUtils.getNextSort(columns, sorts, columnIndex);
    return TableUtils.setSortForColumn(sorts, columns[columnIndex].name, newSort, addToExisting);
  }
  static sortColumn(sorts, columns, modelColumn, direction, isAbs, addToExisting) {
    if (modelColumn < 0 || modelColumn >= columns.length) {
      return [];
    }
    var newSort = TableUtils.makeColumnSort(columns, modelColumn, direction, isAbs);
    return TableUtils.setSortForColumn(sorts, columns[modelColumn].name, newSort, addToExisting);
  }
  /**
   * Sets the sort for the given column *and* removes any reverses
   * @param tableSort The current sorts from IrisGrid.state
   * @param columnName The column name to apply the sort to
   * @param sort The sort object to add
   * @param addToExisting Add this sort to the existing sort
   * @returns Returns the modified array of sorts - removing reverses
   */
  static setSortForColumn(tableSort, columnName, sort) {
    var addToExisting = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false;
    var sortIndex = TableUtils.getSortIndex(tableSort, columnName);
    var sorts = [];
    if (addToExisting) {
      sorts = sorts.concat(tableSort.filter((_ref) => {
        var {
          direction
        } = _ref;
        return direction !== TableUtils.sortDirection.reverse;
      }));
      if (sortIndex !== null) {
        sorts.splice(sortIndex, 1);
      }
    }
    if (sort !== null) {
      sorts.push(sort);
    }
    return sorts;
  }
  static getNormalizedType(columnType) {
    switch (columnType) {
      case "boolean":
      case "java.lang.Boolean":
      case TableUtils.dataType.BOOLEAN:
        return TableUtils.dataType.BOOLEAN;
      case "char":
      case "java.lang.Character":
      case TableUtils.dataType.CHAR:
        return TableUtils.dataType.CHAR;
      case "java.lang.String":
      case TableUtils.dataType.STRING:
        return TableUtils.dataType.STRING;
      case "io.deephaven.db.tables.utils.DBDateTime":
      case "io.deephaven.time.DateTime":
      case "com.illumon.iris.db.tables.utils.DBDateTime":
      case "java.time.Instant":
      case "java.time.ZonedDateTime":
      case TableUtils.dataType.DATETIME:
        return TableUtils.dataType.DATETIME;
      case "double":
      case "java.lang.Double":
      case "float":
      case "java.lang.Float":
      case "java.math.BigDecimal":
      case TableUtils.dataType.DECIMAL:
        return TableUtils.dataType.DECIMAL;
      case "int":
      case "java.lang.Integer":
      case "long":
      case "java.lang.Long":
      case "short":
      case "java.lang.Short":
      case "byte":
      case "java.lang.Byte":
      case "java.math.BigInteger":
      case TableUtils.dataType.INT:
        return TableUtils.dataType.INT;
      default:
        return TableUtils.dataType.UNKNOWN;
    }
  }
  static isLongType(columnType) {
    switch (columnType) {
      case "long":
      case "java.lang.Long":
        return true;
      default:
        return false;
    }
  }
  static isDateType(columnType) {
    switch (columnType) {
      case "io.deephaven.db.tables.utils.DBDateTime":
      case "io.deephaven.time.DateTime":
      case "java.time.Instant":
      case "java.time.ZonedDateTime":
      case "com.illumon.iris.db.tables.utils.DBDateTime":
        return true;
      default:
        return false;
    }
  }
  static isNumberType(columnType) {
    return TableUtils.isIntegerType(columnType) || TableUtils.isDecimalType(columnType);
  }
  static isIntegerType(columnType) {
    switch (columnType) {
      case "int":
      case "java.lang.Integer":
      case "java.math.BigInteger":
      case "long":
      case "java.lang.Long":
      case "short":
      case "java.lang.Short":
      case "byte":
      case "java.lang.Byte":
        return true;
      default:
        return false;
    }
  }
  static isDecimalType(columnType) {
    switch (columnType) {
      case "double":
      case "java.lang.Double":
      case "java.math.BigDecimal":
      case "float":
      case "java.lang.Float":
        return true;
      default:
        return false;
    }
  }
  static isBigDecimalType(columnType) {
    switch (columnType) {
      case "java.math.BigDecimal":
        return true;
      default:
        return false;
    }
  }
  static isBigIntegerType(columnType) {
    switch (columnType) {
      case "java.math.BigInteger":
        return true;
      default:
        return false;
    }
  }
  static isBooleanType(columnType) {
    switch (columnType) {
      case "boolean":
      case "java.lang.Boolean":
        return true;
      default:
        return false;
    }
  }
  static isCharType(columnType) {
    switch (columnType) {
      case "char":
      case "java.lang.Character":
        return true;
      default:
        return false;
    }
  }
  static isStringType(columnType) {
    switch (columnType) {
      case "java.lang.String":
        return true;
      default:
        return false;
    }
  }
  static isTextType(columnType) {
    return this.isStringType(columnType) || this.isCharType(columnType);
  }
  /**
   * Get base column type
   * @param columnType Column type
   * @returns Element type for array columns, original type for non-array columns
   */
  static getBaseType(columnType) {
    return columnType.split("[]")[0];
  }
  /**
   * Check if the column types are compatible
   * @param type1 Column type to check
   * @param type2 Column type to check
   * @returns True, if types are compatible
   */
  static isCompatibleType(type1, type2) {
    return TableUtils.getNormalizedType(type1) === TableUtils.getNormalizedType(type2);
  }
  /**
   * Adds quotes to a value if they're not already added
   * @param value Value to add quotes around
   */
  static quoteValue(value2) {
    if (value2.length >= 2 && (value2.charAt(0) === '"' && value2.charAt(value2.length - 1) === '"' || value2.charAt(0) === "'" && value2.charAt(value2.length - 1) === "'")) {
      return value2;
    }
    return '"'.concat(value2, '"');
  }
  static isRangeOperation(operation) {
    switch (operation) {
      case "<":
      case "<=":
      case "=<":
      case ">":
      case ">=":
      case "=>":
        return true;
      default:
        return false;
    }
  }
  /**
   * @param filter The column filter to apply the range operation to
   * @param operation The range operation to run
   * @param value The value to use for the operation
   * @returns The condition with the specified operation
   */
  static makeRangeFilterWithOperation(filter, operation, value2) {
    switch (operation) {
      case "=":
        return filter.eq(value2);
      case "<":
        return filter.lessThan(value2);
      case "<=":
      case "=<":
        return filter.lessThanOrEqualTo(value2);
      case ">":
        return filter.greaterThan(value2);
      case ">=":
      case "=>":
        return filter.greaterThanOrEqualTo(value2);
      case "!=":
      case "!":
        return filter.notEq(value2);
      default:
        return null;
    }
  }
  /**
   * Wraps a table promise in a cancelable promise that will close the table if the promise is cancelled.
   * Use in a component that loads a table, and call cancel when unmounting.
   * @param table The table promise to wrap
   */
  static makeCancelableTablePromise(table) {
    return PromiseUtils.makeCancelable(table, (resolved) => {
      resolved.close();
    });
  }
  /**
   * Make a cancelable promise for a one-shot table event with a timeout.
   * @param table Table to listen for events on
   * @param eventName Event to listen for
   * @param timeout Event timeout in milliseconds, defaults to 0
   * @param matcher Optional function to determine if the promise can be resolved or stays pending
   * @returns Resolves with the event data
   */
  static makeCancelableTableEventPromise(table, eventName) {
    var timeout = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    var matcher = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
    var eventCleanup;
    var timeoutId;
    var isPending = true;
    var wrappedPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        eventCleanup();
        isPending = false;
        reject(new TimeoutError('Event "'.concat(eventName, '" timed out.')));
      }, timeout);
      eventCleanup = table.addEventListener(eventName, (event) => {
        if (matcher != null && !matcher(event)) {
          log$3.debug2("Event triggered, but matcher returned false.");
          return;
        }
        log$3.debug2("Event triggered, resolving.");
        eventCleanup();
        clearTimeout(timeoutId);
        isPending = false;
        resolve(event);
      });
    });
    wrappedPromise.cancel = () => {
      if (isPending) {
        log$3.debug2("Pending promise cleanup.");
        eventCleanup();
        clearTimeout(timeoutId);
        isPending = false;
        return;
      }
      log$3.debug2("Ignoring non-pending promise cancel.");
    };
    return wrappedPromise;
  }
  static removeCommas(value2) {
    return value2.replace(/[\s|,]/g, "");
  }
  static makeBooleanValue(text) {
    var allowEmpty = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    if (text === "" && allowEmpty) {
      return null;
    }
    switch (text === null || text === void 0 ? void 0 : text.toLowerCase()) {
      case "null":
        return null;
      case "0":
      case "f":
      case "fa":
      case "fal":
      case "fals":
      case "false":
      case "n":
      case "no":
        return false;
      case "1":
      case "t":
      case "tr":
      case "tru":
      case "true":
      case "y":
      case "ye":
      case "yes":
        return true;
      default:
        throw new Error("Invalid boolean '".concat(text, "'"));
    }
  }
  static makeNumberValue(text) {
    if (text === "null" || text === "") {
      return null;
    }
    var cleanText = text.toLowerCase().trim();
    if (cleanText === "∞" || cleanText === "infinity" || cleanText === "inf") {
      return Number.POSITIVE_INFINITY;
    }
    if (cleanText === "-∞" || cleanText === "-infinity" || cleanText === "-inf") {
      return Number.NEGATIVE_INFINITY;
    }
    var numberText = TableUtils.removeCommas(cleanText);
    if (TableUtils.NUMBER_REGEX.test(numberText)) {
      return parseFloat(numberText);
    }
    throw new Error("Invalid number '".concat(text, "'"));
  }
  static getFilterOperatorString(operation) {
    switch (operation) {
      case Type.eq:
        return "=";
      case Type.notEq:
        return "!=";
      case Type.greaterThan:
        return ">";
      case Type.greaterThanOrEqualTo:
        return ">=";
      case Type.lessThan:
        return "<";
      case Type.lessThanOrEqualTo:
        return "<=";
      case Type.contains:
        return "~";
      case Type.notContains:
        return "!~";
      default:
        throw new Error("Unexpected filter type ".concat(operation));
    }
  }
  static isPartitionedTable(table) {
    return table != null && table.getMergedTable !== void 0 && table.getKeyTable !== void 0 && table.getKeys !== void 0;
  }
  static isTreeTable(table) {
    return table != null && table.expand !== void 0 && table.collapse !== void 0;
  }
  /**
   * Copies the provided array, sorts by column name case insensitive, and returns the sorted array.
   * @param columns The columns to sort
   * @param isAscending Whether to sort ascending
   */
  static sortColumns(columns) {
    var isAscending = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    return [...columns].sort((a, b) => {
      var aName = a.name.toUpperCase();
      var bName = b.name.toUpperCase();
      return TextUtils.sort(aName, bName, isAscending);
    });
  }
  constructor(dh) {
    _defineProperty$3(this, "dh", void 0);
    this.dh = dh;
    bindAllMethods(this);
  }
  /**
   * Create a table containing a distinct list of values for given column name and
   * applies the given sort direction.
   * @param table Source table to derive table from
   * @param columnName Column to dermine distinct values
   * @param sortDirection Direction to sort
   * @param filterConditionFactories Optional filters to apply. Note that these
   * will be applied before the `selectCall` in case we need to base the filtering
   * on columns other than the distinct value column
   */
  createDistinctSortedColumnTable(table, columnName, sortDirection) {
    var _arguments2 = arguments, _this = this;
    return _asyncToGenerator$1(function* () {
      if (table == null) {
        return null;
      }
      var sourceTable = table;
      for (var _len2 = _arguments2.length, filterConditionFactories = new Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
        filterConditionFactories[_key2 - 3] = _arguments2[_key2];
      }
      if (filterConditionFactories.length > 0) {
        sourceTable = yield table.copy();
        yield sourceTable.applyFilter(removeNullAndUndefined(...filterConditionFactories.map((f2) => f2(sourceTable))));
      }
      var column = sourceTable.findColumn(columnName);
      var distinctTable = yield sourceTable.selectDistinct([column]);
      if (sourceTable !== table) {
        sourceTable.close();
      }
      var distinctAscColSort = distinctTable.findColumn(columnName).sort()[sortDirection]();
      return _this.applySort(distinctTable, [distinctAscColSort]);
    })();
  }
  /**
   * Check if any columns contain a given value.
   * @param table Table to search for values
   * @param columnNames Column names to search
   * @param value Value to search for
   * @param isCaseSensitive Whether the value check is case sensitive
   */
  doesColumnValueExist(table, columnNames, value2, isCaseSensitive) {
    var _this2 = this;
    return _asyncToGenerator$1(function* () {
      if (table == null) {
        return null;
      }
      var filterConditionFactory = createValueFilter(_this2, columnNames, value2, isCaseSensitive ? "eq" : "eqIgnoreCase");
      var tableCopy = yield table.copy();
      yield _this2.applyFilter(tableCopy, removeNullAndUndefined(filterConditionFactory(tableCopy)));
      var size = getSize(tableCopy);
      tableCopy.close();
      return size > 0;
    })();
  }
  /**
   * Get the `dh.ValueType` corresponding to the given `dh.Column.type` value.
   * @param columnType The column type to get the value type for
   * @returns The `dh.ValueType` corresponding to the column type
   */
  getValueType(columnType) {
    if (columnType == null) {
      return this.dh.ValueType.STRING;
    }
    var columnDataType = TableUtils.getNormalizedType(columnType);
    switch (columnDataType) {
      case TableUtils.dataType.BOOLEAN:
        return this.dh.ValueType.BOOLEAN;
      case TableUtils.dataType.CHAR:
      case TableUtils.dataType.STRING:
        return this.dh.ValueType.STRING;
      case TableUtils.dataType.DATETIME:
        return this.dh.ValueType.DATETIME;
      case TableUtils.dataType.DECIMAL:
      case TableUtils.dataType.INT:
        if (TableUtils.isBigDecimalType(columnType) || TableUtils.isBigIntegerType(columnType)) {
          return this.dh.ValueType.STRING;
        }
        return this.dh.ValueType.NUMBER;
      default:
        return this.dh.ValueType.STRING;
    }
  }
  /**
   * Create filter with the provided column and text. Handles multiple filters joined with && or ||
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */
  makeQuickFilter(column, text, timeZone) {
    var orComponents = text.split("||");
    var orFilter = null;
    for (var i = 0; i < orComponents.length; i += 1) {
      var orComponent = orComponents[i];
      var andComponents = orComponent.split("&&");
      var andFilter = null;
      for (var j = 0; j < andComponents.length; j += 1) {
        var andComponent = andComponents[j].trim();
        if (andComponent.length > 0) {
          var filter = this.makeQuickFilterFromComponent(column, andComponent, timeZone);
          if (filter) {
            if (andFilter) {
              andFilter = andFilter.and(filter);
            } else {
              andFilter = filter;
            }
          } else {
            throw new Error("Unable to parse quick filter from text ".concat(text));
          }
        }
      }
      if (orFilter && andFilter) {
        orFilter = orFilter.or(andFilter);
      } else {
        orFilter = andFilter;
      }
    }
    return orFilter;
  }
  /**
   * Create filter with the provided column and text of one component (no multiple conditions)
   * @param column The column to set the filter on
   * @param text The text string to create the filter from
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns Returns the created filter, null if text could not be parsed
   */
  makeQuickFilterFromComponent(column, text, timeZone) {
    var {
      type
    } = column;
    if (TableUtils.isNumberType(type)) {
      return this.makeQuickNumberFilter(column, text);
    }
    if (TableUtils.isBooleanType(type)) {
      return this.makeQuickBooleanFilter(column, text);
    }
    if (timeZone != null && TableUtils.isDateType(type)) {
      return this.makeQuickDateFilter(column, text, timeZone);
    }
    if (TableUtils.isCharType(type)) {
      return this.makeQuickCharFilter(column, text);
    }
    return this.makeQuickTextFilter(column, text);
  }
  makeQuickNumberFilter(column, text) {
    var columnFilter = column.filter();
    var {
      dh
    } = this;
    var filter = null;
    var regex = /\s*(>=|<=|=>|=<|>|<|!=|=|!)?(\s*-\s*)?(\s*\d*(?:,\d{3})*(?:\.\d*)?\s*)?(null|nan|infinity|inf|\u221E)?(.*)/i;
    var result = regex.exec(text);
    var operation = null;
    var negativeSign = null;
    var value2 = null;
    var abnormalValue = null;
    var overflow = null;
    if (result !== null && result.length > 3) {
      [, operation, negativeSign, value2, abnormalValue, overflow] = result;
    }
    if (overflow != null && overflow.trim().length > 0) {
      return null;
    }
    if (operation == null) {
      operation = "=";
    }
    if (abnormalValue != null) {
      if (!(operation === "=" || operation === "!" || operation === "!=")) {
        return null;
      }
      abnormalValue = abnormalValue.trim().toLowerCase();
      switch (abnormalValue) {
        case "null":
          filter = columnFilter.isNull();
          break;
        case "nan":
          filter = dh.FilterCondition.invoke("isNaN", columnFilter);
          break;
        case "infinity":
        case "inf":
        case "∞":
          if (negativeSign != null) {
            filter = dh.FilterCondition.invoke("isInf", columnFilter).and(columnFilter.lessThan(dh.FilterValue.ofNumber(0)));
          } else {
            filter = dh.FilterCondition.invoke("isInf", columnFilter).and(columnFilter.greaterThan(dh.FilterValue.ofNumber(0)));
          }
          break;
      }
      if (filter !== null && (operation === "!" || operation === "!=")) {
        filter = filter.not();
      }
      return filter;
    }
    if (value2 == null) {
      return null;
    }
    value2 = TableUtils.removeCommas(value2);
    if (TableUtils.isLongType(column.type)) {
      try {
        value2 = dh.FilterValue.ofNumber(dh.LongWrapper.ofString("".concat(negativeSign != null ? "-" : "").concat(value2)));
      } catch (error) {
        log$3.warn("Unable to create long filter", error);
        return null;
      }
    } else {
      value2 = parseFloat(value2);
      if (value2 == null || Number.isNaN(value2)) {
        return null;
      }
      value2 = dh.FilterValue.ofNumber(negativeSign != null ? 0 - value2 : value2);
    }
    filter = column.filter();
    return TableUtils.makeRangeFilterWithOperation(filter, operation, value2);
  }
  /**
   * Given a text string from a table, escape quick filter operators in string with \
   * ex. =test returns \=test, null returns \null
   * @param string quickfilter string to escape
   * @returns escaped string
   */
  static escapeQuickTextFilter(quickFilterText) {
    var _operation, _value2;
    if (quickFilterText == null) return null;
    var regex = /^(!~|!=|~|=|!)?(.*)/;
    var nullRegex = /^\\*null$/;
    var result = regex.exec(quickFilterText);
    var operation = null;
    var value2 = null;
    if (result !== null && result.length > 2) {
      [, operation, value2] = result;
    }
    if (operation != null) {
      var _value;
      return "\\".concat(operation).concat((_value = value2) !== null && _value !== void 0 ? _value : "");
    }
    if (value2 != null && nullRegex.test(value2.toLowerCase())) {
      return "\\".concat(value2);
    }
    if (value2 != null && value2.startsWith("*")) {
      return "\\".concat(value2);
    }
    if (value2 != null && value2.endsWith("*") && !value2.endsWith("\\*")) {
      value2 = value2.substring(0, value2.length - 1);
      return "".concat(value2, "\\*");
    }
    return "".concat((_operation = operation) !== null && _operation !== void 0 ? _operation : "").concat((_value2 = value2) !== null && _value2 !== void 0 ? _value2 : "");
  }
  /**
   * Given an escaped quick filter, unescape the operators for giving it to the js api
   * ex. \=test returns =test, \null returns null
   * @param string quickfilter string to escape
   * @returns escaped string
   */
  static unescapeQuickTextFilter(quickFilterText) {
    var _operation2, _value3;
    var regex = /^(\\!~|\\!=|\\~|\\=|\\!)?(.*)/;
    var nullRegex = /^\\*null$/;
    var result = regex.exec(quickFilterText);
    var operation = null;
    var value2 = null;
    if (result !== null && result.length > 2) {
      [, operation, value2] = result;
    }
    if (operation != null) {
      operation = operation.replace("\\", "");
    }
    if (value2 != null && nullRegex.test(value2.toLowerCase())) {
      value2 = value2.replace("\\", "");
    }
    if (operation == null && value2 != null && value2.startsWith("\\*")) {
      value2 = value2.substring(1);
    }
    if (operation == null && value2 != null && value2.endsWith("\\*")) {
      value2 = value2.substring(0, value2.length - 2);
      return "".concat(value2, "*");
    }
    return "".concat((_operation2 = operation) !== null && _operation2 !== void 0 ? _operation2 : "").concat((_value3 = value2) !== null && _value3 !== void 0 ? _value3 : "");
  }
  makeQuickTextFilter(column, text) {
    var {
      dh
    } = this;
    var cleanText = "".concat(text).trim();
    var regex = /^(!~|!=|~|=|!)?(.*)/;
    var result = regex.exec(cleanText);
    var operation = null;
    var value2 = null;
    if (result !== null && result.length > 2) {
      [, operation, value2] = result;
      if (value2 != null) {
        value2 = value2.trim();
      }
    }
    if (value2 == null) {
      return null;
    }
    if (value2.length === 0 && !(operation === "=" || operation === "!=")) {
      return null;
    }
    if (operation == null) {
      operation = "=";
    }
    var filter = column.filter();
    if (value2.toLowerCase() === "null") {
      switch (operation) {
        case "=":
          return filter.isNull();
        case "!=":
        case "!":
          return filter.isNull().not();
      }
    }
    var prefix = null;
    var suffix = null;
    if (value2.startsWith("*")) {
      prefix = "*";
      value2 = value2.substring(1);
    } else if (value2.endsWith("*") && !value2.endsWith("\\*")) {
      suffix = "*";
      value2 = value2.substring(0, value2.length - 1);
    }
    value2 = TableUtils.unescapeQuickTextFilter(value2);
    switch (operation) {
      case "~": {
        return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E.*"))));
      }
      case "!~":
        return filter.isNull().or(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E.*"))).not());
      case "!=":
        if (prefix === "*") {
          return filter.isNull().or(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E$"))).not());
        }
        if (suffix === "*") {
          return filter.isNull().or(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value2, "\\E.*"))).not());
        }
        return filter.notEqIgnoreCase(dh.FilterValue.ofString(value2.toLowerCase()));
      case "=":
        if (prefix === "*") {
          return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E$"))));
        }
        if (suffix === "*") {
          return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value2, "\\E.*"))));
        }
        return filter.eqIgnoreCase(dh.FilterValue.ofString(value2.toLowerCase()));
    }
    return null;
  }
  // eslint-disable-next-line class-methods-use-this
  makeQuickBooleanFilter(column, text) {
    var regex = /^(!=|=|!)?(.*)/;
    var result = regex.exec("".concat(text).trim());
    if (result === null) {
      return null;
    }
    var [, operation, value2] = result;
    var notEqual = operation === "!" || operation === "!=";
    var cleanValue = value2.trim().toLowerCase();
    var filter = column.filter();
    try {
      var boolValue = TableUtils.makeBooleanValue(cleanValue);
      if (boolValue != null && boolValue) {
        filter = filter.isTrue();
      } else if (boolValue === null) {
        filter = filter.isNull();
      } else {
        filter = filter.isFalse();
      }
      return notEqual ? filter.not() : filter;
    } catch (e) {
      return null;
    }
  }
  /**
   * Builds a date filter parsed from the text string which may or may not include an operator.
   * @param column The column to build the filter from, with or without a leading operator.
   * @param text The date string text to parse.
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   */
  makeQuickDateFilter(column, text, timeZone) {
    var cleanText = text.trim();
    var regex = /\s*(>=|<=|=>|=<|>|<|!=|!|=)?(.*)/;
    var result = regex.exec(cleanText);
    if (result == null || result.length <= 2) {
      throw new Error("Unable to parse date filter: ".concat(text));
    }
    var operation = null;
    var dateText = null;
    [, operation, dateText] = result;
    var filterOperation = Type.eq;
    switch (operation) {
      case "<":
        filterOperation = Type.lessThan;
        break;
      case "<=":
      case "=<":
        filterOperation = Type.lessThanOrEqualTo;
        break;
      case ">":
        filterOperation = Type.greaterThan;
        break;
      case ">=":
      case "=>":
        filterOperation = Type.greaterThanOrEqualTo;
        break;
      case "!=":
      case "!":
        filterOperation = Type.notEq;
        break;
      case "=":
      case "==":
      default:
        filterOperation = Type.eq;
        break;
    }
    return this.makeQuickDateFilterWithOperation(column, dateText, filterOperation, timeZone);
  }
  /**
   * Builds a date filter parsed from the text string with the provided filter.
   * @param column The column to build the filter from.
   * @param text The date string text to parse, without an operator.
   * @param operation The filter operation to use.
   * @param timeZone The time zone to make this filter with. E.g. America/New_York
   */
  makeQuickDateFilterWithOperation(column, text, operation, timeZone) {
    var {
      dh
    } = this;
    var [startDate, endDate] = DateUtils.parseDateRange(dh, text, timeZone);
    var startValue = startDate != null ? dh.FilterValue.ofNumber(startDate) : null;
    var endValue = endDate != null ? dh.FilterValue.ofNumber(endDate) : null;
    var filter = column.filter();
    if (startValue == null) {
      return operation === Type.notEq ? filter.isNull().not() : filter.isNull();
    }
    switch (operation) {
      case Type.eq: {
        if (endValue != null) {
          var startFilter = filter.greaterThanOrEqualTo(startValue);
          var endFilter = filter.lessThan(endValue);
          return startFilter.and(endFilter);
        }
        return filter.eq(startValue);
      }
      case Type.lessThan: {
        return filter.lessThan(startValue);
      }
      case Type.lessThanOrEqualTo: {
        if (endValue != null) {
          return filter.lessThan(endValue);
        }
        return filter.lessThanOrEqualTo(startValue);
      }
      case Type.greaterThan: {
        if (endValue != null) {
          return filter.greaterThanOrEqualTo(endValue);
        }
        return filter.greaterThan(startValue);
      }
      case Type.greaterThanOrEqualTo:
        return filter.greaterThanOrEqualTo(startValue);
      case Type.notEq: {
        if (endValue != null) {
          var _startFilter = filter.lessThan(startValue);
          var _endFilter = filter.greaterThanOrEqualTo(endValue);
          return _startFilter.or(_endFilter);
        }
        return filter.notEq(startValue);
      }
      default:
        throw new Error("Invalid operator: ".concat(operation));
    }
  }
  makeQuickCharFilter(column, text) {
    var {
      dh
    } = this;
    var cleanText = "".concat(text).trim();
    var regex = /^(>=|<=|=>|=<|>|<|!=|=|!)?(null|"."|'.'|.)?(.*)/;
    var result = regex.exec(cleanText);
    var operation = null;
    var value2 = null;
    var overflow = null;
    if (result !== null && result.length > 3) {
      [, operation, value2, overflow] = result;
    }
    if (overflow != null && overflow.trim().length > 0) {
      return null;
    }
    if (value2 == null || value2.length === 0) {
      return null;
    }
    if (operation == null) {
      operation = "=";
    }
    var filter = column.filter();
    if (value2.toLowerCase() === "null") {
      switch (operation) {
        case "=":
          return filter.isNull();
        case "!=":
        case "!":
          return filter.isNull().not();
        default:
          return null;
      }
    }
    var filterValue = dh.FilterValue.ofString(TableUtils.isRangeOperation(operation) ? TableUtils.quoteValue(value2) : value2);
    return TableUtils.makeRangeFilterWithOperation(filter, operation, filterValue);
  }
  makeAdvancedFilter(column, options, timeZone) {
    var {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues
    } = options;
    var filter = null;
    for (var i = 0; i < filterItems.length; i += 1) {
      var filterItem = filterItems[i];
      var {
        selectedType,
        value: value2
      } = filterItem;
      if (selectedType != null && selectedType.length > 0 && value2 != null && value2.length > 0) {
        try {
          var newFilter = this.makeAdvancedValueFilter(column, selectedType, value2, timeZone);
          if (newFilter != null) {
            if (i === 0) {
              filter = newFilter;
            } else if (filter !== null && i - 1 < filterOperators.length) {
              var filterOperator = filterOperators[i - 1];
              if (filterOperator === Operator.and) {
                filter = filter.and(newFilter);
              } else if (filterOperator === Operator.or) {
                filter = filter.or(newFilter);
              } else {
                log$3.error("Unexpected filter operator", filterOperator, newFilter);
                filter = null;
                break;
              }
            }
          } else {
            log$3.debug2("Empty filter ignored for", selectedType, value2);
          }
        } catch (err) {
          log$3.error("Unable to create filter", err);
          filter = null;
          break;
        }
      }
    }
    var selectValueFilter = this.makeSelectValueFilter(column, selectedValues, invertSelection);
    if (selectValueFilter != null) {
      if (filter != null) {
        filter = filter.and(selectValueFilter);
      } else {
        filter = selectValueFilter;
      }
    }
    return filter;
  }
  makeAdvancedValueFilter(column, operation, value2, timeZone) {
    var {
      dh
    } = this;
    if (TableUtils.isDateType(column.type)) {
      return this.makeQuickDateFilterWithOperation(column, value2, operation, timeZone);
    }
    if (TableUtils.isNumberType(column.type) || TableUtils.isCharType(column.type)) {
      return this.makeQuickFilter(column, "".concat(TableUtils.getFilterOperatorString(operation)).concat(value2));
    }
    var filterValue = this.makeFilterValue(column.type, value2);
    var filter = column.filter();
    switch (operation) {
      case Type.eq:
        return filter.eq(filterValue);
      case Type.eqIgnoreCase:
        return filter.eqIgnoreCase(filterValue);
      case Type.notEq:
        return filter.notEq(filterValue);
      case Type.notEqIgnoreCase:
        return filter.notEqIgnoreCase(filterValue);
      case Type.greaterThan:
        return filter.greaterThan(filterValue);
      case Type.greaterThanOrEqualTo:
        return filter.greaterThanOrEqualTo(filterValue);
      case Type.lessThan:
        return filter.lessThan(filterValue);
      case Type.lessThanOrEqualTo:
        return filter.lessThanOrEqualTo(filterValue);
      case Type.isTrue:
        return filter.isTrue();
      case Type.isFalse:
        return filter.isFalse();
      case Type.isNull:
        return filter.isNull();
      case Type.contains:
        return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E.*"))));
      case Type.notContains:
        return filter.isNull().or(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E.*"))).not());
      case Type.startsWith:
        return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i)^\\Q".concat(value2, "\\E.*"))));
      case Type.endsWith:
        return filter.isNull().not().and(filter.invoke("matches", dh.FilterValue.ofString("(?s)(?i).*\\Q".concat(value2, "\\E$"))));
      case Type.in:
      case Type.inIgnoreCase:
      case Type.notIn:
      case Type.notInIgnoreCase:
      case Type.invoke:
      default:
        throw new Error("Unexpected filter operation: ".concat(operation));
    }
  }
  /**
   * Create a filter condition that can search a column by a given `searchText`
   * value.
   * @param column The column to search
   * @param searchText The text to search for
   * @param timeZone The time zone to make this filter in if it is a date type. E.g. America/New_York
   * @returns The filter condition that can be applied to the column
   */
  makeSearchTextFilter(column, searchText, timeZone) {
    var valueType = this.getValueType(column.type);
    try {
      if (valueType === this.dh.ValueType.BOOLEAN) {
        var maybeFilterCondition = this.makeQuickBooleanFilter(column, searchText);
        assertNotNull(maybeFilterCondition);
        return maybeFilterCondition;
      }
      if (valueType === this.dh.ValueType.DATETIME) {
        return this.makeQuickDateFilterWithOperation(column, DateUtils.trimDateTimeStringTimeZone(searchText), "eq", timeZone);
      }
      if (valueType === this.dh.ValueType.NUMBER) {
        var _maybeFilterCondition = this.makeQuickNumberFilter(column, searchText);
        assertNotNull(_maybeFilterCondition);
        return _maybeFilterCondition;
      }
      if (TableUtils.isBigDecimalType(column.type) || TableUtils.isBigIntegerType(column.type)) {
        return column.filter().eq(this.makeFilterValue(column.type, searchText));
      }
      return column.filter().containsIgnoreCase(this.makeFilterValue(column.type, searchText));
    } catch (_unused) {
      return this.makeNeverFilter(column);
    }
  }
  /**
   * Apply a filter to a table that won't match anything.
   * @table The table to apply the filter to
   * @columnName The name of the column to apploy the filter to
   * @param timeout Timeout before cancelling the promise that waits for the next
   * dh.Table.EVENT_FILTERCHANGED event
   * @returns a Promise to the Table that resolves after the next
   * dh.Table.EVENT_FILTERCHANGED event
   */
  applyNeverFilter(table, columnName) {
    var _arguments3 = arguments, _this3 = this;
    return _asyncToGenerator$1(function* () {
      var timeout = _arguments3.length > 2 && _arguments3[2] !== void 0 ? _arguments3[2] : TableUtils.APPLY_TABLE_CHANGE_TIMEOUT_MS;
      if (table == null) {
        return null;
      }
      var column = table.findColumn(columnName);
      var filters = [_this3.makeNeverFilter(column)];
      yield _this3.applyFilter(table, filters, timeout);
      return table;
    })();
  }
  /**
   * Apply custom columns to a given table. Return a Promise that resolves with
   * the table once the dh.Table.EVENT_CUSTOMCOLUMNSCHANGED event has fired.
   * @param table The table to apply custom columns to.
   * @param columns The list of column expressions or definitions to apply.
   * @returns A Promise that will be resolved with the given table after the
   * columns are applied.
   */
  applyCustomColumns(table, columns) {
    var _arguments4 = arguments, _this4 = this;
    return _asyncToGenerator$1(function* () {
      var timeout = _arguments4.length > 2 && _arguments4[2] !== void 0 ? _arguments4[2] : TableUtils.APPLY_TABLE_CHANGE_TIMEOUT_MS;
      var {
        dh
      } = _this4;
      return TableUtils.executeAndWaitForEvent((t) => t === null || t === void 0 ? void 0 : t.applyCustomColumns(columns), table, dh.Table.EVENT_CUSTOMCOLUMNSCHANGED, timeout);
    })();
  }
  /**
   * Apply filters to a given table.
   * @param table Table to apply filters to
   * @param filters Filters to apply
   * @param timeout Timeout before cancelling the promise that waits for the next
   * dh.Table.EVENT_FILTERCHANGED event
   * @returns a Promise to the Table that resolves after the next
   * dh.Table.EVENT_FILTERCHANGED event
   */
  applyFilter(table, filters) {
    var _arguments5 = arguments, _this5 = this;
    return _asyncToGenerator$1(function* () {
      var timeout = _arguments5.length > 2 && _arguments5[2] !== void 0 ? _arguments5[2] : TableUtils.APPLY_TABLE_CHANGE_TIMEOUT_MS;
      var {
        dh
      } = _this5;
      return TableUtils.executeAndWaitForEvent((t) => t === null || t === void 0 ? void 0 : t.applyFilter(filters), table, dh.Table.EVENT_FILTERCHANGED, timeout);
    })();
  }
  /**
   * Apply sorts to a given Table.
   * @param table The table to apply sorts to
   * @param sorts The sorts to apply
   * @param timeout Timeout before cancelling the promise that waits for the next
   * dh.Table.EVENT_SORTCHANGED event
   * @returns a Promise to the Table that resolves after the next
   * dh.Table.EVENT_SORTCHANGED event
   */
  applySort(table, sorts) {
    var _arguments6 = arguments, _this6 = this;
    return _asyncToGenerator$1(function* () {
      var timeout = _arguments6.length > 2 && _arguments6[2] !== void 0 ? _arguments6[2] : TableUtils.APPLY_TABLE_CHANGE_TIMEOUT_MS;
      var {
        dh
      } = _this6;
      return TableUtils.executeAndWaitForEvent((t) => t === null || t === void 0 ? void 0 : t.applySort(sorts), table, dh.Table.EVENT_SORTCHANGED, timeout);
    })();
  }
  /**
   * Create a filter condition that results in zero results for a given column
   * @param column
   */
  makeNeverFilter(column) {
    var {
      dh
    } = this;
    var value2 = null;
    if (TableUtils.isTextType(column.type)) {
      value2 = dh.FilterValue.ofString("a");
    } else if (TableUtils.isBooleanType(column.type)) {
      value2 = dh.FilterValue.ofBoolean(true);
    } else if (TableUtils.isDateType(column.type)) {
      value2 = dh.FilterValue.ofNumber(dh.DateWrapper.ofJsDate(/* @__PURE__ */ new Date()));
    } else {
      value2 = dh.FilterValue.ofNumber(0);
    }
    var eqFilter = column.filter().eq(value2);
    var notEqFilter = column.filter().notEq(value2);
    return eqFilter.and(notEqFilter);
  }
  /**
   * @param columnType The column type to make the filter value from.
   * @param value The value to make the filter value from.
   * @returns The FilterValue item for this column/value combination
   */
  makeFilterValue(columnType, value2) {
    var {
      dh
    } = this;
    var type = TableUtils.getBaseType(columnType);
    if (TableUtils.isTextType(type)) {
      return dh.FilterValue.ofString(value2);
    }
    if (TableUtils.isLongType(type)) {
      return dh.FilterValue.ofNumber(dh.LongWrapper.ofString(TableUtils.removeCommas(value2)));
    }
    return dh.FilterValue.ofNumber(TableUtils.removeCommas(value2));
  }
  /**
   * Takes a value and converts it to an `dh.FilterValue`
   *
   * @param columnType The column type to make the filter value from.
   * @param value The value to actually set
   * @returns The FilterValue item for this column/value combination
   */
  makeFilterRawValue(columnType, rawValue) {
    var {
      dh
    } = this;
    if (TableUtils.isCharType(columnType)) {
      return dh.FilterValue.ofString(typeof rawValue === "number" ? String.fromCharCode(rawValue) : rawValue);
    }
    if (TableUtils.isTextType(columnType)) {
      return dh.FilterValue.ofString(rawValue);
    }
    if (TableUtils.isBooleanType(columnType)) {
      return dh.FilterValue.ofBoolean(rawValue);
    }
    return dh.FilterValue.ofNumber(rawValue);
  }
  /**
   * Creates an Eq filter for the given column and raw value
   * @param column The column to set the filter on
   * @param rawValue The nullable value to filter on
   * @returns The filter for this column/value combination
   */
  makeNullableEqFilter(column, rawValue) {
    if (rawValue == null) {
      return column.filter().isNull();
    }
    return column.filter().eq(this.makeFilterRawValue(column.type, rawValue));
  }
  /**
   * Converts a string value to a value appropriate for the column
   * @param columnType The column type to make the value for
   * @param text The string value to make a type for
   * @param timeZone The time zone to make this value in if it is a date type. E.g. America/New_York
   */
  makeValue(columnType, text, timeZone) {
    var {
      dh
    } = this;
    if (text === "null") {
      return null;
    }
    if (TableUtils.isTextType(columnType)) {
      return text;
    }
    if (TableUtils.isLongType(columnType)) {
      return dh.LongWrapper.ofString(TableUtils.removeCommas(text));
    }
    if (TableUtils.isBooleanType(columnType)) {
      return TableUtils.makeBooleanValue(text, true);
    }
    if (TableUtils.isDateType(columnType)) {
      var [date] = DateUtils.parseDateRange(dh, text, timeZone);
      return date;
    }
    if (TableUtils.isNumberType(columnType)) {
      return TableUtils.makeNumberValue(text);
    }
    log$3.error("Unexpected column type", columnType);
    return null;
  }
  /**
   * Create a filter using the selected items
   * Has a flag for invertSelection as we start from a "Select All" state and a user just deselects items.
   * Since there may be millions of distinct items, it's easier to build an inverse filter.
   * @param column The column to set the filter on
   * @param selectedValues The values that are selected
   * @param invertSelection Invert the selection (eg. All items are selected, then you deselect items)
   * @returns Returns a `in` or `notIn` FilterCondition as necessary, or null if no filtering should be applied (everything selected)
   */
  makeSelectValueFilter(column, selectedValues, invertSelection) {
    var {
      dh
    } = this;
    if (selectedValues.length === 0) {
      if (invertSelection) {
        return null;
      }
      return this.makeNeverFilter(column);
    }
    var values = [];
    var isNullSelected = false;
    for (var i = 0; i < selectedValues.length; i += 1) {
      var value2 = selectedValues[i];
      if (value2 == null) {
        isNullSelected = true;
      } else if (TableUtils.isTextType(column.type)) {
        values.push(dh.FilterValue.ofString(typeof value2 === "number" ? String.fromCharCode(value2) : value2));
      } else if (TableUtils.isBooleanType(column.type)) {
        values.push(dh.FilterValue.ofBoolean(Boolean(value2)));
      } else {
        values.push(dh.FilterValue.ofNumber(value2));
      }
    }
    if (isNullSelected) {
      if (values.length > 0) {
        if (invertSelection) {
          return column.filter().isNull().not().and(column.filter().notIn(values));
        }
        return column.filter().isNull().or(column.filter().in(values));
      }
      if (invertSelection) {
        return column.filter().isNull().not();
      }
      return column.filter().isNull();
    }
    if (invertSelection) {
      return column.filter().notIn(values);
    }
    return column.filter().in(values);
  }
}
_defineProperty$3(TableUtils, "dataType", {
  BOOLEAN: "boolean",
  CHAR: "char",
  DATETIME: "datetime",
  DECIMAL: "decimal",
  INT: "int",
  STRING: "string",
  UNKNOWN: "unknown"
});
_defineProperty$3(TableUtils, "sortDirection", {
  ascending: "ASC",
  descending: "DESC",
  reverse: "REVERSE",
  none: null
});
_defineProperty$3(TableUtils, "APPLY_TABLE_CHANGE_TIMEOUT_MS", 3e4);
_defineProperty$3(TableUtils, "REVERSE_TYPE", Object.freeze({
  NONE: "none",
  PRE_SORT: "pre-sort",
  POST_SORT: "post-sort"
}));
_defineProperty$3(TableUtils, "NUMBER_REGEX", /^-?\d+(\.\d+)?$/);
_defineProperty$3(TableUtils, "executeAndWaitForEvent", /* @__PURE__ */ function() {
  var _ref2 = _asyncToGenerator$1(function* (exec, table, eventType) {
    var timeout = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : TableUtils.APPLY_TABLE_CHANGE_TIMEOUT_MS;
    if (table == null) {
      return null;
    }
    var eventPromise = TableUtils.makeCancelableTableEventPromise(table, eventType, timeout);
    exec(table);
    yield eventPromise;
    return table;
  });
  return function(_x, _x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}());
var lodash = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
lodash.exports;
(function(module2, exports2) {
  (function() {
    var undefined$1;
    var VERSION = "4.17.21";
    var LARGE_ARRAY_SIZE = 200;
    var CORE_ERROR_TEXT = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", FUNC_ERROR_TEXT = "Expected a function", INVALID_TEMPL_VAR_ERROR_TEXT = "Invalid `variable` option passed into `_.template`";
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var MAX_MEMOIZE_SIZE = 500;
    var PLACEHOLDER = "__lodash_placeholder__";
    var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    var WRAP_BIND_FLAG = 1, WRAP_BIND_KEY_FLAG = 2, WRAP_CURRY_BOUND_FLAG = 4, WRAP_CURRY_FLAG = 8, WRAP_CURRY_RIGHT_FLAG = 16, WRAP_PARTIAL_FLAG = 32, WRAP_PARTIAL_RIGHT_FLAG = 64, WRAP_ARY_FLAG = 128, WRAP_REARG_FLAG = 256, WRAP_FLIP_FLAG = 512;
    var DEFAULT_TRUNC_LENGTH = 30, DEFAULT_TRUNC_OMISSION = "...";
    var HOT_COUNT = 800, HOT_SPAN = 16;
    var LAZY_FILTER_FLAG = 1, LAZY_MAP_FLAG = 2, LAZY_WHILE_FLAG = 3;
    var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 17976931348623157e292, NAN = 0 / 0;
    var MAX_ARRAY_LENGTH = 4294967295, MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1, HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
    var wrapFlags = [
      ["ary", WRAP_ARY_FLAG],
      ["bind", WRAP_BIND_FLAG],
      ["bindKey", WRAP_BIND_KEY_FLAG],
      ["curry", WRAP_CURRY_FLAG],
      ["curryRight", WRAP_CURRY_RIGHT_FLAG],
      ["flip", WRAP_FLIP_FLAG],
      ["partial", WRAP_PARTIAL_FLAG],
      ["partialRight", WRAP_PARTIAL_RIGHT_FLAG],
      ["rearg", WRAP_REARG_FLAG]
    ];
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", domExcTag = "[object DOMException]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]", weakSetTag = "[object WeakSet]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
    var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g, reUnescapedHtml = /[&<>"']/g, reHasEscapedHtml = RegExp(reEscapedHtml.source), reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
    var reEscape = /<%-([\s\S]+?)%>/g, reEvaluate = /<%([\s\S]+?)%>/g, reInterpolate = /<%=([\s\S]+?)%>/g;
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/, rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
    var reTrimStart = /^\s+/;
    var reWhitespace = /\s/;
    var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/, reSplitDetails = /,? & /;
    var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
    var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
    var reEscapeChar = /\\(\\)?/g;
    var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
    var reFlags = /\w*$/;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
    var reNoMatch = /($^)/;
    var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
    var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
    var rsApos = "['’]", rsAstral = "[" + rsAstralRange + "]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
    var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsEmoji = "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
    var reApos = RegExp(rsApos, "g");
    var reComboMark = RegExp(rsCombo, "g");
    var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
    var reUnicodeWord = RegExp([
      rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
      rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
      rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
      rsUpper + "+" + rsOptContrUpper,
      rsOrdUpper,
      rsOrdLower,
      rsDigits,
      rsEmoji
    ].join("|"), "g");
    var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
    var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
    var contextProps = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ];
    var templateCounter = -1;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var cloneableTags = {};
    cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
    cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
    var deburredLetters = {
      // Latin-1 Supplement block.
      "À": "A",
      "Á": "A",
      "Â": "A",
      "Ã": "A",
      "Ä": "A",
      "Å": "A",
      "à": "a",
      "á": "a",
      "â": "a",
      "ã": "a",
      "ä": "a",
      "å": "a",
      "Ç": "C",
      "ç": "c",
      "Ð": "D",
      "ð": "d",
      "È": "E",
      "É": "E",
      "Ê": "E",
      "Ë": "E",
      "è": "e",
      "é": "e",
      "ê": "e",
      "ë": "e",
      "Ì": "I",
      "Í": "I",
      "Î": "I",
      "Ï": "I",
      "ì": "i",
      "í": "i",
      "î": "i",
      "ï": "i",
      "Ñ": "N",
      "ñ": "n",
      "Ò": "O",
      "Ó": "O",
      "Ô": "O",
      "Õ": "O",
      "Ö": "O",
      "Ø": "O",
      "ò": "o",
      "ó": "o",
      "ô": "o",
      "õ": "o",
      "ö": "o",
      "ø": "o",
      "Ù": "U",
      "Ú": "U",
      "Û": "U",
      "Ü": "U",
      "ù": "u",
      "ú": "u",
      "û": "u",
      "ü": "u",
      "Ý": "Y",
      "ý": "y",
      "ÿ": "y",
      "Æ": "Ae",
      "æ": "ae",
      "Þ": "Th",
      "þ": "th",
      "ß": "ss",
      // Latin Extended-A block.
      "Ā": "A",
      "Ă": "A",
      "Ą": "A",
      "ā": "a",
      "ă": "a",
      "ą": "a",
      "Ć": "C",
      "Ĉ": "C",
      "Ċ": "C",
      "Č": "C",
      "ć": "c",
      "ĉ": "c",
      "ċ": "c",
      "č": "c",
      "Ď": "D",
      "Đ": "D",
      "ď": "d",
      "đ": "d",
      "Ē": "E",
      "Ĕ": "E",
      "Ė": "E",
      "Ę": "E",
      "Ě": "E",
      "ē": "e",
      "ĕ": "e",
      "ė": "e",
      "ę": "e",
      "ě": "e",
      "Ĝ": "G",
      "Ğ": "G",
      "Ġ": "G",
      "Ģ": "G",
      "ĝ": "g",
      "ğ": "g",
      "ġ": "g",
      "ģ": "g",
      "Ĥ": "H",
      "Ħ": "H",
      "ĥ": "h",
      "ħ": "h",
      "Ĩ": "I",
      "Ī": "I",
      "Ĭ": "I",
      "Į": "I",
      "İ": "I",
      "ĩ": "i",
      "ī": "i",
      "ĭ": "i",
      "į": "i",
      "ı": "i",
      "Ĵ": "J",
      "ĵ": "j",
      "Ķ": "K",
      "ķ": "k",
      "ĸ": "k",
      "Ĺ": "L",
      "Ļ": "L",
      "Ľ": "L",
      "Ŀ": "L",
      "Ł": "L",
      "ĺ": "l",
      "ļ": "l",
      "ľ": "l",
      "ŀ": "l",
      "ł": "l",
      "Ń": "N",
      "Ņ": "N",
      "Ň": "N",
      "Ŋ": "N",
      "ń": "n",
      "ņ": "n",
      "ň": "n",
      "ŋ": "n",
      "Ō": "O",
      "Ŏ": "O",
      "Ő": "O",
      "ō": "o",
      "ŏ": "o",
      "ő": "o",
      "Ŕ": "R",
      "Ŗ": "R",
      "Ř": "R",
      "ŕ": "r",
      "ŗ": "r",
      "ř": "r",
      "Ś": "S",
      "Ŝ": "S",
      "Ş": "S",
      "Š": "S",
      "ś": "s",
      "ŝ": "s",
      "ş": "s",
      "š": "s",
      "Ţ": "T",
      "Ť": "T",
      "Ŧ": "T",
      "ţ": "t",
      "ť": "t",
      "ŧ": "t",
      "Ũ": "U",
      "Ū": "U",
      "Ŭ": "U",
      "Ů": "U",
      "Ű": "U",
      "Ų": "U",
      "ũ": "u",
      "ū": "u",
      "ŭ": "u",
      "ů": "u",
      "ű": "u",
      "ų": "u",
      "Ŵ": "W",
      "ŵ": "w",
      "Ŷ": "Y",
      "ŷ": "y",
      "Ÿ": "Y",
      "Ź": "Z",
      "Ż": "Z",
      "Ž": "Z",
      "ź": "z",
      "ż": "z",
      "ž": "z",
      "Ĳ": "IJ",
      "ĳ": "ij",
      "Œ": "Oe",
      "œ": "oe",
      "ŉ": "'n",
      "ſ": "s"
    };
    var htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    var htmlUnescapes = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    };
    var stringEscapes = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    };
    var freeParseFloat = parseFloat, freeParseInt = parseInt;
    var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = exports2 && !exports2.nodeType && exports2;
    var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {
      }
    }();
    var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer, nodeIsDate = nodeUtil && nodeUtil.isDate, nodeIsMap = nodeUtil && nodeUtil.isMap, nodeIsRegExp = nodeUtil && nodeUtil.isRegExp, nodeIsSet = nodeUtil && nodeUtil.isSet, nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function apply2(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    function arrayAggregator(array, setter, iteratee, accumulator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        var value2 = array[index];
        setter(accumulator, value2, iteratee(value2), array);
      }
      return accumulator;
    }
    function arrayEach(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }
    function arrayEachRight(array, iteratee) {
      var length = array == null ? 0 : array.length;
      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }
    function arrayEvery(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value2 = array[index];
        if (predicate(value2, index, array)) {
          result[resIndex++] = value2;
        }
      }
      return result;
    }
    function arrayIncludes(array, value2) {
      var length = array == null ? 0 : array.length;
      return !!length && baseIndexOf(array, value2, 0) > -1;
    }
    function arrayIncludesWith(array, value2, comparator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (comparator(value2, array[index])) {
          return true;
        }
      }
      return false;
    }
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    function arrayReduce(array, iteratee, accumulator, initAccum) {
      var index = -1, length = array == null ? 0 : array.length;
      if (initAccum && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }
    function arrayReduceRight(array, iteratee, accumulator, initAccum) {
      var length = array == null ? 0 : array.length;
      if (initAccum && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    var asciiSize = baseProperty("length");
    function asciiToArray(string) {
      return string.split("");
    }
    function asciiWords(string) {
      return string.match(reAsciiWord) || [];
    }
    function baseFindKey(collection, predicate, eachFunc) {
      var result;
      eachFunc(collection, function(value2, key, collection2) {
        if (predicate(value2, key, collection2)) {
          result = key;
          return false;
        }
      });
      return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    function baseIndexOf(array, value2, fromIndex) {
      return value2 === value2 ? strictIndexOf(array, value2, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
    }
    function baseIndexOfWith(array, value2, fromIndex, comparator) {
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (comparator(array[index], value2)) {
          return index;
        }
      }
      return -1;
    }
    function baseIsNaN(value2) {
      return value2 !== value2;
    }
    function baseMean(array, iteratee) {
      var length = array == null ? 0 : array.length;
      return length ? baseSum(array, iteratee) / length : NAN;
    }
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined$1 : object[key];
      };
    }
    function basePropertyOf(object) {
      return function(key) {
        return object == null ? undefined$1 : object[key];
      };
    }
    function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
      eachFunc(collection, function(value2, index, collection2) {
        accumulator = initAccum ? (initAccum = false, value2) : iteratee(accumulator, value2, index, collection2);
      });
      return accumulator;
    }
    function baseSortBy(array, comparer) {
      var length = array.length;
      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }
    function baseSum(array, iteratee) {
      var result, index = -1, length = array.length;
      while (++index < length) {
        var current = iteratee(array[index]);
        if (current !== undefined$1) {
          result = result === undefined$1 ? current : result + current;
        }
      }
      return result;
    }
    function baseTimes(n2, iteratee) {
      var index = -1, result = Array(n2);
      while (++index < n2) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseToPairs(object, props) {
      return arrayMap(props, function(key) {
        return [key, object[key]];
      });
    }
    function baseTrim(string) {
      return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
    }
    function baseUnary(func) {
      return function(value2) {
        return func(value2);
      };
    }
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    function charsStartIndex(strSymbols, chrSymbols) {
      var index = -1, length = strSymbols.length;
      while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
      }
      return index;
    }
    function charsEndIndex(strSymbols, chrSymbols) {
      var index = strSymbols.length;
      while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {
      }
      return index;
    }
    function countHolders(array, placeholder) {
      var length = array.length, result = 0;
      while (length--) {
        if (array[length] === placeholder) {
          ++result;
        }
      }
      return result;
    }
    var deburrLetter = basePropertyOf(deburredLetters);
    var escapeHtmlChar = basePropertyOf(htmlEscapes);
    function escapeStringChar(chr) {
      return "\\" + stringEscapes[chr];
    }
    function getValue(object, key) {
      return object == null ? undefined$1 : object[key];
    }
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }
    function hasUnicodeWord(string) {
      return reHasUnicodeWord.test(string);
    }
    function iteratorToArray(iterator) {
      var data, result = [];
      while (!(data = iterator.next()).done) {
        result.push(data.value);
      }
      return result;
    }
    function mapToArray(map2) {
      var index = -1, result = Array(map2.size);
      map2.forEach(function(value2, key) {
        result[++index] = [key, value2];
      });
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    function replaceHolders(array, placeholder) {
      var index = -1, length = array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value2 = array[index];
        if (value2 === placeholder || value2 === PLACEHOLDER) {
          array[index] = PLACEHOLDER;
          result[resIndex++] = index;
        }
      }
      return result;
    }
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value2) {
        result[++index] = value2;
      });
      return result;
    }
    function setToPairs(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value2) {
        result[++index] = [value2, value2];
      });
      return result;
    }
    function strictIndexOf(array, value2, fromIndex) {
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value2) {
          return index;
        }
      }
      return -1;
    }
    function strictLastIndexOf(array, value2, fromIndex) {
      var index = fromIndex + 1;
      while (index--) {
        if (array[index] === value2) {
          return index;
        }
      }
      return index;
    }
    function stringSize(string) {
      return hasUnicode(string) ? unicodeSize(string) : asciiSize(string);
    }
    function stringToArray(string) {
      return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
    }
    function trimmedEndIndex(string) {
      var index = string.length;
      while (index-- && reWhitespace.test(string.charAt(index))) {
      }
      return index;
    }
    var unescapeHtmlChar = basePropertyOf(htmlUnescapes);
    function unicodeSize(string) {
      var result = reUnicode.lastIndex = 0;
      while (reUnicode.test(string)) {
        ++result;
      }
      return result;
    }
    function unicodeToArray(string) {
      return string.match(reUnicode) || [];
    }
    function unicodeWords(string) {
      return string.match(reUnicodeWord) || [];
    }
    var runInContext = function runInContext2(context) {
      context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));
      var Array2 = context.Array, Date2 = context.Date, Error2 = context.Error, Function2 = context.Function, Math2 = context.Math, Object2 = context.Object, RegExp2 = context.RegExp, String2 = context.String, TypeError2 = context.TypeError;
      var arrayProto = Array2.prototype, funcProto = Function2.prototype, objectProto = Object2.prototype;
      var coreJsData = context["__core-js_shared__"];
      var funcToString = funcProto.toString;
      var hasOwnProperty2 = objectProto.hasOwnProperty;
      var idCounter = 0;
      var maskSrcKey = function() {
        var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      }();
      var nativeObjectToString = objectProto.toString;
      var objectCtorString = funcToString.call(Object2);
      var oldDash = root._;
      var reIsNative = RegExp2(
        "^" + funcToString.call(hasOwnProperty2).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      );
      var Buffer = moduleExports ? context.Buffer : undefined$1, Symbol2 = context.Symbol, Uint8Array = context.Uint8Array, allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined$1, getPrototype = overArg(Object2.getPrototypeOf, Object2), objectCreate = Object2.create, propertyIsEnumerable = objectProto.propertyIsEnumerable, splice = arrayProto.splice, spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : undefined$1, symIterator = Symbol2 ? Symbol2.iterator : undefined$1, symToStringTag = Symbol2 ? Symbol2.toStringTag : undefined$1;
      var defineProperty2 = function() {
        try {
          var func = getNative(Object2, "defineProperty");
          func({}, "", {});
          return func;
        } catch (e) {
        }
      }();
      var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout, ctxNow = Date2 && Date2.now !== root.Date.now && Date2.now, ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;
      var nativeCeil = Math2.ceil, nativeFloor = Math2.floor, nativeGetSymbols = Object2.getOwnPropertySymbols, nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined$1, nativeIsFinite = context.isFinite, nativeJoin = arrayProto.join, nativeKeys = overArg(Object2.keys, Object2), nativeMax = Math2.max, nativeMin = Math2.min, nativeNow = Date2.now, nativeParseInt = context.parseInt, nativeRandom = Math2.random, nativeReverse = arrayProto.reverse;
      var DataView = getNative(context, "DataView"), Map2 = getNative(context, "Map"), Promise2 = getNative(context, "Promise"), Set2 = getNative(context, "Set"), WeakMap = getNative(context, "WeakMap"), nativeCreate = getNative(Object2, "create");
      var metaMap = WeakMap && new WeakMap();
      var realNames = {};
      var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
      var symbolProto = Symbol2 ? Symbol2.prototype : undefined$1, symbolValueOf = symbolProto ? symbolProto.valueOf : undefined$1, symbolToString = symbolProto ? symbolProto.toString : undefined$1;
      function lodash2(value2) {
        if (isObjectLike(value2) && !isArray2(value2) && !(value2 instanceof LazyWrapper)) {
          if (value2 instanceof LodashWrapper) {
            return value2;
          }
          if (hasOwnProperty2.call(value2, "__wrapped__")) {
            return wrapperClone(value2);
          }
        }
        return new LodashWrapper(value2);
      }
      var baseCreate = /* @__PURE__ */ function() {
        function object() {
        }
        return function(proto) {
          if (!isObject2(proto)) {
            return {};
          }
          if (objectCreate) {
            return objectCreate(proto);
          }
          object.prototype = proto;
          var result2 = new object();
          object.prototype = undefined$1;
          return result2;
        };
      }();
      function baseLodash() {
      }
      function LodashWrapper(value2, chainAll) {
        this.__wrapped__ = value2;
        this.__actions__ = [];
        this.__chain__ = !!chainAll;
        this.__index__ = 0;
        this.__values__ = undefined$1;
      }
      lodash2.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "escape": reEscape,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "evaluate": reEvaluate,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        "interpolate": reInterpolate,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        "variable": "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        "imports": {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          "_": lodash2
        }
      };
      lodash2.prototype = baseLodash.prototype;
      lodash2.prototype.constructor = lodash2;
      LodashWrapper.prototype = baseCreate(baseLodash.prototype);
      LodashWrapper.prototype.constructor = LodashWrapper;
      function LazyWrapper(value2) {
        this.__wrapped__ = value2;
        this.__actions__ = [];
        this.__dir__ = 1;
        this.__filtered__ = false;
        this.__iteratees__ = [];
        this.__takeCount__ = MAX_ARRAY_LENGTH;
        this.__views__ = [];
      }
      function lazyClone() {
        var result2 = new LazyWrapper(this.__wrapped__);
        result2.__actions__ = copyArray(this.__actions__);
        result2.__dir__ = this.__dir__;
        result2.__filtered__ = this.__filtered__;
        result2.__iteratees__ = copyArray(this.__iteratees__);
        result2.__takeCount__ = this.__takeCount__;
        result2.__views__ = copyArray(this.__views__);
        return result2;
      }
      function lazyReverse() {
        if (this.__filtered__) {
          var result2 = new LazyWrapper(this);
          result2.__dir__ = -1;
          result2.__filtered__ = true;
        } else {
          result2 = this.clone();
          result2.__dir__ *= -1;
        }
        return result2;
      }
      function lazyValue() {
        var array = this.__wrapped__.value(), dir = this.__dir__, isArr = isArray2(array), isRight = dir < 0, arrLength = isArr ? array.length : 0, view = getView(0, arrLength, this.__views__), start = view.start, end = view.end, length = end - start, index = isRight ? end : start - 1, iteratees = this.__iteratees__, iterLength = iteratees.length, resIndex = 0, takeCount = nativeMin(length, this.__takeCount__);
        if (!isArr || !isRight && arrLength == length && takeCount == length) {
          return baseWrapperValue(array, this.__actions__);
        }
        var result2 = [];
        outer:
          while (length-- && resIndex < takeCount) {
            index += dir;
            var iterIndex = -1, value2 = array[index];
            while (++iterIndex < iterLength) {
              var data = iteratees[iterIndex], iteratee2 = data.iteratee, type = data.type, computed = iteratee2(value2);
              if (type == LAZY_MAP_FLAG) {
                value2 = computed;
              } else if (!computed) {
                if (type == LAZY_FILTER_FLAG) {
                  continue outer;
                } else {
                  break outer;
                }
              }
            }
            result2[resIndex++] = value2;
          }
        return result2;
      }
      LazyWrapper.prototype = baseCreate(baseLodash.prototype);
      LazyWrapper.prototype.constructor = LazyWrapper;
      function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function hashClear() {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
        this.size = 0;
      }
      function hashDelete(key) {
        var result2 = this.has(key) && delete this.__data__[key];
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function hashGet(key) {
        var data = this.__data__;
        if (nativeCreate) {
          var result2 = data[key];
          return result2 === HASH_UNDEFINED ? undefined$1 : result2;
        }
        return hasOwnProperty2.call(data, key) ? data[key] : undefined$1;
      }
      function hashHas(key) {
        var data = this.__data__;
        return nativeCreate ? data[key] !== undefined$1 : hasOwnProperty2.call(data, key);
      }
      function hashSet(key, value2) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate && value2 === undefined$1 ? HASH_UNDEFINED : value2;
        return this;
      }
      Hash.prototype.clear = hashClear;
      Hash.prototype["delete"] = hashDelete;
      Hash.prototype.get = hashGet;
      Hash.prototype.has = hashHas;
      Hash.prototype.set = hashSet;
      function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
      }
      function listCacheDelete(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
          data.pop();
        } else {
          splice.call(data, index, 1);
        }
        --this.size;
        return true;
      }
      function listCacheGet(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        return index < 0 ? undefined$1 : data[index][1];
      }
      function listCacheHas(key) {
        return assocIndexOf(this.__data__, key) > -1;
      }
      function listCacheSet(key, value2) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          ++this.size;
          data.push([key, value2]);
        } else {
          data[index][1] = value2;
        }
        return this;
      }
      ListCache.prototype.clear = listCacheClear;
      ListCache.prototype["delete"] = listCacheDelete;
      ListCache.prototype.get = listCacheGet;
      ListCache.prototype.has = listCacheHas;
      ListCache.prototype.set = listCacheSet;
      function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
          "hash": new Hash(),
          "map": new (Map2 || ListCache)(),
          "string": new Hash()
        };
      }
      function mapCacheDelete(key) {
        var result2 = getMapData(this, key)["delete"](key);
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function mapCacheGet(key) {
        return getMapData(this, key).get(key);
      }
      function mapCacheHas(key) {
        return getMapData(this, key).has(key);
      }
      function mapCacheSet(key, value2) {
        var data = getMapData(this, key), size2 = data.size;
        data.set(key, value2);
        this.size += data.size == size2 ? 0 : 1;
        return this;
      }
      MapCache.prototype.clear = mapCacheClear;
      MapCache.prototype["delete"] = mapCacheDelete;
      MapCache.prototype.get = mapCacheGet;
      MapCache.prototype.has = mapCacheHas;
      MapCache.prototype.set = mapCacheSet;
      function SetCache(values2) {
        var index = -1, length = values2 == null ? 0 : values2.length;
        this.__data__ = new MapCache();
        while (++index < length) {
          this.add(values2[index]);
        }
      }
      function setCacheAdd(value2) {
        this.__data__.set(value2, HASH_UNDEFINED);
        return this;
      }
      function setCacheHas(value2) {
        return this.__data__.has(value2);
      }
      SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
      SetCache.prototype.has = setCacheHas;
      function Stack(entries) {
        var data = this.__data__ = new ListCache(entries);
        this.size = data.size;
      }
      function stackClear() {
        this.__data__ = new ListCache();
        this.size = 0;
      }
      function stackDelete(key) {
        var data = this.__data__, result2 = data["delete"](key);
        this.size = data.size;
        return result2;
      }
      function stackGet(key) {
        return this.__data__.get(key);
      }
      function stackHas(key) {
        return this.__data__.has(key);
      }
      function stackSet(key, value2) {
        var data = this.__data__;
        if (data instanceof ListCache) {
          var pairs = data.__data__;
          if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
            pairs.push([key, value2]);
            this.size = ++data.size;
            return this;
          }
          data = this.__data__ = new MapCache(pairs);
        }
        data.set(key, value2);
        this.size = data.size;
        return this;
      }
      Stack.prototype.clear = stackClear;
      Stack.prototype["delete"] = stackDelete;
      Stack.prototype.get = stackGet;
      Stack.prototype.has = stackHas;
      Stack.prototype.set = stackSet;
      function arrayLikeKeys(value2, inherited) {
        var isArr = isArray2(value2), isArg = !isArr && isArguments2(value2), isBuff = !isArr && !isArg && isBuffer(value2), isType = !isArr && !isArg && !isBuff && isTypedArray(value2), skipIndexes = isArr || isArg || isBuff || isType, result2 = skipIndexes ? baseTimes(value2.length, String2) : [], length = result2.length;
        for (var key in value2) {
          if ((inherited || hasOwnProperty2.call(value2, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
          (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
          isIndex(key, length)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function arraySample(array) {
        var length = array.length;
        return length ? array[baseRandom(0, length - 1)] : undefined$1;
      }
      function arraySampleSize(array, n2) {
        return shuffleSelf(copyArray(array), baseClamp(n2, 0, array.length));
      }
      function arrayShuffle(array) {
        return shuffleSelf(copyArray(array));
      }
      function assignMergeValue(object, key, value2) {
        if (value2 !== undefined$1 && !eq(object[key], value2) || value2 === undefined$1 && !(key in object)) {
          baseAssignValue(object, key, value2);
        }
      }
      function assignValue(object, key, value2) {
        var objValue = object[key];
        if (!(hasOwnProperty2.call(object, key) && eq(objValue, value2)) || value2 === undefined$1 && !(key in object)) {
          baseAssignValue(object, key, value2);
        }
      }
      function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
          if (eq(array[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      function baseAggregator(collection, setter, iteratee2, accumulator) {
        baseEach(collection, function(value2, key, collection2) {
          setter(accumulator, value2, iteratee2(value2), collection2);
        });
        return accumulator;
      }
      function baseAssign(object, source) {
        return object && copyObject(source, keys2(source), object);
      }
      function baseAssignIn(object, source) {
        return object && copyObject(source, keysIn(source), object);
      }
      function baseAssignValue(object, key, value2) {
        if (key == "__proto__" && defineProperty2) {
          defineProperty2(object, key, {
            "configurable": true,
            "enumerable": true,
            "value": value2,
            "writable": true
          });
        } else {
          object[key] = value2;
        }
      }
      function baseAt(object, paths) {
        var index = -1, length = paths.length, result2 = Array2(length), skip = object == null;
        while (++index < length) {
          result2[index] = skip ? undefined$1 : get2(object, paths[index]);
        }
        return result2;
      }
      function baseClamp(number, lower, upper) {
        if (number === number) {
          if (upper !== undefined$1) {
            number = number <= upper ? number : upper;
          }
          if (lower !== undefined$1) {
            number = number >= lower ? number : lower;
          }
        }
        return number;
      }
      function baseClone(value2, bitmask, customizer, key, object, stack) {
        var result2, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
        if (customizer) {
          result2 = object ? customizer(value2, key, object, stack) : customizer(value2);
        }
        if (result2 !== undefined$1) {
          return result2;
        }
        if (!isObject2(value2)) {
          return value2;
        }
        var isArr = isArray2(value2);
        if (isArr) {
          result2 = initCloneArray(value2);
          if (!isDeep) {
            return copyArray(value2, result2);
          }
        } else {
          var tag = getTag(value2), isFunc = tag == funcTag || tag == genTag;
          if (isBuffer(value2)) {
            return cloneBuffer(value2, isDeep);
          }
          if (tag == objectTag || tag == argsTag || isFunc && !object) {
            result2 = isFlat || isFunc ? {} : initCloneObject(value2);
            if (!isDeep) {
              return isFlat ? copySymbolsIn(value2, baseAssignIn(result2, value2)) : copySymbols(value2, baseAssign(result2, value2));
            }
          } else {
            if (!cloneableTags[tag]) {
              return object ? value2 : {};
            }
            result2 = initCloneByTag(value2, tag, isDeep);
          }
        }
        stack || (stack = new Stack());
        var stacked = stack.get(value2);
        if (stacked) {
          return stacked;
        }
        stack.set(value2, result2);
        if (isSet(value2)) {
          value2.forEach(function(subValue) {
            result2.add(baseClone(subValue, bitmask, customizer, subValue, value2, stack));
          });
        } else if (isMap(value2)) {
          value2.forEach(function(subValue, key2) {
            result2.set(key2, baseClone(subValue, bitmask, customizer, key2, value2, stack));
          });
        }
        var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys2;
        var props = isArr ? undefined$1 : keysFunc(value2);
        arrayEach(props || value2, function(subValue, key2) {
          if (props) {
            key2 = subValue;
            subValue = value2[key2];
          }
          assignValue(result2, key2, baseClone(subValue, bitmask, customizer, key2, value2, stack));
        });
        return result2;
      }
      function baseConforms(source) {
        var props = keys2(source);
        return function(object) {
          return baseConformsTo(object, source, props);
        };
      }
      function baseConformsTo(object, source, props) {
        var length = props.length;
        if (object == null) {
          return !length;
        }
        object = Object2(object);
        while (length--) {
          var key = props[length], predicate = source[key], value2 = object[key];
          if (value2 === undefined$1 && !(key in object) || !predicate(value2)) {
            return false;
          }
        }
        return true;
      }
      function baseDelay(func, wait, args) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        return setTimeout2(function() {
          func.apply(undefined$1, args);
        }, wait);
      }
      function baseDifference(array, values2, iteratee2, comparator) {
        var index = -1, includes2 = arrayIncludes, isCommon = true, length = array.length, result2 = [], valuesLength = values2.length;
        if (!length) {
          return result2;
        }
        if (iteratee2) {
          values2 = arrayMap(values2, baseUnary(iteratee2));
        }
        if (comparator) {
          includes2 = arrayIncludesWith;
          isCommon = false;
        } else if (values2.length >= LARGE_ARRAY_SIZE) {
          includes2 = cacheHas;
          isCommon = false;
          values2 = new SetCache(values2);
        }
        outer:
          while (++index < length) {
            var value2 = array[index], computed = iteratee2 == null ? value2 : iteratee2(value2);
            value2 = comparator || value2 !== 0 ? value2 : 0;
            if (isCommon && computed === computed) {
              var valuesIndex = valuesLength;
              while (valuesIndex--) {
                if (values2[valuesIndex] === computed) {
                  continue outer;
                }
              }
              result2.push(value2);
            } else if (!includes2(values2, computed, comparator)) {
              result2.push(value2);
            }
          }
        return result2;
      }
      var baseEach = createBaseEach(baseForOwn);
      var baseEachRight = createBaseEach(baseForOwnRight, true);
      function baseEvery(collection, predicate) {
        var result2 = true;
        baseEach(collection, function(value2, index, collection2) {
          result2 = !!predicate(value2, index, collection2);
          return result2;
        });
        return result2;
      }
      function baseExtremum(array, iteratee2, comparator) {
        var index = -1, length = array.length;
        while (++index < length) {
          var value2 = array[index], current = iteratee2(value2);
          if (current != null && (computed === undefined$1 ? current === current && !isSymbol2(current) : comparator(current, computed))) {
            var computed = current, result2 = value2;
          }
        }
        return result2;
      }
      function baseFill(array, value2, start, end) {
        var length = array.length;
        start = toInteger2(start);
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end === undefined$1 || end > length ? length : toInteger2(end);
        if (end < 0) {
          end += length;
        }
        end = start > end ? 0 : toLength(end);
        while (start < end) {
          array[start++] = value2;
        }
        return array;
      }
      function baseFilter(collection, predicate) {
        var result2 = [];
        baseEach(collection, function(value2, index, collection2) {
          if (predicate(value2, index, collection2)) {
            result2.push(value2);
          }
        });
        return result2;
      }
      function baseFlatten(array, depth, predicate, isStrict, result2) {
        var index = -1, length = array.length;
        predicate || (predicate = isFlattenable);
        result2 || (result2 = []);
        while (++index < length) {
          var value2 = array[index];
          if (depth > 0 && predicate(value2)) {
            if (depth > 1) {
              baseFlatten(value2, depth - 1, predicate, isStrict, result2);
            } else {
              arrayPush(result2, value2);
            }
          } else if (!isStrict) {
            result2[result2.length] = value2;
          }
        }
        return result2;
      }
      var baseFor = createBaseFor();
      var baseForRight = createBaseFor(true);
      function baseForOwn(object, iteratee2) {
        return object && baseFor(object, iteratee2, keys2);
      }
      function baseForOwnRight(object, iteratee2) {
        return object && baseForRight(object, iteratee2, keys2);
      }
      function baseFunctions(object, props) {
        return arrayFilter(props, function(key) {
          return isFunction2(object[key]);
        });
      }
      function baseGet(object, path) {
        path = castPath(path, object);
        var index = 0, length = path.length;
        while (object != null && index < length) {
          object = object[toKey(path[index++])];
        }
        return index && index == length ? object : undefined$1;
      }
      function baseGetAllKeys(object, keysFunc, symbolsFunc) {
        var result2 = keysFunc(object);
        return isArray2(object) ? result2 : arrayPush(result2, symbolsFunc(object));
      }
      function baseGetTag(value2) {
        if (value2 == null) {
          return value2 === undefined$1 ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object2(value2) ? getRawTag(value2) : objectToString(value2);
      }
      function baseGt(value2, other) {
        return value2 > other;
      }
      function baseHas(object, key) {
        return object != null && hasOwnProperty2.call(object, key);
      }
      function baseHasIn(object, key) {
        return object != null && key in Object2(object);
      }
      function baseInRange(number, start, end) {
        return number >= nativeMin(start, end) && number < nativeMax(start, end);
      }
      function baseIntersection(arrays, iteratee2, comparator) {
        var includes2 = comparator ? arrayIncludesWith : arrayIncludes, length = arrays[0].length, othLength = arrays.length, othIndex = othLength, caches = Array2(othLength), maxLength = Infinity, result2 = [];
        while (othIndex--) {
          var array = arrays[othIndex];
          if (othIndex && iteratee2) {
            array = arrayMap(array, baseUnary(iteratee2));
          }
          maxLength = nativeMin(array.length, maxLength);
          caches[othIndex] = !comparator && (iteratee2 || length >= 120 && array.length >= 120) ? new SetCache(othIndex && array) : undefined$1;
        }
        array = arrays[0];
        var index = -1, seen = caches[0];
        outer:
          while (++index < length && result2.length < maxLength) {
            var value2 = array[index], computed = iteratee2 ? iteratee2(value2) : value2;
            value2 = comparator || value2 !== 0 ? value2 : 0;
            if (!(seen ? cacheHas(seen, computed) : includes2(result2, computed, comparator))) {
              othIndex = othLength;
              while (--othIndex) {
                var cache = caches[othIndex];
                if (!(cache ? cacheHas(cache, computed) : includes2(arrays[othIndex], computed, comparator))) {
                  continue outer;
                }
              }
              if (seen) {
                seen.push(computed);
              }
              result2.push(value2);
            }
          }
        return result2;
      }
      function baseInverter(object, setter, iteratee2, accumulator) {
        baseForOwn(object, function(value2, key, object2) {
          setter(accumulator, iteratee2(value2), key, object2);
        });
        return accumulator;
      }
      function baseInvoke(object, path, args) {
        path = castPath(path, object);
        object = parent(object, path);
        var func = object == null ? object : object[toKey(last(path))];
        return func == null ? undefined$1 : apply2(func, object, args);
      }
      function baseIsArguments(value2) {
        return isObjectLike(value2) && baseGetTag(value2) == argsTag;
      }
      function baseIsArrayBuffer(value2) {
        return isObjectLike(value2) && baseGetTag(value2) == arrayBufferTag;
      }
      function baseIsDate(value2) {
        return isObjectLike(value2) && baseGetTag(value2) == dateTag;
      }
      function baseIsEqual(value2, other, bitmask, customizer, stack) {
        if (value2 === other) {
          return true;
        }
        if (value2 == null || other == null || !isObjectLike(value2) && !isObjectLike(other)) {
          return value2 !== value2 && other !== other;
        }
        return baseIsEqualDeep(value2, other, bitmask, customizer, baseIsEqual, stack);
      }
      function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
        var objIsArr = isArray2(object), othIsArr = isArray2(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
        objTag = objTag == argsTag ? objectTag : objTag;
        othTag = othTag == argsTag ? objectTag : othTag;
        var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
        if (isSameTag && isBuffer(object)) {
          if (!isBuffer(other)) {
            return false;
          }
          objIsArr = true;
          objIsObj = false;
        }
        if (isSameTag && !objIsObj) {
          stack || (stack = new Stack());
          return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
        }
        if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
          var objIsWrapped = objIsObj && hasOwnProperty2.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty2.call(other, "__wrapped__");
          if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
            stack || (stack = new Stack());
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
          }
        }
        if (!isSameTag) {
          return false;
        }
        stack || (stack = new Stack());
        return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
      }
      function baseIsMap(value2) {
        return isObjectLike(value2) && getTag(value2) == mapTag;
      }
      function baseIsMatch(object, source, matchData, customizer) {
        var index = matchData.length, length = index, noCustomizer = !customizer;
        if (object == null) {
          return !length;
        }
        object = Object2(object);
        while (index--) {
          var data = matchData[index];
          if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
            return false;
          }
        }
        while (++index < length) {
          data = matchData[index];
          var key = data[0], objValue = object[key], srcValue = data[1];
          if (noCustomizer && data[2]) {
            if (objValue === undefined$1 && !(key in object)) {
              return false;
            }
          } else {
            var stack = new Stack();
            if (customizer) {
              var result2 = customizer(objValue, srcValue, key, object, source, stack);
            }
            if (!(result2 === undefined$1 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result2)) {
              return false;
            }
          }
        }
        return true;
      }
      function baseIsNative(value2) {
        if (!isObject2(value2) || isMasked(value2)) {
          return false;
        }
        var pattern = isFunction2(value2) ? reIsNative : reIsHostCtor;
        return pattern.test(toSource(value2));
      }
      function baseIsRegExp(value2) {
        return isObjectLike(value2) && baseGetTag(value2) == regexpTag;
      }
      function baseIsSet(value2) {
        return isObjectLike(value2) && getTag(value2) == setTag;
      }
      function baseIsTypedArray(value2) {
        return isObjectLike(value2) && isLength(value2.length) && !!typedArrayTags[baseGetTag(value2)];
      }
      function baseIteratee(value2) {
        if (typeof value2 == "function") {
          return value2;
        }
        if (value2 == null) {
          return identity;
        }
        if (typeof value2 == "object") {
          return isArray2(value2) ? baseMatchesProperty(value2[0], value2[1]) : baseMatches(value2);
        }
        return property(value2);
      }
      function baseKeys(object) {
        if (!isPrototype2(object)) {
          return nativeKeys(object);
        }
        var result2 = [];
        for (var key in Object2(object)) {
          if (hasOwnProperty2.call(object, key) && key != "constructor") {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseKeysIn(object) {
        if (!isObject2(object)) {
          return nativeKeysIn(object);
        }
        var isProto = isPrototype2(object), result2 = [];
        for (var key in object) {
          if (!(key == "constructor" && (isProto || !hasOwnProperty2.call(object, key)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseLt(value2, other) {
        return value2 < other;
      }
      function baseMap(collection, iteratee2) {
        var index = -1, result2 = isArrayLike(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value2, key, collection2) {
          result2[++index] = iteratee2(value2, key, collection2);
        });
        return result2;
      }
      function baseMatches(source) {
        var matchData = getMatchData(source);
        if (matchData.length == 1 && matchData[0][2]) {
          return matchesStrictComparable(matchData[0][0], matchData[0][1]);
        }
        return function(object) {
          return object === source || baseIsMatch(object, source, matchData);
        };
      }
      function baseMatchesProperty(path, srcValue) {
        if (isKey(path) && isStrictComparable(srcValue)) {
          return matchesStrictComparable(toKey(path), srcValue);
        }
        return function(object) {
          var objValue = get2(object, path);
          return objValue === undefined$1 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
        };
      }
      function baseMerge(object, source, srcIndex, customizer, stack) {
        if (object === source) {
          return;
        }
        baseFor(source, function(srcValue, key) {
          stack || (stack = new Stack());
          if (isObject2(srcValue)) {
            baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
          } else {
            var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : undefined$1;
            if (newValue === undefined$1) {
              newValue = srcValue;
            }
            assignMergeValue(object, key, newValue);
          }
        }, keysIn);
      }
      function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
        var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
        if (stacked) {
          assignMergeValue(object, key, stacked);
          return;
        }
        var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : undefined$1;
        var isCommon = newValue === undefined$1;
        if (isCommon) {
          var isArr = isArray2(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
          newValue = srcValue;
          if (isArr || isBuff || isTyped) {
            if (isArray2(objValue)) {
              newValue = objValue;
            } else if (isArrayLikeObject(objValue)) {
              newValue = copyArray(objValue);
            } else if (isBuff) {
              isCommon = false;
              newValue = cloneBuffer(srcValue, true);
            } else if (isTyped) {
              isCommon = false;
              newValue = cloneTypedArray(srcValue, true);
            } else {
              newValue = [];
            }
          } else if (isPlainObject(srcValue) || isArguments2(srcValue)) {
            newValue = objValue;
            if (isArguments2(objValue)) {
              newValue = toPlainObject(objValue);
            } else if (!isObject2(objValue) || isFunction2(objValue)) {
              newValue = initCloneObject(srcValue);
            }
          } else {
            isCommon = false;
          }
        }
        if (isCommon) {
          stack.set(srcValue, newValue);
          mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
          stack["delete"](srcValue);
        }
        assignMergeValue(object, key, newValue);
      }
      function baseNth(array, n2) {
        var length = array.length;
        if (!length) {
          return;
        }
        n2 += n2 < 0 ? length : 0;
        return isIndex(n2, length) ? array[n2] : undefined$1;
      }
      function baseOrderBy(collection, iteratees, orders) {
        if (iteratees.length) {
          iteratees = arrayMap(iteratees, function(iteratee2) {
            if (isArray2(iteratee2)) {
              return function(value2) {
                return baseGet(value2, iteratee2.length === 1 ? iteratee2[0] : iteratee2);
              };
            }
            return iteratee2;
          });
        } else {
          iteratees = [identity];
        }
        var index = -1;
        iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
        var result2 = baseMap(collection, function(value2, key, collection2) {
          var criteria = arrayMap(iteratees, function(iteratee2) {
            return iteratee2(value2);
          });
          return { "criteria": criteria, "index": ++index, "value": value2 };
        });
        return baseSortBy(result2, function(object, other) {
          return compareMultiple(object, other, orders);
        });
      }
      function basePick(object, paths) {
        return basePickBy(object, paths, function(value2, path) {
          return hasIn(object, path);
        });
      }
      function basePickBy(object, paths, predicate) {
        var index = -1, length = paths.length, result2 = {};
        while (++index < length) {
          var path = paths[index], value2 = baseGet(object, path);
          if (predicate(value2, path)) {
            baseSet(result2, castPath(path, object), value2);
          }
        }
        return result2;
      }
      function basePropertyDeep(path) {
        return function(object) {
          return baseGet(object, path);
        };
      }
      function basePullAll(array, values2, iteratee2, comparator) {
        var indexOf2 = comparator ? baseIndexOfWith : baseIndexOf, index = -1, length = values2.length, seen = array;
        if (array === values2) {
          values2 = copyArray(values2);
        }
        if (iteratee2) {
          seen = arrayMap(array, baseUnary(iteratee2));
        }
        while (++index < length) {
          var fromIndex = 0, value2 = values2[index], computed = iteratee2 ? iteratee2(value2) : value2;
          while ((fromIndex = indexOf2(seen, computed, fromIndex, comparator)) > -1) {
            if (seen !== array) {
              splice.call(seen, fromIndex, 1);
            }
            splice.call(array, fromIndex, 1);
          }
        }
        return array;
      }
      function basePullAt(array, indexes) {
        var length = array ? indexes.length : 0, lastIndex = length - 1;
        while (length--) {
          var index = indexes[length];
          if (length == lastIndex || index !== previous) {
            var previous = index;
            if (isIndex(index)) {
              splice.call(array, index, 1);
            } else {
              baseUnset(array, index);
            }
          }
        }
        return array;
      }
      function baseRandom(lower, upper) {
        return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
      }
      function baseRange(start, end, step, fromRight) {
        var index = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result2 = Array2(length);
        while (length--) {
          result2[fromRight ? length : ++index] = start;
          start += step;
        }
        return result2;
      }
      function baseRepeat(string, n2) {
        var result2 = "";
        if (!string || n2 < 1 || n2 > MAX_SAFE_INTEGER) {
          return result2;
        }
        do {
          if (n2 % 2) {
            result2 += string;
          }
          n2 = nativeFloor(n2 / 2);
          if (n2) {
            string += string;
          }
        } while (n2);
        return result2;
      }
      function baseRest(func, start) {
        return setToString(overRest(func, start, identity), func + "");
      }
      function baseSample(collection) {
        return arraySample(values(collection));
      }
      function baseSampleSize(collection, n2) {
        var array = values(collection);
        return shuffleSelf(array, baseClamp(n2, 0, array.length));
      }
      function baseSet(object, path, value2, customizer) {
        if (!isObject2(object)) {
          return object;
        }
        path = castPath(path, object);
        var index = -1, length = path.length, lastIndex = length - 1, nested = object;
        while (nested != null && ++index < length) {
          var key = toKey(path[index]), newValue = value2;
          if (key === "__proto__" || key === "constructor" || key === "prototype") {
            return object;
          }
          if (index != lastIndex) {
            var objValue = nested[key];
            newValue = customizer ? customizer(objValue, key, nested) : undefined$1;
            if (newValue === undefined$1) {
              newValue = isObject2(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
            }
          }
          assignValue(nested, key, newValue);
          nested = nested[key];
        }
        return object;
      }
      var baseSetData = !metaMap ? identity : function(func, data) {
        metaMap.set(func, data);
        return func;
      };
      var baseSetToString = !defineProperty2 ? identity : function(func, string) {
        return defineProperty2(func, "toString", {
          "configurable": true,
          "enumerable": false,
          "value": constant(string),
          "writable": true
        });
      };
      function baseShuffle(collection) {
        return shuffleSelf(values(collection));
      }
      function baseSlice(array, start, end) {
        var index = -1, length = array.length;
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end > length ? length : end;
        if (end < 0) {
          end += length;
        }
        length = start > end ? 0 : end - start >>> 0;
        start >>>= 0;
        var result2 = Array2(length);
        while (++index < length) {
          result2[index] = array[index + start];
        }
        return result2;
      }
      function baseSome(collection, predicate) {
        var result2;
        baseEach(collection, function(value2, index, collection2) {
          result2 = predicate(value2, index, collection2);
          return !result2;
        });
        return !!result2;
      }
      function baseSortedIndex(array, value2, retHighest) {
        var low = 0, high = array == null ? low : array.length;
        if (typeof value2 == "number" && value2 === value2 && high <= HALF_MAX_ARRAY_LENGTH) {
          while (low < high) {
            var mid = low + high >>> 1, computed = array[mid];
            if (computed !== null && !isSymbol2(computed) && (retHighest ? computed <= value2 : computed < value2)) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return high;
        }
        return baseSortedIndexBy(array, value2, identity, retHighest);
      }
      function baseSortedIndexBy(array, value2, iteratee2, retHighest) {
        var low = 0, high = array == null ? 0 : array.length;
        if (high === 0) {
          return 0;
        }
        value2 = iteratee2(value2);
        var valIsNaN = value2 !== value2, valIsNull = value2 === null, valIsSymbol = isSymbol2(value2), valIsUndefined = value2 === undefined$1;
        while (low < high) {
          var mid = nativeFloor((low + high) / 2), computed = iteratee2(array[mid]), othIsDefined = computed !== undefined$1, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol2(computed);
          if (valIsNaN) {
            var setLow = retHighest || othIsReflexive;
          } else if (valIsUndefined) {
            setLow = othIsReflexive && (retHighest || othIsDefined);
          } else if (valIsNull) {
            setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
          } else if (valIsSymbol) {
            setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
          } else if (othIsNull || othIsSymbol) {
            setLow = false;
          } else {
            setLow = retHighest ? computed <= value2 : computed < value2;
          }
          if (setLow) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return nativeMin(high, MAX_ARRAY_INDEX);
      }
      function baseSortedUniq(array, iteratee2) {
        var index = -1, length = array.length, resIndex = 0, result2 = [];
        while (++index < length) {
          var value2 = array[index], computed = iteratee2 ? iteratee2(value2) : value2;
          if (!index || !eq(computed, seen)) {
            var seen = computed;
            result2[resIndex++] = value2 === 0 ? 0 : value2;
          }
        }
        return result2;
      }
      function baseToNumber(value2) {
        if (typeof value2 == "number") {
          return value2;
        }
        if (isSymbol2(value2)) {
          return NAN;
        }
        return +value2;
      }
      function baseToString(value2) {
        if (typeof value2 == "string") {
          return value2;
        }
        if (isArray2(value2)) {
          return arrayMap(value2, baseToString) + "";
        }
        if (isSymbol2(value2)) {
          return symbolToString ? symbolToString.call(value2) : "";
        }
        var result2 = value2 + "";
        return result2 == "0" && 1 / value2 == -Infinity ? "-0" : result2;
      }
      function baseUniq(array, iteratee2, comparator) {
        var index = -1, includes2 = arrayIncludes, length = array.length, isCommon = true, result2 = [], seen = result2;
        if (comparator) {
          isCommon = false;
          includes2 = arrayIncludesWith;
        } else if (length >= LARGE_ARRAY_SIZE) {
          var set2 = iteratee2 ? null : createSet(array);
          if (set2) {
            return setToArray(set2);
          }
          isCommon = false;
          includes2 = cacheHas;
          seen = new SetCache();
        } else {
          seen = iteratee2 ? [] : result2;
        }
        outer:
          while (++index < length) {
            var value2 = array[index], computed = iteratee2 ? iteratee2(value2) : value2;
            value2 = comparator || value2 !== 0 ? value2 : 0;
            if (isCommon && computed === computed) {
              var seenIndex = seen.length;
              while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                  continue outer;
                }
              }
              if (iteratee2) {
                seen.push(computed);
              }
              result2.push(value2);
            } else if (!includes2(seen, computed, comparator)) {
              if (seen !== result2) {
                seen.push(computed);
              }
              result2.push(value2);
            }
          }
        return result2;
      }
      function baseUnset(object, path) {
        path = castPath(path, object);
        object = parent(object, path);
        return object == null || delete object[toKey(last(path))];
      }
      function baseUpdate(object, path, updater, customizer) {
        return baseSet(object, path, updater(baseGet(object, path)), customizer);
      }
      function baseWhile(array, predicate, isDrop, fromRight) {
        var length = array.length, index = fromRight ? length : -1;
        while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {
        }
        return isDrop ? baseSlice(array, fromRight ? 0 : index, fromRight ? index + 1 : length) : baseSlice(array, fromRight ? index + 1 : 0, fromRight ? length : index);
      }
      function baseWrapperValue(value2, actions) {
        var result2 = value2;
        if (result2 instanceof LazyWrapper) {
          result2 = result2.value();
        }
        return arrayReduce(actions, function(result3, action) {
          return action.func.apply(action.thisArg, arrayPush([result3], action.args));
        }, result2);
      }
      function baseXor(arrays, iteratee2, comparator) {
        var length = arrays.length;
        if (length < 2) {
          return length ? baseUniq(arrays[0]) : [];
        }
        var index = -1, result2 = Array2(length);
        while (++index < length) {
          var array = arrays[index], othIndex = -1;
          while (++othIndex < length) {
            if (othIndex != index) {
              result2[index] = baseDifference(result2[index] || array, arrays[othIndex], iteratee2, comparator);
            }
          }
        }
        return baseUniq(baseFlatten(result2, 1), iteratee2, comparator);
      }
      function baseZipObject(props, values2, assignFunc) {
        var index = -1, length = props.length, valsLength = values2.length, result2 = {};
        while (++index < length) {
          var value2 = index < valsLength ? values2[index] : undefined$1;
          assignFunc(result2, props[index], value2);
        }
        return result2;
      }
      function castArrayLikeObject(value2) {
        return isArrayLikeObject(value2) ? value2 : [];
      }
      function castFunction(value2) {
        return typeof value2 == "function" ? value2 : identity;
      }
      function castPath(value2, object) {
        if (isArray2(value2)) {
          return value2;
        }
        return isKey(value2, object) ? [value2] : stringToPath(toString(value2));
      }
      var castRest = baseRest;
      function castSlice(array, start, end) {
        var length = array.length;
        end = end === undefined$1 ? length : end;
        return !start && end >= length ? array : baseSlice(array, start, end);
      }
      var clearTimeout2 = ctxClearTimeout || function(id) {
        return root.clearTimeout(id);
      };
      function cloneBuffer(buffer, isDeep) {
        if (isDeep) {
          return buffer.slice();
        }
        var length = buffer.length, result2 = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
        buffer.copy(result2);
        return result2;
      }
      function cloneArrayBuffer(arrayBuffer) {
        var result2 = new arrayBuffer.constructor(arrayBuffer.byteLength);
        new Uint8Array(result2).set(new Uint8Array(arrayBuffer));
        return result2;
      }
      function cloneDataView(dataView, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
        return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
      }
      function cloneRegExp(regexp) {
        var result2 = new regexp.constructor(regexp.source, reFlags.exec(regexp));
        result2.lastIndex = regexp.lastIndex;
        return result2;
      }
      function cloneSymbol(symbol) {
        return symbolValueOf ? Object2(symbolValueOf.call(symbol)) : {};
      }
      function cloneTypedArray(typedArray, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
        return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
      }
      function compareAscending(value2, other) {
        if (value2 !== other) {
          var valIsDefined = value2 !== undefined$1, valIsNull = value2 === null, valIsReflexive = value2 === value2, valIsSymbol = isSymbol2(value2);
          var othIsDefined = other !== undefined$1, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol2(other);
          if (!othIsNull && !othIsSymbol && !valIsSymbol && value2 > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
            return 1;
          }
          if (!valIsNull && !valIsSymbol && !othIsSymbol && value2 < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
            return -1;
          }
        }
        return 0;
      }
      function compareMultiple(object, other, orders) {
        var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
        while (++index < length) {
          var result2 = compareAscending(objCriteria[index], othCriteria[index]);
          if (result2) {
            if (index >= ordersLength) {
              return result2;
            }
            var order = orders[index];
            return result2 * (order == "desc" ? -1 : 1);
          }
        }
        return object.index - other.index;
      }
      function composeArgs(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersLength = holders.length, leftIndex = -1, leftLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(leftLength + rangeLength), isUncurried = !isCurried;
        while (++leftIndex < leftLength) {
          result2[leftIndex] = partials[leftIndex];
        }
        while (++argsIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[holders[argsIndex]] = args[argsIndex];
          }
        }
        while (rangeLength--) {
          result2[leftIndex++] = args[argsIndex++];
        }
        return result2;
      }
      function composeArgsRight(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersIndex = -1, holdersLength = holders.length, rightIndex = -1, rightLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(rangeLength + rightLength), isUncurried = !isCurried;
        while (++argsIndex < rangeLength) {
          result2[argsIndex] = args[argsIndex];
        }
        var offset = argsIndex;
        while (++rightIndex < rightLength) {
          result2[offset + rightIndex] = partials[rightIndex];
        }
        while (++holdersIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[offset + holders[holdersIndex]] = args[argsIndex++];
          }
        }
        return result2;
      }
      function copyArray(source, array) {
        var index = -1, length = source.length;
        array || (array = Array2(length));
        while (++index < length) {
          array[index] = source[index];
        }
        return array;
      }
      function copyObject(source, props, object, customizer) {
        var isNew = !object;
        object || (object = {});
        var index = -1, length = props.length;
        while (++index < length) {
          var key = props[index];
          var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined$1;
          if (newValue === undefined$1) {
            newValue = source[key];
          }
          if (isNew) {
            baseAssignValue(object, key, newValue);
          } else {
            assignValue(object, key, newValue);
          }
        }
        return object;
      }
      function copySymbols(source, object) {
        return copyObject(source, getSymbols(source), object);
      }
      function copySymbolsIn(source, object) {
        return copyObject(source, getSymbolsIn(source), object);
      }
      function createAggregator(setter, initializer) {
        return function(collection, iteratee2) {
          var func = isArray2(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
          return func(collection, setter, getIteratee(iteratee2, 2), accumulator);
        };
      }
      function createAssigner(assigner) {
        return baseRest(function(object, sources) {
          var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined$1, guard = length > 2 ? sources[2] : undefined$1;
          customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : undefined$1;
          if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            customizer = length < 3 ? undefined$1 : customizer;
            length = 1;
          }
          object = Object2(object);
          while (++index < length) {
            var source = sources[index];
            if (source) {
              assigner(object, source, index, customizer);
            }
          }
          return object;
        });
      }
      function createBaseEach(eachFunc, fromRight) {
        return function(collection, iteratee2) {
          if (collection == null) {
            return collection;
          }
          if (!isArrayLike(collection)) {
            return eachFunc(collection, iteratee2);
          }
          var length = collection.length, index = fromRight ? length : -1, iterable = Object2(collection);
          while (fromRight ? index-- : ++index < length) {
            if (iteratee2(iterable[index], index, iterable) === false) {
              break;
            }
          }
          return collection;
        };
      }
      function createBaseFor(fromRight) {
        return function(object, iteratee2, keysFunc) {
          var index = -1, iterable = Object2(object), props = keysFunc(object), length = props.length;
          while (length--) {
            var key = props[fromRight ? length : ++index];
            if (iteratee2(iterable[key], key, iterable) === false) {
              break;
            }
          }
          return object;
        };
      }
      function createBind(func, bitmask, thisArg) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          return fn.apply(isBind ? thisArg : this, arguments);
        }
        return wrapper;
      }
      function createCaseFirst(methodName) {
        return function(string) {
          string = toString(string);
          var strSymbols = hasUnicode(string) ? stringToArray(string) : undefined$1;
          var chr = strSymbols ? strSymbols[0] : string.charAt(0);
          var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
          return chr[methodName]() + trailing;
        };
      }
      function createCompounder(callback) {
        return function(string) {
          return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
        };
      }
      function createCtor(Ctor) {
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return new Ctor();
            case 1:
              return new Ctor(args[0]);
            case 2:
              return new Ctor(args[0], args[1]);
            case 3:
              return new Ctor(args[0], args[1], args[2]);
            case 4:
              return new Ctor(args[0], args[1], args[2], args[3]);
            case 5:
              return new Ctor(args[0], args[1], args[2], args[3], args[4]);
            case 6:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          }
          var thisBinding = baseCreate(Ctor.prototype), result2 = Ctor.apply(thisBinding, args);
          return isObject2(result2) ? result2 : thisBinding;
        };
      }
      function createCurry(func, bitmask, arity) {
        var Ctor = createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index = length, placeholder = getHolder(wrapper);
          while (index--) {
            args[index] = arguments[index];
          }
          var holders = length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder ? [] : replaceHolders(args, placeholder);
          length -= holders.length;
          if (length < arity) {
            return createRecurry(
              func,
              bitmask,
              createHybrid,
              wrapper.placeholder,
              undefined$1,
              args,
              holders,
              undefined$1,
              undefined$1,
              arity - length
            );
          }
          var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          return apply2(fn, this, args);
        }
        return wrapper;
      }
      function createFind(findIndexFunc) {
        return function(collection, predicate, fromIndex) {
          var iterable = Object2(collection);
          if (!isArrayLike(collection)) {
            var iteratee2 = getIteratee(predicate, 3);
            collection = keys2(collection);
            predicate = function(key) {
              return iteratee2(iterable[key], key, iterable);
            };
          }
          var index = findIndexFunc(collection, predicate, fromIndex);
          return index > -1 ? iterable[iteratee2 ? collection[index] : index] : undefined$1;
        };
      }
      function createFlow(fromRight) {
        return flatRest(function(funcs) {
          var length = funcs.length, index = length, prereq = LodashWrapper.prototype.thru;
          if (fromRight) {
            funcs.reverse();
          }
          while (index--) {
            var func = funcs[index];
            if (typeof func != "function") {
              throw new TypeError2(FUNC_ERROR_TEXT);
            }
            if (prereq && !wrapper && getFuncName(func) == "wrapper") {
              var wrapper = new LodashWrapper([], true);
            }
          }
          index = wrapper ? index : length;
          while (++index < length) {
            func = funcs[index];
            var funcName = getFuncName(func), data = funcName == "wrapper" ? getData(func) : undefined$1;
            if (data && isLaziable(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
              wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
            } else {
              wrapper = func.length == 1 && isLaziable(func) ? wrapper[funcName]() : wrapper.thru(func);
            }
          }
          return function() {
            var args = arguments, value2 = args[0];
            if (wrapper && args.length == 1 && isArray2(value2)) {
              return wrapper.plant(value2).value();
            }
            var index2 = 0, result2 = length ? funcs[index2].apply(this, args) : value2;
            while (++index2 < length) {
              result2 = funcs[index2].call(this, result2);
            }
            return result2;
          };
        });
      }
      function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary2, arity) {
        var isAry = bitmask & WRAP_ARY_FLAG, isBind = bitmask & WRAP_BIND_FLAG, isBindKey = bitmask & WRAP_BIND_KEY_FLAG, isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG), isFlip = bitmask & WRAP_FLIP_FLAG, Ctor = isBindKey ? undefined$1 : createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index = length;
          while (index--) {
            args[index] = arguments[index];
          }
          if (isCurried) {
            var placeholder = getHolder(wrapper), holdersCount = countHolders(args, placeholder);
          }
          if (partials) {
            args = composeArgs(args, partials, holders, isCurried);
          }
          if (partialsRight) {
            args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
          }
          length -= holdersCount;
          if (isCurried && length < arity) {
            var newHolders = replaceHolders(args, placeholder);
            return createRecurry(
              func,
              bitmask,
              createHybrid,
              wrapper.placeholder,
              thisArg,
              args,
              newHolders,
              argPos,
              ary2,
              arity - length
            );
          }
          var thisBinding = isBind ? thisArg : this, fn = isBindKey ? thisBinding[func] : func;
          length = args.length;
          if (argPos) {
            args = reorder(args, argPos);
          } else if (isFlip && length > 1) {
            args.reverse();
          }
          if (isAry && ary2 < length) {
            args.length = ary2;
          }
          if (this && this !== root && this instanceof wrapper) {
            fn = Ctor || createCtor(fn);
          }
          return fn.apply(thisBinding, args);
        }
        return wrapper;
      }
      function createInverter(setter, toIteratee) {
        return function(object, iteratee2) {
          return baseInverter(object, setter, toIteratee(iteratee2), {});
        };
      }
      function createMathOperation(operator, defaultValue) {
        return function(value2, other) {
          var result2;
          if (value2 === undefined$1 && other === undefined$1) {
            return defaultValue;
          }
          if (value2 !== undefined$1) {
            result2 = value2;
          }
          if (other !== undefined$1) {
            if (result2 === undefined$1) {
              return other;
            }
            if (typeof value2 == "string" || typeof other == "string") {
              value2 = baseToString(value2);
              other = baseToString(other);
            } else {
              value2 = baseToNumber(value2);
              other = baseToNumber(other);
            }
            result2 = operator(value2, other);
          }
          return result2;
        };
      }
      function createOver(arrayFunc) {
        return flatRest(function(iteratees) {
          iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
          return baseRest(function(args) {
            var thisArg = this;
            return arrayFunc(iteratees, function(iteratee2) {
              return apply2(iteratee2, thisArg, args);
            });
          });
        });
      }
      function createPadding(length, chars) {
        chars = chars === undefined$1 ? " " : baseToString(chars);
        var charsLength = chars.length;
        if (charsLength < 2) {
          return charsLength ? baseRepeat(chars, length) : chars;
        }
        var result2 = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
        return hasUnicode(chars) ? castSlice(stringToArray(result2), 0, length).join("") : result2.slice(0, length);
      }
      function createPartial(func, bitmask, thisArg, partials) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var argsIndex = -1, argsLength = arguments.length, leftIndex = -1, leftLength = partials.length, args = Array2(leftLength + argsLength), fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          while (++leftIndex < leftLength) {
            args[leftIndex] = partials[leftIndex];
          }
          while (argsLength--) {
            args[leftIndex++] = arguments[++argsIndex];
          }
          return apply2(fn, isBind ? thisArg : this, args);
        }
        return wrapper;
      }
      function createRange(fromRight) {
        return function(start, end, step) {
          if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
            end = step = undefined$1;
          }
          start = toFinite(start);
          if (end === undefined$1) {
            end = start;
            start = 0;
          } else {
            end = toFinite(end);
          }
          step = step === undefined$1 ? start < end ? 1 : -1 : toFinite(step);
          return baseRange(start, end, step, fromRight);
        };
      }
      function createRelationalOperation(operator) {
        return function(value2, other) {
          if (!(typeof value2 == "string" && typeof other == "string")) {
            value2 = toNumber(value2);
            other = toNumber(other);
          }
          return operator(value2, other);
        };
      }
      function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary2, arity) {
        var isCurry = bitmask & WRAP_CURRY_FLAG, newHolders = isCurry ? holders : undefined$1, newHoldersRight = isCurry ? undefined$1 : holders, newPartials = isCurry ? partials : undefined$1, newPartialsRight = isCurry ? undefined$1 : partials;
        bitmask |= isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG;
        bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);
        if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
          bitmask &= -4;
        }
        var newData = [
          func,
          bitmask,
          thisArg,
          newPartials,
          newHolders,
          newPartialsRight,
          newHoldersRight,
          argPos,
          ary2,
          arity
        ];
        var result2 = wrapFunc.apply(undefined$1, newData);
        if (isLaziable(func)) {
          setData(result2, newData);
        }
        result2.placeholder = placeholder;
        return setWrapToString(result2, func, bitmask);
      }
      function createRound(methodName) {
        var func = Math2[methodName];
        return function(number, precision) {
          number = toNumber(number);
          precision = precision == null ? 0 : nativeMin(toInteger2(precision), 292);
          if (precision && nativeIsFinite(number)) {
            var pair = (toString(number) + "e").split("e"), value2 = func(pair[0] + "e" + (+pair[1] + precision));
            pair = (toString(value2) + "e").split("e");
            return +(pair[0] + "e" + (+pair[1] - precision));
          }
          return func(number);
        };
      }
      var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop2 : function(values2) {
        return new Set2(values2);
      };
      function createToPairs(keysFunc) {
        return function(object) {
          var tag = getTag(object);
          if (tag == mapTag) {
            return mapToArray(object);
          }
          if (tag == setTag) {
            return setToPairs(object);
          }
          return baseToPairs(object, keysFunc(object));
        };
      }
      function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary2, arity) {
        var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
        if (!isBindKey && typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        var length = partials ? partials.length : 0;
        if (!length) {
          bitmask &= -97;
          partials = holders = undefined$1;
        }
        ary2 = ary2 === undefined$1 ? ary2 : nativeMax(toInteger2(ary2), 0);
        arity = arity === undefined$1 ? arity : toInteger2(arity);
        length -= holders ? holders.length : 0;
        if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
          var partialsRight = partials, holdersRight = holders;
          partials = holders = undefined$1;
        }
        var data = isBindKey ? undefined$1 : getData(func);
        var newData = [
          func,
          bitmask,
          thisArg,
          partials,
          holders,
          partialsRight,
          holdersRight,
          argPos,
          ary2,
          arity
        ];
        if (data) {
          mergeData(newData, data);
        }
        func = newData[0];
        bitmask = newData[1];
        thisArg = newData[2];
        partials = newData[3];
        holders = newData[4];
        arity = newData[9] = newData[9] === undefined$1 ? isBindKey ? 0 : func.length : nativeMax(newData[9] - length, 0);
        if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
          bitmask &= -25;
        }
        if (!bitmask || bitmask == WRAP_BIND_FLAG) {
          var result2 = createBind(func, bitmask, thisArg);
        } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
          result2 = createCurry(func, bitmask, arity);
        } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
          result2 = createPartial(func, bitmask, thisArg, partials);
        } else {
          result2 = createHybrid.apply(undefined$1, newData);
        }
        var setter = data ? baseSetData : setData;
        return setWrapToString(setter(result2, newData), func, bitmask);
      }
      function customDefaultsAssignIn(objValue, srcValue, key, object) {
        if (objValue === undefined$1 || eq(objValue, objectProto[key]) && !hasOwnProperty2.call(object, key)) {
          return srcValue;
        }
        return objValue;
      }
      function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
        if (isObject2(objValue) && isObject2(srcValue)) {
          stack.set(srcValue, objValue);
          baseMerge(objValue, srcValue, undefined$1, customDefaultsMerge, stack);
          stack["delete"](srcValue);
        }
        return objValue;
      }
      function customOmitClone(value2) {
        return isPlainObject(value2) ? undefined$1 : value2;
      }
      function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
        if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
          return false;
        }
        var arrStacked = stack.get(array);
        var othStacked = stack.get(other);
        if (arrStacked && othStacked) {
          return arrStacked == other && othStacked == array;
        }
        var index = -1, result2 = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined$1;
        stack.set(array, other);
        stack.set(other, array);
        while (++index < arrLength) {
          var arrValue = array[index], othValue = other[index];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
          }
          if (compared !== undefined$1) {
            if (compared) {
              continue;
            }
            result2 = false;
            break;
          }
          if (seen) {
            if (!arraySome(other, function(othValue2, othIndex) {
              if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
              result2 = false;
              break;
            }
          } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
            result2 = false;
            break;
          }
        }
        stack["delete"](array);
        stack["delete"](other);
        return result2;
      }
      function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
        switch (tag) {
          case dataViewTag:
            if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
              return false;
            }
            object = object.buffer;
            other = other.buffer;
          case arrayBufferTag:
            if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
              return false;
            }
            return true;
          case boolTag:
          case dateTag:
          case numberTag:
            return eq(+object, +other);
          case errorTag:
            return object.name == other.name && object.message == other.message;
          case regexpTag:
          case stringTag:
            return object == other + "";
          case mapTag:
            var convert = mapToArray;
          case setTag:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
            convert || (convert = setToArray);
            if (object.size != other.size && !isPartial) {
              return false;
            }
            var stacked = stack.get(object);
            if (stacked) {
              return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG;
            stack.set(object, other);
            var result2 = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
            stack["delete"](object);
            return result2;
          case symbolTag:
            if (symbolValueOf) {
              return symbolValueOf.call(object) == symbolValueOf.call(other);
            }
        }
        return false;
      }
      function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
        if (objLength != othLength && !isPartial) {
          return false;
        }
        var index = objLength;
        while (index--) {
          var key = objProps[index];
          if (!(isPartial ? key in other : hasOwnProperty2.call(other, key))) {
            return false;
          }
        }
        var objStacked = stack.get(object);
        var othStacked = stack.get(other);
        if (objStacked && othStacked) {
          return objStacked == other && othStacked == object;
        }
        var result2 = true;
        stack.set(object, other);
        stack.set(other, object);
        var skipCtor = isPartial;
        while (++index < objLength) {
          key = objProps[index];
          var objValue = object[key], othValue = other[key];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
          }
          if (!(compared === undefined$1 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
            result2 = false;
            break;
          }
          skipCtor || (skipCtor = key == "constructor");
        }
        if (result2 && !skipCtor) {
          var objCtor = object.constructor, othCtor = other.constructor;
          if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
            result2 = false;
          }
        }
        stack["delete"](object);
        stack["delete"](other);
        return result2;
      }
      function flatRest(func) {
        return setToString(overRest(func, undefined$1, flatten), func + "");
      }
      function getAllKeys(object) {
        return baseGetAllKeys(object, keys2, getSymbols);
      }
      function getAllKeysIn(object) {
        return baseGetAllKeys(object, keysIn, getSymbolsIn);
      }
      var getData = !metaMap ? noop2 : function(func) {
        return metaMap.get(func);
      };
      function getFuncName(func) {
        var result2 = func.name + "", array = realNames[result2], length = hasOwnProperty2.call(realNames, result2) ? array.length : 0;
        while (length--) {
          var data = array[length], otherFunc = data.func;
          if (otherFunc == null || otherFunc == func) {
            return data.name;
          }
        }
        return result2;
      }
      function getHolder(func) {
        var object = hasOwnProperty2.call(lodash2, "placeholder") ? lodash2 : func;
        return object.placeholder;
      }
      function getIteratee() {
        var result2 = lodash2.iteratee || iteratee;
        result2 = result2 === iteratee ? baseIteratee : result2;
        return arguments.length ? result2(arguments[0], arguments[1]) : result2;
      }
      function getMapData(map3, key) {
        var data = map3.__data__;
        return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      function getMatchData(object) {
        var result2 = keys2(object), length = result2.length;
        while (length--) {
          var key = result2[length], value2 = object[key];
          result2[length] = [key, value2, isStrictComparable(value2)];
        }
        return result2;
      }
      function getNative(object, key) {
        var value2 = getValue(object, key);
        return baseIsNative(value2) ? value2 : undefined$1;
      }
      function getRawTag(value2) {
        var isOwn = hasOwnProperty2.call(value2, symToStringTag), tag = value2[symToStringTag];
        try {
          value2[symToStringTag] = undefined$1;
          var unmasked = true;
        } catch (e) {
        }
        var result2 = nativeObjectToString.call(value2);
        if (unmasked) {
          if (isOwn) {
            value2[symToStringTag] = tag;
          } else {
            delete value2[symToStringTag];
          }
        }
        return result2;
      }
      var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
        if (object == null) {
          return [];
        }
        object = Object2(object);
        return arrayFilter(nativeGetSymbols(object), function(symbol) {
          return propertyIsEnumerable.call(object, symbol);
        });
      };
      var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
        var result2 = [];
        while (object) {
          arrayPush(result2, getSymbols(object));
          object = getPrototype(object);
        }
        return result2;
      };
      var getTag = baseGetTag;
      if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
        getTag = function(value2) {
          var result2 = baseGetTag(value2), Ctor = result2 == objectTag ? value2.constructor : undefined$1, ctorString = Ctor ? toSource(Ctor) : "";
          if (ctorString) {
            switch (ctorString) {
              case dataViewCtorString:
                return dataViewTag;
              case mapCtorString:
                return mapTag;
              case promiseCtorString:
                return promiseTag;
              case setCtorString:
                return setTag;
              case weakMapCtorString:
                return weakMapTag;
            }
          }
          return result2;
        };
      }
      function getView(start, end, transforms) {
        var index = -1, length = transforms.length;
        while (++index < length) {
          var data = transforms[index], size2 = data.size;
          switch (data.type) {
            case "drop":
              start += size2;
              break;
            case "dropRight":
              end -= size2;
              break;
            case "take":
              end = nativeMin(end, start + size2);
              break;
            case "takeRight":
              start = nativeMax(start, end - size2);
              break;
          }
        }
        return { "start": start, "end": end };
      }
      function getWrapDetails(source) {
        var match = source.match(reWrapDetails);
        return match ? match[1].split(reSplitDetails) : [];
      }
      function hasPath(object, path, hasFunc) {
        path = castPath(path, object);
        var index = -1, length = path.length, result2 = false;
        while (++index < length) {
          var key = toKey(path[index]);
          if (!(result2 = object != null && hasFunc(object, key))) {
            break;
          }
          object = object[key];
        }
        if (result2 || ++index != length) {
          return result2;
        }
        length = object == null ? 0 : object.length;
        return !!length && isLength(length) && isIndex(key, length) && (isArray2(object) || isArguments2(object));
      }
      function initCloneArray(array) {
        var length = array.length, result2 = new array.constructor(length);
        if (length && typeof array[0] == "string" && hasOwnProperty2.call(array, "index")) {
          result2.index = array.index;
          result2.input = array.input;
        }
        return result2;
      }
      function initCloneObject(object) {
        return typeof object.constructor == "function" && !isPrototype2(object) ? baseCreate(getPrototype(object)) : {};
      }
      function initCloneByTag(object, tag, isDeep) {
        var Ctor = object.constructor;
        switch (tag) {
          case arrayBufferTag:
            return cloneArrayBuffer(object);
          case boolTag:
          case dateTag:
            return new Ctor(+object);
          case dataViewTag:
            return cloneDataView(object, isDeep);
          case float32Tag:
          case float64Tag:
          case int8Tag:
          case int16Tag:
          case int32Tag:
          case uint8Tag:
          case uint8ClampedTag:
          case uint16Tag:
          case uint32Tag:
            return cloneTypedArray(object, isDeep);
          case mapTag:
            return new Ctor();
          case numberTag:
          case stringTag:
            return new Ctor(object);
          case regexpTag:
            return cloneRegExp(object);
          case setTag:
            return new Ctor();
          case symbolTag:
            return cloneSymbol(object);
        }
      }
      function insertWrapDetails(source, details) {
        var length = details.length;
        if (!length) {
          return source;
        }
        var lastIndex = length - 1;
        details[lastIndex] = (length > 1 ? "& " : "") + details[lastIndex];
        details = details.join(length > 2 ? ", " : " ");
        return source.replace(reWrapComment, "{\n/* [wrapped with " + details + "] */\n");
      }
      function isFlattenable(value2) {
        return isArray2(value2) || isArguments2(value2) || !!(spreadableSymbol && value2 && value2[spreadableSymbol]);
      }
      function isIndex(value2, length) {
        var type = typeof value2;
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (type == "number" || type != "symbol" && reIsUint.test(value2)) && (value2 > -1 && value2 % 1 == 0 && value2 < length);
      }
      function isIterateeCall(value2, index, object) {
        if (!isObject2(object)) {
          return false;
        }
        var type = typeof index;
        if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
          return eq(object[index], value2);
        }
        return false;
      }
      function isKey(value2, object) {
        if (isArray2(value2)) {
          return false;
        }
        var type = typeof value2;
        if (type == "number" || type == "symbol" || type == "boolean" || value2 == null || isSymbol2(value2)) {
          return true;
        }
        return reIsPlainProp.test(value2) || !reIsDeepProp.test(value2) || object != null && value2 in Object2(object);
      }
      function isKeyable(value2) {
        var type = typeof value2;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value2 !== "__proto__" : value2 === null;
      }
      function isLaziable(func) {
        var funcName = getFuncName(func), other = lodash2[funcName];
        if (typeof other != "function" || !(funcName in LazyWrapper.prototype)) {
          return false;
        }
        if (func === other) {
          return true;
        }
        var data = getData(other);
        return !!data && func === data[0];
      }
      function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
      }
      var isMaskable = coreJsData ? isFunction2 : stubFalse;
      function isPrototype2(value2) {
        var Ctor = value2 && value2.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value2 === proto;
      }
      function isStrictComparable(value2) {
        return value2 === value2 && !isObject2(value2);
      }
      function matchesStrictComparable(key, srcValue) {
        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === srcValue && (srcValue !== undefined$1 || key in Object2(object));
        };
      }
      function memoizeCapped(func) {
        var result2 = memoize2(func, function(key) {
          if (cache.size === MAX_MEMOIZE_SIZE) {
            cache.clear();
          }
          return key;
        });
        var cache = result2.cache;
        return result2;
      }
      function mergeData(data, source) {
        var bitmask = data[1], srcBitmask = source[1], newBitmask = bitmask | srcBitmask, isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);
        var isCombo = srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_CURRY_FLAG || srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_REARG_FLAG && data[7].length <= source[8] || srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG) && source[7].length <= source[8] && bitmask == WRAP_CURRY_FLAG;
        if (!(isCommon || isCombo)) {
          return data;
        }
        if (srcBitmask & WRAP_BIND_FLAG) {
          data[2] = source[2];
          newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
        }
        var value2 = source[3];
        if (value2) {
          var partials = data[3];
          data[3] = partials ? composeArgs(partials, value2, source[4]) : value2;
          data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
        }
        value2 = source[5];
        if (value2) {
          partials = data[5];
          data[5] = partials ? composeArgsRight(partials, value2, source[6]) : value2;
          data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
        }
        value2 = source[7];
        if (value2) {
          data[7] = value2;
        }
        if (srcBitmask & WRAP_ARY_FLAG) {
          data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
        }
        if (data[9] == null) {
          data[9] = source[9];
        }
        data[0] = source[0];
        data[1] = newBitmask;
        return data;
      }
      function nativeKeysIn(object) {
        var result2 = [];
        if (object != null) {
          for (var key in Object2(object)) {
            result2.push(key);
          }
        }
        return result2;
      }
      function objectToString(value2) {
        return nativeObjectToString.call(value2);
      }
      function overRest(func, start, transform2) {
        start = nativeMax(start === undefined$1 ? func.length - 1 : start, 0);
        return function() {
          var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array2(length);
          while (++index < length) {
            array[index] = args[start + index];
          }
          index = -1;
          var otherArgs = Array2(start + 1);
          while (++index < start) {
            otherArgs[index] = args[index];
          }
          otherArgs[start] = transform2(array);
          return apply2(func, this, otherArgs);
        };
      }
      function parent(object, path) {
        return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
      }
      function reorder(array, indexes) {
        var arrLength = array.length, length = nativeMin(indexes.length, arrLength), oldArray = copyArray(array);
        while (length--) {
          var index = indexes[length];
          array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined$1;
        }
        return array;
      }
      function safeGet(object, key) {
        if (key === "constructor" && typeof object[key] === "function") {
          return;
        }
        if (key == "__proto__") {
          return;
        }
        return object[key];
      }
      var setData = shortOut(baseSetData);
      var setTimeout2 = ctxSetTimeout || function(func, wait) {
        return root.setTimeout(func, wait);
      };
      var setToString = shortOut(baseSetToString);
      function setWrapToString(wrapper, reference, bitmask) {
        var source = reference + "";
        return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
      }
      function shortOut(func) {
        var count = 0, lastCalled = 0;
        return function() {
          var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
          lastCalled = stamp;
          if (remaining > 0) {
            if (++count >= HOT_COUNT) {
              return arguments[0];
            }
          } else {
            count = 0;
          }
          return func.apply(undefined$1, arguments);
        };
      }
      function shuffleSelf(array, size2) {
        var index = -1, length = array.length, lastIndex = length - 1;
        size2 = size2 === undefined$1 ? length : size2;
        while (++index < size2) {
          var rand = baseRandom(index, lastIndex), value2 = array[rand];
          array[rand] = array[index];
          array[index] = value2;
        }
        array.length = size2;
        return array;
      }
      var stringToPath = memoizeCapped(function(string) {
        var result2 = [];
        if (string.charCodeAt(0) === 46) {
          result2.push("");
        }
        string.replace(rePropName, function(match, number, quote, subString) {
          result2.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
        });
        return result2;
      });
      function toKey(value2) {
        if (typeof value2 == "string" || isSymbol2(value2)) {
          return value2;
        }
        var result2 = value2 + "";
        return result2 == "0" && 1 / value2 == -Infinity ? "-0" : result2;
      }
      function toSource(func) {
        if (func != null) {
          try {
            return funcToString.call(func);
          } catch (e) {
          }
          try {
            return func + "";
          } catch (e) {
          }
        }
        return "";
      }
      function updateWrapDetails(details, bitmask) {
        arrayEach(wrapFlags, function(pair) {
          var value2 = "_." + pair[0];
          if (bitmask & pair[1] && !arrayIncludes(details, value2)) {
            details.push(value2);
          }
        });
        return details.sort();
      }
      function wrapperClone(wrapper) {
        if (wrapper instanceof LazyWrapper) {
          return wrapper.clone();
        }
        var result2 = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
        result2.__actions__ = copyArray(wrapper.__actions__);
        result2.__index__ = wrapper.__index__;
        result2.__values__ = wrapper.__values__;
        return result2;
      }
      function chunk(array, size2, guard) {
        if (guard ? isIterateeCall(array, size2, guard) : size2 === undefined$1) {
          size2 = 1;
        } else {
          size2 = nativeMax(toInteger2(size2), 0);
        }
        var length = array == null ? 0 : array.length;
        if (!length || size2 < 1) {
          return [];
        }
        var index = 0, resIndex = 0, result2 = Array2(nativeCeil(length / size2));
        while (index < length) {
          result2[resIndex++] = baseSlice(array, index, index += size2);
        }
        return result2;
      }
      function compact(array) {
        var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result2 = [];
        while (++index < length) {
          var value2 = array[index];
          if (value2) {
            result2[resIndex++] = value2;
          }
        }
        return result2;
      }
      function concat() {
        var length = arguments.length;
        if (!length) {
          return [];
        }
        var args = Array2(length - 1), array = arguments[0], index = length;
        while (index--) {
          args[index - 1] = arguments[index];
        }
        return arrayPush(isArray2(array) ? copyArray(array) : [array], baseFlatten(args, 1));
      }
      var difference = baseRest(function(array, values2) {
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true)) : [];
      });
      var differenceBy = baseRest(function(array, values2) {
        var iteratee2 = last(values2);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2)) : [];
      });
      var differenceWith = baseRest(function(array, values2) {
        var comparator = last(values2);
        if (isArrayLikeObject(comparator)) {
          comparator = undefined$1;
        }
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), undefined$1, comparator) : [];
      });
      function drop(array, n2, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n2 = guard || n2 === undefined$1 ? 1 : toInteger2(n2);
        return baseSlice(array, n2 < 0 ? 0 : n2, length);
      }
      function dropRight(array, n2, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n2 = guard || n2 === undefined$1 ? 1 : toInteger2(n2);
        n2 = length - n2;
        return baseSlice(array, 0, n2 < 0 ? 0 : n2);
      }
      function dropRightWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true, true) : [];
      }
      function dropWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true) : [];
      }
      function fill(array, value2, start, end) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        if (start && typeof start != "number" && isIterateeCall(array, value2, start)) {
          start = 0;
          end = length;
        }
        return baseFill(array, value2, start, end);
      }
      function findIndex(array, predicate, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = fromIndex == null ? 0 : toInteger2(fromIndex);
        if (index < 0) {
          index = nativeMax(length + index, 0);
        }
        return baseFindIndex(array, getIteratee(predicate, 3), index);
      }
      function findLastIndex(array, predicate, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = length - 1;
        if (fromIndex !== undefined$1) {
          index = toInteger2(fromIndex);
          index = fromIndex < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
        }
        return baseFindIndex(array, getIteratee(predicate, 3), index, true);
      }
      function flatten(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseFlatten(array, 1) : [];
      }
      function flattenDeep(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseFlatten(array, INFINITY) : [];
      }
      function flattenDepth(array, depth) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        depth = depth === undefined$1 ? 1 : toInteger2(depth);
        return baseFlatten(array, depth);
      }
      function fromPairs(pairs) {
        var index = -1, length = pairs == null ? 0 : pairs.length, result2 = {};
        while (++index < length) {
          var pair = pairs[index];
          result2[pair[0]] = pair[1];
        }
        return result2;
      }
      function head(array) {
        return array && array.length ? array[0] : undefined$1;
      }
      function indexOf(array, value2, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = fromIndex == null ? 0 : toInteger2(fromIndex);
        if (index < 0) {
          index = nativeMax(length + index, 0);
        }
        return baseIndexOf(array, value2, index);
      }
      function initial(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseSlice(array, 0, -1) : [];
      }
      var intersection = baseRest(function(arrays) {
        var mapped = arrayMap(arrays, castArrayLikeObject);
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
      });
      var intersectionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
        if (iteratee2 === last(mapped)) {
          iteratee2 = undefined$1;
        } else {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, getIteratee(iteratee2, 2)) : [];
      });
      var intersectionWith = baseRest(function(arrays) {
        var comparator = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        if (comparator) {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, undefined$1, comparator) : [];
      });
      function join(array, separator) {
        return array == null ? "" : nativeJoin.call(array, separator);
      }
      function last(array) {
        var length = array == null ? 0 : array.length;
        return length ? array[length - 1] : undefined$1;
      }
      function lastIndexOf(array, value2, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = length;
        if (fromIndex !== undefined$1) {
          index = toInteger2(fromIndex);
          index = index < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
        }
        return value2 === value2 ? strictLastIndexOf(array, value2, index) : baseFindIndex(array, baseIsNaN, index, true);
      }
      function nth(array, n2) {
        return array && array.length ? baseNth(array, toInteger2(n2)) : undefined$1;
      }
      var pull = baseRest(pullAll);
      function pullAll(array, values2) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2) : array;
      }
      function pullAllBy(array, values2, iteratee2) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2, getIteratee(iteratee2, 2)) : array;
      }
      function pullAllWith(array, values2, comparator) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2, undefined$1, comparator) : array;
      }
      var pullAt = flatRest(function(array, indexes) {
        var length = array == null ? 0 : array.length, result2 = baseAt(array, indexes);
        basePullAt(array, arrayMap(indexes, function(index) {
          return isIndex(index, length) ? +index : index;
        }).sort(compareAscending));
        return result2;
      });
      function remove(array, predicate) {
        var result2 = [];
        if (!(array && array.length)) {
          return result2;
        }
        var index = -1, indexes = [], length = array.length;
        predicate = getIteratee(predicate, 3);
        while (++index < length) {
          var value2 = array[index];
          if (predicate(value2, index, array)) {
            result2.push(value2);
            indexes.push(index);
          }
        }
        basePullAt(array, indexes);
        return result2;
      }
      function reverse(array) {
        return array == null ? array : nativeReverse.call(array);
      }
      function slice2(array, start, end) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        if (end && typeof end != "number" && isIterateeCall(array, start, end)) {
          start = 0;
          end = length;
        } else {
          start = start == null ? 0 : toInteger2(start);
          end = end === undefined$1 ? length : toInteger2(end);
        }
        return baseSlice(array, start, end);
      }
      function sortedIndex(array, value2) {
        return baseSortedIndex(array, value2);
      }
      function sortedIndexBy(array, value2, iteratee2) {
        return baseSortedIndexBy(array, value2, getIteratee(iteratee2, 2));
      }
      function sortedIndexOf(array, value2) {
        var length = array == null ? 0 : array.length;
        if (length) {
          var index = baseSortedIndex(array, value2);
          if (index < length && eq(array[index], value2)) {
            return index;
          }
        }
        return -1;
      }
      function sortedLastIndex(array, value2) {
        return baseSortedIndex(array, value2, true);
      }
      function sortedLastIndexBy(array, value2, iteratee2) {
        return baseSortedIndexBy(array, value2, getIteratee(iteratee2, 2), true);
      }
      function sortedLastIndexOf(array, value2) {
        var length = array == null ? 0 : array.length;
        if (length) {
          var index = baseSortedIndex(array, value2, true) - 1;
          if (eq(array[index], value2)) {
            return index;
          }
        }
        return -1;
      }
      function sortedUniq(array) {
        return array && array.length ? baseSortedUniq(array) : [];
      }
      function sortedUniqBy(array, iteratee2) {
        return array && array.length ? baseSortedUniq(array, getIteratee(iteratee2, 2)) : [];
      }
      function tail(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseSlice(array, 1, length) : [];
      }
      function take(array, n2, guard) {
        if (!(array && array.length)) {
          return [];
        }
        n2 = guard || n2 === undefined$1 ? 1 : toInteger2(n2);
        return baseSlice(array, 0, n2 < 0 ? 0 : n2);
      }
      function takeRight(array, n2, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n2 = guard || n2 === undefined$1 ? 1 : toInteger2(n2);
        n2 = length - n2;
        return baseSlice(array, n2 < 0 ? 0 : n2, length);
      }
      function takeRightWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), false, true) : [];
      }
      function takeWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3)) : [];
      }
      var union = baseRest(function(arrays) {
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
      });
      var unionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2));
      });
      var unionWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined$1, comparator);
      });
      function uniq(array) {
        return array && array.length ? baseUniq(array) : [];
      }
      function uniqBy(array, iteratee2) {
        return array && array.length ? baseUniq(array, getIteratee(iteratee2, 2)) : [];
      }
      function uniqWith(array, comparator) {
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return array && array.length ? baseUniq(array, undefined$1, comparator) : [];
      }
      function unzip(array) {
        if (!(array && array.length)) {
          return [];
        }
        var length = 0;
        array = arrayFilter(array, function(group) {
          if (isArrayLikeObject(group)) {
            length = nativeMax(group.length, length);
            return true;
          }
        });
        return baseTimes(length, function(index) {
          return arrayMap(array, baseProperty(index));
        });
      }
      function unzipWith(array, iteratee2) {
        if (!(array && array.length)) {
          return [];
        }
        var result2 = unzip(array);
        if (iteratee2 == null) {
          return result2;
        }
        return arrayMap(result2, function(group) {
          return apply2(iteratee2, undefined$1, group);
        });
      }
      var without = baseRest(function(array, values2) {
        return isArrayLikeObject(array) ? baseDifference(array, values2) : [];
      });
      var xor = baseRest(function(arrays) {
        return baseXor(arrayFilter(arrays, isArrayLikeObject));
      });
      var xorBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined$1;
        }
        return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee2, 2));
      });
      var xorWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined$1;
        return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined$1, comparator);
      });
      var zip = baseRest(unzip);
      function zipObject(props, values2) {
        return baseZipObject(props || [], values2 || [], assignValue);
      }
      function zipObjectDeep(props, values2) {
        return baseZipObject(props || [], values2 || [], baseSet);
      }
      var zipWith = baseRest(function(arrays) {
        var length = arrays.length, iteratee2 = length > 1 ? arrays[length - 1] : undefined$1;
        iteratee2 = typeof iteratee2 == "function" ? (arrays.pop(), iteratee2) : undefined$1;
        return unzipWith(arrays, iteratee2);
      });
      function chain(value2) {
        var result2 = lodash2(value2);
        result2.__chain__ = true;
        return result2;
      }
      function tap(value2, interceptor) {
        interceptor(value2);
        return value2;
      }
      function thru(value2, interceptor) {
        return interceptor(value2);
      }
      var wrapperAt = flatRest(function(paths) {
        var length = paths.length, start = length ? paths[0] : 0, value2 = this.__wrapped__, interceptor = function(object) {
          return baseAt(object, paths);
        };
        if (length > 1 || this.__actions__.length || !(value2 instanceof LazyWrapper) || !isIndex(start)) {
          return this.thru(interceptor);
        }
        value2 = value2.slice(start, +start + (length ? 1 : 0));
        value2.__actions__.push({
          "func": thru,
          "args": [interceptor],
          "thisArg": undefined$1
        });
        return new LodashWrapper(value2, this.__chain__).thru(function(array) {
          if (length && !array.length) {
            array.push(undefined$1);
          }
          return array;
        });
      });
      function wrapperChain() {
        return chain(this);
      }
      function wrapperCommit() {
        return new LodashWrapper(this.value(), this.__chain__);
      }
      function wrapperNext() {
        if (this.__values__ === undefined$1) {
          this.__values__ = toArray2(this.value());
        }
        var done = this.__index__ >= this.__values__.length, value2 = done ? undefined$1 : this.__values__[this.__index__++];
        return { "done": done, "value": value2 };
      }
      function wrapperToIterator() {
        return this;
      }
      function wrapperPlant(value2) {
        var result2, parent2 = this;
        while (parent2 instanceof baseLodash) {
          var clone2 = wrapperClone(parent2);
          clone2.__index__ = 0;
          clone2.__values__ = undefined$1;
          if (result2) {
            previous.__wrapped__ = clone2;
          } else {
            result2 = clone2;
          }
          var previous = clone2;
          parent2 = parent2.__wrapped__;
        }
        previous.__wrapped__ = value2;
        return result2;
      }
      function wrapperReverse() {
        var value2 = this.__wrapped__;
        if (value2 instanceof LazyWrapper) {
          var wrapped = value2;
          if (this.__actions__.length) {
            wrapped = new LazyWrapper(this);
          }
          wrapped = wrapped.reverse();
          wrapped.__actions__.push({
            "func": thru,
            "args": [reverse],
            "thisArg": undefined$1
          });
          return new LodashWrapper(wrapped, this.__chain__);
        }
        return this.thru(reverse);
      }
      function wrapperValue() {
        return baseWrapperValue(this.__wrapped__, this.__actions__);
      }
      var countBy = createAggregator(function(result2, value2, key) {
        if (hasOwnProperty2.call(result2, key)) {
          ++result2[key];
        } else {
          baseAssignValue(result2, key, 1);
        }
      });
      function every(collection, predicate, guard) {
        var func = isArray2(collection) ? arrayEvery : baseEvery;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined$1;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      function filter(collection, predicate) {
        var func = isArray2(collection) ? arrayFilter : baseFilter;
        return func(collection, getIteratee(predicate, 3));
      }
      var find = createFind(findIndex);
      var findLast = createFind(findLastIndex);
      function flatMap(collection, iteratee2) {
        return baseFlatten(map2(collection, iteratee2), 1);
      }
      function flatMapDeep(collection, iteratee2) {
        return baseFlatten(map2(collection, iteratee2), INFINITY);
      }
      function flatMapDepth(collection, iteratee2, depth) {
        depth = depth === undefined$1 ? 1 : toInteger2(depth);
        return baseFlatten(map2(collection, iteratee2), depth);
      }
      function forEach2(collection, iteratee2) {
        var func = isArray2(collection) ? arrayEach : baseEach;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function forEachRight(collection, iteratee2) {
        var func = isArray2(collection) ? arrayEachRight : baseEachRight;
        return func(collection, getIteratee(iteratee2, 3));
      }
      var groupBy = createAggregator(function(result2, value2, key) {
        if (hasOwnProperty2.call(result2, key)) {
          result2[key].push(value2);
        } else {
          baseAssignValue(result2, key, [value2]);
        }
      });
      function includes(collection, value2, fromIndex, guard) {
        collection = isArrayLike(collection) ? collection : values(collection);
        fromIndex = fromIndex && !guard ? toInteger2(fromIndex) : 0;
        var length = collection.length;
        if (fromIndex < 0) {
          fromIndex = nativeMax(length + fromIndex, 0);
        }
        return isString2(collection) ? fromIndex <= length && collection.indexOf(value2, fromIndex) > -1 : !!length && baseIndexOf(collection, value2, fromIndex) > -1;
      }
      var invokeMap = baseRest(function(collection, path, args) {
        var index = -1, isFunc = typeof path == "function", result2 = isArrayLike(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value2) {
          result2[++index] = isFunc ? apply2(path, value2, args) : baseInvoke(value2, path, args);
        });
        return result2;
      });
      var keyBy = createAggregator(function(result2, value2, key) {
        baseAssignValue(result2, key, value2);
      });
      function map2(collection, iteratee2) {
        var func = isArray2(collection) ? arrayMap : baseMap;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function orderBy(collection, iteratees, orders, guard) {
        if (collection == null) {
          return [];
        }
        if (!isArray2(iteratees)) {
          iteratees = iteratees == null ? [] : [iteratees];
        }
        orders = guard ? undefined$1 : orders;
        if (!isArray2(orders)) {
          orders = orders == null ? [] : [orders];
        }
        return baseOrderBy(collection, iteratees, orders);
      }
      var partition = createAggregator(function(result2, value2, key) {
        result2[key ? 0 : 1].push(value2);
      }, function() {
        return [[], []];
      });
      function reduce(collection, iteratee2, accumulator) {
        var func = isArray2(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEach);
      }
      function reduceRight(collection, iteratee2, accumulator) {
        var func = isArray2(collection) ? arrayReduceRight : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEachRight);
      }
      function reject(collection, predicate) {
        var func = isArray2(collection) ? arrayFilter : baseFilter;
        return func(collection, negate(getIteratee(predicate, 3)));
      }
      function sample(collection) {
        var func = isArray2(collection) ? arraySample : baseSample;
        return func(collection);
      }
      function sampleSize(collection, n2, guard) {
        if (guard ? isIterateeCall(collection, n2, guard) : n2 === undefined$1) {
          n2 = 1;
        } else {
          n2 = toInteger2(n2);
        }
        var func = isArray2(collection) ? arraySampleSize : baseSampleSize;
        return func(collection, n2);
      }
      function shuffle(collection) {
        var func = isArray2(collection) ? arrayShuffle : baseShuffle;
        return func(collection);
      }
      function size(collection) {
        if (collection == null) {
          return 0;
        }
        if (isArrayLike(collection)) {
          return isString2(collection) ? stringSize(collection) : collection.length;
        }
        var tag = getTag(collection);
        if (tag == mapTag || tag == setTag) {
          return collection.size;
        }
        return baseKeys(collection).length;
      }
      function some(collection, predicate, guard) {
        var func = isArray2(collection) ? arraySome : baseSome;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined$1;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      var sortBy = baseRest(function(collection, iteratees) {
        if (collection == null) {
          return [];
        }
        var length = iteratees.length;
        if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
          iteratees = [];
        } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
          iteratees = [iteratees[0]];
        }
        return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
      });
      var now = ctxNow || function() {
        return root.Date.now();
      };
      function after(n2, func) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        n2 = toInteger2(n2);
        return function() {
          if (--n2 < 1) {
            return func.apply(this, arguments);
          }
        };
      }
      function ary(func, n2, guard) {
        n2 = guard ? undefined$1 : n2;
        n2 = func && n2 == null ? func.length : n2;
        return createWrap(func, WRAP_ARY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, n2);
      }
      function before(n2, func) {
        var result2;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        n2 = toInteger2(n2);
        return function() {
          if (--n2 > 0) {
            result2 = func.apply(this, arguments);
          }
          if (n2 <= 1) {
            func = undefined$1;
          }
          return result2;
        };
      }
      var bind2 = baseRest(function(func, thisArg, partials) {
        var bitmask = WRAP_BIND_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bind2));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(func, bitmask, thisArg, partials, holders);
      });
      var bindKey = baseRest(function(object, key, partials) {
        var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bindKey));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(key, bitmask, object, partials, holders);
      });
      function curry(func, arity, guard) {
        arity = guard ? undefined$1 : arity;
        var result2 = createWrap(func, WRAP_CURRY_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
        result2.placeholder = curry.placeholder;
        return result2;
      }
      function curryRight(func, arity, guard) {
        arity = guard ? undefined$1 : arity;
        var result2 = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined$1, undefined$1, undefined$1, undefined$1, undefined$1, arity);
        result2.placeholder = curryRight.placeholder;
        return result2;
      }
      function debounce(func, wait, options) {
        var lastArgs, lastThis, maxWait, result2, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        wait = toNumber(wait) || 0;
        if (isObject2(options)) {
          leading = !!options.leading;
          maxing = "maxWait" in options;
          maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        function invokeFunc(time) {
          var args = lastArgs, thisArg = lastThis;
          lastArgs = lastThis = undefined$1;
          lastInvokeTime = time;
          result2 = func.apply(thisArg, args);
          return result2;
        }
        function leadingEdge(time) {
          lastInvokeTime = time;
          timerId = setTimeout2(timerExpired, wait);
          return leading ? invokeFunc(time) : result2;
        }
        function remainingWait(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
          return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
        }
        function shouldInvoke(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
          return lastCallTime === undefined$1 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
        }
        function timerExpired() {
          var time = now();
          if (shouldInvoke(time)) {
            return trailingEdge(time);
          }
          timerId = setTimeout2(timerExpired, remainingWait(time));
        }
        function trailingEdge(time) {
          timerId = undefined$1;
          if (trailing && lastArgs) {
            return invokeFunc(time);
          }
          lastArgs = lastThis = undefined$1;
          return result2;
        }
        function cancel() {
          if (timerId !== undefined$1) {
            clearTimeout2(timerId);
          }
          lastInvokeTime = 0;
          lastArgs = lastCallTime = lastThis = timerId = undefined$1;
        }
        function flush() {
          return timerId === undefined$1 ? result2 : trailingEdge(now());
        }
        function debounced() {
          var time = now(), isInvoking = shouldInvoke(time);
          lastArgs = arguments;
          lastThis = this;
          lastCallTime = time;
          if (isInvoking) {
            if (timerId === undefined$1) {
              return leadingEdge(lastCallTime);
            }
            if (maxing) {
              clearTimeout2(timerId);
              timerId = setTimeout2(timerExpired, wait);
              return invokeFunc(lastCallTime);
            }
          }
          if (timerId === undefined$1) {
            timerId = setTimeout2(timerExpired, wait);
          }
          return result2;
        }
        debounced.cancel = cancel;
        debounced.flush = flush;
        return debounced;
      }
      var defer = baseRest(function(func, args) {
        return baseDelay(func, 1, args);
      });
      var delay = baseRest(function(func, wait, args) {
        return baseDelay(func, toNumber(wait) || 0, args);
      });
      function flip(func) {
        return createWrap(func, WRAP_FLIP_FLAG);
      }
      function memoize2(func, resolver) {
        if (typeof func != "function" || resolver != null && typeof resolver != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        var memoized = function() {
          var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
          if (cache.has(key)) {
            return cache.get(key);
          }
          var result2 = func.apply(this, args);
          memoized.cache = cache.set(key, result2) || cache;
          return result2;
        };
        memoized.cache = new (memoize2.Cache || MapCache)();
        return memoized;
      }
      memoize2.Cache = MapCache;
      function negate(predicate) {
        if (typeof predicate != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return !predicate.call(this);
            case 1:
              return !predicate.call(this, args[0]);
            case 2:
              return !predicate.call(this, args[0], args[1]);
            case 3:
              return !predicate.call(this, args[0], args[1], args[2]);
          }
          return !predicate.apply(this, args);
        };
      }
      function once(func) {
        return before(2, func);
      }
      var overArgs = castRest(function(func, transforms) {
        transforms = transforms.length == 1 && isArray2(transforms[0]) ? arrayMap(transforms[0], baseUnary(getIteratee())) : arrayMap(baseFlatten(transforms, 1), baseUnary(getIteratee()));
        var funcsLength = transforms.length;
        return baseRest(function(args) {
          var index = -1, length = nativeMin(args.length, funcsLength);
          while (++index < length) {
            args[index] = transforms[index].call(this, args[index]);
          }
          return apply2(func, this, args);
        });
      });
      var partial = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partial));
        return createWrap(func, WRAP_PARTIAL_FLAG, undefined$1, partials, holders);
      });
      var partialRight = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partialRight));
        return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined$1, partials, holders);
      });
      var rearg = flatRest(function(func, indexes) {
        return createWrap(func, WRAP_REARG_FLAG, undefined$1, undefined$1, undefined$1, indexes);
      });
      function rest(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        start = start === undefined$1 ? start : toInteger2(start);
        return baseRest(func, start);
      }
      function spread(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        start = start == null ? 0 : nativeMax(toInteger2(start), 0);
        return baseRest(function(args) {
          var array = args[start], otherArgs = castSlice(args, 0, start);
          if (array) {
            arrayPush(otherArgs, array);
          }
          return apply2(func, this, otherArgs);
        });
      }
      function throttle(func, wait, options) {
        var leading = true, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        if (isObject2(options)) {
          leading = "leading" in options ? !!options.leading : leading;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        return debounce(func, wait, {
          "leading": leading,
          "maxWait": wait,
          "trailing": trailing
        });
      }
      function unary(func) {
        return ary(func, 1);
      }
      function wrap(value2, wrapper) {
        return partial(castFunction(wrapper), value2);
      }
      function castArray() {
        if (!arguments.length) {
          return [];
        }
        var value2 = arguments[0];
        return isArray2(value2) ? value2 : [value2];
      }
      function clone(value2) {
        return baseClone(value2, CLONE_SYMBOLS_FLAG);
      }
      function cloneWith(value2, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseClone(value2, CLONE_SYMBOLS_FLAG, customizer);
      }
      function cloneDeep(value2) {
        return baseClone(value2, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
      }
      function cloneDeepWith(value2, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseClone(value2, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
      }
      function conformsTo(object, source) {
        return source == null || baseConformsTo(object, source, keys2(source));
      }
      function eq(value2, other) {
        return value2 === other || value2 !== value2 && other !== other;
      }
      var gt = createRelationalOperation(baseGt);
      var gte = createRelationalOperation(function(value2, other) {
        return value2 >= other;
      });
      var isArguments2 = baseIsArguments(/* @__PURE__ */ function() {
        return arguments;
      }()) ? baseIsArguments : function(value2) {
        return isObjectLike(value2) && hasOwnProperty2.call(value2, "callee") && !propertyIsEnumerable.call(value2, "callee");
      };
      var isArray2 = Array2.isArray;
      var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;
      function isArrayLike(value2) {
        return value2 != null && isLength(value2.length) && !isFunction2(value2);
      }
      function isArrayLikeObject(value2) {
        return isObjectLike(value2) && isArrayLike(value2);
      }
      function isBoolean(value2) {
        return value2 === true || value2 === false || isObjectLike(value2) && baseGetTag(value2) == boolTag;
      }
      var isBuffer = nativeIsBuffer || stubFalse;
      var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
      function isElement(value2) {
        return isObjectLike(value2) && value2.nodeType === 1 && !isPlainObject(value2);
      }
      function isEmpty(value2) {
        if (value2 == null) {
          return true;
        }
        if (isArrayLike(value2) && (isArray2(value2) || typeof value2 == "string" || typeof value2.splice == "function" || isBuffer(value2) || isTypedArray(value2) || isArguments2(value2))) {
          return !value2.length;
        }
        var tag = getTag(value2);
        if (tag == mapTag || tag == setTag) {
          return !value2.size;
        }
        if (isPrototype2(value2)) {
          return !baseKeys(value2).length;
        }
        for (var key in value2) {
          if (hasOwnProperty2.call(value2, key)) {
            return false;
          }
        }
        return true;
      }
      function isEqual(value2, other) {
        return baseIsEqual(value2, other);
      }
      function isEqualWith(value2, other, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        var result2 = customizer ? customizer(value2, other) : undefined$1;
        return result2 === undefined$1 ? baseIsEqual(value2, other, undefined$1, customizer) : !!result2;
      }
      function isError(value2) {
        if (!isObjectLike(value2)) {
          return false;
        }
        var tag = baseGetTag(value2);
        return tag == errorTag || tag == domExcTag || typeof value2.message == "string" && typeof value2.name == "string" && !isPlainObject(value2);
      }
      function isFinite2(value2) {
        return typeof value2 == "number" && nativeIsFinite(value2);
      }
      function isFunction2(value2) {
        if (!isObject2(value2)) {
          return false;
        }
        var tag = baseGetTag(value2);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
      }
      function isInteger(value2) {
        return typeof value2 == "number" && value2 == toInteger2(value2);
      }
      function isLength(value2) {
        return typeof value2 == "number" && value2 > -1 && value2 % 1 == 0 && value2 <= MAX_SAFE_INTEGER;
      }
      function isObject2(value2) {
        var type = typeof value2;
        return value2 != null && (type == "object" || type == "function");
      }
      function isObjectLike(value2) {
        return value2 != null && typeof value2 == "object";
      }
      var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
      function isMatch(object, source) {
        return object === source || baseIsMatch(object, source, getMatchData(source));
      }
      function isMatchWith(object, source, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return baseIsMatch(object, source, getMatchData(source), customizer);
      }
      function isNaN2(value2) {
        return isNumber(value2) && value2 != +value2;
      }
      function isNative(value2) {
        if (isMaskable(value2)) {
          throw new Error2(CORE_ERROR_TEXT);
        }
        return baseIsNative(value2);
      }
      function isNull(value2) {
        return value2 === null;
      }
      function isNil(value2) {
        return value2 == null;
      }
      function isNumber(value2) {
        return typeof value2 == "number" || isObjectLike(value2) && baseGetTag(value2) == numberTag;
      }
      function isPlainObject(value2) {
        if (!isObjectLike(value2) || baseGetTag(value2) != objectTag) {
          return false;
        }
        var proto = getPrototype(value2);
        if (proto === null) {
          return true;
        }
        var Ctor = hasOwnProperty2.call(proto, "constructor") && proto.constructor;
        return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
      }
      var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;
      function isSafeInteger(value2) {
        return isInteger(value2) && value2 >= -9007199254740991 && value2 <= MAX_SAFE_INTEGER;
      }
      var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
      function isString2(value2) {
        return typeof value2 == "string" || !isArray2(value2) && isObjectLike(value2) && baseGetTag(value2) == stringTag;
      }
      function isSymbol2(value2) {
        return typeof value2 == "symbol" || isObjectLike(value2) && baseGetTag(value2) == symbolTag;
      }
      var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
      function isUndefined(value2) {
        return value2 === undefined$1;
      }
      function isWeakMap(value2) {
        return isObjectLike(value2) && getTag(value2) == weakMapTag;
      }
      function isWeakSet(value2) {
        return isObjectLike(value2) && baseGetTag(value2) == weakSetTag;
      }
      var lt = createRelationalOperation(baseLt);
      var lte = createRelationalOperation(function(value2, other) {
        return value2 <= other;
      });
      function toArray2(value2) {
        if (!value2) {
          return [];
        }
        if (isArrayLike(value2)) {
          return isString2(value2) ? stringToArray(value2) : copyArray(value2);
        }
        if (symIterator && value2[symIterator]) {
          return iteratorToArray(value2[symIterator]());
        }
        var tag = getTag(value2), func = tag == mapTag ? mapToArray : tag == setTag ? setToArray : values;
        return func(value2);
      }
      function toFinite(value2) {
        if (!value2) {
          return value2 === 0 ? value2 : 0;
        }
        value2 = toNumber(value2);
        if (value2 === INFINITY || value2 === -Infinity) {
          var sign2 = value2 < 0 ? -1 : 1;
          return sign2 * MAX_INTEGER;
        }
        return value2 === value2 ? value2 : 0;
      }
      function toInteger2(value2) {
        var result2 = toFinite(value2), remainder = result2 % 1;
        return result2 === result2 ? remainder ? result2 - remainder : result2 : 0;
      }
      function toLength(value2) {
        return value2 ? baseClamp(toInteger2(value2), 0, MAX_ARRAY_LENGTH) : 0;
      }
      function toNumber(value2) {
        if (typeof value2 == "number") {
          return value2;
        }
        if (isSymbol2(value2)) {
          return NAN;
        }
        if (isObject2(value2)) {
          var other = typeof value2.valueOf == "function" ? value2.valueOf() : value2;
          value2 = isObject2(other) ? other + "" : other;
        }
        if (typeof value2 != "string") {
          return value2 === 0 ? value2 : +value2;
        }
        value2 = baseTrim(value2);
        var isBinary = reIsBinary.test(value2);
        return isBinary || reIsOctal.test(value2) ? freeParseInt(value2.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value2) ? NAN : +value2;
      }
      function toPlainObject(value2) {
        return copyObject(value2, keysIn(value2));
      }
      function toSafeInteger(value2) {
        return value2 ? baseClamp(toInteger2(value2), -9007199254740991, MAX_SAFE_INTEGER) : value2 === 0 ? value2 : 0;
      }
      function toString(value2) {
        return value2 == null ? "" : baseToString(value2);
      }
      var assign2 = createAssigner(function(object, source) {
        if (isPrototype2(source) || isArrayLike(source)) {
          copyObject(source, keys2(source), object);
          return;
        }
        for (var key in source) {
          if (hasOwnProperty2.call(source, key)) {
            assignValue(object, key, source[key]);
          }
        }
      });
      var assignIn = createAssigner(function(object, source) {
        copyObject(source, keysIn(source), object);
      });
      var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
        copyObject(source, keysIn(source), object, customizer);
      });
      var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
        copyObject(source, keys2(source), object, customizer);
      });
      var at = flatRest(baseAt);
      function create2(prototype, properties) {
        var result2 = baseCreate(prototype);
        return properties == null ? result2 : baseAssign(result2, properties);
      }
      var defaults = baseRest(function(object, sources) {
        object = Object2(object);
        var index = -1;
        var length = sources.length;
        var guard = length > 2 ? sources[2] : undefined$1;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          var props = keysIn(source);
          var propsIndex = -1;
          var propsLength = props.length;
          while (++propsIndex < propsLength) {
            var key = props[propsIndex];
            var value2 = object[key];
            if (value2 === undefined$1 || eq(value2, objectProto[key]) && !hasOwnProperty2.call(object, key)) {
              object[key] = source[key];
            }
          }
        }
        return object;
      });
      var defaultsDeep = baseRest(function(args) {
        args.push(undefined$1, customDefaultsMerge);
        return apply2(mergeWith, undefined$1, args);
      });
      function findKey(object, predicate) {
        return baseFindKey(object, getIteratee(predicate, 3), baseForOwn);
      }
      function findLastKey(object, predicate) {
        return baseFindKey(object, getIteratee(predicate, 3), baseForOwnRight);
      }
      function forIn(object, iteratee2) {
        return object == null ? object : baseFor(object, getIteratee(iteratee2, 3), keysIn);
      }
      function forInRight(object, iteratee2) {
        return object == null ? object : baseForRight(object, getIteratee(iteratee2, 3), keysIn);
      }
      function forOwn(object, iteratee2) {
        return object && baseForOwn(object, getIteratee(iteratee2, 3));
      }
      function forOwnRight(object, iteratee2) {
        return object && baseForOwnRight(object, getIteratee(iteratee2, 3));
      }
      function functions(object) {
        return object == null ? [] : baseFunctions(object, keys2(object));
      }
      function functionsIn(object) {
        return object == null ? [] : baseFunctions(object, keysIn(object));
      }
      function get2(object, path, defaultValue) {
        var result2 = object == null ? undefined$1 : baseGet(object, path);
        return result2 === undefined$1 ? defaultValue : result2;
      }
      function has(object, path) {
        return object != null && hasPath(object, path, baseHas);
      }
      function hasIn(object, path) {
        return object != null && hasPath(object, path, baseHasIn);
      }
      var invert = createInverter(function(result2, value2, key) {
        if (value2 != null && typeof value2.toString != "function") {
          value2 = nativeObjectToString.call(value2);
        }
        result2[value2] = key;
      }, constant(identity));
      var invertBy = createInverter(function(result2, value2, key) {
        if (value2 != null && typeof value2.toString != "function") {
          value2 = nativeObjectToString.call(value2);
        }
        if (hasOwnProperty2.call(result2, value2)) {
          result2[value2].push(key);
        } else {
          result2[value2] = [key];
        }
      }, getIteratee);
      var invoke = baseRest(baseInvoke);
      function keys2(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
      }
      function keysIn(object) {
        return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
      }
      function mapKeys(object, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn(object, function(value2, key, object2) {
          baseAssignValue(result2, iteratee2(value2, key, object2), value2);
        });
        return result2;
      }
      function mapValues(object, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn(object, function(value2, key, object2) {
          baseAssignValue(result2, key, iteratee2(value2, key, object2));
        });
        return result2;
      }
      var merge = createAssigner(function(object, source, srcIndex) {
        baseMerge(object, source, srcIndex);
      });
      var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
        baseMerge(object, source, srcIndex, customizer);
      });
      var omit = flatRest(function(object, paths) {
        var result2 = {};
        if (object == null) {
          return result2;
        }
        var isDeep = false;
        paths = arrayMap(paths, function(path) {
          path = castPath(path, object);
          isDeep || (isDeep = path.length > 1);
          return path;
        });
        copyObject(object, getAllKeysIn(object), result2);
        if (isDeep) {
          result2 = baseClone(result2, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
        }
        var length = paths.length;
        while (length--) {
          baseUnset(result2, paths[length]);
        }
        return result2;
      });
      function omitBy(object, predicate) {
        return pickBy(object, negate(getIteratee(predicate)));
      }
      var pick = flatRest(function(object, paths) {
        return object == null ? {} : basePick(object, paths);
      });
      function pickBy(object, predicate) {
        if (object == null) {
          return {};
        }
        var props = arrayMap(getAllKeysIn(object), function(prop) {
          return [prop];
        });
        predicate = getIteratee(predicate);
        return basePickBy(object, props, function(value2, path) {
          return predicate(value2, path[0]);
        });
      }
      function result(object, path, defaultValue) {
        path = castPath(path, object);
        var index = -1, length = path.length;
        if (!length) {
          length = 1;
          object = undefined$1;
        }
        while (++index < length) {
          var value2 = object == null ? undefined$1 : object[toKey(path[index])];
          if (value2 === undefined$1) {
            index = length;
            value2 = defaultValue;
          }
          object = isFunction2(value2) ? value2.call(object) : value2;
        }
        return object;
      }
      function set(object, path, value2) {
        return object == null ? object : baseSet(object, path, value2);
      }
      function setWith(object, path, value2, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return object == null ? object : baseSet(object, path, value2, customizer);
      }
      var toPairs = createToPairs(keys2);
      var toPairsIn = createToPairs(keysIn);
      function transform(object, iteratee2, accumulator) {
        var isArr = isArray2(object), isArrLike = isArr || isBuffer(object) || isTypedArray(object);
        iteratee2 = getIteratee(iteratee2, 4);
        if (accumulator == null) {
          var Ctor = object && object.constructor;
          if (isArrLike) {
            accumulator = isArr ? new Ctor() : [];
          } else if (isObject2(object)) {
            accumulator = isFunction2(Ctor) ? baseCreate(getPrototype(object)) : {};
          } else {
            accumulator = {};
          }
        }
        (isArrLike ? arrayEach : baseForOwn)(object, function(value2, index, object2) {
          return iteratee2(accumulator, value2, index, object2);
        });
        return accumulator;
      }
      function unset(object, path) {
        return object == null ? true : baseUnset(object, path);
      }
      function update(object, path, updater) {
        return object == null ? object : baseUpdate(object, path, castFunction(updater));
      }
      function updateWith(object, path, updater, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined$1;
        return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
      }
      function values(object) {
        return object == null ? [] : baseValues(object, keys2(object));
      }
      function valuesIn(object) {
        return object == null ? [] : baseValues(object, keysIn(object));
      }
      function clamp(number, lower, upper) {
        if (upper === undefined$1) {
          upper = lower;
          lower = undefined$1;
        }
        if (upper !== undefined$1) {
          upper = toNumber(upper);
          upper = upper === upper ? upper : 0;
        }
        if (lower !== undefined$1) {
          lower = toNumber(lower);
          lower = lower === lower ? lower : 0;
        }
        return baseClamp(toNumber(number), lower, upper);
      }
      function inRange(number, start, end) {
        start = toFinite(start);
        if (end === undefined$1) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        number = toNumber(number);
        return baseInRange(number, start, end);
      }
      function random(lower, upper, floating) {
        if (floating && typeof floating != "boolean" && isIterateeCall(lower, upper, floating)) {
          upper = floating = undefined$1;
        }
        if (floating === undefined$1) {
          if (typeof upper == "boolean") {
            floating = upper;
            upper = undefined$1;
          } else if (typeof lower == "boolean") {
            floating = lower;
            lower = undefined$1;
          }
        }
        if (lower === undefined$1 && upper === undefined$1) {
          lower = 0;
          upper = 1;
        } else {
          lower = toFinite(lower);
          if (upper === undefined$1) {
            upper = lower;
            lower = 0;
          } else {
            upper = toFinite(upper);
          }
        }
        if (lower > upper) {
          var temp = lower;
          lower = upper;
          upper = temp;
        }
        if (floating || lower % 1 || upper % 1) {
          var rand = nativeRandom();
          return nativeMin(lower + rand * (upper - lower + freeParseFloat("1e-" + ((rand + "").length - 1))), upper);
        }
        return baseRandom(lower, upper);
      }
      var camelCase = createCompounder(function(result2, word, index) {
        word = word.toLowerCase();
        return result2 + (index ? capitalize(word) : word);
      });
      function capitalize(string) {
        return upperFirst(toString(string).toLowerCase());
      }
      function deburr(string) {
        string = toString(string);
        return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
      }
      function endsWith(string, target, position) {
        string = toString(string);
        target = baseToString(target);
        var length = string.length;
        position = position === undefined$1 ? length : baseClamp(toInteger2(position), 0, length);
        var end = position;
        position -= target.length;
        return position >= 0 && string.slice(position, end) == target;
      }
      function escape(string) {
        string = toString(string);
        return string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
      }
      function escapeRegExp(string) {
        string = toString(string);
        return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
      }
      var kebabCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? "-" : "") + word.toLowerCase();
      });
      var lowerCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + word.toLowerCase();
      });
      var lowerFirst = createCaseFirst("toLowerCase");
      function pad(string, length, chars) {
        string = toString(string);
        length = toInteger2(length);
        var strLength = length ? stringSize(string) : 0;
        if (!length || strLength >= length) {
          return string;
        }
        var mid = (length - strLength) / 2;
        return createPadding(nativeFloor(mid), chars) + string + createPadding(nativeCeil(mid), chars);
      }
      function padEnd(string, length, chars) {
        string = toString(string);
        length = toInteger2(length);
        var strLength = length ? stringSize(string) : 0;
        return length && strLength < length ? string + createPadding(length - strLength, chars) : string;
      }
      function padStart(string, length, chars) {
        string = toString(string);
        length = toInteger2(length);
        var strLength = length ? stringSize(string) : 0;
        return length && strLength < length ? createPadding(length - strLength, chars) + string : string;
      }
      function parseInt2(string, radix, guard) {
        if (guard || radix == null) {
          radix = 0;
        } else if (radix) {
          radix = +radix;
        }
        return nativeParseInt(toString(string).replace(reTrimStart, ""), radix || 0);
      }
      function repeat(string, n2, guard) {
        if (guard ? isIterateeCall(string, n2, guard) : n2 === undefined$1) {
          n2 = 1;
        } else {
          n2 = toInteger2(n2);
        }
        return baseRepeat(toString(string), n2);
      }
      function replace() {
        var args = arguments, string = toString(args[0]);
        return args.length < 3 ? string : string.replace(args[1], args[2]);
      }
      var snakeCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? "_" : "") + word.toLowerCase();
      });
      function split(string, separator, limit) {
        if (limit && typeof limit != "number" && isIterateeCall(string, separator, limit)) {
          separator = limit = undefined$1;
        }
        limit = limit === undefined$1 ? MAX_ARRAY_LENGTH : limit >>> 0;
        if (!limit) {
          return [];
        }
        string = toString(string);
        if (string && (typeof separator == "string" || separator != null && !isRegExp(separator))) {
          separator = baseToString(separator);
          if (!separator && hasUnicode(string)) {
            return castSlice(stringToArray(string), 0, limit);
          }
        }
        return string.split(separator, limit);
      }
      var startCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + upperFirst(word);
      });
      function startsWith(string, target, position) {
        string = toString(string);
        position = position == null ? 0 : baseClamp(toInteger2(position), 0, string.length);
        target = baseToString(target);
        return string.slice(position, position + target.length) == target;
      }
      function template(string, options, guard) {
        var settings = lodash2.templateSettings;
        if (guard && isIterateeCall(string, options, guard)) {
          options = undefined$1;
        }
        string = toString(string);
        options = assignInWith({}, options, settings, customDefaultsAssignIn);
        var imports = assignInWith({}, options.imports, settings.imports, customDefaultsAssignIn), importsKeys = keys2(imports), importsValues = baseValues(imports, importsKeys);
        var isEscaping, isEvaluating, index = 0, interpolate = options.interpolate || reNoMatch, source = "__p += '";
        var reDelimiters = RegExp2(
          (options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$",
          "g"
        );
        var sourceURL = "//# sourceURL=" + (hasOwnProperty2.call(options, "sourceURL") ? (options.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++templateCounter + "]") + "\n";
        string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
          interpolateValue || (interpolateValue = esTemplateValue);
          source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
          if (escapeValue) {
            isEscaping = true;
            source += "' +\n__e(" + escapeValue + ") +\n'";
          }
          if (evaluateValue) {
            isEvaluating = true;
            source += "';\n" + evaluateValue + ";\n__p += '";
          }
          if (interpolateValue) {
            source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
          }
          index = offset + match.length;
          return match;
        });
        source += "';\n";
        var variable = hasOwnProperty2.call(options, "variable") && options.variable;
        if (!variable) {
          source = "with (obj) {\n" + source + "\n}\n";
        } else if (reForbiddenIdentifierChars.test(variable)) {
          throw new Error2(INVALID_TEMPL_VAR_ERROR_TEXT);
        }
        source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
        source = "function(" + (variable || "obj") + ") {\n" + (variable ? "" : "obj || (obj = {});\n") + "var __t, __p = ''" + (isEscaping ? ", __e = _.escape" : "") + (isEvaluating ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + source + "return __p\n}";
        var result2 = attempt(function() {
          return Function2(importsKeys, sourceURL + "return " + source).apply(undefined$1, importsValues);
        });
        result2.source = source;
        if (isError(result2)) {
          throw result2;
        }
        return result2;
      }
      function toLower(value2) {
        return toString(value2).toLowerCase();
      }
      function toUpper(value2) {
        return toString(value2).toUpperCase();
      }
      function trim(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined$1)) {
          return baseTrim(string);
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), chrSymbols = stringToArray(chars), start = charsStartIndex(strSymbols, chrSymbols), end = charsEndIndex(strSymbols, chrSymbols) + 1;
        return castSlice(strSymbols, start, end).join("");
      }
      function trimEnd(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined$1)) {
          return string.slice(0, trimmedEndIndex(string) + 1);
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), end = charsEndIndex(strSymbols, stringToArray(chars)) + 1;
        return castSlice(strSymbols, 0, end).join("");
      }
      function trimStart(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined$1)) {
          return string.replace(reTrimStart, "");
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), start = charsStartIndex(strSymbols, stringToArray(chars));
        return castSlice(strSymbols, start).join("");
      }
      function truncate(string, options) {
        var length = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
        if (isObject2(options)) {
          var separator = "separator" in options ? options.separator : separator;
          length = "length" in options ? toInteger2(options.length) : length;
          omission = "omission" in options ? baseToString(options.omission) : omission;
        }
        string = toString(string);
        var strLength = string.length;
        if (hasUnicode(string)) {
          var strSymbols = stringToArray(string);
          strLength = strSymbols.length;
        }
        if (length >= strLength) {
          return string;
        }
        var end = length - stringSize(omission);
        if (end < 1) {
          return omission;
        }
        var result2 = strSymbols ? castSlice(strSymbols, 0, end).join("") : string.slice(0, end);
        if (separator === undefined$1) {
          return result2 + omission;
        }
        if (strSymbols) {
          end += result2.length - end;
        }
        if (isRegExp(separator)) {
          if (string.slice(end).search(separator)) {
            var match, substring = result2;
            if (!separator.global) {
              separator = RegExp2(separator.source, toString(reFlags.exec(separator)) + "g");
            }
            separator.lastIndex = 0;
            while (match = separator.exec(substring)) {
              var newEnd = match.index;
            }
            result2 = result2.slice(0, newEnd === undefined$1 ? end : newEnd);
          }
        } else if (string.indexOf(baseToString(separator), end) != end) {
          var index = result2.lastIndexOf(separator);
          if (index > -1) {
            result2 = result2.slice(0, index);
          }
        }
        return result2 + omission;
      }
      function unescape(string) {
        string = toString(string);
        return string && reHasEscapedHtml.test(string) ? string.replace(reEscapedHtml, unescapeHtmlChar) : string;
      }
      var upperCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + word.toUpperCase();
      });
      var upperFirst = createCaseFirst("toUpperCase");
      function words(string, pattern, guard) {
        string = toString(string);
        pattern = guard ? undefined$1 : pattern;
        if (pattern === undefined$1) {
          return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
        }
        return string.match(pattern) || [];
      }
      var attempt = baseRest(function(func, args) {
        try {
          return apply2(func, undefined$1, args);
        } catch (e) {
          return isError(e) ? e : new Error2(e);
        }
      });
      var bindAll = flatRest(function(object, methodNames) {
        arrayEach(methodNames, function(key) {
          key = toKey(key);
          baseAssignValue(object, key, bind2(object[key], object));
        });
        return object;
      });
      function cond(pairs) {
        var length = pairs == null ? 0 : pairs.length, toIteratee = getIteratee();
        pairs = !length ? [] : arrayMap(pairs, function(pair) {
          if (typeof pair[1] != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          return [toIteratee(pair[0]), pair[1]];
        });
        return baseRest(function(args) {
          var index = -1;
          while (++index < length) {
            var pair = pairs[index];
            if (apply2(pair[0], this, args)) {
              return apply2(pair[1], this, args);
            }
          }
        });
      }
      function conforms(source) {
        return baseConforms(baseClone(source, CLONE_DEEP_FLAG));
      }
      function constant(value2) {
        return function() {
          return value2;
        };
      }
      function defaultTo(value2, defaultValue) {
        return value2 == null || value2 !== value2 ? defaultValue : value2;
      }
      var flow = createFlow();
      var flowRight = createFlow(true);
      function identity(value2) {
        return value2;
      }
      function iteratee(func) {
        return baseIteratee(typeof func == "function" ? func : baseClone(func, CLONE_DEEP_FLAG));
      }
      function matches(source) {
        return baseMatches(baseClone(source, CLONE_DEEP_FLAG));
      }
      function matchesProperty(path, srcValue) {
        return baseMatchesProperty(path, baseClone(srcValue, CLONE_DEEP_FLAG));
      }
      var method = baseRest(function(path, args) {
        return function(object) {
          return baseInvoke(object, path, args);
        };
      });
      var methodOf = baseRest(function(object, args) {
        return function(path) {
          return baseInvoke(object, path, args);
        };
      });
      function mixin2(object, source, options) {
        var props = keys2(source), methodNames = baseFunctions(source, props);
        if (options == null && !(isObject2(source) && (methodNames.length || !props.length))) {
          options = source;
          source = object;
          object = this;
          methodNames = baseFunctions(source, keys2(source));
        }
        var chain2 = !(isObject2(options) && "chain" in options) || !!options.chain, isFunc = isFunction2(object);
        arrayEach(methodNames, function(methodName) {
          var func = source[methodName];
          object[methodName] = func;
          if (isFunc) {
            object.prototype[methodName] = function() {
              var chainAll = this.__chain__;
              if (chain2 || chainAll) {
                var result2 = object(this.__wrapped__), actions = result2.__actions__ = copyArray(this.__actions__);
                actions.push({ "func": func, "args": arguments, "thisArg": object });
                result2.__chain__ = chainAll;
                return result2;
              }
              return func.apply(object, arrayPush([this.value()], arguments));
            };
          }
        });
        return object;
      }
      function noConflict() {
        if (root._ === this) {
          root._ = oldDash;
        }
        return this;
      }
      function noop2() {
      }
      function nthArg(n2) {
        n2 = toInteger2(n2);
        return baseRest(function(args) {
          return baseNth(args, n2);
        });
      }
      var over = createOver(arrayMap);
      var overEvery = createOver(arrayEvery);
      var overSome = createOver(arraySome);
      function property(path) {
        return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
      }
      function propertyOf(object) {
        return function(path) {
          return object == null ? undefined$1 : baseGet(object, path);
        };
      }
      var range = createRange();
      var rangeRight = createRange(true);
      function stubArray() {
        return [];
      }
      function stubFalse() {
        return false;
      }
      function stubObject() {
        return {};
      }
      function stubString() {
        return "";
      }
      function stubTrue() {
        return true;
      }
      function times(n2, iteratee2) {
        n2 = toInteger2(n2);
        if (n2 < 1 || n2 > MAX_SAFE_INTEGER) {
          return [];
        }
        var index = MAX_ARRAY_LENGTH, length = nativeMin(n2, MAX_ARRAY_LENGTH);
        iteratee2 = getIteratee(iteratee2);
        n2 -= MAX_ARRAY_LENGTH;
        var result2 = baseTimes(length, iteratee2);
        while (++index < n2) {
          iteratee2(index);
        }
        return result2;
      }
      function toPath(value2) {
        if (isArray2(value2)) {
          return arrayMap(value2, toKey);
        }
        return isSymbol2(value2) ? [value2] : copyArray(stringToPath(toString(value2)));
      }
      function uniqueId(prefix) {
        var id = ++idCounter;
        return toString(prefix) + id;
      }
      var add = createMathOperation(function(augend, addend) {
        return augend + addend;
      }, 0);
      var ceil = createRound("ceil");
      var divide = createMathOperation(function(dividend, divisor) {
        return dividend / divisor;
      }, 1);
      var floor2 = createRound("floor");
      function max2(array) {
        return array && array.length ? baseExtremum(array, identity, baseGt) : undefined$1;
      }
      function maxBy(array, iteratee2) {
        return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseGt) : undefined$1;
      }
      function mean(array) {
        return baseMean(array, identity);
      }
      function meanBy(array, iteratee2) {
        return baseMean(array, getIteratee(iteratee2, 2));
      }
      function min(array) {
        return array && array.length ? baseExtremum(array, identity, baseLt) : undefined$1;
      }
      function minBy(array, iteratee2) {
        return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseLt) : undefined$1;
      }
      var multiply = createMathOperation(function(multiplier, multiplicand) {
        return multiplier * multiplicand;
      }, 1);
      var round = createRound("round");
      var subtract = createMathOperation(function(minuend, subtrahend) {
        return minuend - subtrahend;
      }, 0);
      function sum(array) {
        return array && array.length ? baseSum(array, identity) : 0;
      }
      function sumBy(array, iteratee2) {
        return array && array.length ? baseSum(array, getIteratee(iteratee2, 2)) : 0;
      }
      lodash2.after = after;
      lodash2.ary = ary;
      lodash2.assign = assign2;
      lodash2.assignIn = assignIn;
      lodash2.assignInWith = assignInWith;
      lodash2.assignWith = assignWith;
      lodash2.at = at;
      lodash2.before = before;
      lodash2.bind = bind2;
      lodash2.bindAll = bindAll;
      lodash2.bindKey = bindKey;
      lodash2.castArray = castArray;
      lodash2.chain = chain;
      lodash2.chunk = chunk;
      lodash2.compact = compact;
      lodash2.concat = concat;
      lodash2.cond = cond;
      lodash2.conforms = conforms;
      lodash2.constant = constant;
      lodash2.countBy = countBy;
      lodash2.create = create2;
      lodash2.curry = curry;
      lodash2.curryRight = curryRight;
      lodash2.debounce = debounce;
      lodash2.defaults = defaults;
      lodash2.defaultsDeep = defaultsDeep;
      lodash2.defer = defer;
      lodash2.delay = delay;
      lodash2.difference = difference;
      lodash2.differenceBy = differenceBy;
      lodash2.differenceWith = differenceWith;
      lodash2.drop = drop;
      lodash2.dropRight = dropRight;
      lodash2.dropRightWhile = dropRightWhile;
      lodash2.dropWhile = dropWhile;
      lodash2.fill = fill;
      lodash2.filter = filter;
      lodash2.flatMap = flatMap;
      lodash2.flatMapDeep = flatMapDeep;
      lodash2.flatMapDepth = flatMapDepth;
      lodash2.flatten = flatten;
      lodash2.flattenDeep = flattenDeep;
      lodash2.flattenDepth = flattenDepth;
      lodash2.flip = flip;
      lodash2.flow = flow;
      lodash2.flowRight = flowRight;
      lodash2.fromPairs = fromPairs;
      lodash2.functions = functions;
      lodash2.functionsIn = functionsIn;
      lodash2.groupBy = groupBy;
      lodash2.initial = initial;
      lodash2.intersection = intersection;
      lodash2.intersectionBy = intersectionBy;
      lodash2.intersectionWith = intersectionWith;
      lodash2.invert = invert;
      lodash2.invertBy = invertBy;
      lodash2.invokeMap = invokeMap;
      lodash2.iteratee = iteratee;
      lodash2.keyBy = keyBy;
      lodash2.keys = keys2;
      lodash2.keysIn = keysIn;
      lodash2.map = map2;
      lodash2.mapKeys = mapKeys;
      lodash2.mapValues = mapValues;
      lodash2.matches = matches;
      lodash2.matchesProperty = matchesProperty;
      lodash2.memoize = memoize2;
      lodash2.merge = merge;
      lodash2.mergeWith = mergeWith;
      lodash2.method = method;
      lodash2.methodOf = methodOf;
      lodash2.mixin = mixin2;
      lodash2.negate = negate;
      lodash2.nthArg = nthArg;
      lodash2.omit = omit;
      lodash2.omitBy = omitBy;
      lodash2.once = once;
      lodash2.orderBy = orderBy;
      lodash2.over = over;
      lodash2.overArgs = overArgs;
      lodash2.overEvery = overEvery;
      lodash2.overSome = overSome;
      lodash2.partial = partial;
      lodash2.partialRight = partialRight;
      lodash2.partition = partition;
      lodash2.pick = pick;
      lodash2.pickBy = pickBy;
      lodash2.property = property;
      lodash2.propertyOf = propertyOf;
      lodash2.pull = pull;
      lodash2.pullAll = pullAll;
      lodash2.pullAllBy = pullAllBy;
      lodash2.pullAllWith = pullAllWith;
      lodash2.pullAt = pullAt;
      lodash2.range = range;
      lodash2.rangeRight = rangeRight;
      lodash2.rearg = rearg;
      lodash2.reject = reject;
      lodash2.remove = remove;
      lodash2.rest = rest;
      lodash2.reverse = reverse;
      lodash2.sampleSize = sampleSize;
      lodash2.set = set;
      lodash2.setWith = setWith;
      lodash2.shuffle = shuffle;
      lodash2.slice = slice2;
      lodash2.sortBy = sortBy;
      lodash2.sortedUniq = sortedUniq;
      lodash2.sortedUniqBy = sortedUniqBy;
      lodash2.split = split;
      lodash2.spread = spread;
      lodash2.tail = tail;
      lodash2.take = take;
      lodash2.takeRight = takeRight;
      lodash2.takeRightWhile = takeRightWhile;
      lodash2.takeWhile = takeWhile;
      lodash2.tap = tap;
      lodash2.throttle = throttle;
      lodash2.thru = thru;
      lodash2.toArray = toArray2;
      lodash2.toPairs = toPairs;
      lodash2.toPairsIn = toPairsIn;
      lodash2.toPath = toPath;
      lodash2.toPlainObject = toPlainObject;
      lodash2.transform = transform;
      lodash2.unary = unary;
      lodash2.union = union;
      lodash2.unionBy = unionBy;
      lodash2.unionWith = unionWith;
      lodash2.uniq = uniq;
      lodash2.uniqBy = uniqBy;
      lodash2.uniqWith = uniqWith;
      lodash2.unset = unset;
      lodash2.unzip = unzip;
      lodash2.unzipWith = unzipWith;
      lodash2.update = update;
      lodash2.updateWith = updateWith;
      lodash2.values = values;
      lodash2.valuesIn = valuesIn;
      lodash2.without = without;
      lodash2.words = words;
      lodash2.wrap = wrap;
      lodash2.xor = xor;
      lodash2.xorBy = xorBy;
      lodash2.xorWith = xorWith;
      lodash2.zip = zip;
      lodash2.zipObject = zipObject;
      lodash2.zipObjectDeep = zipObjectDeep;
      lodash2.zipWith = zipWith;
      lodash2.entries = toPairs;
      lodash2.entriesIn = toPairsIn;
      lodash2.extend = assignIn;
      lodash2.extendWith = assignInWith;
      mixin2(lodash2, lodash2);
      lodash2.add = add;
      lodash2.attempt = attempt;
      lodash2.camelCase = camelCase;
      lodash2.capitalize = capitalize;
      lodash2.ceil = ceil;
      lodash2.clamp = clamp;
      lodash2.clone = clone;
      lodash2.cloneDeep = cloneDeep;
      lodash2.cloneDeepWith = cloneDeepWith;
      lodash2.cloneWith = cloneWith;
      lodash2.conformsTo = conformsTo;
      lodash2.deburr = deburr;
      lodash2.defaultTo = defaultTo;
      lodash2.divide = divide;
      lodash2.endsWith = endsWith;
      lodash2.eq = eq;
      lodash2.escape = escape;
      lodash2.escapeRegExp = escapeRegExp;
      lodash2.every = every;
      lodash2.find = find;
      lodash2.findIndex = findIndex;
      lodash2.findKey = findKey;
      lodash2.findLast = findLast;
      lodash2.findLastIndex = findLastIndex;
      lodash2.findLastKey = findLastKey;
      lodash2.floor = floor2;
      lodash2.forEach = forEach2;
      lodash2.forEachRight = forEachRight;
      lodash2.forIn = forIn;
      lodash2.forInRight = forInRight;
      lodash2.forOwn = forOwn;
      lodash2.forOwnRight = forOwnRight;
      lodash2.get = get2;
      lodash2.gt = gt;
      lodash2.gte = gte;
      lodash2.has = has;
      lodash2.hasIn = hasIn;
      lodash2.head = head;
      lodash2.identity = identity;
      lodash2.includes = includes;
      lodash2.indexOf = indexOf;
      lodash2.inRange = inRange;
      lodash2.invoke = invoke;
      lodash2.isArguments = isArguments2;
      lodash2.isArray = isArray2;
      lodash2.isArrayBuffer = isArrayBuffer;
      lodash2.isArrayLike = isArrayLike;
      lodash2.isArrayLikeObject = isArrayLikeObject;
      lodash2.isBoolean = isBoolean;
      lodash2.isBuffer = isBuffer;
      lodash2.isDate = isDate;
      lodash2.isElement = isElement;
      lodash2.isEmpty = isEmpty;
      lodash2.isEqual = isEqual;
      lodash2.isEqualWith = isEqualWith;
      lodash2.isError = isError;
      lodash2.isFinite = isFinite2;
      lodash2.isFunction = isFunction2;
      lodash2.isInteger = isInteger;
      lodash2.isLength = isLength;
      lodash2.isMap = isMap;
      lodash2.isMatch = isMatch;
      lodash2.isMatchWith = isMatchWith;
      lodash2.isNaN = isNaN2;
      lodash2.isNative = isNative;
      lodash2.isNil = isNil;
      lodash2.isNull = isNull;
      lodash2.isNumber = isNumber;
      lodash2.isObject = isObject2;
      lodash2.isObjectLike = isObjectLike;
      lodash2.isPlainObject = isPlainObject;
      lodash2.isRegExp = isRegExp;
      lodash2.isSafeInteger = isSafeInteger;
      lodash2.isSet = isSet;
      lodash2.isString = isString2;
      lodash2.isSymbol = isSymbol2;
      lodash2.isTypedArray = isTypedArray;
      lodash2.isUndefined = isUndefined;
      lodash2.isWeakMap = isWeakMap;
      lodash2.isWeakSet = isWeakSet;
      lodash2.join = join;
      lodash2.kebabCase = kebabCase;
      lodash2.last = last;
      lodash2.lastIndexOf = lastIndexOf;
      lodash2.lowerCase = lowerCase;
      lodash2.lowerFirst = lowerFirst;
      lodash2.lt = lt;
      lodash2.lte = lte;
      lodash2.max = max2;
      lodash2.maxBy = maxBy;
      lodash2.mean = mean;
      lodash2.meanBy = meanBy;
      lodash2.min = min;
      lodash2.minBy = minBy;
      lodash2.stubArray = stubArray;
      lodash2.stubFalse = stubFalse;
      lodash2.stubObject = stubObject;
      lodash2.stubString = stubString;
      lodash2.stubTrue = stubTrue;
      lodash2.multiply = multiply;
      lodash2.nth = nth;
      lodash2.noConflict = noConflict;
      lodash2.noop = noop2;
      lodash2.now = now;
      lodash2.pad = pad;
      lodash2.padEnd = padEnd;
      lodash2.padStart = padStart;
      lodash2.parseInt = parseInt2;
      lodash2.random = random;
      lodash2.reduce = reduce;
      lodash2.reduceRight = reduceRight;
      lodash2.repeat = repeat;
      lodash2.replace = replace;
      lodash2.result = result;
      lodash2.round = round;
      lodash2.runInContext = runInContext2;
      lodash2.sample = sample;
      lodash2.size = size;
      lodash2.snakeCase = snakeCase;
      lodash2.some = some;
      lodash2.sortedIndex = sortedIndex;
      lodash2.sortedIndexBy = sortedIndexBy;
      lodash2.sortedIndexOf = sortedIndexOf;
      lodash2.sortedLastIndex = sortedLastIndex;
      lodash2.sortedLastIndexBy = sortedLastIndexBy;
      lodash2.sortedLastIndexOf = sortedLastIndexOf;
      lodash2.startCase = startCase;
      lodash2.startsWith = startsWith;
      lodash2.subtract = subtract;
      lodash2.sum = sum;
      lodash2.sumBy = sumBy;
      lodash2.template = template;
      lodash2.times = times;
      lodash2.toFinite = toFinite;
      lodash2.toInteger = toInteger2;
      lodash2.toLength = toLength;
      lodash2.toLower = toLower;
      lodash2.toNumber = toNumber;
      lodash2.toSafeInteger = toSafeInteger;
      lodash2.toString = toString;
      lodash2.toUpper = toUpper;
      lodash2.trim = trim;
      lodash2.trimEnd = trimEnd;
      lodash2.trimStart = trimStart;
      lodash2.truncate = truncate;
      lodash2.unescape = unescape;
      lodash2.uniqueId = uniqueId;
      lodash2.upperCase = upperCase;
      lodash2.upperFirst = upperFirst;
      lodash2.each = forEach2;
      lodash2.eachRight = forEachRight;
      lodash2.first = head;
      mixin2(lodash2, function() {
        var source = {};
        baseForOwn(lodash2, function(func, methodName) {
          if (!hasOwnProperty2.call(lodash2.prototype, methodName)) {
            source[methodName] = func;
          }
        });
        return source;
      }(), { "chain": false });
      lodash2.VERSION = VERSION;
      arrayEach(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(methodName) {
        lodash2[methodName].placeholder = lodash2;
      });
      arrayEach(["drop", "take"], function(methodName, index) {
        LazyWrapper.prototype[methodName] = function(n2) {
          n2 = n2 === undefined$1 ? 1 : nativeMax(toInteger2(n2), 0);
          var result2 = this.__filtered__ && !index ? new LazyWrapper(this) : this.clone();
          if (result2.__filtered__) {
            result2.__takeCount__ = nativeMin(n2, result2.__takeCount__);
          } else {
            result2.__views__.push({
              "size": nativeMin(n2, MAX_ARRAY_LENGTH),
              "type": methodName + (result2.__dir__ < 0 ? "Right" : "")
            });
          }
          return result2;
        };
        LazyWrapper.prototype[methodName + "Right"] = function(n2) {
          return this.reverse()[methodName](n2).reverse();
        };
      });
      arrayEach(["filter", "map", "takeWhile"], function(methodName, index) {
        var type = index + 1, isFilter = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;
        LazyWrapper.prototype[methodName] = function(iteratee2) {
          var result2 = this.clone();
          result2.__iteratees__.push({
            "iteratee": getIteratee(iteratee2, 3),
            "type": type
          });
          result2.__filtered__ = result2.__filtered__ || isFilter;
          return result2;
        };
      });
      arrayEach(["head", "last"], function(methodName, index) {
        var takeName = "take" + (index ? "Right" : "");
        LazyWrapper.prototype[methodName] = function() {
          return this[takeName](1).value()[0];
        };
      });
      arrayEach(["initial", "tail"], function(methodName, index) {
        var dropName = "drop" + (index ? "" : "Right");
        LazyWrapper.prototype[methodName] = function() {
          return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
        };
      });
      LazyWrapper.prototype.compact = function() {
        return this.filter(identity);
      };
      LazyWrapper.prototype.find = function(predicate) {
        return this.filter(predicate).head();
      };
      LazyWrapper.prototype.findLast = function(predicate) {
        return this.reverse().find(predicate);
      };
      LazyWrapper.prototype.invokeMap = baseRest(function(path, args) {
        if (typeof path == "function") {
          return new LazyWrapper(this);
        }
        return this.map(function(value2) {
          return baseInvoke(value2, path, args);
        });
      });
      LazyWrapper.prototype.reject = function(predicate) {
        return this.filter(negate(getIteratee(predicate)));
      };
      LazyWrapper.prototype.slice = function(start, end) {
        start = toInteger2(start);
        var result2 = this;
        if (result2.__filtered__ && (start > 0 || end < 0)) {
          return new LazyWrapper(result2);
        }
        if (start < 0) {
          result2 = result2.takeRight(-start);
        } else if (start) {
          result2 = result2.drop(start);
        }
        if (end !== undefined$1) {
          end = toInteger2(end);
          result2 = end < 0 ? result2.dropRight(-end) : result2.take(end - start);
        }
        return result2;
      };
      LazyWrapper.prototype.takeRightWhile = function(predicate) {
        return this.reverse().takeWhile(predicate).reverse();
      };
      LazyWrapper.prototype.toArray = function() {
        return this.take(MAX_ARRAY_LENGTH);
      };
      baseForOwn(LazyWrapper.prototype, function(func, methodName) {
        var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName), isTaker = /^(?:head|last)$/.test(methodName), lodashFunc = lodash2[isTaker ? "take" + (methodName == "last" ? "Right" : "") : methodName], retUnwrapped = isTaker || /^find/.test(methodName);
        if (!lodashFunc) {
          return;
        }
        lodash2.prototype[methodName] = function() {
          var value2 = this.__wrapped__, args = isTaker ? [1] : arguments, isLazy = value2 instanceof LazyWrapper, iteratee2 = args[0], useLazy = isLazy || isArray2(value2);
          var interceptor = function(value3) {
            var result3 = lodashFunc.apply(lodash2, arrayPush([value3], args));
            return isTaker && chainAll ? result3[0] : result3;
          };
          if (useLazy && checkIteratee && typeof iteratee2 == "function" && iteratee2.length != 1) {
            isLazy = useLazy = false;
          }
          var chainAll = this.__chain__, isHybrid = !!this.__actions__.length, isUnwrapped = retUnwrapped && !chainAll, onlyLazy = isLazy && !isHybrid;
          if (!retUnwrapped && useLazy) {
            value2 = onlyLazy ? value2 : new LazyWrapper(this);
            var result2 = func.apply(value2, args);
            result2.__actions__.push({ "func": thru, "args": [interceptor], "thisArg": undefined$1 });
            return new LodashWrapper(result2, chainAll);
          }
          if (isUnwrapped && onlyLazy) {
            return func.apply(this, args);
          }
          result2 = this.thru(interceptor);
          return isUnwrapped ? isTaker ? result2.value()[0] : result2.value() : result2;
        };
      });
      arrayEach(["pop", "push", "shift", "sort", "splice", "unshift"], function(methodName) {
        var func = arrayProto[methodName], chainName = /^(?:push|sort|unshift)$/.test(methodName) ? "tap" : "thru", retUnwrapped = /^(?:pop|shift)$/.test(methodName);
        lodash2.prototype[methodName] = function() {
          var args = arguments;
          if (retUnwrapped && !this.__chain__) {
            var value2 = this.value();
            return func.apply(isArray2(value2) ? value2 : [], args);
          }
          return this[chainName](function(value3) {
            return func.apply(isArray2(value3) ? value3 : [], args);
          });
        };
      });
      baseForOwn(LazyWrapper.prototype, function(func, methodName) {
        var lodashFunc = lodash2[methodName];
        if (lodashFunc) {
          var key = lodashFunc.name + "";
          if (!hasOwnProperty2.call(realNames, key)) {
            realNames[key] = [];
          }
          realNames[key].push({ "name": methodName, "func": lodashFunc });
        }
      });
      realNames[createHybrid(undefined$1, WRAP_BIND_KEY_FLAG).name] = [{
        "name": "wrapper",
        "func": undefined$1
      }];
      LazyWrapper.prototype.clone = lazyClone;
      LazyWrapper.prototype.reverse = lazyReverse;
      LazyWrapper.prototype.value = lazyValue;
      lodash2.prototype.at = wrapperAt;
      lodash2.prototype.chain = wrapperChain;
      lodash2.prototype.commit = wrapperCommit;
      lodash2.prototype.next = wrapperNext;
      lodash2.prototype.plant = wrapperPlant;
      lodash2.prototype.reverse = wrapperReverse;
      lodash2.prototype.toJSON = lodash2.prototype.valueOf = lodash2.prototype.value = wrapperValue;
      lodash2.prototype.first = lodash2.prototype.head;
      if (symIterator) {
        lodash2.prototype[symIterator] = wrapperToIterator;
      }
      return lodash2;
    };
    var _ = runInContext();
    if (freeModule) {
      (freeModule.exports = _)._ = _;
      freeExports._ = _;
    } else {
      root._ = _;
    }
  }).call(commonjsGlobal);
})(lodash, lodash.exports);
var lodashExports = lodash.exports;
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function(r2) {
      _defineProperty$2(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$2(e, r, t) {
  return (r = _toPropertyKey$2(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$2(t) {
  var i = _toPrimitive$2(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$2(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var log$2 = Log.module("ChartUtils");
var BUSINESS_COLUMN_TYPE = "io.deephaven.time.DateTime";
var MILLIS_PER_HOUR = 36e5;
var NANOS_PER_MILLI = 1e6;
function isDateWrapper(value2) {
  return value2.asDate !== void 0;
}
function isLongWrapper(value2) {
  return value2.asNumber !== void 0;
}
function isDateTimeColumnFormatter(value2) {
  return value2.dhTimeZone !== void 0;
}
function isRangedPlotlyAxis(value2) {
  return value2 != null && value2.range != null && (value2.autorange === false || value2.autorange === void 0);
}
function isWebGLSupported() {
  var canvas = document.createElement("canvas");
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  return gl != null && gl instanceof WebGLRenderingContext;
}
var IS_WEBGL_SUPPORTED = isWebGLSupported();
class ChartUtils {
  /**
   * Generate the plotly error bar data from the passed in data.
   * Iris passes in the values as absolute, plotly needs them as relative.
   * @param x The main data array
   * @param xLow The absolute low values
   * @param xHigh
   *
   * @returns The error_x object required by plotly, or null if none is required
   */
  static getPlotlyErrorBars(x, xLow, xHigh) {
    var array = xHigh.map((value2, i) => value2 - x[i]);
    var arrayminus = xLow.map((value2, i) => x[i] - value2);
    return {
      type: "data",
      symmetric: false,
      array,
      arrayminus
    };
  }
  static convertNumberPrefix(prefix) {
    return prefix.replace(/\u00A4\u00A4/g, "USD").replace(/\u00A4/g, "$");
  }
  static getPlotlyNumberFormat(formatter, columnType, formatPattern) {
    if (formatPattern == null || formatPattern === "") {
      return null;
    }
    var subpatterns = formatPattern.split(";");
    var matchArray = subpatterns[0].match(/^([^#,0.]*)([#,]*)([0,]*)(\.?)(0*)(#*)(E?0*)(%?)(.*)/);
    assertNotNull(matchArray);
    var [, prefix, placeholderDigits, zeroDigits, , decimalDigits, optionalDecimalDigits, numberType, percentSign, suffix] = matchArray;
    var paddingLength = zeroDigits.replace(",", "").length;
    var isCommaSeparated = placeholderDigits.indexOf(",") >= 0 || zeroDigits.indexOf(",") >= 0;
    var comma = isCommaSeparated ? "," : "";
    var plotlyNumberType = numberType != null && numberType !== "" ? "e" : "f";
    var type = percentSign !== "" ? percentSign : plotlyNumberType;
    var decimalLength = decimalDigits.length + optionalDecimalDigits.length;
    var trimOption = "";
    var tickformat = "0".concat(paddingLength).concat(comma, ".").concat(decimalLength).concat(trimOption).concat(type);
    var tickprefix = ChartUtils.convertNumberPrefix(prefix);
    var ticksuffix = ChartUtils.convertNumberPrefix(suffix);
    return {
      tickformat,
      tickprefix,
      ticksuffix,
      automargin: true
    };
  }
  /**
   * Adds tick spacing for an axis that has gapBetweenMajorTicks defined.
   *
   * @param axisFormat the current axis format, may be null
   * @param axis the current axis
   * @param isDateType indicates if the columns is a date type
   */
  static addTickSpacing(axisFormat, axis, isDateType) {
    var {
      gapBetweenMajorTicks
    } = axis;
    if (gapBetweenMajorTicks != null && gapBetweenMajorTicks > 0) {
      var updatedFormat = axisFormat || {};
      var tickSpacing = gapBetweenMajorTicks;
      if (isDateType) {
        tickSpacing = gapBetweenMajorTicks / NANOS_PER_MILLI;
      }
      if (axis.log) {
        tickSpacing = Math.log(tickSpacing);
      }
      updatedFormat.tickmode = "linear";
      updatedFormat.dtick = tickSpacing;
      return updatedFormat;
    }
    return axisFormat;
  }
  /**
   * Retrieve the data source for a given axis in a chart
   * @param chart The chart to get the source for
   * @param axis The axis to find the source for
   * @returns The first source matching this axis
   */
  static getSourceForAxis(chart, axis) {
    for (var i = 0; i < chart.series.length; i += 1) {
      var series = chart.series[i];
      for (var j = 0; j < series.sources.length; j += 1) {
        var source = series.sources[j];
        if (source.axis === axis) {
          return source;
        }
      }
    }
    return null;
  }
  /**
   * Get visibility setting for the series object
   * @param  name The series name to get the visibility for
   * @param  settings Chart settings
   * @returns True for visible series and 'legendonly' for hidden
   */
  static getSeriesVisibility(name, settings) {
    if (settings != null && settings.hiddenSeries != null && settings.hiddenSeries.includes(name)) {
      return "legendonly";
    }
    return true;
  }
  /**
   * Get hidden labels array from chart settings
   * @param settings Chart settings
   * @returns Array of hidden series names
   */
  static getHiddenLabels(settings) {
    if (settings !== null && settings !== void 0 && settings.hiddenSeries) {
      return [...settings.hiddenSeries];
    }
    return [];
  }
  /**
   * Create a default series data object. Apply styling to the object afterward.
   * @returns A simple series data object with no styling
   */
  static makeSeriesData(type, mode, name, showLegend) {
    var orientation = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : ChartUtils.ORIENTATION.VERTICAL;
    return {
      type,
      mode,
      name,
      orientation,
      showlegend: showLegend !== null && showLegend !== void 0 ? showLegend : void 0
    };
  }
  /**
   * Get the Plotly marker symbol for the provided Deephaven shape
   * Deephaven shapes: https://deephaven.io/enterprise/docs/plotting/visual-formatting/#point-formatting
   * Plotly shapes: https://plotly.com/javascript/reference/scattergl/#scattergl-marker-symbol
   * Table of plotly shapes: https://plotly.com/python/marker-style/#custom-marker-symbols
   * @param deephavenShape Deephaven shape to get the marker symbol for
   */
  static getMarkerSymbol(deephavenShape) {
    switch (deephavenShape) {
      case "SQUARE":
        return "square";
      case "CIRCLE":
        return "circle";
      case "DIAMOND":
        return "diamond";
      case "UP_TRIANGLE":
        return "triangle-up";
      case "DOWN_TRIANGLE":
        return "triangle-down";
      case "RIGHT_TRIANGLE":
        return "triangle-right";
      case "LEFT_TRIANGLE":
        return "triangle-left";
      case "ELLIPSE":
      case "HORIZONTAL_RECTANGLE":
      case "VERTICAL_RECTANGLE":
      default:
        throw new Error("Unrecognized shape ".concat(deephavenShape));
    }
  }
  /**
   * Get all axes for a given `Figure`. Iterates through all charts axes and concatenates them.
   * @param figure Figure to get all axes for
   */
  static getAllAxes(figure) {
    return figure.charts.reduce((axes, chart) => [...axes, ...chart.axes], []);
  }
  /**
   * Get the axis type map for the figure provided
   * @param figure Figure to get the type map for
   * @returns Axis type map for the figure provided
   */
  static getAxisTypeMap(figure) {
    var axes = ChartUtils.getAllAxes(figure);
    return ChartUtils.groupArray(axes, "type");
  }
  /**
   * Retrieve the chart that contains the passed in series from the figure
   * @param figure The figure to retrieve the chart from
   * @param series The series to get the chart for
   */
  static getChartForSeries(figure, series) {
    var {
      charts
    } = figure;
    for (var i = 0; i < charts.length; i += 1) {
      var _chart = charts[i];
      for (var j = 0; j < _chart.series.length; j += 1) {
        if (series === _chart.series[j]) {
          return _chart;
        }
      }
    }
    return null;
  }
  /**
   * Get an object mapping axis to their ranges
   * @param layout The plotly layout object to get the ranges from
   * @returns An object mapping the axis name to it's range
   */
  static getLayoutRanges(layout) {
    var ranges = {};
    var keys2 = Object.keys(layout).filter((key2) => key2.indexOf("axis") >= 0);
    for (var i = 0; i < keys2.length; i += 1) {
      var key = keys2[i];
      var value2 = layout[key];
      if (isRangedPlotlyAxis(value2)) {
        ranges[key] = [...value2.range];
      }
    }
    return ranges;
  }
  static getAxisLayoutProperty(axisProperty, axisIndex) {
    var axisIndexString = axisIndex > 0 ? "".concat(axisIndex + 1) : "";
    return "".concat(axisProperty !== null && axisProperty !== void 0 ? axisProperty : "", "axis").concat(axisIndexString);
  }
  /**
   * Converts an open or close period to a declimal. e.g '09:30" to 9.5
   *
   * @param period the open or close value of the period
   */
  static periodToDecimal(period) {
    var values = period.split(":");
    return Number(values[0]) + Number(values[1]) / 60;
  }
  /**
   * Converts a decimal to a period. e.g 9.5 to '09:30'
   *
   * @param decimal the decimal value to
   */
  static decimalToPeriod(decimal) {
    var hours = Math.floor(decimal);
    var minutes = Math.round((decimal - hours) * 60);
    return "".concat(hours.toString().padStart(2, "0"), ":").concat(minutes.toString().padStart(2, "0"));
  }
  /**
   * Groups an array and returns a map
   * @param array The object to group
   * @param property The property name to group by
   * @returns A map containing the items grouped by their values for the property
   */
  static groupArray(array, property) {
    return array.reduce((result, item) => {
      var _result$get;
      var key = item[property];
      var group = (_result$get = result.get(key)) !== null && _result$get !== void 0 ? _result$get : [];
      group.push(item);
      result.set(key, group);
      return result;
    }, /* @__PURE__ */ new Map());
  }
  /**
   * Parses the colorway value of a theme and returns an array of colors
   * Value could be a single string with space separated colors or already be an
   * array of strings representing the colorway
   * @param colorway The colorway value to normalize
   * @returns Colorway array for the theme or undefined
   */
  static normalizeColorway(colorway) {
    if (colorway == null) {
      return;
    }
    if (Array.isArray(colorway)) {
      return colorway;
    }
    if (typeof colorway === "string") {
      return colorway.split(" ");
    }
    log$2.warn("Unexpected colorway format: ".concat(colorway));
  }
  static titleFromSettings(settings) {
    var {
      series,
      xAxis,
      title = "".concat((series !== null && series !== void 0 ? series : []).join(", "), " by ").concat(xAxis)
    } = settings;
    return title;
  }
  static getTimeZoneDiff(calendarTimeZone, formatterTimeZone) {
    return formatterTimeZone ? (calendarTimeZone.standardOffset - formatterTimeZone.standardOffset) / 60 : 0;
  }
  /**
   * Creates closed periods for a partial holiday.
   *
   * @param holidayPeriods the business periods for the holiday
   * @param calendarPeriods the business periods for the calendar
   * @returns an array of closed ranges for the partial holiday. Should be the ranges during the regular business hours that are _not_ specified by the holiday periods.
   */
  static createClosedRangesForPartialHoliday(holidayPeriods, calendarPeriods) {
    var calendarRanges = calendarPeriods.map((period) => [ChartUtils.periodToDecimal(period.open), ChartUtils.periodToDecimal(period.close)]);
    calendarRanges.sort((a, b) => a[0] - b[0]);
    if (calendarRanges.length === 0) {
      calendarRanges.push([0, 24]);
    }
    var holidayRanges = holidayPeriods.map((period) => [ChartUtils.periodToDecimal(period.open), ChartUtils.periodToDecimal(period.close)]);
    holidayRanges.sort((a, b) => a[0] - b[0]);
    var closedRanges = [];
    for (var c = 0; c < calendarRanges.length; c += 1) {
      var calendarRange = calendarRanges[c];
      var lastClose = calendarRange[0];
      for (var h = 0; h < holidayRanges.length; h += 1) {
        var holidayRange = holidayRanges[h];
        if (holidayRange[1] > lastClose && holidayRange[0] < calendarRange[1]) {
          if (holidayRange[0] > lastClose) {
            closedRanges.push([lastClose, holidayRange[0]]);
          }
          lastClose = holidayRange[1];
        }
      }
      if (lastClose < calendarRange[1]) {
        closedRanges.push([lastClose, calendarRange[1]]);
      }
    }
    return closedRanges;
  }
  constructor(dh) {
    _defineProperty$2(this, "dh", void 0);
    _defineProperty$2(this, "daysOfWeek", void 0);
    this.dh = dh;
    this.daysOfWeek = Object.freeze(dh.calendar.DayOfWeek.values());
    bindAllMethods(this);
  }
  /**
   * Retrieve the axis formats from the provided figure.
   * Currently defaults to just the x/y axes.
   * @param figure The figure to get the axis formats for
   * @param formatter The formatter to use when getting the axis format
   * @returns A map of axis layout property names to axis formats
   */
  getAxisFormats(figure, formatter) {
    var axisFormats = /* @__PURE__ */ new Map();
    var nullFormat = {
      tickformat: null,
      ticksuffix: null
    };
    var allAxes = ChartUtils.getAllAxes(figure);
    var axisTypeMap = ChartUtils.groupArray(allAxes, "type");
    var {
      charts
    } = figure;
    for (var i = 0; i < charts.length; i += 1) {
      var _chart2 = charts[i];
      for (var j = 0; j < _chart2.series.length; j += 1) {
        var series = _chart2.series[j];
        var {
          sources
        } = series;
        var axisSources = sources.filter((source2) => source2.axis);
        for (var k = 0; k < axisSources.length; k += 1) {
          var source = axisSources[k];
          var {
            axis: _axis
          } = source;
          var {
            type: axisType
          } = _axis;
          var typeAxes = axisTypeMap.get(axisType);
          assertNotNull(typeAxes);
          var axisIndex = typeAxes.indexOf(_axis);
          var axisProperty = this.getAxisPropertyName(axisType);
          if (axisProperty != null) {
            var axisLayoutProperty = ChartUtils.getAxisLayoutProperty(axisProperty, axisIndex);
            if (axisFormats.has(axisLayoutProperty)) {
              log$2.debug("".concat(axisLayoutProperty, " already added."));
            } else {
              log$2.debug("Adding ".concat(axisLayoutProperty, " to axisFormats."));
              var axisFormat = this.getPlotlyAxisFormat(source, formatter);
              if (axisFormat === null) {
                axisFormats.set(axisLayoutProperty, nullFormat);
              } else {
                axisFormats.set(axisLayoutProperty, axisFormat);
                var {
                  businessCalendar
                } = _axis;
                if (businessCalendar != null) {
                  axisFormat.rangebreaks = this.createRangeBreaksFromBusinessCalendar(businessCalendar, formatter);
                }
                if (axisFormats.size === _chart2.axes.length) {
                  return axisFormats;
                }
              }
            }
          }
        }
      }
    }
    return axisFormats;
  }
  /**
   * Converts the Iris plot style into a plotly chart type
   * @param plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle
   * @param isBusinessTime If the plot is using business time for an axis
   * @param allowWebGL If WebGL is allowedd
   */
  getPlotlyChartType(plotStyle, isBusinessTime) {
    var allowWebGL = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    var {
      dh
    } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
      case dh.plot.SeriesPlotStyle.LINE:
        return !isBusinessTime && IS_WEBGL_SUPPORTED && allowWebGL ? "scattergl" : "scatter";
      case dh.plot.SeriesPlotStyle.BAR:
      case dh.plot.SeriesPlotStyle.STACKED_BAR:
        return "bar";
      case dh.plot.SeriesPlotStyle.PIE:
        return "pie";
      case dh.plot.SeriesPlotStyle.TREEMAP:
        return "treemap";
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return "histogram";
      case dh.plot.SeriesPlotStyle.OHLC:
        return "ohlc";
      default:
        return void 0;
    }
  }
  /**
   * Converts the Iris plot style into a plotly chart mode
   * @param plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle.*
   * @param areLinesVisible Whether lines are visible or not
   * @param areShapesVisible Whether shapes are visible or not
   */
  getPlotlyChartMode(plotStyle, areLinesVisible, areShapesVisible) {
    var {
      dh
    } = this;
    var modes = /* @__PURE__ */ new Set();
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
        if (areLinesVisible !== null && areLinesVisible !== void 0 ? areLinesVisible : false) {
          modes.add(ChartUtils.MODE_LINES);
        }
        if (areShapesVisible !== null && areShapesVisible !== void 0 ? areShapesVisible : true) {
          modes.add(ChartUtils.MODE_MARKERS);
        }
        break;
      case dh.plot.SeriesPlotStyle.LINE:
        if (areLinesVisible !== null && areLinesVisible !== void 0 ? areLinesVisible : true) {
          modes.add(ChartUtils.MODE_LINES);
        }
        if (areShapesVisible !== null && areShapesVisible !== void 0 ? areShapesVisible : false) {
          modes.add(ChartUtils.MODE_MARKERS);
        }
        break;
    }
    return modes.size > 0 ? [...modes].join("+") : void 0;
  }
  /**
   * Get the property to set on the series data for plotly
   * @param plotStyle The plot style of the series
   * @param sourceType The source type for the series
   */
  getPlotlyProperty(plotStyle, sourceType) {
    var {
      dh
    } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.PIE:
        switch (sourceType) {
          case dh.plot.SourceType.X:
            return "labels";
          case dh.plot.SourceType.Y:
            return "values";
        }
        break;
      case dh.plot.SeriesPlotStyle.OHLC:
        switch (sourceType) {
          case dh.plot.SourceType.TIME:
            return "x";
        }
        break;
      case dh.plot.SeriesPlotStyle.TREEMAP:
        switch (sourceType) {
          case dh.plot.SourceType.X:
            return "ids";
          case dh.plot.SourceType.Y:
            return "values";
          case dh.plot.SourceType.LABEL:
            return "labels";
          case dh.plot.SourceType.PARENT:
            return "parents";
          case dh.plot.SourceType.COLOR:
            return "marker.colors";
        }
        break;
    }
    switch (sourceType) {
      case dh.plot.SourceType.X:
        return "x";
      case dh.plot.SourceType.Y:
        return "y";
      case dh.plot.SourceType.Z:
        return "z";
      case dh.plot.SourceType.X_LOW:
        return "xLow";
      case dh.plot.SourceType.X_HIGH:
        return "xHigh";
      case dh.plot.SourceType.Y_LOW:
        return "yLow";
      case dh.plot.SourceType.Y_HIGH:
        return "yHigh";
      case dh.plot.SourceType.TIME:
        return "time";
      case dh.plot.SourceType.OPEN:
        return "open";
      case dh.plot.SourceType.HIGH:
        return "high";
      case dh.plot.SourceType.LOW:
        return "low";
      case dh.plot.SourceType.CLOSE:
        return "close";
      case dh.plot.SourceType.SHAPE:
        return "shape";
      case dh.plot.SourceType.SIZE:
        return "size";
      case dh.plot.SourceType.LABEL:
        return "label";
      case dh.plot.SourceType.COLOR:
        return "color";
      case dh.plot.SourceType.PARENT:
        return "parent";
      case dh.plot.SourceType.HOVER_TEXT:
        return "hovertext";
      case dh.plot.SourceType.TEXT:
        return "text";
      default:
        throw new Error("Unrecognized source type: ".concat(sourceType));
    }
  }
  getPlotlySeriesOrientation(series) {
    var _sources$, _sources$$axis;
    var {
      dh
    } = this;
    var {
      sources
    } = series;
    if (sources.length === 2 && ((_sources$ = sources[0]) === null || _sources$ === void 0 ? void 0 : (_sources$$axis = _sources$.axis) === null || _sources$$axis === void 0 ? void 0 : _sources$$axis.type) === dh.plot.AxisType.Y) {
      return ChartUtils.ORIENTATION.HORIZONTAL;
    }
    return ChartUtils.ORIENTATION.VERTICAL;
  }
  /**
   * Create a data series (trace) for use with plotly
   * @param series The series to create the series data with
   * @param axisTypeMap The map of axes grouped by type
   * @param seriesVisibility Visibility setting for the series
   * @returns The series data (trace) object for use with plotly.
   */
  makeSeriesDataFromSeries(series, axisTypeMap, seriesVisibility) {
    var showLegend = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
    var allowWebGL = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
    var {
      name,
      isLinesVisible,
      isShapesVisible,
      plotStyle,
      lineColor,
      shapeColor,
      sources,
      shape,
      shapeSize
    } = series;
    var isBusinessTime = sources.some((source) => {
      var _source$axis;
      return (_source$axis = source.axis) === null || _source$axis === void 0 ? void 0 : _source$axis.businessCalendar;
    });
    var type = this.getChartType(plotStyle, isBusinessTime, allowWebGL);
    var mode = this.getPlotlyChartMode(plotStyle, isLinesVisible !== null && isLinesVisible !== void 0 ? isLinesVisible : void 0, isShapesVisible !== null && isShapesVisible !== void 0 ? isShapesVisible : void 0);
    var orientation = this.getPlotlySeriesOrientation(series);
    var seriesData = ChartUtils.makeSeriesData(type, mode, name, showLegend, orientation);
    this.addSourcesToSeriesData(seriesData, plotStyle, sources, axisTypeMap);
    this.addStylingToSeriesData(seriesData, plotStyle, lineColor, shapeColor, shape, shapeSize, seriesVisibility);
    return seriesData;
  }
  addSourcesToSeriesData(seriesDataParam, plotStyle, sources, axisTypeMap) {
    var seriesData = seriesDataParam;
    for (var k = 0; k < sources.length; k += 1) {
      var source = sources[k];
      var {
        axis: _axis2,
        type: sourceType
      } = source;
      var dataAttributeName = this.getPlotlyProperty(plotStyle, sourceType);
      lodashExports.set(seriesData, dataAttributeName, []);
      var axisProperty = _axis2 != null ? this.getAxisPropertyName(_axis2.type) : null;
      if (axisProperty != null) {
        var axes = axisTypeMap.get(_axis2.type);
        if (axes) {
          var axisIndex = axes.indexOf(_axis2);
          var axisIndexString = axisIndex > 0 ? "".concat(axisIndex + 1) : "";
          seriesData["".concat(axisProperty, "axis")] = "".concat(axisProperty).concat(axisIndexString);
        }
      }
    }
  }
  addStylingToSeriesData(seriesDataParam, plotStyle) {
    var lineColor = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
    var shapeColor = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : null;
    var shape = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
    var shapeSize = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : null;
    var seriesVisibility = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : null;
    var {
      dh
    } = this;
    var seriesData = seriesDataParam;
    seriesData.marker = {
      line: {}
    };
    seriesData.line = {
      width: 1
      // default line width for lines, should eventually be able to override
    };
    if (plotStyle === dh.plot.SeriesPlotStyle.AREA) {
      seriesData.fill = "tozeroy";
    } else if (plotStyle === dh.plot.SeriesPlotStyle.STACKED_AREA) {
      seriesData.stackgroup = "stack";
    } else if (plotStyle === dh.plot.SeriesPlotStyle.STEP) {
      seriesData.line.shape = "hv";
    } else if (plotStyle === dh.plot.SeriesPlotStyle.HISTOGRAM) {
      seriesData.width = [];
    } else if (plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      seriesData.textinfo = "label+percent";
    } else if (plotStyle === dh.plot.SeriesPlotStyle.TREEMAP) {
      seriesData.hoverinfo = "text";
      seriesData.textinfo = "label+text";
      seriesData.tiling = {
        packing: "squarify",
        pad: 0
      };
      seriesData.textposition = "middle center";
    }
    if (lineColor != null) {
      if (plotStyle === dh.plot.SeriesPlotStyle.BAR) {
        seriesData.marker.color = lineColor;
      } else {
        seriesData.line.color = lineColor;
      }
    }
    if (shapeColor != null) {
      seriesData.marker.color = shapeColor;
    }
    if (shape != null && shape.length > 0) {
      try {
        seriesData.marker.symbol = ChartUtils.getMarkerSymbol(shape);
      } catch (e) {
        log$2.warn("Unable to handle shape", shape, ":", e);
      }
    }
    if (shapeSize != null) {
      seriesData.marker.size = shapeSize * ChartUtils.DEFAULT_MARKER_SIZE;
    }
    if (seriesVisibility != null && plotStyle !== dh.plot.SeriesPlotStyle.PIE) {
      seriesData.visible = seriesVisibility;
    }
  }
  getChartType(plotStyle, isBusinessTime) {
    var allowWebGL = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    var {
      dh
    } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return "bar";
      default:
        return this.getPlotlyChartType(plotStyle, isBusinessTime, allowWebGL);
    }
  }
  /**
   * Return the plotly axis property name
   * @param axisType The axis type to get the property name for
   */
  getAxisPropertyName(axisType) {
    var {
      dh
    } = this;
    switch (axisType) {
      case dh.plot.AxisType.X:
        return "x";
      case dh.plot.AxisType.Y:
        return "y";
      default:
        return null;
    }
  }
  /**
   * Returns the plotly "side" value for the provided axis position
   * @param axisPosition The Iris AxisPosition of the axis
   */
  getAxisSide(axisPosition) {
    var {
      dh
    } = this;
    switch (axisPosition) {
      case dh.plot.AxisPosition.BOTTOM:
        return "bottom";
      case dh.plot.AxisPosition.TOP:
        return "top";
      case dh.plot.AxisPosition.LEFT:
        return "left";
      case dh.plot.AxisPosition.RIGHT:
        return "right";
      default:
        return void 0;
    }
  }
  /**
   * Update the layout with all the axes information for the provided figure
   * @param figure Figure to update the axes for
   * @param layoutParam Layout object to update in place
   * @param chartAxisRangeParser Function to retrieve the axis range parser
   * @param plotWidth Width of the plot in pixels
   * @param plotHeight Height of the plot in pixels
   */
  updateFigureAxes(layoutParam, figure, chartAxisRangeParser) {
    var plotWidth = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    var plotHeight = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0;
    var layout = layoutParam;
    var figureAxes = ChartUtils.getAllAxes(figure);
    for (var i = 0; i < figure.charts.length; i += 1) {
      var _chart3 = figure.charts[i];
      var axisRangeParser = chartAxisRangeParser === null || chartAxisRangeParser === void 0 ? void 0 : chartAxisRangeParser(_chart3);
      var bounds = this.getChartBounds(figure, _chart3, plotWidth, plotHeight);
      this.updateLayoutAxes(layout, _chart3.axes, figureAxes, plotWidth, plotHeight, bounds, axisRangeParser);
    }
    this.removeStaleAxes(layout, figureAxes);
  }
  getChartBounds(figure, chart, plotWidth, plotHeight) {
    var _axisPositionMap$get;
    var {
      dh
    } = this;
    var {
      cols,
      rows
    } = figure;
    var {
      column,
      colspan,
      row,
      rowspan
    } = chart;
    var endColumn = column + colspan;
    var endRow = row + rowspan;
    var columnSize = 1 / cols;
    var rowSize = 1 / rows;
    var xMarginSize = ChartUtils.AXIS_SIZE_PX / plotWidth;
    var yMarginSize = ChartUtils.AXIS_SIZE_PX / plotHeight;
    var bounds = {
      // Need to invert the row positioning so the first one defined shows up on top instead of the bottom, since coordinates start in bottom left
      bottom: (rows - endRow) * rowSize + (endRow < rows ? yMarginSize / 2 : 0),
      top: (rows - row) * rowSize - (row > 0 ? yMarginSize / 2 : 0),
      left: column * columnSize + (column > 0 ? xMarginSize / 2 : 0),
      right: endColumn * columnSize - (endColumn < cols ? xMarginSize / 2 : 0)
    };
    var axisPositionMap = ChartUtils.groupArray(chart.axes, "position");
    var rightAxes = (_axisPositionMap$get = axisPositionMap.get(dh.plot.AxisPosition.RIGHT)) !== null && _axisPositionMap$get !== void 0 ? _axisPositionMap$get : [];
    if (rightAxes.length > 0) {
      if (plotWidth > 0) {
        bounds.right -= (bounds.right - bounds.left) * Math.max(0, Math.min(ChartUtils.LEGEND_WIDTH_PX / plotWidth, ChartUtils.MAX_LEGEND_SIZE));
      } else {
        bounds.right -= (bounds.right - bounds.left) * ChartUtils.DEFAULT_AXIS_SIZE;
      }
    }
    return bounds;
  }
  getPlotlyDateFormat(formatter, columnType, formatPattern) {
    var {
      dh
    } = this;
    var tickformat = formatPattern == null ? void 0 : formatPattern.replace("%", "%%").replace(/S{9}/g, "%9f").replace(/S{8}/g, "%8f").replace(/S{7}/g, "%7f").replace(/S{6}/g, "%6f").replace(/S{5}/g, "%5f").replace(/S{4}/g, "%4f").replace(/S{3}/g, "%3f").replace(/S{2}/g, "%2f").replace(/S{1}/g, "%1f").replace(/y{4}/g, "%Y").replace(/y{2}/g, "%y").replace(/M{4}/g, "%B").replace(/M{3}/g, "%b").replace(/M{2}/g, "%m").replace(/M{1}/g, "%-m").replace(/E{4,}/g, "%A").replace(/E{1,}/g, "%a").replace(/d{2}/g, "%d").replace(/([^%]|^)d{1}/g, "$1%-d").replace(/H{2}/g, "%H").replace(/h{2}/g, "%I").replace(/h{1}/g, "%-I").replace(/m{2}/g, "%M").replace(/s{2}/g, "%S").replace("'T'", "T").replace(" z", "");
    var ticksuffix;
    var dataFormatter = formatter === null || formatter === void 0 ? void 0 : formatter.getColumnTypeFormatter(columnType);
    if (dataFormatter != null && isDateTimeColumnFormatter(dataFormatter) && dataFormatter.dhTimeZone != null && dataFormatter.showTimeZone) {
      ticksuffix = dh.i18n.DateTimeFormat.format(" z", /* @__PURE__ */ new Date(), dataFormatter.dhTimeZone);
    }
    return {
      tickformat,
      ticksuffix,
      automargin: true
    };
  }
  /**
   * Gets the plotly axis formatting information from the source passed in
   * @param source The Source to get the formatter information from
   * @param formatter The current formatter for formatting data
   */
  getPlotlyAxisFormat(source) {
    var formatter = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    var {
      dh
    } = this;
    var {
      axis,
      columnType
    } = source;
    var {
      formatPattern
    } = axis;
    var axisFormat = null;
    if (TableUtils.isDateType(columnType)) {
      axisFormat = this.getPlotlyDateFormat(formatter, columnType, formatPattern);
      axisFormat = ChartUtils.addTickSpacing(axisFormat, axis, true);
    } else if (TableUtils.isNumberType(columnType)) {
      axisFormat = ChartUtils.getPlotlyNumberFormat(formatter, columnType, formatPattern);
      axisFormat = ChartUtils.addTickSpacing(axisFormat, axis, false);
    }
    if (axis.formatType === dh.plot.AxisFormatType.CATEGORY) {
      if (axisFormat) {
        axisFormat.type = "category";
      } else {
        axisFormat = {
          type: "category",
          tickformat: void 0,
          ticksuffix: void 0
        };
      }
    }
    return axisFormat;
  }
  /**
   * Updates the axes positions and sizes in the layout object provided.
   * If the axis did not exist in the layout previously, it is created and added.
   * Any axis that no longer exists in axes is removed.
   * With Downsampling enabled, will also update the range on the axis itself as appropriate
   * @param layoutParam The layout object to update
   * @param chartAxes The chart axes to update the layout with
   * @param figureAxes All figure axes to update the layout with
   * @param plotWidth The width of the plot to calculate the axis sizes for
   * @param plotHeight The height of the plot to calculate the axis sizes for
   * @param bounds The bounds for this set of axes
   * @param axisRangeParser A function to retrieve the range parser for a given axis
   */
  updateLayoutAxes(layoutParam, chartAxes, figureAxes) {
    var plotWidth = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
    var plotHeight = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : 0;
    var bounds = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {
      left: 0,
      top: 0,
      right: 1,
      bottom: 1
    };
    var axisRangeParser = arguments.length > 6 ? arguments[6] : void 0;
    var {
      dh
    } = this;
    var xAxisSize = plotWidth > 0 ? Math.max(ChartUtils.MIN_AXIS_SIZE, Math.min(ChartUtils.AXIS_SIZE_PX / plotHeight, ChartUtils.MAX_AXIS_SIZE)) : ChartUtils.DEFAULT_AXIS_SIZE;
    var yAxisSize = plotHeight > 0 ? Math.max(ChartUtils.MIN_AXIS_SIZE, Math.min(ChartUtils.AXIS_SIZE_PX / plotWidth, ChartUtils.MAX_AXIS_SIZE)) : ChartUtils.DEFAULT_AXIS_SIZE;
    var layout = layoutParam;
    var axisPositionMap = ChartUtils.groupArray(chartAxes, "position");
    var axisTypeMap = ChartUtils.groupArray(chartAxes, "type");
    var axisTypes = [...axisTypeMap.keys()];
    var figureAxisTypeMap = ChartUtils.groupArray(figureAxes, "type");
    for (var j = 0; j < axisTypes.length; j += 1) {
      var axisType = axisTypes[j];
      var axisProperty = this.getAxisPropertyName(axisType);
      if (axisProperty != null) {
        var typeAxes = axisTypeMap.get(axisType);
        var figureTypeAxes = figureAxisTypeMap.get(axisType);
        var isYAxis = axisType === dh.plot.AxisType.Y;
        var plotSize = isYAxis ? plotHeight : plotWidth;
        assertNotNull(typeAxes);
        assertNotNull(figureTypeAxes);
        for (var chartAxisIndex = 0; chartAxisIndex < typeAxes.length; chartAxisIndex += 1) {
          var _axis3 = typeAxes[chartAxisIndex];
          var figureAxisIndex = figureTypeAxes.indexOf(_axis3);
          var axisLayoutProperty = ChartUtils.getAxisLayoutProperty(axisProperty, figureAxisIndex);
          if (layout[axisLayoutProperty] == null) {
            layout[axisLayoutProperty] = {};
          }
          var layoutAxis = layout[axisLayoutProperty];
          if (layoutAxis != null) {
            this.updateLayoutAxis(layoutAxis, _axis3, chartAxisIndex, axisPositionMap, xAxisSize, yAxisSize, bounds);
            var {
              range: _range,
              autorange
            } = layoutAxis;
            if (axisRangeParser != null && _range !== void 0 && (autorange === void 0 || autorange === false)) {
              var rangeParser = axisRangeParser(_axis3);
              var [rangeStart, rangeEnd] = rangeParser(_range);
              log$2.debug("Setting downsample range", plotSize, rangeStart, rangeEnd);
              _axis3.range(plotSize, rangeStart, rangeEnd);
            } else {
              _axis3.range(plotSize);
            }
          }
        }
      }
    }
  }
  /**
   * Remove any axes from the layout param that no longer belong to any series
   * @param layoutParam Layout object to remove stale axes from
   * @param axes All axes in the figure
   */
  removeStaleAxes(layoutParam, axes) {
    var layout = layoutParam;
    var figureAxisTypeMap = ChartUtils.groupArray(axes, "type");
    var figureAxisTypes = [...figureAxisTypeMap.keys()];
    for (var i = 0; i < figureAxisTypes.length; i += 1) {
      var axisType = figureAxisTypes[i];
      var typeAxes = figureAxisTypeMap.get(axisType);
      assertNotNull(typeAxes);
      var axisIndex = typeAxes.length;
      var axisProperty = this.getAxisPropertyName(axisType);
      if (axisProperty != null) {
        var axisLayoutProperty = ChartUtils.getAxisLayoutProperty(axisProperty, axisIndex);
        while (layout[axisLayoutProperty] != null) {
          delete layout[axisLayoutProperty];
          axisIndex += 1;
          axisLayoutProperty = ChartUtils.getAxisLayoutProperty(axisProperty, axisIndex);
        }
      }
    }
  }
  /**
   * Updates the layout axis object in place
   * @param layoutAxisParam The plotly layout axis param
   * @param axis The Iris Axis to update the plotly layout with
   * @param axisIndex The type index for this axis
   * @param axisPositionMap All the axes mapped by position
   * @param axisSize The size of each axis in percent
   * @param bounds The bounds of the axes domains
   */
  updateLayoutAxis(layoutAxisParam, axis, axisIndex, axisPositionMap, xAxisSize, yAxisSize, bounds) {
    var _axis$label;
    var {
      dh
    } = this;
    var isYAxis = axis.type === dh.plot.AxisType.Y;
    var axisSize = isYAxis ? yAxisSize : xAxisSize;
    var layoutAxis = layoutAxisParam;
    var label = (_axis$label = axis.label) !== null && _axis$label !== void 0 ? _axis$label : "";
    if (layoutAxis.title !== void 0 && typeof layoutAxis.title !== "string") {
      layoutAxis.title.text = label;
    } else {
      layoutAxis.title = {
        text: label
      };
    }
    if (axis.log) {
      layoutAxis.type = "log";
    }
    layoutAxis.side = this.getAxisSide(axis.position);
    if (axisIndex > 0) {
      var _this$getAxisProperty, _axisPositionMap$get2;
      layoutAxis.overlaying = (_this$getAxisProperty = this.getAxisPropertyName(axis.type)) !== null && _this$getAxisProperty !== void 0 ? _this$getAxisProperty : void 0;
      var positionAxes = (_axisPositionMap$get2 = axisPositionMap.get(axis.position)) !== null && _axisPositionMap$get2 !== void 0 ? _axisPositionMap$get2 : [];
      var sideIndex = positionAxes.indexOf(axis);
      if (sideIndex > 0) {
        layoutAxis.anchor = "free";
        if (axis.position === dh.plot.AxisPosition.RIGHT) {
          layoutAxis.position = bounds.right + (sideIndex - positionAxes.length + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.TOP) {
          layoutAxis.position = bounds.top + (sideIndex - positionAxes.length + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.BOTTOM) {
          layoutAxis.position = bounds.bottom + (positionAxes.length - sideIndex + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.LEFT) {
          layoutAxis.position = bounds.left + (positionAxes.length - sideIndex + 1) * axisSize;
        }
      }
    } else if (axis.type === dh.plot.AxisType.X) {
      var leftAxes = axisPositionMap.get(dh.plot.AxisPosition.LEFT) || [];
      var rightAxes = axisPositionMap.get(dh.plot.AxisPosition.RIGHT) || [];
      var left = Math.max(bounds.left, bounds.left + (leftAxes.length - 1) * yAxisSize);
      var right = Math.min(bounds.right - (rightAxes.length - 1) * yAxisSize, bounds.right);
      layoutAxis.domain = [left, right];
    } else if (axis.type === dh.plot.AxisType.Y) {
      var bottomAxes = axisPositionMap.get(dh.plot.AxisPosition.BOTTOM) || [];
      var topAxes = axisPositionMap.get(dh.plot.AxisPosition.TOP) || [];
      var bottom = Math.max(bounds.bottom, bounds.bottom + (bottomAxes.length - 1) * xAxisSize);
      var top = Math.min(bounds.top - (topAxes.length - 1) * xAxisSize, bounds.top);
      layoutAxis.domain = [bottom, top];
    }
    var {
      minRange,
      maxRange,
      log: logAxis
    } = axis;
    if (!Number.isNaN(minRange) || !Number.isNaN(maxRange)) {
      layoutAxis.autorangeoptions = {};
      if (!Number.isNaN(minRange)) {
        layoutAxis.autorangeoptions.minallowed = logAxis ? Math.log10(minRange) : minRange;
      }
      if (!Number.isNaN(maxRange)) {
        layoutAxis.autorangeoptions.maxallowed = logAxis ? Math.log10(maxRange) : maxRange;
      }
    }
  }
  /**
   * Creates the bounds for the periods specified.
   * For example, if you pass in [['09:00', '17:00']], it will return [17, 9] (closing at 5pm, opening at 9am the next day)
   * If you pass [['09:00', '12:00'], ['13:00', '17:00']], it will return [12, 13] (closing at noon, opening at 1pm) and [17, 9] (closing at 5pm, opening at 9am the next day)
   * @param periods Periods to map
   * @param timeZoneDiff Time zone difference in hours
   * @returns Bounds for the periods in plotly format
   */
  // eslint-disable-next-line class-methods-use-this
  createBoundsFromPeriods(periods) {
    var timeZoneDiff = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    if (periods.length === 0) {
      return [];
    }
    var numberPeriods = periods.map((period2) => [(ChartUtils.periodToDecimal(period2.open) + timeZoneDiff) % 24, (ChartUtils.periodToDecimal(period2.close) + timeZoneDiff) % 24]).sort((a, b) => a[0] - b[0]);
    var bounds = [];
    for (var i = 0; i < numberPeriods.length; i += 1) {
      var period = numberPeriods[i];
      var nextPeriod = numberPeriods[(i + 1) % numberPeriods.length];
      bounds.push([period[1], nextPeriod[0]]);
    }
    return bounds;
  }
  /**
   * Creates range breaks for plotly from business periods.
   * @param periods Business periods to create the breaks for
   * @param timeZoneDiff Time zone difference in hours
   * @returns Plotly range breaks for the business periods
   */
  createBreaksFromPeriods(periods) {
    var timeZoneDiff = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    var bounds = this.createBoundsFromPeriods(periods, timeZoneDiff);
    return bounds.map((bound) => ({
      pattern: "hour",
      bounds: bound
    }));
  }
  /**
   * Creates range break bounds for plotly from business days.
   * For example a standard business week of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
   * will result in [[6,1]] meaning close on Saturday and open on Monday.
   * If you remove Wednesday from the array, then you get two closures [[6, 1], [3, 4]]
   *
   * @param businessDays the days to display on the x-axis
   */
  createBoundsFromDays(businessDays) {
    var weekLength = this.daysOfWeek.length;
    if (businessDays.length === weekLength) {
      return [];
    }
    var businessDaysInt = businessDays.map((day) => this.daysOfWeek.indexOf(day));
    var businessDaysSet = new Set(businessDaysInt);
    var closedDays = /* @__PURE__ */ new Set();
    for (var i = 0; i < weekLength; i += 1) {
      if (!businessDaysSet.has(i) && businessDaysSet.has((i - 1 + weekLength) % weekLength)) {
        closedDays.add(i);
      }
    }
    var boundsArray = [];
    closedDays.forEach((closedDay) => {
      for (var _i = 0; _i < weekLength; _i += 1) {
        var adjustedDay = (closedDay + _i) % weekLength;
        if (businessDaysSet.has(adjustedDay)) {
          boundsArray.push([closedDay, adjustedDay]);
          return;
        }
      }
      throw new Error("Unable to find open day for closed day ".concat(closedDay, ", businessDays: ").concat(businessDays));
    });
    return boundsArray;
  }
  /**
   * Breaks in plotly for business days
   * @param businessDays Business days to create the breaks for
   * @returns Plotly range breaks for the business days
   */
  createBreaksFromDays(businessDays) {
    var bounds = this.createBoundsFromDays(businessDays);
    return bounds.map((bound) => ({
      pattern: "day of week",
      bounds: bound
    }));
  }
  /**
   * Creates range breaks for plotly from a business calendar.
   * @param businessCalendar Calendar to create the breaks from
   * @param formatter Formatter to use for time zones
   * @returns Plotly Rangebreaks for the business calendar
   */
  createRangeBreaksFromBusinessCalendar(businessCalendar, formatter) {
    var rangebreaks = [];
    var {
      businessPeriods,
      businessDays,
      holidays,
      timeZone: calendarTimeZone
    } = businessCalendar;
    var typeFormatter = formatter === null || formatter === void 0 ? void 0 : formatter.getColumnTypeFormatter(BUSINESS_COLUMN_TYPE);
    var formatterTimeZone;
    if (isDateTimeColumnFormatter(typeFormatter)) {
      formatterTimeZone = typeFormatter.dhTimeZone;
    }
    var timeZoneDiff = ChartUtils.getTimeZoneDiff(calendarTimeZone, formatterTimeZone);
    if (holidays.length > 0) {
      rangebreaks.push(...this.createRangeBreakValuesFromHolidays(holidays, calendarTimeZone, formatterTimeZone, businessCalendar));
    }
    rangebreaks.push(...this.createBreaksFromPeriods(businessPeriods, timeZoneDiff));
    rangebreaks.push(...this.createBreaksFromDays(businessDays));
    return rangebreaks;
  }
  /**
   * Creates an array of range breaks for all holidays.
   *
   * @param holidays an array of holidays
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   * @param calendar the calendar the holidays are from
   */
  createRangeBreakValuesFromHolidays(holidays, calendarTimeZone, formatterTimeZone, calendar) {
    var fullHolidays = [];
    var partialHolidays = [];
    holidays.forEach((holiday) => {
      if (holiday.businessPeriods.length > 0) {
        partialHolidays.push(...this.createPartialHoliday(holiday, calendarTimeZone, formatterTimeZone, calendar));
      } else {
        fullHolidays.push(this.createFullHoliday(holiday, calendarTimeZone, formatterTimeZone));
      }
    });
    return [{
      values: fullHolidays
    }, ...partialHolidays];
  }
  /**
   * Creates the range break value for a full holiday. A full holiday is day that has no business periods.
   *
   * @param holiday the full holiday
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   */
  createFullHoliday(holiday, calendarTimeZone, formatterTimeZone) {
    return this.adjustDateForTimeZone("".concat(holiday.date.toString(), " 00:00:00.000000"), calendarTimeZone, formatterTimeZone);
  }
  /**
   * Creates the range break for a partial holiday. A partial holiday is holiday with business periods
   * that are different than the default business periods.
   *
   * @param holiday the partial holiday
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   * @param calendar the calendar the holiday is from. Used to check against the default business periods to ensure this holiday needs to be specified
   *
   * @returns an array of range breaks for the partial holiday
   */
  createPartialHoliday(holiday, calendarTimeZone, formatterTimeZone, calendar) {
    var _calendar$businessPer;
    if (holiday.businessPeriods.length === 0) {
      return [];
    }
    var dateString = holiday.date.toString();
    if (calendar) {
      var dayOfWeek = new Date(dateString).getDay();
      var isBusinessDay = calendar.businessDays.includes(this.daysOfWeek[dayOfWeek]);
      if (!isBusinessDay) {
        return [];
      }
    }
    var closedPeriods = ChartUtils.createClosedRangesForPartialHoliday(holiday.businessPeriods, (_calendar$businessPer = calendar === null || calendar === void 0 ? void 0 : calendar.businessPeriods) !== null && _calendar$businessPer !== void 0 ? _calendar$businessPer : []);
    var rangeBreaks = [];
    for (var i = 0; i < closedPeriods.length; i += 1) {
      var [closeStart, closeEnd] = closedPeriods[i];
      if (closeStart !== closeEnd) {
        var values = [this.adjustDateForTimeZone("".concat(dateString, " ").concat(ChartUtils.decimalToPeriod(closeStart), ":00.000000"), calendarTimeZone, formatterTimeZone)];
        var dvalue = MILLIS_PER_HOUR * (closeEnd - closeStart);
        rangeBreaks.push({
          values,
          dvalue
        });
      }
    }
    return rangeBreaks;
  }
  /**
   * Adjusts a date string from the calendar time zone to the formatter time zone.
   *
   * @param dateString the date string
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   */
  adjustDateForTimeZone(dateString, calendarTimeZone, formatterTimeZone) {
    if (formatterTimeZone && formatterTimeZone.standardOffset !== calendarTimeZone.standardOffset) {
      return this.unwrapValue(this.wrapValue(dateString, BUSINESS_COLUMN_TYPE, calendarTimeZone), formatterTimeZone);
    }
    return dateString;
  }
  /**
   * Creates the Figure settings from the Chart Builder settings
   * This should be deprecated at some point, and have Chart Builder create the figure settings directly.
   * This logic will still need to exist to translate existing charts, but could be part of a migration script
   * to translate the data.
   * Change when we decide to add more functionality to the Chart Builder.
   * @param settings The chart builder settings
   * @param settings.title The title for this figure
   * @param settings.xAxis The name of the column to use for the x-axis
   * @param settings.series The name of the columns to use for the series of this figure
   * @param settings.type The plot style for this figure
   */
  makeFigureSettings(settings, table) {
    var {
      dh
    } = this;
    var {
      series,
      xAxis: settingsAxis,
      type
    } = settings;
    var title = ChartUtils.titleFromSettings(settings);
    var xAxis = {
      formatType: "".concat(dh.plot.AxisFormatType.NUMBER),
      type: "".concat(dh.plot.AxisType.X),
      position: "".concat(dh.plot.AxisPosition.BOTTOM)
    };
    var yAxis = {
      formatType: "".concat(dh.plot.AxisFormatType.NUMBER),
      type: "".concat(dh.plot.AxisType.Y),
      position: "".concat(dh.plot.AxisPosition.LEFT)
    };
    return {
      charts: [{
        chartType: "".concat(dh.plot.ChartType.XY),
        axes: [xAxis, yAxis],
        series: (series !== null && series !== void 0 ? series : []).map((name) => ({
          plotStyle: "".concat(type),
          name,
          dataSources: [{
            type: "".concat(dh.plot.SourceType.X),
            columnName: settingsAxis !== null && settingsAxis !== void 0 ? settingsAxis : "",
            axis: xAxis,
            table
          }, {
            type: "".concat(dh.plot.SourceType.Y),
            columnName: name,
            axis: yAxis,
            table
          }]
        }))
      }],
      title
    };
  }
  /**
   * Unwraps a value provided from API to a value plotly can understand
   * Eg. Unwraps DateWrapper, LongWrapper objects.
   */
  unwrapValue(value2, timeZone) {
    var {
      dh
    } = this;
    if (value2 != null) {
      if (isDateWrapper(value2)) {
        return dh.i18n.DateTimeFormat.format(ChartUtils.DATE_FORMAT, value2, timeZone);
      }
      if (isLongWrapper(value2)) {
        return value2.asNumber();
      }
    }
    return value2;
  }
  /**
   *
   * @param value The value to wrap up
   * @param columnType The type of column this value is from
   * @param timeZone The time zone if applicable
   */
  wrapValue(value2, columnType) {
    var timeZone = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
    var {
      dh
    } = this;
    if (TableUtils.isDateType(columnType) && typeof value2 === "string") {
      var text = value2;
      var format = ChartUtils.DATE_FORMAT.substr(0, value2.length);
      var date = dh.i18n.DateTimeFormat.parse(format, text);
      if (!timeZone) {
        return date;
      }
      var tzFormat = "".concat(format, " Z");
      var estimatedOffset = dh.i18n.DateTimeFormat.format("Z", date, timeZone);
      var estimatedDate = dh.i18n.DateTimeFormat.parse(tzFormat, "".concat(text, " ").concat(estimatedOffset));
      var offset = dh.i18n.DateTimeFormat.format("Z", estimatedDate, timeZone);
      return dh.i18n.DateTimeFormat.parse(tzFormat, "".concat(text, " ").concat(offset));
    }
    return value2;
  }
  makeLayoutAxis(type, theme) {
    var {
      dh
    } = this;
    var axis = {
      automargin: true,
      gridcolor: theme.gridcolor,
      linecolor: theme.linecolor,
      rangeslider: {
        visible: false
      },
      showline: true,
      ticks: "outside",
      ticklen: 5,
      // act as padding, can't find a tick padding
      tickcolor: theme.paper_bgcolor,
      // hide ticks as padding
      tickfont: {
        color: theme.zerolinecolor
      },
      title: {
        font: {
          color: theme.title_color
        }
      },
      legend: {
        font: {
          color: theme.legend_color
        }
      }
    };
    if (type === dh.plot.AxisType.X) {
      Object.assign(axis, {
        showgrid: true
      });
    } else if (type === dh.plot.AxisType.Y) {
      Object.assign(axis, {
        zerolinecolor: theme.zerolinecolor,
        zerolinewidth: 2
      });
    }
    return axis;
  }
  /**
   * Creates a plotly layout template object based on a given theme.
   * See https://plotly.com/javascript/reference/layout/#layout-template
   * @param theme The theme to use for the layout template
   * @returns The layout template object
   */
  makeDefaultTemplate(theme) {
    var {
      error_band_line_color,
      ohlc_increasing,
      ohlc_decreasing,
      title_color,
      indicator_increasing,
      indicator_decreasing,
      indicator_gauge
    } = theme;
    return {
      data: {
        bar: [{
          marker: {
            line: {
              color: "transparent"
            }
          }
        }],
        scatter: [{
          error_x: {
            color: error_band_line_color
          },
          error_y: {
            color: error_band_line_color
          }
        }],
        ohlc: [{
          increasing: {
            line: {
              color: ohlc_increasing
            }
          },
          decreasing: {
            line: {
              color: ohlc_decreasing
            }
          }
        }],
        pie: [{
          outsidetextfont: {
            color: title_color
          }
        }],
        treemap: [{
          outsidetextfont: {
            color: title_color
          }
        }],
        indicator: [{
          title: {
            font: {
              color: title_color
            }
          },
          delta: {
            decreasing: {
              color: indicator_decreasing
            },
            increasing: {
              color: indicator_increasing
            }
          },
          gauge: {
            bar: {
              color: indicator_gauge
            }
          }
        }]
      },
      /* eslint-enable camelcase */
      layout: this.makeDefaultLayout(theme)
    };
  }
  /**
   * Creates a plotly layout object based on a given theme.
   * See https://plotly.com/javascript/reference/layout/
   * @param theme The theme to use for the layout
   */
  makeDefaultLayout(theme) {
    var {
      dh
    } = this;
    var {
      /* Used as top level properties of `Layout` */
      /* eslint-disable camelcase */
      paper_bgcolor,
      plot_bgcolor,
      title_color,
      coastline_color,
      land_color,
      ocean_color,
      lake_color,
      river_color
      /* eslint-disable camelcase */
    } = theme;
    var layout = {
      paper_bgcolor,
      plot_bgcolor,
      autosize: true,
      colorway: ChartUtils.normalizeColorway(theme === null || theme === void 0 ? void 0 : theme.colorway),
      font: {
        family: "'Fira Sans', sans-serif",
        color: title_color
      },
      title: {
        font: {
          color: title_color
        },
        xanchor: "center",
        xref: "paper",
        yanchor: "top",
        pad: _objectSpread$1({}, ChartUtils.DEFAULT_TITLE_PADDING),
        y: 1
      },
      legend: {
        font: {
          color: title_color
        }
      },
      margin: _objectSpread$1({}, ChartUtils.DEFAULT_MARGIN),
      xaxis: this.makeLayoutAxis(dh.plot.AxisType.X, theme),
      yaxis: this.makeLayoutAxis(dh.plot.AxisType.Y, theme),
      polar: {
        angularaxis: this.makeLayoutAxis(dh.plot.AxisType.SHAPE, theme),
        radialaxis: this.makeLayoutAxis(dh.plot.AxisType.SHAPE, theme),
        bgcolor: theme.plot_bgcolor
      },
      scene: {
        xaxis: this.makeLayoutAxis(dh.plot.AxisType.X, theme),
        yaxis: this.makeLayoutAxis(dh.plot.AxisType.Y, theme),
        zaxis: this.makeLayoutAxis(null, theme)
      },
      geo: {
        showcoastlines: true,
        showframe: false,
        showland: true,
        showocean: true,
        showlakes: true,
        showrivers: true,
        bgcolor: paper_bgcolor,
        coastlinecolor: coastline_color,
        landcolor: land_color,
        oceancolor: ocean_color,
        lakecolor: lake_color,
        rivercolor: river_color
      }
    };
    layout.datarevision = 0;
    return layout;
  }
  /**
   * Hydrate settings from a JSONable object
   * @param settings Dehydrated settings
   */
  hydrateSettings(settings) {
    var {
      dh
    } = this;
    return _objectSpread$1(_objectSpread$1({}, settings), {}, {
      type: settings.type != null ? dh.plot.SeriesPlotStyle[settings.type] : void 0
    });
  }
}
_defineProperty$2(ChartUtils, "DEFAULT_AXIS_SIZE", 0.15);
_defineProperty$2(ChartUtils, "MIN_AXIS_SIZE", 0.025);
_defineProperty$2(ChartUtils, "MAX_AXIS_SIZE", 0.2);
_defineProperty$2(ChartUtils, "AXIS_SIZE_PX", 75);
_defineProperty$2(ChartUtils, "LEGEND_WIDTH_PX", 50);
_defineProperty$2(ChartUtils, "MAX_LEGEND_SIZE", 0.25);
_defineProperty$2(ChartUtils, "ORIENTATION", Object.freeze({
  HORIZONTAL: "h",
  VERTICAL: "v"
}));
_defineProperty$2(ChartUtils, "DATE_FORMAT", "yyyy-MM-dd HH:mm:ss.SSSSSS");
_defineProperty$2(ChartUtils, "DEFAULT_MARGIN", Object.freeze({
  l: 60,
  r: 50,
  t: 30,
  b: 60,
  pad: 0
}));
_defineProperty$2(ChartUtils, "DEFAULT_TITLE_PADDING", Object.freeze({
  t: 8
}));
_defineProperty$2(ChartUtils, "SUBTITLE_LINE_HEIGHT", 25);
_defineProperty$2(ChartUtils, "DEFAULT_MARKER_SIZE", 6);
_defineProperty$2(ChartUtils, "MODE_MARKERS", "markers");
_defineProperty$2(ChartUtils, "MODE_LINES", "lines");
var noop = function() {
};
var _undefined$1 = noop();
var isValue$6 = function(val) {
  return val !== _undefined$1 && val !== null;
};
var isValue$5 = isValue$6;
var forEach$2 = Array.prototype.forEach, create$1 = Object.create;
var process$1 = function(src, obj) {
  var key;
  for (key in src) obj[key] = src[key];
};
var normalizeOptions = function(opts1) {
  var result = create$1(null);
  forEach$2.call(arguments, function(options) {
    if (!isValue$5(options)) return;
    process$1(Object(options), result);
  });
  return result;
};
var isImplemented$7 = function() {
  var sign2 = Math.sign;
  if (typeof sign2 !== "function") return false;
  return sign2(10) === 1 && sign2(-20) === -1;
};
var shim$5;
var hasRequiredShim$5;
function requireShim$5() {
  if (hasRequiredShim$5) return shim$5;
  hasRequiredShim$5 = 1;
  shim$5 = function(value2) {
    value2 = Number(value2);
    if (isNaN(value2) || value2 === 0) return value2;
    return value2 > 0 ? 1 : -1;
  };
  return shim$5;
}
var sign$1 = isImplemented$7() ? Math.sign : requireShim$5();
var sign = sign$1, abs = Math.abs, floor = Math.floor;
var toInteger$1 = function(value2) {
  if (isNaN(value2)) return 0;
  value2 = Number(value2);
  if (value2 === 0 || !isFinite(value2)) return value2;
  return sign(value2) * floor(abs(value2));
};
var toInteger = toInteger$1, max$1 = Math.max;
var toPosInteger = function(value2) {
  return max$1(0, toInteger(value2));
};
var toPosInt$1 = toPosInteger;
var resolveLength$2 = function(optsLength, fnLength, isAsync) {
  var length;
  if (isNaN(optsLength)) {
    length = fnLength;
    if (!(length >= 0)) return 1;
    if (isAsync && length) return length - 1;
    return length;
  }
  if (optsLength === false) return false;
  return toPosInt$1(optsLength);
};
var validCallable = function(fn) {
  if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
  return fn;
};
var isValue$4 = isValue$6;
var validValue = function(value2) {
  if (!isValue$4(value2)) throw new TypeError("Cannot use null or undefined");
  return value2;
};
var callable$3 = validCallable, value = validValue, bind = Function.prototype.bind, call$1 = Function.prototype.call, keys$1 = Object.keys, objPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;
var _iterate = function(method, defVal) {
  return function(obj, cb) {
    var list, thisArg = arguments[2], compareFn = arguments[3];
    obj = Object(value(obj));
    callable$3(cb);
    list = keys$1(obj);
    if (compareFn) {
      list.sort(typeof compareFn === "function" ? bind.call(compareFn, obj) : void 0);
    }
    if (typeof method !== "function") method = list[method];
    return call$1.call(method, list, function(key, index) {
      if (!objPropertyIsEnumerable.call(obj, key)) return defVal;
      return call$1.call(cb, thisArg, obj[key], key, obj, index);
    });
  };
};
var forEach$1 = _iterate("forEach");
var registeredExtensions = {};
var custom = { exports: {} };
var isImplemented$6 = function() {
  var assign2 = Object.assign, obj;
  if (typeof assign2 !== "function") return false;
  obj = { foo: "raz" };
  assign2(obj, { bar: "dwa" }, { trzy: "trzy" });
  return obj.foo + obj.bar + obj.trzy === "razdwatrzy";
};
var isImplemented$5;
var hasRequiredIsImplemented$4;
function requireIsImplemented$4() {
  if (hasRequiredIsImplemented$4) return isImplemented$5;
  hasRequiredIsImplemented$4 = 1;
  isImplemented$5 = function() {
    try {
      Object.keys("primitive");
      return true;
    } catch (e) {
      return false;
    }
  };
  return isImplemented$5;
}
var shim$4;
var hasRequiredShim$4;
function requireShim$4() {
  if (hasRequiredShim$4) return shim$4;
  hasRequiredShim$4 = 1;
  var isValue2 = isValue$6;
  var keys2 = Object.keys;
  shim$4 = function(object) {
    return keys2(isValue2(object) ? Object(object) : object);
  };
  return shim$4;
}
var keys;
var hasRequiredKeys;
function requireKeys() {
  if (hasRequiredKeys) return keys;
  hasRequiredKeys = 1;
  keys = requireIsImplemented$4()() ? Object.keys : requireShim$4();
  return keys;
}
var shim$3;
var hasRequiredShim$3;
function requireShim$3() {
  if (hasRequiredShim$3) return shim$3;
  hasRequiredShim$3 = 1;
  var keys2 = requireKeys(), value2 = validValue, max2 = Math.max;
  shim$3 = function(dest, src) {
    var error, i, length = max2(arguments.length, 2), assign2;
    dest = Object(value2(dest));
    assign2 = function(key) {
      try {
        dest[key] = src[key];
      } catch (e) {
        if (!error) error = e;
      }
    };
    for (i = 1; i < length; ++i) {
      src = arguments[i];
      keys2(src).forEach(assign2);
    }
    if (error !== void 0) throw error;
    return dest;
  };
  return shim$3;
}
var assign$1 = isImplemented$6() ? Object.assign : requireShim$3();
var isValue$3 = isValue$6;
var map$1 = { function: true, object: true };
var isObject$1 = function(value2) {
  return isValue$3(value2) && map$1[typeof value2] || false;
};
(function(module2) {
  var assign2 = assign$1, isObject2 = isObject$1, isValue2 = isValue$6, captureStackTrace = Error.captureStackTrace;
  module2.exports = function(message) {
    var err = new Error(message), code = arguments[1], ext = arguments[2];
    if (!isValue2(ext)) {
      if (isObject2(code)) {
        ext = code;
        code = null;
      }
    }
    if (isValue2(ext)) assign2(err, ext);
    if (isValue2(code)) err.code = code;
    if (captureStackTrace) captureStackTrace(err, module2.exports);
    return err;
  };
})(custom);
var customExports = custom.exports;
var _defineLength = { exports: {} };
var mixin$1;
var hasRequiredMixin;
function requireMixin() {
  if (hasRequiredMixin) return mixin$1;
  hasRequiredMixin = 1;
  var value2 = validValue, defineProperty2 = Object.defineProperty, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor, getOwnPropertyNames = Object.getOwnPropertyNames, getOwnPropertySymbols2 = Object.getOwnPropertySymbols;
  mixin$1 = function(target, source) {
    var error, sourceObject = Object(value2(source));
    target = Object(value2(target));
    getOwnPropertyNames(sourceObject).forEach(function(name) {
      try {
        defineProperty2(target, name, getOwnPropertyDescriptor(source, name));
      } catch (e) {
        error = e;
      }
    });
    if (typeof getOwnPropertySymbols2 === "function") {
      getOwnPropertySymbols2(sourceObject).forEach(function(symbol) {
        try {
          defineProperty2(target, symbol, getOwnPropertyDescriptor(source, symbol));
        } catch (e) {
          error = e;
        }
      });
    }
    if (error !== void 0) throw error;
    return target;
  };
  return mixin$1;
}
var toPosInt = toPosInteger;
var test = function(arg1, arg2) {
  return arg2;
};
var desc, defineProperty, generate, mixin;
try {
  Object.defineProperty(test, "length", {
    configurable: true,
    writable: false,
    enumerable: false,
    value: 1
  });
} catch (ignore) {
}
if (test.length === 1) {
  desc = { configurable: true, writable: false, enumerable: false };
  defineProperty = Object.defineProperty;
  _defineLength.exports = function(fn, length) {
    length = toPosInt(length);
    if (fn.length === length) return fn;
    desc.value = length;
    return defineProperty(fn, "length", desc);
  };
} else {
  mixin = requireMixin();
  generate = /* @__PURE__ */ function() {
    var cache = [];
    return function(length) {
      var args, i = 0;
      if (cache[length]) return cache[length];
      args = [];
      while (length--) args.push("a" + (++i).toString(36));
      return new Function(
        "fn",
        "return function (" + args.join(", ") + ") { return fn.apply(this, arguments); };"
      );
    };
  }();
  _defineLength.exports = function(src, length) {
    var target;
    length = toPosInt(length);
    if (src.length === length) return src;
    target = generate(length)(src);
    try {
      mixin(target, src);
    } catch (ignore) {
    }
    return target;
  };
}
var _defineLengthExports = _defineLength.exports;
var d$2 = { exports: {} };
var _undefined = void 0;
var is$4 = function(value2) {
  return value2 !== _undefined && value2 !== null;
};
var isValue$2 = is$4;
var possibleTypes = {
  "object": true,
  "function": true,
  "undefined": true
  /* document.all */
};
var is$3 = function(value2) {
  if (!isValue$2(value2)) return false;
  return hasOwnProperty.call(possibleTypes, typeof value2);
};
var isObject = is$3;
var is$2 = function(value2) {
  if (!isObject(value2)) return false;
  try {
    if (!value2.constructor) return false;
    return value2.constructor.prototype === value2;
  } catch (error) {
    return false;
  }
};
var isPrototype = is$2;
var is$1 = function(value2) {
  if (typeof value2 !== "function") return false;
  if (!hasOwnProperty.call(value2, "length")) return false;
  try {
    if (typeof value2.length !== "number") return false;
    if (typeof value2.call !== "function") return false;
    if (typeof value2.apply !== "function") return false;
  } catch (error) {
    return false;
  }
  return !isPrototype(value2);
};
var isFunction$1 = is$1;
var classRe = /^\s*class[\s{/}]/, functionToString = Function.prototype.toString;
var is = function(value2) {
  if (!isFunction$1(value2)) return false;
  if (classRe.test(functionToString.call(value2))) return false;
  return true;
};
var str = "razdwatrzy";
var isImplemented$4 = function() {
  if (typeof str.contains !== "function") return false;
  return str.contains("dwa") === true && str.contains("foo") === false;
};
var shim$2;
var hasRequiredShim$2;
function requireShim$2() {
  if (hasRequiredShim$2) return shim$2;
  hasRequiredShim$2 = 1;
  var indexOf = String.prototype.indexOf;
  shim$2 = function(searchString) {
    return indexOf.call(this, searchString, arguments[1]) > -1;
  };
  return shim$2;
}
var contains$1 = isImplemented$4() ? String.prototype.contains : requireShim$2();
var isValue$1 = is$4, isPlainFunction = is, assign = assign$1, normalizeOpts$1 = normalizeOptions, contains = contains$1;
var d$1 = d$2.exports = function(dscr, value2) {
  var c, e, w, options, desc2;
  if (arguments.length < 2 || typeof dscr !== "string") {
    options = value2;
    value2 = dscr;
    dscr = null;
  } else {
    options = arguments[2];
  }
  if (isValue$1(dscr)) {
    c = contains.call(dscr, "c");
    e = contains.call(dscr, "e");
    w = contains.call(dscr, "w");
  } else {
    c = w = true;
    e = false;
  }
  desc2 = { value: value2, configurable: c, enumerable: e, writable: w };
  return !options ? desc2 : assign(normalizeOpts$1(options), desc2);
};
d$1.gs = function(dscr, get2, set) {
  var c, e, options, desc2;
  if (typeof dscr !== "string") {
    options = set;
    set = get2;
    get2 = dscr;
    dscr = null;
  } else {
    options = arguments[3];
  }
  if (!isValue$1(get2)) {
    get2 = void 0;
  } else if (!isPlainFunction(get2)) {
    options = get2;
    get2 = set = void 0;
  } else if (!isValue$1(set)) {
    set = void 0;
  } else if (!isPlainFunction(set)) {
    options = set;
    set = void 0;
  }
  if (isValue$1(dscr)) {
    c = contains.call(dscr, "c");
    e = contains.call(dscr, "e");
  } else {
    c = true;
    e = false;
  }
  desc2 = { get: get2, set, configurable: c, enumerable: e };
  return !options ? desc2 : assign(normalizeOpts$1(options), desc2);
};
var dExports = d$2.exports;
var eventEmitter = { exports: {} };
(function(module2, exports2) {
  var d2 = dExports, callable2 = validCallable, apply2 = Function.prototype.apply, call2 = Function.prototype.call, create2 = Object.create, defineProperty2 = Object.defineProperty, defineProperties2 = Object.defineProperties, hasOwnProperty2 = Object.prototype.hasOwnProperty, descriptor = { configurable: true, enumerable: false, writable: true }, on2, once, off, emit2, methods, descriptors, base;
  on2 = function(type, listener) {
    var data;
    callable2(listener);
    if (!hasOwnProperty2.call(this, "__ee__")) {
      data = descriptor.value = create2(null);
      defineProperty2(this, "__ee__", descriptor);
      descriptor.value = null;
    } else {
      data = this.__ee__;
    }
    if (!data[type]) data[type] = listener;
    else if (typeof data[type] === "object") data[type].push(listener);
    else data[type] = [data[type], listener];
    return this;
  };
  once = function(type, listener) {
    var once2, self3;
    callable2(listener);
    self3 = this;
    on2.call(this, type, once2 = function() {
      off.call(self3, type, once2);
      apply2.call(listener, this, arguments);
    });
    once2.__eeOnceListener__ = listener;
    return this;
  };
  off = function(type, listener) {
    var data, listeners, candidate, i;
    callable2(listener);
    if (!hasOwnProperty2.call(this, "__ee__")) return this;
    data = this.__ee__;
    if (!data[type]) return this;
    listeners = data[type];
    if (typeof listeners === "object") {
      for (i = 0; candidate = listeners[i]; ++i) {
        if (candidate === listener || candidate.__eeOnceListener__ === listener) {
          if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
          else listeners.splice(i, 1);
        }
      }
    } else {
      if (listeners === listener || listeners.__eeOnceListener__ === listener) {
        delete data[type];
      }
    }
    return this;
  };
  emit2 = function(type) {
    var i, l, listener, listeners, args;
    if (!hasOwnProperty2.call(this, "__ee__")) return;
    listeners = this.__ee__[type];
    if (!listeners) return;
    if (typeof listeners === "object") {
      l = arguments.length;
      args = new Array(l - 1);
      for (i = 1; i < l; ++i) args[i - 1] = arguments[i];
      listeners = listeners.slice();
      for (i = 0; listener = listeners[i]; ++i) {
        apply2.call(listener, this, args);
      }
    } else {
      switch (arguments.length) {
        case 1:
          call2.call(listeners, this);
          break;
        case 2:
          call2.call(listeners, this, arguments[1]);
          break;
        case 3:
          call2.call(listeners, this, arguments[1], arguments[2]);
          break;
        default:
          l = arguments.length;
          args = new Array(l - 1);
          for (i = 1; i < l; ++i) {
            args[i - 1] = arguments[i];
          }
          apply2.call(listeners, this, args);
      }
    }
  };
  methods = {
    on: on2,
    once,
    off,
    emit: emit2
  };
  descriptors = {
    on: d2(on2),
    once: d2(once),
    off: d2(off),
    emit: d2(emit2)
  };
  base = defineProperties2({}, descriptors);
  module2.exports = exports2 = function(o) {
    return o == null ? create2(base) : defineProperties2(Object(o), descriptors);
  };
  exports2.methods = methods;
})(eventEmitter, eventEmitter.exports);
var eventEmitterExports = eventEmitter.exports;
var isImplemented$3;
var hasRequiredIsImplemented$3;
function requireIsImplemented$3() {
  if (hasRequiredIsImplemented$3) return isImplemented$3;
  hasRequiredIsImplemented$3 = 1;
  isImplemented$3 = function() {
    var from2 = Array.from, arr, result;
    if (typeof from2 !== "function") return false;
    arr = ["raz", "dwa"];
    result = from2(arr);
    return Boolean(result && result !== arr && result[1] === "dwa");
  };
  return isImplemented$3;
}
var isImplemented$2;
var hasRequiredIsImplemented$2;
function requireIsImplemented$2() {
  if (hasRequiredIsImplemented$2) return isImplemented$2;
  hasRequiredIsImplemented$2 = 1;
  isImplemented$2 = function() {
    if (typeof globalThis !== "object") return false;
    if (!globalThis) return false;
    return globalThis.Array === Array;
  };
  return isImplemented$2;
}
var implementation;
var hasRequiredImplementation;
function requireImplementation() {
  if (hasRequiredImplementation) return implementation;
  hasRequiredImplementation = 1;
  var naiveFallback = function() {
    if (typeof self === "object" && self) return self;
    if (typeof window === "object" && window) return window;
    throw new Error("Unable to resolve global `this`");
  };
  implementation = function() {
    if (this) return this;
    try {
      Object.defineProperty(Object.prototype, "__global__", {
        get: function() {
          return this;
        },
        configurable: true
      });
    } catch (error) {
      return naiveFallback();
    }
    try {
      if (!__global__) return naiveFallback();
      return __global__;
    } finally {
      delete Object.prototype.__global__;
    }
  }();
  return implementation;
}
var globalThis_1;
var hasRequiredGlobalThis;
function requireGlobalThis() {
  if (hasRequiredGlobalThis) return globalThis_1;
  hasRequiredGlobalThis = 1;
  globalThis_1 = requireIsImplemented$2()() ? globalThis : requireImplementation();
  return globalThis_1;
}
var isImplemented$1;
var hasRequiredIsImplemented$1;
function requireIsImplemented$1() {
  if (hasRequiredIsImplemented$1) return isImplemented$1;
  hasRequiredIsImplemented$1 = 1;
  var global2 = requireGlobalThis(), validTypes = { object: true, symbol: true };
  isImplemented$1 = function() {
    var Symbol2 = global2.Symbol;
    var symbol;
    if (typeof Symbol2 !== "function") return false;
    symbol = Symbol2("test symbol");
    try {
      String(symbol);
    } catch (e) {
      return false;
    }
    if (!validTypes[typeof Symbol2.iterator]) return false;
    if (!validTypes[typeof Symbol2.toPrimitive]) return false;
    if (!validTypes[typeof Symbol2.toStringTag]) return false;
    return true;
  };
  return isImplemented$1;
}
var isSymbol;
var hasRequiredIsSymbol;
function requireIsSymbol() {
  if (hasRequiredIsSymbol) return isSymbol;
  hasRequiredIsSymbol = 1;
  isSymbol = function(value2) {
    if (!value2) return false;
    if (typeof value2 === "symbol") return true;
    if (!value2.constructor) return false;
    if (value2.constructor.name !== "Symbol") return false;
    return value2[value2.constructor.toStringTag] === "Symbol";
  };
  return isSymbol;
}
var validateSymbol;
var hasRequiredValidateSymbol;
function requireValidateSymbol() {
  if (hasRequiredValidateSymbol) return validateSymbol;
  hasRequiredValidateSymbol = 1;
  var isSymbol2 = requireIsSymbol();
  validateSymbol = function(value2) {
    if (!isSymbol2(value2)) throw new TypeError(value2 + " is not a symbol");
    return value2;
  };
  return validateSymbol;
}
var generateName;
var hasRequiredGenerateName;
function requireGenerateName() {
  if (hasRequiredGenerateName) return generateName;
  hasRequiredGenerateName = 1;
  var d2 = dExports;
  var create2 = Object.create, defineProperty2 = Object.defineProperty, objPrototype = Object.prototype;
  var created = create2(null);
  generateName = function(desc2) {
    var postfix = 0, name, ie11BugWorkaround;
    while (created[desc2 + (postfix || "")]) ++postfix;
    desc2 += postfix || "";
    created[desc2] = true;
    name = "@@" + desc2;
    defineProperty2(
      objPrototype,
      name,
      d2.gs(null, function(value2) {
        if (ie11BugWorkaround) return;
        ie11BugWorkaround = true;
        defineProperty2(this, name, d2(value2));
        ie11BugWorkaround = false;
      })
    );
    return name;
  };
  return generateName;
}
var standardSymbols;
var hasRequiredStandardSymbols;
function requireStandardSymbols() {
  if (hasRequiredStandardSymbols) return standardSymbols;
  hasRequiredStandardSymbols = 1;
  var d2 = dExports, NativeSymbol = requireGlobalThis().Symbol;
  standardSymbols = function(SymbolPolyfill) {
    return Object.defineProperties(SymbolPolyfill, {
      // To ensure proper interoperability with other native functions (e.g. Array.from)
      // fallback to eventual native implementation of given symbol
      hasInstance: d2(
        "",
        NativeSymbol && NativeSymbol.hasInstance || SymbolPolyfill("hasInstance")
      ),
      isConcatSpreadable: d2(
        "",
        NativeSymbol && NativeSymbol.isConcatSpreadable || SymbolPolyfill("isConcatSpreadable")
      ),
      iterator: d2("", NativeSymbol && NativeSymbol.iterator || SymbolPolyfill("iterator")),
      match: d2("", NativeSymbol && NativeSymbol.match || SymbolPolyfill("match")),
      replace: d2("", NativeSymbol && NativeSymbol.replace || SymbolPolyfill("replace")),
      search: d2("", NativeSymbol && NativeSymbol.search || SymbolPolyfill("search")),
      species: d2("", NativeSymbol && NativeSymbol.species || SymbolPolyfill("species")),
      split: d2("", NativeSymbol && NativeSymbol.split || SymbolPolyfill("split")),
      toPrimitive: d2(
        "",
        NativeSymbol && NativeSymbol.toPrimitive || SymbolPolyfill("toPrimitive")
      ),
      toStringTag: d2(
        "",
        NativeSymbol && NativeSymbol.toStringTag || SymbolPolyfill("toStringTag")
      ),
      unscopables: d2(
        "",
        NativeSymbol && NativeSymbol.unscopables || SymbolPolyfill("unscopables")
      )
    });
  };
  return standardSymbols;
}
var symbolRegistry;
var hasRequiredSymbolRegistry;
function requireSymbolRegistry() {
  if (hasRequiredSymbolRegistry) return symbolRegistry;
  hasRequiredSymbolRegistry = 1;
  var d2 = dExports, validateSymbol2 = requireValidateSymbol();
  var registry = /* @__PURE__ */ Object.create(null);
  symbolRegistry = function(SymbolPolyfill) {
    return Object.defineProperties(SymbolPolyfill, {
      for: d2(function(key) {
        if (registry[key]) return registry[key];
        return registry[key] = SymbolPolyfill(String(key));
      }),
      keyFor: d2(function(symbol) {
        var key;
        validateSymbol2(symbol);
        for (key in registry) {
          if (registry[key] === symbol) return key;
        }
        return void 0;
      })
    });
  };
  return symbolRegistry;
}
var polyfill;
var hasRequiredPolyfill;
function requirePolyfill() {
  if (hasRequiredPolyfill) return polyfill;
  hasRequiredPolyfill = 1;
  var d2 = dExports, validateSymbol2 = requireValidateSymbol(), NativeSymbol = requireGlobalThis().Symbol, generateName2 = requireGenerateName(), setupStandardSymbols = requireStandardSymbols(), setupSymbolRegistry = requireSymbolRegistry();
  var create2 = Object.create, defineProperties2 = Object.defineProperties, defineProperty2 = Object.defineProperty;
  var SymbolPolyfill, HiddenSymbol, isNativeSafe;
  if (typeof NativeSymbol === "function") {
    try {
      String(NativeSymbol());
      isNativeSafe = true;
    } catch (ignore) {
    }
  } else {
    NativeSymbol = null;
  }
  HiddenSymbol = function Symbol2(description) {
    if (this instanceof HiddenSymbol) throw new TypeError("Symbol is not a constructor");
    return SymbolPolyfill(description);
  };
  polyfill = SymbolPolyfill = function Symbol2(description) {
    var symbol;
    if (this instanceof Symbol2) throw new TypeError("Symbol is not a constructor");
    if (isNativeSafe) return NativeSymbol(description);
    symbol = create2(HiddenSymbol.prototype);
    description = description === void 0 ? "" : String(description);
    return defineProperties2(symbol, {
      __description__: d2("", description),
      __name__: d2("", generateName2(description))
    });
  };
  setupStandardSymbols(SymbolPolyfill);
  setupSymbolRegistry(SymbolPolyfill);
  defineProperties2(HiddenSymbol.prototype, {
    constructor: d2(SymbolPolyfill),
    toString: d2("", function() {
      return this.__name__;
    })
  });
  defineProperties2(SymbolPolyfill.prototype, {
    toString: d2(function() {
      return "Symbol (" + validateSymbol2(this).__description__ + ")";
    }),
    valueOf: d2(function() {
      return validateSymbol2(this);
    })
  });
  defineProperty2(
    SymbolPolyfill.prototype,
    SymbolPolyfill.toPrimitive,
    d2("", function() {
      var symbol = validateSymbol2(this);
      if (typeof symbol === "symbol") return symbol;
      return symbol.toString();
    })
  );
  defineProperty2(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d2("c", "Symbol"));
  defineProperty2(
    HiddenSymbol.prototype,
    SymbolPolyfill.toStringTag,
    d2("c", SymbolPolyfill.prototype[SymbolPolyfill.toStringTag])
  );
  defineProperty2(
    HiddenSymbol.prototype,
    SymbolPolyfill.toPrimitive,
    d2("c", SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive])
  );
  return polyfill;
}
var es6Symbol;
var hasRequiredEs6Symbol;
function requireEs6Symbol() {
  if (hasRequiredEs6Symbol) return es6Symbol;
  hasRequiredEs6Symbol = 1;
  es6Symbol = requireIsImplemented$1()() ? requireGlobalThis().Symbol : requirePolyfill();
  return es6Symbol;
}
var isArguments;
var hasRequiredIsArguments;
function requireIsArguments() {
  if (hasRequiredIsArguments) return isArguments;
  hasRequiredIsArguments = 1;
  var objToString = Object.prototype.toString, id = objToString.call(/* @__PURE__ */ function() {
    return arguments;
  }());
  isArguments = function(value2) {
    return objToString.call(value2) === id;
  };
  return isArguments;
}
var isFunction;
var hasRequiredIsFunction;
function requireIsFunction() {
  if (hasRequiredIsFunction) return isFunction;
  hasRequiredIsFunction = 1;
  var objToString = Object.prototype.toString, isFunctionStringTag = RegExp.prototype.test.bind(/^[object [A-Za-z0-9]*Function]$/);
  isFunction = function(value2) {
    return typeof value2 === "function" && isFunctionStringTag(objToString.call(value2));
  };
  return isFunction;
}
var isString;
var hasRequiredIsString;
function requireIsString() {
  if (hasRequiredIsString) return isString;
  hasRequiredIsString = 1;
  var objToString = Object.prototype.toString, id = objToString.call("");
  isString = function(value2) {
    return typeof value2 === "string" || value2 && typeof value2 === "object" && (value2 instanceof String || objToString.call(value2) === id) || false;
  };
  return isString;
}
var shim$1;
var hasRequiredShim$1;
function requireShim$1() {
  if (hasRequiredShim$1) return shim$1;
  hasRequiredShim$1 = 1;
  var iteratorSymbol = requireEs6Symbol().iterator, isArguments2 = requireIsArguments(), isFunction2 = requireIsFunction(), toPosInt2 = toPosInteger, callable2 = validCallable, validValue$1 = validValue, isValue2 = isValue$6, isString2 = requireIsString(), isArray2 = Array.isArray, call2 = Function.prototype.call, desc2 = { configurable: true, enumerable: true, writable: true, value: null }, defineProperty2 = Object.defineProperty;
  shim$1 = function(arrayLike) {
    var mapFn = arguments[1], thisArg = arguments[2], Context, i, j, arr, length, code, iterator, result, getIterator, value2;
    arrayLike = Object(validValue$1(arrayLike));
    if (isValue2(mapFn)) callable2(mapFn);
    if (!this || this === Array || !isFunction2(this)) {
      if (!mapFn) {
        if (isArguments2(arrayLike)) {
          length = arrayLike.length;
          if (length !== 1) return Array.apply(null, arrayLike);
          arr = new Array(1);
          arr[0] = arrayLike[0];
          return arr;
        }
        if (isArray2(arrayLike)) {
          arr = new Array(length = arrayLike.length);
          for (i = 0; i < length; ++i) arr[i] = arrayLike[i];
          return arr;
        }
      }
      arr = [];
    } else {
      Context = this;
    }
    if (!isArray2(arrayLike)) {
      if ((getIterator = arrayLike[iteratorSymbol]) !== void 0) {
        iterator = callable2(getIterator).call(arrayLike);
        if (Context) arr = new Context();
        result = iterator.next();
        i = 0;
        while (!result.done) {
          value2 = mapFn ? call2.call(mapFn, thisArg, result.value, i) : result.value;
          if (Context) {
            desc2.value = value2;
            defineProperty2(arr, i, desc2);
          } else {
            arr[i] = value2;
          }
          result = iterator.next();
          ++i;
        }
        length = i;
      } else if (isString2(arrayLike)) {
        length = arrayLike.length;
        if (Context) arr = new Context();
        for (i = 0, j = 0; i < length; ++i) {
          value2 = arrayLike[i];
          if (i + 1 < length) {
            code = value2.charCodeAt(0);
            if (code >= 55296 && code <= 56319) value2 += arrayLike[++i];
          }
          value2 = mapFn ? call2.call(mapFn, thisArg, value2, j) : value2;
          if (Context) {
            desc2.value = value2;
            defineProperty2(arr, j, desc2);
          } else {
            arr[j] = value2;
          }
          ++j;
        }
        length = j;
      }
    }
    if (length === void 0) {
      length = toPosInt2(arrayLike.length);
      if (Context) arr = new Context(length);
      for (i = 0; i < length; ++i) {
        value2 = mapFn ? call2.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
        if (Context) {
          desc2.value = value2;
          defineProperty2(arr, i, desc2);
        } else {
          arr[i] = value2;
        }
      }
    }
    if (Context) {
      desc2.value = null;
      arr.length = length;
    }
    return arr;
  };
  return shim$1;
}
var from$1;
var hasRequiredFrom;
function requireFrom() {
  if (hasRequiredFrom) return from$1;
  hasRequiredFrom = 1;
  from$1 = requireIsImplemented$3()() ? Array.from : requireShim$1();
  return from$1;
}
var from = requireFrom(), isArray = Array.isArray;
var toArray$1 = function(arrayLike) {
  return isArray(arrayLike) ? arrayLike : from(arrayLike);
};
var toArray = toArray$1, isValue = isValue$6, callable$2 = validCallable;
var slice = Array.prototype.slice, resolveArgs;
resolveArgs = function(args) {
  return this.map(function(resolve, i) {
    return resolve ? resolve(args[i]) : args[i];
  }).concat(
    slice.call(args, this.length)
  );
};
var resolveResolve$1 = function(resolvers) {
  resolvers = toArray(resolvers);
  resolvers.forEach(function(resolve) {
    if (isValue(resolve)) callable$2(resolve);
  });
  return resolveArgs.bind(resolvers);
};
var callable$1 = validCallable;
var resolveNormalize$1 = function(userNormalizer) {
  var normalizer;
  if (typeof userNormalizer === "function") return { set: userNormalizer, get: userNormalizer };
  normalizer = { get: callable$1(userNormalizer.get) };
  if (userNormalizer.set !== void 0) {
    normalizer.set = callable$1(userNormalizer.set);
    if (userNormalizer.delete) normalizer.delete = callable$1(userNormalizer.delete);
    if (userNormalizer.clear) normalizer.clear = callable$1(userNormalizer.clear);
    return normalizer;
  }
  normalizer.set = normalizer.get;
  return normalizer;
};
var customError = customExports, defineLength = _defineLengthExports, d = dExports, ee = eventEmitterExports.methods, resolveResolve = resolveResolve$1, resolveNormalize = resolveNormalize$1;
var apply = Function.prototype.apply, call = Function.prototype.call, create = Object.create, defineProperties = Object.defineProperties, on = ee.on, emit = ee.emit;
var configureMap = function(original, length, options) {
  var cache = create(null), conf, memLength, get2, set, del, clear, extDel, extGet, extHas, normalizer, getListeners, setListeners, deleteListeners, memoized, resolve;
  if (length !== false) memLength = length;
  else if (isNaN(original.length)) memLength = 1;
  else memLength = original.length;
  if (options.normalizer) {
    normalizer = resolveNormalize(options.normalizer);
    get2 = normalizer.get;
    set = normalizer.set;
    del = normalizer.delete;
    clear = normalizer.clear;
  }
  if (options.resolvers != null) resolve = resolveResolve(options.resolvers);
  if (get2) {
    memoized = defineLength(function(arg) {
      var id, result, args = arguments;
      if (resolve) args = resolve(args);
      id = get2(args);
      if (id !== null) {
        if (hasOwnProperty.call(cache, id)) {
          if (getListeners) conf.emit("get", id, args, this);
          return cache[id];
        }
      }
      if (args.length === 1) result = call.call(original, this, args[0]);
      else result = apply.call(original, this, args);
      if (id === null) {
        id = get2(args);
        if (id !== null) throw customError("Circular invocation", "CIRCULAR_INVOCATION");
        id = set(args);
      } else if (hasOwnProperty.call(cache, id)) {
        throw customError("Circular invocation", "CIRCULAR_INVOCATION");
      }
      cache[id] = result;
      if (setListeners) conf.emit("set", id, null, result);
      return result;
    }, memLength);
  } else if (length === 0) {
    memoized = function() {
      var result;
      if (hasOwnProperty.call(cache, "data")) {
        if (getListeners) conf.emit("get", "data", arguments, this);
        return cache.data;
      }
      if (arguments.length) result = apply.call(original, this, arguments);
      else result = call.call(original, this);
      if (hasOwnProperty.call(cache, "data")) {
        throw customError("Circular invocation", "CIRCULAR_INVOCATION");
      }
      cache.data = result;
      if (setListeners) conf.emit("set", "data", null, result);
      return result;
    };
  } else {
    memoized = function(arg) {
      var result, args = arguments, id;
      if (resolve) args = resolve(arguments);
      id = String(args[0]);
      if (hasOwnProperty.call(cache, id)) {
        if (getListeners) conf.emit("get", id, args, this);
        return cache[id];
      }
      if (args.length === 1) result = call.call(original, this, args[0]);
      else result = apply.call(original, this, args);
      if (hasOwnProperty.call(cache, id)) {
        throw customError("Circular invocation", "CIRCULAR_INVOCATION");
      }
      cache[id] = result;
      if (setListeners) conf.emit("set", id, null, result);
      return result;
    };
  }
  conf = {
    original,
    memoized,
    profileName: options.profileName,
    get: function(args) {
      if (resolve) args = resolve(args);
      if (get2) return get2(args);
      return String(args[0]);
    },
    has: function(id) {
      return hasOwnProperty.call(cache, id);
    },
    delete: function(id) {
      var result;
      if (!hasOwnProperty.call(cache, id)) return;
      if (del) del(id);
      result = cache[id];
      delete cache[id];
      if (deleteListeners) conf.emit("delete", id, result);
    },
    clear: function() {
      var oldCache = cache;
      if (clear) clear();
      cache = create(null);
      conf.emit("clear", oldCache);
    },
    on: function(type, listener) {
      if (type === "get") getListeners = true;
      else if (type === "set") setListeners = true;
      else if (type === "delete") deleteListeners = true;
      return on.call(this, type, listener);
    },
    emit,
    updateEnv: function() {
      original = conf.original;
    }
  };
  if (get2) {
    extDel = defineLength(function(arg) {
      var id, args = arguments;
      if (resolve) args = resolve(args);
      id = get2(args);
      if (id === null) return;
      conf.delete(id);
    }, memLength);
  } else if (length === 0) {
    extDel = function() {
      return conf.delete("data");
    };
  } else {
    extDel = function(arg) {
      if (resolve) arg = resolve(arguments)[0];
      return conf.delete(arg);
    };
  }
  extGet = defineLength(function() {
    var id, args = arguments;
    if (length === 0) return cache.data;
    if (resolve) args = resolve(args);
    if (get2) id = get2(args);
    else id = String(args[0]);
    return cache[id];
  });
  extHas = defineLength(function() {
    var id, args = arguments;
    if (length === 0) return conf.has("data");
    if (resolve) args = resolve(args);
    if (get2) id = get2(args);
    else id = String(args[0]);
    if (id === null) return false;
    return conf.has(id);
  });
  defineProperties(memoized, {
    __memoized__: d(true),
    delete: d(extDel),
    clear: d(conf.clear),
    _get: d(extGet),
    _has: d(extHas)
  });
  return conf;
};
var callable = validCallable, forEach = forEach$1, extensions = registeredExtensions, configure = configureMap, resolveLength$1 = resolveLength$2;
var plain$1 = function self2(fn) {
  var options, length, conf;
  callable(fn);
  options = Object(arguments[1]);
  if (options.async && options.promise) {
    throw new Error("Options 'async' and 'promise' cannot be used together");
  }
  if (hasOwnProperty.call(fn, "__memoized__") && !options.force) return fn;
  length = resolveLength$1(options.length, fn.length, options.async && extensions.async);
  conf = configure(fn, length, options);
  forEach(extensions, function(extFn, name) {
    if (options[name]) extFn(options[name], conf, options);
  });
  if (self2.__profiler__) self2.__profiler__(conf);
  conf.updateEnv();
  return conf.memoized;
};
var primitive;
var hasRequiredPrimitive;
function requirePrimitive() {
  if (hasRequiredPrimitive) return primitive;
  hasRequiredPrimitive = 1;
  primitive = function(args) {
    var id, i, length = args.length;
    if (!length) return "";
    id = String(args[i = 0]);
    while (--length) id += "" + args[++i];
    return id;
  };
  return primitive;
}
var getPrimitiveFixed;
var hasRequiredGetPrimitiveFixed;
function requireGetPrimitiveFixed() {
  if (hasRequiredGetPrimitiveFixed) return getPrimitiveFixed;
  hasRequiredGetPrimitiveFixed = 1;
  getPrimitiveFixed = function(length) {
    if (!length) {
      return function() {
        return "";
      };
    }
    return function(args) {
      var id = String(args[0]), i = 0, currentLength = length;
      while (--currentLength) {
        id += "" + args[++i];
      }
      return id;
    };
  };
  return getPrimitiveFixed;
}
var isImplemented;
var hasRequiredIsImplemented;
function requireIsImplemented() {
  if (hasRequiredIsImplemented) return isImplemented;
  hasRequiredIsImplemented = 1;
  isImplemented = function() {
    var numberIsNaN = Number.isNaN;
    if (typeof numberIsNaN !== "function") return false;
    return !numberIsNaN({}) && numberIsNaN(NaN) && !numberIsNaN(34);
  };
  return isImplemented;
}
var shim;
var hasRequiredShim;
function requireShim() {
  if (hasRequiredShim) return shim;
  hasRequiredShim = 1;
  shim = function(value2) {
    return value2 !== value2;
  };
  return shim;
}
var isNan;
var hasRequiredIsNan;
function requireIsNan() {
  if (hasRequiredIsNan) return isNan;
  hasRequiredIsNan = 1;
  isNan = requireIsImplemented()() ? Number.isNaN : requireShim();
  return isNan;
}
var eIndexOf;
var hasRequiredEIndexOf;
function requireEIndexOf() {
  if (hasRequiredEIndexOf) return eIndexOf;
  hasRequiredEIndexOf = 1;
  var numberIsNaN = requireIsNan(), toPosInt2 = toPosInteger, value2 = validValue, indexOf = Array.prototype.indexOf, objHasOwnProperty = Object.prototype.hasOwnProperty, abs2 = Math.abs, floor2 = Math.floor;
  eIndexOf = function(searchElement) {
    var i, length, fromIndex, val;
    if (!numberIsNaN(searchElement)) return indexOf.apply(this, arguments);
    length = toPosInt2(value2(this).length);
    fromIndex = arguments[1];
    if (isNaN(fromIndex)) fromIndex = 0;
    else if (fromIndex >= 0) fromIndex = floor2(fromIndex);
    else fromIndex = toPosInt2(this.length) - floor2(abs2(fromIndex));
    for (i = fromIndex; i < length; ++i) {
      if (objHasOwnProperty.call(this, i)) {
        val = this[i];
        if (numberIsNaN(val)) return i;
      }
    }
    return -1;
  };
  return eIndexOf;
}
var get;
var hasRequiredGet;
function requireGet() {
  if (hasRequiredGet) return get;
  hasRequiredGet = 1;
  var indexOf = requireEIndexOf();
  var create2 = Object.create;
  get = function() {
    var lastId = 0, map2 = [], cache = create2(null);
    return {
      get: function(args) {
        var index = 0, set = map2, i, length = args.length;
        if (length === 0) return set[length] || null;
        if (set = set[length]) {
          while (index < length - 1) {
            i = indexOf.call(set[0], args[index]);
            if (i === -1) return null;
            set = set[1][i];
            ++index;
          }
          i = indexOf.call(set[0], args[index]);
          if (i === -1) return null;
          return set[1][i] || null;
        }
        return null;
      },
      set: function(args) {
        var index = 0, set = map2, i, length = args.length;
        if (length === 0) {
          set[length] = ++lastId;
        } else {
          if (!set[length]) {
            set[length] = [[], []];
          }
          set = set[length];
          while (index < length - 1) {
            i = indexOf.call(set[0], args[index]);
            if (i === -1) {
              i = set[0].push(args[index]) - 1;
              set[1].push([[], []]);
            }
            set = set[1][i];
            ++index;
          }
          i = indexOf.call(set[0], args[index]);
          if (i === -1) {
            i = set[0].push(args[index]) - 1;
          }
          set[1][i] = ++lastId;
        }
        cache[lastId] = args;
        return lastId;
      },
      delete: function(id) {
        var index = 0, set = map2, i, args = cache[id], length = args.length, path = [];
        if (length === 0) {
          delete set[length];
        } else if (set = set[length]) {
          while (index < length - 1) {
            i = indexOf.call(set[0], args[index]);
            if (i === -1) {
              return;
            }
            path.push(set, i);
            set = set[1][i];
            ++index;
          }
          i = indexOf.call(set[0], args[index]);
          if (i === -1) {
            return;
          }
          id = set[1][i];
          set[0].splice(i, 1);
          set[1].splice(i, 1);
          while (!set[0].length && path.length) {
            i = path.pop();
            set = path.pop();
            set[0].splice(i, 1);
            set[1].splice(i, 1);
          }
        }
        delete cache[id];
      },
      clear: function() {
        map2 = [];
        cache = create2(null);
      }
    };
  };
  return get;
}
var get1;
var hasRequiredGet1;
function requireGet1() {
  if (hasRequiredGet1) return get1;
  hasRequiredGet1 = 1;
  var indexOf = requireEIndexOf();
  get1 = function() {
    var lastId = 0, argsMap = [], cache = [];
    return {
      get: function(args) {
        var index = indexOf.call(argsMap, args[0]);
        return index === -1 ? null : cache[index];
      },
      set: function(args) {
        argsMap.push(args[0]);
        cache.push(++lastId);
        return lastId;
      },
      delete: function(id) {
        var index = indexOf.call(cache, id);
        if (index !== -1) {
          argsMap.splice(index, 1);
          cache.splice(index, 1);
        }
      },
      clear: function() {
        argsMap = [];
        cache = [];
      }
    };
  };
  return get1;
}
var getFixed;
var hasRequiredGetFixed;
function requireGetFixed() {
  if (hasRequiredGetFixed) return getFixed;
  hasRequiredGetFixed = 1;
  var indexOf = requireEIndexOf(), create2 = Object.create;
  getFixed = function(length) {
    var lastId = 0, map2 = [[], []], cache = create2(null);
    return {
      get: function(args) {
        var index = 0, set = map2, i;
        while (index < length - 1) {
          i = indexOf.call(set[0], args[index]);
          if (i === -1) return null;
          set = set[1][i];
          ++index;
        }
        i = indexOf.call(set[0], args[index]);
        if (i === -1) return null;
        return set[1][i] || null;
      },
      set: function(args) {
        var index = 0, set = map2, i;
        while (index < length - 1) {
          i = indexOf.call(set[0], args[index]);
          if (i === -1) {
            i = set[0].push(args[index]) - 1;
            set[1].push([[], []]);
          }
          set = set[1][i];
          ++index;
        }
        i = indexOf.call(set[0], args[index]);
        if (i === -1) {
          i = set[0].push(args[index]) - 1;
        }
        set[1][i] = ++lastId;
        cache[lastId] = args;
        return lastId;
      },
      delete: function(id) {
        var index = 0, set = map2, i, path = [], args = cache[id];
        while (index < length - 1) {
          i = indexOf.call(set[0], args[index]);
          if (i === -1) {
            return;
          }
          path.push(set, i);
          set = set[1][i];
          ++index;
        }
        i = indexOf.call(set[0], args[index]);
        if (i === -1) {
          return;
        }
        id = set[1][i];
        set[0].splice(i, 1);
        set[1].splice(i, 1);
        while (!set[0].length && path.length) {
          i = path.pop();
          set = path.pop();
          set[0].splice(i, 1);
          set[1].splice(i, 1);
        }
        delete cache[id];
      },
      clear: function() {
        map2 = [[], []];
        cache = create2(null);
      }
    };
  };
  return getFixed;
}
var async = {};
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap) return map;
  hasRequiredMap = 1;
  var callable2 = validCallable, forEach2 = forEach$1, call2 = Function.prototype.call;
  map = function(obj, cb) {
    var result = {}, thisArg = arguments[2];
    callable2(cb);
    forEach2(obj, function(value2, key, targetObj, index) {
      result[key] = call2.call(cb, thisArg, value2, key, targetObj, index);
    });
    return result;
  };
  return map;
}
var nextTick;
var hasRequiredNextTick;
function requireNextTick() {
  if (hasRequiredNextTick) return nextTick;
  hasRequiredNextTick = 1;
  var ensureCallable = function(fn) {
    if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
    return fn;
  };
  var byObserver = function(Observer) {
    var node = document.createTextNode(""), queue, currentQueue, i = 0;
    new Observer(function() {
      var callback;
      if (!queue) {
        if (!currentQueue) return;
        queue = currentQueue;
      } else if (currentQueue) {
        queue = currentQueue.concat(queue);
      }
      currentQueue = queue;
      queue = null;
      if (typeof currentQueue === "function") {
        callback = currentQueue;
        currentQueue = null;
        callback();
        return;
      }
      node.data = i = ++i % 2;
      while (currentQueue) {
        callback = currentQueue.shift();
        if (!currentQueue.length) currentQueue = null;
        callback();
      }
    }).observe(node, { characterData: true });
    return function(fn) {
      ensureCallable(fn);
      if (queue) {
        if (typeof queue === "function") queue = [queue, fn];
        else queue.push(fn);
        return;
      }
      queue = fn;
      node.data = i = ++i % 2;
    };
  };
  nextTick = function() {
    if (typeof process === "object" && process && typeof process.nextTick === "function") {
      return process.nextTick;
    }
    if (typeof queueMicrotask === "function") {
      return function(cb) {
        queueMicrotask(ensureCallable(cb));
      };
    }
    if (typeof document === "object" && document) {
      if (typeof MutationObserver === "function") return byObserver(MutationObserver);
      if (typeof WebKitMutationObserver === "function") return byObserver(WebKitMutationObserver);
    }
    if (typeof setImmediate === "function") {
      return function(cb) {
        setImmediate(ensureCallable(cb));
      };
    }
    if (typeof setTimeout === "function" || typeof setTimeout === "object") {
      return function(cb) {
        setTimeout(ensureCallable(cb), 0);
      };
    }
    return null;
  }();
  return nextTick;
}
var hasRequiredAsync;
function requireAsync() {
  if (hasRequiredAsync) return async;
  hasRequiredAsync = 1;
  var aFrom = requireFrom(), objectMap = requireMap(), mixin2 = requireMixin(), defineLength2 = _defineLengthExports, nextTick2 = requireNextTick();
  var slice2 = Array.prototype.slice, apply2 = Function.prototype.apply, create2 = Object.create;
  registeredExtensions.async = function(tbi, conf) {
    var waiting = create2(null), cache = create2(null), base = conf.memoized, original = conf.original, currentCallback, currentContext, currentArgs;
    conf.memoized = defineLength2(function(arg) {
      var args = arguments, last = args[args.length - 1];
      if (typeof last === "function") {
        currentCallback = last;
        args = slice2.call(args, 0, -1);
      }
      return base.apply(currentContext = this, currentArgs = args);
    }, base);
    try {
      mixin2(conf.memoized, base);
    } catch (ignore) {
    }
    conf.on("get", function(id) {
      var cb, context, args;
      if (!currentCallback) return;
      if (waiting[id]) {
        if (typeof waiting[id] === "function") waiting[id] = [waiting[id], currentCallback];
        else waiting[id].push(currentCallback);
        currentCallback = null;
        return;
      }
      cb = currentCallback;
      context = currentContext;
      args = currentArgs;
      currentCallback = currentContext = currentArgs = null;
      nextTick2(function() {
        var data;
        if (hasOwnProperty.call(cache, id)) {
          data = cache[id];
          conf.emit("getasync", id, args, context);
          apply2.call(cb, data.context, data.args);
        } else {
          currentCallback = cb;
          currentContext = context;
          currentArgs = args;
          base.apply(context, args);
        }
      });
    });
    conf.original = function() {
      var args, cb, origCb, result;
      if (!currentCallback) return apply2.call(original, this, arguments);
      args = aFrom(arguments);
      cb = function self3(err) {
        var cb2, args2, id = self3.id;
        if (id == null) {
          nextTick2(apply2.bind(self3, this, arguments));
          return void 0;
        }
        delete self3.id;
        cb2 = waiting[id];
        delete waiting[id];
        if (!cb2) {
          return void 0;
        }
        args2 = aFrom(arguments);
        if (conf.has(id)) {
          if (err) {
            conf.delete(id);
          } else {
            cache[id] = { context: this, args: args2 };
            conf.emit("setasync", id, typeof cb2 === "function" ? 1 : cb2.length);
          }
        }
        if (typeof cb2 === "function") {
          result = apply2.call(cb2, this, args2);
        } else {
          cb2.forEach(function(cb3) {
            result = apply2.call(cb3, this, args2);
          }, this);
        }
        return result;
      };
      origCb = currentCallback;
      currentCallback = currentContext = currentArgs = null;
      args.push(cb);
      result = apply2.call(original, this, args);
      cb.cb = origCb;
      currentCallback = cb;
      return result;
    };
    conf.on("set", function(id) {
      if (!currentCallback) {
        conf.delete(id);
        return;
      }
      if (waiting[id]) {
        if (typeof waiting[id] === "function") waiting[id] = [waiting[id], currentCallback.cb];
        else waiting[id].push(currentCallback.cb);
      } else {
        waiting[id] = currentCallback.cb;
      }
      delete currentCallback.cb;
      currentCallback.id = id;
      currentCallback = null;
    });
    conf.on("delete", function(id) {
      var result;
      if (hasOwnProperty.call(waiting, id)) return;
      if (!cache[id]) return;
      result = cache[id];
      delete cache[id];
      conf.emit("deleteasync", id, slice2.call(result.args, 1));
    });
    conf.on("clear", function() {
      var oldCache = cache;
      cache = create2(null);
      conf.emit(
        "clearasync",
        objectMap(oldCache, function(data) {
          return slice2.call(data.args, 1);
        })
      );
    });
  };
  return async;
}
var promise = {};
var primitiveSet;
var hasRequiredPrimitiveSet;
function requirePrimitiveSet() {
  if (hasRequiredPrimitiveSet) return primitiveSet;
  hasRequiredPrimitiveSet = 1;
  var forEach2 = Array.prototype.forEach, create2 = Object.create;
  primitiveSet = function(arg) {
    var set = create2(null);
    forEach2.call(arguments, function(name) {
      set[name] = true;
    });
    return set;
  };
  return primitiveSet;
}
var isCallable;
var hasRequiredIsCallable;
function requireIsCallable() {
  if (hasRequiredIsCallable) return isCallable;
  hasRequiredIsCallable = 1;
  isCallable = function(obj) {
    return typeof obj === "function";
  };
  return isCallable;
}
var validateStringifiable;
var hasRequiredValidateStringifiable;
function requireValidateStringifiable() {
  if (hasRequiredValidateStringifiable) return validateStringifiable;
  hasRequiredValidateStringifiable = 1;
  var isCallable2 = requireIsCallable();
  validateStringifiable = function(stringifiable) {
    try {
      if (stringifiable && isCallable2(stringifiable.toString)) return stringifiable.toString();
      return String(stringifiable);
    } catch (e) {
      throw new TypeError("Passed argument cannot be stringifed");
    }
  };
  return validateStringifiable;
}
var validateStringifiableValue;
var hasRequiredValidateStringifiableValue;
function requireValidateStringifiableValue() {
  if (hasRequiredValidateStringifiableValue) return validateStringifiableValue;
  hasRequiredValidateStringifiableValue = 1;
  var ensureValue = validValue, stringifiable = requireValidateStringifiable();
  validateStringifiableValue = function(value2) {
    return stringifiable(ensureValue(value2));
  };
  return validateStringifiableValue;
}
var safeToString;
var hasRequiredSafeToString;
function requireSafeToString() {
  if (hasRequiredSafeToString) return safeToString;
  hasRequiredSafeToString = 1;
  var isCallable2 = requireIsCallable();
  safeToString = function(value2) {
    try {
      if (value2 && isCallable2(value2.toString)) return value2.toString();
      return String(value2);
    } catch (e) {
      return "<Non-coercible to string value>";
    }
  };
  return safeToString;
}
var toShortStringRepresentation;
var hasRequiredToShortStringRepresentation;
function requireToShortStringRepresentation() {
  if (hasRequiredToShortStringRepresentation) return toShortStringRepresentation;
  hasRequiredToShortStringRepresentation = 1;
  var safeToString2 = requireSafeToString();
  var reNewLine = /[\n\r\u2028\u2029]/g;
  toShortStringRepresentation = function(value2) {
    var string = safeToString2(value2);
    if (string.length > 100) string = string.slice(0, 99) + "…";
    string = string.replace(reNewLine, function(char) {
      return JSON.stringify(char).slice(1, -1);
    });
    return string;
  };
  return toShortStringRepresentation;
}
var isPromise = { exports: {} };
var hasRequiredIsPromise;
function requireIsPromise() {
  if (hasRequiredIsPromise) return isPromise.exports;
  hasRequiredIsPromise = 1;
  isPromise.exports = isPromise$1;
  isPromise.exports.default = isPromise$1;
  function isPromise$1(obj) {
    return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
  }
  return isPromise.exports;
}
var hasRequiredPromise;
function requirePromise() {
  if (hasRequiredPromise) return promise;
  hasRequiredPromise = 1;
  var objectMap = requireMap(), primitiveSet2 = requirePrimitiveSet(), ensureString = requireValidateStringifiableValue(), toShortString = requireToShortStringRepresentation(), isPromise2 = requireIsPromise(), nextTick2 = requireNextTick();
  var create2 = Object.create, supportedModes = primitiveSet2("then", "then:finally", "done", "done:finally");
  registeredExtensions.promise = function(mode, conf) {
    var waiting = create2(null), cache = create2(null), promises = create2(null);
    if (mode === true) {
      mode = null;
    } else {
      mode = ensureString(mode);
      if (!supportedModes[mode]) {
        throw new TypeError("'" + toShortString(mode) + "' is not valid promise mode");
      }
    }
    conf.on("set", function(id, ignore, promise2) {
      var isFailed = false;
      if (!isPromise2(promise2)) {
        cache[id] = promise2;
        conf.emit("setasync", id, 1);
        return;
      }
      waiting[id] = 1;
      promises[id] = promise2;
      var onSuccess = function(result) {
        var count = waiting[id];
        if (isFailed) {
          throw new Error(
            "Memoizee error: Detected unordered then|done & finally resolution, which in turn makes proper detection of success/failure impossible (when in 'done:finally' mode)\nConsider to rely on 'then' or 'done' mode instead."
          );
        }
        if (!count) return;
        delete waiting[id];
        cache[id] = result;
        conf.emit("setasync", id, count);
      };
      var onFailure = function() {
        isFailed = true;
        if (!waiting[id]) return;
        delete waiting[id];
        delete promises[id];
        conf.delete(id);
      };
      var resolvedMode = mode;
      if (!resolvedMode) resolvedMode = "then";
      if (resolvedMode === "then") {
        var nextTickFailure = function() {
          nextTick2(onFailure);
        };
        promise2 = promise2.then(function(result) {
          nextTick2(onSuccess.bind(this, result));
        }, nextTickFailure);
        if (typeof promise2.finally === "function") {
          promise2.finally(nextTickFailure);
        }
      } else if (resolvedMode === "done") {
        if (typeof promise2.done !== "function") {
          throw new Error(
            "Memoizee error: Retrieved promise does not implement 'done' in 'done' mode"
          );
        }
        promise2.done(onSuccess, onFailure);
      } else if (resolvedMode === "done:finally") {
        if (typeof promise2.done !== "function") {
          throw new Error(
            "Memoizee error: Retrieved promise does not implement 'done' in 'done:finally' mode"
          );
        }
        if (typeof promise2.finally !== "function") {
          throw new Error(
            "Memoizee error: Retrieved promise does not implement 'finally' in 'done:finally' mode"
          );
        }
        promise2.done(onSuccess);
        promise2.finally(onFailure);
      }
    });
    conf.on("get", function(id, args, context) {
      var promise2;
      if (waiting[id]) {
        ++waiting[id];
        return;
      }
      promise2 = promises[id];
      var emit2 = function() {
        conf.emit("getasync", id, args, context);
      };
      if (isPromise2(promise2)) {
        if (typeof promise2.done === "function") promise2.done(emit2);
        else {
          promise2.then(function() {
            nextTick2(emit2);
          });
        }
      } else {
        emit2();
      }
    });
    conf.on("delete", function(id) {
      delete promises[id];
      if (waiting[id]) {
        delete waiting[id];
        return;
      }
      if (!hasOwnProperty.call(cache, id)) return;
      var result = cache[id];
      delete cache[id];
      conf.emit("deleteasync", id, [result]);
    });
    conf.on("clear", function() {
      var oldCache = cache;
      cache = create2(null);
      waiting = create2(null);
      promises = create2(null);
      conf.emit("clearasync", objectMap(oldCache, function(data) {
        return [data];
      }));
    });
  };
  return promise;
}
var dispose = {};
var hasRequiredDispose;
function requireDispose() {
  if (hasRequiredDispose) return dispose;
  hasRequiredDispose = 1;
  var callable2 = validCallable, forEach2 = forEach$1, extensions2 = registeredExtensions, apply2 = Function.prototype.apply;
  extensions2.dispose = function(dispose2, conf, options) {
    var del;
    callable2(dispose2);
    if (options.async && extensions2.async || options.promise && extensions2.promise) {
      conf.on(
        "deleteasync",
        del = function(id, resultArray) {
          apply2.call(dispose2, null, resultArray);
        }
      );
      conf.on("clearasync", function(cache) {
        forEach2(cache, function(result, id) {
          del(id, result);
        });
      });
      return;
    }
    conf.on("delete", del = function(id, result) {
      dispose2(result);
    });
    conf.on("clear", function(cache) {
      forEach2(cache, function(result, id) {
        del(id, result);
      });
    });
  };
  return dispose;
}
var maxAge = {};
var maxTimeout;
var hasRequiredMaxTimeout;
function requireMaxTimeout() {
  if (hasRequiredMaxTimeout) return maxTimeout;
  hasRequiredMaxTimeout = 1;
  maxTimeout = 2147483647;
  return maxTimeout;
}
var validTimeout;
var hasRequiredValidTimeout;
function requireValidTimeout() {
  if (hasRequiredValidTimeout) return validTimeout;
  hasRequiredValidTimeout = 1;
  var toPosInt2 = toPosInteger, maxTimeout2 = requireMaxTimeout();
  validTimeout = function(value2) {
    value2 = toPosInt2(value2);
    if (value2 > maxTimeout2) throw new TypeError(value2 + " exceeds maximum possible timeout");
    return value2;
  };
  return validTimeout;
}
var hasRequiredMaxAge;
function requireMaxAge() {
  if (hasRequiredMaxAge) return maxAge;
  hasRequiredMaxAge = 1;
  var aFrom = requireFrom(), forEach2 = forEach$1, nextTick2 = requireNextTick(), isPromise2 = requireIsPromise(), timeout = requireValidTimeout(), extensions2 = registeredExtensions;
  var noop2 = Function.prototype, max2 = Math.max, min = Math.min, create2 = Object.create;
  extensions2.maxAge = function(maxAge2, conf, options) {
    var timeouts, postfix, preFetchAge, preFetchTimeouts;
    maxAge2 = timeout(maxAge2);
    if (!maxAge2) return;
    timeouts = create2(null);
    postfix = options.async && extensions2.async || options.promise && extensions2.promise ? "async" : "";
    conf.on("set" + postfix, function(id) {
      timeouts[id] = setTimeout(function() {
        conf.delete(id);
      }, maxAge2);
      if (typeof timeouts[id].unref === "function") timeouts[id].unref();
      if (!preFetchTimeouts) return;
      if (preFetchTimeouts[id]) {
        if (preFetchTimeouts[id] !== "nextTick") clearTimeout(preFetchTimeouts[id]);
      }
      preFetchTimeouts[id] = setTimeout(function() {
        delete preFetchTimeouts[id];
      }, preFetchAge);
      if (typeof preFetchTimeouts[id].unref === "function") preFetchTimeouts[id].unref();
    });
    conf.on("delete" + postfix, function(id) {
      clearTimeout(timeouts[id]);
      delete timeouts[id];
      if (!preFetchTimeouts) return;
      if (preFetchTimeouts[id] !== "nextTick") clearTimeout(preFetchTimeouts[id]);
      delete preFetchTimeouts[id];
    });
    if (options.preFetch) {
      if (options.preFetch === true || isNaN(options.preFetch)) {
        preFetchAge = 0.333;
      } else {
        preFetchAge = max2(min(Number(options.preFetch), 1), 0);
      }
      if (preFetchAge) {
        preFetchTimeouts = {};
        preFetchAge = (1 - preFetchAge) * maxAge2;
        conf.on("get" + postfix, function(id, args, context) {
          if (!preFetchTimeouts[id]) {
            preFetchTimeouts[id] = "nextTick";
            nextTick2(function() {
              var result;
              if (preFetchTimeouts[id] !== "nextTick") return;
              delete preFetchTimeouts[id];
              conf.delete(id);
              if (options.async) {
                args = aFrom(args);
                args.push(noop2);
              }
              result = conf.memoized.apply(context, args);
              if (options.promise) {
                if (isPromise2(result)) {
                  if (typeof result.done === "function") result.done(noop2, noop2);
                  else result.then(noop2, noop2);
                }
              }
            });
          }
        });
      }
    }
    conf.on("clear" + postfix, function() {
      forEach2(timeouts, function(id) {
        clearTimeout(id);
      });
      timeouts = {};
      if (preFetchTimeouts) {
        forEach2(preFetchTimeouts, function(id) {
          if (id !== "nextTick") clearTimeout(id);
        });
        preFetchTimeouts = {};
      }
    });
  };
  return maxAge;
}
var max = {};
var lruQueue;
var hasRequiredLruQueue;
function requireLruQueue() {
  if (hasRequiredLruQueue) return lruQueue;
  hasRequiredLruQueue = 1;
  var toPosInt2 = toPosInteger, create2 = Object.create, hasOwnProperty2 = Object.prototype.hasOwnProperty;
  lruQueue = function(limit) {
    var size = 0, base = 1, queue = create2(null), map2 = create2(null), index = 0, del;
    limit = toPosInt2(limit);
    return {
      hit: function(id) {
        var oldIndex = map2[id], nuIndex = ++index;
        queue[nuIndex] = id;
        map2[id] = nuIndex;
        if (!oldIndex) {
          ++size;
          if (size <= limit) return;
          id = queue[base];
          del(id);
          return id;
        }
        delete queue[oldIndex];
        if (base !== oldIndex) return;
        while (!hasOwnProperty2.call(queue, ++base)) continue;
      },
      delete: del = function(id) {
        var oldIndex = map2[id];
        if (!oldIndex) return;
        delete queue[oldIndex];
        delete map2[id];
        --size;
        if (base !== oldIndex) return;
        if (!size) {
          index = 0;
          base = 1;
          return;
        }
        while (!hasOwnProperty2.call(queue, ++base)) continue;
      },
      clear: function() {
        size = 0;
        base = 1;
        queue = create2(null);
        map2 = create2(null);
        index = 0;
      }
    };
  };
  return lruQueue;
}
var hasRequiredMax;
function requireMax() {
  if (hasRequiredMax) return max;
  hasRequiredMax = 1;
  var toPosInteger$1 = toPosInteger, lruQueue2 = requireLruQueue(), extensions2 = registeredExtensions;
  extensions2.max = function(max2, conf, options) {
    var postfix, queue, hit;
    max2 = toPosInteger$1(max2);
    if (!max2) return;
    queue = lruQueue2(max2);
    postfix = options.async && extensions2.async || options.promise && extensions2.promise ? "async" : "";
    conf.on(
      "set" + postfix,
      hit = function(id) {
        id = queue.hit(id);
        if (id === void 0) return;
        conf.delete(id);
      }
    );
    conf.on("get" + postfix, hit);
    conf.on("delete" + postfix, queue.delete);
    conf.on("clear" + postfix, queue.clear);
  };
  return max;
}
var refCounter = {};
var hasRequiredRefCounter;
function requireRefCounter() {
  if (hasRequiredRefCounter) return refCounter;
  hasRequiredRefCounter = 1;
  var d2 = dExports, extensions2 = registeredExtensions, create2 = Object.create, defineProperties2 = Object.defineProperties;
  extensions2.refCounter = function(ignore, conf, options) {
    var cache, postfix;
    cache = create2(null);
    postfix = options.async && extensions2.async || options.promise && extensions2.promise ? "async" : "";
    conf.on("set" + postfix, function(id, length) {
      cache[id] = length || 1;
    });
    conf.on("get" + postfix, function(id) {
      ++cache[id];
    });
    conf.on("delete" + postfix, function(id) {
      delete cache[id];
    });
    conf.on("clear" + postfix, function() {
      cache = {};
    });
    defineProperties2(conf.memoized, {
      deleteRef: d2(function() {
        var id = conf.get(arguments);
        if (id === null) return null;
        if (!cache[id]) return null;
        if (!--cache[id]) {
          conf.delete(id);
          return true;
        }
        return false;
      }),
      getRefCount: d2(function() {
        var id = conf.get(arguments);
        if (id === null) return 0;
        if (!cache[id]) return 0;
        return cache[id];
      })
    });
  };
  return refCounter;
}
var normalizeOpts = normalizeOptions, resolveLength = resolveLength$2, plain = plain$1;
var memoizee = function(fn) {
  var options = normalizeOpts(arguments[1]), length;
  if (!options.normalizer) {
    length = options.length = resolveLength(options.length, fn.length, options.async);
    if (length !== 0) {
      if (options.primitive) {
        if (length === false) {
          options.normalizer = requirePrimitive();
        } else if (length > 1) {
          options.normalizer = requireGetPrimitiveFixed()(length);
        }
      } else if (length === false) options.normalizer = requireGet()();
      else if (length === 1) options.normalizer = requireGet1()();
      else options.normalizer = requireGetFixed()(length);
    }
  }
  if (options.async) requireAsync();
  if (options.promise) requirePromise();
  if (options.dispose) requireDispose();
  if (options.maxAge) requireMaxAge();
  if (options.max) requireMax();
  if (options.refCounter) requireRefCounter();
  return plain(fn, options);
};
const memoize = /* @__PURE__ */ getDefaultExportFromCjs(memoizee);
function _defineProperty$1(e, r, t) {
  return (r = _toPropertyKey$1(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$1(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
class ChartModel {
  constructor(dh) {
    _defineProperty$1(this, "dh", void 0);
    _defineProperty$1(this, "listeners", void 0);
    _defineProperty$1(this, "formatter", void 0);
    _defineProperty$1(this, "renderOptions", void 0);
    _defineProperty$1(this, "rect", void 0);
    _defineProperty$1(this, "isDownsamplingDisabled", void 0);
    _defineProperty$1(this, "title", void 0);
    this.dh = dh;
    this.listeners = [];
    this.isDownsamplingDisabled = false;
  }
  /** Formatter settings for the chart, such as how to format dates and numbers */
  getData() {
    return [];
  }
  getDefaultTitle() {
    return "";
  }
  getLayout() {
    return {};
  }
  getFilterColumnMap() {
    return /* @__PURE__ */ new Map();
  }
  isFilterRequired() {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFilter(filter) {
  }
  /**
   * Close this model, clean up any underlying subscriptions
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  close() {
  }
  /**
   * Set the formatter to use when charting the data.
   * @param formatter The formatter to use to format the charting data
   */
  setFormatter(formatter) {
    this.formatter = formatter;
  }
  /**
   * Set additional options for rendering the chart
   * @param renderOptions Options for rendering the chart
   */
  setRenderOptions(renderOptions) {
    this.renderOptions = renderOptions;
  }
  /**
   * Disable downsampling
   * @param isDownsamplingDisabled True if downsampling should be disabled
   */
  setDownsamplingDisabled(isDownsamplingDisabled) {
    this.isDownsamplingDisabled = isDownsamplingDisabled;
  }
  /**
   * Set the dimensions of the plot. May be needed to evaluate some of the percents
   * @param rect The bounding rectangle of the plot
   */
  setDimensions(rect) {
    this.rect = rect;
  }
  setTitle(title) {
    this.title = title;
  }
  /**
   * Subscribe to this ChartModel and start listening for all events.
   * @param callback Callback when an event occurs
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }
  unsubscribe(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }
  fireEvent(event) {
    for (var i = 0; i < this.listeners.length; i += 1) {
      this.listeners[i](event);
    }
  }
  fireUpdate(data) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_UPDATED, {
      detail: data
    }));
  }
  fireDisconnect() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DISCONNECT));
  }
  fireReconnect() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_RECONNECT));
  }
  fireDownsampleStart(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DOWNSAMPLESTARTED, {
      detail
    }));
  }
  fireDownsampleFinish(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DOWNSAMPLEFINISHED, {
      detail
    }));
  }
  fireDownsampleFail(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DOWNSAMPLEFAILED, {
      detail
    }));
  }
  fireDownsampleNeeded(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DOWNSAMPLENEEDED, {
      detail
    }));
  }
  fireLoadFinished() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_LOADFINISHED));
  }
  fireError(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_ERROR, {
      detail
    }));
  }
  fireBlocker(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_BLOCKER, {
      detail
    }));
  }
  fireBlockerClear() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_BLOCKER_CLEAR));
  }
  fireLayoutUpdated(detail) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_LAYOUT_UPDATED, {
      detail
    }));
  }
}
_defineProperty$1(ChartModel, "EVENT_UPDATED", "ChartModel.EVENT_UPDATED");
_defineProperty$1(ChartModel, "EVENT_DISCONNECT", "ChartModel.EVENT_DISCONNECT");
_defineProperty$1(ChartModel, "EVENT_RECONNECT", "ChartModel.EVENT_RECONNECT");
_defineProperty$1(ChartModel, "EVENT_DOWNSAMPLESTARTED", "ChartModel.EVENT_DOWNSAMPLESTARTED");
_defineProperty$1(ChartModel, "EVENT_DOWNSAMPLEFINISHED", "ChartModel.EVENT_DOWNSAMPLEFINISHED");
_defineProperty$1(ChartModel, "EVENT_DOWNSAMPLEFAILED", "ChartModel.EVENT_DOWNSAMPLEFAILED");
_defineProperty$1(ChartModel, "EVENT_DOWNSAMPLENEEDED", "ChartModel.EVENT_DOWNSAMPLENEEDED");
_defineProperty$1(ChartModel, "EVENT_LOADFINISHED", "ChartModel.EVENT_LOADFINISHED");
_defineProperty$1(ChartModel, "EVENT_ERROR", "ChartModel.EVENT_ERROR");
_defineProperty$1(ChartModel, "EVENT_BLOCKER", "ChartModel.EVENT_BLOCKER");
_defineProperty$1(ChartModel, "EVENT_BLOCKER_CLEAR", "ChartModel.EVENT_BLOCKER_CLEAR");
_defineProperty$1(ChartModel, "EVENT_LAYOUT_UPDATED", "ChartModel.EVENT_LAYOUT_UPDATED");
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var log$1 = Log.module("FigureChartModel");
class FigureChartModel extends ChartModel {
  /**
   * @param dh JSAPI instance
   * @param figure The figure object created by the API
   * @param settings Chart settings
   */
  constructor(dh, figure) {
    var _this;
    var settings = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    super(dh);
    _this = this;
    _defineProperty(this, "chartUtils", void 0);
    _defineProperty(this, "dh", void 0);
    _defineProperty(this, "figure", void 0);
    _defineProperty(this, "settings", void 0);
    _defineProperty(this, "data", void 0);
    _defineProperty(this, "layout", void 0);
    _defineProperty(this, "seriesDataMap", void 0);
    _defineProperty(this, "pendingSeries", void 0);
    _defineProperty(this, "oneClicks", void 0);
    _defineProperty(this, "filterColumnMap", void 0);
    _defineProperty(this, "lastFilter", void 0);
    _defineProperty(this, "isConnected", void 0);
    _defineProperty(this, "seriesToProcess", void 0);
    _defineProperty(this, "addPendingSeries", lodashExports.debounce(() => {
      var axisTypeMap = ChartUtils.getAxisTypeMap(this.figure);
      var {
        pendingSeries
      } = this;
      var _loop = function _loop2() {
        var _chart$showLegend;
        var series = pendingSeries[i];
        var chart = _this.figure.charts.find((c) => c.series.includes(series));
        _this.addSeries(series, axisTypeMap, (_chart$showLegend = chart === null || chart === void 0 ? void 0 : chart.showLegend) !== null && _chart$showLegend !== void 0 ? _chart$showLegend : null);
        series.subscribe();
      };
      for (var i = 0; i < pendingSeries.length; i += 1) {
        _loop();
      }
      this.pendingSeries = [];
    }, FigureChartModel.ADD_SERIES_DEBOUNCE));
    _defineProperty(this, "getTimeZone", memoize((columnType, formatter) => {
      if (formatter != null) {
        var dataFormatter = formatter.getColumnTypeFormatter(columnType);
        if (dataFormatter != null) {
          return dataFormatter.dhTimeZone;
        }
      }
      return void 0;
    }));
    _defineProperty(this, "getValueTranslator", memoize((columnType, formatter) => {
      var timeZone = this.getTimeZone(columnType, formatter);
      return (value2) => this.chartUtils.unwrapValue(value2, timeZone);
    }));
    _defineProperty(this, "getValueParser", memoize((columnType, formatter) => {
      var timeZone = this.getTimeZone(columnType, formatter);
      return (value2) => this.chartUtils.wrapValue(value2, columnType, timeZone);
    }));
    _defineProperty(this, "getRangeParser", memoize((columnType, formatter) => (range) => {
      var [rangeStart, rangeEnd] = range;
      var valueParser = this.getValueParser(columnType, formatter);
      rangeStart = valueParser(rangeStart);
      rangeEnd = valueParser(rangeEnd);
      return [rangeStart, rangeEnd];
    }));
    _defineProperty(this, "getAxisRangeParser", memoize((chart, formatter) => (axis) => {
      var source = ChartUtils.getSourceForAxis(chart, axis);
      if (source != null) {
        return this.getRangeParser(source.columnType, formatter);
      }
      return (range) => range;
    }));
    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);
    this.handleFigureDisconnected = this.handleFigureDisconnected.bind(this);
    this.handleFigureReconnected = this.handleFigureReconnected.bind(this);
    this.handleFigureSeriesAdded = this.handleFigureSeriesAdded.bind(this);
    this.handleDownsampleStart = this.handleDownsampleStart.bind(this);
    this.handleDownsampleFinish = this.handleDownsampleFinish.bind(this);
    this.handleDownsampleFail = this.handleDownsampleFail.bind(this);
    this.handleDownsampleNeeded = this.handleDownsampleNeeded.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.dh = dh;
    this.chartUtils = new ChartUtils(dh);
    this.figure = figure;
    this.settings = settings;
    this.data = [];
    this.layout = {
      grid: {
        rows: figure.rows,
        columns: figure.cols,
        pattern: "independent"
      }
    };
    this.seriesDataMap = /* @__PURE__ */ new Map();
    this.pendingSeries = [];
    this.oneClicks = [];
    this.filterColumnMap = /* @__PURE__ */ new Map();
    this.lastFilter = /* @__PURE__ */ new Map();
    this.isConnected = true;
    this.seriesToProcess = /* @__PURE__ */ new Set();
    this.setTitle(this.getDefaultTitle());
    this.initAllSeries();
    this.updateAxisPositions();
    this.startListeningFigure();
  }
  // Assume figure is connected to start
  close() {
    this.figure.close();
    this.addPendingSeries.cancel();
    this.stopListeningFigure();
  }
  getDefaultTitle() {
    if (this.figure.title != null && this.figure.title.length > 0) {
      return this.figure.title;
    }
    if (this.figure.charts.length === 1) {
      var _this$figure$charts$;
      return (_this$figure$charts$ = this.figure.charts[0].title) !== null && _this$figure$charts$ !== void 0 ? _this$figure$charts$ : "";
    }
    return "";
  }
  initAllSeries() {
    var _this2 = this;
    this.oneClicks = [];
    this.filterColumnMap.clear();
    var {
      charts
    } = this.figure;
    var axisTypeMap = ChartUtils.getAxisTypeMap(this.figure);
    var activeSeriesNames = [];
    this.seriesToProcess = /* @__PURE__ */ new Set();
    var _loop2 = function _loop22() {
      var chart = charts[i];
      for (var j = 0; j < chart.series.length; j += 1) {
        var series = chart.series[j];
        activeSeriesNames.push(series.name);
        _this2.addSeries(series, axisTypeMap, chart.showLegend);
      }
      var {
        axes,
        title
      } = chart;
      if (title != null && title.length > 0 && (charts.length > 1 || _this2.figure.title != null)) {
        var xAxis = axes.find((axis) => axis.type === _this2.dh.plot.AxisType.X);
        var yAxis = axes.find((axis) => axis.type === _this2.dh.plot.AxisType.Y);
        if (xAxis == null || yAxis == null) {
          log$1.warn("Chart title provided, but unknown how to map to the correct axes for this chart type", chart);
        } else {
          var _axisTypeMap$get$find, _axisTypeMap$get, _axisTypeMap$get$find2, _axisTypeMap$get2;
          var xAxisIndex = ((_axisTypeMap$get$find = (_axisTypeMap$get = axisTypeMap.get(xAxis.type)) === null || _axisTypeMap$get === void 0 ? void 0 : _axisTypeMap$get.findIndex((a) => a === xAxis)) !== null && _axisTypeMap$get$find !== void 0 ? _axisTypeMap$get$find : 0) + 1;
          var yAxisIndex = ((_axisTypeMap$get$find2 = (_axisTypeMap$get2 = axisTypeMap.get(yAxis.type)) === null || _axisTypeMap$get2 === void 0 ? void 0 : _axisTypeMap$get2.findIndex((a) => a === yAxis)) !== null && _axisTypeMap$get$find2 !== void 0 ? _axisTypeMap$get$find2 : 0) + 1;
          var annotation = {
            align: "center",
            x: 0.5,
            y: 1,
            yshift: 17,
            text: title,
            showarrow: false,
            // Typing is incorrect in Plotly for this, as it doesn't seem to be typed for the "domain" part: https://plotly.com/javascript/reference/layout/annotations/#layout-annotations-items-annotation-xref
            xref: "x".concat(xAxisIndex, " domain"),
            yref: "y".concat(yAxisIndex, " domain")
          };
          if (_this2.layout.annotations == null) {
            _this2.layout.annotations = [annotation];
          } else {
            _this2.layout.annotations.push(annotation);
          }
        }
      }
    };
    for (var i = 0; i < charts.length; i += 1) {
      _loop2();
    }
    var allSeriesNames = [...this.seriesDataMap.keys()];
    var inactiveSeriesNames = allSeriesNames.filter((seriesName2) => activeSeriesNames.indexOf(seriesName2) < 0);
    for (var _i = 0; _i < inactiveSeriesNames.length; _i += 1) {
      var seriesName = inactiveSeriesNames[_i];
      this.seriesDataMap.delete(seriesName);
    }
  }
  /**
   * Add a series to the model
   * @param series Series object to add
   * @param axisTypeMap Map of axis type to the axes in this Figure
   * @param showLegend Whether this series should show the legend or not
   */
  addSeries(series, axisTypeMap, showLegend) {
    var _this$renderOptions$w, _this$renderOptions;
    var {
      dh
    } = this;
    var seriesData = this.chartUtils.makeSeriesDataFromSeries(series, axisTypeMap, ChartUtils.getSeriesVisibility(series.name, this.settings), showLegend, (_this$renderOptions$w = (_this$renderOptions = this.renderOptions) === null || _this$renderOptions === void 0 ? void 0 : _this$renderOptions.webgl) !== null && _this$renderOptions$w !== void 0 ? _this$renderOptions$w : true);
    this.seriesDataMap.set(series.name, seriesData);
    this.seriesToProcess.add(series.name);
    this.data = [...this.seriesDataMap.values()];
    if (series.plotStyle === dh.plot.SeriesPlotStyle.STACKED_BAR) {
      this.layout.barmode = "stack";
    } else if (series.plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      this.layout.hiddenlabels = ChartUtils.getHiddenLabels(this.settings);
    }
    this.layout.showlegend = this.data.length > 1 || series.plotStyle === dh.plot.SeriesPlotStyle.PIE ? showLegend !== null && showLegend !== void 0 ? showLegend : void 0 : false;
    if (series.oneClick != null) {
      var {
        oneClick
      } = series;
      var {
        columns
      } = oneClick;
      for (var i = 0; i < columns.length; i += 1) {
        this.filterColumnMap.set(columns[i].name, columns[i]);
      }
      this.oneClicks.push(oneClick);
    }
    this.updateLayoutFormats();
  }
  // We need to debounce adding series so we subscribe to them all in the same tick
  // This should no longer be necessary after IDS-5049 lands
  subscribe(callback) {
    super.subscribe(callback);
    if (this.listeners.length === 1) {
      this.initAllSeries();
      this.subscribeFigure();
    }
  }
  unsubscribe(callback) {
    super.unsubscribe(callback);
    if (this.listeners.length === 0) {
      this.unsubscribeFigure();
    }
  }
  subscribeFigure() {
    if (!this.isConnected) {
      log$1.debug("Ignoring subscribe when figure in disconnected state");
      return;
    }
    this.figure.subscribe(this.isDownsamplingDisabled ? this.dh.plot.DownsampleOptions.DISABLE : this.dh.plot.DownsampleOptions.DEFAULT);
    if (this.figure.errors.length > 0) {
      log$1.error("Errors in figure", this.figure.errors);
      this.fireError(this.figure.errors);
    }
  }
  unsubscribeFigure() {
    this.figure.unsubscribe();
  }
  startListeningFigure() {
    var {
      dh
    } = this;
    this.figure.addEventListener(dh.plot.Figure.EVENT_UPDATED, this.handleFigureUpdated);
    this.figure.addEventListener(dh.plot.Figure.EVENT_SERIES_ADDED, this.handleFigureSeriesAdded);
    this.figure.addEventListener(dh.plot.Figure.EVENT_DISCONNECT, this.handleFigureDisconnected);
    this.figure.addEventListener(dh.plot.Figure.EVENT_RECONNECT, this.handleFigureReconnected);
    this.figure.addEventListener(dh.plot.Figure.EVENT_DOWNSAMPLESTARTED, this.handleDownsampleStart);
    this.figure.addEventListener(dh.plot.Figure.EVENT_DOWNSAMPLEFINISHED, this.handleDownsampleFinish);
    this.figure.addEventListener(dh.plot.Figure.EVENT_DOWNSAMPLEFAILED, this.handleDownsampleFail);
    this.figure.addEventListener(dh.plot.Figure.EVENT_DOWNSAMPLENEEDED, this.handleDownsampleNeeded);
    this.figure.addEventListener(dh.Client.EVENT_REQUEST_FAILED, this.handleRequestFailed);
  }
  stopListeningFigure() {
    var {
      dh
    } = this;
    this.figure.removeEventListener(dh.plot.Figure.EVENT_UPDATED, this.handleFigureUpdated);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_SERIES_ADDED, this.handleFigureSeriesAdded);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_DISCONNECT, this.handleFigureDisconnected);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_RECONNECT, this.handleFigureReconnected);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_DOWNSAMPLESTARTED, this.handleDownsampleStart);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_DOWNSAMPLEFINISHED, this.handleDownsampleFinish);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_DOWNSAMPLEFAILED, this.handleDownsampleFail);
    this.figure.removeEventListener(dh.plot.Figure.EVENT_DOWNSAMPLENEEDED, this.handleDownsampleNeeded);
    this.figure.removeEventListener(dh.Client.EVENT_REQUEST_FAILED, this.handleRequestFailed);
  }
  /** Gets the parser for a value with the provided column type */
  /**
   * Gets the range parser for a particular column type
   */
  /**
   * Gets the parser for parsing the range from an axis within the given chart
   */
  handleDownsampleStart(event) {
    log$1.debug("Downsample started", event);
    this.fireDownsampleStart(event.detail);
  }
  handleDownsampleFinish(event) {
    log$1.debug("Downsample finished", event);
    this.fireDownsampleFinish(event.detail);
  }
  handleDownsampleFail(event) {
    log$1.error("Downsample failed", event);
    this.fireDownsampleFail(event.detail);
  }
  handleDownsampleNeeded(event) {
    log$1.info("Downsample needed", event);
    this.fireDownsampleNeeded(event.detail);
  }
  handleFigureUpdated(event) {
    var {
      detail: figureUpdateEvent
    } = event;
    var {
      series: seriesArray
    } = figureUpdateEvent;
    log$1.debug2("handleFigureUpdated", seriesArray);
    for (var i = 0; i < seriesArray.length; i += 1) {
      var series = seriesArray[i];
      log$1.debug2("handleFigureUpdated updating series", series.name);
      var {
        sources
      } = series;
      for (var j = 0; j < sources.length; j += 1) {
        var source = sources[j];
        var {
          columnType,
          type
        } = source;
        var valueTranslator = this.getValueTranslator(columnType, this.formatter);
        var dataArray = figureUpdateEvent.getArray(series, type, valueTranslator);
        this.setDataArrayForSeries(series, type, dataArray);
      }
      this.seriesToProcess.delete(series.name);
      this.cleanSeries(series);
    }
    if (this.seriesToProcess.size === 0) {
      this.fireLoadFinished();
    }
    var {
      data
    } = this;
    this.fireUpdate(data);
  }
  handleRequestFailed(event) {
    log$1.error("Request failed", event);
    this.fireError(["".concat(event.detail)]);
  }
  /**
   * Resubscribe to the figure, should be done if settings change
   */
  resubscribe() {
    if (this.listeners.length > 0) {
      this.unsubscribeFigure();
      this.subscribeFigure();
    }
  }
  setFormatter(formatter) {
    super.setFormatter(formatter);
    this.updateLayoutFormats();
    this.resubscribe();
  }
  setRenderOptions(renderOptions) {
    super.setRenderOptions(renderOptions);
    this.initAllSeries();
  }
  setDownsamplingDisabled(isDownsamplingDisabled) {
    super.setDownsamplingDisabled(isDownsamplingDisabled);
    this.resubscribe();
  }
  handleFigureDisconnected(event) {
    log$1.debug("Figure disconnected", event);
    this.isConnected = false;
    if (this.listeners.length > 0) {
      this.unsubscribeFigure();
    }
    this.fireDisconnect();
  }
  handleFigureReconnected(event) {
    log$1.debug("Figure reconnected", event);
    this.isConnected = true;
    this.initAllSeries();
    this.fireReconnect();
    if (this.listeners.length > 0) {
      this.subscribeFigure();
    }
  }
  handleFigureSeriesAdded(event) {
    var {
      detail: series
    } = event;
    log$1.debug("handleFigureSeriesAdded", series);
    this.pendingSeries.push(series);
    this.addPendingSeries();
  }
  setDimensions(rect) {
    super.setDimensions(rect);
    this.updateAxisPositions();
  }
  setTitle(title) {
    var _match$length, _match;
    super.setTitle(title);
    var subtitleCount = (_match$length = (_match = (title !== null && title !== void 0 ? title : "").match(/<br>/g)) === null || _match === void 0 ? void 0 : _match.length) !== null && _match$length !== void 0 ? _match$length : 0;
    var margin = ChartUtils.DEFAULT_MARGIN.t + subtitleCount * ChartUtils.SUBTITLE_LINE_HEIGHT;
    if (this.layout.margin) {
      this.layout.margin.t = margin;
    } else {
      this.layout.margin = {
        t: margin
      };
    }
    if (typeof this.layout.title === "string") {
      this.layout.title = title;
    } else {
      this.layout.title = _objectSpread({}, this.layout.title);
      this.layout.title.text = title;
      this.layout.title.pad = _objectSpread({}, this.layout.title.pad);
      this.layout.title.pad.t = ChartUtils.DEFAULT_TITLE_PADDING.t + subtitleCount * ChartUtils.SUBTITLE_LINE_HEIGHT * 0.5;
    }
    this.fireLayoutUpdated({
      title: this.layout.title
    });
  }
  getPlotWidth() {
    var _this$layout$margin$l, _this$layout$margin, _this$layout$margin$r, _this$layout$margin2;
    if (!this.rect || !this.rect.width) {
      return 0;
    }
    return Math.max(this.rect.width - ((_this$layout$margin$l = (_this$layout$margin = this.layout.margin) === null || _this$layout$margin === void 0 ? void 0 : _this$layout$margin.l) !== null && _this$layout$margin$l !== void 0 ? _this$layout$margin$l : 0) - ((_this$layout$margin$r = (_this$layout$margin2 = this.layout.margin) === null || _this$layout$margin2 === void 0 ? void 0 : _this$layout$margin2.r) !== null && _this$layout$margin$r !== void 0 ? _this$layout$margin$r : 0), 0);
  }
  getPlotHeight() {
    var _this$layout$margin$t, _this$layout$margin3, _this$layout$margin$b, _this$layout$margin4;
    if (!this.rect || !this.rect.height) {
      return 0;
    }
    return Math.max(this.rect.height - ((_this$layout$margin$t = (_this$layout$margin3 = this.layout.margin) === null || _this$layout$margin3 === void 0 ? void 0 : _this$layout$margin3.t) !== null && _this$layout$margin$t !== void 0 ? _this$layout$margin$t : 0) - ((_this$layout$margin$b = (_this$layout$margin4 = this.layout.margin) === null || _this$layout$margin4 === void 0 ? void 0 : _this$layout$margin4.b) !== null && _this$layout$margin$b !== void 0 ? _this$layout$margin$b : 0), 0);
  }
  updateAxisPositions() {
    var plotWidth = this.getPlotWidth();
    var plotHeight = this.getPlotHeight();
    this.chartUtils.updateFigureAxes(this.layout, this.figure, (chart) => this.getAxisRangeParser(chart, this.formatter), plotWidth, plotHeight);
  }
  /**
   * Updates the format patterns used
   */
  updateLayoutFormats() {
    if (!this.formatter) {
      return;
    }
    var axisFormats = this.chartUtils.getAxisFormats(this.figure, this.formatter);
    axisFormats.forEach((axisFormat, axisLayoutProperty) => {
      log$1.debug("Assigning ".concat(axisLayoutProperty), this.layout[axisLayoutProperty], axisFormat);
      var props = this.layout[axisLayoutProperty];
      if (props != null) {
        Object.assign(props, axisFormat);
      } else {
        log$1.debug("Ignoring null layout.".concat(axisLayoutProperty));
      }
    });
  }
  /**
   * Set a specific array for the array of series properties specified.
   * @param series The series to set the data array for.
   * @param sourceType The source type within that series to set the data for.
   * @param dataArray The array to use for the data for this series source.
   */
  setDataArrayForSeries(series, sourceType, dataArray) {
    var {
      name,
      plotStyle
    } = series;
    var seriesData = this.seriesDataMap.get(name);
    var property = this.chartUtils.getPlotlyProperty(plotStyle, sourceType);
    if (seriesData) {
      lodashExports.set(seriesData, property, dataArray);
    }
  }
  /**
   * After setting all the data in the series data, we may need to adjust some other properties
   * Eg. Calculating the width from the xLow/xHigh values; Plot.ly uses `width` instead of a low/high
   * value for x.
   * @param series The series to clean the data for
   */
  cleanSeries(series) {
    var {
      dh
    } = this;
    var {
      name,
      plotStyle
    } = series;
    var seriesData = this.seriesDataMap.get(name);
    if (seriesData == null) {
      return;
    }
    if (plotStyle === dh.plot.SeriesPlotStyle.HISTOGRAM) {
      var {
        xLow,
        xHigh
      } = seriesData;
      if (xLow && xHigh && xLow.length === xHigh.length) {
        var width = [];
        for (var i = 0; i < xLow.length; i += 1) {
          width.push(xHigh[i] - xLow[i]);
        }
        seriesData.width = width;
      }
    } else if (plotStyle === dh.plot.SeriesPlotStyle.LINE || plotStyle === dh.plot.SeriesPlotStyle.ERROR_BAR || plotStyle === dh.plot.SeriesPlotStyle.BAR) {
      var {
        x,
        xLow: _xLow,
        xHigh: _xHigh,
        y,
        yLow,
        yHigh
      } = seriesData;
      if (_xLow && _xHigh && _xLow !== x) {
        seriesData.error_x = ChartUtils.getPlotlyErrorBars(x, _xLow, _xHigh);
      }
      if (yLow && yHigh && yLow !== y) {
        seriesData.error_y = ChartUtils.getPlotlyErrorBars(y, yLow, yHigh);
      }
    } else if (plotStyle === dh.plot.SeriesPlotStyle.TREEMAP) {
      var {
        ids,
        labels
      } = seriesData;
      if (ids !== void 0 && labels === void 0) {
        seriesData.labels = ids;
      }
    }
  }
  getData() {
    return this.data;
  }
  getLayout() {
    return this.layout;
  }
  getFilterColumnMap() {
    return new Map(this.filterColumnMap);
  }
  isFilterRequired() {
    return this.oneClicks.find((oneClick) => oneClick.requireAllFiltersToDisplay) != null;
  }
  /**
   * Sets the filter on the model. Will only set the values that have changed.
   * @param filterMap Map of filter column names to values
   */
  setFilter(filterMap) {
    var _this3 = this;
    if (this.oneClicks.length === 0) {
      log$1.warn("Trying to set a filter, but no one click!");
      return;
    }
    log$1.debug("setFilter", filterMap);
    var _loop3 = function _loop32() {
      var oneClick = _this3.oneClicks[i];
      var {
        columns
      } = oneClick;
      var keys2 = /* @__PURE__ */ new Set([...filterMap.keys(), ..._this3.lastFilter.keys()]);
      keys2.forEach((key) => {
        var value2 = filterMap.get(key);
        if (_this3.lastFilter.get(key) !== value2 && columns.find((column) => column.name === key) != null) {
          oneClick.setValueForColumn(key, value2);
        }
      });
    };
    for (var i = 0; i < this.oneClicks.length; i += 1) {
      _loop3();
    }
    this.lastFilter = new Map(filterMap);
  }
  setFigure(figure) {
    this.close();
    this.figure = figure;
    this.setTitle(this.getDefaultTitle());
    this.initAllSeries();
    this.updateAxisPositions();
    this.startListeningFigure();
    if (this.listeners.length > 0) {
      this.subscribeFigure();
    }
  }
  updateSettings(settings) {
    this.settings = settings;
  }
}
_defineProperty(FigureChartModel, "ADD_SERIES_DEBOUNCE", 50);
function asyncGeneratorStep(n2, t, e, r, o, a, c) {
  try {
    var i = n2[a](c), u = i.value;
  } catch (n3) {
    return void e(n3);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n2) {
  return function() {
    var t = this, e = arguments;
    return new Promise(function(r, o) {
      var a = n2.apply(t, e);
      function _next(n3) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n3);
      }
      function _throw(n3) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n3);
      }
      _next(void 0);
    });
  };
}
class ChartModelFactory {
  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param table The table to build the model for
   * @returns The ChartModel Promise representing the figure
   * CRA sets tsconfig to type check JS based on jsdoc comments. It isn't able to figure out FigureChartModel extends ChartModel
   * This causes TS issues in 1 or 2 spots. Once this is TS it can be returned to just FigureChartModel
   */
  static makeModelFromSettings(dh, settings, table) {
    return _asyncToGenerator(function* () {
      var figure = yield ChartModelFactory.makeFigureFromSettings(dh, settings, table);
      return new FigureChartModel(dh, figure, settings);
    })();
  }
  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh DH JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param table The table to build the model for
   * @returns The Figure created with the settings provided
   */
  static makeFigureFromSettings(dh, settings, table) {
    return _asyncToGenerator(function* () {
      var tableCopy = yield table.copy();
      tableCopy.applyCustomColumns(table.customColumns);
      tableCopy.applyFilter(table.filter);
      tableCopy.applySort(table.sort);
      return dh.plot.Figure.create(new ChartUtils(dh).makeFigureSettings(settings, tableCopy));
    })();
  }
  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh DH JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param figure The figure to build the model for
   * @returns The FigureChartModel representing the figure
   * CRA sets tsconfig to type check JS based on jsdoc comments. It isn't able to figure out FigureChartModel extends ChartModel
   * This causes TS issues in 1 or 2 spots. Once this is TS it can be returned to just FigureChartModel
   */
  static makeModel(dh, settings, figure) {
    return _asyncToGenerator(function* () {
      return new FigureChartModel(dh, figure, settings);
    })();
  }
}
Log.module("@deephaven/jsapi-bootstrap.ApiBootstrap");
var ApiContext = /* @__PURE__ */ React.createContext(null);
function useContextOrThrow(context) {
  var message = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "No value available in context. Was code wrapped in a provider?";
  var value2 = React.useContext(context);
  if (value2 == null) {
    throw new Error(message);
  }
  return value2;
}
function useApi() {
  return useContextOrThrow(ApiContext, "No API available in useApi. Was code wrapped in ApiBootstrap or ApiContext.Provider?");
}
const log = Log.module("@deephaven/js-plugin-grid-toolbar");
const CLEAR_ALL_FILTERS_EVENT = "InputFilterEvent.CLEAR_ALL_FILTERS";
function GridToolbarPanelMiddleware({
  Component,
  fetch,
  glEventHub,
  ...props
}) {
  const dh = useApi();
  const [view, setView] = React.useState("grid");
  const [chartModel, setChartModel] = React.useState(null);
  const [isBuilding, setIsBuilding] = React.useState(false);
  React.useEffect(
    () => () => {
      chartModel == null ? void 0 : chartModel.close();
    },
    [chartModel]
  );
  const handleChart = React.useCallback(async () => {
    if (view === "chart") {
      setView("grid");
      return;
    }
    setIsBuilding(true);
    try {
      const table = await fetch();
      if (!(table == null ? void 0 : table.columns) || table.columns.length < 2) {
        log.warn("Table has fewer than 2 columns; cannot build chart");
        return;
      }
      const settings = {
        type: "LINE",
        series: [table.columns[1].name],
        xAxis: table.columns[0].name
      };
      const model = await ChartModelFactory.makeModelFromSettings(
        dh,
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
  const handleResetFilters = React.useCallback(() => {
    log.info("Reset Filters clicked");
    glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
  }, [glEventHub]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar-middleware h-100 w-100", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid-toolbar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "grid-toolbar-btn",
          disabled: isBuilding,
          onClick: handleChart,
          children: view === "chart" ? "Grid" : "Chart"
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-toolbar-content h-100 w-100", children: view === "chart" && chartModel != null ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      /* @__PURE__ */ jsxRuntimeExports.jsx(LazyChart, { model: chartModel, className: "h-100 w-100" })
    ) : (
      // eslint-disable-next-line react/jsx-props-no-spreading
      /* @__PURE__ */ jsxRuntimeExports.jsx(Component, { fetch, glEventHub, ...props })
    ) })
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
exports.ChartModel = ChartModel;
exports.ChartUtils = ChartUtils;
exports.DateUtils = DateUtils;
exports.GridToolbarMiddleware = GridToolbarMiddleware;
exports.GridToolbarPlugin = GridToolbarPlugin;
exports.TableUtils = TableUtils;
exports.assertInstanceOf = assertInstanceOf;
exports.assign = assign$1;
exports.bindAllMethods = bindAllMethods;
exports.commonjsGlobal = commonjsGlobal;
exports.contains = contains$1;
exports.dExports = dExports;
exports.getAugmentedNamespace = getAugmentedNamespace;
exports.getDefaultExportFromCjs = getDefaultExportFromCjs;
exports.is = is$4;
exports.is$1 = is$3;
exports.is$2 = is;
exports.isObject = isObject$1;
exports.isValue = isValue$6;
exports.jsxRuntimeExports = jsxRuntimeExports;
exports.normalizeOptions = normalizeOptions;
exports.objectAssign = objectAssign;
exports.requireEs6Symbol = requireEs6Symbol;
exports.requireFrom = requireFrom;
exports.requireIsArguments = requireIsArguments;
exports.requireIsString = requireIsString;
exports.requireMap = requireMap;
exports.validCallable = validCallable;
exports.validValue = validValue;
