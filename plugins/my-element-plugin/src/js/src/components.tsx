import React, {
  useState,
  useCallback,
  useEffect,
  MouseEventHandler,
} from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function FishTable(props: { table: unknown }) {
  const dh = useApi();
  const { table } = props;

  const [newTable, setNewTable] = useState<DhType.Table | undefined>(undefined);
  const [data, setData] = useState<Array<string>>([]);

  const getData = useCallback(async (): Promise<void> => {
    if (!newTable) {
      return;
    }
    const viewportData = await newTable.getViewportData();

    const column = viewportData.columns.find(
      col => col.name === 'Sym'
    ) as DhType.Column;

    const rows = viewportData.rows.map(row => row.get(column));
    setData(rows);
  }, [newTable]);

  useEffect(() => {
    async function fetchTableNow() {
      const fetchedTable = (await table.fetch()) as DhType.Table;
      fetchedTable.setViewport(0, 10);
      fetchedTable.addEventListener<DhType.SubscriptionTableData>(
        dh.Table.EVENT_UPDATED,
        e => getData()
      );
      setNewTable(fetchedTable);
    }
    fetchTableNow();
  }, [dh, getData, table]);

  const buildFishTable = useCallback(
    () => (
      <table>
        <thead>
          <tr>
            <th>{data.filter(row => row === 'FISH').length} Fish Detected!</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            // eslint-disable-next-line react/jsx-key
            <tr
              style={{ backgroundColor: row === 'FISH' ? 'salmon' : undefined }}
            >
              <td>{row === 'FISH' ? '🐟' : row}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    [data]
  );

  return buildFishTable();
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function ElementPanel({
  name,
  onClick,
}: {
  name: string;
  onClick: (value: string) => Promise<void>;
}): JSX.Element {
  return <h1 onClick={e => onClick('hello')}>Hello {name}!</h1>;
}
