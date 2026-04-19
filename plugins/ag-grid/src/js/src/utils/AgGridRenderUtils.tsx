import { type ColDef } from 'ag-grid-community';
import { type CustomCellRendererProps } from 'ag-grid-react';
import { type DeephavenViewportDatasource } from '../datasources';
import { TreeCellRenderer } from '../renderers';

export function getAutoGroupColumnDef(
  datasource: DeephavenViewportDatasource
): ColDef {
  const treeCellRenderer = function customTreeCellRenderer(
    props: CustomCellRendererProps
  ): JSX.Element {
    return (
      <TreeCellRenderer
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        datasource={datasource}
      />
    );
  };
  return {
    cellRenderer: treeCellRenderer,
  };
}

export default {
  getAutoGroupColumnDef,
};
