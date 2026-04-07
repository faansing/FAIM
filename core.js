/* ================================================================
   FAIM v1.0 — core.js
   State, Navigation, Toast, Modal, Settings, Math Utilities
   ================================================================ */
'use strict';

const STORAGE_KEY    = 'faim_v1';
const CAL_THRESHOLD  = 15;
const CAL_CLOSED_MIN = 10;   // SOP §6.1: min Closed cards to unlock Calibration
const MODEL_VERSION  = '1.0';

// ── STATE ─────────────────────────────────────────────────────────
const State = {
  cards: [],
  settings: { portfolioSize: 10000 },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      this.cards    = d.cards    || [];
      this.settings = Object.assign({ portfolioSize: 10000 }, d.settings || {});
    } catch(e) { console.warn('State.load error', e); }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cards: this.cards, settings: this.settings
    }));
  },

  addCard(card)        { this.cards.push(card); this.save(); },
  deleteCard(id)       { this.cards = this.cards.filter(c => c.id !== id); this.save(); },
  updateCard(id, upd)  {
    const i = this.cards.findIndex(c => c.id === id);
    if (i >= 0) { this.cards[i] = Object.assign({}, this.cards[i], upd); this.save(); }
  }
};

// ── NAVIGATION ────────────────────────────────────────────────────
function navigate(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + tabId);
  if (tab) tab.style.display = 'block';
  const btn = document.getElementById('nav-' + tabId);
  if (btn) btn.classList.add('active');
  if (tabId === 'cards')       Cards.render();
  if (tabId === 'calibration') Calibration.render();
  updateCardsCount();
}

function updateCardsCount() {
  const b = document.getElementById('cards-count');
  if (b) b.textContent = State.cards.length || '';
}

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg, type) {
  type = type || 'info';
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span class="toast-dot"></span>' + msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── MODAL ─────────────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

// ── SETTINGS ──────────────────────────────────────────────────────
function openSettings() {
  openModal(
    '<div class="modal-header">' +
      '<span class="modal-title" id="modal-title">Settings</span>' +
      '<button class="modal-close" onclick="closeModal()">×</button>' +
    '</div>' +
    '<div class="modal-body">' +
      '<div class="form-group">' +
        '<label class="form-label">Virtual Portfolio Size ($)</label>' +
        '<div class="input-wrap">' +
          '<input class="form-input" id="set-portfolio" type="number" value="' + State.settings.portfolioSize + '" min="1000" step="1000">' +
          '<span class="input-suffix">USD</span>' +
        '</div>' +
        '<span class="form-hint">All position-sizing calculations use this as 100%.</span>' +
      '</div>' +
    '</div>' +
    '<div class="modal-footer">' +
      '<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary btn-sm" onclick="saveSettings()">Save</button>' +
    '</div>'
  );
}

function saveSettings() {
  const v = parseFloat(document.getElementById('set-portfolio').value);
  if (!v || v < 100) { toast('Enter a valid portfolio size', 'error'); return; }
  State.settings.portfolioSize = v;
  State.save();
  closeModal();
  toast('Settings saved', 'success');
}

// ── MATH UTILITIES ────────────────────────────────────────────────
function genId() { return 'TC' + Date.now().toString(36).toUpperCase(); }

// Escape user-supplied strings before inserting into innerHTML (XSS prevention)
function htmlEscape(str) {
  return String(str == null ? '—' : str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── SECTOR-CALIBRATED L1 THRESHOLDS (SOP §2.2) ───────────────────
// AI Infrastructure: high-growth software/hardware benchmarks
// Energy Transition: utility/regulated-energy benchmarks (lower growth, lower margin)
function getL1Thresholds(sector) {
  if (sector === 'Energy Transition') {
    return { revGrowth: 5, grossMargin: 20, gmTrend: 50, runway: 18 };
  }
  // Default covers AI Infrastructure, Both, Adjacent
  return { revGrowth: 15, grossMargin: 40, gmTrend: 200, runway: 18 };
}

function calcLeapsReturn(currentPrice, targetPrice, delta, premium) {
  if (!premium || premium <= 0) return 0;
  return Math.round((delta * (targetPrice - currentPrice) / premium) * 100);
}

function calcWeightedEV(bull, base, bear) {
  return (bull.p / 100 * bull.r) + (base.p / 100 * base.r) + (bear.p / 100 * bear.r);
}

function getEVRatio(ev, bearReturn) {
  if (!bearReturn || bearReturn === 0) return 0;
  return ev / Math.abs(bearReturn);
}

function getConvictionTier(evRatio) {
  if (evRatio > 2.5) return { tier: 'HIGH',   cls: 'high',   range: '5–8%',  note: 'EV > 2.5× downside — max 5% per position, stage 50/50.' };
  if (evRatio > 1.5) return { tier: 'MEDIUM', cls: 'medium', range: '2–4%',  note: 'EV 1.5–2.5× — stage entry: 50% now, 50% on next data point.' };
  return               { tier: 'LOW',    cls: 'low',    range: '0%',   note: 'EV < 1.5× — watchlist only. No position.' };
}

function evaluateL1(d) {
  const thr     = getL1Thresholds(d.sectorFit);
  const revOk   = +d.l1RevGrowth   >= thr.revGrowth;
  const gmOk    = +d.l1GrossMargin >= thr.grossMargin;
  const trendOk = +d.l1GMTrend     >= thr.gmTrend;
  const bsOk    = +d.l1Runway      >= thr.runway;
  const mgmtOk  = +d.l1Mgmt        >= 3;
  const roicOk  = d.l1ROIC !== 'no';
  const checks  = [
    { ok: revOk,           text: 'Rev growth '   + d.l1RevGrowth   + '% YoY (min ' + thr.revGrowth   + '%)' },
    { ok: gmOk || trendOk, text: 'Gross margin '  + d.l1GrossMargin + '% | trend +' + d.l1GMTrend + ' bps/yr (min ' + thr.grossMargin + '% or +' + thr.gmTrend + ' bps)' },
    { ok: roicOk,          text: 'ROIC vs WACC: ' + (d.l1ROIC === 'yes' ? 'Above' : d.l1ROIC === 'path' ? 'Credible 24mo path' : 'Below') },
    { ok: bsOk,            text: 'Runway: '       + d.l1Runway      + ' months (min ' + thr.runway + ')' },
    { ok: mgmtOk,          text: 'Mgmt score: '   + d.l1Mgmt        + '/5 (min 3)' }
  ];
  const passes = checks.filter(c => c.ok).length;
  return { result: passes >= 4 ? 'PASS' : 'FAIL', checks, passes, total: 5, thresholds: thr };
}

function evaluateL2(d) {
  const gap = +(d.l2YourGrowth || 0) - +(d.l2ConsensusGrowth || 0);
  return { result: Math.abs(gap) >= 10 ? 'IDENTIFIED' : 'NOT FOUND', gap: gap.toFixed(1), found: Math.abs(gap) >= 10 };
}

// Save a snapshot of the active model thresholds at time of card logging.
// When thresholds change after a calibration cycle, historical cards retain
// the rules they were evaluated under — essential for audit trail.
function getModelSnapshot() {
  const ai  = getL1Thresholds('AI Infrastructure');
  const en  = getL1Thresholds('Energy Transition');
  return {
    version : MODEL_VERSION,
    asOf    : new Date().toISOString().slice(0, 10),
    l1_ai   : { revGrowth: ai.revGrowth, grossMargin: ai.grossMargin, gmTrend: ai.gmTrend },
    l1_en   : { revGrowth: en.revGrowth, grossMargin: en.grossMargin, gmTrend: en.gmTrend },
    l2GapMin: 10,
    calCards : CAL_THRESHOLD,
    calClosed: CAL_CLOSED_MIN
  };
}

// ── TOGGLE GROUPS ─────────────────────────────────────────────────
function attachToggleGroups(root) {
  (root || document).querySelectorAll('[data-group]').forEach(btn => {
    btn.addEventListener('click', function() {
      const grp = this.dataset.group;
      const colorClass = this.dataset.color || '';
      document.querySelectorAll('[data-group="' + grp + '"]').forEach(b => {
        b.classList.remove('active','success','danger','warn');
      });
      this.classList.add('active');
      if (colorClass) this.classList.add(colorClass);
      // Update data
      Wizard.data[grp] = this.dataset.val;
      if (grp === 'q1CatalystRaw') Wizard.data.q1Catalyst = (this.dataset.val === 'yes');
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  State.load();

  // Nav click handlers
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.tab));
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', openSettings);

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Kick off wizard
  Wizard.init();
  updateCardsCount();
});
