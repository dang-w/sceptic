/**
 * Clamps `value` to the inclusive range [min, max].
 * Throws if the range is invalid (min > max).
 */
export function clamp(value, min, max) {
  if (min > max) {
    throw new Error(`clamp: invalid range, min (${min}) must be <= max (${max})`);
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
