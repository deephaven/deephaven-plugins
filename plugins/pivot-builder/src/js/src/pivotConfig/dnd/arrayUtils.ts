/** Remove the element at `index`, returning a new array. */
export function removeAt<T>(arr: readonly T[], index: number): T[] {
  const next = arr.slice();
  next.splice(index, 1);
  return next;
}

/** Move the element from `from` to `to`, returning a new array. */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  const next = arr.slice();
  if (from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
