# sceptic

A small, open-source [eve](https://github.com/vercel/eve) agent that runs a **read-only
adversarial code review** — and treats **verification as a primitive**, not an afterthought.

A coordinator fans out parallel review subagents. Each one reads the target code firsthand in
an isolated sandbox, **runs the actual test suite but refuses to trust a green result**, and
grounds every claim in a `path:line` it read plus a falsifying observation. The coordinator
synthesises a single ranked `FINDINGS.md` — with a verbatim *sceptic's case* and an explicit
**"could not verify firsthand"** section for anything it couldn't ground.

The guiding rule, applied to the code under review *and to the reviewer itself*:

> **Claim only what you verified firsthand.**

This is a demonstration artifact, not a dependency — it reviews the small code samples bundled
inside it, to show the *pattern*. It runs entirely on your machine — no Vercel account required.

> **What it is, and what it isn't (yet).** sceptic only reviews the fixtures baked into its
> sandbox at build time (`samples/`, `museum/`). There is **no way yet to point it at your own
> repository, an arbitrary directory, or a pull request** — a real target has to be copied into
> the reviewer's sandbox tree and the agent rebuilt (`npx eve build`). So treat this as a worked
> illustration of *verification as a primitive*, not a reviewer you can adopt as-is. Dynamic
> target injection is the obvious next step and isn't built.

## Why it looks like this

Adversarial review built on a general-purpose agent has a few well-known failure modes. Each
one maps to a design decision here:

| Failure mode | Design response |
| --- | --- |
| A "read-only" reviewer mutates the repo (rewrites history, deletes files) | Reviewers run in an **isolated Docker sandbox** and have **no write tools at all**; an immutability test proves the repo is byte-identical before/after |
| The model "reviews" from memory or a chat summary, not the file on disk | Every finding must cite a **`path:line` read firsthand**; unverifiable claims are quarantined in a separate section |
| Green tests are taken as proof of correctness | The reviewer **runs the suite, then probes the cases the tests miss** |
| A reviewer hallucinates serious bugs in correct code | A false-positive test asserts **zero high-severity findings** on a clean fixture |
| Runaway parallel fan-out / premature lock-in | Reviewers take **no lock-in actions**; only the coordinator emits output |

## The read-only guarantee, in layers

1. **Sandbox isolation (L0).** The model's `bash`/`read_file`/`write_file` tools proxy into an
   ephemeral Docker `/workspace` — they cannot touch the host repo, its git history, or your
   environment. This is the foundation: host mutation is structurally *prevented* by the sandbox
   boundary rather than asked for politely. (A strong mitigation — Docker isolation plus a
   host-side tool proxy — not a formal proof; the boundary is configuration, not physics.)
2. **Tool allow-list (L1).** The reviewer subagent has `write_file` and `web_fetch` removed
   (`disableTool`), so the model is never even offered a way to write.
3. **Approval backstop (L2).** Any tool with host-side side effects would require human
   approval — the reviewer has none by design.
4. **Audit tripwire (L3).** An observe-only hook logs every tool the reviewer runs, producing
   a verifiable read-only audit trail. (eve hooks *observe*; they can't block — enforcement is
   L0+L1.)

Run the proof yourself:

```bash
bash scripts/check-immutable.sh
# => PASS: repository is byte-identical before and after the review.
#    audit trail shows only read-only tools ran (bash, read_file — no write_file)
```

## The firsthand-verification contract

Every finding in the report carries: a severity, a `path:line`, the concern, a **falsifying
test or observation** (a concrete input → expected vs. actual, or a command and its output),
and a confidence rating. Anything the reviewer could not ground that way goes under **"Could
not verify firsthand"** — labelled as unverified, never smuggled in as a finding.

```bash
bash scripts/check-false-positive.sh
# => PASS: no HIGH-severity finding on correct code.
```

## The museum + evals

`fixtures`-style "plausible-but-wrong" cases live in the reviewer's sandbox under `museum/` —
small modules whose shipped tests **pass** but whose implementation is wrong (a lexicographic
number sort, an un-awaited retry delay, a surrogate-splitting truncate, …). The eval suite
grades the sceptic against them:

```bash
# Catch-rate + false-positive-rate, against the local production server:
npx eve build
npx eve start &                       # serves on :3000
npx eve eval --url http://127.0.0.1:3000
```

Each eval asserts the run completed, delegated to a reviewer, and **named the real defect**;
the false-positive eval asserts no high-severity finding on correct code.

> **Note:** evals run via `--url` against `eve start` (the production server). Bare `eve eval`
> uses the dev runtime, which currently can't resolve the direct-provider model object imported
> from a sibling module — see `evals.yml` and the project notes.

## Run it locally

**Prerequisites:** Node 24+, Docker (running), and an Anthropic API key.

```bash
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env   # gitignored; the runner loads it
npx eve build
npx eve start                                 # serves on http://127.0.0.1:3000
```

Then ask for a review over the eve HTTP API:

```bash
curl -s -X POST http://127.0.0.1:3000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Run a review of /workspace/samples/buggy-median and produce the FINDINGS.md report."}'
# stream the result: GET /eve/v1/session/<sessionId>/stream
```

Models are configured in `agent/lib/models.ts` (coordinator `claude-opus-4-8`, reviewers
`claude-sonnet-4-6`) via the direct `@ai-sdk/anthropic` provider, so only `ANTHROPIC_API_KEY`
is needed — no Vercel AI Gateway. Swap in gateway strings (e.g. `"anthropic/claude-opus-4.8"`)
if you'd rather use one.

## Durable by construction

Because it's an eve agent, every run is a durable workflow that checkpoints at each step. That
progress is persisted to disk and survives a crash: kill the server mid-review and the steps it
had already completed are still recorded — the work so far is not lost. eve also parks work
durably when a turn waits on an input (an approval, an OAuth sign-in, a long-running subagent, a
follow-up message), resuming exactly where it left off once that input arrives, even across a
restart. That resilience is inherited from the framework; there's no custom code for it here.

(Worth being precise, in the spirit of the tool: I verified the checkpoint-survives-a-crash
behaviour directly. The input-driven resume is eve's documented design — sceptic's read-only
flow never parks for input, so it doesn't lean on it.)

## Layout

```
agent/
  agent.ts, instructions.md        # the coordinator
  lib/models.ts                    # model config (one place)
  sandbox.ts                       # Docker sandbox
  subagents/reviewer/              # the read-only reviewer
    instructions.md                # the sceptic's stance
    tools/{write_file,web_fetch}.ts# disableTool — read-only allow-list
    hooks/audit.ts                 # observe-only audit tripwire
    sandbox/                       # the reviewer's own sandbox + seeded targets
      workspace/samples/           #   demo fixtures (buggy-median, clean-clamp)
      workspace/museum/            #   the eval corpus
evals/                             # catch-rate + false-positive evals
scripts/                           # check-immutable.sh, check-false-positive.sh
.github/workflows/                 # ci (free, per-push) + evals (manual)
```

## License

[Apache-2.0](./LICENSE).
