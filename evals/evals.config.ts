import { defineEvalConfig } from "eve/evals";
import { JUnit } from "eve/evals/reporters";

// Assertions are deterministic (messageIncludes / matches), so no judge model is
// configured — keeping eval runs cheap and reproducible. JUnit output feeds CI.
export default defineEvalConfig({
  maxConcurrency: 2,
  timeoutMs: 420_000,
  reporters: [JUnit({ filePath: ".eve/junit.xml" })],
});
