import { test } from "node:test";
import assert from "node:assert/strict";

import { sortAscending } from "./sort-ascending.js";

test("sorts single-digit numbers ascending", () => {
  assert.deepEqual(sortAscending([3, 1, 2]), [1, 2, 3]);
  assert.deepEqual(sortAscending([5, 0, 9, 4]), [0, 4, 5, 9]);
});

test("does not mutate the input", () => {
  const input = [2, 1, 3];
  sortAscending(input);
  assert.deepEqual(input, [2, 1, 3]);
});
