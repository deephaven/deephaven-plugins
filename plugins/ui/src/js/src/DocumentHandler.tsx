import React, { useCallback, useMemo, useRef } from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { ElementNode, getElementKey } from './ElementUtils';

import ReactPanel from './ReactPanel';
import ElementView from './ElementView';
import { isPanelElementNode } from './PanelUtils';
import { MixedPanelsError, NoChildrenError } from './errors';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

export interface DocumentHandlerProps {
  /** Definition of the widget used to create this document. Used for titling panels if necessary. */
  definition: WidgetDefinition;

  /** The root element to render */
  element: ElementNode;

  /** Triggered when all panels opened from this document have closed */
  onClose?: () => void;
}

/**
 * Handles rendering a document for one widget.
 * The document is a tree of elements. From the root node, the children are either all panels (opening more than one panel),
 * or all non-panels, which will automatically be wrapped in one panel.
 * Responsible for opening any panels or dashboards specified in the document.
 */
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
      throw new Error('Panel open count is negative');
    }
    log.debug('Panel closed, open count', panelOpenCountRef.current);
    if (panelOpenCountRef.current === 0) {
      onClose?.();
    }
  }, [onClose]);

  const metadata = useMemo(
    () => ({
      name: definition.title ?? definition.name,
      type: definition.type,
    }),
    [definition]
  );
  const { children } = element.props ?? {};
  const childrenArray = Array.isArray(children) ? children : [children];
  const childPanelCount = childrenArray.reduce(
    (count, child) => count + (isPanelElementNode(child) ? 1 : 0),
    0
  );
  if (childrenArray.length === 0) {
    throw new NoChildrenError('No children to render');
  }
  if (childPanelCount !== 0 && childPanelCount !== childrenArray.length) {
    throw new MixedPanelsError('Cannot mix panel and non-panel elements');
  }
  if (childPanelCount === 0) {
    // No panels, just add the root element to one panel are render it
    return (
      <ReactPanel
        title={definition.title ?? definition.id ?? definition.type}
        metadata={metadata}
      >
        <ElementView element={element} />
      </ReactPanel>
    );
  }

  return (
    <>
      {childrenArray.map((child, i) => {
        const key = getElementKey(child, `${i}`);
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
            metadata={metadata}
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
