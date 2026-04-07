# FAIM v2.0 — Standard Operating Procedure (SOP)

**Fine Art Investment Model · Five-Layer Decision Protocol**
*A structured, self-improving framework for retail investors with analytical backgrounds*

---

## 0. Prime Directives (Non-Negotiable)

```
1. No story without numbers     — Every judgment is quantified or it doesn't exist.
2. Kill switch before bull case — Define failure conditions first, success conditions second.
3. Depth beats breadth          — AI Infrastructure + Energy Transition + Mega-Cap Tech.
4. Patient capital wins         — 12–24 month time horizon. Time is the retail edge.
5. Paper trade 15 → calibrate → real money. Zero exceptions.
```

> **Why these rules exist:**
> Rule 1 defeats narrative bias (Kahneman's "What You See Is All There Is").
> Rule 2 defeats optimism bias (Tetlock: uncalibrated forecasters fail).
> Rule 3 defeats diversification theater (Buffett: wide diversification is for those who don't know what they're doing).
> Rule 4 defeats impatience (institutional money has quarterly pressure; you don't).
> Rule 5 defeats overconfidence (the #1 killer of retail portfolios).

---

## 1. Architecture Overview

### Python Stack (Primary — your working tools)
```
Model_v1/
├── faim_engine.py    ← Core 5-layer engine (all logic lives here)
├── analyze.py        ← Run analysis on any ticker(s)
├── data_fetch.py     ← Quick data lookup helper
├── reports/          ← Generated markdown reports (auto-created)
│   ├── NVDA_report.md
│   ├── TSLA_report.md
│   └── AAPL_report.md
└── requirements.txt  ← Dependencies: yfinance, pandas
```

### Web App (Visual companion — for logging & review)
```
├── index.html        ← App entry point (double-click or local server)
├── core.js           ← State, math engine, sector thresholds
├── wizard.js         ← Interactive 5-layer wizard
├── cards.js          ← Trade card log + calibration dashboard
└── style.css         ← UI design system
```

### Getting Started
```bash
# Install dependencies (one time)
pip install yfinance pandas

# Run analysis
python analyze.py                    # NVDA, TSLA, AAPL full reports
python analyze.py NVDA               # Single ticker
python analyze.py --compare          # Side-by-side table
python analyze.py --report           # Save markdown to reports/

# Quick data fetch
python data_fetch.py NVDA            # Full data sheet
python data_fetch.py CEG --sector energy   # Energy sector thresholds

# Web app (visual tool for logging trades)
python -m http.server 8080           # → http://localhost:8080
```

---

## 2. Pre-Analysis Checklist

Before running any analysis, answer these three questions:

```
□ Does this company fit AI Infrastructure, Energy Transition, or Mega-Cap Tech?
  → NO → Stop. Wrong universe. The model is not designed for it.

□ Do I have a clear 12–24 month catalyst (earnings, product launch, regulatory)?
  → NO → The thesis is not actionable. Go to watchlist.

□ Have I pulled the data (python analyze.py TICKER or data_fetch.py)?
  → NO → Never trust memory. Pull real numbers first.
```

### Data Sources (Priority Order)
| Source | Use For | Trust Level |
|--------|---------|-------------|
| 10-K / 10-Q filings | Revenue, margins, cash flow | ★★★★★ Primary |
| Macrotrends.net | Historical trend data | ★★★★ Good |
| Yahoo Finance API | Quick screen, analyst targets | ★★★ Screen only |
| Seeking Alpha | Qualitative research | ★★ Cross-reference |

> **Rule:** Never make an investment decision using only API data.
> Always verify L1 numbers against official filings before logging a trade card.

---

## 3. The Five-Layer Protocol (Step-by-Step)

### Layer 0 — Setup & Classification

**What you do:** Identify the ticker, current price, sector, and seed thesis.

**Sector Profiles & Thresholds:**
| Metric | AI Infrastructure | Energy Transition | Mega-Cap Tech |
|--------|-------------------|-------------------|---------------|
| Rev Growth min | >15% | >5% | >5% |
| Gross Margin min | >40% | >20% | >35% |
| GM Trend min | >200 bps/yr | >50 bps/yr | >50 bps/yr |
| Cash Runway min | >18 months | >18 months | >24 months |
| Mgmt Score min | ≥3/5 | ≥3/5 | ≥3/5 |

**Seed Thesis Format:**
```
❌ Wrong: "This company has potential"
❌ Wrong: "AI is the future"
✅ Right: "FY26 data center revenue growth >80%, consensus at 60% → 20pt gap"
✅ Right: "Services revenue at $100B run rate priced at 8x, peers at 12x"
```

> **The seed thesis must contain at least one number.** If you can't quantify
> your thesis, you don't have a thesis — you have a feeling.

---

### Layer 1 — Quality Gate (4 of 5 checks must pass)

**Purpose:** Filter out weak companies in 60 seconds. This is a binary PASS/FAIL.

| Check | What to Look For | Pass Condition |
|-------|-----------------|----------------|
| Revenue Growth | YoY growth rate | ≥ sector minimum |
| Gross Margin / Trend | Current GM or improving trend | GM ≥ min OR trend ≥ min bps |
| ROIC vs WACC | Are they creating value? | ROIC > ~9% (market WACC) |
| Balance Sheet | Can they survive a downturn? | ≥18 months runway or self-funding |
| Management | Capital allocation track record | ≥3/5 auto-score |

**How auto-scoring works (Management):**
```
+1 point: Positive free cash flow
+1 point: ROIC > 15%
+1 point: Net cash positive (cash > debt)
+1 point: Revenue growing
+1 point: Operating margin positive
Need ≥ 3/5 to pass
```

> **L1 FAIL is not failure — it's protection.**
> A FAIL means the company's current fundamentals don't support high-EV entry.
> Add to watchlist. Re-evaluate next quarter.

---

### Layer 2 — Mispricing Detector (≥10% gap required)

**Purpose:** Find where the market is wrong. No edge = no trade.

```
Gap = Your Growth Estimate - Consensus Estimate
If |Gap| ≥ 10% → "IDENTIFIED" (you may have an edge)
If |Gap| < 10% → "NOT FOUND" (you're trading consensus = no alpha)
```

**Edge Types (you must select one):**
| Type | Example |
|------|---------|
| Channel / Supply Chain | "My industry contacts say orders are 2x consensus" |
| Wrong Metric (Anchoring) | "Market uses P/E but should use EV/Revenue for pre-profit companies" |
| Conservative Guidance | "Management guides low; last 8 quarters beat by 15%+" |
| Historical Analog | "This looks like AWS 2015 — market didn't price cloud correctly" |
| Structural Shift | "AI capex is structural, not cyclical — market treats it as cyclical" |

> **The Goldman Test:** Would a Goldman PM say "interesting" or "everyone knows that"?
> If everyone knows it, your edge is zero. Don't trade.

**Short Float Reference:**
- <2%: Institutional consensus, possibly crowded long
- 2-10%: Normal range
- 10-15%: Contrarian opportunity OR fundamental problem — investigate
- >15%: High risk. Requires very strong conviction.

---

### Layer 3 — Thesis Construction (Most Critical Step)

**Purpose:** Force quantified scenario analysis. Numbers, not adjectives.

**Strict fill order:**
```
1. Kill Switch FIRST → What specific condition triggers immediate exit?
2. Bear Case     → What makes you totally wrong?
3. Base Case     → What happens if nothing surprising occurs?
4. Bull Case     → What's the best realistic outcome?
5. Probabilities → Must sum to 100%. Bull ≤ 40%.
```

> **⚠ Never fill the Bull case first.** You will anchor on optimism.
> Kahneman: "The anchoring effect is one of the most robust findings in psychology."

**Probability Guidelines (Beginner Stage):**
| Profile | Bull | Base | Bear | Notes |
|---------|------|------|------|-------|
| Conservative | 20% | 55% | 25% | Recommended for first 15 trades |
| Standard | 25% | 50% | 25% | After first calibration cycle |
| Aggressive | 35% | 40% | 25% | Only with demonstrated calibration accuracy |

> **Hard Rule: Bull probability > 40% = self-deception.**
> If you genuinely believe bull is >40%, your base case isn't conservative enough.
> Redistribute probability to base.

**Kill Switch Examples:**
```
Good: "Exit if gross margin < 60% for any quarter"
Good: "Exit if data center revenue growth < 30% YoY for 2 consecutive quarters"
Good: "Exit if CEO departs or major management change"
Bad:  "Exit if the stock drops 20%" (that's a trailing stop, not a thesis exit)
Bad:  "Exit when I feel like it" (no discipline = no edge)
```

---

### Layer 4 — Position Sizing

**Purpose:** Convert EV/Risk ratio to conviction and allocation.

**EV Calculation:**
```
For stocks:
  Weighted EV = (Bull% × Bull Return%) + (Base% × Base Return%) + (Bear% × Bear Return%)

For LEAPS:
  Bull Return = delta × (bull_target - price) / premium × 100
  Base Return = delta × (base_target - price) / premium × 100
  Bear Return = user-defined (typically -80% to -100%)
```

**Conviction → Allocation:**
| EV/Risk Ratio | Conviction | Allocation | Action |
|---------------|------------|------------|--------|
| > 2.5× | HIGH | 5–8% | Stage entry: 50% now, 50% on next data point |
| 1.5–2.5× | MEDIUM | 2–4% | Stage entry: 50/50 |
| < 1.5× | LOW | 0% | Watchlist only. No position. |

**Instrument Decision Tree:**
```
Q1: Clear 12–24 month catalyst?
├── YES → LEAPS possible
│   ├── Q2: IV environment normal? → Buy now
│   ├── Q2: IV high (pre-earnings)? → Wait for IV crush, then buy
│   ├── Q3: Deep ITM (δ 0.70–0.80) → Lower risk, behaves like stock
│   └── Q3: Near-money (δ 0.45–0.60) → More leverage, needs precise timing
└── NO → Stock only. LEAPS without catalyst = time decay trap.
```

**LEAPS Rules:**
- Minimum 12 months to expiry. Prefer 18–24 months.
- Never hold past 60 DTE without rolling (if thesis intact) or closing (if thesis damaged).
- Deep ITM (δ 0.70–0.80) for conviction plays. Near-money for speculative.

**Correlation Guard:**
- Maximum 8% of portfolio in correlated positions (same sector).
- If you already have 5% in NVDA, adding 5% in AMD violates the guard.

---

### Layer 5 — Monitoring & Exit Protocol

**Purpose:** Pre-commit to exit rules. Write them at entry. Lock them. Never revise under pressure.

**Three Checkpoints (mandatory):**
```
Each checkpoint = specific date + specific event + what to look for

Example:
  CP1: 2026-05-15 · Q1 FY27 Earnings · Data center revenue growth ≥ 80% YoY
  CP2: 2026-09-01 · GTC Fall · Blackwell Ultra architecture announcement
  CP3: 2027-01-15 · Q3 FY27 Earnings · Guidance for FY28 ≥ $200B revenue
```

**Exit Rules (pre-committed, non-negotiable):**
| Condition | Action |
|-----------|--------|
| Bull target hit | Sell 50–75%. Set trailing stop on remainder. |
| Kill switch triggered | Full exit within 5 trading days. No exceptions. |
| LEAPS < 60 DTE + thesis intact | Roll forward to next available expiry. |
| Better opportunity + thesis weakening | Rotate. Document reason. |

**"What Would Change My Mind?" (Write this at entry):**
> This is the single most important discipline. Pre-committing to
> intellectual honesty prevents moving the goalposts after losses.

---

## 4. Trade Card Management

### Logging a Trade Card
After completing the 5-layer analysis:
1. Click **Log Trade Card** in the Summary page (web app)
2. OR record manually: ticker, date, instrument, entry price, allocation, EV, conviction, thesis, kill switch, checkpoints

### Updating Card Status
At each checkpoint or exit event:
1. Record: exit date, exit price, actual return %
2. Self-assess: Thesis right? Timing right? Sizing right? Exit discipline?
3. Set status: `Closed Win` / `Closed Loss` / `Rolled`

### Backup Strategy
```bash
# Option 1: CSV export (from web app Trade Cards tab)
# Click "↓ CSV" button

# Option 2: localStorage JSON backup
# Browser Console (⌘⌥J):
copy(localStorage.getItem('faim_v1'))
# Paste into backup_2026-04-06.json
```

---

## 5. Calibration Protocol

### Trigger Conditions (both must be met)
- ≥ 15 total trade cards logged
- ≥ 10 cards in Closed status (Win or Loss)

### Calibration Review Checklist
```
A. Win Rate Analysis
   □ Actual win rate vs predicted probability
   □ Average return vs predicted weighted EV
   □ Are you systematically overestimating your edge?

B. Systematic Bias Detection (auto-computed)
   □ Timing: Too early (>40% of trades "Early") → Entering before catalysts confirm
   □ Timing: Too late (>40% "Late") → Entering after most of the move
   □ High win rate + low return → Sizing too conservative
   □ Low win rate → L1/L2 gates too loose

C. Layer Weakness Radar (auto-scored L1–L5)
   □ Lowest score = layer to review first
   □ Adjust that layer's thresholds or process
   □ Document the change in CHANGELOG.md

D. Model Update
   □ Record what changed and why
   □ Update SOP version if process changed
   □ Start next 15-card calibration cycle
```

### Model Iteration Rules
```
Allowed at any time:
  - Portfolio size adjustment (Settings)
  - Adding notes to existing cards

Allowed after calibration cycle (15 trades):
  - Adjusting L1 thresholds (e.g., raise revenue growth min from 15% to 20%)
  - Adjusting probability distribution habits
  - Adjusting position sizing rules

Requires extraordinary evidence:
  - Changing the 5-layer framework structure itself
  - Removing a gate or check entirely
  - Changing the 15-trade calibration cycle length
```

> **Never modify the model after a single loss.** That's emotional reaction,
> not data-driven improvement. Wait for the calibration cycle.

---

## 6. FAQ

**Q: L1 FAIL — is this analysis wasted?**
A: No. FAIL is a conclusion: this company's current fundamentals don't support
high-EV entry under FAIM's framework. Add to watchlist. Re-evaluate next quarter.

**Q: TSLA/AAPL keep coming up as AVOID/WATCHLIST. Is the model broken?**
A: The model is working correctly. AAPL has no clear 12-24 month catalyst and
limited mispricing gap (consensus is accurate). TSLA has low gross margins and
negative revenue growth — it fails L1 Quality Gate on fundamentals. The model
is designed for high-growth mispriced opportunities, not stable compounders.

**Q: How do I handle stocks outside AI/Energy/Mega-Tech sectors?**
A: Don't. Sector focus is a feature, not a limitation. Breadth without depth
produces mediocre returns. If you want to analyze healthcare or financials, build
a separate model with sector-appropriate thresholds.

**Q: I don't have options trading permission. Can I still use FAIM?**
A: Yes. Select "Stock" as the instrument. Do 15 paper trades, then apply for options
permission with your broker — having a documented paper trading record helps.

**Q: data_fetch.py numbers differ from the 10-K. Which do I trust?**
A: Official filings. Always. The API is for quick screening. Core numbers
(revenue, margins, cash flow) must be verified from SEC filings or Macrotrends.

---

## 7. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│  FAIM v2.0 Quick Check                                          │
├─────────────────────────────────────────────────────────────────┤
│  BEFORE:                                                        │
│  □ Ran data_fetch.py or analyze.py for this ticker              │
│  □ Company fits AI Infra / Energy Transition / Mega-Cap Tech    │
│  □ Clear 12–24 month catalyst identified                        │
│  □ Verified L1 numbers against official filings                 │
│                                                                 │
│  DURING:                                                        │
│  □ Kill Switch filled FIRST                                     │
│  □ Bull probability ≤ 40%                                       │
│  □ Probabilities sum to exactly 100%                            │
│  □ LEAPS: Delta 0.70–0.80, expiry ≥ 12 months                  │
│  □ Single position ≤ 5%, correlated total ≤ 8%                  │
│                                                                 │
│  AFTER:                                                         │
│  □ Trade card logged (web app or manual record)                 │
│  □ 3 checkpoints on calendar with reminders                     │
│  □ Weekly backup (CSV or JSON)                                  │
│                                                                 │
│  GOLDEN RULE:                                                   │
│  Paper trade 15x (10 closed) → Calibrate → Then real money      │
└─────────────────────────────────────────────────────────────────┘
```

---

*FAIM v2.0 · SOP Version 2.0 · Updated: 2026-04-06*
*This document updates after each 15-card calibration cycle*
