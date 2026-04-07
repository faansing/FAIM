/* ================================================================
   FAIM v1.0 — cards.js
   Trade Cards Tab + Calibration Tab
   SOP alignment: Section 5.3 (backup), Section 6.1 (cal trigger)
   CAL_CLOSED_MIN and MODEL_VERSION are defined in core.js
   ================================================================ */
'use strict';

// ── TRADE CARDS ───────────────────────────────────────────────────
const Cards = {

  render() {
    const el = document.getElementById('cards-content');
    const cards = State.cards;
    const n = cards.length, thresh = CAL_THRESHOLD;
    const closedCards = cards.filter(c => c.status === 'closed_win' || c.status === 'closed_loss');
    const nClosed = closedCards.length;
    const calUnlocked = n >= thresh && nClosed >= CAL_CLOSED_MIN;
    const fillPct = Math.min((n / thresh) * 100, 100);
    const closedPct = Math.min((nClosed / CAL_CLOSED_MIN) * 100, 100);
    const backupSnippet = "copy(localStorage.getItem('faim_v1'))";

    const header =
      '<div class="cards-header">' +
        '<div class="ch-left">' +
          '<h2>Trade Cards</h2>' +
          '<p>Paper trade log · ' + n + ' total · ' + nClosed + ' closed</p>' +
        '</div>' +
        '<div class="ch-right">' +
          '<div class="progress-pill" title="' + thresh + ' total + ' + CAL_CLOSED_MIN + ' closed needed">' +
            '<div class="pp-bar-wrap"><div class="pp-bar-fill" style="width:' + fillPct + '%"></div></div>' +
            '<span class="pp-text' + (calUnlocked ? ' pp-done' : '') + '">' + n + ' / ' + thresh + (n >= thresh ? ' ✓' : '') + '</span>' +
            '<div class="pp-bar-wrap" style="margin-left:4px"><div class="pp-bar-fill" style="width:' + closedPct + '%;background:var(--c-green)"></div></div>' +
            '<span class="pp-text' + (nClosed >= CAL_CLOSED_MIN ? ' pp-done' : '') + '">' + nClosed + ' closed / ' + CAL_CLOSED_MIN + (nClosed >= CAL_CLOSED_MIN ? ' ✓' : '') + '</span>' +
          '</div>' +
          (n > 0 ? '<button class="btn btn-ghost btn-sm" onclick="Cards.exportCSV()" title="Export all cards to CSV">↓ CSV</button>' : '') +
          (n > 0 ? '<button class="btn btn-ghost btn-sm" onclick="Cards.showBackup()" title="Copy localStorage JSON">⎘ Backup</button>' : '') +
        '</div>' +
      '</div>';

    if (n === 0) {
      el.innerHTML = header +
        '<div class="cards-grid">' +
          '<div class="empty-state">' +
            '<div class="es-icon">◫</div>' +
            '<h3>No trade cards yet</h3>' +
            '<p>Complete the 5-Layer Analysis and click "Log Trade Card"<br>to start building your paper trade record.</p>' +
          '</div>' +
        '</div>';
      return;
    }

    const cardsHtml = cards.slice().reverse().map(c => this.renderCard(c)).join('');
    el.innerHTML = header + '<div class="cards-grid">' + cardsHtml + '</div>';
  },

  renderCard(c) {
    const statusMap = {
      open: ['sb-open', 'Open'],
      closed_win:  ['sb-win',  'Closed ✓'],
      closed_loss: ['sb-loss', 'Closed —'],
      rolled:      ['sb-roll', 'Rolled']
    };
    const borderMap = {
      open: 'status-open',
      closed_win: 'status-closed-win',
      closed_loss: 'status-closed-loss',
      rolled: 'status-rolled'
    };
    const [sbCls, sbTxt] = statusMap[c.status] || ['sb-open','Open'];
    const evCol = c.ev > 20 ? 'var(--c-green)' : c.ev > 0 ? 'var(--c-gold)' : 'var(--c-red)';

    return '<div class="tc-card ' + (borderMap[c.status]||'status-open') + '" id="card-' + c.id + '">' +
      '<div class="tc-summary" onclick="Cards.toggleExpand(\'' + c.id + '\')">' +
        '<div class="tc-ticker-block">' +
          '<div class="tc-ticker">' + htmlEscape(c.ticker) + '</div>' +
          '<div class="tc-instrument">' + c.instrument + '</div>' +
        '</div>' +
        '<div class="tc-meta">' +
          '<span class="tc-meta-item"><strong>$' + (c.entryPrice||'—') + '</strong> entry</span>' +
          (c.strike ? '<span class="tc-meta-item">Strike <strong>$' + c.strike + '</strong></span>' : '') +
          (c.expiry  ? '<span class="tc-meta-item">Exp <strong>' + c.expiry + '</strong></span>' : '') +
          '<span class="tc-meta-item">EV <strong style="color:' + evCol + '">' + (c.ev > 0 ? '+' : '') + c.ev + '%</strong></span>' +
          '<span class="tc-meta-item">Size <strong>' + c.positionPct + '%</strong> ($' + (c.positionDollars||0).toLocaleString() + ')</span>' +
          (c.returnPct !== null ? '<span class="tc-meta-item">Return <strong style="color:' + (c.returnPct >= 0 ? 'var(--c-green)' : 'var(--c-red)') + '">' + (c.returnPct >= 0 ? '+' : '') + c.returnPct + '%</strong></span>' : '') +
          '<span class="tc-meta-item">' + c.entryDate + '</span>' +
        '</div>' +
        '<span class="tc-status-badge ' + sbCls + '">' + sbTxt + '</span>' +
        '<button class="tc-expand-btn" aria-label="Expand card">▾</button>' +
      '</div>' +
      '<div class="tc-detail" id="detail-' + c.id + '">' +
        this.renderDetail(c) +
      '</div>' +
    '</div>';
  },

  renderDetail(c) {
    const row = (k, v) => '<div class="tcf-row"><span class="tcf-key">' + k + ':</span><span class="tcf-val">' + (v || '—') + '</span></div>';
    const cps = (c.checkpoints || []).map((cp, i) => cp.event ? (i+1) + '. ' + (cp.date||'') + ' · ' + cp.event : null).filter(Boolean).join(' | ') || '—';

    const cardHtml =
      '<div class="tc-full-card">' +
        row('Ticker', htmlEscape(c.ticker) + (c.company ? ' · ' + htmlEscape(c.company) : '')) +
        row('Entry Date', c.entryDate) +
        row('Instrument', c.instrument) +
        row('Entry Price', '$' + c.entryPrice) +
        (c.strike  ? row('Strike / Delta', '$' + c.strike + (c.delta ? ' · δ ' + c.delta : '')) : '') +
        (c.premium ? row('Premium / Share', '$' + c.premium) : '') +
        (c.expiry  ? row('Expiry', c.expiry) : '') +
        row('Position', c.positionPct + '% ($' + (c.positionDollars||0).toLocaleString() + ')') +
        row('EV at Entry', (c.ev > 0 ? '+' : '') + c.ev + '%') +
        row('Conviction', c.convictionTier) +
        row('Thesis', htmlEscape(c.thesis)) +
        row('Kill Switch', htmlEscape(c.killSwitch)) +
        row('Checkpoints', cps) +
        row('What Would Change My Mind', htmlEscape(c.wcmm)) +
        (c.exitDate   ? row('Exit Date', c.exitDate)   : '') +
        (c.exitPrice  ? row('Exit Price', '$' + c.exitPrice) : '') +
        (c.returnPct  !== null && c.returnPct !== undefined ? row('Return', (c.returnPct >= 0 ? '+' : '') + c.returnPct + '%') : '') +
        (c.thesisRight ? row('Thesis Right?', c.thesisRight) : '') +
        (c.timingRight ? row('Timing Right?', c.timingRight) : '') +
        (c.sizingRight ? row('Sizing Right?', c.sizingRight) : '') +
        (c.wouldDoDiff ? row('Would Do Differently', c.wouldDoDiff) : '') +
      '</div>';

    // Exit form (show if open)
    let exitForm = '';
    if (c.status === 'open' || c.status === 'rolled') {
      exitForm =
        '<div class="exit-form">' +
          '<div class="exit-form-title">Log Exit / Reflection</div>' +
          '<div class="form-row c3">' +
            '<div class="form-group"><label class="form-label">Exit Date</label><input class="form-input" id="ex-date-' + c.id + '" type="date" value="' + (c.exitDate||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Exit Price ($)</label><input class="form-input" id="ex-price-' + c.id + '" type="number" placeholder="220.00" value="' + (c.exitPrice||'') + '"></div>' +
            '<div class="form-group"><label class="form-label">Return (%)</label><div class="input-wrap"><input class="form-input" id="ex-ret-' + c.id + '" type="number" placeholder="+45" value="' + (c.returnPct !== null ? c.returnPct : '') + '"><span class="input-suffix">%</span></div></div>' +
          '</div>' +
          '<div class="form-row c3">' +
            '<div class="form-group"><label class="form-label">Thesis Right?</label>' +
              '<select class="form-select" id="ex-thesis-' + c.id + '">' +
                ['','Yes','Partially','No'].map(v => '<option' + (c.thesisRight===v?' selected':'') + (v===''?' value=""':'') + '>' + (v||'Select…') + '</option>').join('') +
              '</select></div>' +
            '<div class="form-group"><label class="form-label">Timing Right?</label>' +
              '<select class="form-select" id="ex-timing-' + c.id + '">' +
                ['','Yes','Early','Late','No'].map(v => '<option' + (c.timingRight===v?' selected':'') + (v===''?' value=""':'') + '>' + (v||'Select…') + '</option>').join('') +
              '</select></div>' +
            '<div class="form-group"><label class="form-label">Sizing Right?</label>' +
              '<select class="form-select" id="ex-sizing-' + c.id + '">' +
                ['','Yes','Too Small','Too Big','No'].map(v => '<option' + (c.sizingRight===v?' selected':'') + (v===''?' value=""':'') + '>' + (v||'Select…') + '</option>').join('') +
              '</select></div>' +
          '</div>' +
          '<div class="form-row c2">' +
            '<div class="form-group"><label class="form-label">Exit Rules Followed? — F8</label>' +
              '<select class="form-select" id="ex-discipline-' + c.id + '">' +
                ['','Fully','Partially','Deviated'].map(v => '<option' + (c.exitDiscipline===v?' selected':'') + (v===''?' value=""':'') + '>' + (v||'Select…') + '</option>').join('') +
              '</select>' +
              '<span class="form-hint">Did you execute the pre-committed exit rules without modification?</span></div>' +
            '<div class="form-group"><label class="form-label">Would Do Differently</label>' +
              '<textarea class="form-textarea" id="ex-diff-' + c.id + '" rows="2" placeholder="Key lesson from this trade">' + (c.wouldDoDiff||'') + '</textarea></div>' +
          '</div>' +
          '<div class="form-row c2">' +
            '<div class="form-group"><label class="form-label">Close Status</label>' +
              '<div class="toggle-group">' +
                '<button class="toggle-btn" onclick="Cards.saveExit(\'' + c.id + '\',\'closed_win\')">Closed — Win</button>' +
                '<button class="toggle-btn" onclick="Cards.saveExit(\'' + c.id + '\',\'closed_loss\')">Closed — Loss</button>' +
                '<button class="toggle-btn" onclick="Cards.saveExit(\'' + c.id + '\',\'rolled\')">Rolled</button>' +
              '</div></div>' +
            '<div class="form-group" style="align-items:flex-end;justify-content:flex-end;display:flex"><button class="btn btn-danger btn-sm" onclick="Cards.deleteCard(\'' + c.id + '\')">Delete Card</button></div>' +
          '</div>' +
        '</div>';
    } else {
      exitForm = '<div style="padding-top:8px"><button class="btn btn-danger btn-sm" onclick="Cards.deleteCard(\'' + c.id + '\')">Delete Card</button></div>';
    }

    return cardHtml + exitForm;
  },

  toggleExpand(id) {
    const detail = document.getElementById('detail-' + id);
    if (detail) detail.classList.toggle('open');
  },

  saveExit(id, status) {
    const g = sid => { const el = document.getElementById(sid + id); return el ? el.value.trim() : ''; };
    const updates = {
      status:        status,
      exitDate:      g('ex-date-'),
      exitPrice:     parseFloat(g('ex-price-')) || null,
      returnPct:     parseFloat(g('ex-ret-'))   || null,
      thesisRight:   g('ex-thesis-'),
      timingRight:   g('ex-timing-'),
      sizingRight:   g('ex-sizing-'),
      exitDiscipline:g('ex-discipline-'),  // F8 — did you follow your pre-committed exit rules?
      wouldDoDiff:   g('ex-diff-')
    };
    State.updateCard(id, updates);
    toast('Card updated', 'success');
    this.render();
    updateCardsCount();
    Calibration.render(); // refresh cal if visible
  },

  deleteCard(id) {
    if (!confirm('Delete this trade card? This cannot be undone.')) return;
    State.deleteCard(id);
    toast('Card deleted', 'info');
    this.render();
    updateCardsCount();
  },

  exportCSV() {
    const cols = ['id','ticker','company','entryDate','instrument','sectorFit','l2EdgeType',
      'entryPrice','strike','delta','premium','expiry',
      'positionPct','positionDollars','ev','convictionTier','thesis','killSwitch',
      'status','exitDate','exitPrice','returnPct',
      'thesisRight','timingRight','sizingRight','exitDiscipline','wouldDoDiff'];
    const esc = v => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
    const rows = [cols.join(',')].concat(State.cards.map(c => cols.map(k => esc(c[k])).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'faim_trade_cards_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    toast('CSV exported', 'success');
  },

  showBackup() {
    // SOP §5.3 — localStorage JSON backup
    openModal(
      '<div class="modal-header"><span class="modal-title" id="modal-title">⎘ Backup localStorage</span>' +
      '<button class="modal-close" onclick="closeModal()">×</button></div>' +
      '<div class="modal-body">' +
        '<div class="form-hint" style="margin-bottom:12px">Run this in your browser DevTools Console (⌘⌥J on Mac) to copy all data to clipboard, then paste into a <code>backup_' + new Date().toISOString().slice(0,10) + '.json</code> file.</div>' +
        '<div style="background:rgba(0,0,0,0.3);border:1px solid var(--c-border);border-radius:var(--r-md);padding:12px 16px;font-family:var(--mono);font-size:13px;color:var(--c-teal);user-select:all;cursor:text">' +
          'copy(localStorage.getItem(\'faim_v1\'))' +
        '</div>' +
        '<div class="form-hint" style="margin-top:10px">Alternatively, use the CSV export button for a spreadsheet-friendly backup.</div>' +
      '</div>' +
      '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="closeModal()">Got it</button></div>'
    );
  }
};

// ── CALIBRATION ───────────────────────────────────────────────────
const Calibration = {

  render() {
    const el = document.getElementById('calibration-content');
    const n = State.cards.length;
    const nClosed = State.cards.filter(c => c.status === 'closed_win' || c.status === 'closed_loss').length;
    if (n < CAL_THRESHOLD || nClosed < CAL_CLOSED_MIN) {
      this.renderLocked(el, n, nClosed);
    } else {
      this.renderDashboard(el);
    }
  },

  renderLocked(el, n, nClosed) {
    const pctTotal  = Math.min((n / CAL_THRESHOLD) * 100, 100);
    const pctClosed = Math.min((nClosed / CAL_CLOSED_MIN) * 100, 100);
    const r = 52, circ = 2 * Math.PI * r;
    const offsetTotal  = circ * (1 - pctTotal  / 100);
    const offsetClosed = circ * (1 - pctClosed / 100);
    const needTotal  = Math.max(0, CAL_THRESHOLD  - n);
    const needClosed = Math.max(0, CAL_CLOSED_MIN - nClosed);
    el.innerHTML =
      '<div class="cal-wrapper">' +
        '<div class="cal-locked">' +
          '<div style="display:flex;gap:32px;justify-content:center;margin-bottom:24px">' +
            // Ring 1: Total cards
            '<div style="text-align:center">' +
              '<div class="cal-lock-ring" style="width:100px;height:100px">' +
                '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>' +
                  '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--c-teal)" stroke-width="8" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offsetTotal + '" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
                '</svg>' +
                '<div class="cal-lock-icon" style="position:relative;z-index:1">' +
                  '<div class="cal-lock-n" style="font-size:22px">' + n + '</div>' +
                  '<div class="cal-lock-sub">/ ' + CAL_THRESHOLD + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:11px;color:var(--t-muted);margin-top:6px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Total Cards</div>' +
            '</div>' +
            // Ring 2: Closed cards
            '<div style="text-align:center">' +
              '<div class="cal-lock-ring" style="width:100px;height:100px">' +
                '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>' +
                  '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--c-green)" stroke-width="8" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offsetClosed + '" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
                '</svg>' +
                '<div class="cal-lock-icon" style="position:relative;z-index:1">' +
                  '<div class="cal-lock-n" style="font-size:22px;color:var(--c-green)">' + nClosed + '</div>' +
                  '<div class="cal-lock-sub">/ ' + CAL_CLOSED_MIN + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:11px;color:var(--t-muted);margin-top:6px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Closed</div>' +
            '</div>' +
          '</div>' +
          '<h2 class="cal-lock-title">Calibration Locked</h2>' +
          '<p class="cal-lock-desc">' +
            'SOP §6.1 requires <strong>' + CAL_THRESHOLD + ' total cards</strong> AND <strong>' + CAL_CLOSED_MIN + ' Closed</strong>.<br>' +
            (needTotal  > 0 ? 'Log <strong>' + needTotal  + ' more card'  + (needTotal  !== 1 ? 's' : '') + '</strong>. ' : '✓ Total reached. ') +
            (needClosed > 0 ? 'Close <strong>' + needClosed + ' more trade' + (needClosed !== 1 ? 's' : '') + '</strong>.' : '✓ Closed threshold reached.') +
          '</p>' +
          '<div class="info-box" style="max-width:420px;margin:16px auto 0;text-align:left">Prime Directive #5: Paper trade until 15 tracked outcomes. Calibrate before real money.</div>' +
        '</div>' +
      '</div>';
  },

  renderDashboard(el) {
    const cards = State.cards;
    const closed = cards.filter(c => c.status === 'closed_win' || c.status === 'closed_loss');
    const wins   = closed.filter(c => c.status === 'closed_win');
    const winRate = closed.length ? Math.round(wins.length / closed.length * 100) : 0;
    const avgReturn = closed.length ? Math.round(closed.reduce((sum,c) => sum + (c.returnPct||0), 0) / closed.length) : 0;
    const totalReturn = closed.reduce((sum,c) => sum + (c.returnPct||0), 0);

    const thesisWins = closed.filter(c => c.thesisRight === 'Yes').length;
    const timingEarly = closed.filter(c => c.timingRight === 'Early').length;
    const timingLate  = closed.filter(c => c.timingRight === 'Late').length;
    const timingOk    = closed.filter(c => c.timingRight === 'Yes').length;

    const stat = (val, lbl, col) =>
      '<div class="cal-stat">' +
        '<div class="cal-stat-val" style="color:' + (col||'var(--t-primary)') + '">' + val + '</div>' +
        '<div class="cal-stat-label">' + lbl + '</div>' +
      '</div>';

    const bar = (lbl, pct, col, val) =>
      '<div class="bar-row">' +
        '<span class="bar-label">' + lbl + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + Math.max(0,pct) + '%;background:' + col + '"></div></div>' +
        '<span class="bar-val">' + val + '</span>' +
      '</div>';

    // Bias detection
    let biasMsg = 'Insufficient data.';
    if (closed.length >= 5) {
      if (timingEarly / closed.length > 0.4) biasMsg = '⚠ Systematically EARLY — You are entering before catalysts confirm.';
      else if (timingLate / closed.length > 0.4) biasMsg = '⚠ Systematically LATE — You are entering after most of the move.';
      else if (winRate < 40) biasMsg = '⚠ Win rate below 40% — Review L1/L2 gate rigor.';
      else if (winRate > 70 && avgReturn < 15) biasMsg = '⚠ High win rate but low avg return — Sizing may be too conservative.';
      else biasMsg = '✓ No strong systematic bias detected at this sample size.';
    }

    // F9 — transparent, self-documenting layer weakness scores
    // Each score = % of closed trades where that layer performed correctly
    const layerScore = (lyr) => {
      if (!closed.length) return 0;
      if (lyr === 'L1') // Thesis accuracy: quality gate catching wrong entries?
        return Math.round(closed.filter(c => c.thesisRight !== 'No').length / closed.length * 100);
      if (lyr === 'L2') // Edge accuracy: was the mispricing real? (proxy: win rate)
        return Math.round(wins.length / closed.length * 100);
      if (lyr === 'L3') // Scenario timing: how often were you on time vs early/late?
        return Math.round(timingOk / closed.length * 100);
      if (lyr === 'L4') // Sizing discipline: did conviction match position size?
        return Math.round(closed.filter(c => c.sizingRight === 'Yes').length / closed.length * 100);
      if (lyr === 'L5') // Exit discipline: did you follow pre-committed exit rules?
        return Math.round(closed.filter(c => c.exitDiscipline === 'Fully').length / closed.length * 100);
      return 0;
    };
    const lyrColor = s => s >= 70 ? 'var(--c-green)' : s >= 40 ? 'var(--c-gold)' : 'var(--c-red)';
    const lyrLabel = lyr => ({ L1:'Quality Gate', L2:'Edge Real?', L3:'Timing', L4:'Sizing', L5:'Exit Discipline' })[lyr];

    el.innerHTML =
      '<div class="cal-wrapper">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">' +
          '<div><h2 style="font-size:22px;font-weight:700">Calibration Review</h2>' +
            '<p style="font-size:13px;color:var(--t-secondary);margin-top:4px">' + State.cards.length + ' total · ' + closed.length + ' closed · run after every 15 outcomes</p></div>' +
        '</div>' +
        '<div class="cal-stats-grid">' +
          stat(winRate + '%', 'Win Rate', winRate >= 50 ? 'var(--c-green)' : 'var(--c-red)') +
          stat((avgReturn > 0 ? '+' : '') + avgReturn + '%', 'Avg Return', avgReturn >= 0 ? 'var(--c-green)' : 'var(--c-red)') +
          stat(closed.length, 'Closed Trades', 'var(--t-primary)') +
          stat(State.cards.filter(c=>c.status==='open').length, 'Open Positions', 'var(--c-teal)') +
        '</div>' +

        '<div class="cal-charts">' +
          '<div class="cal-chart-box"><div class="cal-chart-title">Systematic Bias Analysis</div>' +
            '<div class="warn-box" style="margin-bottom:14px;font-size:12px">' + biasMsg + '</div>' +
            '<div class="cal-chart-inner">' +
              bar('Timing: On time', closed.length ? Math.round(timingOk/closed.length*100) : 0, 'var(--c-green)', timingOk) +
              bar('Timing: Early', closed.length ? Math.round(timingEarly/closed.length*100) : 0, 'var(--c-gold)', timingEarly) +
              bar('Timing: Late',  closed.length ? Math.round(timingLate/closed.length*100)  : 0, 'var(--c-orange)', timingLate) +
              bar('Thesis: Right', closed.length ? Math.round(thesisWins/closed.length*100) : 0, 'var(--c-teal)', thesisWins) +
            '</div>' +
          '</div>' +
          '<div class="cal-chart-box"><div class="cal-chart-title">Return Distribution</div>' +
            '<div class="cal-chart-inner">' +
              [
                ['> +100%', closed.filter(c=>(c.returnPct||0)>100).length,'var(--c-green)'],
                ['+20–100%',closed.filter(c=>(c.returnPct||0)>20&&(c.returnPct||0)<=100).length,'var(--c-teal)'],
                ['0–+20%',  closed.filter(c=>(c.returnPct||0)>=0&&(c.returnPct||0)<=20).length,'var(--c-blue)'],
                ['-50–0%',  closed.filter(c=>(c.returnPct||0)<0&&(c.returnPct||0)>=-50).length,'var(--c-orange)'],
                ['< -50%',  closed.filter(c=>(c.returnPct||0)<-50).length,'var(--c-red)']
              ].map(([lbl,cnt,col]) => bar(lbl, closed.length?Math.round(cnt/closed.length*100):0, col, cnt)).join('') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="cal-chart-box" style="margin-bottom:14px"><div class="cal-chart-title">Layer Weakness Radar — Score by Layer (heuristic)</div>' +
          '<div class="bias-grid">' +
            ['L1','L2','L3','L4','L5'].map(lyr => {
              const s = layerScore(lyr);
              return '<div class="bias-box"><div class="bias-layer">' + lyr + '</div>'
                   + '<div class="bias-score" style="color:' + lyrColor(s) + '">' + s + '</div>'
                   + '<div style="font-size:10px;color:var(--t-muted)">/ 100</div>'
                   + '<div style="font-size:9px;color:var(--t-muted);margin-top:2px">' + lyrLabel(lyr) + '</div></div>';
            }).join('') +
          '</div>' +
          '<div class="form-hint" style="margin-top:12px">Scores are heuristic estimates from your reflection data. Lowest score = layer to review next cycle.</div>' +
        '</div>' +

        '<div class="info-box">Next step: Identify your weakest layer. Adjust that layer\'s thresholds or process. Document the change below, then start the next 15-card cycle.</div>' +

      '</div>';
  }
};
