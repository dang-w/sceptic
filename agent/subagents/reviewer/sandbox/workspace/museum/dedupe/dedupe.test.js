import { test } from "node:test";
import assert from "node:assert/strict";

import { dedupe } from "./dedupe.js";

test("removes duplicate primitives, preserving order", () => {
  assert.deepEqual(dedupe([1, 2, 2, 3, 1]), [1, 2, 3]);
  assert.deepEqual(dedupe(["a", "b", "a"]), ["a", "b"]);
});

test("leaves an already-unique array unchanged", () => {
  assert.deepEqual(dedupe([1, 2, 3]), [1, 2, 3]);
});
