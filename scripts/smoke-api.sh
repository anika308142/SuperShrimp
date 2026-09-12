#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8000/api/v1}"

echo "== fixtures =="
curl -sS "$BASE/admin/fixtures" | python3 -c "import json,sys; d=json.load(sys.stdin); print('operator', d['operator']['name']); print('tickets', [t['number'] for t in d['ids']['tickets']])"

echo "== briefing =="
curl -sS "$BASE/dashboard/briefing" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['health']['status'], d['health']['summary'])"

echo "== search Northstar =="
curl -sS "$BASE/search?q=Northstar" | python3 -c "import json,sys; d=json.load(sys.stdin); print([(h['type'], h['label']) for h in d['data'][:5]])"

echo "== send draft without approval (expect 422) =="
code=$(curl -sS -o /tmp/agentcy-err.json -w '%{http_code}' -X PATCH "$BASE/tickets/tkt_001" -H 'Content-Type: application/json' -d '{"send_draft":true,"version":9}')
echo "HTTP $code"
python3 -c "import json; print(json.load(open('/tmp/agentcy-err.json'))['error']['message'])"

echo "== qualify Lumen Pay without budget (expect 422) =="
code=$(curl -sS -o /tmp/agentcy-err.json -w '%{http_code}' -X PATCH "$BASE/leads/led_004" -H 'Content-Type: application/json' -d '{"stage":"qualified","version":1}')
echo "HTTP $code"
python3 -c "import json; print(json.load(open('/tmp/agentcy-err.json'))['error']['message'])"

echo "== retry failed run =="
curl -sS -X POST "$BASE/agent-runs/run_003/retry" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])"

echo "== stale version conflict (expect 409) =="
code=$(curl -sS -o /tmp/agentcy-err.json -w '%{http_code}' -X PATCH "$BASE/todos/tdo_003" -H 'Content-Type: application/json' -d '{"completed":true,"version":0}')
echo "HTTP $code"
python3 -c "import json; print(json.load(open('/tmp/agentcy-err.json'))['error']['code'])"

echo "== reset =="
curl -sS -X POST "$BASE/admin/reset" | python3 -c "import json,sys; print(json.load(sys.stdin)['message'])"

echo "OK"
