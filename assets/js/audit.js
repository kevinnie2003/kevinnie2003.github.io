/* ============================================================
   AUDIT.JS — a small false-pass auditor for the write-up.
   Six rules from the article, as regex + a little structure
   over pasted Python. Illustrative port, not the production one.
   ============================================================ */
(function () {
  const root = document.getElementById('audit');
  if (!root) return;
  // The Chinese page (writing/*.zh.html) gets Chinese labels
  const ZH = /^zh/i.test(document.documentElement.lang || '');
  const L = (en, zh) => (ZH ? zh : en);

  const SAMPLES = [
    { label: L('A false pass', '一个假通过'), code:
`# ${L('Test: open the album, take a photo, check it appears in the list', '测试：打开相册，拍一张照片，确认它出现在列表里')}
sendGM("go 12345")
sleep(2)
assert_equal(poco("ToolBar").exists(), True, "arrived at scene")

EXPECTED = 3
assert_equal(EXPECTED, EXPECTED, "photo count is correct")

sendGM("take_photo")
assert True  # photo taken` },
    { label: L('Swallowed assertion', '被吞掉的断言'), code:
`open_page("AlbumPage")
try:
    assert_equal(poco("AlbumList").child().count(), 3)
except Exception:
    log("skipping flaky assertion")
print("done")` },
    { label: L('A real check', '真正的检查'), code:
`before = poco("AlbumList").child().count()
sendGM("take_photo")
wait_for_scene("AlbumPage")
after = poco("AlbumList").child().count()
assert_equal(after, before + 1, "one new photo in the list")` },
  ];

  // Each rule: id, severity, one-line meaning, and a check(code) that returns
  // the matching line numbers (empty = no finding).
  const RULES = [
    { id: 'SCENE_NO_VERIFY', sev: 'P0', why: L('Teleported with a GM command but never checked the scene actually changed.', '用 GM 指令传送了，却没检查场景到底有没有切过去。'),
      check: (c) => {
        const go = lines(c, /sendGM\(\s*["']go\s+\d+["']/);
        if (!go.length) return [];
        return /wait_for_scene|GetCurrentSceneId|current_scene|scene_id\s*==/.test(c) ? [] : go;
      } },
    { id: 'TAUTOLOGICAL_ASSERT', sev: 'P0', why: L('Asserts that a permanent HUD element exists. True in every scene.', '断言一个一直都在的 HUD 元素存在，在哪个场景都成立。'),
      check: (c) => lines(c, /assert\w*\([^)]*poco\(\s*["'](ToolBar|HUD\w*|MainPanel|PageLayer)["']\)[^)]*\.exists\(\)/) },
    { id: 'SELF_REFERENTIAL_ASSERT', sev: 'P0', why: L('Both sides of the assertion are constants the script defined itself.', '断言两边都是脚本自己定义的常量。'),
      check: (c) => {
        const consts = new Set([...c.matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*[\d"']/gm)].map(m => m[1]));
        return lines(c, /assert_equal\(\s*(\w+)\s*,\s*(\w+)/).filter(n => {
          const m = lineAt(c, n).match(/assert_equal\(\s*(\w+)\s*,\s*(\w+)/);
          return m && (m[1] === m[2] || (consts.has(m[1]) && consts.has(m[2])));
        });
      } },
    { id: 'ASSERT_SWALLOWED', sev: 'P0', why: L('Assertion sits inside a try whose except does not re-raise, so a failure is eaten.', '断言写在 try 里，except 又没有重新抛出，失败直接被吃掉了。'),
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
    { id: 'GM_SENT_ONLY', sev: 'P0', why: L('A GM command was sent and the only assertion afterwards is trivially true; its effect is never read back.', '发了 GM 指令，之后唯一的断言永远为真，指令到底生没生效从没读回来。'),
      check: (c) => {
        const gm = lines(c, /sendGM\(|luaGM\(|sendLocalGM\(/).filter(n => !/["']go\s+\d+["']/.test(lineAt(c, n)));
        if (!gm.length) return [];
        return lines(c, /^\s*assert\s+True\b|assert_equal\(\s*True\s*,\s*True\s*\)/);
      } },
    { id: 'NO_ASSERT_AT_ALL', sev: 'P0', why: L('The script performs actions but never asserts anything.', '脚本做了一堆操作，却一条断言都没有。'),
      check: (c) => (/\bassert/.test(c) ? [] : (c.trim() ? [1] : [])) },
  ];

  function lines(c, re) { return c.split('\n').map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean); }
  function lineAt(c, n) { return c.split('\n')[n - 1] || ''; }

  root.innerHTML = `
    <div class="forge-head"><h3>${L('Audit a script', '审一份脚本')}</h3><span class="hint">${L('6 of the 18 rules, illustrative port', '18 条规则里的 6 条，示意版')}</span></div>
    <div class="audit-samples" id="a-samples">${SAMPLES.map((s, i) => `<button type="button" class="fbtn${i === 0 ? ' fbtn-ink' : ''}" data-i="${i}">${s.label}</button>`).join('')}</div>
    <textarea id="a-code" class="audit-code" spellcheck="false" aria-label="${L('Python test script to audit', '要审计的 Python 测试脚本')}" rows="11"></textarea>
    <div class="verdict-box" id="a-out"></div>`;

  const ta = root.querySelector('#a-code'), out = root.querySelector('#a-out');

  function run() {
    const code = ta.value;
    const findings = [];
    for (const r of RULES) for (const n of r.check(code)) findings.push({ ...r, line: n });
    const p0 = findings.filter(f => f.sev === 'P0').length;
    const pill = p0 ? `<span class="v v-no">${ZH ? `${p0} 个 P0 问题` : `${p0} P0 finding${p0 > 1 ? 's' : ''}`}</span>` : `<span class="v v-ok">${L('audit pass', '审计通过')}</span>`;
    const note = p0
      ? `<div class="verdict-why">${L('A P0 becomes an error and drives regeneration, up to two rounds. The model gets each line below as the reason.', 'P0 会被当成错误，触发重新生成，最多两轮。下面每一条都会作为原因发给模型。')}</div>`
      : `<div class="verdict-why">${L('Nothing here is tautological, self-referential or swallowed, and the effect of every action is read back. This green means something.', '没有永远为真的断言，没有自己比自己，也没有被吞掉的失败，每个操作的效果都读回来检查了。这个绿灯是真的。')}</div>`;
    const list = findings.length ? `<ul class="audit-list">${findings.map(f => `<li><code>${f.id}</code> <span class="dim">${L('line', '第')} ${f.line}${L('', ' 行')}</span><br>${f.why}</li>`).join('')}</ul>` : '';
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
