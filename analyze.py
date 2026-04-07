#!/usr/bin/env python3
"""
FAIM v2.0 — Multi-Ticker Analysis Runner
==========================================
Runs the full 5-layer FAIM protocol on NVDA, TSLA, and AAPL.

Usage:
    python analyze.py                          # All 3 tickers
    python analyze.py NVDA                     # Single ticker
    python analyze.py NVDA TSLA AAPL --report  # Generate markdown reports
    python analyze.py --compare                # Side-by-side comparison table

Output:
    Console: Full analysis report for each ticker
    reports/: Markdown reports (with --report flag)
"""

import os
import sys
import argparse
from datetime import datetime

from faim_engine import FAIMEngine, SECTOR_THRESHOLDS


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ANALYSIS CONFIGURATIONS
# Analyst assumptions per ticker — these represent the user's
# differentiated view, not just consensus. A real user would
# update these based on their own research before each run.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS_CONFIG = {
    "NVDA": {
        "sector": "ai",
        "bull_prob": 30.0,
        "base_prob": 45.0,
        "bear_prob": 25.0,
        "has_catalyst": True,         # Blackwell ramp, data center demand
        "kill_switch": (
            "Exit immediately if: (1) Data center revenue growth declines below 30% YoY "
            "for two consecutive quarters, OR (2) Gross margin falls below 60%, OR "
            "(3) AMD MI400/Broadcom ASIC wins >25% hyperscaler market share"
        ),
        "notes": [
            "Thesis: AI infrastructure buildout is in early innings (year 2 of ~8-year cycle)",
            "Edge: Market underestimates enterprise AI adoption speed — still pricing NVDA as cyclical HW",
            "Risk: Hyperscaler custom silicon (Broadcom/Marvell) + export controls to China",
            "Catalyst: Blackwell revenue ramp in FY2026, GTC product announcements",
        ],
    },
    "TSLA": {
        "sector": "mega_tech",
        "bull_prob": 20.0,
        "base_prob": 45.0,
        "bear_prob": 35.0,
        "has_catalyst": True,         # Robotaxi / FSD / new models
        "kill_switch": (
            "Exit immediately if: (1) Auto gross margin falls below 13% for 2 quarters, OR "
            "(2) FSD regulatory approval delayed beyond 2027, OR "
            "(3) Delivery volume declines >15% YoY"
        ),
        "notes": [
            "Thesis: Market is pricing TSLA as an auto company, not a robotics/AI/energy platform",
            "Edge: FSD v13+ shows credible path to L4 autonomy — market hasn't repriced the optionality",
            "Risk: Margin compression from price cuts, brand damage from politics, China competition (BYD)",
            "Catalyst: Robotaxi launch, Optimus humanoid milestones, new affordable model",
        ],
    },
    "AAPL": {
        "sector": "mega_tech",
        "bull_prob": 20.0,
        "base_prob": 55.0,
        "bear_prob": 25.0,
        "has_catalyst": False,        # No clear 12-24mo catalyst → Stock only
        "kill_switch": (
            "Exit immediately if: (1) iPhone revenue declines >10% YoY for 2 quarters, OR "
            "(2) Services gross margin drops below 65%, OR "
            "(3) Major regulatory action forces App Store fee reduction >50%"
        ),
        "notes": [
            "Thesis: Stable compounder — Services revenue approaching $100B annual run rate",
            "Edge: Limited — Apple Intelligence adoption may be slower than market expects",
            "Risk: China market share loss, antitrust (DMA/DOJ), hardware cycle saturation",
            "Catalyst: None clear in 12-24mo — iPhone refresh cycle is evolutionary, not revolutionary",
        ],
    },
}


def run_single(engine: FAIMEngine, ticker: str, config: dict, save_report: bool = False):
    """Run full FAIM analysis on a single ticker."""
    print(f"\n  Fetching data for {ticker}...", end="", flush=True)
    try:
        data = engine.fetch_data(ticker)
    except Exception as e:
        print(f"\n  [ERROR] Failed to fetch {ticker}: {e}")
        return None

    print(f" ${data['price']} ✓")

    verdict = engine.full_analysis(
        data,
        sector=config.get("sector"),
        bull_prob=config.get("bull_prob", 25),
        base_prob=config.get("base_prob", 50),
        bear_prob=config.get("bear_prob", 25),
        kill_switch=config.get("kill_switch", ""),
        has_catalyst=config.get("has_catalyst", True),
    )

    engine.print_report(verdict)

    # Print analyst notes
    notes = config.get("notes", [])
    if notes:
        print("  ── Analyst Notes ──")
        for n in notes:
            print(f"    • {n}")
        print()

    if save_report:
        reports_dir = os.path.join(os.path.dirname(__file__), "reports")
        os.makedirs(reports_dir, exist_ok=True)
        path = os.path.join(reports_dir, f"{ticker}_report.md")
        engine.save_report(verdict, path)
        print(f"  → Report saved: {path}")

    return verdict


def run_comparison(engine: FAIMEngine, tickers: list):
    """Print side-by-side comparison table."""
    results = []
    for t in tickers:
        cfg = ANALYSIS_CONFIG.get(t, {})
        print(f"  Fetching {t}...", end="", flush=True)
        try:
            data = engine.fetch_data(t)
            v = engine.full_analysis(
                data,
                sector=cfg.get("sector"),
                bull_prob=cfg.get("bull_prob", 25),
                base_prob=cfg.get("base_prob", 50),
                bear_prob=cfg.get("bear_prob", 25),
                kill_switch=cfg.get("kill_switch", ""),
                has_catalyst=cfg.get("has_catalyst", True),
            )
            results.append((t, data, v))
            print(f" ✓")
        except Exception as e:
            print(f" FAILED: {e}")

    if not results:
        print("  No data to compare.")
        return

    # Comparison table
    sep = "═" * 80
    thin = "─" * 80
    print(f"\n{sep}")
    print(f"  FAIM v2.0 — Comparison Table · {datetime.now().strftime('%Y-%m-%d')}")
    print(f"{sep}\n")

    header = f"  {'Metric':<24}"
    for t, _, _ in results:
        header += f" {t:>14}"
    print(header)
    print(f"  {'─'*24}" + "".join(f" {'─'*14}" for _ in results))

    def row(label, vals):
        r = f"  {label:<24}"
        for v in vals:
            r += f" {v:>14}"
        print(r)

    row("Price ($)", [f"${d['price']}" for _, d, _ in results])
    row("Market Cap ($B)", [f"${d['market_cap_b']}B" for _, d, _ in results])
    row("Sector", [v.sector[:14] for _, _, v in results])
    row("Rev Growth (%)", [f"{d['rev_growth_pct']}%" for _, d, _ in results])
    row("Gross Margin (%)", [f"{d['gross_margin_pct']}%" for _, d, _ in results])
    row("Net Cash ($B)", [f"${d['net_cash_b']}B" for _, d, _ in results])
    row("Forward P/E", [f"{d['forward_pe']}" for _, d, _ in results])
    row("PEG Ratio", [f"{d['peg_ratio']}" for _, d, _ in results])
    row("Short Float (%)", [f"{d['short_float_pct']}%" for _, d, _ in results])
    print(f"  {'─'*24}" + "".join(f" {'─'*14}" for _ in results))
    row("L1 Quality Gate", [f"{'PASS' if v.l1.passed else 'FAIL'} ({v.l1.passes_count}/5)" for _, _, v in results])
    row("L2 Mispricing Gap", [f"{v.l2.gap_pct:+.1f}%" for _, _, v in results])
    row("Weighted EV", [f"{v.l3.weighted_ev_pct:+.1f}%" for _, _, v in results])
    row("EV/Risk", [f"{v.l3.ev_risk_ratio:.2f}×" for _, _, v in results])
    row("Conviction", [v.l4.conviction_tier for _, _, v in results])
    row("Allocation", [f"{v.l4.alloc_pct}%" for _, _, v in results])
    row("Instrument", [v.l4.instrument for _, _, v in results])
    print(f"  {'─'*24}" + "".join(f" {'─'*14}" for _ in results))
    row("VERDICT", [f"[{v.action}]" for _, _, v in results])

    print(f"\n{sep}")
    print("  Source: Yahoo Finance · Verify with 10-K / 10-Q")
    print(f"{sep}\n")


def main():
    parser = argparse.ArgumentParser(
        description="FAIM v2.0 — Run 5-Layer Analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python analyze.py                    # Analyze NVDA, TSLA, AAPL
    python analyze.py NVDA               # Single ticker
    python analyze.py --compare          # Side-by-side comparison
    python analyze.py --report           # Save markdown reports
    python analyze.py NVDA --report      # Single ticker + save
        """
    )
    parser.add_argument("tickers", nargs="*", default=["NVDA", "TSLA", "AAPL"],
                        help="Ticker symbols to analyze (default: NVDA TSLA AAPL)")
    parser.add_argument("--compare", action="store_true",
                        help="Show side-by-side comparison table")
    parser.add_argument("--report", action="store_true",
                        help="Save markdown reports to reports/ folder")
    parser.add_argument("--portfolio", type=float, default=10000,
                        help="Virtual portfolio size in USD (default: 10000)")

    args = parser.parse_args()
    tickers = [t.upper() for t in args.tickers]
    engine = FAIMEngine(portfolio_size=args.portfolio)

    print(f"\n{'═'*64}")
    print(f"  FAIM v2.0 — Five-Layer Investment Decision Protocol")
    print(f"  Portfolio: ${args.portfolio:,.0f} · Tickers: {', '.join(tickers)}")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'═'*64}")

    if args.compare:
        run_comparison(engine, tickers)
    else:
        for t in tickers:
            config = ANALYSIS_CONFIG.get(t, {})
            if not config:
                print(f"\n  ⚠ No pre-configured analysis for {t}. Running with defaults.")
                config = {}
            run_single(engine, t, config, save_report=args.report)

    print("  Done.\n")


if __name__ == "__main__":
    main()
