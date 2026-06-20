import { test } from "node:test";
import assert from "node:assert/strict";

import { clamp } from "./clamp.js";

test("returns the value when it is inside the range", () => {
  assert.equal(clamp(5, 0, 10), 5);
});

test("clamps to the bounds when outside the range", () => {
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
});

test("is inclusive of both bounds", () => {
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
});

test("handles a degenerate single-point range", () => {
  assert.equal(clamp(7, 7, 7), 7);
});

test("handles negative ranges", () => {
  assert.equal(clamp(-5, -10, -1), -5);
  assert.equal(clamp(-20, -10, -1), -10);
});

test("rejects an inverted range", () => {
  assert.throws(() => clamp(1, 10, 0));
});
