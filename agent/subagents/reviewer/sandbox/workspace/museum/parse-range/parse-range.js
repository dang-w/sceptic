/**
 * Parses a "start-end" spec into the inclusive list of integers from start to
 * end. For example, "2-5" yields [2, 3, 4, 5].
 */
export function parseRange(spec) {
  const [start, end] = spec.split("-").map(Number);
  const out = [];
  for (let i = start; i < end; i++) {
    out.push(i);
  }
  return out;
}
