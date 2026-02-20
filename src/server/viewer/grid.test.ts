import { describe, expect, it } from 'vitest';
import { GRID_SIZE, snapCeil } from './grid';

const SNAP_CEIL_SIZE = GRID_SIZE * 2;

describe('GRID_SIZE', () => {
  it('is a positive integer', () => {
    expect(GRID_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(GRID_SIZE)).toBe(true);
  });
});

describe('snapCeil', () => {
  it('rounds up to the nearest GRID_SIZE * 2 multiple', () => {
    expect(snapCeil(1)).toBe(SNAP_CEIL_SIZE);
    expect(snapCeil(SNAP_CEIL_SIZE - 1)).toBe(SNAP_CEIL_SIZE);
    expect(snapCeil(SNAP_CEIL_SIZE + 1)).toBe(SNAP_CEIL_SIZE * 2);
  });

  it('returns the value unchanged when already on a snap boundary', () => {
    expect(snapCeil(SNAP_CEIL_SIZE)).toBe(SNAP_CEIL_SIZE);
    expect(snapCeil(SNAP_CEIL_SIZE * 3)).toBe(SNAP_CEIL_SIZE * 3);
  });

  it('returns 0 for 0', () => {
    expect(snapCeil(0)).toBe(0);
  });

  it('handles fractional values', () => {
    expect(snapCeil(0.5)).toBe(SNAP_CEIL_SIZE);
    expect(snapCeil(SNAP_CEIL_SIZE + 0.1)).toBe(SNAP_CEIL_SIZE * 2);
  });
});
