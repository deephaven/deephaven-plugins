import clamp from 'lodash.clamp';
import {
  getOrThrow,
  GridColumnSeparatorMouseHandler,
  GridRenderer,
  GridUtils,
  isExpandableColumnGridModel,
  type BoundedAxisRange,
  type BoxCoordinates,
  type Coordinate,
  type GridColor,
  type GridModel,
  type VisibleIndex,
} from '@deephaven/grid';
import {
  IrisGridCellRendererUtils,
  IrisGridRenderer,
  type IrisGridRenderState,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import { TableUtils } from '@deephaven/jsapi-utils';
import { isPivotColumnHeaderGroup } from './PivotColumnHeaderGroup';
import IrisGridPivotModel, { isIrisGridPivotModel } from './IrisGridPivotModel';
import type IrisGridPivotTheme from './IrisGridPivotTheme';

function getColumnGroupName(
  model: GridModel,
  modelColumn: number,
  depth: number | undefined
): string | undefined {
  return model.getColumnHeaderGroup(modelColumn, depth ?? 0)?.name;
}

export type IrisGridPivotRenderState = IrisGridRenderState & {
  model: IrisGridPivotModel;
  theme: IrisGridThemeType & Partial<typeof IrisGridPivotTheme>;
};

export class IrisGridPivotRenderer extends IrisGridRenderer {
  drawColumnHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const {
      mouseX,
      mouseY,
      theme,
      metrics,
      draggingColumnSeparator,
      isDragging,
      model,
    } = state;
    const {
      columnHeaderHeight,
      floatingColumns,
      gridX,
      width,
      visibleColumns,
      allColumnWidths,
      allColumnXs,
      floatingLeftColumnCount,
      floatingLeftWidth,
      floatingRightWidth,
      modelColumns,
      columnHeaderMaxDepth,
    } = metrics;

    this.drawFilterHeaders(context, state);

    if (columnHeaderHeight <= 0) {
      return;
    }

    const {
      headerHiddenSeparatorSize,
      headerHiddenSeparatorHoverColor,
      headerSeparatorColor,
      headerSeparatorHoverColor,
    } = theme;
    const hiddenSeparatorHeight = columnHeaderHeight * 0.5;
    const hiddenY =
      columnHeaderHeight * (columnHeaderMaxDepth - 1) +
      columnHeaderHeight * 0.5 -
      hiddenSeparatorHeight * 0.5;
    const containsFrozenColumns = floatingLeftColumnCount > 0;

    if (!isExpandableColumnGridModel(model)) {
      throw new Error('Unsupported model type');
    }

    context.save();

    this.drawColumnHeadersForRange(
      context,
      state,
      [visibleColumns[0], visibleColumns[visibleColumns.length - 1]],
      {
        minX: gridX + floatingLeftWidth,
        maxX: width - floatingRightWidth,
      }
    );

    if (containsFrozenColumns) {
      this.drawColumnHeadersForRange(
        context,
        state,
        [floatingColumns[0], floatingColumns[floatingColumns.length - 1]],
        {
          minX: gridX,
          maxX: gridX + floatingLeftWidth,
        }
      );
    }

    if (headerSeparatorColor) {
      context.strokeStyle = headerSeparatorColor;

      const hiddenColumns = [...allColumnWidths.entries()]
        .filter(([_, w]) => w === 0)
        .map(([index]) => index);

      // Now draw the hidden column separator boxes
      context.beginPath();
      context.fillStyle = headerSeparatorColor;
      for (let i = 0; i < hiddenColumns.length; i += 1) {
        const column = hiddenColumns[i];
        const columnX = getOrThrow(allColumnXs, column);
        const columnWidth = getOrThrow(allColumnWidths, column);
        const minX =
          gridX + columnX + columnWidth + 0.5 - headerHiddenSeparatorSize * 0.5;
        context.rect(
          minX,
          hiddenY,
          headerHiddenSeparatorSize,
          hiddenSeparatorHeight
        );
      }
      context.fill();
    }

    if (headerSeparatorHoverColor) {
      let { index: highlightedSeparator, depth } =
        draggingColumnSeparator ?? {};

      if (highlightedSeparator == null && mouseX != null && mouseY != null) {
        const separator = GridColumnSeparatorMouseHandler.getColumnSeparator(
          GridUtils.getGridPointFromXY(mouseX, mouseY, metrics),
          metrics,
          model,
          theme
        );
        highlightedSeparator = separator?.index;
        depth = separator?.depth;
      }

      let shouldDrawSeparator: boolean;

      if (highlightedSeparator == null) {
        shouldDrawSeparator = false;
      } else {
        const columnIndex = modelColumns.get(highlightedSeparator);
        const nextColumnIndex = modelColumns.get(highlightedSeparator + 1);
        if (columnIndex == null || nextColumnIndex == null) {
          shouldDrawSeparator = false;
        } else {
          shouldDrawSeparator =
            getColumnGroupName(model, columnIndex, depth) !==
            getColumnGroupName(model, nextColumnIndex, depth);
        }
      }

      if (
        shouldDrawSeparator &&
        highlightedSeparator != null &&
        depth != null &&
        (!isDragging || draggingColumnSeparator != null)
      ) {
        context.strokeStyle = headerSeparatorHoverColor;

        const columnX = getOrThrow(allColumnXs, highlightedSeparator);
        const columnWidth = getOrThrow(allColumnWidths, highlightedSeparator);
        const x = gridX + columnX + columnWidth + 0.5;
        const visibleColumnIndex = visibleColumns.indexOf(highlightedSeparator);
        const nextColumn =
          visibleColumnIndex < visibleColumns.length - 1
            ? visibleColumns[visibleColumnIndex + 1]
            : null;
        const nextColumnWidth =
          nextColumn != null ? allColumnWidths.get(nextColumn) : null;
        const isColumnHidden = columnWidth === 0;
        const isNextColumnHidden =
          nextColumnWidth != null && nextColumnWidth === 0;
        if (isColumnHidden) {
          context.strokeStyle = headerHiddenSeparatorHoverColor;
          context.fillStyle = headerHiddenSeparatorHoverColor;
          context.fillRect(
            x,
            hiddenY,
            headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorHeight
          );
        } else if (isNextColumnHidden) {
          context.fillStyle = headerSeparatorHoverColor;
          context.fillRect(
            x - headerHiddenSeparatorSize * 0.5,
            hiddenY,
            headerHiddenSeparatorSize * 0.5,
            hiddenSeparatorHeight
          );
        }

        // column separator hover line
        context.beginPath();
        context.moveTo(
          x,
          (columnHeaderMaxDepth - depth - 1) * columnHeaderHeight
        );
        context.lineTo(
          x,
          (columnHeaderMaxDepth - depth) * columnHeaderHeight - 1
        );
        context.stroke();
      }
    }

    this.drawColumnFilterHeaders(context, state);

    context.restore();
  }

  drawColumnHeadersAtDepth(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState,
    range: BoundedAxisRange,
    bounds: { minX: number; maxX: number },
    depth: number
  ): void {
    const { metrics, model, theme } = state;
    if (!isIrisGridPivotModel(model)) {
      throw new Error('Unsupported model type');
    }
    const {
      modelColumns,
      allColumnXs,
      gridX,
      userColumnWidths,
      allColumnWidths,
      movedColumns,
    } = metrics;
    const { columnHeaderHeight, columnWidth } = theme;
    const { columnHeaderMaxDepth } = model;
    const { minX, maxX } = bounds;
    const visibleWidth = maxX - minX;

    if (columnHeaderMaxDepth === 0) {
      return;
    }

    const startIndex = range[0];
    const endIndex = range[1];

    context.save();
    context.translate(
      0,
      (columnHeaderMaxDepth - depth - 1) * columnHeaderHeight
    );

    if (depth === 0) {
      // Make sure base column header background always goes to the right edge
      this.drawColumnHeader(context, state, '', minX, maxX);

      // Draw base column headers
      for (let i = startIndex; i <= endIndex; i += 1) {
        this.drawColumnHeaderAtIndex(context, state, i, bounds);
      }
    }

    // Draw column header group
    if (depth > 0) {
      let columnIndex = startIndex;

      while (columnIndex <= endIndex) {
        const { columnCount } = metrics;
        const modelColumn = getOrThrow(modelColumns, columnIndex);

        const columnGroupColor = model.colorForColumnHeader(
          modelColumn,
          depth,
          theme
        );

        const headerGroup = model.getColumnHeaderGroup(modelColumn, depth ?? 0);

        const isExpandable =
          isPivotColumnHeaderGroup(headerGroup) && headerGroup.isExpandable;
        const isExpanded =
          isPivotColumnHeaderGroup(headerGroup) && headerGroup.isExpanded;

        const columnGroupName = getColumnGroupName(model, modelColumn, depth);

        let columnGroupLeft = getOrThrow(allColumnXs, columnIndex) + gridX;
        let columnGroupRight =
          columnGroupLeft + getOrThrow(allColumnWidths, columnIndex);

        if (columnGroupName != null) {
          // Need to determine if the column group is at least the width of the bounds
          // And if the left/right of the group extend past the bounds
          // The group will be drawn as if it were a column with a max width of the bounds width
          let prevColumnIndex = columnIndex - 1;
          while (
            prevColumnIndex >= 0 &&
            (columnGroupRight - columnGroupLeft < visibleWidth ||
              columnGroupLeft > minX)
          ) {
            const prevModelIndex =
              modelColumns.get(prevColumnIndex) ??
              GridUtils.getModelIndex(prevColumnIndex, movedColumns);
            if (
              prevModelIndex == null ||
              getColumnGroupName(model, prevModelIndex, depth) !==
                columnGroupName
            ) {
              // Previous column not in the same group
              break;
            }

            const prevColumnWidth =
              userColumnWidths.get(prevModelIndex) ??
              allColumnWidths.get(prevColumnIndex) ??
              columnWidth;

            columnGroupLeft -= prevColumnWidth;
            prevColumnIndex -= 1;
          }

          let nextColumnIndex = columnIndex + 1;
          while (
            nextColumnIndex < columnCount &&
            (columnGroupRight - columnGroupLeft < visibleWidth ||
              columnGroupRight < maxX)
          ) {
            const nextModelIndex =
              modelColumns.get(nextColumnIndex) ??
              GridUtils.getModelIndex(nextColumnIndex, movedColumns);
            if (
              getColumnGroupName(model, nextModelIndex, depth) !==
              columnGroupName
            ) {
              // Next column not in the same group
              break;
            }

            const nextColumnWidth =
              userColumnWidths.get(nextModelIndex) ??
              allColumnWidths.get(nextColumnIndex) ??
              columnWidth;

            columnGroupRight += nextColumnWidth;
            nextColumnIndex += 1;
          }

          // Set column index to end of the current group
          columnIndex = nextColumnIndex - 1;

          const isFullWidth =
            columnGroupRight - columnGroupLeft >= visibleWidth;
          let x = columnGroupLeft;
          if (isFullWidth) {
            if (columnGroupRight < maxX) {
              x = columnGroupRight - visibleWidth;
            } else if (columnGroupLeft < minX) {
              x = minX;
            }
          }

          this.drawColumnHeader(
            context,
            state,
            model.textForColumnHeader(modelColumn, depth) ?? '',
            x,
            Math.min(columnGroupRight - columnGroupLeft, visibleWidth),
            {
              backgroundColor: columnGroupColor ?? undefined,
            },
            bounds,
            isExpandable,
            isExpanded
          );
        }
        columnIndex += 1;
      }
    }
    context.restore();
  }

  drawColumnHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnText: string,
    columnX: Coordinate,
    columnWidth: number,
    style?: {
      backgroundColor?: string;
      textColor?: string;
      separatorColor?: string;
    },
    bounds?: { minX?: number; maxX?: number },
    isExpandable = false,
    isExpanded = false
  ): void {
    if (columnWidth <= 0) {
      return;
    }
    const { metrics, theme } = state;

    const {
      headerHorizontalPadding,
      columnHeaderHeight,
      iconSize,
      headerBackgroundColor,
      headerColor,
      headerSeparatorColor,
      black,
      white,
    } = theme;
    const { fontWidthsLower, fontWidthsUpper, width } = metrics;

    const maxWidth = columnWidth - headerHorizontalPadding * 2;

    const {
      backgroundColor = headerBackgroundColor,
      separatorColor = headerSeparatorColor,
    } = style ?? {};

    let { textColor = headerColor } = style ?? {};

    try {
      const isDarkBackground =
        GridRenderer.getCachedColorIsDark(backgroundColor);
      const isDarkText = GridRenderer.getCachedColorIsDark(textColor);
      if (isDarkBackground && isDarkText) {
        textColor = white;
      } else if (!isDarkBackground && !isDarkText) {
        textColor = black;
      }
    } catch {
      // Invalid color provided
      // no-op since we don't use logging in base grid
    }

    let { minX = 0, maxX = width } = bounds ?? {};

    context.save();
    context.rect(minX, 0, maxX - minX, columnHeaderHeight);
    context.clip();

    // Fill background color if specified
    if (backgroundColor != null) {
      context.fillStyle = backgroundColor;
      context.fillRect(columnX, 0, columnWidth, columnHeaderHeight);
    }

    if (separatorColor != null) {
      context.strokeStyle = separatorColor;
      context.beginPath();

      // Don't draw left separator if column touches the left edge
      if (columnX > 0) {
        context.moveTo(columnX + 0.5, 0);
        context.lineTo(columnX + 0.5, columnHeaderHeight);
      }
      context.moveTo(columnX + columnWidth + 0.5, 0);
      context.lineTo(columnX + columnWidth + 0.5, columnHeaderHeight);

      // Bottom Border, should be interior to the header height
      context.moveTo(columnX, columnHeaderHeight - 0.5);
      context.lineTo(columnX + columnWidth, columnHeaderHeight - 0.5);
      context.stroke();
    }

    context.beginPath();
    context.rect(columnX, 0, columnWidth, columnHeaderHeight);
    context.clip();
    context.fillStyle = textColor;

    const fontWidthLower = fontWidthsLower.get(context.font);
    const fontWidthUpper = fontWidthsUpper.get(context.font);
    const renderText = this.textCellRenderer.getCachedTruncatedString(
      context,
      columnText,
      maxWidth,
      fontWidthLower,
      fontWidthUpper
    );

    let x = columnX;
    const y = columnHeaderHeight * 0.5;
    minX += headerHorizontalPadding;
    maxX -= headerHorizontalPadding;

    const treeMarkerPadding = isExpandable ? iconSize : 0;
    const contentLeft = columnX + headerHorizontalPadding;
    const visibleLeft = clamp(contentLeft, minX, maxX);
    const contentRight = columnX + columnWidth - headerHorizontalPadding;
    const visibleRight = clamp(contentRight, minX, maxX);
    const visibleWidth = visibleRight - visibleLeft;

    const textWidth = this.getCachedHeaderWidth(context, renderText);
    const contentWidth = textWidth + treeMarkerPadding;
    const isBeyondLeft = contentLeft < minX;

    if (isBeyondLeft) {
      // Column name would be off the left side of the canvas
      if (contentWidth < visibleWidth) {
        // Can render the entire text in the visible space. Stick to left
        x = minX;
      } else {
        x = contentRight - contentWidth;
      }
    } else {
      x = contentLeft;
    }
    context.textAlign = 'start';
    context.fillText(renderText, x + treeMarkerPadding, y);

    if (isExpandable) {
      const treeBox = {
        x1: 0,
        y1: 0,
        x2: iconSize / 2,
        y2: columnHeaderHeight,
      };

      this.drawColumnHeaderTreeMarker(
        context,
        state,
        x,
        columnWidth,
        0,
        columnHeaderHeight,
        treeBox,
        isExpanded
      );
    }

    context.restore();
  }

  drawColumnHeaderTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnX: Coordinate,
    columnWidth: number,
    headerY: Coordinate,
    headerHeight: number,
    treeBox: BoxCoordinates,
    isExpanded: boolean
  ): void {
    const { theme } = state;
    const { treeMarkerColor } = theme;

    this.drawTreeMarker(
      context,
      state,
      columnX,
      headerY,
      treeBox,
      treeMarkerColor,
      isExpanded
    );
  }

  // eslint-disable-next-line class-methods-use-this
  drawTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    columnX: Coordinate,
    rowY: Coordinate,
    treeBox: BoxCoordinates,
    color: GridColor,
    isExpanded: boolean
  ): void {
    IrisGridCellRendererUtils.drawTreeMarker(
      context,
      state,
      columnX,
      rowY,
      treeBox,
      color,
      isExpanded
    );
  }

  /* column filter headers start */
  // TODO: remove ^

  // eslint-disable-next-line class-methods-use-this
  getColumnHeaderCoordinates(
    state: IrisGridRenderState,
    column: VisibleIndex
  ): BoxCoordinates {
    const { metrics } = state;
    const { allColumnXs, allColumnWidths, gridX } = metrics;
    const columnX = getOrThrow(allColumnXs, column);
    const columnWidth = getOrThrow(allColumnWidths, column);
    return {
      x1: gridX + columnX,
      // TODO: y1, y2
      y1: 0,
      x2: gridX + columnX + columnWidth,
      y2: 0,
    };
  }

  drawColumnFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { isFilterBarShown, quickFilters, advancedFilters } = state;

    if (isFilterBarShown) {
      this.drawExpandedColumnFilterHeaders(context, state);
    } else if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      this.drawCollapsedColumnFilterHeaders(context, state);
    }
  }

  drawExpandedColumnFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, model, theme, quickFilters, advancedFilters } = state;
    const { filterBarHeight } = theme;

    // TODO: use column header height
    if (filterBarHeight <= 0) {
      return;
    }

    const {
      gridX,
      gridY,
      visibleColumns,
      allColumnWidths,
      allColumnXs,
      columnHeaderHeight: metricColumnHeaderHeight,
    } = metrics;

    const columnHeaderHeight = gridY - filterBarHeight;

    if (!isIrisGridPivotModel(model)) {
      throw new Error('Unsupported model type');
    }

    const colByColumns = [...model.columnHeaderGroupMap.values()].filter(
      group => group.isKeyColumnGroup
    );

    // TODO: rename
    // TODO: const - calc?
    const FILTER_WIDTH = 180;
    const colByFilterBoxes = colByColumns.map(group => {
      const x2 =
        this.getColumnHeaderCoordinates(
          state,
          group.childIndexes[group.childIndexes.length - 1]
        ).x2 + gridX;
      return {
        name: group.name,
        depth: group.depth,
        y1:
          gridY -
          filterBarHeight -
          (group.depth + 1) * metricColumnHeaderHeight,
        x1: x2 - FILTER_WIDTH,
        y2: gridY - filterBarHeight - group.depth * metricColumnHeaderHeight,
        x2,
      };
    });

    console.log(
      '[0] Drawing expanded column filter headers',
      {
        columnHeaderHeight,
        filterBarHeight,
        gridY,
      },
      metrics,
      model,
      colByFilterBoxes
    );

    context.save();

    context.font = theme.filterBarFont;
    context.textAlign = 'left';

    if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      // fill style if a filter is set on any column
      context.fillStyle = theme.filterBarExpandedActiveBackgroundColor;
    } else {
      // fill style with no filters set
      context.fillStyle = theme.filterBarExpandedBackgroundColor;
    }

    // Draw the filter input boxes
    // const y1 = columnHeaderHeight;
    context.strokeStyle = theme.filterBarSeparatorColor;
    context.beginPath();

    // Iterate over key column group headers

    for (let i = 0; i < colByFilterBoxes.length; i += 1) {
      const { x1, y1, x2, y2 } = colByFilterBoxes[i];
      const w = x2 - x1;
      const h = y2 - y1;
      // if (model.isFilterable(modelColumn) && columnWidth > 0) {
      context.rect(x1 + 0.5, y1 + 0.5, w, h - 2); // 1 for the border, 1 for the casing
      // }
    }
    context.stroke();

    for (let i = 0; i < colByFilterBoxes.length; i += 1) {
      const { x1, y1, x2, y2, name } = colByFilterBoxes[i];
      const w = x2 - x1;
      const h = y2 - y1;
      this.drawExpandedColumnFilterHeader(context, state, name, x1, y1, w);
    }

    context.restore();
  }

  drawExpandedColumnFilterHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    colByName: string,
    inputX: Coordinate,
    inputY: Coordinate,
    inputWidth: number
  ): void {
    if (inputWidth <= 0) {
      return;
    }

    const { metrics, theme, model, quickFilters, advancedFilters } = state;
    // const { metrics, theme, model } = state;
    if (!isIrisGridPivotModel(model)) {
      throw new Error('Unsupported model type');
    }
    const { modelColumns } = metrics;
    const {
      filterBarHeight,
      filterBarExpandedActiveCellBackgroundColor,
      filterBarErrorColor,
      filterBarHorizontalPadding,
      headerColor,
    } = theme;
    // const modelColumn = modelColumns.get(column);
    const filterSourceIndex = model.columnSources.findIndex(
      source => source.name === colByName
    );
    if (filterSourceIndex === -1) return;

    const filterIndex = -model.columnSources.length + filterSourceIndex;
    console.log(
      'quickFilter',
      quickFilters,
      quickFilters.get(filterIndex),
      filterIndex,
      filterSourceIndex
    );
    const quickFilter = quickFilters.get(filterIndex);

    const advancedFilter = null; // advancedFilters.get(filterSource);
    if (quickFilter == null && advancedFilter == null) {
      return;
    }

    let text = null;
    if (quickFilter != null) {
      const { text: filterText } = quickFilter;
      text = filterText;
      // TODO:
      if (text == null || text === '') {
        text = TableUtils.getFilterText(quickFilter.filter);
      }

      if (text != null) {
        const { fontWidthsLower, fontWidthsUpper } = metrics;
        const fontWidthLower = fontWidthsLower.get(context.font);
        const fontWidthUpper = fontWidthsUpper.get(context.font);

        const maxLength = inputWidth - filterBarHorizontalPadding * 2;
        text = this.textCellRenderer.getCachedTruncatedString(
          context,
          text,
          maxLength,
          fontWidthLower,
          fontWidthUpper
        );
      }
    }

    context.save();

    const isFilterValid = IrisGridRenderer.isFilterValid(
      advancedFilter,
      quickFilter
    );
    if (isFilterValid && filterBarExpandedActiveCellBackgroundColor != null) {
      // draw active filter background inside cell
      context.fillStyle = filterBarExpandedActiveCellBackgroundColor;
      context.fillRect(
        inputX + 1, // +1 left border
        inputY + 1, // +1 top border
        inputWidth - 1, // -1 right border
        filterBarHeight - 3 // -3 top, bottom border and bottom casing
      );
    } else if (filterBarErrorColor != null) {
      // draw error box inside cell
      context.fillStyle = filterBarErrorColor;
      context.lineWidth = 2;
      context.strokeStyle = filterBarErrorColor;
      // Because this is drawn with a strokeRect, we have to add/subtract half the,
      // linewidth from each side to make interior, in addition to accounting for any borders/casings
      const rectLeft = inputX + 2; // 1 for strokeRect, 1 for border
      const rectTop = inputY + 2; // 1 for strokeRect, 1 for border
      const rectWidth = inputWidth - 3; // for 2 border and 1 for strokeRect
      const rectHeight = filterBarHeight - 5; // -2 for strokeRect, -3 for top, bottom border and bottom casing
      context.strokeRect(rectLeft, rectTop, rectWidth, rectHeight);
    }

    if (text != null && text !== '') {
      const textX = inputX + filterBarHorizontalPadding;
      const textY = inputY + filterBarHeight * 0.5 + 1; // + 1 for border
      context.fillStyle = headerColor;
      context.fillText(text, textX, textY);
    }

    context.restore();
  }

  drawCollapsedColumnFilterHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState
  ): void {
    const { metrics, theme } = state;
    const { headerSeparatorColor, filterBarCollapsedHeight } = theme;

    if (filterBarCollapsedHeight <= 0) {
      return;
    }

    const { gridX, gridY, maxX, visibleColumns, allColumnWidths, allColumnXs } =
      metrics;
    const columnHeaderHeight = gridY - filterBarCollapsedHeight;

    context.save();

    // Draw the background of the collapsed filter bar
    context.fillStyle = headerSeparatorColor;
    context.fillRect(gridX, columnHeaderHeight, maxX, filterBarCollapsedHeight);

    for (let i = 0; i < visibleColumns.length; i += 1) {
      const column = visibleColumns[i];
      const columnWidth = allColumnWidths.get(column);
      const columnX = allColumnXs.get(column);
      if (columnX != null && columnWidth != null) {
        const x = columnX + gridX;
        // draw the collapsed cells
        this.drawCollapsedFilterHeader(context, state, column, x, columnWidth);
      }
    }

    context.restore();
  }

  drawCollapsedColumnFilterHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    column: VisibleIndex,
    columnX: Coordinate,
    columnWidth: number
  ): void {
    if (columnWidth <= 0) {
      return;
    }

    const { metrics, theme, quickFilters, advancedFilters } = state;
    const { modelColumns, gridY } = metrics;
    const modelColumn = modelColumns.get(column);

    if (modelColumn === undefined) return;
    const quickFilter = quickFilters.get(modelColumn);
    const advancedFilter = advancedFilters.get(modelColumn);

    const {
      filterBarCollapsedHeight,
      filterBarActiveColor,
      filterBarActiveBackgroundColor,
      filterBarErrorColor,
    } = theme;

    context.save();

    const isFilterValid = IrisGridRenderer.isFilterValid(
      advancedFilter,
      quickFilter
    );

    if (
      filterBarActiveBackgroundColor != null &&
      quickFilter == null &&
      advancedFilter == null
    ) {
      context.fillStyle = filterBarActiveBackgroundColor;
    } else if (filterBarActiveColor != null && isFilterValid) {
      context.fillStyle = filterBarActiveColor;
    } else if (filterBarErrorColor != null) {
      context.fillStyle = filterBarErrorColor;
    }

    const x = columnX + 1; // for gap between columns
    const y = gridY - filterBarCollapsedHeight;
    const rectWidth = columnWidth - 1; // for gap between columns
    const rectHeight = filterBarCollapsedHeight - 1; // for casing bottom
    context.fillRect(x, y, rectWidth, rectHeight);

    context.restore();
  }

  /* column filter headers end */
  // TODO: remove ^
}

export default IrisGridPivotRenderer;
