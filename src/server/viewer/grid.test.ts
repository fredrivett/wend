import { describe, expect, it } from 'vitest';
import { GRID_SIZE, snapCeil } from './grid';

describe('GRID_SIZE', () => {
  it('is a positive integer', () => {
    expect(GRID_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(GRID_SIZE)).toBe(true);
  });
});

describe('snapCeil', () => {
  it('rounds up to the nearest grid multiple', () => {
    expect(snapCeil(1)).toBe(GRID_SIZE);
    expect(snapCeil(GRID_SIZE - 1)).toBe(GRID_SIZE);
    expect(snapCeil(GRID_SIZE + 1)).toBe(GRID_SIZE * 2);
  });

  it('returns the value unchanged when already on a grid boundary', () => {
    expect(snapCeil(GRID_SIZE)).toBe(GRID_SIZE);
    expect(snapCeil(GRID_SIZE * 3)).toBe(GRID_SIZE * 3);
  });

  it('returns 0 for 0', () => {
    expect(snapCeil(0)).toBe(0);
  });

  it('handles fractional values', () => {
    expect(snapCeil(0.5)).toBe(GRID_SIZE);
    expect(snapCeil(GRID_SIZE + 0.1)).toBe(GRID_SIZE * 2);
  });
});
