import { test } from "node:test";
import assert from "node:assert/strict";

import { median } from "./median.js";

// Note: these tests only exercise odd-length inputs. They all pass against the
// current implementation — yet the implementation is wrong for even-length
// inputs. Green tests are not proof of correctness.
test("median of an odd-length list", () => {
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([9, 1, 5, 3, 7]), 5);
});

test("median throws on empty input", () => {
  assert.throws(() => median([]));
});
