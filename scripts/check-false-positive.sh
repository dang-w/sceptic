#!/bin/bash
#
# check-false-positive.sh — false-positive discipline (Phase 3.2).
#
# Reviews a CLEAN, correct fixture and asserts the skeptic does NOT report a
# high-severity defect. A reviewer that hallucinates serious bugs in correct
# code is as broken as one that misses real ones — this guards that.
#
# Usage: bash scripts/check-false-positive.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_review-lib.sh
. "$DIR/_review-lib.sh"

FINDINGS="$(mktemp)"
trap stop_server EXIT

echo "==> Starting sceptic server..."
start_server || exit 1

echo "==> Reviewing the CLEAN fixture (expect NO high-severity findings)..."
run_review "Run a review of /workspace/samples/clean-clamp and produce the FINDINGS.md report." "$FINDINGS" || exit 1

echo
echo "--- coordinator final report (FINDINGS.md) ---"
cat "$FINDINGS"
echo
echo "================ FALSE-POSITIVE DISCIPLINE ================"
if grep -q '\[HIGH\]' "$FINDINGS"; then
  echo "FAIL: a HIGH-severity finding was reported on correct code (false positive)."
  RC=1
else
  echo "PASS: no HIGH-severity finding on correct code."
  RC=0
fi
echo "=========================================================="
exit $RC
