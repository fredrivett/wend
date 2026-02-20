export const GRID_SIZE = 10;

/** Round a value up to the nearest multiple of GRID_SIZE. */
export function snapCeil(value: number): number {
  return Math.ceil(value / GRID_SIZE) * GRID_SIZE;
}
