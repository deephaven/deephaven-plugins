import type { ObjectFetcher } from '@deephaven/jsapi-bootstrap';
import type { dh } from '@deephaven/jsapi-types';

export default class UriExportedObject implements dh.WidgetExportedObject {
  static TYPE = 'deephaven.ui.URI';

  constructor(
    readonly uri: string,
    private readonly fetcher: ObjectFetcher
  ) {}

  async reexport(): Promise<dh.WidgetExportedObject> {
    // reexport doesn't actually do anything for URI objects
    return this;
  }

  fetch(): Promise<dh.Widget> {
    return this.fetcher(this.uri);
  }

  // eslint-disable-next-line class-methods-use-this
  close(): void {
    // No-op for URI objects
  }

  // eslint-disable-next-line class-methods-use-this
  get type(): string {
    return UriExportedObject.TYPE;
  }
}
