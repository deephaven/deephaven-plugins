var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import Log from '@deephaven/log';
const log = Log.module('@deephaven/js-plugin-grid-toolbar');
export function GridToolbarMiddleware(_a) {
    var { Component } = _a, props = __rest(_a, ["Component"]);
    const handleExport = useCallback(() => {
        log.info('Export clicked');
    }, []);
    const handleResetFilters = useCallback(() => {
        log.info('[0] Reset Filters clicked', props, Component);
    }, [props, Component]);
    return (_jsxs("div", { className: "grid-toolbar-middleware", children: [_jsxs("div", { className: "grid-toolbar", children: [_jsx("button", { type: "button", className: "grid-toolbar-btn", onClick: handleExport, children: "Export" }), _jsx("button", { type: "button", className: "grid-toolbar-btn", onClick: handleResetFilters, children: "Reset Filters" })] }), _jsx("div", { className: "grid-toolbar-content", children: _jsx(Component, Object.assign({}, props)) })] }));
}
export default GridToolbarMiddleware;
//# sourceMappingURL=GridToolbarMiddleware.js.map