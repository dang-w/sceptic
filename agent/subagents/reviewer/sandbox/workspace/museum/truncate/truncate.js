/**
 * Truncates `str` to at most `max` characters, appending an ellipsis ("…") when
 * the string was shortened. A "character" is one visible character.
 */
export function truncate(str, max) {
  if (str.length <= max) {
    return str;
  }
  return str.slice(0, max) + "…";
}
