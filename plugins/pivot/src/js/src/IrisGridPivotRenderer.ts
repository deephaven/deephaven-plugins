import clamp from 'lodash.clamp';
import {
  getOrThrow,
  GridRenderer,
  GridUtils,
  type BoundedAxisRange,
  type BoxCoordinates,
  type Coordinate,
  type GridColor,
  type GridModel,
} from '@deephaven/grid';
import {
  IrisGridCellRendererUtils,
  IrisGridRenderer,
  type IrisGridRenderState,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh } from '@deephaven/jsapi-types';
import PivotColumnHeaderGroup, {
  isPivotColumnHeaderGroup,
} from './PivotColumnHeaderGroup';
import IrisGridPivotModel, { isIrisGridPivotModel } from './IrisGridPivotModel';
import type { IrisGridPivotThemeType } from './IrisGridPivotTheme';

function getColumnGroupName(
  model: GridModel,
  modelColumn: number,
  depth: number | undefined
): string | undefined {
  return model.getColumnHeaderGroup(modelColumn, depth ?? 0)?.name;
}

function getColumnHeaderCoordinates(
  state: IrisGridPivotRenderState,
  group: PivotColumnHeaderGroup
): BoxCoordinates {
  const { metrics, theme } = state;
  const { childIndexes, depth } = group;
  const firstColumn = childIndexes.at(0);
  const lastColumn = childIndexes.at(-1);
  if (firstColumn == null || lastColumn == null) {
    throw new Error('Group has no child columns');
  }
  const { allColumnXs, allColumnWidths, gridX, gridY, maxX, lastLeft } =
    metrics;
  const { filterBarHeight, columnHeaderHeight } = theme;
  console.log('getColumnHeaderCoordinates', {
    allColumnXs,
    allColumnWidths,
    gridX,
    maxX,
    firstColumn,
    lastColumn,
    lastLeft,
  });
  let firstColumnX = allColumnXs.get(firstColumn);
  let lastColumnX = allColumnXs.get(lastColumn);
  let lastColumnWidth = allColumnWidths.get(lastColumn);
  if (firstColumnX == null) {
    firstColumnX = 0;
  }

  // TODO: 8-0 fix this
  if (lastColumnX == null || lastColumnWidth == null) {
    lastColumnX = -2;
    lastColumnWidth = -2;
  }
  // TODO: this might be wrong depending on which side the grid is scrolled
  const groupRight =
    lastColumnX == null || lastColumnWidth == null
      ? maxX
      : gridX + lastColumnX + lastColumnWidth;

  return {
    x1: gridX + firstColumnX,
    y1: gridY - filterBarHeight - (depth + 1) * columnHeaderHeight,
    x2: gridX + groupRight,
    y2: gridY - filterBarHeight - depth * columnHeaderHeight,
  };
}

export type IrisGridPivotRenderState = IrisGridRenderState & {
  model: IrisGridPivotModel;
  theme: IrisGridThemeType & Partial<IrisGridPivotThemeType>;
};

export class IrisGridPivotRenderer extends IrisGridRenderer {
  drawColumnHeaders(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState
  ): void {
    super.drawColumnHeaders(context, state);

    // Draw column source filters on top of headers
    this.drawColumnSourceFilters(context, state);
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
            isExpanded,
            TableUtils.getSortForColumn(model.sort, columnGroupName)
          );
        }
        columnIndex += 1;
      }
    }
    context.restore();
  }

  drawColumnHeader(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState,
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
    isExpanded = false,
    sort: dh.Sort | null = null
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

    this.drawColumnSourceSortIndicator(
      context,
      state,
      sort,
      columnText,
      columnX,
      columnWidth,
      { minX, maxX }
    );

    context.restore();
  }

  drawColumnHeaderTreeMarker(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState,
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
    state: IrisGridPivotRenderState,
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

  /* column sort indicator start */
  drawColumnSourceSortIndicator(
    context: CanvasRenderingContext2D,
    state: IrisGridRenderState,
    sort: dh.Sort | null,
    columnText: string,
    columnX: Coordinate,
    columnWidth: number,
    bounds: { minX: number; maxX: number }
  ): void {
    const { metrics, model, theme } = state;
    const { gridX, columnHeaderHeight } = metrics;

    const { headerHorizontalPadding, iconSize: themeIconSize } = theme;
    const iconSize = Math.round(themeIconSize * 0.75); // The vsTriangle icons are a bit bigger than we want

    if (!sort) {
      return;
    }

    const icon = this.getSortIcon(sort, iconSize);
    if (!icon) {
      return;
    }

    const textWidth = this.getCachedHeaderWidth(context, columnText);
    const textRight = gridX + columnX + textWidth + headerHorizontalPadding;
    let { maxX } = bounds;
    maxX -= headerHorizontalPadding; // Right visible edge of the headers
    // Right edge of the column. The icon has its own horizontal padding
    const defaultX = gridX + columnX + columnWidth - iconSize;

    // If the text is partially off the screen, put the icon to the right of the text
    // else put it at the right edge of the column/grid (whichever is smaller)
    const x = textRight > maxX ? textRight + 1 : Math.min(maxX, defaultX);
    const y = (columnHeaderHeight - iconSize) * 0.5;

    context.save();

    // context.beginPath();
    context.fillStyle = 'red';
    // context.translate(0, 0);
    // context.rect(columnX, 0, columnWidth, columnHeaderHeight);
    // context.rect(0, 0, 100, 100);

    // context.clip();

    context.fillStyle = theme.headerSortBarColor;
    context.translate(x, y);
    context.fill(icon);

    context.restore();

    if (model.sort != null && model.sort.length > 0) {
      console.log('[0] drawColumnSourceSortIndicator', sort, columnText);
    }
  }

  /* column filter headers start */
  // TODO: remove ^

  drawColumnSourceFilters(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState
  ): void {
    const { isFilterBarShown, quickFilters, advancedFilters } = state;

    if (isFilterBarShown) {
      this.drawExpandedColumnSourceFilters(context, state);
    } else if (
      (quickFilters != null && quickFilters.size > 0) ||
      (advancedFilters != null && advancedFilters.size > 0)
    ) {
      this.drawCollapsedColumnSourceFilters(context, state);
    }
  }

  drawExpandedColumnSourceFilters(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState
  ): void {
    const { model, theme, quickFilters, advancedFilters } = state;
    const { columnSourceFilterMinWidth } = theme;

    if (columnSourceFilterMinWidth == null || columnSourceFilterMinWidth <= 0) {
      return;
    }

    // TODO: get columnSourceFilterWidth from metrics
    const columnSourceFilterWidth = columnSourceFilterMinWidth;

    // TODO: store keyColumnGroups in the model
    const keyColumnGroups = [...model.columnHeaderGroupMap.values()].filter(
      (group): group is PivotColumnHeaderGroup =>
        isPivotColumnHeaderGroup(group) && group.isKeyColumnGroup
    );

    const filterBoxes = keyColumnGroups.map(group => {
      const { x2, y1, y2 } = getColumnHeaderCoordinates(state, group);
      return {
        depth: group.depth,
        x1: x2 - columnSourceFilterWidth,
        y1,
        x2,
        y2,
      };
    });

    if (filterBoxes.length === 0) {
      return;
    }

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

    // Draw the background
    context.fillRect(
      filterBoxes[0].x1,
      filterBoxes[filterBoxes.length - 1].y1,
      filterBoxes[0].x2 - filterBoxes[0].x1,
      filterBoxes[0].y2 - filterBoxes[filterBoxes.length - 1].y1
    );

    // Draw the filter input boxes
    context.strokeStyle = theme.filterBarSeparatorColor;
    context.beginPath();

    filterBoxes.forEach(({ x1, y1, x2, y2 }) => {
      const w = x2 - x1;
      const h = y2 - y1;
      context.rect(x1 + 0.5, y1 + 0.5, w, h - 2); // 1 for the border, 1 for the casing
    });

    context.stroke();

    filterBoxes.forEach(({ x1, x2, depth }) => {
      this.drawExpandedColumnSourceFilter(context, state, depth, x1, x2 - x1);
    });

    context.restore();
  }

  drawExpandedColumnSourceFilter(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState,
    headerDepth: number,
    inputX: Coordinate,
    inputWidth: number
  ): void {
    if (inputWidth <= 0) {
      return;
    }

    // TODO: store inputWidth and keyColumnRight in metrics
    // Only pass context, state, and headerDepth in the parameters
    const { metrics, theme, quickFilters, advancedFilters } = state;
    const {
      filterBarHeight,
      filterBarExpandedActiveCellBackgroundColor,
      filterBarErrorColor,
      filterBarHorizontalPadding,
      headerColor,
    } = theme;
    const { columnHeaderHeight, gridY } = metrics;
    // Negative index for column source filters
    const filterIndex = -headerDepth;
    const quickFilter = quickFilters.get(filterIndex);
    const advancedFilter = advancedFilters.get(filterIndex);
    if (quickFilter == null && advancedFilter == null) {
      return;
    }

    let text = null;
    if (quickFilter != null) {
      const { text: filterText } = quickFilter;
      text = filterText;
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

    const inputY =
      gridY -
      filterBarHeight -
      columnHeaderHeight -
      columnHeaderHeight * headerDepth;

    const isFilterValid = IrisGridRenderer.isFilterValid(
      advancedFilter,
      quickFilter
    );

    context.save();

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

  // eslint-disable-next-line class-methods-use-this
  drawCollapsedColumnSourceFilters(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState
  ): void {
    const { metrics, model, theme } = state;
    const { columnHeaderGroupMap } = model;
    const { gridX, gridY, columnHeaderHeight, columnHeaderMaxDepth } = metrics;
    const { headerSeparatorColor, filterBarCollapsedHeight } = theme;

    if (filterBarCollapsedHeight <= 0) {
      return;
    }

    // TODO: store in the model
    const keyColumnGroups = [...columnHeaderGroupMap.values()].filter(
      (group): group is PivotColumnHeaderGroup =>
        isPivotColumnHeaderGroup(group) && group.isKeyColumnGroup
    );

    if (keyColumnGroups.length === 0) {
      return;
    }

    const filterBoxes = keyColumnGroups.map(group => {
      const { x2, y1, y2 } = getColumnHeaderCoordinates(state, group);
      return {
        depth: group.depth,
        x1: x2 - filterBarCollapsedHeight,
        y1,
        x2,
        y2,
      };
    });

    context.save();

    // Draw the background of the collapsed filter bar
    const { x2 } = filterBoxes[filterBoxes.length - 1];
    context.fillStyle = headerSeparatorColor;
    context.fillRect(
      gridX + x2 - filterBarCollapsedHeight,
      gridY -
        columnHeaderHeight * columnHeaderMaxDepth -
        filterBarCollapsedHeight,
      filterBarCollapsedHeight,
      columnHeaderHeight * (columnHeaderMaxDepth - 1)
    );

    filterBoxes.forEach(({ x2: columnRight, depth }) => {
      this.drawCollapsedColumnSourceFilter(context, state, depth, columnRight);
    });

    context.restore();
  }

  // eslint-disable-next-line class-methods-use-this
  drawCollapsedColumnSourceFilter(
    context: CanvasRenderingContext2D,
    state: IrisGridPivotRenderState,
    headerDepth: number,
    columnRight: Coordinate
  ): void {
    if (columnRight <= 0) {
      return;
    }
    const { metrics, theme, quickFilters, advancedFilters } = state;
    const { columnHeaderHeight, gridY } = metrics;
    // Negative index for column source filters
    const filterIndex = -headerDepth;
    const quickFilter = quickFilters.get(filterIndex);
    const advancedFilter = advancedFilters.get(filterIndex);

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

    const x = columnRight - filterBarCollapsedHeight + 1;
    const y =
      gridY -
      filterBarCollapsedHeight -
      columnHeaderHeight -
      columnHeaderHeight * headerDepth;
    const rectWidth = filterBarCollapsedHeight - 1;
    const rectHeight = columnHeaderHeight - 1;
    context.fillRect(x, y, rectWidth, rectHeight);

    context.restore();
  }

  /* column filter headers end */
  // TODO: remove ^
}

export default IrisGridPivotRenderer;
