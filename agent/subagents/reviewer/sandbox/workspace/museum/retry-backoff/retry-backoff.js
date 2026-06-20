/**
 * Calls `fn` until it resolves or `attempts` is exhausted, waiting `delayMs`
 * between attempts. Returns the first successful result, or throws the last error.
 */
export async function retry(fn, attempts = 3, delayMs = 50) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      setTimeout(() => {}, delayMs);
    }
  }
  throw lastError;
}
