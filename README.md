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
12. [How to Cite](#how-to-cite)
13. [License](#license)

---

## Features

- **Real-time EEG scores** — focus, relaxation, engagement, meditation, cognitive load, drowsiness
- **Consciousness metrics** — Lempel-Ziv Complexity proxy, wakefulness, information integration
- **PPG / HRV** — heart rate, RMSSD, SDNN, pNN50, LF/HF, SpO₂, Baevsky stress index
- **Sleep staging** — automatic per-epoch classification and session-level summary
- **Session history** — list, compare, and UMAP-project all past recording sessions
- **Annotations** — create timestamped labels and search them by free text or EEG similarity
- **Interactive graph search** — cross-modal 4-layer graph (labels → EEG → labels)
- **Dual transport** — WebSocket (full-duplex, live events) and HTTP REST (curl-friendly)
- **Pipe-friendly** — `--json` flag emits clean JSON to stdout; informational lines go to stderr

---

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js    | ≥ 18    |
| Skill server | running locally (auto-discovered via mDNS or `lsof`) |

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
3. `lsof` / `pgrep` fallback (probes each TCP LISTEN port)

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
| `interactive "keyword"` | Cross-modal 4-layer graph search (labels → EEG → found labels) |
| `search` | ANN EEG-similarity search (auto: last session, k = 5) |
| `compare` | Side-by-side A/B metrics (auto: last 2 sessions) |
| `sleep [index]` | Sleep staging — index selects session (`0` = latest) |
| `umap` | 3-D UMAP projection with live progress bar |
| `listen` | Stream broadcast events for N seconds |
| `calibrate` | Open calibration window and start immediately |
| `timer` | Open focus-timer window and start work phase immediately |
| `notify "title" ["body"]` | Show a native OS notification |
| `say "text"` | Speak text aloud via on-device TTS |
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
--port <n>       Connect to explicit port (skips mDNS discovery)
--ws             Force WebSocket transport
--http           Force HTTP REST transport
--json           Output raw JSON (pipeable to jq)
--full           Print JSON in addition to human-readable summary
--poll <n>       (status) Re-poll every N seconds
--mode <m>       Search mode for search-labels: text|context|both (default: text)
--k-text <n>     (interactive) k for text-label search (default: 5)
--k-eeg <n>      (interactive) k for EEG-similarity search (default: 5)
--k-labels <n>   (interactive) k for label-proximity search (default: 3)
--reach <n>      (interactive) temporal reach in minutes around EEG points (default: 10)
--dot            (interactive) Output Graphviz DOT format
--no-color       Disable ANSI colors (also honours NO_COLOR env var)
--version        Print CLI version and exit
--help           Show full help with examples
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

# Sleep staging for latest session
neuroskill sleep 0

# Stream events for 30 seconds
neuroskill listen --poll 30

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
