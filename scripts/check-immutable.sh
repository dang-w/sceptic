#!/bin/bash
#
# check-immutable.sh — the load-bearing proof.
#
# Boots the sceptic agent, runs a full read-only review against the bundled
# target, and asserts the repository (every tracked + untracked file, plus git
# state) is BYTE-IDENTICAL before and after. If a review can mutate the repo,
# this fails. This is the test behind the read-only guarantee.
#
# Usage: bash scripts/check-immutable.sh
set -u

REPO="/Users/dan/code/sceptic"
BASE="http://127.0.0.1:3000"
PORT=3000
FINDINGS_OUT="$(mktemp)"
STREAM_OUT="/tmp/sceptic-last-stream.ndjson"

# --- snapshot: a single hash over the version-controlled state ---
# We hash exactly the files git tracks or would track (tracked + untracked,
# minus anything .gitignore covers). That is the right definition of "the repo":
# framework scratch like .workflow-data/, .eve/, .output/ is gitignored and
# legitimately changes during a run — it is not part of the repository, and a
# review touching it is not a mutation of the code under review.
snapshot() {
  {
    ( cd "$REPO" && git ls-files --cached --others --exclude-standard -z \
        | sort -z | xargs -0 shasum )
    echo "--- git status ---"
    git -C "$REPO" status --porcelain
    echo "--- git head ---"
    git -C "$REPO" rev-parse HEAD 2>/dev/null || echo "NO_HEAD"
  } | shasum | awk '{print $1}'
}

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  pkill -f "eve start" 2>/dev/null
  lsof -iTCP:$PORT -sTCP:LISTEN -P 2>/dev/null | grep -i node | awk '{print $2}' | xargs -r kill 2>/dev/null
}
trap cleanup EXIT

echo "==> Starting sceptic server..."
( cd "$REPO" && exec npm exec -- eve start >/tmp/sceptic-immutable-server.log 2>&1 ) &
SERVER_PID=$!

for i in $(seq 1 30); do
  if lsof -iTCP:$PORT -sTCP:LISTEN -P 2>/dev/null | grep -qi node; then break; fi
  sleep 1
done
if ! lsof -iTCP:$PORT -sTCP:LISTEN -P 2>/dev/null | grep -qi node; then
  echo "FAIL: server never came up"; cat /tmp/sceptic-immutable-server.log; exit 1
fi

echo "==> Snapshot BEFORE review..."
BEFORE="$(snapshot)"
echo "    before = $BEFORE"

echo "==> Running a full review (coordinator -> reviewer -> FINDINGS)..."
RESP="$(curl -s -X POST "$BASE/eve/v1/session" -H "Content-Type: application/json" \
  -d '{"message":"Run a review of the code in the target workspace and produce the FINDINGS.md report."}')"
SID="$(printf '%s' "$RESP" | sed -n 's/.*"sessionId":"\([^"]*\)".*/\1/p')"
if [ -z "$SID" ]; then echo "FAIL: no session id from $RESP"; exit 1; fi
echo "    session = $SID"

# Stream until the coordinator's turn truly ends (finishReason "stop"), or time out.
curl -sN --max-time 420 "$BASE/eve/v1/session/$SID/stream" > "$STREAM_OUT" &
STREAM_PID=$!
for i in $(seq 1 420); do
  if grep -q '"finishReason":"stop"' "$STREAM_OUT" 2>/dev/null; then break; fi
  if ! kill -0 "$STREAM_PID" 2>/dev/null; then break; fi
  sleep 1
done
kill "$STREAM_PID" 2>/dev/null

# Extract the coordinator's final FINDINGS text (last message.completed's message field).
node -e '
  const fs=require("fs");
  const lines=fs.readFileSync(process.argv[1],"utf8").split("\n").filter(Boolean);
  let msg="";
  for(const l of lines){try{const e=JSON.parse(l); if(e.type==="message.completed"&&e.data&&e.data.message) msg=e.data.message;}catch{}}
  fs.writeFileSync(process.argv[2], msg||"(no final message captured)");
' "$STREAM_OUT" "$FINDINGS_OUT" 2>/dev/null || cp "$STREAM_OUT" "$FINDINGS_OUT"

echo "==> Snapshot AFTER review..."
AFTER="$(snapshot)"
echo "    after  = $AFTER"

echo
echo "================ RESULT ================"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "PASS: repository is byte-identical before and after the review."
  RC=0
else
  echo "FAIL: repository CHANGED during the review."
  echo "Changed files (git status):"
  git -C "$REPO" status --porcelain
  RC=1
fi
echo "======================================="
echo
echo "--- reviewer/coordinator audit (server log) ---"
grep -E "reviewer-audit|subagent" /tmp/sceptic-immutable-server.log | head -40 || true
echo
echo "--- coordinator final report (FINDINGS.md) ---"
cat "$FINDINGS_OUT"
echo
exit $RC
