import { defineAgent } from "eve";

import { reviewerModel } from "../../lib/models.js";

export default defineAgent({
  description:
    "Adversarially reviews the code seeded into its sandbox at /workspace/target and " +
    "returns ranked, evidence-backed findings as a single JSON object. Strictly read-only: " +
    "it can read, search, and (later) run the build/tests, but has no tool that can modify " +
    "anything, on the host or in its sandbox.",
  model: reviewerModel,
});
