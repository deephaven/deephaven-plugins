import React from 'react';
import classNames from 'classnames';
import LoadingSpinner from './LoadingSpinner';

type LoadingOverlayProps = {
  className?: string | null;
  'data-testid'?: string;
};

/**
 * A loading overlay that handles displaying a loading spinner
 */
function LoadingOverlay({
  className = undefined,
  'data-testid': dataTestId,
}: LoadingOverlayProps): JSX.Element {
  const spinnerTestId =
    dataTestId != null ? `${dataTestId}-spinner` : undefined;

  return (
    <div className="fill-parent-absolute" data-testid={dataTestId}>
      <div
        className={classNames(
          'iris-panel-message-overlay',
          'fill-parent-absolute'
        )}
      >
        <div className="message-content">
          <div className="message-icon">
            <LoadingSpinner
              className="loading-spinner-large"
              data-testid={spinnerTestId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
