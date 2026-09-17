/* ============================================================
   AUDIT.JS — a small false-pass auditor for the write-up.
   Six rules from the article, as regex + a little structure
   over pasted Python. Illustrative port, not the production one.
   ============================================================ */
(function () {
  const root = document.getElementById('audit');
  if (!root) return;

  const SAMPLES = [
    { label: 'A false pass', code:
`# Test: open the album, take a photo, check it appears in the list
sendGM("go 12345")
sleep(2)
assert_equal(poco("ToolBar").exists(), True, "arrived at scene")

EXPECTED = 3
assert_equal(EXPECTED, EXPECTED, "photo count is correct")

sendGM("take_photo")
assert True  # photo taken` },
    { label: 'Swallowed assertion', code:
`open_page("AlbumPage")
try:
    assert_equal(poco("AlbumList").child().count(), 3)
except Exception:
    log("skipping flaky assertion")
print("done")` },
    { label: 'A real check', code:
`before = poco("AlbumList").child().count()
sendGM("take_photo")
wait_for_scene("AlbumPage")
after = poco("AlbumList").child().count()
assert_equal(after, before + 1, "one new photo in the list")` },
  ];

  // Each rule: id, severity, one-line meaning, and a check(code) that returns
  // the matching line numbers (empty = no finding).
  const RULES = [
    { id: 'SCENE_NO_VERIFY', sev: 'P0', why: 'Teleported with a GM command but never checked the scene actually changed.',
      check: (c) => {
        const go = lines(c, /sendGM\(\s*["']go\s+\d+["']/);
        if (!go.length) return [];
        return /wait_for_scene|GetCurrentSceneId|current_scene|scene_id\s*==/.test(c) ? [] : go;
      } },
    { id: 'TAUTOLOGICAL_ASSERT', sev: 'P0', why: 'Asserts that a permanent HUD element exists. True in every scene.',
      check: (c) => lines(c, /assert\w*\([^)]*poco\(\s*["'](ToolBar|HUD\w*|MainPanel|PageLayer)["']\)[^)]*\.exists\(\)/) },
    { id: 'SELF_REFERENTIAL_ASSERT', sev: 'P0', why: 'Both sides of the assertion are constants the script defined itself.',
      check: (c) => {
        const consts = new Set([...c.matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*[\d"']/gm)].map(m => m[1]));
        return lines(c, /assert_equal\(\s*(\w+)\s*,\s*(\w+)/).filter(n => {
          const m = lineAt(c, n).match(/assert_equal\(\s*(\w+)\s*,\s*(\w+)/);
          return m && (m[1] === m[2] || (consts.has(m[1]) && consts.has(m[2])));
        });
      } },
    { id: 'ASSERT_SWALLOWED', sev: 'P0', why: 'Assertion sits inside a try whose except does not re-raise, so a failure is eaten.',
      check: (c) => {
        const out = [];
        const L = c.split('\n');
        for (let i = 0; i < L.length; i++) {
          if (!/^\s*try\s*:/.test(L[i])) continue;
          const ind = L[i].match(/^\s*/)[0].length;
          let j = i + 1, hasAssert = -1, reraises = false, sawExcept = false;
          for (; j < L.length; j++) {
            const li = L[j].match(/^\s*/)[0].length;
            if (L[j].trim() && li <= ind && !/^\s*(except|finally|else)\b/.test(L[j])) break;
            if (/^\s*except\b/.test(L[j]) && li === ind) sawExcept = true;
            if (!sawExcept && /\bassert/.test(L[j])) hasAssert = j;
            if (sawExcept && /\braise\b|pytest\.fail|sys\.exit/.test(L[j])) reraises = true;
          }
          if (hasAssert >= 0 && sawExcept && !reraises) out.push(hasAssert + 1);
        }
        return out;
      } },
    { id: 'GM_SENT_ONLY', sev: 'P0', why: 'A GM command was sent and the only assertion afterwards is trivially true; its effect is never read back.',
      check: (c) => {
        const gm = lines(c, /sendGM\(|luaGM\(|sendLocalGM\(/).filter(n => !/["']go\s+\d+["']/.test(lineAt(c, n)));
        if (!gm.length) return [];
        return lines(c, /^\s*assert\s+True\b|assert_equal\(\s*True\s*,\s*True\s*\)/);
      } },
    { id: 'NO_ASSERT_AT_ALL', sev: 'P0', why: 'The script performs actions but never asserts anything.',
      check: (c) => (/\bassert/.test(c) ? [] : (c.trim() ? [1] : [])) },
  ];

  function lines(c, re) { return c.split('\n').map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean); }
  function lineAt(c, n) { return c.split('\n')[n - 1] || ''; }

  root.innerHTML = `
    <div class="forge-head"><h3>Audit a script</h3><span class="hint">6 of the 18 rules, illustrative port</span></div>
    <div class="audit-samples" id="a-samples">${SAMPLES.map((s, i) => `<button type="button" class="fbtn${i === 0 ? ' fbtn-ink' : ''}" data-i="${i}">${s.label}</button>`).join('')}</div>
    <textarea id="a-code" class="audit-code" spellcheck="false" aria-label="Python test script to audit" rows="11"></textarea>
    <div class="verdict-box" id="a-out"></div>`;

  const ta = root.querySelector('#a-code'), out = root.querySelector('#a-out');

  function run() {
    const code = ta.value;
    const findings = [];
    for (const r of RULES) for (const n of r.check(code)) findings.push({ ...r, line: n });
    const p0 = findings.filter(f => f.sev === 'P0').length;
    const pill = p0 ? `<span class="v v-no">${p0} P0 finding${p0 > 1 ? 's' : ''}</span>` : '<span class="v v-ok">audit pass</span>';
    const note = p0
      ? `<div class="verdict-why">A P0 becomes an error and drives regeneration, up to two rounds. The model gets each line below as the reason.</div>`
      : `<div class="verdict-why">Nothing here is tautological, self-referential or swallowed, and the effect of every action is read back. This green means something.</div>`;
    const list = findings.length ? `<ul class="audit-list">${findings.map(f => `<li><code>${f.id}</code> <span class="dim">line ${f.line}</span><br>${f.why}</li>`).join('')}</ul>` : '';
    out.innerHTML = `<div class="verdict-line">${pill}</div>${note}${list}`;
    highlight(findings.map(f => f.line));
  }

  function highlight(ls) { ta.dataset.bad = ls.join(','); }

  root.querySelector('#a-samples').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    root.querySelectorAll('#a-samples button').forEach(x => x.classList.remove('fbtn-ink')); b.classList.add('fbtn-ink');
    ta.value = SAMPLES[Number(b.dataset.i)].code; run();
  });
  ta.addEventListener('input', () => { root.querySelectorAll('#a-samples button').forEach(x => x.classList.remove('fbtn-ink')); run(); });

  ta.value = SAMPLES[0].code; run();
})();
