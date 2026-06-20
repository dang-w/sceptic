import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeConfig } from "./merge-config.js";

test("applies overrides over the defaults", () => {
  const cfg = mergeConfig({ retries: 5 });
  assert.equal(cfg.retries, 5);
  assert.equal(cfg.timeoutMs, 5000);
});

test("uses the defaults when nothing is overridden", () => {
  assert.equal(mergeConfig().retries, 3);
  assert.equal(mergeConfig().headers["content-type"], "application/json");
});
