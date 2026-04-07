# Changelog

All notable changes to FAIM are documented here.
Format: [Semantic Versioning](https://semver.org/) · Date: YYYY-MM-DD

---

## [2.0.0] — 2026-04-06

### Added — Python Analysis Stack
- **`faim_engine.py`** — Complete 5-layer Python analysis engine with:
  - `DataFetcher` class: fetches real-time data from Yahoo Finance via yfinance
  - `FAIMEngine` class: L0-L5 protocol implementation
  - Structured data classes: `L1Result`, `L2Result`, `L3Result`, `L4Result`, `Verdict`
  - Report generation (console + markdown)
  - Auto management scoring (5-dimension heuristic: FCF, ROIC, Cash, Growth, Margin)
  - Auto GM trend calculation from quarterly financials
- **`analyze.py`** — Multi-ticker analysis runner with:
  - Pre-configured thesis for NVDA, TSLA, AAPL
  - `--compare` flag for side-by-side comparison table
  - `--report` flag for markdown report generation
  - `--portfolio` flag for custom portfolio size
- **`reports/`** — Auto-generated analysis reports (NVDA, TSLA, AAPL)

### Added — Mega-Cap Tech Sector
- New sector profile: "Mega-Cap Tech (AAPL/MSFT/GOOG class)"
  - Rev Growth > 5%, Gross Margin > 35%, GM Trend > 50 bps, Runway > 24 months
  - Covers AAPL, MSFT, GOOG, META, AMZN, TSLA
- `faim_engine.py` auto-classifies sector from ticker or industry

### Changed
- **SOP.md** — Completely rewritten in English. Professional buy-side quality.
  Python-first workflow. Sector-aware thresholds table. FAQ updated.
- **README.md** — Rewritten for Python-first workflow. Sample output included.
- **data_fetch.py** — All comments in English. Sector-aware thresholds.
  Added `--sector` CLI flag (ai/energy).
- **requirements.txt** — Updated with specific version pins

### Fixed
- XSS: `htmlEscape()` now applied to all user-supplied text in wizard.js + cards.js
- Sector thresholds: data_fetch.py now matches core.js thresholds per sector

### Internal
- Created `内部文档/` folder (gitignored) with:
  - `使用说明.md` — Chinese usage guide
  - `审查笔记.md` — Chinese logic audit note

---

## [1.1.0] — 2026-04-06

### Fixed
- **F1 (Critical)** — L1 Quality Gate now uses sector-calibrated thresholds.
  Energy Transition sector: RevGrowth >5%, GrossMargin >20%, GMTrend >50bps.
- **F2** — Constants consolidated in `core.js`.
- **F3** — Bull probability guardrail (Kahneman/Tetlock research).
- **F4** — L2 Edge Type structured picker (6 categories).
- **F5** — IV/Theta warning in L4.
- **F6** — Live correlation check in L4.
- **F7** — Cards store `sectorFit`, `l2EdgeType`, `modelSnapshot`.
- **F8** — "Exit Rules Followed?" field for L5 calibration.
- **F9** — Calibration layer scores use transparent formulas.
- **F10** — `htmlEscape()` XSS prevention.

### Added
- Sector-aware L1 thresholds, model snapshot, calibration progress rings.

---

## [1.0.0] — 2026-04-06

### Added
- Initial release of FAIM (Fine Art Investment Model)
- 5-layer decision protocol wizard
- Trade card logging with exit reflection
- Calibration dashboard (15 total + 10 closed)
- localStorage persistence + CSV export
- `data_fetch.py` Python helper
- Offline-first web application

---

*FAIM follows [Semantic Versioning](https://semver.org/):*
*MAJOR = breaking change to framework · MINOR = new feature · PATCH = bug fix*
