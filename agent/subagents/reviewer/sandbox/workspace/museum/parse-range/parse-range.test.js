import { test } from "node:test";
import assert from "node:assert/strict";

import { parseRange } from "./parse-range.js";

test("starts at the start value", () => {
  assert.equal(parseRange("2-5")[0], 2);
});

test("returns ascending consecutive integers", () => {
  const out = parseRange("1-4");
  for (let i = 1; i < out.length; i++) {
    assert.equal(out[i], out[i - 1] + 1);
  }
});
