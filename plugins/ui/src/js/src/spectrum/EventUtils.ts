export function getTargetName(target: EventTarget | null): string | undefined {
  if (target instanceof Element) {
    return (
      target.getAttribute('name') ?? target.getAttribute('id') ?? undefined
    );
  }
  return undefined;
}

export default getTargetName;
