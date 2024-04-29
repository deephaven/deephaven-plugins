import React from 'react';
import { Button } from '@deephaven/components';
import { vsRefresh } from '@deephaven/icons';
import ErrorView from './ErrorView';
import { WidgetError } from './WidgetTypes';

/** Component that takes a WidgetError and displays the contents in an ErrorView, and has a button to reload the widget from a fresh state. */
function WidgetErrorView({
  error,
  onReload: onReset,
}: {
  error: WidgetError;
  onReload: () => void;
}): JSX.Element {
  const displayMessage = `${error.message.trim()}\n\n${
    error.stack ?? ''
  }`.trim();
  return (
    <div className="ui-widget-error-view">
      <div className="widget-error-view-content">
        <ErrorView message={displayMessage} type={error.type} isExpanded />
      </div>
      <div className="widget-error-view-footer">
        <Button kind="tertiary" icon={vsRefresh} onClick={onReset}>
          Reload
        </Button>
      </div>
    </div>
  );
}

export default WidgetErrorView;
