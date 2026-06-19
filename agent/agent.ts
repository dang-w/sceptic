import { defineAgent } from "eve";

import { coordinatorModel } from "./lib/models.js";

export default defineAgent({
  model: coordinatorModel,
});
