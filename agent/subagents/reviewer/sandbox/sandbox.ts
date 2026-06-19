import { defineSandbox } from "eve/sandbox";
import { docker } from "eve/sandbox/docker";

// The reviewer gets its OWN isolated Docker sandbox — subagents do not share the
// parent's (NOTES-eve-api.md, subagents isolation boundary). The review target is
// seeded into /workspace/target via ./workspace. Every shell/file action the
// reviewer takes is confined to this ephemeral container and cannot reach the
// host repo or its git history (NOTES-eve-api.md, D3 — the L0 read-only layer).
export default defineSandbox({
  backend: docker(),
});
