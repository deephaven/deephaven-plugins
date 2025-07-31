/* eslint-disable no-alert */
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  type ContextAction,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@deephaven/components';
import type { Column } from '@deephaven/jsapi-types';
import type { TablePluginProps } from '@deephaven/plugin';

type IrisGridContextMenuData = {
  value: string;
  column: Column;
  model: unknown;
};

/**
 * An example of a TablePlugin. Displays a header at the top of the grid, and has custom context menu items.
 * Has a counter button that increments when clicked and persists across page loads.
 *
 * @example
 * from deephaven import empty_table
 *
 * t = (
 *     empty_table(5)
 *     .update("X=i")
 *     .with_attributes({"PluginName": "@deephaven/js-plugin-table-example"})
 * )
 */
const TablePlugin = forwardRef(
  (props: TablePluginProps<number>, ref: React.Ref<unknown>): JSX.Element => {
    const { filter, table, pluginState = 0, onStateChange } = props;
    const [isModalOpen, setModalOpen] = useState(false);
    const confirmButton = useRef<HTMLButtonElement>(null);

    const handleOpenModal = useCallback(() => {
      setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
      setModalOpen(false);
    }, []);

    const getMenu = useCallback(
      (data: IrisGridContextMenuData) => {
        const { value, column, model } = data;
        const { name, type } = column;
        const actions: ContextAction[] = [];

        actions.push({
          title: 'Display value',
          group: 0,
          order: 0,
          action: () => alert(`${value}`),
        });

        actions.push({
          title: 'Show Dialog',
          group: 0,
          order: 10,
          action: handleOpenModal,
        });

        actions.push({
          title: 'Display Table',
          group: 0,
          order: 20,
          action: () => alert(table),
        });

        actions.push({
          title: 'Display Model',
          group: 0,
          order: 30,
          action: () => alert(model),
        });

        const subMenu: ContextAction[] = [];

        actions.push({
          title: 'Filter Sub Menu',
          group: 0,
          order: 40,
          actions: subMenu,
        });

        subMenu.push({
          title: 'Filter by value',
          group: 0,
          order: 0,
          action: () =>
            filter([
              {
                name,
                type,
                value: `${value}`,
              },
            ]),
        });

        subMenu.push({
          title: 'Clear Filter',
          group: 0,
          order: 10,
          action: () => filter([]),
        });

        return actions;
      },
      [filter, handleOpenModal, table]
    );
    useImperativeHandle(ref, () => ({
      getMenu,
    }));

    return (
      <div>
        <label>
          Example Plugin{' '}
          <button type="button" onClick={() => onStateChange(pluginState + 1)}>
            Count {pluginState}
          </button>
        </label>
        <Modal
          isOpen={isModalOpen}
          className="theme-bg-light"
          onOpened={() => {
            confirmButton.current?.focus();
          }}
        >
          <ModalHeader>Plugin Modal Title</ModalHeader>
          <ModalBody>Plugin Modal Body</ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="btn btn-outline-primary"
              data-dismiss="modal"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCloseModal}
              ref={confirmButton}
            >
              Confirm
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
);

TablePlugin.displayName = '@deephaven/js-plugin-table-example/TablePlugin';

export default TablePlugin;
