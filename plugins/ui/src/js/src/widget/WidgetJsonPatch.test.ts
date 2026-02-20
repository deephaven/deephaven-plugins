import { applyPatch, Operation } from 'fast-json-patch';
import { applyJsonPatch } from './WidgetJsonPatch';

describe('WidgetJsonPatch', () => {
  it('applies a JSON patch to a document', () => {
    const document = { a: 1, b: 2 };
    const patch: Operation[] = [{ op: 'replace', path: '/a', value: 3 }];
    const result = applyJsonPatch(document, patch);
    const fastResult = applyPatch(document, patch).newDocument;
    expect(result).toEqual({ a: 3, b: 2 });
    // Compare with fast-json-patch result
    expect(result).toEqual(fastResult);
  });
});
