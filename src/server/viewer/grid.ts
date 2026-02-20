export const GRID_SIZE = 8;

const SNAP_CEIL_SIZE = GRID_SIZE * 2;

/** Round a value up to the nearest multiple of SNAP_CEIL_SIZE (GRID_SIZE * 2). */
export function snapCeil(value: number): number {
  return Math.ceil(value / SNAP_CEIL_SIZE) * SNAP_CEIL_SIZE;
}
