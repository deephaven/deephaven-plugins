import type { dh as DhType } from '@deephaven/jsapi-types';
import { waitForLogMarker } from './utils.mjs';

/**
 * Test logger that can track log messages between unique marker identifiers.
 * This is needed since `onLogMessage` will subscribe to all log messages from
 * the start of the server, and tests will need to isolate ones specific to the
 * test.
 */
export class TestLogger {
  constructor(private session: DhType.IdeSession) {
    this.session.onLogMessage(msg => {
      if (!this.isTracking) {
        return;
      }

      this.logItems.push(msg);
    });
  }

  isTracking: boolean = false;
  logItems: DhType.ide.LogItem[] = [];

  async start(): Promise<void> {
    await waitForLogMarker(this.session);
    this.isTracking = true;
  }

  async stop(): Promise<void> {
    await waitForLogMarker(this.session);
    this.isTracking = false;
  }
}

export default TestLogger;
