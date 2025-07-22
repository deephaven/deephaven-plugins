export default class UriExportedObject {
  static TYPE = 'deephaven.ui.URI';

  constructor(readonly uri: string) {}

  // eslint-disable-next-line class-methods-use-this
  get type(): string {
    return UriExportedObject.TYPE;
  }
}
