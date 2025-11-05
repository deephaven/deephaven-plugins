import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { vsRefresh } from '@deephaven/icons';
import Log from '@deephaven/log';
import { WidgetComponentProps } from '@deephaven/plugin';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  ActionButton,
  DebouncedSearchInput,
  Flex,
  Heading,
  Icon,
  ListView,
} from '@deephaven/components';
import pkg from '../package.json';

function requestPluginInfoMsg() {
  return {
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
    method: 'request_plugin_info',
  } as const;
}

const log = Log.module(`${pkg.name}/PythonRemoteFileSourcePluginView`);

export function PythonRemoteFileSourcePluginView(
  props: WidgetComponentProps
): JSX.Element {
  const { fetch } = props;
  const [items, setItems] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [widget, setWidget] = useState<DhType.Widget | null>(null);
  const dh = useApi();

  const autoFocusRef = useCallback((input: DebouncedSearchInput | null) => {
    input?.focus();
  }, []);

  const searchTextLc = useMemo(() => searchText.toLowerCase(), [searchText]);
  const filteredItems = useMemo(
    () =>
      searchTextLc === ''
        ? items
        : items.filter(item => item.toLowerCase().includes(searchTextLc)),
    [items, searchTextLc]
  );

  useEffect(() => {
    async function init() {
      log.info('Initializing widget');

      // Fetch the widget from the server
      const fetchedWidget = (await fetch()) as DhType.Widget;
      setWidget(fetchedWidget);

      // Add an event listener to the widget to listen for messages from the server
      fetchedWidget.addEventListener<DhType.Widget>(
        dh.Widget.EVENT_MESSAGE,
        ({ detail }) => {
          try {
            const pluginInfo: { result: { full_names: string[] } } = JSON.parse(
              detail.getDataAsString()
            );
            const fullNames = pluginInfo.result.full_names.sort();
            setItems(fullNames);
          } catch (err) {
            log.error('Error handling message', err);
          }
        }
      );

      fetchedWidget.sendMessage(JSON.stringify(requestPluginInfoMsg()), []);
    }

    init();
  }, [dh, fetch]);

  const onRefresh = useCallback(() => {
    // Send the message to the server via the widget
    if (widget != null) {
      setItems([]);
      widget.sendMessage(JSON.stringify(requestPluginInfoMsg()), []);
    }
  }, [widget]);

  // Render a component with the text and a form to send a message to the server
  return (
    <Flex direction="column" height="100%" alignItems="center">
      <Flex alignItems="center" width="100%">
        <Heading level={1} flex margin="size-160">
          Remote Modules
        </Heading>
        <ActionButton isQuiet onPress={onRefresh}>
          <Icon>
            <FontAwesomeIcon icon={vsRefresh} />
          </Icon>
        </ActionButton>
      </Flex>
      <DebouncedSearchInput
        ref={autoFocusRef}
        value={searchText}
        onChange={setSearchText}
      />
      <ListView>{filteredItems}</ListView>
    </Flex>
  );
}

export default PythonRemoteFileSourcePluginView;
