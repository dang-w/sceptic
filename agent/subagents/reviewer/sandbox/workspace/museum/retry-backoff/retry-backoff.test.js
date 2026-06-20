import { test } from "node:test";
import assert from "node:assert/strict";

import { retry } from "./retry-backoff.js";

test("returns the result once fn succeeds", async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls += 1;
    if (calls < 3) throw new Error("not yet");
    return "ok";
  });
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("throws the last error when all attempts fail", async () => {
  await assert.rejects(
    retry(async () => {
      throw new Error("always fails");
    }, 2),
    /always fails/,
  );
});
