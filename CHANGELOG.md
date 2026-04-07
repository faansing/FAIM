# Changelog

All notable changes to FAIM are documented here.  
Format: [Semantic Versioning](https://semver.org/) · Date: YYYY-MM-DD

---

## [1.1.0] — 2026-04-06

### Fixed
- **F1 (Critical)** — L1 Quality Gate now uses sector-calibrated thresholds.
  Energy Transition sector: RevGrowth >5%, GrossMargin >20%, GMTrend >50bps.
  Previously, hardcoded AI Infra thresholds (RevGrowth >15%, GM >40%) would
  incorrectly FAIL every utility/energy stock (CEG, VST, NEE, etc.).
- **F2** — Constants consolidated: `CAL_CLOSED_MIN` and `MODEL_VERSION` moved to
  `core.js` as single source of truth.
- **F3** — Bull probability guardrail: soft warning toast when bull scenario
  probability exceeds 40% (SOP guidance) or 65% (hard overconfidence flag).
  Based on Kahneman/Tetlock calibration research.
- **F4** — L2 Edge Type structured picker added. Six categories force a
  falsifiable edge hypothesis before proceeding: Channel/Supply, Wrong Metric,
  Conservative Guidance, Historical Analog, Structural Shift, Other.
  Validation blocks progression if no Edge Type is selected.
- **F5** — IV/Theta warning in L4: if user selects "High IV" in Q2, a red
  alert banner explains IV crush risk (30–40% loss even on correct direction).
- **F6** — Live correlation check in L4: computes combined portfolio % exposure
  for open same-sector positions. Warns (yellow) above 0%, alerts (red) at ≥8%
  per SOP §5 maximum correlated position size.
- **F7** — Cards now store `sectorFit`, `l2EdgeType`, and `modelSnapshot`
  (version + active thresholds). Essential for calibration segmentation and
  audit trail when thresholds change after calibration cycles.
- **F8** — "Exit Rules Followed?" field added to trade card close form.
  Options: Fully / Partially / Deviated. Feeds L5 calibration score.
- **F9** — Calibration layer weakness scores rewritten with transparent,
  self-documenting formulas. Removed unexplained `* 80` multiplier.
  L5 score now uses `exitDiscipline` field instead of timing proxy.
- **F10 (XSS)** — `htmlEscape()` utility added to `core.js`. User-supplied
  text sanitized before insertion into `innerHTML`.

### Added
- `getL1Thresholds(sector)` in `core.js` — centralized, sector-aware threshold
  lookup. Used by both `evaluateL1()` and the L1 wizard step UI hints.
- `getModelSnapshot()` in `core.js` — saves active threshold configuration
  with each logged trade card for historical audit trail.
- `sectorFit` default in `collect()` step 0 — fixes bug where user who never
  clicked the sector toggle would have `undefined` sectorFit.
- L1 step now shows active sector thresholds in the UI (dynamic hints).
- Calibration locked screen now shows two progress rings: Total Cards + Closed.
- `⎘ Backup` button in Trade Cards tab shows localStorage export snippet.
- Layer weakness radar now shows human-readable label under each L1–L5 score.
- CSV export now includes `sectorFit`, `l2EdgeType`, and `exitDiscipline`.

### Repository
- Added `LICENSE` (MIT)
- Added `.gitignore` (Python, macOS, IDE)
- Added `requirements.txt` (`yfinance>=0.2.0`, `pandas>=2.0.0`)
- Fixed placeholder `YOUR_USERNAME` in README

---

## [1.0.0] — 2026-04-06

### Added
- Initial release of FAIM (Fine Art Investment Model)
- 5-layer decision protocol wizard (Setup → L1 → L2 → L3 → L4 → L5 → Summary)
- Weighted EV calculator with Bull / Base / Bear scenarios
- Instrument decision tree (LEAPS vs Stock, Q1–Q5)
- Trade card logging with exit reflection fields
- Calibration dashboard (unlocks at 15 total + 10 closed cards — SOP §6.1)
- localStorage persistence + CSV export + localStorage JSON backup
- `data_fetch.py` Python helper for L1/L2 data pre-fill via Yahoo Finance
- `SOP.md` full Standard Operating Procedure (Chinese/English bilingual)
- Offline-first, zero-dependency web application

---

*FAIM follows [Semantic Versioning](https://semver.org/):*  
*MAJOR = breaking change to 5-layer framework · MINOR = new feature · PATCH = bug fix*
