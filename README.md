# FAIM — Fine Art Investment Model

> A structured, self-improving 5-layer decision protocol for retail investors with analytical backgrounds.
> Sectors: **AI Infrastructure · Energy Transition · Mega-Cap Tech**
> Instruments: **LEAPS (primary) · Stock**
> Philosophy: Results over narrative. EV over win rate. Calibration over conviction.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md)
[![Python](https://img.shields.io/badge/python-3.8%2B-green.svg)]()
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
# Install dependencies
pip install yfinance pandas

# Run full analysis (NVDA, TSLA, AAPL)
python analyze.py

# Single ticker
python analyze.py NVDA

# Side-by-side comparison table
python analyze.py NVDA TSLA AAPL --compare

# Save markdown reports
python analyze.py --report

# Quick data lookup
python data_fetch.py NVDA
python data_fetch.py CEG --sector energy
```

### Web App (Visual Companion)
```bash
# Interactive wizard + trade card logging + calibration dashboard
python -m http.server 8080
# → visit http://localhost:8080
```

---

## File Structure

```
Model_v1/
├── faim_engine.py      ← Core Python analysis engine (5 layers)
├── analyze.py          ← Multi-ticker analysis runner + comparison
├── data_fetch.py       ← Quick data lookup helper
├── reports/            ← Generated markdown analysis reports
│   ├── NVDA_report.md
│   ├── TSLA_report.md
│   └── AAPL_report.md
├── index.html          ← Web app entry (double-click or local server)
├── core.js             ← State, math engine, sector thresholds
├── wizard.js           ← Interactive 5-layer wizard
├── cards.js            ← Trade card log + calibration dashboard
├── style.css           ← UI design system
├── SOP.md              ← Full Standard Operating Procedure (English)
├── requirements.txt    ← Python dependencies
├── CHANGELOG.md        ← Version history
├── LICENSE             ← MIT
└── README.md           ← This file
```

---

## The 5-Layer Protocol

| Layer | Name | Gate | Threshold |
|-------|------|------|-----------|
| **L0** | Setup | Sector guardrail | AI Infra / Energy / Mega-Cap Tech |
| **L1** | Quality Gate | 4 of 5 checks | Rev growth, GM, ROIC, Runway, Mgmt |
| **L2** | Mispricing | Edge identified | ≥10% gap vs consensus + edge type |
| **L3** | Thesis | Kill switch + scenarios | Probs sum to 100% · Bull ≤ 40% |
| **L4** | Position Size | EV/Risk ratio | HIGH: 5–8% · MED: 2–4% · LOW: skip |
| **L5** | Monitor & Exit | 3 checkpoints | Pre-defined exit rules, locked |

### Sector-Calibrated L1 Thresholds

| Metric | AI Infrastructure | Energy Transition | Mega-Cap Tech |
|--------|-------------------|-------------------|---------------|
| Revenue growth | > 15% | > 5% | > 5% |
| Gross margin | > 40% | > 20% | > 35% |
| GM trend | > 200 bps/yr | > 50 bps/yr | > 50 bps/yr |
| Cash runway | > 18 months | > 18 months | > 24 months |

---

## Sample Output

```
python analyze.py --compare

  Metric                           NVDA           TSLA           AAPL
  ──────────────────────── ────────────── ────────────── ──────────────
  Price ($)                       $177.64        $352.82        $258.86
  Rev Growth (%)                    73.2%          -3.1%          15.7%
  Gross Margin (%)                 71.07%         18.03%         47.33%
  L1 Quality Gate              PASS (5/5)     FAIL (3/5)     PASS (5/5)
  Weighted EV                      +51.8%          -0.5%          +9.5%
  VERDICT                         [ENTER]        [AVOID]    [WATCHLIST]
```

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

## Disclaimer

This is a **paper trading and educational framework**. Not financial advice.
Options trading involves significant risk including total loss of premium paid.
Always verify data with official filings. Consult a licensed financial advisor.

---

*FAIM v2.0.0 · Built on first principles · Calibrated by real markets over time*
