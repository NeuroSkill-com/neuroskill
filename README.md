# neuroskill

**neuroskill** is a command-line interface for the [NeuroSkill](https://neuroskill.com) real-time EXG analysis API. It communicates with a locally running Skill server over **WebSocket** or **HTTP**, giving you instant terminal access to EEG brain-state scores, correlate indices, sleep staging, session history, annotations, similarity search, and more.

> ⚠ **Research Use Only.** All metrics are experimental outputs derived from consumer-grade EXG hardware. They are **not** validated clinical measurements, not FDA/CE-cleared, and must not be used for diagnosis, treatment decisions, or any medical purpose.

[Paper](https://arxiv.org/abs/2603.03212)

---

## Table of Contents

1. [Features](#features)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Transport](#transport)
6. [Commands](#commands)
7. [Output Modes](#output-modes)
8. [Global Options](#global-options)
9. [Examples](#examples)
10. [Project Structure](#project-structure)
11. [Building from Source](#building-from-source)
12. [Running the Daemon](#running-the-daemon)
13. [End-to-End Testing](#end-to-end-testing)
14. [How to Cite](#how-to-cite)
15. [License](#license)

---

## Features

- **Multi-device support** — Muse (4ch), OpenBCI Ganglion/Cyton/Cyton+Daisy (4–16ch), Neurable MW75 Neuro (12ch), Emotiv EPOC X/Insight/Flex/MN8 (5–32ch), IDUN Guardian (1ch), RE-AK Nucleus Hermes (8ch), Mendi fNIRS
- **Real-time EEG scores** — focus, relaxation, engagement, meditation, cognitive load, drowsiness
- **Consciousness metrics** — Lempel-Ziv Complexity proxy, wakefulness, information integration
- **PPG / HRV** — heart rate, RMSSD, SDNN, pNN50, LF/HF, SpO₂, Baevsky stress index
- **Sleep staging** — automatic per-epoch classification, sleep analysis, and schedule management
- **Session history** — list, compare, and UMAP-project all past recording sessions
- **Annotations** — create timestamped labels and search them by free text or EEG similarity
- **Screenshot search** — search by OCR text (semantic/substring) or visual similarity (CLIP)
- **Cross-modal bridges** — screenshots ↔ EEG, screenshots around timestamps
- **Interactive graph search** — cross-modal 4-layer graph (labels → EEG → labels)
- **Proactive Hooks** — CRUD for automated triggers based on EEG state + keyword matching
- **Apple HealthKit** — query sleep, workouts, heart rate, steps, and metrics synced from iOS
- **Terminal tracking** — OS-wide shell hooks (zsh/bash/fish/PowerShell) capture every command with exit codes, auto-categorization (50+ patterns), and EEG correlation
- **Brain awareness** — flow state, fatigue, struggle prediction, task type detection, optimal hours, dev loop analysis, terminal impact on focus, context switch cost
- **VS Code extension** — sidebar with flow gauge, workspace activity, terminal commands, daily report, energy, struggle, optimal hours, and environment tracking
- **Do Not Disturb** — automated DND based on focus score threshold
- **LLM inference** — built-in model management, download, and multi-turn chat with vision support
- **Calibration profiles** — full CRUD (create, update, delete) for calibration protocols
- **Dual transport** — WebSocket (full-duplex, live events) and HTTP REST (curl-friendly)
- **Pipe-friendly** — `--json` flag emits clean JSON to stdout; informational lines go to stderr

---

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js    | ≥ 18    |
| Skill server | running locally (auto-discovered via mDNS, port probe, or `lsof`) |

---

## Installation

### Via npm (recommended)

```bash
npm install -g neuroskill
```

After installation the `neuroskill` binary is available globally:

```bash
neuroskill status
```

### From source

```bash
git clone <repo-url> neuroskill
cd neuroskill
npm install
npm run build        # compiles TypeScript → dist/
```

Then either:

```bash
node dist/bin/neuroskill.js status   # run directly
# or
npm link                         # registers `neuroskill` as a global command
neuroskill status
```

---

## Quick Start

```bash
# Full device / session / scores snapshot
neuroskill status

# Pipe raw JSON to jq
neuroskill status --json | jq '.scores'

# Stream broadcast events for 10 seconds
neuroskill listen

# Print full help with examples
neuroskill --help
```

---

## Transport

neuroskill auto-discovers the Skill server port via:

1. `--port <n>` flag (skips all discovery)
2. mDNS (`_skill._tcp` service advertisement, 5 s timeout)
3. Platform-specific fallback:
   - **macOS / Linux**: `lsof` / `pgrep` (probes each TCP LISTEN port)
   - **Windows**: WebSocket handshake probe on common ports (8375–8377)

### WebSocket (default)

Full-duplex, low-latency. Supports live event streaming. Used automatically when the server is reachable.

```bash
neuroskill status --ws          # force WebSocket
```

### HTTP REST

Request/response only. Compatible with `curl`, Python `requests`, or any HTTP client.

```bash
neuroskill status --http        # force HTTP

# Equivalent curl call:
curl -s -X POST http://127.0.0.1:8375/ \
  -H "Content-Type: application/json" \
  -d '{"command":"status"}'
```

### Auto (neither flag)

The CLI probes WebSocket first and silently falls back to HTTP. Informational messages go to **stderr** so JSON piping is never polluted.

---

## Commands

| Command | Description |
|---------|-------------|
| `status` | Full device / session / embeddings / scores snapshot |
| `session [index]` | All metrics + trends for one session (`0` = latest, `1` = previous, …) |
| `sessions` | List all recording sessions across all days |
| `label "text"` | Create a timestamped annotation on the current moment |
| `search-labels "query"` | Search labels by free text (text / context / both modes) |
| `search-images "query"` | Search screenshots by OCR text (semantic / substring modes) |
| `search-images --by-image <path>` | Search screenshots by visual similarity (CLIP) |
| `screenshots-around --at <utc>` | Find screenshots near a timestamp (±window) |
| `screenshots-for-eeg` | Find screenshots captured during an EEG session |
| `eeg-for-screenshots "query"` | Find EEG data & labels near screenshots matching OCR text |
| `interactive "keyword"` | Cross-modal 4-layer graph search (labels → EEG → found labels) |
| `search` | ANN EEG-similarity search (auto: last session, k = 5) |
| `compare` | Side-by-side A/B metrics (auto: last 2 sessions) |
| `sleep [index]` | Sleep staging — index selects session (`0` = latest) |
| `sleep-schedule` | Show / update sleep schedule (bedtime, wake time, preset) |
| `umap` | 3-D UMAP projection with live progress bar |
| `listen` | Stream broadcast events for N seconds |
| `hooks` | List, add, remove, enable, disable, update Proactive Hook rules |
| `hooks suggest "kw1,kw2"` | Suggest threshold from real EEG / label data |
| `hooks log` | View paginated hook trigger audit log |
| `health` | Apple HealthKit summary (sleep, workouts, steps, HR, metrics) |
| `dnd [on\|off]` | Show DND automation status; force-override DND |
| `calibrations` | List / get / create / update / delete calibration profiles |
| `calibrate` | Open calibration window and start immediately |
| `timer` | Open focus-timer window and start work phase immediately |
| `notify "title" ["body"]` | Show a native OS notification |
| `say "text"` | Speak text aloud via on-device TTS |
| `llm status` | LLM inference server status (stopped / loading / running) |
| `llm start` / `llm stop` | Load / unload the active model |
| `llm catalog` | Show model catalog with download states |
| `llm add <repo> <file>` | Add an external HF model and download it |
| `llm select <file>` | Set the active text model |
| `llm chat` / `llm chat "msg"` | Interactive multi-turn chat REPL or single-shot |
| `activity <sub>` | Activity tracking: `summary`, `score`, `files`, `sessions`, `meetings`, `terminal-commands`, `timeline` |
| `brain <sub>` | Brain awareness: `flow`, `stuck`, `task`, `fatigue`, `report`, `optimal`, `terminal-impact`, `context-cost`, `dev-loops` |
| `terminal` | Shell hook status — installed/health per shell + command count |
| `terminal install [shell]` | Install tracking hook (`zsh`, `bash`, `fish`, `powershell`) |
| `terminal uninstall [shell]` | Remove hook from shell rc file |
| `terminal commands` | Recent tracked terminal commands (last hour) |
| `terminal impact` | Focus delta by terminal command category |
| `terminal loops` | Detected edit-build-test dev loops |
| `vscode` | Auto-install the VS Code extension |
| `connect` | Check connection status, auth token, and iroh — guide through setup |
| `batch '[{...},...]'` | Send multiple commands in one request via `POST /v1/batch` |
| `raw '{"command":"..."}'` | Send arbitrary JSON and print full response |

---

## Output Modes

| Flag | Behaviour |
|------|-----------|
| _(none)_ | Human-readable colored summary to stdout |
| `--json` | Raw JSON only — pipe-safe, no colors |
| `--full` | Human-readable summary **and** colorized JSON |

---

## Global Options

```
--port <n>         Connect to explicit port (skips mDNS discovery)
--ws               Force WebSocket transport
--http             Force HTTP REST transport
--json             Output raw JSON (pipeable to jq)
--full             Print JSON in addition to human-readable summary
--poll <n>         (status) Re-poll every N seconds
--mode <m>         Search mode for search-labels: text|context|both (default: text)
--k-text <n>       (interactive) k for text-label search (default: 5)
--k-eeg <n>        (interactive) k for EEG-similarity search (default: 5)
--k-labels <n>     (interactive) k for label-proximity search (default: 3)
--reach <n>        (interactive) temporal reach in minutes around EEG points (default: 10)
--dot              (interactive) Output Graphviz DOT format
--by-image <path>  (search-images) Search by visual similarity (CLIP) instead of OCR
--window <n>       (screenshots-for-eeg / eeg-for-screenshots) temporal window in seconds
--limit <n>        (hooks log, health) page size
--offset <n>       (hooks log) row offset
--keywords <csv>   (hooks add/update) comma-separated keywords
--scenario <s>     (hooks add/update) any | cognitive | emotional | physical
--threshold <f>    (hooks add/update) distance threshold (0.01–1.0)
--actions "L:s,…"  (calibrations create/update) actions as "Label:secs" pairs
--loops <n>        (calibrations create/update) loop count
--break <n>        (calibrations create/update) break duration in seconds
--auto-start       (calibrations create/update) auto-start when opened
--bedtime HH:MM    (sleep-schedule set) bedtime in 24-h format
--wake HH:MM       (sleep-schedule set) wake-up time
--preset <id>      (sleep-schedule set) apply a named preset
--metric-type <t>  (health metrics) metric type (e.g. restingHeartRate, hrv, vo2Max)
--image <path>     (llm chat) attach an image (repeatable)
--system "..."     (llm chat) prepend a system prompt
--temperature <f>  (llm chat) sampling temperature 0–2
--max-tokens <n>   (llm chat) maximum tokens to generate per turn
--mmproj <file>    (llm add) also download a vision projector from the same repo
--no-color         Disable ANSI colors (also honours NO_COLOR env var)
--version          Print CLI version and exit
--help             Show full help with examples
```

---

## Examples

```bash
# Device snapshot
neuroskill status

# Pipe scores to jq
neuroskill status --json | jq '.scores.focus'

# Latest session metrics
neuroskill session 0

# Compare last two sessions
neuroskill compare

# Label the current moment
neuroskill label "started meditation"

# Search past labels
neuroskill search-labels "meditation" --mode both

# 4-layer interactive graph search
neuroskill interactive "focus" --k-eeg 10 --reach 15

# Screenshot search by OCR text
neuroskill search-images "compiler error"

# Screenshot search by visual similarity
neuroskill search-images --by-image screenshot.png

# Find screenshots near EEG data
neuroskill screenshots-for-eeg

# Find EEG data near screenshots
neuroskill eeg-for-screenshots "dashboard"

# Sleep staging for latest session
neuroskill sleep 0

# View / set sleep schedule
neuroskill sleep-schedule
neuroskill sleep-schedule set --bedtime 23:00 --wake 07:00

# Apple Health summary
neuroskill health
neuroskill health sleep --json

# DND automation
neuroskill dnd
neuroskill dnd on

# Proactive hooks
neuroskill hooks
neuroskill hooks add "Deep Work" --keywords "focus,flow" --threshold 0.14
neuroskill hooks suggest "focus,deep work"

# Calibration profile management
neuroskill calibrations create "My Protocol" --actions "Eyes Open:20,Eyes Closed:20"

# LLM management and chat
neuroskill llm status
neuroskill llm start
neuroskill llm chat "What EEG band is linked to relaxation?"
neuroskill llm chat "Describe this" --image eeg_plot.png

# Stream events for 30 seconds
neuroskill listen --seconds 30

# Send arbitrary JSON command
neuroskill raw '{"command":"status"}'

# UMAP projection
neuroskill umap

# Force HTTP + specific port
neuroskill status --http --port 62853

# Poll status every 5 seconds
neuroskill status --poll 5
```

---

## Project Structure

```
neuroskill/
├── bin/
│   └── neuroskill.ts        # Entry-point registered as the `neuroskill` binary
├── cli.ts               # Full CLI implementation (commands, transport, rendering)
├── dist/                # Compiled JavaScript output (generated by `npm run build`)
│   ├── bin/neuroskill.js
│   └── cli.js
├── METRICS.md           # Detailed reference for every EEG metric and index
├── SKILL.md             # Complete Skill API / CLI reference
├── package.json
└── tsconfig.json
```

---

## Building from Source

```bash
npm install          # install dependencies
npm run build        # tsc → dist/; chmod +x dist/bin/neuroskill.js
npm run dev          # run directly with tsx (no build needed)
```

TypeScript target is **ES2022 / CommonJS**, Node ≥ 18.

---

## Running the Daemon

The `npm run daemon` command builds and starts `skill-daemon` with developer-friendly defaults.

```bash
# Build + start on default port (127.0.0.1:18444)
npm run daemon

# With virtual EEG device for testing (starts LSL source + recording)
npm run daemon -- --virtual

# Restart quickly (kill existing, skip build)
npm run daemon -- --no-build --force

# Listen on all interfaces (LAN-accessible)
npm run daemon -- --host 0.0.0.0

# Custom port, debug build
npm run daemon -- --port 9000 --debug

# Clean isolated data dir (wiped on exit) + virtual EEG
npm run daemon -- --clean --virtual
```

| Flag | Description |
|------|-------------|
| `--port N` / `-p N` | Listen port (default `18444`) |
| `--host ADDR` | Bind address: `127.0.0.1` (default, localhost only) or `0.0.0.0` (all interfaces) |
| `--virtual` | Start virtual EEG device (LSL), pair it, and begin recording |
| `--embed` | Enable EXG embeddings for virtual EEG data |
| `--force` / `-f` | Kill all running daemon instances before starting |
| `--clean` | Use a fresh temp data directory (wiped on exit) |
| `--no-build` | Skip `cargo build` (use existing binary) |
| `--debug` | Build debug profile instead of release |
| `--no-sign` | Skip macOS code signing |

The daemon streams logs with a `│` prefix. Press `ctrl+c` to stop gracefully.

### Authentication

The daemon generates an auth token on first start:

| Platform | Token path |
|----------|------------|
| macOS | `~/Library/Application Support/skill/daemon/auth.token` |
| Linux | `~/.config/skill/daemon/auth.token` |
| Windows | `%APPDATA%\skill\daemon\auth.token` |

- **Localhost**: neuroskill CLI reads the token file automatically — no setup needed.
- **LAN**: Copy the token to the remote machine, or pass it via `neuroskill connect`.
- **Remote (iroh)**: Use TOTP pairing — run `neuroskill iroh totp create "my-client"` on the server, then register from the client.

### Batch API

`POST /v1/batch` accepts up to 20 commands in a single request:

```bash
curl -s -X POST http://127.0.0.1:18444/v1/batch \
  -H "Authorization: Bearer $(cat ~/Library/Application\ Support/skill/daemon/auth.token)" \
  -H "Content-Type: application/json" \
  -d '{"commands":[{"command":"status"},{"command":"sessions"}]}'
```

Or via CLI:

```bash
neuroskill batch '[{"command":"status"},{"command":"sessions"}]'
```

---

## End-to-End Testing

Two e2e test scripts exercise the full stack against a live daemon. Both start a **fresh daemon** with an isolated data directory and clean up on exit.

### neuroskill ↔ daemon

`scripts/e2e-neuroskill-daemon.sh` — tests every CLI command and REST endpoint. Records two virtual EEG sessions and runs 200+ tests.

```bash
./scripts/e2e-neuroskill-daemon.sh                        # build + test
./scripts/e2e-neuroskill-daemon.sh --no-build              # skip build
./scripts/e2e-neuroskill-daemon.sh --no-build --keep-daemon # keep daemon after
```

### What it tests

| Section | Tests |
|---------|-------|
| Virtual device setup | start virtual EEG source, LSL discover, pair, record two sessions |
| Core CLI commands | `status`, `sessions`, `session`, `label`, `search-labels`, `say`, `notify` |
| Sleep & schedule | `sleep-schedule` |
| Health | HealthKit summary, metric-types |
| DND | status, on/off |
| Hooks | list, log, statuses, log-count, suggest-keywords, suggest-distances |
| LLM | status, catalog, downloads, logs, fit, refresh, start/stop, chat CRUD, selection |
| Calibrations | list, create, update, delete |
| Iroh | info, TOTP CRUD, clients CRUD, scope-groups, phone-invite |
| Access tokens | list, create, revoke, delete |
| Devices / Scanner / Reconnect | list, state, enable/disable |
| LSL | discover, config, idle-timeout, iroh tunnel, virtual source, auto-connect |
| History & Analysis | stats, daily, metrics, timeseries, sleep-stages, embedding-count, find, csv-metrics |
| Compare & Search | WS compare, REST compare, EEG search, search compare, UMAP 3D projection |
| Labels | list, index-stats, search-by-eeg, create/update/delete (REST), search, index rebuild |
| Search index | stats, global-index rebuild |
| Settings | GPU, filter, storage, inference, overlap, scanner, api-token, location, and 15+ more |
| Activity | bands, window, tracking configs, current-window, last-input, recent-windows, input-buckets |
| EXG Models | status, config, catalog, estimate-reembed, rebuild-index, exg-catalog |
| Screenshots | config, metrics, OCR, search-text, search-image, search-vector, around, for-eeg, eeg-for |
| Skills | list, last-sync, disabled, refresh-interval, sync-on-launch, license, sync-now |
| Web Cache | stats, list |
| Session control | start-session, stop-session |
| Oura & Calendar | status (structural) |
| UI settings | accent-color, daily-goal, goal-notified-date, main-window-auto-fit |
| WebSocket infra | ws-port, ws-clients, ws-request-log, events push |
| Auth | default-token refresh |
| Device | serial-ports |

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILL_DATA_DIR` | (set by script) | Isolated data directory for the daemon |
| `SKILL_VIRTUAL_EMBED=1` | (set by script) | Forces the EXG embedding pipeline for virtual EEG devices, enabling full-pipeline tests (compare, search, UMAP) |

### Sample output

```
━━ Daemon setup ━━
  ℹ  using isolated skill dir: /tmp/skill-e2e
  ℹ  starting daemon…
  ℹ  daemon started (PID 86464)
  ℹ  enabling screenshot capture (interval=3s, session_only=false)…
  ℹ  waiting 10s for screenshot captures…
  ℹ  screenshots captured so far: 1

━━ Virtual device ━━
  ✅ virtual EEG source started
  ✅ virtual stream discovered
  ✅ virtual stream paired
  ℹ  recording session A for 15 seconds…
  ℹ  stopping session A, starting session B…
  ℹ  recording session B for 15 seconds…
  ✅ two sessions recorded

━━ Core commands ━━
  ✅ status
  ✅ sessions
  ✅ session 0
  ✅ label
  ✅ search-labels
  ✅ say
  ✅ notify

━━ Sleep & schedule ━━
  ✅ sleep-schedule

━━ Health ━━
  ✅ health
  ✅ health metric-types

━━ DND ━━
  ✅ dnd status
  ✅ dnd off

━━ Hooks ━━
  ✅ hooks list
  ✅ hooks log
  ✅ hooks statuses
  ✅ hooks log-count
  ✅ hooks suggest-keywords
  ✅ hooks suggest-distances

━━ LLM ━━
  ✅ llm status
  ✅ llm catalog
  ✅ llm downloads
  ✅ llm logs
  ✅ llm fit (fits present)
  ✅ llm refresh
  ⏭  llm start (no model available in clean env)
  ✅ llm stop

━━ LLM chat & selection ━━
  ✅ llm chat sessions
  ✅ llm chat archived-sessions
  ✅ llm chat new-session
  ✅ llm chat rename
  ✅ llm chat archive
  ✅ llm chat unarchive
  ✅ llm chat delete
  ✅ llm active-model
  ✅ llm active-mmproj
  ✅ llm autoload-mmproj
  ✅ settings llm-config

━━ Calibrations ━━
  ✅ calibrations list
  ✅ calibrations create
  ✅ calibrations update
  ✅ calibrations delete

━━ Iroh ━━
  ✅ iroh info
  ✅ iroh totp list
  ✅ iroh clients list
  ✅ iroh scope-groups

━━ Access tokens (REST) ━━
  ✅ tokens list
  ✅ tokens create
  ✅ tokens revoke
  ✅ tokens delete

━━ Devices (REST) ━━
  ✅ devices list

━━ Scanner (REST) ━━
  ✅ scanner state

━━ Reconnect (REST) ━━
  ✅ reconnect state
  ✅ reconnect enable
  ✅ reconnect disable

━━ Service (REST) ━━
  ✅ service status

━━ LSL (REST) ━━
  ✅ lsl discover
  ✅ lsl config
  ✅ lsl idle-timeout
  ✅ lsl iroh status
  ✅ lsl virtual source running

━━ History & Analysis (REST) ━━
  ✅ history stats
  ✅ history daily
  ✅ metrics
  ✅ timeseries
  ✅ sleep-stages
  ✅ embedding-count
  ✅ history find
  ✅ csv-metrics

━━ Compare & Search ━━
  ✅ compare (WS)
  ✅ compare (REST /analysis/compare)
  ✅ search (WS)
  ✅ search (REST /search/eeg)
  ✅ search compare (REST A vs B embeddings)
  ✅ umap (3D projection)

━━ Labels CRUD (REST) ━━
  ✅ labels list
  ✅ labels index-stats
  ✅ labels search-by-eeg

━━ Search Index (REST) ━━
  ✅ index stats

━━ Settings (REST) ━━
  ✅ settings gpu
  ✅ settings filter
  ✅ settings storage
  ✅ settings inference
  ✅ settings overlap
  ✅ settings scanner-config

━━ Activity (REST) ━━
  ✅ activity bands
  ✅ activity window

━━ EXG Models (REST) ━━
  ✅ models status
  ✅ models config
  ✅ models catalog
  ✅ models estimate-reembed

━━ Screenshots (REST) ━━
  ✅ screenshots config
  ✅ screenshots metrics
  ✅ screenshots ocr-status
  ✅ screenshots dir
  ✅ screenshots estimate-reembed
  ✅ screenshots search-text
  ✅ screenshots search-image
  ✅ screenshots search-vector
  ✅ screenshots-around
  ✅ screenshots-for-eeg
  ✅ eeg-for-screenshots
  ✅ screenshots download-ocr (structural)
  ✅ screenshots rebuild-embeddings (structural)

━━ Skills (REST) ━━
  ✅ skills list
  ✅ skills last-sync
  ✅ skills disabled

━━ Web Cache (REST) ━━
  ✅ web-cache stats

━━ Daemon info (REST) ━━
  ✅ daemon-version
  ✅ daemon-log

━━ Session control ━━
  ✅ stop-session
  ✅ start-session
  ✅ stop-session (after start)

━━ Oura & Calendar (structural) ━━
  ✅ oura status
  ✅ calendar status

━━ Raw command ━━
  ✅ raw status

━━ Search — images & global index ━━
  ✅ search-images
  ✅ search global-index stats

━━ Activity (extended REST) ━━
  ✅ activity tracking active-window config
  ✅ activity tracking input config
  ✅ activity current-window
  ✅ activity last-input
  ✅ activity latest-bands
  ✅ activity recent-windows
  ✅ activity recent-input
  ✅ activity input-buckets

━━ Additional settings (REST) ━━
  ✅ settings filter-config
  ✅ settings storage-format
  ✅ settings embedding-overlap
  ✅ settings inference-device
  ✅ settings exg-inference-device
  ✅ settings neutts-config
  ✅ settings tts-preload
  ✅ settings sleep-config
  ✅ settings ws-config
  ✅ settings openbci-config
  ✅ settings device-api-config
  ✅ settings scanner-config (REST)
  ✅ settings umap-config
  ✅ settings location-enabled
  ✅ settings update-check-interval
  ✅ settings hf-endpoint
  ✅ settings device-log

━━ DND (extended REST) ━━
  ✅ dnd config
  ✅ dnd active
  ✅ dnd status (REST)
  ✅ dnd focus-modes
  ✅ dnd test

━━ UI settings (REST) ━━
  ✅ ui accent-color
  ✅ ui daily-goal
  ✅ ui goal-notified-date
  ✅ ui main-window-auto-fit

━━ Skills (extended REST) ━━
  ✅ skills refresh-interval
  ✅ skills sync-on-launch
  ✅ skills license

━━ Web Cache (extended REST) ━━
  ✅ web-cache list

━━ WebSocket & events infra ━━
  ✅ ws-port
  ✅ ws-clients
  ✅ ws-request-log
  ✅ events push

━━ Auth (extended REST) ━━
  ✅ auth default-token refresh

━━ Device (extended REST) ━━
  ✅ device serial-ports

━━ Calibration (extended REST) ━━
  ✅ calibration active
  ✅ calibration auto-start-pending

━━ Models (extended REST) ━━
  ✅ models estimate-reembed (REST)
  ✅ models exg-catalog

━━ LSL (extended REST) ━━
  ✅ lsl iroh status (extended)

━━ Location & day metrics ━━
  ✅ location
  ✅ day-metrics

━━ History (extended REST) ━━
  ✅ history find-session
  ✅ history sessions POST

━━ Labels CRUD (extended REST) ━━
  ✅ labels search (REST)
  ✅ labels index rebuild

━━ Search (extended REST) ━━
  ✅ search global-index rebuild

━━ Iroh (extended REST) ━━
  ✅ iroh phone-invite (structural)

━━ LLM (extended REST) ━━
  ✅ llm chat last-session
  ✅ llm server switch-model (structural)
  ✅ llm server switch-mmproj (structural)
  ✅ llm abort-stream (structural)
  ✅ llm cancel-tool-call (structural)

━━ LSL (extended write REST) ━━
  ✅ lsl auto-connect
  ✅ lsl discover (REST GET)
  ✅ lsl iroh start (structural)
  ✅ lsl iroh stop (structural)

━━ Models (extended write REST) ━━
  ✅ models config GET
  ✅ models rebuild-index

━━ Calibration (extended write REST) ━━
  ✅ calibration profiles list

━━ Settings (write structural) ━━
  ✅ settings api-token
  ✅ settings location-test
  ✅ skills sync-now

╔══════════════════════════════════════════╗
║  196 passed, 0 failed, 6 skipped  (202 total) ║
╚══════════════════════════════════════════╝
```

### neuroloop ↔ neuroskill ↔ daemon

`scripts/e2e-neuroloop-daemon.sh` — tests the full neuroloop integration: connectivity, EEG metrics exchange, label creation/search, context signals, slash command equivalents, LLM registration flow, memory tools, cross-modal features, batch API, and the `connect` command.

```bash
./scripts/e2e-neuroloop-daemon.sh                        # build + test
./scripts/e2e-neuroloop-daemon.sh --no-build              # skip build
```

Sample output:

```
━━ Neuroloop connectivity ━━
  ✅ daemon healthz reachable
  ✅ neuroskill CLI connects to daemon
  ✅ auth token valid

━━ EEG metrics exchange ━━
  ✅ status snapshot (neuroloop injects this every turn)
  ✅ session 0 metrics (context.ts fetches for session signals)
  ✅ sessions list
  ✅ activity bands (EXG panel data)

━━ Label exchange ━━
  ✅ label create (neuroskill_label tool)
  ✅ search-labels (context.ts keyword signal)
  ✅ labels list

━━ Slash command equivalents ━━
  ✅ /exg-session equivalent
  ✅ /hooks add
  ✅ /hooks remove
  ✅ /say
  ✅ /notify

━━ Skill-LLM registration flow ━━
  ✅ /llm/status (root alias for skill-llm.ts)
  ✅ /v1/llm/server/status (canonical)
  ✅ /v1/models (OpenAI-compatible)

━━ Batch endpoint ━━
  ✅ batch (status + sessions)

━━ Connect command ━━
  ✅ neuroskill connect

╔══════════════════════════════════════════════════════════════╗
║  58 passed, 0 failed, 1 skipped  (59 total)  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## How to Cite

If you use **neuroskill** or the Skill EEG platform in academic work, please cite it as:

### BibTeX

```bibtex
@software{neuroskill2025,
  title        = {neuroskill: A Command-Line Interface for the Skill Real-Time EEG Analysis API},
  author       = {Nataliya Kosmyna and Eugene Hauptmann},
  year         = {2026},
  version      = {0.0.1},
  url          = {https://github.com/NeuroSkill-com/neuroskill},
  note         = {Research use only. Not a validated clinical tool.}
}
```

If you are citing the underlying **Skill** EEG analysis platform specifically:

```bibtex
@software{skill2025,
  title        = {NeuroSkill: Real-Time EEG Analysis Platform},
  author       = {Skill Development Team},
  author       = {Nataliya Kosmyna and Eugene Hauptmann},
  year         = {2026},
  url          = {https://neuroskill.com},
  note         = {Consumer-grade EEG processing pipeline with WebSocket and HTTP APIs.
                  Research use only. Not FDA/CE-cleared.}
}
```

For citing the specific EEG metrics and indices documented in `METRICS.md`, you may also wish to reference the primary literature for individual algorithms (e.g., Higuchi fractal dimension, Lempel-Ziv complexity, DFA). See [`METRICS.md`](METRICS.md) for per-metric references.

---

## License

GPLv3
