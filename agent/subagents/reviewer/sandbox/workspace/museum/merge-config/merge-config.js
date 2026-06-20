const DEFAULTS = {
  retries: 3,
  timeoutMs: 5000,
  headers: { "content-type": "application/json" },
};

/**
 * Returns a config object: the defaults with `overrides` applied on top.
 * Callers may freely mutate the returned object.
 */
export function mergeConfig(overrides = {}) {
  return { ...DEFAULTS, ...overrides };
}
