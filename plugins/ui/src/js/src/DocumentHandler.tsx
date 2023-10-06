import React from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { ElementNode } from './ElementUtils';

import ReactPanel from './ReactPanel';
import renderElement from './renderElement';
import ElementView from './ElementView';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

export interface DocumentHandlerProps {
  definition: WidgetDefinition;

  /** The root element to render */
  element: ElementNode;
}

function DocumentHandler({ definition, element }: DocumentHandlerProps) {
  log.debug('Rendering document', element);
  return (
    <ReactPanel title={definition.title ?? definition.id ?? definition.type}>
      <ElementView element={element} />
    </ReactPanel>
  );
}

DocumentHandler.displayName = '@deephaven/js-plugin-ui/DocumentHandler';

export default DocumentHandler;
