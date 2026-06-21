import { defineEval } from "eve/evals";

// The "museum" of plausible-but-wrong code. Each case is a small module whose
// shipped tests PASS but whose implementation is wrong in a way provable by a
// firsthand probe (see the fixtures under
// agent/subagents/reviewer/sandbox/workspace/museum/). The `defect` regex is the
// held-out ground truth: a concept the sceptic's report must mention if it
// actually understood the bug — it is intentionally NOT seeded into the sandbox.

interface CaseSpec {
  readonly defect: RegExp;
  readonly summary: string;
}

export const MUSEUM = {
  dedupe: {
    defect: /\bNaN\b/i,
    summary: "indexOf/=== cannot dedupe NaN",
  },
  "sort-ascending": {
    defect: /lexicograph|as (a )?strings?|default .*sort|coerc|comparator/i,
    summary: "default .sort() is lexicographic, not numeric",
  },
  "retry-backoff": {
    defect: /set\s?timeout|not awaited|no (real )?(delay|back-?off)|without .*(delay|wait)/i,
    summary: "the inter-attempt delay is never awaited",
  },
  "parse-range": {
    defect: /off.?by.?one|exclusive|excludes? .*(end|last)|endpoint|inclusive/i,
    summary: "drops the inclusive endpoint",
  },
  "merge-config": {
    defect: /shallow|shared .*(ref|object|state)|alias|mutat.*default|nested .*(ref|object)/i,
    summary: "shallow spread aliases the nested object",
  },
  truncate: {
    defect: /surrogate|emoji|code ?units?|utf-?16|grapheme|astral|code ?points?/i,
    summary: "splits a UTF-16 surrogate pair",
  },
} satisfies Record<string, CaseSpec>;

/** Builds the catch-rate eval for one museum case. */
export function museumEval(name: keyof typeof MUSEUM) {
  const spec = MUSEUM[name];
  return defineEval({
    description: `museum/${name}: sceptic catches "${spec.summary}"`,
    async test(t) {
      await t.send(
        `Run a review of /workspace/museum/${name} and produce the FINDINGS.md report.`,
      );
      // The run must finish, must actually delegate to a reviewer, and the
      // synthesised report must name the real defect.
      t.completed();
      t.calledSubagent("reviewer");
      t.messageIncludes(spec.defect);
    },
  });
}
