import { defineSandbox } from "eve/sandbox";
import { docker } from "eve/sandbox/docker";

// Pin the local Docker backend so the whole agent runs with no Vercel account.
// Docker gives real container isolation: the model's bash/file tools proxy into
// an ephemeral /workspace, never the host repo or git history. This is the L0
// foundation of the read-only guarantee (see NOTES-eve-api.md, D3).
export default defineSandbox({
  backend: docker(),
});
