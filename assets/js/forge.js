/* ============================================================
   FORGE.JS — a browser port of RogueForge's card validator
   (backend/rogueforge/ai/validator.py + balance.py).

   Same coefficients, same (rarity, cost) bands from the real
   Slay the Spire Ironclad corpus, same repair policy.
   ============================================================ */
/* Chinese labels when the page is in Chinese (window.KN_LANG, set in index.html). */
const FORGE_ZH = window.KN_LANG === 'zh';
const FZ = {
  type: { Attack: '攻击', Skill: '技能', Power: '能力' },
  rarity: { Basic: '基础', Common: '普通', Uncommon: '罕见', Rare: '稀有', Ancient: '远古' },
  status: { vulnerable: '易伤', weak: '虚弱', frail: '脆弱', strength: '力量', dexterity: '敏捷', poison: '中毒', regen: '再生', metallicize: '金属化', ritual: '仪式', thorns: '荆棘' },
  kind: { deal_damage: '造成伤害', gain_block: '获得格挡', draw: '抽牌', gain_energy: '获得能量', apply_status: '给敌人上状态', gain_status: '给自己上状态', lose_hp: '失去生命', heal: '回复生命' },
  stage: { schema: '结构检查', allowlist: '机制白名单', type: '牌型限制', band: '强度预算' },
};
const fz = (group, key) => (FORGE_ZH && FZ[group][key]) || key;

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

  const KIND_LABEL = FORGE_ZH ? FZ.kind : {
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
    if (!card.name || !card.name.trim()) return R(FORGE_ZH ? '卡牌得有名字' : 'schema: name is required', 'schema');
    if (!['Attack', 'Skill', 'Power'].includes(card.type)) return R(FORGE_ZH ? `没有「${card.type}」这种牌型` : `schema: unknown card type ${card.type}`, 'schema');
    if (!card.effects.length) return R(FORGE_ZH ? '一张卡至少要有一个效果' : 'schema: a card needs at least one effect', 'schema');
    for (const e of card.effects) {
      if (!(Number.isInteger(e.amount) && e.amount >= 1)) return R(FORGE_ZH ? `「${fz('kind', e.kind)}」的数值得是不小于 1 的整数` : `schema: amount must be a whole number ≥ 1 (${e.kind})`, 'schema');
      if ((e.kind === 'apply_status' || e.kind === 'gain_status') && !e.status) return R(FORGE_ZH ? `「${fz('kind', e.kind)}」没选状态` : `schema: ${e.kind} needs a status`, 'schema');
    }

    // 2. Mechanic allowlist
    for (const e of card.effects) {
      if (!ALLOWED_KINDS.includes(e.kind)) return R(FORGE_ZH ? `没有「${e.kind}」这种效果` : `unknown effect kind: ${e.kind}`, 'allowlist');
      if (e.status && !STATUSES.includes(e.status)) return R(FORGE_ZH ? `不支持「${e.status}」这个状态` : `unsupported status: ${e.status}`, 'allowlist');
      if ((e.hits || 1) > MAX_HITS) return R(FORGE_ZH ? `打 ${e.hits} 次太多了，最多 ${MAX_HITS} 次` : `too many hits: ${e.hits} (max ${MAX_HITS})`, 'allowlist');
    }

    // 2b. Type discipline
    for (const e of card.effects) {
      if (e.kind === 'deal_damage' && card.type !== 'Attack') return R(FORGE_ZH ? `只有攻击牌能造成伤害，这张是${fz('type', card.type)}牌` : `deal_damage is Attack-only — this card is a ${card.type}`, 'type');
      if (e.status === 'poison' && card.type !== 'Skill') return R(FORGE_ZH ? `只有技能牌能上中毒，这张是${fz('type', card.type)}牌` : `poison is Skill-only — this card is a ${card.type}`, 'type');
      if (e.kind === 'gain_status' && POWER_ONLY.has(e.status) && card.type !== 'Power') return R(FORGE_ZH ? `「${fz('status', e.status)}」只能放在能力牌上，这张是${fz('type', card.type)}牌` : `${e.status} is a Power-only buff — this card is a ${card.type}`, 'type');
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
    return { verdict: 'rejected', card: null, reasons: [FORGE_ZH ? `强度 ${score.toFixed(2)}，不在 ${floor.toFixed(2)} 到 ${ceiling.toFixed(2)} 之间` : `power_score ${score.toFixed(2)} outside band [${floor.toFixed(2)}, ${ceiling.toFixed(2)}]`], score, band, diff: [], stage: 'band', deviation };
  }

  function renderEffect(e) {
    const n = e.amount;
    if (FORGE_ZH) {
      switch (e.kind) {
        case 'deal_damage': return e.hits > 1 ? `造成 ${n} 点伤害 ${e.hits} 次。` : `造成 ${n} 点伤害。`;
        case 'gain_block': return `获得 ${n} 点格挡。`;
        case 'draw': return `抽 ${n} 张牌。`;
        case 'gain_energy': return `获得 ${n} 点能量。`;
        case 'apply_status': return `给予 ${n} 层${fz('status', e.status)}。`;
        case 'gain_status': return `获得 ${n} 层${fz('status', e.status)}。`;
        case 'lose_hp': return `失去 ${n} 点生命。`;
        case 'heal': return `回复 ${n} 点生命。`;
        default: return '';
      }
    }
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
  const ZH_NAMES = { 'Gut Punch': '当胸一拳', 'Overreach': '用力过猛', 'Venom Fang': '毒牙', 'Meek Relic': '怯懦遗物', 'Mend': '缝补', 'Heart of the Spire': '尖塔之心' };
  const PRESETS = [
    { name: 'Gut Punch', type: 'Attack', rarity: 'Common', cost: 1, effects: [{ kind: 'deal_damage', amount: 12, hits: 1 }, { kind: 'apply_status', amount: 1, status: 'weak' }] },
    { name: 'Overreach', type: 'Attack', rarity: 'Common', cost: 1, effects: [{ kind: 'deal_damage', amount: 40, hits: 1 }] },
    { name: 'Venom Fang', type: 'Attack', rarity: 'Uncommon', cost: 1, effects: [{ kind: 'deal_damage', amount: 6, hits: 1 }, { kind: 'apply_status', amount: 3, status: 'poison' }] },
    { name: 'Meek Relic', type: 'Skill', rarity: 'Rare', cost: 2, effects: [{ kind: 'gain_block', amount: 5, hits: 1 }] },
    { name: 'Mend', type: 'Skill', rarity: 'Common', cost: 1, effects: [{ kind: 'heal', amount: 44, hits: 1 }] },
    { name: 'Heart of the Spire', type: 'Power', rarity: 'Ancient', cost: 3, effects: [{ kind: 'gain_status', amount: 3, status: 'ritual' }, { kind: 'gain_status', amount: 5, status: 'metallicize' }] },
  ];

  if (FORGE_ZH) PRESETS.forEach(p => { p.name = ZH_NAMES[p.name] || p.name; });

  let card = JSON.parse(JSON.stringify(PRESETS[0]));
  let presetIdx = 0;

  const L = (en, zh) => FORGE_ZH ? zh : en;
  const opts = (group, keys) => keys.map(k => `<option value="${k}">${fz(group, k)}</option>`).join('');
  root.innerHTML = `
    <div class="forge-head"><h3>${L('Forge a card', '做一张卡')}</h3><span class="hint">${L('RogueForge validator, in your browser', 'RogueForge 的校验器，直接在浏览器里跑')}</span></div>
    <div class="forge-row">
      <div><label for="f-name">${L('Name', '名字')}</label><input id="f-name" type="text" maxlength="28" /></div>
      <div><label for="f-type">${L('Type', '类型')}</label><select id="f-type">${opts('type', ['Attack', 'Skill', 'Power'])}</select></div>
      <div><label for="f-rarity">${L('Rarity', '稀有度')}</label><select id="f-rarity">${opts('rarity', ['Common', 'Uncommon', 'Rare', 'Ancient'])}</select></div>
    </div>
    <div class="forge-row forge-row-2">
      <div><label for="f-cost">${L('Cost', '费用')}</label><select id="f-cost"><option>0</option><option>1</option><option>2</option><option>3</option></select></div>
      <div><label for="f-diff">${L('Difficulty', '难度')}</label><select id="f-diff"><option value="easy">${L('Embers (easy)', '余烬（简单）')}</option><option value="normal" selected>${L('Forge (normal)', '锻炉（普通）')}</option><option value="hard">${L('Inferno (hard)', '炼狱（困难）')}</option></select></div>
    </div>
    <button type="button" class="effects-toggle" id="f-toggle" aria-expanded="true" aria-controls="f-effects"><span></span></button>
    <div class="effects" id="f-effects"></div>
    <div class="forge-actions">
      <button class="fbtn" id="f-add" type="button">${L('Add effect', '加一个效果')}</button>
      <button class="fbtn fbtn-ink" id="f-next" type="button">${L('Next card the model wrote', '换一张模型写的卡')}</button>
    </div>
    <div class="verdict-box" id="f-out"></div>
  `;

  const $ = (id) => root.querySelector('#' + id);
  const effectsEl = $('f-effects');

  function bindTop() {
    $('f-name').value = card.name; $('f-type').value = card.type; $('f-rarity').value = card.rarity; $('f-cost').value = String(card.cost);
  }

  function syncToggle() {
    const t = $('f-toggle'); if (!t) return;
    const n = card.effects.length;
    t.querySelector('span').textContent = FORGE_ZH
      ? `${n} 个效果：` + card.effects.map(e => F.renderEffect(e).replace(/。$/, '')).join('，')
      : `${n} effect${n === 1 ? '' : 's'}: ` + card.effects.map(e => F.renderEffect(e).replace(/\.$/, '')).join(', ');
  }

  function renderEffects() {
    effectsEl.innerHTML = card.effects.map((e, i) => `
      <div class="effect" data-i="${i}">
        <select data-k="kind" aria-label="Effect kind">${F.ALLOWED_KINDS.map(k => `<option value="${k}"${k === e.kind ? ' selected' : ''}>${F.KIND_LABEL[k]}</option>`).join('')}</select>
        <input data-k="amount" type="number" min="1" max="99" value="${e.amount}" aria-label="Amount" />
        ${(e.kind === 'apply_status' || e.kind === 'gain_status')
          ? `<select data-k="status" aria-label="${L('Status', '状态')}">${F.STATUSES.map(s => `<option value="${s}"${s === e.status ? ' selected' : ''}>${fz('status', s)}</option>`).join('')}</select>`
          : e.kind === 'deal_damage'
            ? `<select data-k="hits" aria-label="${L('Hits', '次数')}"><option value="1"${(e.hits||1)===1?' selected':''}>${L('once', '1 次')}</option><option value="2"${e.hits===2?' selected':''}>${L('twice', '2 次')}</option><option value="3"${e.hits===3?' selected':''}>${L('3 times', '3 次')}</option><option value="4"${e.hits===4?' selected':''}>${L('4 times', '4 次')}</option><option value="9"${e.hits===9?' selected':''}>${L('9 times (too many)', '9 次（太多了）')}</option></select>`
            : `<span></span>`}
        <button class="x" type="button" aria-label="Remove effect" ${card.effects.length === 1 ? 'disabled' : ''}>×</button>
      </div>`).join('');
    syncToggle();
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
    const pill = r.verdict === 'accepted' ? `<span class="v v-ok">${L('accepted', '通过')}</span>` : r.verdict === 'repaired' ? `<span class="v v-fix">${L('repaired', '调整后通过')}</span>` : `<span class="v v-no">${L('rejected', '退回')}</span>`;
    let why = '';
    const over = r.band && r.scoreBefore > r.band[1];
    if (r.verdict === 'accepted') why = FORGE_ZH
      ? `分数和真实的${fz('rarity', card.rarity)} ${card.cost} 费卡差不多，原样上桌。`
      : `Scores like a real ${card.rarity} ${card.cost}-cost card. Served as written.`;
    if (r.verdict === 'repaired') {
      const d = r.diff.map(x => `<b>${FORGE_ZH ? F.KIND_LABEL[x.kind] : F.KIND_LABEL[x.kind].toLowerCase()} ${x.from}→${x.to}</b>`).join(FORGE_ZH ? '，' : ', ');
      why = FORGE_ZH
        ? `原本 <b>${fmt(r.scoreBefore)}</b> 分，${over ? '高出' : '低于'}范围，但离边界不到 50%。${over ? '把影响最大的效果往下调' : '把最细的那个效果往上加'}：${d}。卡面文字按新数字重写。`
        : `Scored <b>${fmt(r.scoreBefore)}</b>, ${over ? 'over' : 'under'} the band but within 50% of the edge. ${over ? 'Clamped the biggest contributor down' : 'Lifted the finest-grained effect up'}: ${d}. The rules text is re-rendered from the new numbers.`;
    }
    if (r.verdict === 'rejected') {
      const stage = FORGE_ZH ? FZ.stage[r.stage] : { schema: 'Schema check', allowlist: 'Mechanic allowlist', type: 'Type discipline', band: 'Power budget' }[r.stage];
      why = FORGE_ZH
        ? `<b>${stage}：</b>${r.reasons[0]}。` + (r.stage === 'band' ? `超出边界 ${Math.round(r.deviation * 100)}%，已经超过能调整的 50%。带着原因退回给模型重做；连退三次，就换上一张人工准备好的卡。` : '带着原因退回给模型，让它下次改对。')
        : `<b>${stage}:</b> ${r.reasons[0]}.` + (r.stage === 'band' ? ` ${Math.round(r.deviation * 100)}% past the edge, beyond the 50% repair limit. Sent back to the model with this reason; three strikes and a curated card ships instead.` : ' Sent back to the model with this reason so the retry can fix it.');
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
    const cardHtml = `<div class="fcard" aria-label="${L('Rendered card', '卡面')}">
      <div class="cost">${shown.cost}</div>
      <div class="name">${esc(shown.name || L('Untitled', '未命名'))}</div>
      <div class="meta">${FORGE_ZH ? fz('rarity', shown.rarity) + ' · ' + fz('type', shown.type) : shown.rarity + ' ' + shown.type}</div>
      <div class="text">${text}</div>
    </div>`;

    out.innerHTML = `<div class="verdict-line">${pill}${r.score != null ? `<span class="score">${L('power', '强度')} ${fmt(r.score)}</span>` : ''}${r.band ? `<span class="score">${L('band', '范围')} ${fmt(r.band[0])} – ${fmt(r.band[1])}</span>` : ''}</div>${meter}<div class="verdict-why">${why}</div>${cardHtml}`;
  }

  function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function update() { readForm(); renderOut(); syncToggle(); }
  function full() { bindTop(); renderEffects(); renderOut(); }

  root.addEventListener('input', (e) => { if (e.target.matches('input, select')) update(); });
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-k=kind]')) { readForm(); renderEffects(); renderOut(); }
  });
  effectsEl.addEventListener('click', (e) => {
    const x = e.target.closest('.x'); if (!x) return;
    readForm(); card.effects.splice(Number(x.closest('.effect').dataset.i), 1); renderEffects(); renderOut();
  });
  $('f-toggle').addEventListener('click', () => {
    const open = $('f-toggle').getAttribute('aria-expanded') !== 'true';
    $('f-toggle').setAttribute('aria-expanded', String(open));
    root.classList.toggle('effects-collapsed', !open);
  });
  $('f-add').addEventListener('click', () => { readForm(); card.effects.push({ kind: 'gain_block', amount: 5 }); renderEffects(); renderOut(); });
  $('f-next').addEventListener('click', () => { presetIdx = (presetIdx + 1) % PRESETS.length; card = JSON.parse(JSON.stringify(PRESETS[presetIdx])); full(); });

  full();
})();
