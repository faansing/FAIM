# FAIM — Fine Art Investment Model

> A structured, self-improving 5-layer decision protocol for retail investors.  
> Sectors: **AI Infrastructure + Energy Transition** · Instruments: **LEAPS (primary) · Stock**  
> Philosophy: Results over narrative. EV over win rate. Calibration over conviction.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](CHANGELOG.md)
[![No Framework](https://img.shields.io/badge/stack-vanilla%20JS-green.svg)]()
[![Offline First](https://img.shields.io/badge/offline-first-teal.svg)]()

---

## What Is FAIM?

FAIM is a **decision-making discipline**, not a stock screener.  
It forces you to quantify every judgment before you act — then records your decisions to find your systematic biases over time.

It combines:
- **Wharton/Booth value investing rigor** — DCF, comps, margin analysis
- **Midas List pattern recognition** — catalyst timing, sector positioning
- **First principles** — strip to numbers, zero fluff
- **Self-improving feedback loop** — 15-trade calibration cycles

> **Prime Directive:** Paper trade 15 times. Calibrate. Then real money.

---

## Quick Start

```bash
# No build step. No npm install. Just open the file.
open index.html

# Or run a local server (avoids browser security restrictions on file:// URLs)
python -m http.server 8080
# → visit http://localhost:8080

# Optional: Python data helper for L1/L2 pre-fill
pip install -r requirements.txt
python data_fetch.py NVDA              # single ticker full report
python data_fetch.py NVDA CEG ANET    # side-by-side comparison
python data_fetch.py NVDA --json      # JSON output for scripting
```

---

## File Structure

```
Model_v1/
├── index.html          ← App entry point (open this)
├── core.js             ← State, math engine, sector thresholds
├── wizard.js           ← 5-layer wizard (Steps 0–6)
├── cards.js            ← Trade card log + calibration dashboard
├── style.css           ← UI design system (dark mode, glassmorphism)
├── data_fetch.py       ← Python data helper — maps to wizard field IDs
├── requirements.txt    ← Python deps: yfinance, pandas
├── SOP.md              ← Full Standard Operating Procedure (bilingual)
├── CHANGELOG.md        ← Version history
├── LICENSE             ← MIT
└── README.md           ← This file
```

---

## The 5-Layer Protocol

| Layer | Name | Gate | Threshold |
|-------|------|------|-----------|
| **L0** | Setup | Sector guardrail | AI Infra or Energy Transition only |
| **L1** | Quality Gate | 4 of 5 checks pass | Rev growth, GM, ROIC, Runway, Mgmt |
| **L2** | Mispricing | Edge identified | ≥10% gap vs consensus + edge type |
| **L3** | Thesis | Kill switch defined | Probs sum to 100% · Bull ≤ 40% |
| **L4** | Position Size | EV/Risk ratio | HIGH: 5–8% · MED: 2–4% · LOW: skip |
| **L5** | Monitor & Exit | 3 checkpoints | Pre-defined exit rules, locked at entry |

### Sector-Calibrated L1 Thresholds

| Metric | AI Infrastructure | Energy Transition |
|--------|-------------------|-------------------|
| Revenue growth | > 15% | > 5% |
| Gross margin | > 40% | > 20% |
| GM trend | > 200 bps/yr | > 50 bps/yr |
| Cash runway | > 18 months | > 18 months |

---

## Calibration System

After **≥ 15 total cards AND ≥ 10 Closed**, the Calibration tab unlocks:

- Win rate vs predicted probability
- Systematic timing bias (too early / too late)
- Return distribution by bucket
- Layer weakness scores (L1–L5) — which layer is leaking?

Adjust one layer's rules per cycle. Document every change in `CHANGELOG.md`.

---

## Prime Directives

```
1. No story without numbers.
2. Define the kill switch before the bull case.
3. One sector. Depth beats breadth.
4. Patient capital is the structural edge.
5. Paper trade 15 times. Then calibrate. Then real money.
```

---

## Instrument Decision Logic

```
Q1: Clear 12–24 month catalyst?
├─ YES → LEAPS
│  ├─ Q2: IV environment normal? → Buy now
│  ├─ Q2: IV high (pre-earnings)? → Wait for IV crush
│  ├─ Q3: Deep ITM (δ 0.70–0.80) → Less timing risk
│  └─ Q3: Near-money (δ 0.45–0.60) → More leverage, precise timing needed
└─ NO → Stock only. Never options without a catalyst.
```

---

## Data Collection

`data_fetch.py` pulls L1/L2 data from Yahoo Finance. Output field names map **directly** to wizard input IDs for easy copy-paste.

Fields marked `MANUAL` in the output require official filings:

| Data | Source |
|------|--------|
| Revenue / Gross Margin | Company 10-K / [Macrotrends](https://macrotrends.net) |
| Consensus estimates | Yahoo Finance → Analysts tab |
| Short float % | [Finviz](https://finviz.com) |
| IV percentile | Your broker's options chain |

---

## Roadmap

| Version | Trigger | Planned Change |
|---------|---------|----------------|
| v1.1 | ✅ First calibration | Sector-aware L1 thresholds, bull guardrail, edge type picker |
| v1.2 | After 2nd calibration | Brier score for L3 probability calibration |
| v1.3 | After 3rd calibration | IV percentile input + theta-adjusted EV estimate |
| v2.0 | After 45+ trades | Watchlist tab, correlation tracker, Python → browser auto-fill |

---

## Backing Up Your Data

FAIM stores everything in your browser's `localStorage`. Back up regularly:

```javascript
// Browser DevTools Console (⌘⌥J on Mac):
copy(localStorage.getItem('faim_v1'))
// Paste into backup_YYYY-MM-DD.json
```

Or use the **↓ CSV** button in the Trade Cards tab.

---

## Disclaimer

This is a **paper trading and educational framework**. Not financial advice.  
Options trading involves significant risk including total loss of premium paid.  
Always verify data with official filings. Consult a licensed financial advisor.

---

*FAIM v1.1.0 · Built on first principles · Calibrated by real markets over time*
