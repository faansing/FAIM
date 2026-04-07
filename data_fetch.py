"""
FAIM v1.1 — data_fetch.py
Fine Art Investment Model · Data Collection Helper
===================================================
Purpose:
    Quickly fetch core L1/L2 data for a single ticker.
    Output field names map directly to wizard.js input IDs.

Usage:
    pip install yfinance pandas
    python data_fetch.py NVDA
    python data_fetch.py NVDA --json                  # JSON only
    python data_fetch.py CEG ANET VST                 # comparison table
    python data_fetch.py CEG --sector energy          # Energy Transition thresholds

Note:
    Data sourced from Yahoo Finance API — delays and methodology
    differences exist. Always verify core numbers against official
    10-K / 10-Q filings before entering into the FAIM wizard.
"""

import sys
import json
import argparse
import warnings
warnings.filterwarnings("ignore")

try:
    import yfinance as yf
except ImportError:
    print("[ERROR] Missing dependency. Run: pip install yfinance pandas")
    sys.exit(1)


# ──────────────────────────────────────────────────────────────
# SECTOR-AWARE THRESHOLDS — mirrors core.js getL1Thresholds()
# ──────────────────────────────────────────────────────────────
SECTOR_THRESHOLDS = {
    "ai": {
        "label":      "AI Infrastructure",
        "rev_growth":  15.0,   # %
        "gross_margin":40.0,   # %
        "gm_trend":    200,    # bps/yr
        "runway":      18,     # months
    },
    "energy": {
        "label":      "Energy Transition",
        "rev_growth":  5.0,
        "gross_margin":20.0,
        "gm_trend":    50,
        "runway":      18,
    }
}

L2_GAP_MIN     = 10.0   # % gap vs consensus to flag mispricing
L2_SHORT_HIGH  = 10.0   # % short float — warn if above
CAL_THRESHOLD  = 15     # paper trades before going live


def get_thresholds(sector_key: str) -> dict:
    """Return threshold dict for the given sector key (ai/energy)."""
    return SECTOR_THRESHOLDS.get(sector_key, SECTOR_THRESHOLDS["ai"])


# ──────────────────────────────────────────────────────────────
# CORE FETCH
# ──────────────────────────────────────────────────────────────
def fetch(ticker: str, sector_key: str = "ai") -> dict:
    """
    Returns a structured dict with all FAIM Layer 0-2 data.
    Fields map directly to wizard.js input IDs.
    """
    thr  = get_thresholds(sector_key)
    tk   = yf.Ticker(ticker.upper())
    info = tk.info or {}

    # -- Layer 0: Basic ────────────────────────────────────────
    price   = info.get("currentPrice") or info.get("regularMarketPrice") or 0
    company = info.get("longName", ticker.upper())
    sector  = info.get("sector", "Unknown")
    market_cap = info.get("marketCap", 0) or 0

    # -- Layer 1: Quality Gate ─────────────────────────────────
    rev_growth   = round((info.get("revenueGrowth")   or 0) * 100, 1)
    gross_margin = round((info.get("grossMargins")     or 0) * 100, 1)
    op_margin    = round((info.get("operatingMargins") or 0) * 100, 1)
    total_cash   = info.get("totalCash", 0) or 0
    total_debt   = info.get("totalDebt", 0) or 0
    op_cf        = info.get("operatingCashflow", 0) or 0
    net_cash     = total_cash - total_debt

    # Runway: months of cash at current burn rate
    if op_cf > 0:
        runway_mo_str = "N/A (positive OCF — self-funding)"
        runway_mo_num = 999
    elif op_cf < 0:
        runway_mo_num = round((total_cash / abs(op_cf)) * 12, 1)
        runway_mo_str = str(runway_mo_num)
    else:
        runway_mo_num = 0
        runway_mo_str = "0 (no cash flow data)"

    # ROIC proxy (ROE as substitute — noted in output)
    roic_proxy = round((info.get("returnOnEquity") or 0) * 100, 1)
    wacc_rough = 9.0  # rough market average WACC

    # -- Layer 2: Mispricing ───────────────────────────────────
    analyst_target  = info.get("targetMeanPrice", 0) or 0
    analyst_low     = info.get("targetLowPrice",  0) or 0
    analyst_high    = info.get("targetHighPrice", 0) or 0
    analyst_count   = info.get("numberOfAnalystOpinions", 0) or 0
    upside_pct      = round((analyst_target - price) / price * 100, 1) if price else 0
    short_pct       = round((info.get("shortPercentOfFloat") or 0) * 100, 1)
    eps_growth      = round((info.get("earningsGrowth")  or 0) * 100, 1)
    rev_fwd         = round((info.get("revenueGrowth")   or 0) * 100, 1)  # ttm proxy
    trailing_pe     = round(info.get("trailingPE")  or 0, 1)
    forward_pe      = round(info.get("forwardPE")   or 0, 1)
    peg             = round(info.get("pegRatio")    or 0, 2)
    ev_revenue      = round(info.get("enterpriseToRevenue") or 0, 2)
    ev_ebitda       = round(info.get("enterpriseToEbitda")  or 0, 2)

    # -- L1 Auto-Eval (sector-aware) ──────────────────────────
    checks = {
        "rev_growth_pass":   rev_growth   >= thr["rev_growth"],
        "gross_margin_pass": gross_margin >= thr["gross_margin"],
        "runway_pass":       runway_mo_num >= thr["runway"] or runway_mo_num == 999,
        "roic_proxy_pass":   roic_proxy   >= wacc_rough,
        # GM trend and mgmt score require manual input
        "gm_trend_manual":   True,
        "mgmt_score_manual": True,
    }
    auto_passes = sum(1 for k, v in checks.items()
                      if not k.endswith("_manual") and v)
    l1_prelim = "LIKELY PASS" if auto_passes >= 3 else "LIKELY FAIL"

    # -- Warnings ──────────────────────────────────────────────
    warnings_list = []
    if rev_growth < thr["rev_growth"]:
        warnings_list.append(f"⚠ L1 FAIL: Rev growth {rev_growth}% < {thr['rev_growth']}% threshold ({thr['label']})")
    if gross_margin < thr["gross_margin"]:
        warnings_list.append(f"⚠ L1 CAUTION: Gross margin {gross_margin}% < {thr['gross_margin']}% ({thr['label']})")
    if runway_mo_num != 999 and runway_mo_num < thr["runway"]:
        warnings_list.append(f"⚠ L1 FAIL: Runway {runway_mo_num}mo < {thr['runway']}mo min")
    if short_pct > L2_SHORT_HIGH:
        warnings_list.append(f"⚠ L2: Short float {short_pct}% — crowded or troubled?")
    if short_pct < 2:
        warnings_list.append(f"ℹ L2: Short float {short_pct}% — possibly crowded long side")
    if peg > 3:
        warnings_list.append(f"⚠ L2: PEG {peg} — growth priced in, harder to find edge")
    if not warnings_list:
        warnings_list.append("✓ No auto-warnings. Verify with official filings.")

    # -- Build output dict (mirrors wizard field names) ────────
    return {
        # Step 0
        "f-ticker":  ticker.upper(),
        "f-company": company,
        "f-price":   price,
        "sector":    sector,
        "sector_profile": thr["label"],
        "market_cap_b": round(market_cap / 1e9, 2),

        # Step 1 (L1)
        "f-l1-rev":     rev_growth,
        "f-l1-gm":      gross_margin,
        "f-l1-gmtrend": "MANUAL — compare last 2 years gross margin",
        "f-l1-runway":  runway_mo_str,
        "l1ROIC":       "yes" if roic_proxy >= wacc_rough else "path",
        "l1Mgmt":       "MANUAL — rate 1-5 based on capital allocation history",
        "op_margin_pct": op_margin,
        "net_cash_b":    round(net_cash / 1e9, 2),

        # Step 2 (L2)
        "f-l2-implied":  "MANUAL — back-solve from EV/Rev vs peers",
        "f-l2-cons":     rev_fwd,
        "f-l2-yours":    "MANUAL — your own growth estimate",
        "f-l2-short":    short_pct,
        "f-l2-edge":     "MANUAL — your one-line information edge",

        # Reference data (not in wizard, for research)
        "reference": {
            "trailing_pe":    trailing_pe,
            "forward_pe":     forward_pe,
            "peg_ratio":      peg,
            "ev_revenue":     ev_revenue,
            "ev_ebitda":      ev_ebitda,
            "analyst_target": analyst_target,
            "analyst_low":    analyst_low,
            "analyst_high":   analyst_high,
            "analyst_count":  analyst_count,
            "upside_to_target_pct": upside_pct,
            "eps_growth_ttm_pct":   eps_growth,
            "roic_proxy_pct": roic_proxy,
            "wacc_rough_pct": wacc_rough,
        },

        # Auto-evaluation
        "l1_auto_checks":  checks,
        "l1_prelim_result": l1_prelim,
        "l1_thresholds_used": {
            "profile": thr["label"],
            "rev_growth_min": thr["rev_growth"],
            "gross_margin_min": thr["gross_margin"],
            "gm_trend_min": thr["gm_trend"],
            "runway_min": thr["runway"],
        },
        "warnings": warnings_list,
        "manual_required": [
            "f-l1-gmtrend: Check gross margin in last 2 annual reports, compute delta x 100",
            "l1Mgmt: Score 1-5 based on buyback history, M&A quality, guidance accuracy",
            "f-l2-implied: Use EV/Revenue / sector avg multiple to back-solve implied growth",
            "f-l2-yours: Your own growth model or conviction on forward estimates",
            "f-l2-edge: Write your specific information advantage in one sentence",
        ]
    }


# ──────────────────────────────────────────────────────────────
# DISPLAY
# ──────────────────────────────────────────────────────────────
def display(data: dict, json_only: bool = False):
    if json_only:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return

    thr = data.get("l1_thresholds_used", {})
    profile = thr.get("profile", "AI Infrastructure")
    sep = "─" * 56
    print(f"\n{'═'*56}")
    print(f"  FAIM Data Fetch — {data['f-ticker']} · {data['f-company']}")
    print(f"  Sector Profile: {profile}")
    print(f"{'═'*56}")
    print(f"  Sector   : {data['sector']}")
    print(f"  Price    : ${data['f-price']}   |   Mkt Cap: ${data['market_cap_b']}B")
    print()

    rev_min = thr.get("rev_growth_min", 15)
    gm_min  = thr.get("gross_margin_min", 40)
    rwy_min = thr.get("runway_min", 18)
    print(f"  ── L1 Quality Gate ({profile}) {'─'*max(0, 36-len(profile))}")
    print(f"  Rev Growth YoY    : {data['f-l1-rev']}%   (min {rev_min}%)")
    print(f"  Gross Margin      : {data['f-l1-gm']}%   (min {gm_min}%)")
    print(f"  GM Trend (bps/yr) : {data['f-l1-gmtrend']}")
    print(f"  Cash Runway       : {data['f-l1-runway']} months (min {rwy_min})")
    print(f"  Net Cash          : ${data['net_cash_b']}B")
    print(f"  ROIC vs WACC      : {data['l1ROIC'].upper()}  (proxy ROE {data['reference']['roic_proxy_pct']}% vs ~{data['reference']['wacc_rough_pct']}% WACC)")
    print(f"  Mgmt Score        : {data['l1Mgmt']}")
    print(f"  ► Prelim L1:      [{data['l1_prelim_result']}]")
    print()

    print(f"  ── L2 Mispricing Reference {'─'*27}")
    print(f"  Short Float       : {data['f-l2-short']}%")
    r = data["reference"]
    print(f"  Trailing P/E      : {r['trailing_pe']}   Forward P/E: {r['forward_pe']}")
    print(f"  PEG Ratio         : {r['peg_ratio']}")
    print(f"  EV/Revenue        : {r['ev_revenue']}   EV/EBITDA: {r['ev_ebitda']}")
    print(f"  Analyst Target    : ${r['analyst_target']}  ({r['upside_to_target_pct']}% upside, n={r['analyst_count']})")
    print(f"  Consensus RevGrow : {data['f-l2-cons']}%  (TTM proxy)")
    print(f"  Your Estimate     : {data['f-l2-yours']}")
    print(f"  Your Edge         : {data['f-l2-edge']}")
    print()

    print(f"  ── Warnings {'─'*43}")
    for w in data["warnings"]:
        print(f"  {w}")
    print()

    print(f"  ── Manual Required (fill in app) {'─'*22}")
    for m in data["manual_required"]:
        print(f"  □ {m}")

    print(f"\n{'═'*56}")
    print("  Source: Yahoo Finance (yfinance). Verify with 10-K/10-Q.")
    print(f"{'═'*56}\n")


# ──────────────────────────────────────────────────────────────
# MULTI-TICKER COMPARISON
# ──────────────────────────────────────────────────────────────
def compare(tickers: list, sector_key: str = "ai"):
    """Print a compact side-by-side L1 comparison table."""
    thr = get_thresholds(sector_key)
    results = []
    for t in tickers:
        print(f"  Fetching {t}...", end="\r")
        try:
            results.append(fetch(t, sector_key))
        except Exception as e:
            print(f"  [WARN] {t} fetch failed: {e}")

    if not results:
        return

    print(f"\n  Thresholds: {thr['label']} — Rev>{thr['rev_growth']}%, GM>{thr['gross_margin']}%\n")
    headers = ["Ticker", "Price", "RevGr%", "GM%", "Short%", "FwdPE", "PEG", "L1 Prelim"]
    row_fmt  = "{:<8} {:>7} {:>7} {:>6} {:>7} {:>7} {:>6}  {}"
    print("─"*70)
    print(row_fmt.format(*headers))
    print("─"*70)
    for d in results:
        r = d["reference"]
        print(row_fmt.format(
            d["f-ticker"],
            f"${d['f-price']}",
            f"{d['f-l1-rev']}%",
            f"{d['f-l1-gm']}%",
            f"{d['f-l2-short']}%",
            str(r["forward_pe"]),
            str(r["peg_ratio"]),
            d["l1_prelim_result"]
        ))
    print("─"*70)
    print("  Note: L1 Prelim = auto-scored only. GM Trend + Mgmt = manual.\n")


# ──────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="FAIM v1.1 — Data Fetch Helper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python data_fetch.py NVDA                    # AI Infrastructure thresholds (default)
  python data_fetch.py CEG --sector energy     # Energy Transition thresholds
  python data_fetch.py NVDA --json
  python data_fetch.py NVDA CEG VST ANET       # comparison mode
  python data_fetch.py CEG VST --sector energy # compare with energy thresholds
        """
    )
    parser.add_argument("tickers", nargs="+", help="One or more ticker symbols")
    parser.add_argument("--json",  action="store_true", help="Output JSON only")
    parser.add_argument("--sector", choices=["ai", "energy"], default="ai",
                        help="Sector profile for L1 thresholds: ai (default) or energy")
    args = parser.parse_args()

    tickers = [t.upper() for t in args.tickers]

    if len(tickers) == 1:
        data = fetch(tickers[0], sector_key=args.sector)
        display(data, json_only=args.json)
    else:
        compare(tickers, sector_key=args.sector)
        if args.json:
            print("\n[JSON — all tickers]")
            all_data = [fetch(t, sector_key=args.sector) for t in tickers]
            print(json.dumps(all_data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
