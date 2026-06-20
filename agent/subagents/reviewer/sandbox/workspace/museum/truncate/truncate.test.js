import { test } from "node:test";
import assert from "node:assert/strict";

import { truncate } from "./truncate.js";

test("shortens a long ASCII string and adds an ellipsis", () => {
  assert.equal(truncate("hello world", 5), "hello…");
});

test("leaves a short string unchanged", () => {
  assert.equal(truncate("hi", 5), "hi");
});
