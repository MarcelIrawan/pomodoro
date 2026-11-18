// Hand-rolled SVG chart helpers (ADR-005) — no chart library.
// Pure geometry: callers render <svg> with the returned primitives.

export interface BarBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LinePoint {
  x: number;
  y: number;
}

/**
 * Evenly spaced bars for `values`, fitting in width x height with padding.
 * Height 0 values map to a 2px stub so zero days are still visible.
 */
export function barBoxes(values: number[], width: number, height: number, pad: number): BarBox[] {
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const max = Math.max(1, ...values);
  const n = values.length;
  const step = innerWidth / n;
  const barWidth = Math.max(2, step * 0.62);
  return values.map((value, i) => {
    const h = Math.max(2, (value / max) * innerHeight);
    return {
      x: pad + step * i + (step - barWidth) / 2,
      y: pad + innerHeight - h,
      width: barWidth,
      height: h,
    };
  });
}

/** Smooth-ish polyline points for `values` in width x height with padding. */
export function linePoints(
  values: number[],
  width: number,
  height: number,
  pad: number,
): LinePoint[] {
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{ x: pad + innerWidth / 2, y: pad + innerHeight - (values[0] ?? 0) / max * innerHeight }];
  }
  const step = innerWidth / (n - 1);
  return values.map((value, i) => ({
    x: pad + step * i,
    y: pad + innerHeight - (value / max) * innerHeight,
  }));
}

/** `d` attribute for a polyline through the points. */
export function linePath(points: LinePoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/**
 * Circular progress ring geometry for a timer.
 * Returns SVG props: center coords, radius, stroke dash values.
 */
export function ringGeometry(
  size: number,
  strokeWidth: number,
  progress: number, // 0..1
): { cx: number; cy: number; r: number; circumference: number; dashOffset: number } {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = circumference * (1 - clamped);
  return { cx, cy, r, circumference, dashOffset };
}

export function formatMinutes(totalSeconds: number): number {
  return Math.round(totalSeconds / 60);
}

export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}
