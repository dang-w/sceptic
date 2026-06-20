#!/bin/bash
#
# check-immutable.sh — the load-bearing proof.
#
# Boots the sceptic agent, runs a full read-only review, and asserts the
# repository (every tracked + untracked file, plus git state) is BYTE-IDENTICAL
# before and after. If a review can mutate the repo, this fails.
#
# Usage: bash scripts/check-immutable.sh ["review request message"]
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_review-lib.sh
. "$DIR/_review-lib.sh"

MSG="${1:-Run a review of /workspace/samples/buggy-median and produce the FINDINGS.md report.}"
FINDINGS="$(mktemp)"
trap stop_server EXIT

echo "==> Starting sceptic server..."
start_server || exit 1

echo "==> Snapshot BEFORE review..."
BEFORE="$(snapshot)"; echo "    before = $BEFORE"

echo "==> Review: $MSG"
run_review "$MSG" "$FINDINGS" || exit 1

echo "==> Snapshot AFTER review..."
AFTER="$(snapshot)"; echo "    after  = $AFTER"

echo
echo "================ IMMUTABILITY ================"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "PASS: repository is byte-identical before and after the review."
  RC=0
else
  echo "FAIL: repository CHANGED during the review:"
  git -C "$REPO" status --porcelain
  RC=1
fi
echo "============================================="
echo
echo "--- reviewer audit trail (only read-only tools should appear) ---"
grep -E "reviewer-audit|subagent" "$SERVER_LOG" | head -40 || true
echo
echo "--- coordinator final report (FINDINGS.md) ---"
cat "$FINDINGS"
echo
exit $RC
