/* ================================================================
   FAIM v1.0 — wizard.js
   5-Layer Analysis Wizard (Steps 0–6)
   ================================================================ */
'use strict';

const Wizard = {
  step: 0, data: {}, totalSteps: 6,

  init() { this.step = 0; this.data = {}; this.render(); },
  reset() { if (confirm('Start a new analysis? Progress will be lost.')) this.init(); },
  gv(id) { const el = document.getElementById(id); return el ? (el.value||0) : 0; },

  render() {
    const labels = ['Setup','L1 Gate','L2 Edge','L3 Thesis','L4 Size','L5 Monitor','Summary'];
    const prog = labels.map((lbl,i) => {
      const cls = i < this.step ? 'complete' : i === this.step ? 'active' : '';
      const line = i < labels.length-1 ? '<div class="progress-line'+(i<this.step?' filled':'')+'"></div>' : '';
      return '<div class="progress-step '+cls+'"><div class="ps-dot">'+(i<this.step?'✓':i+1)+'</div><div class="ps-label">'+lbl+'</div></div>'+line;
    }).join('');
    document.getElementById('analyze-content').innerHTML =
      '<div class="wizard-wrapper">'+
        '<div class="wizard-top"><div class="wizard-label">5-Layer Decision Protocol</div>'+
        '<button class="wizard-reset-btn" onclick="Wizard.reset()">↺ Start Over</button></div>'+
        '<div class="wizard-progress">'+prog+'</div>'+
        '<div class="wizard-card">'+this.renderStep(this.step)+'</div>'+
      '</div>';
    attachToggleGroups();
    this.bindProbInputs();
  },

  renderStep(s) {
    return [this.s0,this.s1,this.s2,this.s3,this.s4,this.s5,this.s6][s].call(this);
  },

  hdr(icon,cls,tag,title,sub) {
    return '<div class="step-header">'+
      '<div class="layer-badge '+cls+'">'+icon+'</div>'+
      '<div class="step-header-text">'+
        '<div class="step-tag">'+tag+'</div>'+
        '<div class="step-title">'+title+'</div>'+
        '<div class="step-sub">'+sub+'</div>'+
      '</div></div>';
  },

  ftr(showBack) {
    const back = showBack ? '<button class="btn btn-ghost" onclick="Wizard.prev()">← Back</button>' : '<span></span>';
    const nxt = this.step === 5 ? 'Generate Summary →' : 'Next →';
    return '<div class="step-footer">'+back+'<button class="btn btn-primary" onclick="Wizard.next()">'+nxt+'</button></div>';
  },

  tgl(grp, items, sel) {
    return '<div class="toggle-group">'+items.map(([v,l,c])=>{
      const isActive = (sel===v)||(sel===true&&v==='yes')||(sel===false&&v==='no')||(typeof sel==='number'&&sel=== +v);
      return '<button class="toggle-btn'+(isActive?' active'+(c?' '+c:''):'')+ '" data-val="'+v+'" data-group="'+grp+'"'+(c?' data-color="'+c+'"':'')+'>'+l+'</button>';
    }).join('')+'</div>';
  },

  // STEP 0
  s0() {
    const d = this.data, today = new Date().toISOString().slice(0,10);
    return this.hdr('⬡','lb-setup','Step 0 of 6 · Setup','Ticker &amp; Context','Define the opportunity before applying any framework.')+
    '<div class="step-body">'+
      '<div class="form-row c3">'+
        '<div class="form-group"><label class="form-label">Ticker *</label>'+
          '<input class="form-input" id="f-ticker" placeholder="NVDA" value="'+(d.ticker||'')+'" style="font-family:var(--mono);font-weight:700;font-size:16px;text-transform:uppercase"></div>'+
        '<div class="form-group"><label class="form-label">Company Name</label>'+
          '<input class="form-input" id="f-company" placeholder="NVIDIA Corporation" value="'+(d.company||'')+'"></div>'+
        '<div class="form-group"><label class="form-label">Analysis Date</label>'+
          '<input class="form-input" id="f-date" type="date" value="'+(d.date||today)+'"></div>'+
      '</div>'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">Current Stock Price ($) *</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-price" type="number" placeholder="875.00" value="'+(d.price||'')+'" step="0.01"><span class="input-suffix">USD</span></div></div>'+
        '<div class="form-group"><label class="form-label">Sector Fit</label>'+
          this.tgl('sectorFit',[['AI Infrastructure','AI Infra'],['Energy Transition','Energy Trans.'],['Both','Both'],['Adjacent','Adjacent']],d.sectorFit||'AI Infrastructure')+'</div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Seed Thesis (one sentence)</label>'+
        '<textarea class="form-textarea" id="f-seed" placeholder="What makes this opportunity interesting?" rows="2">'+(d.seedThesis||'')+'</textarea></div>'+
      '<div class="info-box">Sector guardrail: <strong>AI Infrastructure + Energy Transition</strong>. If this name doesn\'t fit, stop here.</div>'+
    '</div>'+
    '<div class="step-footer"><span class="text-muted" style="font-size:12px">* required</span><button class="btn btn-primary" onclick="Wizard.next()">Next: Quality Gate →</button></div>';
  },

  // STEP 1
  s1() {
    const d = this.data;
    const thr = getL1Thresholds(d.sectorFit);
    const sTag = '<span style="font-size:10px;background:rgba(100,230,210,0.12);color:var(--c-teal);padding:2px 8px;border-radius:4px;margin-left:8px;vertical-align:middle">' + (d.sectorFit || 'AI Infrastructure') + '</span>';
    return this.hdr('L1','lb-l1','Step 1 of 6 · Layer 1','Quality Gate' + sTag,'Pass/Fail in 60 seconds. Need 4 of 5 checks to proceed.')+
    '<div class="step-body">'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">Revenue Growth YoY (%)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l1-rev" type="number" placeholder="122" value="'+(d.l1RevGrowth||'')+'"><span class="input-suffix">%</span></div>'+
          '<span class="form-hint">Threshold: &gt;'+thr.revGrowth+'% ('+( d.sectorFit||'AI Infrastructure')+')</span></div>'+
        '<div class="form-group"><label class="form-label">Gross Margin (%)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l1-gm" type="number" placeholder="74" value="'+(d.l1GrossMargin||'')+'"><span class="input-suffix">%</span></div>'+
          '<span class="form-hint">Threshold: &gt;'+thr.grossMargin+'% OR trending &gt;'+thr.gmTrend+' bps/yr</span></div>'+
      '</div>'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">GM Trend (bps/yr)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l1-gmtrend" type="number" placeholder="350" value="'+(d.l1GMTrend||'0')+'"><span class="input-suffix">bps</span></div></div>'+
        '<div class="form-group"><label class="form-label">Balance Sheet Runway (months)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l1-runway" type="number" placeholder="24" value="'+(d.l1Runway||'')+'"><span class="input-suffix">mo</span></div>'+
          '<span class="form-hint">Min '+thr.runway+' months to pass</span></div>'+
      '</div>'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">ROIC vs WACC</label>'+
          this.tgl('l1ROIC',[['yes','ROIC &gt; WACC','success'],['path','24mo path','warn'],['no','Below WACC','danger']],d.l1ROIC)+'</div>'+
        '<div class="form-group"><label class="form-label">Mgmt / Capital Allocation (1–5)</label>'+
          this.tgl('l1Mgmt',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],+d.l1Mgmt)+
          '<span class="form-hint">3+ = pass. Track record of good capital allocation?</span></div>'+
      '</div>'+
    '</div>'+this.ftr(true);
  },

  // STEP 2
  s2() {
    const d = this.data;
    return this.hdr('L2','lb-l2','Step 2 of 6 · Layer 2','Mispricing Detector','Where is the market wrong? Need ≥10% gap vs consensus.')+
    '<div class="step-body">'+
      '<div class="form-row c3">'+
        '<div class="form-group"><label class="form-label">Implied Growth (%)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l2-implied" type="number" placeholder="15" value="'+(d.l2ImpliedGrowth||'')+'"><span class="input-suffix">%</span></div>'+
          '<span class="form-hint">Back-solved from EV/Revenue or P/E</span></div>'+
        '<div class="form-group"><label class="form-label">Consensus Estimate (%)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l2-cons" type="number" placeholder="40" value="'+(d.l2ConsensusGrowth||'')+'"><span class="input-suffix">%</span></div>'+
          '<span class="form-hint">Wall Street consensus</span></div>'+
        '<div class="form-group"><label class="form-label">Your Estimate (%)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l2-yours" type="number" placeholder="65" value="'+(d.l2YourGrowth||'')+'"><span class="input-suffix">%</span></div>'+
          '<span class="form-hint">Your differentiated view</span></div>'+
      '</div>'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">Nature of Change</label>'+
          this.tgl('l2ChangeType',[['structural','Structural (2+ yrs)'],['cyclical','Cyclical (&lt;2Q)'],['none','No change']],d.l2ChangeType)+
          '<span class="form-hint">Is the recent change durable or temporary?</span></div>'+
        '<div class="form-group"><label class="form-label">Short Interest (% float)</label>'+
          '<div class="input-wrap"><input class="form-input" id="f-l2-short" type="number" placeholder="2.1" value="'+(d.l2ShortInterest||'')+'" step="0.1"><span class="input-suffix">%</span></div></div>'+
      '</div>'+
      '<div class="form-row c2">'+
        '<div class="form-group"><label class="form-label">Insider Activity</label>'+
          this.tgl('l2Insider',[['buying','Buying','success'],['neutral','Neutral'],['selling','Selling','danger']],d.l2Insider)+'</div>'+
        '<div class="form-group"><label class="form-label">Positioning</label>'+
          this.tgl('l2Crowd',[['forgotten','Forgotten name'],['balanced','Balanced'],['crowded','Crowded long']],d.l2Crowd)+'</div>'+
      '</div>'+
      '<div class="form-group"><label class="form-label">Edge Type — Why is the market wrong? *</label>'+
        this.tgl('l2EdgeType',[
          ['channel',       '📡 Channel / Supply'],
          ['anchoring',     '⚓ Wrong Metric'],
          ['conservative',  '📉 Conservative Guidance'],
          ['analog',        '📊 Historical Analog'],
          ['structural',    '⚡ Structural Shift'],
          ['other',         '✏ Other']
        ], d.l2EdgeType)+
        '<span class="form-hint">Select your primary edge source. Forces a falsifiable hypothesis — not just "I think it goes up."</span></div>'+
      '<div class="form-group"><label class="form-label">The Edge Statement</label>'+
        '<textarea class="form-textarea" id="f-l2-edge" placeholder="Would a Goldman PM say \'interesting\' or \'everyone knows that\'?" rows="2">'+(d.l2Edge||'')+'</textarea></div>'+
    '</div>'+this.ftr(true);
  },

  // STEP 3
  s3() {
    const d = this.data;
    const sum = (+d.l3BullProb||0)+(+d.l3BaseProb||0)+(+d.l3BearProb||0);
    const ok  = Math.abs(sum-100) < 1;
    const bearLeaps = d.l3BearLeaps !== undefined ? d.l3BearLeaps : -80;

    const sc = (cls,label,pid,pval,did,dval,tid,tval,extra) =>
      '<div class="scenario-card '+cls+'">'+
        '<div class="sc-label">'+label+'</div>'+
        '<div class="sc-prob-row" style="margin-bottom:10px">'+
          '<input class="sc-prob-input" id="'+pid+'" type="number" min="0" max="100" placeholder="—" value="'+(pval||'')+'" oninput="Wizard.onProbInput()">'+
          '<span class="sc-prob-label">% probability</span></div>'+
        '<div class="form-group" style="margin-bottom:8px"><label class="form-label" style="font-size:10px">Driver</label>'+
          '<textarea class="form-textarea" id="'+did+'" rows="2" style="font-size:12px" placeholder="What must happen?">'+(dval||'')+'</textarea></div>'+
        '<div class="form-group"><label class="form-label" style="font-size:10px">Price Target ($)</label>'+
          '<input class="form-input" id="'+tid+'" type="number" placeholder="—" value="'+(tval||'')+'" style="font-size:13px"></div>'+
        extra+
      '</div>';

    const bullX = '<div class="form-group" style="margin-top:6px"><label class="form-label" style="font-size:10px">Timeline</label>'+
      '<input class="form-input" id="f-bull-tl" placeholder="18 months" value="'+(d.l3BullTimeline||'')+'" style="font-size:12px"></div>'+
      '<div class="form-group" style="margin-top:6px"><label class="form-label" style="font-size:10px">Method</label>'+
      '<select class="form-select" id="f-bull-meth" style="font-size:12px">'+
        ['DCF','EV/Revenue','Comps','P/E','Other'].map(m=>'<option'+((d.l3BullMethod||'EV/Revenue')===m?' selected':'')+'>'+m+'</option>').join('')+
      '</select></div>';

    const baseX = '<div class="form-group" style="margin-top:6px"><label class="form-label" style="font-size:10px">Timeline</label>'+
      '<input class="form-input" id="f-base-tl" placeholder="18 months" value="'+(d.l3BaseTimeline||'')+'" style="font-size:12px"></div>';

    const bearX = '<div class="form-group" style="margin-top:6px"><label class="form-label" style="font-size:10px">LEAPS Loss (%)</label>'+
      '<div class="input-wrap"><input class="form-input" id="f-bear-leaps" type="number" placeholder="-80" value="'+bearLeaps+'" style="font-size:13px"><span class="input-suffix">%</span></div>'+
      '<span class="form-hint" style="font-size:10px">Typically −80% to −100%</span></div>';

    return this.hdr('L3','lb-l3','Step 3 of 6 · Layer 3','Thesis Construction','Kill switch first. Bull / Base / Bear — numbers, not adjectives.')+
    '<div class="step-body">'+
      '<div class="kill-switch-box">'+
        '<div class="ks-header"><span class="ks-icon">⚡</span><span class="ks-title">Kill Switch — Define This First</span></div>'+
        '<div class="form-group"><textarea class="form-textarea" id="f-ks" rows="2" placeholder="Exact condition: e.g. GM falls below 38% in any quarter">'+(d.killSwitch||'')+'</textarea></div>'+
        '<div class="ks-note">If triggered: full exit within 5 trading days. No exceptions.</div>'+
      '</div>'+
      '<div class="scenario-grid">'+
        sc('bull','▲ Bull Case','f-bull-prob',d.l3BullProb,'f-bull-driver',d.l3BullDriver,'f-bull-target',d.l3BullTarget,bullX)+
        sc('base','→ Base Case','f-base-prob',d.l3BaseProb,'f-base-driver',d.l3BaseDriver,'f-base-target',d.l3BaseTarget,baseX)+
        sc('bear','▼ Bear Case','f-bear-prob',d.l3BearProb,'f-bear-driver',d.l3BearDriver,'f-bear-target',d.l3BearTarget,bearX)+
      '</div>'+
      '<div class="prob-total-row">'+
        '<span style="font-size:11px;color:var(--t-muted)">Probability total:</span>'+
        '<div class="prob-total-bar"><div class="prob-total-fill" id="prob-fill" style="width:'+Math.min(sum,100)+'%;background:'+(ok?'var(--c-green)':'var(--c-red)')+'"></div></div>'+
        '<span class="prob-total-label '+(ok?'ok':'err')+'" id="prob-total-label">'+sum+'% '+(ok?'✓':'← must equal 100%')+'</span>'+
      '</div>'+
    '</div>'+this.ftr(true);
  },

  s4() {
    const d = this.data, ps = State.settings.portfolioSize;
    let evBanner = '';
    if (d.l3BullProb && d.price) {
      const delta=+d.l4Delta||0.75, prem=+d.l4Premium||1;
      const bR = d.l3BullTarget ? calcLeapsReturn(+d.price,+d.l3BullTarget,delta,prem):0;
      const sR = d.l3BaseTarget ? calcLeapsReturn(+d.price,+d.l3BaseTarget,delta,prem):0;
      const brR = +d.l3BearLeaps||-80;
      const ev = calcWeightedEV({p:+d.l3BullProb,r:bR},{p:+d.l3BaseProb,r:sR},{p:+d.l3BearProb,r:brR});
      const ratio = getEVRatio(ev,brR), conv = getConvictionTier(ratio);
      const col = ev>20?'var(--c-green)':ev>0?'var(--c-gold)':'var(--c-red)';
      const r=42,c=2*Math.PI*r, off=c*(1-Math.min(Math.max(ev,0),200)/200);
      evBanner =
        '<div style="display:flex;align-items:center;gap:20px;background:var(--c-glass-h);border:1px solid var(--c-border);border-radius:var(--r-lg);padding:18px 24px">'+
          '<div style="position:relative;display:inline-block">'+
            '<svg width="90" height="90" viewBox="0 0 100 100">'+
              '<circle cx="50" cy="50" r="'+r+'" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>'+
              '<circle cx="50" cy="50" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="8" stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" stroke-linecap="round" transform="rotate(-90 50 50)"/>'+
            '</svg>'+
            '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">'+
              '<span style="font-size:16px;font-weight:800;font-family:var(--mono);color:'+col+'">'+(ev>0?'+':'')+Math.round(ev)+'%</span>'+
              '<span style="font-size:9px;color:var(--t-muted);text-transform:uppercase;letter-spacing:.06em">Wtd EV</span>'+
            '</div></div>'+
          '<div style="flex:1">'+
            '<div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t-muted);margin-bottom:6px">EV/Downside: '+ratio.toFixed(2)+'×</div>'+
            '<div class="conviction-box '+conv.cls+'">'+
              '<div class="cb-tier">'+conv.tier+' CONVICTION</div>'+
              '<div class="cb-range">'+conv.range+' of $'+ps.toLocaleString()+'</div>'+
              '<div class="cb-note">'+conv.note+'</div>'+
            '</div></div>'+
        '</div>';
    }

    // F5 — IV / theta warning
    const ivWarn = d.q2IV === 'high'
      ? '<div class="warn-box" style="margin-bottom:16px">'
        + '⚠️ <strong>High IV Alert:</strong> You selected “High IV” in Q2. '
        + 'Buying LEAPS now means paying inflated premium — IV crush after the event can cost <strong>30–40%</strong> even if the stock moves your way. '
        + '<strong>SOP: wait for the event to pass, then buy.</strong></div>'
      : '';

    // F6 — live correlation check against open cards
    const openCards  = State.cards.filter(c => c.status === 'open');
    const sectorKey  = d.sectorFit || 'AI Infrastructure';
    const sameSectr  = openCards.filter(c => c.sectorFit === sectorKey);
    const corrPct    = sameSectr.reduce((sum,c) => sum + (c.positionPct || 0), 0);
    const corrWarn   = (corrPct > 0)
      ? '<div class="' + (corrPct >= 8 ? 'warn-box' : 'info-box') + '" style="margin-bottom:16px">'
        + (corrPct >= 8 ? '⚠️ <strong>Correlation Alert:</strong>' : 'ℹ️ <strong>Sector Exposure:</strong>')
        + ' You have <strong>' + corrPct.toFixed(1) + '% of portfolio</strong> in open <em>' + sectorKey + '</em> positions.'
        + (corrPct >= 8 ? ' SOP max for correlated positions: <strong>8%</strong>. Consider reducing this position size.' : ' SOP cap: 8%.')
        + ' (' + sameSectr.length + ' open position' + (sameSectr.length !== 1 ? 's' : '') + ')</div>'
      : '';

    return this.hdr('L4','lb-l4','Step 4 of 6 · Layer 4','Position Sizing','Instrument decision tree Q1–Q5. Portfolio: $'+ps.toLocaleString()+' virtual.')+
    '<div class="step-body">'+
      ivWarn + corrWarn +
      evBanner+
      '<div><div class="section-title">Instrument Decision Tree</div>'+
        '<div style="margin-top:14px;display:flex;flex-direction:column;gap:16px">'+
          '<div class="form-row c2">'+
            '<div class="form-group"><label class="form-label">Q1 — Clear 12–24mo Catalyst?</label>'+
              this.tgl('q1CatalystRaw',[['yes','Yes → LEAPS','success'],['no','No → Stock only','warn']],d.q1Catalyst?'yes':'no')+'</div>'+
            '<div class="form-group"><label class="form-label">Q2 — IV Environment</label>'+
              this.tgl('q2IV',[['normal','Normal / Low IV → Best entry','success'],['high','High IV → Wait for crush','warn']],d.q2IV)+'</div>'+
          '</div>'+
          '<div class="form-row c2">'+
            '<div class="form-group"><label class="form-label">Q3 — Strike Type</label>'+
              this.tgl('q3Strike',[['deep_itm','Deep ITM (δ 0.70–0.80)'],['ntm','Near-money (δ 0.45–0.60)'],['otm','OTM — Caution']],d.q3Strike)+'</div>'+
            '<div class="form-group"><label class="form-label">Q4 — Months to Expiry</label>'+
              this.tgl('q4ExpiryMonths',[['12','12mo'],['15','15mo'],['18','18mo'],['21','21mo'],['24','24mo+']],d.q4ExpiryMonths)+
              '<span class="form-hint">Min 12mo. Prefer 18–24mo. Never hold past 60 DTE without rolling.</span></div>'+
          '</div>'+
        '</div></div>'+
      '<div><div class="section-title">LEAPS Entry Details</div>'+
        '<div class="form-row c4" style="margin-top:14px">'+
          '<div class="form-group"><label class="form-label">Strike ($)</label><input class="form-input" id="f-l4-strike" type="number" placeholder="850" value="'+(d.l4Strike||'')+'"></div>'+
          '<div class="form-group"><label class="form-label">Delta (δ)</label><input class="form-input" id="f-l4-delta" type="number" placeholder="0.72" step="0.01" value="'+(d.l4Delta||'')+'"></div>'+
          '<div class="form-group"><label class="form-label">Premium / Share ($)</label><input class="form-input" id="f-l4-prem" type="number" placeholder="180" value="'+(d.l4Premium||'')+'"></div>'+
          '<div class="form-group"><label class="form-label">Expiry Date</label><input class="form-input" id="f-l4-expiry" type="date" value="'+(d.l4Expiry||'')+'"></div>'+
        '</div></div>'+
      '<div class="info-box"><strong>Entry staging:</strong> 50% now, 50% on the next confirmed data point.</div>'+
    '</div>'+this.ftr(true);
  },

  // STEP 5
  s5() {
    const d = this.data;
    const cpRow = n =>
      '<div class="checkpoint-row">'+
        '<div class="form-group"><label class="form-label" style="font-size:9px">CP'+n+' Date</label>'+
          '<input class="form-input" id="f-cp'+n+'-date" type="date" value="'+(d['cp'+n+'Date']||'')+'"></div>'+
        '<div class="form-group"><label class="form-label" style="font-size:9px">Event</label>'+
          '<input class="form-input" id="f-cp'+n+'-event" placeholder="e.g. Q2 Earnings, product launch" value="'+(d['cp'+n+'Event']||'')+'"></div>'+
      '</div>';

    return this.hdr('L5','lb-l5','Step 5 of 6 · Layer 5','Monitoring &amp; Exit Protocol','Answer these before entering. Lock them. Do not revise under pressure.')+
    '<div class="step-body">'+
      '<div><div class="section-title">1. Three Checkpoints</div>'+
        '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">'+
          cpRow(1)+cpRow(2)+cpRow(3)+
        '</div></div>'+
      '<div><div class="section-title">2. Exit Conditions</div>'+
        '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px">'+
          '<div class="form-group"><label class="form-label">Target Hit</label>'+
            '<input class="form-input" id="f-exit-target" placeholder="Sell 50–75% at $X, hold rest with trailing stop" value="'+(d.exitTarget||'')+'"></div>'+
          '<div class="form-group"><label class="form-label">Kill Switch Triggered</label>'+
            '<input class="form-input" id="f-exit-ks" value="'+(d.exitKS||'Full exit within 5 trading days. No exceptions.')+'"></div>'+
          '<div class="form-group"><label class="form-label">Inside 60 DTE &amp; Thesis Intact</label>'+
            '<input class="form-input" id="f-exit-dte" value="'+(d.exitDTE||'Roll forward to next available expiry.')+'"></div>'+
          '<div class="form-group"><label class="form-label">Better Opportunity + Thesis Weakening</label>'+
            '<input class="form-input" id="f-exit-rotate" value="'+(d.exitRotate||'Rotate out. Document reason.')+'"></div>'+
        '</div></div>'+
      '<div><div class="section-title">3. What Would Change My Mind?</div>'+
        '<div style="margin-top:14px"><div class="form-group">'+
          '<textarea class="form-textarea" id="f-wcmm" rows="3" placeholder="Be specific. Pre-commitment to intellectual honesty.">'+(d.wcmm||'')+'</textarea>'+
          '<span class="form-hint">Write at entry. Lock it.</span></div></div></div>'+
    '</div>'+this.ftr(true);
  },

  // STEP 6
  s6() {
    const d = this.data, ps = State.settings.portfolioSize;
    const l1 = evaluateL1(d), l2 = evaluateL2(d);
    const delta=+d.l4Delta||0.75, prem=+d.l4Premium||1;
    const bR  = d.l3BullTarget ? calcLeapsReturn(+d.price,+d.l3BullTarget,delta,prem):0;
    const sR  = d.l3BaseTarget ? calcLeapsReturn(+d.price,+d.l3BaseTarget,delta,prem):0;
    const brR = +d.l3BearLeaps||-80;
    const ev  = calcWeightedEV({p:+d.l3BullProb||0,r:bR},{p:+d.l3BaseProb||0,r:sR},{p:+d.l3BearProb||0,r:brR});
    const ratio = getEVRatio(ev,brR), conv = getConvictionTier(ratio);
    const allocPct = conv.tier==='HIGH'?6:conv.tier==='MEDIUM'?3:0;
    const allocUSD = Math.round(ps*allocPct/100);
    const instr = d.q1Catalyst===false?'Stock':'LEAPS';
    const col = ev>20?'var(--c-green)':ev>0?'var(--c-gold)':'var(--c-red)';
    const tcDate = d.date||new Date().toISOString().slice(0,10);
    const cps = [1,2,3].map(n=>d['cp'+n+'Event']?d['cp'+n+'Date']+' · '+d['cp'+n+'Event']:null).filter(Boolean).join(' | ')||'—';

    let vCls='avoid',vIco='✗',vLbl='AVOID',vTxt='Insufficient edge or EV below +20% minimum threshold.';
    if (l1.result==='PASS'&&l2.result==='IDENTIFIED'&&ev>20&&conv.tier!=='LOW') {
      vCls='enter';vIco='★';vLbl='HIGH EV — ENTER';vTxt='Weighted EV: '+(ev>0?'+':'')+Math.round(ev)+'%. Stage entry 50/50.';
    } else if (l1.result==='PASS'&&ev>0) {
      vCls='watch';vIco='◎';vLbl='WATCHLIST — WAIT';vTxt='Monitor for clearer catalyst or wider mispricing.';
    }

    const row = (k,v) => '<div class="tcp-field"><span class="tcp-key">'+k+':</span><span class="tcp-val">'+v+'</span></div>';

    return this.hdr('★','lb-sum','Step 6 of 6 · Summary',htmlEscape(d.ticker||'—')+' · Analysis Complete',htmlEscape(d.company||'')+' · '+tcDate)+
    '<div class="step-body">'+
      '<div class="verdict-banner '+vCls+'"><div class="vb-icon">'+vIco+'</div>'+
        '<div><div class="vb-label">[VERDICT]</div><div class="vb-text">'+vLbl+' — '+vTxt+'</div></div></div>'+

      '<div class="summary-section"><div class="summary-section-header">'+
        '<span class="ss-title">Output · 5-Layer Protocol</span>'+
        '<span style="font-size:14px;font-family:var(--mono);color:'+col+'">'+(ev>0?'+':'')+Math.round(ev)+'% EV</span>'+
      '</div><div class="summary-section-body">'+
        '<div class="output-line">[L1] Quality Gate: <strong class="'+(l1.result==='PASS'?'text-green':'text-red')+'">'+l1.result+'</strong> ('+l1.passes+'/'+l1.total+' checks)</div>'+
        '<div class="output-line">[L2] Mispricing: <strong class="'+(l2.found?'text-teal':'text-gold')+'">'+l2.result+'</strong> — gap = <strong>'+l2.gap+'%</strong></div>'+
        '<div class="output-line">[L3] Kill Switch → <span class="text-red">'+htmlEscape((d.killSwitch||'Not defined').slice(0,65))+'</span></div>'+
        '<div class="output-line">&nbsp;&nbsp;Bull <strong class="text-green">'+(d.l3BullProb||0)+'%</strong> → $'+(d.l3BullTarget||'—')+' | LEAPS est: '+(bR>0?'+':'')+bR+'%</div>'+
        '<div class="output-line">&nbsp;&nbsp;Base <strong class="text-teal">'+(d.l3BaseProb||0)+'%</strong> → $'+(d.l3BaseTarget||'—')+' | LEAPS est: '+(sR>0?'+':'')+sR+'%</div>'+
        '<div class="output-line">&nbsp;&nbsp;Bear <strong class="text-red">'+(d.l3BearProb||0)+'%</strong> → $'+(d.l3BearTarget||'—')+' | LEAPS: '+brR+'%</div>'+
        '<div class="output-line">&nbsp;&nbsp;Weighted EV = <strong style="color:'+col+'">'+(ev>0?'+':'')+Math.round(ev)+'%</strong></div>'+
        '<div class="output-line">[L4] <strong>'+instr+'</strong> · Strike $'+(d.l4Strike||'—')+' · Expiry '+(d.l4Expiry||'—')+' · Size: <strong>'+allocPct+'%</strong> ($'+allocUSD.toLocaleString()+')</div>'+
        '<div class="output-line">[L5] Checkpoints: '+cps+'</div>'+
      '</div></div>'+

      '<div class="summary-section"><div class="summary-section-header">'+
        '<span class="ss-title">Trade Card — Pre-Filled</span>'+
        '<span class="res-badge '+(conv.tier==='HIGH'?'res-pass':conv.tier==='MEDIUM'?'res-watch':'res-fail')+'">'+conv.tier+'</span>'+
      '</div><div class="summary-section-body">'+
        '<div class="trade-card-preview">'+
          row('Ticker',d.ticker||'—')+row('Date',tcDate)+row('Instrument',instr)+
          row('Entry Price','$'+(d.price||'—'))+row('Strike','$'+(d.l4Strike||'—'))+row('Expiry',d.l4Expiry||'—')+
          row('Position',allocPct+'% ($'+allocUSD.toLocaleString()+')')+
          row('EV at Entry',(ev>0?'+':'')+Math.round(ev)+'%')+row('Conviction',conv.tier)+
          row('Thesis',htmlEscape((d.seedThesis||'—').slice(0,90)))+row('Kill Switch',htmlEscape((d.killSwitch||'—').slice(0,90)))+
          row('Checkpoints',htmlEscape(cps))+
        '</div></div></div>'+

      '<div style="display:flex;gap:10px;padding-top:8px">'+
        '<button class="btn btn-primary" onclick="Wizard.logCard()">◫ Log Trade Card</button>'+
        '<button class="btn btn-ghost" onclick="Wizard.reset()">↺ New Analysis</button>'+
      '</div>'+
    '</div>';
  },

  // COLLECT
  collect() {
    const g = id => { const el = document.getElementById(id); return el?el.value.trim():''; };
    const s = this.step;
    if (s===0) {
      this.data.ticker=g('f-ticker').toUpperCase(); this.data.company=g('f-company');
      this.data.date=g('f-date'); this.data.price=parseFloat(g('f-price'))||0;
      this.data.seedThesis=g('f-seed');
      // Default sectorFit if user never clicked the toggle (AI Infra is pre-selected visually)
      if (!this.data.sectorFit) this.data.sectorFit = 'AI Infrastructure';
    }
    if (s===1) { this.data.l1RevGrowth=g('f-l1-rev'); this.data.l1GrossMargin=g('f-l1-gm'); this.data.l1GMTrend=g('f-l1-gmtrend')||'0'; this.data.l1Runway=g('f-l1-runway'); }
    if (s===2) { this.data.l2ImpliedGrowth=g('f-l2-implied'); this.data.l2ConsensusGrowth=g('f-l2-cons'); this.data.l2YourGrowth=g('f-l2-yours'); this.data.l2ShortInterest=g('f-l2-short'); this.data.l2Edge=g('f-l2-edge'); }
    if (s===3) {
      this.data.killSwitch=g('f-ks');
      this.data.l3BullProb=g('f-bull-prob'); this.data.l3BullDriver=g('f-bull-driver'); this.data.l3BullTarget=g('f-bull-target'); this.data.l3BullTimeline=g('f-bull-tl'); this.data.l3BullMethod=g('f-bull-meth');
      this.data.l3BaseProb=g('f-base-prob'); this.data.l3BaseDriver=g('f-base-driver'); this.data.l3BaseTarget=g('f-base-target'); this.data.l3BaseTimeline=g('f-base-tl');
      this.data.l3BearProb=g('f-bear-prob'); this.data.l3BearDriver=g('f-bear-driver'); this.data.l3BearTarget=g('f-bear-target'); this.data.l3BearLeaps=g('f-bear-leaps');
    }
    if (s===4) { this.data.l4Strike=g('f-l4-strike'); this.data.l4Delta=g('f-l4-delta'); this.data.l4Premium=g('f-l4-prem'); this.data.l4Expiry=g('f-l4-expiry'); }
    if (s===5) {
      for(let n=1;n<=3;n++){this.data['cp'+n+'Date']=g('f-cp'+n+'-date');this.data['cp'+n+'Event']=g('f-cp'+n+'-event');}
      this.data.exitTarget=g('f-exit-target'); this.data.exitKS=g('f-exit-ks'); this.data.exitDTE=g('f-exit-dte'); this.data.exitRotate=g('f-exit-rotate'); this.data.wcmm=g('f-wcmm');
    }
  },

  validate() {
    if (this.step===0) {
      if(!this.data.ticker){toast('Enter a ticker symbol','error');return false;}
      if(!this.data.price){toast('Enter the current stock price','error');return false;}
    }
    // F4 — require a structured edge type before proceeding past L2
    if (this.step===2) {
      if (!this.data.l2EdgeType) { toast('Select your Edge Type — what is your information advantage?','error'); return false; }
    }
    if (this.step===3) {
      if (!this.data.killSwitch) { toast('Define your kill switch before proceeding','error'); return false; }
      const s=(+this.data.l3BullProb||0)+(+this.data.l3BaseProb||0)+(+this.data.l3BearProb||0);
      if(Math.abs(s-100)>=1){toast('Probabilities must sum to 100% (current: '+s+'%)','error');return false;}
      // F3 — soft guardrail against overconfidence (Kahneman / Tetlock research)
      const bull = +this.data.l3BullProb || 0;
      if (bull > 65) { toast('⚠ Bull probability '+bull+'% is very high. Review: is this conviction or motivated reasoning? (SOP: ≤40%)','warn'); }
      else if (bull > 40) { toast('⚠ Bull probability '+bull+'% exceeds SOP guidance of ≤40%. Consider rebalancing toward base case.','warn'); }
    }
    return true;
  },

  next() { this.collect(); if (!this.validate()) return; if (this.step<this.totalSteps){this.step++;this.render();window.scrollTo(0,0);} },
  prev() { this.collect(); this.step--; this.render(); window.scrollTo(0,0); },

  bindProbInputs() {
    ['f-bull-prob','f-base-prob','f-bear-prob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', ()=>this.onProbInput());
    });
  },

  onProbInput() {
    const s=(+this.gv('f-bull-prob'))+(+this.gv('f-base-prob'))+(+this.gv('f-bear-prob'));
    const ok=Math.abs(s-100)<1;
    const fill=document.getElementById('prob-fill'), lbl=document.getElementById('prob-total-label');
    if(fill){fill.style.width=Math.min(s,100)+'%';fill.style.background=ok?'var(--c-green)':'var(--c-red)';}
    if(lbl){lbl.textContent=s+'% '+(ok?'✓':'← must equal 100%');lbl.className='prob-total-label '+(ok?'ok':'err');}
  },

  logCard() {
    const d=this.data, ps=State.settings.portfolioSize;
    const delta=+d.l4Delta||0.75, prem=+d.l4Premium||1;
    const bR=d.l3BullTarget?calcLeapsReturn(+d.price,+d.l3BullTarget,delta,prem):0;
    const sR=d.l3BaseTarget?calcLeapsReturn(+d.price,+d.l3BaseTarget,delta,prem):0;
    const brR=+d.l3BearLeaps||-80;
    const ev=calcWeightedEV({p:+d.l3BullProb||0,r:bR},{p:+d.l3BaseProb||0,r:sR},{p:+d.l3BearProb||0,r:brR});
    const conv=getConvictionTier(getEVRatio(ev,brR));
    const allocPct=conv.tier==='HIGH'?6:conv.tier==='MEDIUM'?3:0;
    State.addCard({
      id:genId(), ticker:d.ticker, company:d.company,
      entryDate:d.date||new Date().toISOString().slice(0,10),
      instrument:d.q1Catalyst===false?'Stock':'LEAPS',
      // F7 — store sector + edge type for calibration segmentation
      sectorFit:d.sectorFit||'AI Infrastructure',
      l2EdgeType:d.l2EdgeType||'',
      // F7 — model version snapshot for audit trail
      modelSnapshot:getModelSnapshot(),
      entryPrice:d.price, strike:d.l4Strike, delta:d.l4Delta, premium:d.l4Premium, expiry:d.l4Expiry,
      positionPct:allocPct, positionDollars:Math.round(ps*allocPct/100),
      ev:Math.round(ev), convictionTier:conv.tier,
      thesis:d.seedThesis, killSwitch:d.killSwitch,
      checkpoints:[1,2,3].map(n=>({date:d['cp'+n+'Date'],event:d['cp'+n+'Event']})),
      exitTarget:d.exitTarget, exitKS:d.exitKS, exitDTE:d.exitDTE, exitRotate:d.exitRotate, wcmm:d.wcmm,
      status:'open', exitDate:null, exitPrice:null, returnPct:null,
      thesisRight:null, timingRight:null, sizingRight:null, exitDiscipline:null, wouldDoDiff:null
    });
    updateCardsCount();
    toast('Trade card logged: '+d.ticker,'success');
    navigate('cards');
  }
};
