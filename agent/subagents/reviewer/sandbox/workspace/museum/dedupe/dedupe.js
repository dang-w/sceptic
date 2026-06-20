/**
 * Returns a new array with duplicate values removed, preserving first-seen order.
 */
export function dedupe(values) {
  const seen = [];
  for (const v of values) {
    if (seen.indexOf(v) === -1) {
      seen.push(v);
    }
  }
  return seen;
}
