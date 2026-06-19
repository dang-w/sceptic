import { defineHook } from "eve/hooks";

// Layer 3 — the audit tripwire. eve hooks are observe-only: they CANNOT block a
// tool call (NOTES-eve-api.md, D1). So this does not enforce read-only — the
// sandbox (L0) and the disabled write tools (L1) do that. Its job is evidence:
// it records every tool the reviewer actually ran, producing a verifiable
// read-only audit trail, and shouts if a mutating tool ever runs despite the
// allow-list (which would mean a layer above it failed).
const MUTATING_TOOLS = new Set(["write_file", "edit", "edit_file"]);

export default defineHook({
  events: {
    "action.result"(event) {
      const result = event.data.result;
      if (result.kind !== "tool-result") return;
      const breach = MUTATING_TOOLS.has(result.toolName)
        ? " ⚠️ MUTATING TOOL RAN — read-only allow-list was breached"
        : "";
      console.info(`[reviewer-audit] ran tool: ${result.toolName}${breach}`);
    },
  },
});
