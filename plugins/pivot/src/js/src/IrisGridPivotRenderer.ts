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
} from '@deephaven/grid';
import {
  IrisGridCellRendererUtils,
  IrisGridRenderer,
  type IrisGridRenderState,
  type IrisGridThemeType,
} from '@deephaven/iris-grid';
import { isExpandableColumnHeaderGroup } from './ExpandableColumnHeaderGroup';
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
          isExpandableColumnHeaderGroup(headerGroup) &&
          headerGroup.isExpandable;
        const isExpanded =
          isExpandableColumnHeaderGroup(headerGroup) && headerGroup.isExpanded;

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

    // console.log('[3] drawColumnHeader', {
    //   columnText,
    //   minX,
    //   maxX,
    //   columnX,
    //   columnWidth,
    // });

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

    // TODO: hover color when mouse is over the marker
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
}

export default IrisGridPivotRenderer;
