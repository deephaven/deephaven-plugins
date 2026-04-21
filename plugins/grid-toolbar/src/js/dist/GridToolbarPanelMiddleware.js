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
import { useCallback, useEffect, useState } from 'react';
import { Chart, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
const log = Log.module('@deephaven/js-plugin-grid-toolbar');
// Matches InputFilterEvent.CLEAR_ALL_FILTERS from @deephaven/dashboard-core-plugins
const CLEAR_ALL_FILTERS_EVENT = 'InputFilterEvent.CLEAR_ALL_FILTERS';
export function GridToolbarPanelMiddleware(_a) {
    var { Component, fetch, glEventHub } = _a, props = __rest(_a, ["Component", "fetch", "glEventHub"]);
    const dh = useApi();
    const [view, setView] = useState('grid');
    const [chartModel, setChartModel] = useState(null);
    const [isBuilding, setIsBuilding] = useState(false);
    useEffect(() => () => {
        chartModel === null || chartModel === void 0 ? void 0 : chartModel.close();
    }, [chartModel]);
    const handleChart = useCallback(async () => {
        if (view === 'chart') {
            setView('grid');
            return;
        }
        setIsBuilding(true);
        try {
            // fetch is typed as () => Promise<unknown>; for grid widgets it returns dh.Table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const table = (await fetch());
            if (!(table === null || table === void 0 ? void 0 : table.columns) || table.columns.length < 2) {
                log.warn('Table has fewer than 2 columns; cannot build chart');
                return;
            }
            const settings = {
                type: 'LINE',
                series: [table.columns[1].name],
                xAxis: table.columns[0].name,
            };
            const model = await ChartModelFactory.makeModelFromSettings(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dh, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            settings, table);
            setChartModel(model);
            setView('chart');
        }
        catch (e) {
            log.error('Failed to build chart model', e);
        }
        finally {
            setIsBuilding(false);
        }
    }, [dh, fetch, view]);
    const handleResetFilters = useCallback(() => {
        log.info('Reset Filters clicked');
        glEventHub.emit(CLEAR_ALL_FILTERS_EVENT);
    }, [glEventHub]);
    return (_jsxs("div", { className: "grid-toolbar-middleware h-100 w-100", children: [_jsxs("div", { className: "grid-toolbar", children: [_jsx("button", { type: "button", className: "grid-toolbar-btn", disabled: isBuilding, onClick: handleChart, children: view === 'chart' ? 'Grid' : 'Chart' }), _jsx("button", { type: "button", className: "grid-toolbar-btn", onClick: handleResetFilters, children: "Reset Filters" })] }), _jsx("div", { className: "grid-toolbar-content h-100 w-100", children: view === 'chart' && chartModel != null ? (_jsx("div", { className: "h-100 w-100", children: _jsx(Chart, { model: chartModel }) })) : (
                // eslint-disable-next-line react/jsx-props-no-spreading
                _jsx(Component, Object.assign({ fetch: fetch, glEventHub: glEventHub }, props))) })] }));
}
export default GridToolbarPanelMiddleware;
//# sourceMappingURL=GridToolbarPanelMiddleware.js.map