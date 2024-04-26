import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsDiffAdded, vsDiffRemoved, vsWarning } from '@deephaven/icons';
import {
  useDebouncedCallback,
  useResizeObserver,
} from '@deephaven/react-hooks';
import { Button, CopyButton } from '@deephaven/components';

export type ErrorViewerProps = {
  /** The message to display in the error view */
  message: string;

  /** Set to true if you want the error view to display expanded. Will not show the Show More/Less buttons if true. Defaults to false. */
  isExpanded?: boolean;

  /** The type of error message to display in the header. Defaults to Error. */
  type?: string;
};

/**
 * Component that displays an error message in a textarea so user can scroll and a copy button.
 * TODO: Remove once using the @deephaven/components ErrorView: https://github.com/deephaven/web-client-ui/pull/1965
 */
function ErrorView({
  message,
  isExpanded: isExpandedProp = false,
  type = 'Error',
}: ErrorViewerProps): JSX.Element {
  const [isExpandable, setIsExpandable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLPreElement>(null);

  const handleResize = useCallback(() => {
    if (isExpanded || textareaRef.current == null) {
      return;
    }
    const newIsExpandable =
      textareaRef.current.scrollHeight > textareaRef.current.clientHeight;
    setIsExpandable(newIsExpandable);
  }, [isExpanded]);

  const debouncedHandleResize = useDebouncedCallback(handleResize, 100);

  useResizeObserver(viewRef.current, debouncedHandleResize);

  useLayoutEffect(debouncedHandleResize, [debouncedHandleResize]);

  return (
    <div
      className={classNames('ui-error-view', {
        expanded: isExpanded || isExpandedProp,
      })}
      ref={viewRef}
    >
      <div className="error-view-header">
        <div className="error-view-header-text">
          <FontAwesomeIcon icon={vsWarning} />
          <span>{type}</span>
        </div>
        <div className="error-view-buttons">
          <CopyButton
            kind="danger"
            className="error-view-copy-button"
            tooltip="Copy exception contents"
            copy={`${type}: ${message}`.trim()}
          />
          {(isExpandable || isExpanded) && !isExpandedProp && (
            <Button
              kind="danger"
              className="error-view-expand-button"
              onClick={() => {
                setIsExpanded(!isExpanded);
              }}
              icon={isExpanded ? vsDiffRemoved : vsDiffAdded}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>
      </div>
      <pre className="error-view-text" ref={textareaRef}>
        {message}
      </pre>
    </div>
  );
}

export default ErrorView;
