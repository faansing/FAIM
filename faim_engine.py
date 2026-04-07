"""
FAIM v2.0 — Python Analysis Engine
=====================================
Fine Art Investment Model · 5-Layer Decision Protocol

Architecture:
    L0  Setup & Sector Classification
    L1  Quality Gate        (4/5 checks → PASS/FAIL)
    L2  Mispricing Detector (≥10% gap → IDENTIFIED/NOT FOUND)
    L3  Thesis Construction (Bull/Base/Bear + Kill Switch → Weighted EV)
    L4  Position Sizing     (EV/Risk → Conviction → Allocation %)
    L5  Monitoring & Exit   (3 Checkpoints + Pre-committed exit rules)

Design Principles (from 40 years Wall St + Silicon Valley):
    1.  No story without numbers — every judgment is quantified
    2.  Kill switch before bull case — define failure first
    3.  Depth > breadth — AI Infrastructure + Energy Transition only
    4.  Patient capital is the structural edge — 12-24 month horizon
    5.  Paper trade 15 times, calibrate, then real money — no exceptions

Dependencies:
    pip install yfinance pandas

Usage:
    from faim_engine import FAIMEngine
    engine = FAIMEngine()
    report = engine.analyze("NVDA", sector="ai")
    print(report)

Author: FAIM Project
License: MIT
"""

import json
import warnings
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import Optional, Literal

import pandas as pd

warnings.filterwarnings("ignore")

try:
    import yfinance as yf
except ImportError:
    raise ImportError("Run: pip install yfinance pandas")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONSTANTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODEL_VERSION = "2.0"
CAL_THRESHOLD = 15
CAL_CLOSED_MIN = 10

SECTOR_THRESHOLDS = {
    "ai": {
        "label": "AI Infrastructure",
        "rev_growth_min": 15.0,      # %
        "gross_margin_min": 40.0,    # %
        "gm_trend_min": 200,         # bps/yr
        "runway_min": 18,            # months
        "mgmt_min": 3,               # /5
        "peer_tickers": ["NVDA", "AMD", "AVGO", "ANET", "SMCI"],
    },
    "energy": {
        "label": "Energy Transition",
        "rev_growth_min": 5.0,
        "gross_margin_min": 20.0,
        "gm_trend_min": 50,
        "runway_min": 18,
        "mgmt_min": 3,
        "peer_tickers": ["CEG", "VST", "NEE", "FSLR", "ENPH"],
    },
    "mega_tech": {
        "label": "Mega-Cap Tech (AAPL/MSFT/GOOG class)",
        "rev_growth_min": 5.0,
        "gross_margin_min": 35.0,
        "gm_trend_min": 50,
        "runway_min": 24,
        "mgmt_min": 3,
        "peer_tickers": ["AAPL", "MSFT", "GOOG", "META", "AMZN"],
    },
}

# EV/Risk → Conviction mapping (SOP §4)
CONVICTION_TIERS = [
    {"min_ratio": 2.5, "tier": "HIGH",   "alloc_pct": 6, "note": "Max 5-8% per position. Stage 50/50."},
    {"min_ratio": 1.5, "tier": "MEDIUM", "alloc_pct": 3, "note": "Stage entry: 50% now, 50% on next data point."},
    {"min_ratio": 0.0, "tier": "LOW",    "alloc_pct": 0, "note": "Watchlist only. No position."},
]

BULL_PROB_SOFT_CAP = 40    # SOP: "Bull > 40% is self-deception"
BULL_PROB_HARD_CAP = 65    # Hard overconfidence flag
CORR_SECTOR_MAX = 8.0     # Max % portfolio in correlated sector


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATA CLASSES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class L1Result:
    """Quality Gate result."""
    passed: bool
    checks: list  # list of {"name": str, "passed": bool, "detail": str}
    passes_count: int
    total_checks: int = 5
    sector_profile: str = ""
    thresholds_used: dict = field(default_factory=dict)


@dataclass
class L2Result:
    """Mispricing Detector result."""
    identified: bool
    gap_pct: float  # Your estimate - Consensus
    your_growth: float
    consensus_growth: float
    implied_growth: float
    short_float_pct: float
    warnings: list = field(default_factory=list)


@dataclass
class Scenario:
    """One of Bull / Base / Bear."""
    label: str
    prob_pct: float
    target_price: float
    stock_return_pct: float
    leaps_return_pct: float = 0.0
    driver: str = ""
    timeline: str = ""


@dataclass
class L3Result:
    """Thesis Construction result."""
    kill_switch: str
    bull: Scenario
    base: Scenario
    bear: Scenario
    weighted_ev_pct: float
    ev_risk_ratio: float
    prob_sum_valid: bool
    warnings: list = field(default_factory=list)


@dataclass
class L4Result:
    """Position Sizing result."""
    conviction_tier: str  # HIGH / MEDIUM / LOW
    alloc_pct: float
    alloc_usd: float
    instrument: str  # LEAPS / Stock
    ev_pct: float
    ev_risk_ratio: float
    warnings: list = field(default_factory=list)


@dataclass
class Verdict:
    """Final analysis verdict."""
    action: str  # ENTER / WATCHLIST / AVOID
    reason: str
    ticker: str
    price: float
    date: str
    l1: L1Result
    l2: L2Result
    l3: L3Result
    l4: L4Result
    sector: str
    model_version: str = MODEL_VERSION


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATA FETCHER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DataFetcher:
    """
    Pulls real market data from Yahoo Finance.
    Returns a structured dict for the FAIM engine.

    IMPORTANT: Yahoo Finance data has delays and methodology
    differences. Always verify against official 10-K / 10-Q.
    """

    @staticmethod
    def fetch(ticker: str) -> dict:
        """Fetch all available data for a single ticker."""
        tk = yf.Ticker(ticker.upper())
        info = tk.info or {}

        price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
        company = info.get("longName", ticker.upper())
        sector = info.get("sector", "Unknown")
        industry = info.get("industry", "Unknown")
        market_cap = info.get("marketCap", 0) or 0

        # L1 data
        rev_growth = round((info.get("revenueGrowth") or 0) * 100, 2)
        gross_margin = round((info.get("grossMargins") or 0) * 100, 2)
        op_margin = round((info.get("operatingMargins") or 0) * 100, 2)
        total_cash = info.get("totalCash", 0) or 0
        total_debt = info.get("totalDebt", 0) or 0
        op_cf = info.get("operatingCashflow", 0) or 0
        net_cash = total_cash - total_debt
        roe = round((info.get("returnOnEquity") or 0) * 100, 2)
        roic_proxy = roe  # proxy — true ROIC requires NOPAT/invested capital

        # Runway
        if op_cf > 0:
            runway_months = 999  # self-funding
        elif op_cf < 0:
            runway_months = round((total_cash / abs(op_cf)) * 12, 1) if total_cash else 0
        else:
            runway_months = 0

        # L2 data
        short_pct = round((info.get("shortPercentOfFloat") or 0) * 100, 2)
        analyst_target = info.get("targetMeanPrice", 0) or 0
        analyst_low = info.get("targetLowPrice", 0) or 0
        analyst_high = info.get("targetHighPrice", 0) or 0
        analyst_count = info.get("numberOfAnalystOpinions", 0) or 0
        upside_pct = round((analyst_target - price) / price * 100, 1) if price else 0
        eps_growth = round((info.get("earningsGrowth") or 0) * 100, 1)
        trailing_pe = round(info.get("trailingPE") or 0, 1)
        forward_pe = round(info.get("forwardPE") or 0, 1)
        peg = round(info.get("pegRatio") or 0, 2)
        ev_revenue = round(info.get("enterpriseToRevenue") or 0, 2)
        ev_ebitda = round(info.get("enterpriseToEbitda") or 0, 2)
        beta = round(info.get("beta") or 0, 2)

        # Historical price for trend analysis
        try:
            hist = tk.history(period="2y")
            price_52w_high = round(hist["Close"].max(), 2) if not hist.empty else 0
            price_52w_low = round(hist["Close"].min(), 2) if not hist.empty else 0
            # GM trend: approximate from financials if available
            financials = tk.quarterly_financials
            gm_trend_bps = 0
            if financials is not None and not financials.empty:
                try:
                    gp = financials.loc["Gross Profit"] if "Gross Profit" in financials.index else None
                    rev = financials.loc["Total Revenue"] if "Total Revenue" in financials.index else None
                    if gp is not None and rev is not None and len(gp) >= 4:
                        recent_gm = float(gp.iloc[0]) / float(rev.iloc[0]) * 100
                        old_gm = float(gp.iloc[3]) / float(rev.iloc[3]) * 100
                        gm_trend_bps = round((recent_gm - old_gm) * 100, 0)  # bps
                except Exception:
                    gm_trend_bps = 0
        except Exception:
            price_52w_high = 0
            price_52w_low = 0
            gm_trend_bps = 0

        return {
            "ticker": ticker.upper(),
            "company": company,
            "sector": sector,
            "industry": industry,
            "price": price,
            "market_cap": market_cap,
            "market_cap_b": round(market_cap / 1e9, 2),

            # L1
            "rev_growth_pct": rev_growth,
            "gross_margin_pct": gross_margin,
            "gm_trend_bps": gm_trend_bps,
            "op_margin_pct": op_margin,
            "total_cash": total_cash,
            "total_debt": total_debt,
            "net_cash": net_cash,
            "net_cash_b": round(net_cash / 1e9, 2),
            "op_cf": op_cf,
            "runway_months": runway_months,
            "roic_proxy_pct": roic_proxy,
            "roe_pct": roe,

            # L2
            "short_float_pct": short_pct,
            "analyst_target": analyst_target,
            "analyst_low": analyst_low,
            "analyst_high": analyst_high,
            "analyst_count": analyst_count,
            "upside_to_target_pct": upside_pct,
            "eps_growth_pct": eps_growth,
            "trailing_pe": trailing_pe,
            "forward_pe": forward_pe,
            "peg_ratio": peg,
            "ev_revenue": ev_revenue,
            "ev_ebitda": ev_ebitda,
            "beta": beta,

            # Price context
            "price_52w_high": price_52w_high,
            "price_52w_low": price_52w_low,
            "pct_from_52w_high": round((price - price_52w_high) / price_52w_high * 100, 1) if price_52w_high else 0,

            "fetch_timestamp": datetime.now().isoformat(),
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FAIM ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class FAIMEngine:
    """
    Five-Layer Investment Analysis Model — Core Engine.

    This implements the complete FAIM protocol from first principles.
    Every threshold and guardrail is sourced from the SOP

    Usage:
        engine = FAIMEngine(portfolio_size=10000)
        data = engine.fetch_data("NVDA")
        report = engine.full_analysis(data, sector="ai")
        engine.print_report(report)
    """

    def __init__(self, portfolio_size: float = 10000):
        self.portfolio_size = portfolio_size
        self.fetcher = DataFetcher()

    # ── L0: SECTOR CLASSIFICATION ──────────────────────────────

    def classify_sector(self, data: dict) -> str:
        """
        Auto-classify sector based on industry and manual override.
        Returns sector key: 'ai', 'energy', 'mega_tech'
        """
        industry = (data.get("industry") or "").lower()
        sector = (data.get("sector") or "").lower()
        ticker = data.get("ticker", "").upper()

        # Known tickers
        ai_tickers = {"NVDA", "AMD", "AVGO", "ANET", "SMCI", "MRVL", "TSM"}
        energy_tickers = {"CEG", "VST", "NEE", "FSLR", "ENPH", "PLUG"}
        mega_tickers = {"AAPL", "MSFT", "GOOG", "GOOGL", "META", "AMZN", "TSLA"}

        if ticker in ai_tickers:
            return "ai"
        if ticker in energy_tickers:
            return "energy"
        if ticker in mega_tickers:
            return "mega_tech"

        # Heuristic from industry
        if any(k in industry for k in ["semiconductor", "software", "data", "cloud"]):
            return "ai"
        if any(k in industry for k in ["solar", "wind", "utility", "electric"]):
            return "energy"
        return "mega_tech"  # fallback

    # ── L1: QUALITY GATE ───────────────────────────────────────

    def evaluate_l1(self, data: dict, sector_key: str) -> L1Result:
        """
        Quality Gate — 5 checks, need 4 to pass.

        Checks:
            1. Revenue growth ≥ threshold (sector-specific)
            2. Gross margin ≥ threshold OR GM trend ≥ threshold
            3. ROIC proxy > WACC (~9%)
            4. Balance sheet runway ≥ 18 months
            5. Management / capital allocation ≥ 3/5 (auto-scored)
        """
        thr = SECTOR_THRESHOLDS.get(sector_key, SECTOR_THRESHOLDS["ai"])
        wacc_rough = 9.0  # rough market average

        rev_g = data["rev_growth_pct"]
        gm = data["gross_margin_pct"]
        gm_trend = data.get("gm_trend_bps", 0)
        runway = data["runway_months"]
        roic = data["roic_proxy_pct"]

        # Auto mgmt score heuristic:
        # - Positive FCF = +1
        # - ROIC > 15% = +1
        # - Net cash positive = +1
        # - Revenue growing = +1
        # - Operating margin positive = +1
        mgmt_score = 0
        if data["op_cf"] > 0:
            mgmt_score += 1
        if roic > 15:
            mgmt_score += 1
        if data["net_cash"] > 0:
            mgmt_score += 1
        if rev_g > 0:
            mgmt_score += 1
        if data["op_margin_pct"] > 0:
            mgmt_score += 1

        checks = [
            {
                "name": "Revenue Growth",
                "passed": rev_g >= thr["rev_growth_min"],
                "detail": f"{rev_g}% YoY (min {thr['rev_growth_min']}% for {thr['label']})"
            },
            {
                "name": "Gross Margin / GM Trend",
                "passed": gm >= thr["gross_margin_min"] or gm_trend >= thr["gm_trend_min"],
                "detail": f"GM {gm}% (min {thr['gross_margin_min']}%) | Trend {gm_trend} bps (min {thr['gm_trend_min']})"
            },
            {
                "name": "ROIC vs WACC",
                "passed": roic >= wacc_rough,
                "detail": f"ROIC proxy (ROE) {roic}% vs WACC ~{wacc_rough}% → {'ABOVE' if roic >= wacc_rough else 'BELOW'}"
            },
            {
                "name": "Balance Sheet Runway",
                "passed": runway >= thr["runway_min"] or runway == 999,
                "detail": f"{'Self-funding (positive OCF)' if runway == 999 else f'{runway} months'} (min {thr['runway_min']})"
            },
            {
                "name": "Mgmt / Capital Allocation",
                "passed": mgmt_score >= thr["mgmt_min"],
                "detail": f"Auto-score {mgmt_score}/5 (min {thr['mgmt_min']}): FCF{'✓' if data['op_cf']>0 else '✗'} "
                         f"ROIC{'✓' if roic>15 else '✗'} Cash{'✓' if data['net_cash']>0 else '✗'} "
                         f"Growth{'✓' if rev_g>0 else '✗'} Margin{'✓' if data['op_margin_pct']>0 else '✗'}"
            },
        ]

        passes = sum(1 for c in checks if c["passed"])

        return L1Result(
            passed=passes >= 4,
            checks=checks,
            passes_count=passes,
            sector_profile=thr["label"],
            thresholds_used=thr,
        )

    # ── L2: MISPRICING DETECTOR ────────────────────────────────

    def evaluate_l2(self, data: dict) -> L2Result:
        """
        Mispricing Detector — need ≥10% gap between your view and consensus.

        Uses analyst target price upside as a proxy for consensus growth
        vs actual revenue growth (your view).

        In production: the user would input their own growth estimate.
        For automated screening: we use (rev_growth - consensus implied) as proxy.
        """
        # Proxy: Actual revenue growth as "your view"
        your_growth = data["rev_growth_pct"]

        # Proxy: Forward PE implied growth
        # If forward PE < trailing PE, market expects deceleration
        fwd_pe = data["forward_pe"]
        trail_pe = data["trailing_pe"]

        # Consensus growth estimate proxy: analyst upside to target
        # More generous proxy: earnings growth as consensus
        consensus_growth = data["eps_growth_pct"]
        if consensus_growth == 0:
            # Fallback: use upside to analyst target as consensus proxy
            consensus_growth = data["upside_to_target_pct"]

        implied_growth = 0
        if fwd_pe > 0 and trail_pe > 0:
            implied_growth = round((trail_pe / fwd_pe - 1) * 100, 1)

        gap = round(your_growth - consensus_growth, 1)
        identified = abs(gap) >= 10

        warnings = []
        short = data["short_float_pct"]
        if short > 15:
            warnings.append(f"⚠ High short float {short}% — potential squeeze or fundamental risk")
        elif short < 2:
            warnings.append(f"ℹ Low short float {short}% — possibly crowded long")
        if data["peg_ratio"] > 3:
            warnings.append(f"⚠ PEG {data['peg_ratio']} > 3 — growth heavily priced in")
        if data["beta"] > 1.5:
            warnings.append(f"⚠ Beta {data['beta']} — high systematic risk")

        return L2Result(
            identified=identified,
            gap_pct=gap,
            your_growth=your_growth,
            consensus_growth=consensus_growth,
            implied_growth=implied_growth,
            short_float_pct=short,
            warnings=warnings,
        )

    # ── L3: THESIS CONSTRUCTION ────────────────────────────────

    def build_thesis(
        self,
        data: dict,
        bull_prob: float = 25.0,
        base_prob: float = 50.0,
        bear_prob: float = 25.0,
        bull_target: Optional[float] = None,
        base_target: Optional[float] = None,
        bear_target: Optional[float] = None,
        kill_switch: str = "",
        bear_leaps_loss: float = -80.0,
        delta: float = 0.75,
        premium_per_share: float = 0.0,
    ) -> L3Result:
        """
        Thesis Construction — Bull / Base / Bear scenarios.

        If targets are not provided, auto-generates from analyst data:
            Bull = analyst high target
            Base = analyst mean target
            Bear = analyst low target or -30% from current

        Bear LEAPS loss is fixed at user-specified % (default -80%).
        """
        price = data["price"]

        # Auto-generate targets if not provided
        if bull_target is None:
            bull_target = data["analyst_high"] if data["analyst_high"] > price else price * 1.50
        if base_target is None:
            base_target = data["analyst_target"] if data["analyst_target"] else price * 1.15
        if bear_target is None:
            bear_target = data["analyst_low"] if data["analyst_low"] and data["analyst_low"] < price else price * 0.70

        # Auto kill-switch if not provided
        if not kill_switch:
            gm = data["gross_margin_pct"]
            kill_switch = (
                f"Exit immediately if: (1) Gross margin falls below "
                f"{max(gm - 10, 0):.0f}% in any quarter, OR "
                f"(2) Revenue growth turns negative, OR "
                f"(3) Management announces dilutive acquisition >20% of market cap"
            )

        # Calculate returns
        def stock_return(target):
            return round((target - price) / price * 100, 1) if price else 0

        def leaps_return(target):
            if premium_per_share <= 0:
                return stock_return(target)  # fallback to stock return
            return round((delta * (target - price) / premium_per_share) * 100, 1)

        bull = Scenario(
            label="Bull",
            prob_pct=bull_prob,
            target_price=round(bull_target, 2),
            stock_return_pct=stock_return(bull_target),
            leaps_return_pct=leaps_return(bull_target) if premium_per_share > 0 else 0,
            driver="Revenue acceleration + multiple expansion",
            timeline="12-18 months",
        )
        base = Scenario(
            label="Base",
            prob_pct=base_prob,
            target_price=round(base_target, 2),
            stock_return_pct=stock_return(base_target),
            leaps_return_pct=leaps_return(base_target) if premium_per_share > 0 else 0,
            driver="Consensus growth met, no multiple change",
            timeline="12-18 months",
        )
        bear = Scenario(
            label="Bear",
            prob_pct=bear_prob,
            target_price=round(bear_target, 2),
            stock_return_pct=stock_return(bear_target),
            leaps_return_pct=bear_leaps_loss if premium_per_share > 0 else stock_return(bear_target),
            driver="Growth deceleration + competitive pressure",
            timeline="6-12 months",
        )

        # Weighted EV calculation
        # Use stock returns for EV when no LEAPS parameters provided
        if premium_per_share > 0:
            ev = (bull.prob_pct / 100 * bull.leaps_return_pct +
                  base.prob_pct / 100 * base.leaps_return_pct +
                  bear.prob_pct / 100 * bear.leaps_return_pct)
        else:
            ev = (bull.prob_pct / 100 * bull.stock_return_pct +
                  base.prob_pct / 100 * base.stock_return_pct +
                  bear.prob_pct / 100 * bear.stock_return_pct)

        ev = round(ev, 1)

        # EV/Risk ratio
        bear_return = bear.leaps_return_pct if premium_per_share > 0 else bear.stock_return_pct
        ev_risk = round(ev / abs(bear_return), 2) if bear_return != 0 else 0

        prob_sum = bull.prob_pct + base.prob_pct + bear.prob_pct
        prob_valid = abs(prob_sum - 100) < 1

        warnings = []
        if not prob_valid:
            warnings.append(f"⚠ Probabilities sum to {prob_sum}%, must be 100%")
        if bull.prob_pct > BULL_PROB_HARD_CAP:
            warnings.append(
                f"🚨 Bull probability {bull.prob_pct}% exceeds hard cap {BULL_PROB_HARD_CAP}%. "
                f"This is almost certainly overconfidence. (Kahneman/Tetlock research)")
        elif bull.prob_pct > BULL_PROB_SOFT_CAP:
            warnings.append(
                f"⚠ Bull probability {bull.prob_pct}% > SOP cap of {BULL_PROB_SOFT_CAP}%. "
                f"Review: is this conviction or motivated reasoning?")

        return L3Result(
            kill_switch=kill_switch,
            bull=bull,
            base=base,
            bear=bear,
            weighted_ev_pct=ev,
            ev_risk_ratio=ev_risk,
            prob_sum_valid=prob_valid,
            warnings=warnings,
        )

    # ── L4: POSITION SIZING ───────────────────────────────────

    def size_position(self, l3: L3Result, has_catalyst: bool = True) -> L4Result:
        """
        Position Sizing — maps EV/Risk to conviction tier and allocation.

        Decision tree:
            Q1: Clear 12-24mo catalyst? → YES = LEAPS possible, NO = Stock only
            Q2: Conviction tier from EV/Risk ratio
            Q3: Allocation % of portfolio
        """
        ratio = l3.ev_risk_ratio
        ev = l3.weighted_ev_pct

        # Find conviction tier
        tier_data = CONVICTION_TIERS[-1]  # default LOW
        for t in CONVICTION_TIERS:
            if ratio >= t["min_ratio"]:
                tier_data = t
                break

        instrument = "LEAPS" if has_catalyst else "Stock"
        alloc = tier_data["alloc_pct"]

        warnings = []
        if ev < 0:
            warnings.append(f"⚠ Negative weighted EV ({ev}%). Do not enter. Re-examine thesis.")
            alloc = 0
        if ev < 20 and alloc > 0:
            warnings.append(f"ℹ EV {ev}% below the +20% minimum threshold for entry.")
            # Still allow WATCHLIST, but note it

        return L4Result(
            conviction_tier=tier_data["tier"],
            alloc_pct=alloc,
            alloc_usd=round(self.portfolio_size * alloc / 100),
            instrument=instrument,
            ev_pct=ev,
            ev_risk_ratio=ratio,
            warnings=warnings,
        )

    # ── VERDICT ────────────────────────────────────────────────

    def render_verdict(self, l1: L1Result, l2: L2Result, l3: L3Result, l4: L4Result) -> str:
        """Determine final action: ENTER / WATCHLIST / AVOID."""
        if l1.passed and l2.identified and l3.weighted_ev_pct > 20 and l4.conviction_tier != "LOW":
            return "ENTER"
        elif l1.passed and l3.weighted_ev_pct > 0:
            return "WATCHLIST"
        else:
            return "AVOID"

    # ── FULL ANALYSIS ──────────────────────────────────────────

    def fetch_data(self, ticker: str) -> dict:
        """Fetch market data for a ticker."""
        return self.fetcher.fetch(ticker)

    def full_analysis(
        self,
        data: dict,
        sector: Optional[str] = None,
        bull_prob: float = 25.0,
        base_prob: float = 50.0,
        bear_prob: float = 25.0,
        bull_target: Optional[float] = None,
        base_target: Optional[float] = None,
        bear_target: Optional[float] = None,
        kill_switch: str = "",
        has_catalyst: bool = True,
        delta: float = 0.75,
        premium_per_share: float = 0.0,
    ) -> Verdict:
        """
        Run the complete 5-layer protocol on fetched data.

        Parameters:
            data: dict from fetch_data()
            sector: 'ai', 'energy', or 'mega_tech' (auto-detected if None)
            bull/base/bear_prob: scenario probabilities (must sum to 100)
            bull/base/bear_target: price targets (auto-generated if None)
            kill_switch: exit condition string
            has_catalyst: if False, instrument = Stock instead of LEAPS
            delta: LEAPS delta (0-1)
            premium_per_share: LEAPS premium ($). If 0, uses stock returns.
        """
        sector_key = sector or self.classify_sector(data)
        l1 = self.evaluate_l1(data, sector_key)
        l2 = self.evaluate_l2(data)
        l3 = self.build_thesis(
            data,
            bull_prob=bull_prob, base_prob=base_prob, bear_prob=bear_prob,
            bull_target=bull_target, base_target=base_target, bear_target=bear_target,
            kill_switch=kill_switch,
            delta=delta, premium_per_share=premium_per_share,
        )
        l4 = self.size_position(l3, has_catalyst=has_catalyst)
        action = self.render_verdict(l1, l2, l3, l4)

        reason_map = {
            "ENTER": f"L1 PASS, L2 edge identified ({l2.gap_pct:+.1f}%), EV {l3.weighted_ev_pct:+.1f}%, "
                     f"conviction {l4.conviction_tier}",
            "WATCHLIST": f"L1 {'PASS' if l1.passed else 'FAIL'}, EV {l3.weighted_ev_pct:+.1f}%. "
                        f"Wait for clearer catalyst or wider mispricing.",
            "AVOID": f"L1 {'PASS' if l1.passed else 'FAIL'} ({l1.passes_count}/5), "
                    f"EV {l3.weighted_ev_pct:+.1f}%. Insufficient edge.",
        }

        return Verdict(
            action=action,
            reason=reason_map[action],
            ticker=data["ticker"],
            price=data["price"],
            date=datetime.now().strftime("%Y-%m-%d"),
            l1=l1,
            l2=l2,
            l3=l3,
            l4=l4,
            sector=SECTOR_THRESHOLDS.get(sector_key, {}).get("label", sector_key),
        )

    # ── REPORT GENERATION ──────────────────────────────────────

    def generate_report(self, v: Verdict) -> str:
        """Generate a professional text report from a Verdict."""
        sep = "═" * 64
        thin = "─" * 64

        lines = [
            "",
            sep,
            f"  FAIM v{MODEL_VERSION} — Analysis Report",
            f"  {v.ticker} · {v.date}",
            sep,
            "",
            f"  ┌─ VERDICT: [{v.action}] {'─' * max(0, 40 - len(v.action))}┐",
            f"  │  {v.reason[:58]}",
            f"  └{'─' * 58}┘",
            "",
            f"  Ticker     : {v.ticker}",
            f"  Price      : ${v.price}",
            f"  Sector     : {v.sector}",
            f"  Date       : {v.date}",
            f"  Model      : FAIM v{v.model_version}",
            "",
            thin,
            f"  L1 — QUALITY GATE: {'PASS ✓' if v.l1.passed else 'FAIL ✗'}  ({v.l1.passes_count}/{v.l1.total_checks})",
            f"  Sector Profile: {v.l1.sector_profile}",
            thin,
        ]

        for c in v.l1.checks:
            icon = "✓" if c["passed"] else "✗"
            lines.append(f"    [{icon}] {c['name']}: {c['detail']}")

        lines += [
            "",
            thin,
            f"  L2 — MISPRICING: {'IDENTIFIED ✓' if v.l2.identified else 'NOT FOUND ✗'}  (gap = {v.l2.gap_pct:+.1f}%)",
            thin,
            f"    Your growth view  : {v.l2.your_growth}%",
            f"    Consensus growth  : {v.l2.consensus_growth}%",
            f"    Gap               : {v.l2.gap_pct:+.1f}% {'≥ 10% ✓' if v.l2.identified else '< 10% ✗'}",
            f"    Implied growth    : {v.l2.implied_growth}%",
            f"    Short float       : {v.l2.short_float_pct}%",
        ]
        for w in v.l2.warnings:
            lines.append(f"    {w}")

        lines += [
            "",
            thin,
            f"  L3 — THESIS CONSTRUCTION",
            thin,
            f"    Kill Switch: {v.l3.kill_switch[:70]}",
            "",
            f"    {'Scenario':<10} {'Prob':>6} {'Target':>9} {'Stock':>8} {'LEAPS':>8}",
            f"    {'─'*10} {'─'*6} {'─'*9} {'─'*8} {'─'*8}",
        ]
        for s in [v.l3.bull, v.l3.base, v.l3.bear]:
            lines.append(
                f"    {s.label:<10} {s.prob_pct:>5.0f}% ${s.target_price:>7.2f} "
                f"{s.stock_return_pct:>+7.1f}% {s.leaps_return_pct:>+7.1f}%"
            )
        lines += [
            "",
            f"    Weighted EV      : {v.l3.weighted_ev_pct:+.1f}%",
            f"    EV/Risk Ratio    : {v.l3.ev_risk_ratio:.2f}×",
            f"    Prob Sum Valid    : {'Yes ✓' if v.l3.prob_sum_valid else 'No ✗'}",
        ]
        for w in v.l3.warnings:
            lines.append(f"    {w}")

        lines += [
            "",
            thin,
            f"  L4 — POSITION SIZING",
            thin,
            f"    Conviction       : {v.l4.conviction_tier}",
            f"    Instrument       : {v.l4.instrument}",
            f"    Allocation       : {v.l4.alloc_pct}% (${v.l4.alloc_usd:,})",
            f"    Portfolio Size   : ${self.portfolio_size:,.0f}",
        ]
        for w in v.l4.warnings:
            lines.append(f"    {w}")

        # Summary box
        action_emoji = {"ENTER": "★", "WATCHLIST": "◎", "AVOID": "✗"}
        lines += [
            "",
            sep,
            f"  [{action_emoji.get(v.action, '?')}] FINAL: {v.action} — {v.reason[:55]}",
            sep,
            "",
            "  Source: Yahoo Finance (yfinance). Verify with 10-K / 10-Q.",
            f"  FAIM v{MODEL_VERSION} · {v.date}",
            "",
        ]

        return "\n".join(lines)

    def print_report(self, v: Verdict):
        """Print the formatted report to stdout."""
        print(self.generate_report(v))

    def save_report(self, v: Verdict, path: str):
        """Save report as markdown file."""
        report_md = self._generate_report_md(v)
        with open(path, "w", encoding="utf-8") as f:
            f.write(report_md)

    def _generate_report_md(self, v: Verdict) -> str:
        """Generate markdown version of the report."""
        action_emoji = {"ENTER": "🟢", "WATCHLIST": "🟡", "AVOID": "🔴"}

        lines = [
            f"# FAIM Analysis: {v.ticker}",
            "",
            f"> **{action_emoji.get(v.action, '⚪')} VERDICT: {v.action}**",
            f"> {v.reason}",
            "",
            f"| Field | Value |",
            f"|-------|-------|",
            f"| Ticker | {v.ticker} |",
            f"| Price | ${v.price} |",
            f"| Sector Profile | {v.sector} |",
            f"| Date | {v.date} |",
            f"| Model Version | FAIM v{v.model_version} |",
            "",
            f"---",
            "",
            f"## L1 — Quality Gate: {'PASS ✓' if v.l1.passed else 'FAIL ✗'} ({v.l1.passes_count}/{v.l1.total_checks})",
            f"",
            f"*Sector profile: {v.l1.sector_profile}*",
            "",
            f"| Check | Result | Detail |",
            f"|-------|--------|--------|",
        ]
        for c in v.l1.checks:
            icon = "✅" if c["passed"] else "❌"
            lines.append(f"| {c['name']} | {icon} | {c['detail']} |")

        lines += [
            "",
            f"---",
            "",
            f"## L2 — Mispricing: {'IDENTIFIED ✓' if v.l2.identified else 'NOT FOUND ✗'} (gap = {v.l2.gap_pct:+.1f}%)",
            "",
            f"| Metric | Value |",
            f"|--------|-------|",
            f"| Your growth view | {v.l2.your_growth}% |",
            f"| Consensus growth | {v.l2.consensus_growth}% |",
            f"| Gap (your - consensus) | {v.l2.gap_pct:+.1f}% |",
            f"| Short float | {v.l2.short_float_pct}% |",
        ]
        for w in v.l2.warnings:
            lines.append(f"\n> {w}")

        lines += [
            "",
            f"---",
            "",
            f"## L3 — Thesis Construction",
            "",
            f"**Kill Switch:** {v.l3.kill_switch}",
            "",
            f"| Scenario | Prob | Target | Stock Return | LEAPS Return |",
            f"|----------|------|--------|-------------|-------------|",
        ]
        for s in [v.l3.bull, v.l3.base, v.l3.bear]:
            lines.append(
                f"| {s.label} | {s.prob_pct:.0f}% | ${s.target_price:.2f} | "
                f"{s.stock_return_pct:+.1f}% | {s.leaps_return_pct:+.1f}% |"
            )
        lines += [
            "",
            f"- **Weighted EV:** {v.l3.weighted_ev_pct:+.1f}%",
            f"- **EV/Risk Ratio:** {v.l3.ev_risk_ratio:.2f}×",
        ]
        for w in v.l3.warnings:
            lines.append(f"\n> ⚠️ {w}")

        lines += [
            "",
            f"---",
            "",
            f"## L4 — Position Sizing",
            "",
            f"| Field | Value |",
            f"|-------|-------|",
            f"| Conviction | **{v.l4.conviction_tier}** |",
            f"| Instrument | {v.l4.instrument} |",
            f"| Allocation | {v.l4.alloc_pct}% (${v.l4.alloc_usd:,}) |",
        ]

        lines += [
            "",
            "---",
            "",
            f"*FAIM v{v.model_version} · Source: Yahoo Finance · Verify with official filings*",
            "",
        ]
        return "\n".join(lines)
