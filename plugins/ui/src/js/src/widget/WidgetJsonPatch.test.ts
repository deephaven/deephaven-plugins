import { applyPatch, Operation } from 'fast-json-patch';
import { applyJsonPatch, shallowCopyPath } from './WidgetJsonPatch';

describe('WidgetJsonPatch', () => {
  describe('add operation', () => {
    it('adds a new property to an object', () => {
      const document = { a: 1 };
      const patch: Operation[] = [{ op: 'add', path: '/b', value: 2 }];
      // In all tests compare with fast-json-patch result
      // Compute this first with mutateDocument false so the two apply patches do not stomp each other
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).toEqual(fastResult);
    });

    it('adds an element to an array', () => {
      const document = { items: [1, 2] };
      const patch: Operation[] = [{ op: 'add', path: '/items/1', value: 99 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 99, 2] });
      expect(result).toEqual(fastResult);
    });

    it('appends to the end of an array', () => {
      const document = { items: [1, 2] };
      const patch: Operation[] = [{ op: 'add', path: '/items/-', value: 3 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 2, 3] });
      expect(result).toEqual(fastResult);
    });

    it('adds a nested object', () => {
      const document = { a: { b: 1 } };
      const patch: Operation[] = [{ op: 'add', path: '/a/c', value: { d: 2 } }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { b: 1, c: { d: 2 } } });
      expect(result).toEqual(fastResult);
    });
  });

  describe('remove operation', () => {
    it('removes a property from an object', () => {
      const document = { a: 1, b: 2, c: 3 };
      const patch: Operation[] = [{ op: 'remove', path: '/b' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 1, c: 3 });
      expect(result).toEqual(fastResult);
    });

    it('removes an element from an array', () => {
      const document = { items: [1, 2, 3] };
      const patch: Operation[] = [{ op: 'remove', path: '/items/1' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 3] });
      expect(result).toEqual(fastResult);
    });

    it('removes from the end of an array', () => {
      const document = { items: [1, 2, 3] };
      const patch: Operation[] = [{ op: 'remove', path: '/items/2' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 2] });
      expect(result).toEqual(fastResult);
    });

    it('removes nested properties', () => {
      const document = { a: { b: 1, c: 2 } };
      const patch: Operation[] = [{ op: 'remove', path: '/a/b' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { c: 2 } });
      expect(result).toEqual(fastResult);
    });
  });

  describe('replace operation', () => {
    it('replaces a property value', () => {
      const document = { a: 1, b: 2 };
      const patch: Operation[] = [{ op: 'replace', path: '/a', value: 3 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 3, b: 2 });
      expect(result).toEqual(fastResult);
    });

    it('replaces an array element', () => {
      const document = { items: [1, 2, 3] };
      const patch: Operation[] = [
        { op: 'replace', path: '/items/1', value: 99 },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 99, 3] });
      expect(result).toEqual(fastResult);
    });

    it('replaces a nested value', () => {
      const document = { a: { b: 1, c: 2 } };
      const patch: Operation[] = [{ op: 'replace', path: '/a/b', value: 10 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { b: 10, c: 2 } });
      expect(result).toEqual(fastResult);
    });

    it('replaces an entire object', () => {
      const document = { a: { x: 1, y: 2 } };
      const patch: Operation[] = [
        { op: 'replace', path: '/a', value: { z: 3 } },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { z: 3 } });
      expect(result).toEqual(fastResult);
    });
  });

  describe('copy operation', () => {
    it('copies a property within an object', () => {
      const document = { a: 1, b: 2 };
      const patch: Operation[] = [{ op: 'copy', from: '/a', path: '/c' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 1, b: 2, c: 1 });
      expect(result).toEqual(fastResult);
    });

    it('copies an array element', () => {
      const document = { items: [1, 2, 3] };
      const patch: Operation[] = [
        { op: 'copy', from: '/items/0', path: '/items/1' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 1, 2, 3] });
      expect(result).toEqual(fastResult);
    });

    it('copies a nested object', () => {
      const document = { a: { b: 1, c: 2 }, d: {} };
      const patch: Operation[] = [{ op: 'copy', from: '/a/b', path: '/d/x' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { b: 1, c: 2 }, d: { x: 1 } });
      expect(result).toEqual(fastResult);
    });

    it('copies a complex value', () => {
      const document = { a: { x: 1, y: [2, 3] }, b: {} };
      const patch: Operation[] = [{ op: 'copy', from: '/a', path: '/b/copy' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({
        a: { x: 1, y: [2, 3] },
        b: { copy: { x: 1, y: [2, 3] } },
      });
      expect(result).toEqual(fastResult);
    });
  });

  describe('move operation', () => {
    it('moves a property within an object', () => {
      const document = { a: 1, b: 2, c: 3 };
      const patch: Operation[] = [{ op: 'move', from: '/a', path: '/d' }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ b: 2, c: 3, d: 1 });
      expect(result).toEqual(fastResult);
    });

    it('moves an array element', () => {
      const document = { items: [1, 2, 3, 4] };
      const patch: Operation[] = [
        { op: 'move', from: '/items/0', path: '/items/3' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [2, 3, 4, 1] });
      expect(result).toEqual(fastResult);
    });

    it('moves between array and object properties', () => {
      const document = { items: [1, 2], values: {} };
      const patch: Operation[] = [
        { op: 'move', from: '/items/0', path: '/values/x' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [2], values: { x: 1 } });
      expect(result).toEqual(fastResult);
    });

    it('moves a nested object', () => {
      const document = { a: { x: 1 }, b: { y: 2 }, c: {} };
      const patch: Operation[] = [
        { op: 'move', from: '/b/y', path: '/c/moved' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { x: 1 }, b: {}, c: { moved: 2 } });
      expect(result).toEqual(fastResult);
    });
  });

  describe('test operation', () => {
    it('passes when value matches', () => {
      const document = { a: 1, b: 2 };
      const patch: Operation[] = [{ op: 'test', path: '/a', value: 1 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 1, b: 2 });
      expect(result).toEqual(fastResult);
    });

    it('throws on value mismatch', () => {
      const document = { a: 1, b: 2 };
      const patch: Operation[] = [{ op: 'test', path: '/a', value: 99 }];
      expect(() => applyJsonPatch(document, patch)).toThrow();
    });

    it('tests nested values', () => {
      const document = { a: { b: { c: 'value' } } };
      const patch: Operation[] = [
        { op: 'test', path: '/a/b/c', value: 'value' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { b: { c: 'value' } } });
      expect(result).toEqual(fastResult);
    });

    it('tests array elements', () => {
      const document = { items: [1, 2, 3] };
      const patch: Operation[] = [{ op: 'test', path: '/items/1', value: 2 }];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ items: [1, 2, 3] });
      expect(result).toEqual(fastResult);
    });

    it('tests complex values', () => {
      const document = { a: { x: [1, 2], y: 'hello' } };
      const patch: Operation[] = [
        { op: 'test', path: '/a', value: { x: [1, 2], y: 'hello' } },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: { x: [1, 2], y: 'hello' } });
      expect(result).toEqual(fastResult);
    });
  });

  describe('multiple operations', () => {
    it('applies multiple operations in sequence', () => {
      const document = { a: 1, b: 2, c: 3 };
      const patch: Operation[] = [
        { op: 'add', path: '/d', value: 4 },
        { op: 'remove', path: '/b' },
        { op: 'replace', path: '/a', value: 10 },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 10, c: 3, d: 4 });
      expect(result).toEqual(fastResult);
    });

    it('applies operations with copy and move', () => {
      const document = { a: 1, b: 2 };
      const patch: Operation[] = [
        { op: 'copy', from: '/a', path: '/c' },
        { op: 'move', from: '/b', path: '/d' },
      ];
      const fastResult = applyPatch(document, patch, false, false).newDocument;
      const result = applyJsonPatch(document, patch);
      expect(result).toEqual({ a: 1, c: 1, d: 2 });
      expect(result).toEqual(fastResult);
    });
  });

  describe('shallow copy behavior', () => {
    it('performs shallow copy on modified objects', () => {
      const originalNested = { x: 1 };
      const document = { a: originalNested, b: 2 };
      const patch: Operation[] = [{ op: 'replace', path: '/a/x', value: 10 }];
      const result = applyJsonPatch(document, patch);
      // The nested object should be a different reference (shallow copied)
      expect(result.a).not.toBe(originalNested);
      // But unmodified objects should maintain reference equality where possible
      expect(document.b).toBe(2);
    });

    it('preserves unchanged nested objects', () => {
      const unchangedNested = { y: 2 };
      const document = { a: { x: 1 }, b: unchangedNested, c: 3 };
      const patch: Operation[] = [{ op: 'replace', path: '/a/x', value: 10 }];
      const result = applyJsonPatch(document, patch);
      // The unchanged nested object reference should be preserved
      expect(result.b).toBe(unchangedNested);
      expect(result.c).toBe(3);
    });
  });

  describe('shallowCopyPath', () => {
    it('shallow copies an object along the path', () => {
      const originalNested = { x: 1, y: 2 };
      const document = { a: originalNested };
      shallowCopyPath(document, '/a');
      // The nested object should be a different reference
      expect(document.a).not.toBe(originalNested);
      // But have the same contents
      expect(document.a).toEqual(originalNested);
    });

    it('shallow copies an array along the path', () => {
      const originalArray = [1, 2, 3];
      const document = { items: originalArray };
      shallowCopyPath(document, '/items');
      // The array should be a different reference
      expect(document.items).not.toBe(originalArray);
      // But have the same contents
      expect(document.items).toEqual(originalArray);
    });

    it('shallow copies nested objects along the path', () => {
      const originalDeep = { z: 1 };
      const originalMid = { deep: originalDeep };
      const document = { mid: originalMid };
      shallowCopyPath(document, '/mid/deep');
      // Both should be shallow copied
      expect(document.mid).not.toBe(originalMid);
      expect(document.mid.deep).not.toBe(originalDeep);
      // But contents are the same
      expect(document.mid).toEqual(originalMid);
      expect(document.mid.deep).toEqual(originalDeep);
    });

    it('handles empty path gracefully', () => {
      const originalNested = { x: 1 };
      const document = { a: originalNested };
      shallowCopyPath(document, '');
      // Root should not be re-assigned (empty path does nothing)
      expect(document.a).toBe(originalNested);
    });

    it('handles root path gracefully', () => {
      const originalNested = { x: 1 };
      const document = { a: originalNested };
      shallowCopyPath(document, '/');
      // Root path should not copy root
      expect(document.a).toBe(originalNested);
    });

    it('handles non-existent paths gracefully', () => {
      const document = { a: { b: 1 } };
      // Should not throw on non-existent path
      expect(() => {
        shallowCopyPath(document, '/x/y/z');
      }).not.toThrow();
    });

    it('shallow copies array elements', () => {
      const originalElement = { id: 1 };
      const document = { items: [originalElement, { id: 2 }] };
      shallowCopyPath(document, '/items/0');
      // The array should be shallow copied
      expect(document.items).toEqual([originalElement, { id: 2 }]);
      // The element should also be shallow copied since it's in the path
      expect(document.items[0]).not.toBe(originalElement);
      expect(document.items[0]).toEqual(originalElement);
    });

    it('shallow copies object properties', () => {
      const originalValue = { x: 1 };
      const document = { obj: { prop: originalValue } };
      shallowCopyPath(document, '/obj/prop');
      // The parent object should be shallow copied
      expect(document.obj).toEqual({ prop: originalValue });
      // The property value itself should also be shallow copied
      expect(document.obj.prop).not.toBe(originalValue);
      expect(document.obj.prop).toEqual(originalValue);
    });

    it('handles RFC 6901 escaped paths', () => {
      const originalValue = { x: 1 };
      const document = { 'a/b': { 'c~d': originalValue } };
      // Use escaped path: a/b -> a~1b, c~d -> c~0d
      shallowCopyPath(document, '/a~1b/c~0d');
      // Should shallow copy the nested object
      expect(document['a/b']['c~d']).not.toBe(originalValue);
      expect(document['a/b']['c~d']).toEqual(originalValue);
    });
  });
});
