import { anthropic } from "@ai-sdk/anthropic";

// All model choices live here, not hardcoded across the agent tree (handoff
// principle 5). Using the direct `@ai-sdk/anthropic` provider keeps sceptic
// runnable locally with only ANTHROPIC_API_KEY — no Vercel AI Gateway account.
// Swap these for AI-Gateway strings (e.g. "anthropic/claude-opus-4.8") if you
// have AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN instead.

// The coordinator plans the review and synthesises findings — a strong
// judgement model.
export const coordinatorModel = anthropic("claude-opus-4-8");

// Reviewers do scoped, evidence-led reading — a faster/cheaper model is fine
// and keeps a 3-way fan-out affordable.
export const reviewerModel = anthropic("claude-sonnet-4-6");
