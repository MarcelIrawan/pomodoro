// Tiny className joiner (clsx-like, ADR-006 spirit: no dependency).
// Accepts Preact's Signalish strings so components can be called with signal class props.
type ClassPart = string | false | null | undefined | { value?: string | null | undefined };

export function cn(...parts: ClassPart[]): string {
  const resolved: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      resolved.push(part);
    } else if (typeof part.value === 'string' && part.value) {
      resolved.push(part.value);
    }
  }
  return resolved.join(' ');
}
