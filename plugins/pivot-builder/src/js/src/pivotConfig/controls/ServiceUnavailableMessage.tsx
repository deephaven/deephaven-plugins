import { ReactFontAwesome } from '@deephaven/components';
import { vsWarning } from '@deephaven/icons';

const { FontAwesomeIcon } = ReactFontAwesome;

/**
 * Message shown in the Pivot columns card when the worker
 * doesn't expose a PivotService (e.g. a non-CorePlus worker, or the service was
 * removed and the query restarted).
 */
export default function ServiceUnavailableMessage(): JSX.Element {
  return (
    <div className="pivot-service-unavailable">
      <FontAwesomeIcon icon={vsWarning} />
      <span>Pivot service not available</span>
    </div>
  );
}
