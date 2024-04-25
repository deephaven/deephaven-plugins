import React, { useState } from 'react';
import classNames from 'classnames';
import { Button, CopyButton } from '@deephaven/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsDiffAdded, vsDiffRemoved, vsWarning } from '@deephaven/icons';

export type ErrorViewerProps = {
  message: string;
  type?: string;
};

/**
 * Component that displays an error message in a textarea so user can scroll and a copy button.
 */
function ErrorView({ message, type = 'Error' }: ErrorViewerProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="error-viewer">
      <label className="text-danger">
        <FontAwesomeIcon icon={vsWarning} />
        {type}
      </label>
      <textarea
        readOnly
        className={classNames({ expanded: isExpanded })}
        value={message}
      />
      <div className="error-viewer-buttons">
        <CopyButton
          kind="danger"
          className="error-viewer-copy-button"
          tooltip="Copy exception contents"
          copy={`${type}: ${message}`}
        />
        <Button
          kind="danger"
          className="error-viewer-expand-button"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          icon={isExpanded ? vsDiffRemoved : vsDiffAdded}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      </div>
    </div>
  );
}

export default ErrorView;
