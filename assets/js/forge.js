/* ============================================================
   FORGE.JS — a browser port of RogueForge's card validator
   (backend/rogueforge/ai/validator.py + balance.py).

   Same coefficients, same (rarity, cost) bands from the real
   Slay the Spire Ironclad corpus, same repair policy.
   ============================================================ */
(function () {
  const D = window.FORGE_DATA;
  const COEF = D.coef, SW = D.sw, BANDS = D.bands;

  const ALLOWED_KINDS = ['deal_damage', 'gain_block', 'draw', 'gain_energy', 'apply_status', 'gain_status', 'lose_hp', 'heal'];
  const STATUSES = ['vulnerable', 'weak', 'frail', 'strength', 'dexterity', 'poison', 'regen', 'metallicize', 'ritual', 'thorns'];
  const POWER_ONLY = new Set(['strength', 'metallicize', 'ritual', 'regen', 'thorns']);
  const RARITY_ORDER = ['Basic', 'Common', 'Uncommon', 'Rare'];
  const FLOOR_FRAC = { Basic: 0, Common: 0, Uncommon: 0.35, Rare: 0.6 };
  const DIFF_MULT = { easy: 1.10, normal: 1.0, hard: 0.90 };
  const MAX_HITS = 8, REPAIR_THRESHOLD = 0.5, CHEAP_POWER = 0.8;
  const ANCIENT_CEIL = 1.6, ANCIENT_FLOOR = 0.65;

  const KIND_LABEL = {
    deal_damage: 'Deal damage', gain_block: 'Gain block', draw: 'Draw cards', gain_energy: 'Gain energy',
    apply_status: 'Apply status to enemy', gain_status: 'Gain status', lose_hp: 'Lose HP', heal: 'Heal',
  };

  function powerScore(card) {
    let s = 0;
    for (const e of card.effects) {
      const c = COEF[e.kind] || 0;
      if (e.kind === 'deal_damage') s += c * e.amount * Math.max(1, e.hits || 1);
      else if ((e.kind === 'apply_status' || e.kind === 'gain_status') && e.status) s += c * e.amount * (SW[e.status] ?? 1);
      else s += c * e.amount;
    }
    if (card.exhaust) s += COEF.exhaust_bonus;
    return Math.round(s * 1e4) / 1e4;
  }

  function rawBand(rarity, cost) {
    const key = `${rarity}/${Math.min(3, Math.max(0, cost))}`;
    return BANDS[key] || [0, 10];
  }

  function effectiveBand(rarity, cost, difficulty) {
    if (rarity === 'Ancient') {
      const [, rc] = effectiveBand('Rare', cost, difficulty);
      const ceiling = rc * ANCIENT_CEIL;
      return [ANCIENT_FLOOR * ceiling, ceiling];
    }
    const idx = RARITY_ORDER.includes(rarity) ? RARITY_ORDER.indexOf(rarity) : 1;
    let ceiling = 0;
    for (let i = 0; i <= idx; i++) ceiling = Math.max(ceiling, rawBand(RARITY_ORDER[i], cost)[1]);
    ceiling *= DIFF_MULT[difficulty] ?? 1;
    return [(FLOOR_FRAC[rarity] ?? 0) * ceiling, ceiling];
  }

  function clone(card) { return JSON.parse(JSON.stringify(card)); }

  function clampDown(card, target) {
    const c = clone(card);
    for (let i = 0; i < 50; i++) {
      if (powerScore(c) <= target) break;
      let idx = -1, best = -Infinity;
      c.effects.forEach((e, j) => { const v = (COEF[e.kind] || 0) * e.amount; if (v > best) { best = v; idx = j; } });
      if (idx === -1 || c.effects[idx].amount <= 1) break;
      c.effects[idx].amount -= 1;
    }
    return c;
  }

  function boostUp(card, target, ceiling) {
    const c = clone(card);
    for (let i = 0; i < 50; i++) {
      if (powerScore(c) >= target) break;
      let idx = -1, best = Infinity;
      c.effects.forEach((e, j) => { const v = COEF[e.kind] || 0; if (v > 0 && v < best) { best = v; idx = j; } });
      if (idx === -1) break;
      c.effects[idx].amount += 1;
      if (powerScore(c) > ceiling) { c.effects[idx].amount -= 1; break; }
    }
    return c;
  }

  function diff(a, b) {
    const out = [];
    a.effects.forEach((e, i) => { if (e.amount !== b.effects[i].amount) out.push({ kind: e.kind, from: e.amount, to: b.effects[i].amount }); });
    return out;
  }

  /* Returns {verdict, card, reasons, score, band, diff, stage} */
  function validate(card, difficulty = 'normal') {
    const R = (reason, stage) => ({ verdict: 'rejected', card: null, reasons: [reason], score: null, band: null, diff: [], stage });

    // 1. Schema
    if (!card.name || !card.name.trim()) return R('schema: name is required', 'schema');
    if (!['Attack', 'Skill', 'Power'].includes(card.type)) return R(`schema: unknown card type ${card.type}`, 'schema');
    if (!card.effects.length) return R('schema: a card needs at least one effect', 'schema');
    for (const e of card.effects) {
      if (!(Number.isInteger(e.amount) && e.amount >= 1)) return R(`schema: amount must be a whole number ≥ 1 (${e.kind})`, 'schema');
      if ((e.kind === 'apply_status' || e.kind === 'gain_status') && !e.status) return R(`schema: ${e.kind} needs a status`, 'schema');
    }

    // 2. Mechanic allowlist
    for (const e of card.effects) {
      if (!ALLOWED_KINDS.includes(e.kind)) return R(`unknown effect kind: ${e.kind}`, 'allowlist');
      if (e.status && !STATUSES.includes(e.status)) return R(`unsupported status: ${e.status}`, 'allowlist');
      if ((e.hits || 1) > MAX_HITS) return R(`too many hits: ${e.hits} (max ${MAX_HITS})`, 'allowlist');
    }

    // 2b. Type discipline
    for (const e of card.effects) {
      if (e.kind === 'deal_damage' && card.type !== 'Attack') return R(`deal_damage is Attack-only — this card is a ${card.type}`, 'type');
      if (e.status === 'poison' && card.type !== 'Skill') return R(`poison is Skill-only — this card is a ${card.type}`, 'type');
      if (e.kind === 'gain_status' && POWER_ONLY.has(e.status) && card.type !== 'Power') return R(`${e.status} is a Power-only buff — this card is a ${card.type}`, 'type');
    }

    // 3. Power band
    const score = powerScore(card);
    let [floor, ceiling] = effectiveBand(card.rarity, card.cost, difficulty);
    if (card.type === 'Power' && card.cost <= 1) { floor *= CHEAP_POWER; ceiling *= CHEAP_POWER; }
    const band = [floor, ceiling];

    if (floor <= score && score <= ceiling) return { verdict: 'accepted', card, reasons: [], score, band, diff: [], stage: 'band' };

    const edge = score > ceiling ? ceiling : floor;
    const deviation = edge ? Math.abs(score - edge) / edge : Math.abs(score - edge);
    if (deviation <= REPAIR_THRESHOLD) {
      const repaired = score > ceiling ? clampDown(card, ceiling) : boostUp(card, floor, ceiling);
      const ns = powerScore(repaired);
      if (floor <= ns && ns <= ceiling) {
        return { verdict: 'repaired', card: repaired, reasons: [], score: ns, band, diff: diff(card, repaired), scoreBefore: score, stage: 'band' };
      }
    }
    return { verdict: 'rejected', card: null, reasons: [`power_score ${score.toFixed(2)} outside band [${floor.toFixed(2)}, ${ceiling.toFixed(2)}]`], score, band, diff: [], stage: 'band', deviation };
  }

  function renderEffect(e) {
    const n = e.amount;
    switch (e.kind) {
      case 'deal_damage': return e.hits > 1 ? `Deal ${n} damage ${e.hits === 2 ? 'twice' : e.hits + ' times'}.` : `Deal ${n} damage.`;
      case 'gain_block': return `Gain ${n} Block.`;
      case 'draw': return `Draw ${n} card${n === 1 ? '' : 's'}.`;
      case 'gain_energy': return `Gain ${n} Energy.`;
      case 'apply_status': return `Apply ${n} ${cap(e.status)}.`;
      case 'gain_status': return `Gain ${n} ${cap(e.status)}.`;
      case 'lose_hp': return `Lose ${n} HP.`;
      case 'heal': return `Heal ${n} HP.`;
      default: return '';
    }
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  window.Forge = { validate, powerScore, effectiveBand, rawBand, renderEffect, ALLOWED_KINDS, STATUSES, KIND_LABEL, COEF, SW, corpus: D.corpus };
})();

/* ── UI: the interactive forge widget ───────────────────────── */
(function () {
  const F = window.Forge;
  const root = document.getElementById('forge');
  if (!root) return;

  const NAMES = ['Gut Punch', 'Iron Resolve', 'Ashen Vow', 'Bloodlet', 'Bulwark', 'Cinder Lash', 'Second Wind', 'Rusted Crown', 'Hollow Strike', 'Ember Ward'];

  // A few "what an LLM actually hands you" presets, drawn from the project's own logs.
  const PRESETS = [
    { name: 'Gut Punch', type: 'Attack', rarity: 'Common', cost: 1, effects: [{ kind: 'deal_damage', amount: 12, hits: 1 }, { kind: 'apply_status', amount: 1, status: 'weak' }] },
    { name: 'Overreach', type: 'Attack', rarity: 'Common', cost: 1, effects: [{ kind: 'deal_damage', amount: 40, hits: 1 }] },
    { name: 'Venom Fang', type: 'Attack', rarity: 'Uncommon', cost: 1, effects: [{ kind: 'deal_damage', amount: 6, hits: 1 }, { kind: 'apply_status', amount: 3, status: 'poison' }] },
    { name: 'Meek Relic', type: 'Skill', rarity: 'Rare', cost: 2, effects: [{ kind: 'gain_block', amount: 5, hits: 1 }] },
    { name: 'Mend', type: 'Skill', rarity: 'Common', cost: 1, effects: [{ kind: 'heal', amount: 44, hits: 1 }] },
    { name: 'Heart of the Spire', type: 'Power', rarity: 'Ancient', cost: 3, effects: [{ kind: 'gain_status', amount: 3, status: 'ritual' }, { kind: 'gain_status', amount: 5, status: 'metallicize' }] },
  ];

  let card = JSON.parse(JSON.stringify(PRESETS[0]));
  let presetIdx = 0;

  root.innerHTML = `
    <div class="forge-head"><h3>Forge a card</h3><span class="hint">RogueForge validator, in your browser</span></div>
    <div class="forge-row">
      <div><label for="f-name">Name</label><input id="f-name" type="text" maxlength="28" /></div>
      <div><label for="f-type">Type</label><select id="f-type"><option>Attack</option><option>Skill</option><option>Power</option></select></div>
      <div><label for="f-rarity">Rarity</label><select id="f-rarity"><option>Common</option><option>Uncommon</option><option>Rare</option><option>Ancient</option></select></div>
    </div>
    <div class="forge-row forge-row-2">
      <div><label for="f-cost">Cost</label><select id="f-cost"><option>0</option><option>1</option><option>2</option><option>3</option></select></div>
      <div><label for="f-diff">Difficulty</label><select id="f-diff"><option value="easy">Embers (easy)</option><option value="normal" selected>Forge (normal)</option><option value="hard">Inferno (hard)</option></select></div>
    </div>
    <div class="effects" id="f-effects"></div>
    <div class="forge-actions">
      <button class="fbtn" id="f-add" type="button">Add effect</button>
      <button class="fbtn fbtn-ink" id="f-next" type="button">Next card the model wrote</button>
    </div>
    <div class="verdict-box" id="f-out"></div>
  `;

  const $ = (id) => root.querySelector('#' + id);
  const effectsEl = $('f-effects');

  function bindTop() {
    $('f-name').value = card.name; $('f-type').value = card.type; $('f-rarity').value = card.rarity; $('f-cost').value = String(card.cost);
  }

  function renderEffects() {
    effectsEl.innerHTML = card.effects.map((e, i) => `
      <div class="effect" data-i="${i}">
        <select data-k="kind" aria-label="Effect kind">${F.ALLOWED_KINDS.map(k => `<option value="${k}"${k === e.kind ? ' selected' : ''}>${F.KIND_LABEL[k]}</option>`).join('')}</select>
        <input data-k="amount" type="number" min="1" max="99" value="${e.amount}" aria-label="Amount" />
        ${(e.kind === 'apply_status' || e.kind === 'gain_status')
          ? `<select data-k="status" aria-label="Status">${F.STATUSES.map(s => `<option value="${s}"${s === e.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`
          : e.kind === 'deal_damage'
            ? `<select data-k="hits" aria-label="Hits"><option value="1"${(e.hits||1)===1?' selected':''}>once</option><option value="2"${e.hits===2?' selected':''}>twice</option><option value="3"${e.hits===3?' selected':''}>3 times</option><option value="4"${e.hits===4?' selected':''}>4 times</option><option value="9"${e.hits===9?' selected':''}>9 times (too many)</option></select>`
            : `<span></span>`}
        <button class="x" type="button" aria-label="Remove effect" ${card.effects.length === 1 ? 'disabled' : ''}>×</button>
      </div>`).join('');
  }

  function readForm() {
    card.name = $('f-name').value; card.type = $('f-type').value; card.rarity = $('f-rarity').value; card.cost = Number($('f-cost').value);
    card.effects = [...effectsEl.querySelectorAll('.effect')].map(row => {
      const kind = row.querySelector('[data-k=kind]').value;
      const amount = Number(row.querySelector('[data-k=amount]').value);
      const st = row.querySelector('[data-k=status]'); const h = row.querySelector('[data-k=hits]');
      const e = { kind, amount: Number.isFinite(amount) ? amount : 0 };
      if (st) e.status = st.value; else if (kind === 'apply_status' || kind === 'gain_status') e.status = 'vulnerable';
      if (h) e.hits = Number(h.value);
      return e;
    });
  }

  function fmt(x) { return (Math.round(x * 100) / 100).toFixed(2); }

  function renderOut() {
    const r = F.validate(card, $('f-diff').value);
    const out = $('f-out');
    const pill = r.verdict === 'accepted' ? '<span class="v v-ok">accepted</span>' : r.verdict === 'repaired' ? '<span class="v v-fix">repaired</span>' : '<span class="v v-no">rejected</span>';
    let why = '';
    if (r.verdict === 'accepted') why = `Scores like a real ${card.rarity} ${card.cost}-cost card. Served as written.`;
    if (r.verdict === 'repaired') {
      const d = r.diff.map(x => `<b>${F.KIND_LABEL[x.kind].toLowerCase()} ${x.from}→${x.to}</b>`).join(', ');
      why = `Scored <b>${fmt(r.scoreBefore)}</b>, ${r.scoreBefore > r.band[1] ? 'over' : 'under'} the band but within 50% of the edge. ${r.scoreBefore > r.band[1] ? 'Clamped the biggest contributor down' : 'Lifted the finest-grained effect up'}: ${d}. The rules text is re-rendered from the new numbers.`;
    }
    if (r.verdict === 'rejected') {
      const stage = { schema: 'Schema check', allowlist: 'Mechanic allowlist', type: 'Type discipline', band: 'Power budget' }[r.stage];
      why = `<b>${stage}:</b> ${r.reasons[0]}.` + (r.stage === 'band' ? ` ${Math.round(r.deviation * 100)}% past the edge, beyond the 50% repair limit. Sent back to the model with this reason; three strikes and a curated card ships instead.` : ' Sent back to the model with this reason so the retry can fix it.');
    }

    // band meter
    let meter = '';
    if (r.band) {
      const [lo, hi] = r.band; const s = r.score; const before = r.scoreBefore ?? s;
      const max = Math.max(hi * 1.45, before * 1.1, s * 1.1, 1);
      const pct = (v) => Math.min(100, Math.max(0, v / max * 100));
      const color = r.verdict === 'accepted' ? 'var(--ok)' : r.verdict === 'repaired' ? 'var(--fix)' : 'var(--no)';
      meter = `<div class="band" aria-hidden="true">
        <div class="in" style="left:${pct(lo)}%;width:${pct(hi) - pct(lo)}%"></div>
        ${r.verdict === 'repaired' ? `<div class="pin was" style="left:${pct(before)}%;background:${color}"></div>` : ''}
        <div class="pin" style="left:${pct(s)}%;background:${color}"></div>
      </div>
      <div class="band-labels"><span>0</span><span>${fmt(max)}</span></div>`;
    }

    // card
    const shown = r.card || card;
    const text = shown.effects.map((e, i) => {
      const d = r.diff.find(x => x.kind === e.kind && card.effects[i] && card.effects[i].amount === x.from);
      if (d) { const before = { ...e, amount: d.from }; return `<del>${F.renderEffect(before)}</del><ins>${F.renderEffect(e)}</ins>`; }
      return F.renderEffect(e);
    }).join(' ');
    const cardHtml = `<div class="fcard" aria-label="Rendered card">
      <div class="cost">${shown.cost}</div>
      <div class="name">${esc(shown.name || 'Untitled')}</div>
      <div class="meta">${shown.rarity} ${shown.type}</div>
      <div class="text">${text}</div>
    </div>`;

    out.innerHTML = `<div class="verdict-line">${pill}${r.score != null ? `<span class="score">power ${fmt(r.score)}</span>` : ''}${r.band ? `<span class="score">band ${fmt(r.band[0])} – ${fmt(r.band[1])}</span>` : ''}</div>${meter}<div class="verdict-why">${why}</div>${cardHtml}`;
  }

  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function update() { readForm(); renderOut(); }
  function full() { bindTop(); renderEffects(); renderOut(); }

  root.addEventListener('input', (e) => { if (e.target.matches('input, select')) update(); });
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-k=kind]')) { readForm(); renderEffects(); renderOut(); }
  });
  effectsEl.addEventListener('click', (e) => {
    const x = e.target.closest('.x'); if (!x) return;
    readForm(); card.effects.splice(Number(x.closest('.effect').dataset.i), 1); renderEffects(); renderOut();
  });
  $('f-add').addEventListener('click', () => { readForm(); card.effects.push({ kind: 'gain_block', amount: 5 }); renderEffects(); renderOut(); });
  $('f-next').addEventListener('click', () => { presetIdx = (presetIdx + 1) % PRESETS.length; card = JSON.parse(JSON.stringify(PRESETS[presetIdx])); full(); });

  full();
})();
