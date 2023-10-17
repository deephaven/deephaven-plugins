import React, { useCallback, useRef } from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { ElementNode, getElementType } from './ElementUtils';

import ReactPanel from './ReactPanel';
import ElementView from './ElementView';
import { isPanelElementNode } from './PanelUtils';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

export interface DocumentHandlerProps {
  definition: WidgetDefinition;

  /** The root element to render */
  element: ElementNode;

  /** Triggered when all panels opened from this document have closed */
  onClose?: () => void;
}

function DocumentHandler({
  definition,
  element,
  onClose,
}: DocumentHandlerProps) {
  log.debug('Rendering document', element);
  const panelOpenCountRef = useRef(0);

  const handlePanelOpen = useCallback(() => {
    panelOpenCountRef.current += 1;
  }, []);

  const handlePanelClose = useCallback(() => {
    panelOpenCountRef.current -= 1;
    if (panelOpenCountRef.current < 0) {
      throw new Error('Panel open count when negative');
    }
    if (panelOpenCountRef.current === 0) {
      onClose?.();
    }
  }, [onClose]);

  const { children } = element.props ?? {};
  const childrenArray = Array.isArray(children) ? children : [children];

  // Count of each item type to correctly allocate them a key
  const itemTypeCount = new Map<string, number>();
  return (
    <>
      {childrenArray.map((child, i) => {
        const elementType = getElementType(child);
        const currentCount = itemTypeCount.get(elementType) ?? 0;
        itemTypeCount.set(elementType, currentCount + 1);
        const key = `${elementType}-${currentCount}`;
        let title = `${definition.title ?? definition.id ?? definition.type}`;
        if (childrenArray.length > 1) {
          title = `${title} ${i + 1}`;
        }
        if (isPanelElementNode(child)) {
          title = child.props.title ?? title;
        }
        return (
          <ReactPanel
            title={title}
            key={key}
            onOpen={handlePanelOpen}
            onClose={handlePanelClose}
          >
            <ElementView element={child} />
          </ReactPanel>
        );
      })}
    </>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
