import { defineEval } from "eve/evals";
import { matches } from "eve/evals/expect";
import { z } from "zod";

// False-positive discipline: on correct code, the skeptic must not invent a
// high-severity defect. We assert the synthesised report contains no [HIGH]
// finding. (A correctly-rated low-severity edge-case note is acceptable.)
export default defineEval({
  description: "false-positive/clamp: no high-severity finding on correct code",
  async test(t) {
    await t.send(
      "Run a review of /workspace/samples/clean-clamp and produce the FINDINGS.md report.",
    );
    t.completed();
    t.calledSubagent("reviewer");
    t.check(
      t.reply,
      matches(
        z
          .string()
          .refine((s) => !/\[HIGH\]/i.test(s), "report must contain no HIGH-severity finding"),
      ),
    );
  },
});
