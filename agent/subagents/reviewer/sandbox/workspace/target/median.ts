/**
 * Returns the median of a list of numbers.
 */
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median of empty list is undefined");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid];
}
