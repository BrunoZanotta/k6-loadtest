# k6 Load Test — 500 VUs for 5 Minutes

Constant-VU load test against the public k6 demo API. One scenario sends two GET requests per iteration, applies checks and thresholds, and writes an HTML report plus a JSON summary when the run ends.

Default target: `https://test-api.k6.io/public/crocodiles`

## Scenario

The scenario lives in `src/load_test.js`.

| Setting | Value in the script |
| --- | --- |
| Scenario name | `load` |
| Executor | `constant-vus` |
| Virtual users | `VUS`, default `500` |
| Duration | `DURATION`, default `5m` |
| Graceful stop | `30s` |
| Scenario tag | `scenario: load` |
| Pause | `sleep(1)` at the end of each iteration |

`VUS`, `DURATION`, and `BASE_URL` are read from the environment. `VUS` is parsed with `parseInt(__ENV.VUS, 10)`. If a variable is unset, the script uses the default in the table. `BASE_URL` defaults to `https://test-api.k6.io/public/crocodiles`.

Each iteration runs the two groups below, then sleeps for 1 second.

### `GET /public/crocodiles/`

- Request: `GET ${BASE_URL}/`
- Request tag: `endpoint: list`
- Check `status 200 (list)`: `r.status === 200`
- Check `json válido (list)`: the body parses as JSON and `Array.isArray(r.json())` is true

### `GET /public/crocodiles/{id}/`

- `id` is `1 + Math.floor(Math.random() * 5)`, an integer from 1 through 5
- Request: `GET ${BASE_URL}/${id}/`
- Request tag: `endpoint: item`
- Check `status 200 (item)`: `r.status === 200`
- Check `json válido (item)`: the body parses as JSON and `r.json('id') !== undefined`

`check()` returns true only when every check in that call passes. The script then calls `errorRate.add(!ok)` for that group, and records `res.timings.duration` on `endpointDuration` with the same `endpoint` tag (`list` or `item`).

### Thresholds

```javascript
thresholds: {
  http_req_failed: ['rate<0.01'],
  'http_req_duration{endpoint:list}': ['p(95)<500'],
  'http_req_duration{endpoint:item}': ['p(95)<500'],
}
```

`http_req_duration` is in milliseconds, so `p(95)<500` is a 95th percentile under 500 ms. `http_req_failed` must stay under a rate of 0.01.

Trend statistics set on the options (and repeated by the Makefile): `avg`, `med`, `min`, `max`, `p(90)`, `p(95)`, `p(99)`.

### Custom metrics

- `endpoint_duration` — `Trend` created with `isTime = true`
- `error_rate` — `Rate` fed by `errorRate.add(!ok)` after each group's checks

## Tech stack

- **k6** — JavaScript test using `k6/http`, `check`, `sleep`, and `group` from `k6`, and `Trend` and `Rate` from `k6/metrics`
- **k6-reporter** — `htmlReport` loaded at runtime from `https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js`
- **GNU Make** — `run` and `clean` targets
- **Bash** — the Makefile sets `SHELL := /bin/bash`

The script is a single file. There is no package manifest and no lockfile. k6 fetches the reporter bundle when the test starts.

## Project structure

```text
.
├── .gitignore
├── Makefile
├── README.md
└── src/
    └── load_test.js
```

`.gitignore` ignores `.DS_Store`, `reports/`, `*.html`, `*.json`, `*.log`, and `.tmp/`. The `reports/` directory is produced by a test run.

## Setup

```bash
git clone https://github.com/BrunoZanotta/k6-loadtest.git
cd k6-loadtest
```

Install k6 and confirm the binary is on your `PATH`:

```bash
k6 version
```

Install instructions: [Install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

macOS (Homebrew):

```bash
brew install k6
```

Windows (winget):

```bash
winget install -e --id k6.k6
```

`make run` needs GNU Make and Bash, because `SHELL` is `/bin/bash`. On Windows, run Make from a Bash shell such as Git Bash, or use the `k6` command in the next section.

Create the output directory before the first run:

```bash
mkdir -p reports
```

Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force -Path reports | Out-Null
```

## Run

### Makefile

```bash
make run
```

`make run` uses `VUS=500`, `DURATION=5m`, `BASE_URL=https://test-api.k6.io/public/crocodiles`, and `K6_BIN=k6` unless you override them. The recipe is:

```bash
k6 run -e VUS=500 -e DURATION=5m -e BASE_URL=https://test-api.k6.io/public/crocodiles src/load_test.js --summary-trend-stats "avg,med,min,max,p(90),p(95),p(99)"
```

Override the load or the target:

```bash
make run VUS=50 DURATION=30s BASE_URL=https://test-api.k6.io/public/crocodiles
```

Point `K6_BIN` at another k6 binary if needed:

```bash
make run K6_BIN=k6
```

Remove the generated report files:

```bash
make clean
```

`make clean` runs `rm -f reports/summary.html reports/summary.json`.

### k6

The same command, without Make:

```bash
k6 run \
  -e VUS=500 \
  -e DURATION=5m \
  -e BASE_URL=https://test-api.k6.io/public/crocodiles \
  src/load_test.js \
  --summary-trend-stats "avg,med,min,max,p(90),p(95),p(99)"
```

## Reports

`handleSummary` writes both files at the end of the test:

| File | How it is built |
| --- | --- |
| `reports/summary.html` | `htmlReport(data)` from k6-reporter |
| `reports/summary.json` | `JSON.stringify(data, null, 2)` |

`reports/summary.json` is the end-of-test summary object, indented with two spaces. `reports/summary.html` is the HTML report k6-reporter builds from that same summary. Both paths are gitignored. `make clean` deletes those two files.

## Highlights

- Constant-VU scenario: 500 virtual users for 5 minutes, then a 30 second graceful stop
- `VUS`, `DURATION`, and `BASE_URL` change the load and the target without editing the script
- Each iteration calls the crocodile list, then one item whose id is a random integer from 1 to 5, then sleeps 1 second
- Checks assert HTTP 200, a JSON array on the list, and a defined `id` on the item
- Thresholds fail the run when `http_req_failed` is at or above 1%, or when either endpoint's `http_req_duration` p(95) reaches 500 ms
- Custom `endpoint_duration` trend and `error_rate` rate sit next to the built-in HTTP metrics
- The run writes `reports/summary.html` and `reports/summary.json` through `handleSummary`
- `make run` passes the same env vars and trend stats the script already defaults to; `make clean` removes the two report files
