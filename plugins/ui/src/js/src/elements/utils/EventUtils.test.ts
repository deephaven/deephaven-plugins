import { getTargetName } from './EventUtils';

describe('getTargetName', () => {
  it('should return the name attribute if it exists', () => {
    const target = document.createElement('div');
    target.setAttribute('name', 'test-name');
    expect(getTargetName(target)).toBe('test-name');
  });

  it('should return the name if both name and id exist', () => {
    const target = document.createElement('div');
    target.setAttribute('name', 'test-name');
    target.setAttribute('id', 'test-id');
    expect(getTargetName(target)).toBe('test-name');
  });

  it('should return the id attribute if the name attribute does not exist', () => {
    const target = document.createElement('div');
    target.setAttribute('id', 'test-id');
    expect(getTargetName(target)).toBe('test-id');
  });

  it('should return undefined if neither the name nor id attribute exists', () => {
    const target = document.createElement('div');
    expect(getTargetName(target)).toBeUndefined();
  });

  it('should return undefined if the target is null', () => {
    expect(getTargetName(null)).toBeUndefined();
  });

  it('should return undefined if the target is not an Element', () => {
    const target = {} as EventTarget;
    expect(getTargetName(target)).toBeUndefined();
  });
});
