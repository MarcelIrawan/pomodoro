import { describe, expect, it } from 'vitest';

import {
  barBoxes,
  formatMinutes,
  linePath,
  linePoints,
  niceMax,
  ringGeometry,
} from '../src/lib/charts.ts';

describe('charts', () => {
  it('barBoxes: one bar per value, tallest at max, zero-values get a 2px stub', () => {
    const boxes = barBoxes([10, 0, 20, 5], 300, 140, 20);
    expect(boxes).toHaveLength(4);
    const tallest = Math.max(...boxes.map((b) => b.height));
    expect(boxes[2]?.height).toBe(tallest);
    expect(boxes[1]?.height).toBe(2);
    for (let i = 1; i < boxes.length; i += 1) {
      expect(boxes[i]!.x).toBeGreaterThan(boxes[i - 1]!.x);
    }
  });

  it('linePoints: spans full inner width and normalizes by max', () => {
    const points = linePoints([2, 4, 8], 320, 140, 20);
    expect(points).toHaveLength(3);
    expect(points[0]!.x).toBeCloseTo(20);
    expect(points[2]!.x).toBeCloseTo(300);
    expect(points[2]!.y).toBeLessThan(points[0]!.y); // higher value -> higher line
    expect(linePoints([], 320, 140, 20)).toEqual([]);
  });

  it('linePath: prefixes M and joins with L', () => {
    const d = linePath([
      { x: 1, y: 2 },
      { x: 3.333, y: 4.5 },
    ]);
    expect(d).toBe('M1.00,2.00 L3.33,4.50');
    expect(linePath([])).toBe('');
  });

  it('ringGeometry: radius honors stroke width and dashOffset clamps progress', () => {
    const geom = ringGeometry(240, 12, 0.5);
    expect(geom.r).toBe((240 - 12) / 2);
    expect(geom.circumference).toBeCloseTo(2 * Math.PI * geom.r);
    expect(geom.dashOffset).toBeCloseTo(geom.circumference * 0.5);
    expect(ringGeometry(240, 12, -1).dashOffset).toBeCloseTo(geom.circumference);
    expect(ringGeometry(240, 12, 2).dashOffset).toBeCloseTo(0);
  });

  it('niceMax: snaps up to 1/2/5/10 magnitudes', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(5);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(24)).toBe(50);
    expect(niceMax(120)).toBe(200);
  });

  it('formatMinutes: rounds seconds to whole minutes', () => {
    expect(formatMinutes(0)).toBe(0);
    expect(formatMinutes(89)).toBe(1);
    expect(formatMinutes(3600)).toBe(60);
  });
});
