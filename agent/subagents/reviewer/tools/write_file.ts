import { disableTool } from "eve/tools";

// Layer 1 of the read-only guarantee: the reviewer has no file-writing tool.
// Removing write_file means the model is never even offered a way to mutate a
// file (host or sandbox). Enforcement, not guidance.
export default disableTool();
