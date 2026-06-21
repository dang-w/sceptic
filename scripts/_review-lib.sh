# Shared helpers for the sceptic verification scripts. Source this; don't run it.
# shellcheck shell=bash

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="http://127.0.0.1:3000"
PORT=3000
SERVER_LOG="/tmp/sceptic-server.log"

# A single hash over the version-controlled state (tracked + untracked, minus
# anything .gitignore covers). Framework scratch like .workflow-data/, .eve/,
# and .output/ is gitignored and legitimately changes during a run — it is not
# part of the repository, so it does not count as a mutation of the code.
snapshot() {
  {
    ( cd "$REPO" && git ls-files --cached --others --exclude-standard -z \
        | sort -z | xargs -0 shasum )
    echo "--- git status ---"; git -C "$REPO" status --porcelain
    echo "--- git head ---"; git -C "$REPO" rev-parse HEAD 2>/dev/null || echo "NO_HEAD"
  } | shasum | awk '{print $1}'
}

start_server() {
  # Load sceptic/.env if present (gitignored) so a project-local ANTHROPIC_API_KEY
  # overrides whatever is in the ambient session env. Lets you point the agent at
  # a specific funded account without exporting anything globally.
  (
    cd "$REPO" || exit 1
    set -a; [ -f "$REPO/.env" ] && . "$REPO/.env"; set +a
    exec npm exec -- eve start >"$SERVER_LOG" 2>&1
  ) &
  SERVER_PID=$!
  for _ in $(seq 1 30); do
    lsof -iTCP:$PORT -sTCP:LISTEN -P 2>/dev/null | grep -qi node && return 0
    sleep 1
  done
  echo "FAIL: server never came up"; cat "$SERVER_LOG"; return 1
}

stop_server() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  pkill -f "eve start" 2>/dev/null
  lsof -iTCP:$PORT -sTCP:LISTEN -P 2>/dev/null | grep -i node | awk '{print $2}' | xargs -r kill 2>/dev/null
}

# run_review <message> <out_file>
# Runs one review to completion and writes the coordinator's final report to out_file.
run_review() {
  local msg="$1" out="$2" stream resp sid spid
  stream="$(mktemp)"
  resp="$(curl -s -X POST "$BASE/eve/v1/session" -H "Content-Type: application/json" \
    -d "{\"message\":\"$msg\"}")"
  sid="$(printf '%s' "$resp" | sed -n 's/.*"sessionId":"\([^"]*\)".*/\1/p')"
  if [ -z "$sid" ]; then echo "FAIL: no session id from $resp"; return 1; fi
  curl -sN --max-time 420 "$BASE/eve/v1/session/$sid/stream" > "$stream" &
  spid=$!
  for _ in $(seq 1 420); do
    grep -q '"finishReason":"stop"' "$stream" 2>/dev/null && break
    kill -0 "$spid" 2>/dev/null || break
    sleep 1
  done
  kill "$spid" 2>/dev/null
  cp "$stream" /tmp/sceptic-last-stream.ndjson
  # Fail closed: a run that errored (e.g. model/credit/auth failure) must not be
  # mistaken for a clean review with no findings.
  if grep -q '"type":"session.failed"' "$stream" || ! grep -q '"type":"message.completed"' "$stream"; then
    echo "ERROR: review run did not complete — cannot trust its output."
    grep -oE '"message":"[^"]{0,160}' "$stream" | head -1
    rm -f "$stream"
    return 1
  fi
  node -e '
    const fs=require("fs");
    const lines=fs.readFileSync(process.argv[1],"utf8").split("\n").filter(Boolean);
    let m=""; for(const l of lines){try{const e=JSON.parse(l); if(e.type==="message.completed"&&e.data&&e.data.message) m=e.data.message;}catch{}}
    fs.writeFileSync(process.argv[2], m||"(no final message captured)");
  ' "$stream" "$out" 2>/dev/null || cp "$stream" "$out"
  cp "$stream" /tmp/sceptic-last-stream.ndjson
  rm -f "$stream"
}
