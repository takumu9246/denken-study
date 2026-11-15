// ===== 状態管理 =====
const STORE_KEY = 'denken3-study-v1';
const ALL_SUBJ = CATEGORIES.map((c) => c.id);
const defaultState = () => ({ records: {}, plan: {}, examDate: '', log: {}, calc: { ok: 0, total: 0 }, lessons: {}, subjects: [...ALL_SUBJ] });
let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    return s ? { ...defaultState(), ...s } : defaultState();
  } catch { return defaultState(); }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* 保存不可でも動作は継続 */ }
}
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dateKey(new Date());
function logAnswer(ok) {
  const t = today();
  const l = state.log[t] || { n: 0, ok: 0 };
  l.n++; if (ok) l.ok++;
  state.log[t] = l;
}

const $ = (sel) => document.querySelector(sel);
const view = () => $('#view');
const catName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || '';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const qById = (id) => QUESTIONS.find((q) => q.id === id);
const NUMS = '①②③④⑤⑥⑦⑧⑨⑩';

// ===== 用語リンク =====
// 描画済みの要素内のテキストから用語を探し、タップで意味を表示できるようにする
function linkTerms(root) {
  if (!root) return;
  const seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('button, .term, code, .no, input, label, summary h2, svg, figcaption') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const text = node.nodeValue;
    GLOSSARY_RE.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = GLOSSARY_RE.exec(text))) {
      if (seen.has(m[0])) continue; // 同じ用語は最初の1回だけリンク
      seen.add(m[0]);
      frag = frag || document.createDocumentFragment();
      frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const s = document.createElement('span');
      s.className = 'term'; s.textContent = m[0]; s.dataset.term = m[0];
      s.setAttribute('role', 'button'); s.tabIndex = 0;
      frag.appendChild(s);
      last = m.index + m[0].length;
    }
    if (frag) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
  }
}
function showTerm(term) {
  const g = GLOSSARY[term]; if (!g) return;
  $('#sheet').innerHTML = `<div class="sheet-card" role="dialog" aria-label="${esc(term)}">
    <div class="sheet-head"><b>${esc(term)}</b>${g.yomi ? `<span class="muted small">${esc(g.yomi)}</span>` : ''}<button class="link" id="sheetClose" aria-label="閉じる">✕</button></div>
    <p>${esc(g.desc)}</p></div>`;
  $('#sheet').classList.add('show');
  $('#sheetClose').addEventListener('click', hideTerm);
}
function hideTerm() { $('#sheet').classList.remove('show'); }
document.addEventListener('click', (e) => {
  const t = e.target.closest('.term');
  if (t) { e.preventDefault(); e.stopPropagation(); showTerm(t.dataset.term); return; }
  if (e.target.id === 'sheet') hideTerm();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideTerm();
  if (e.key === 'Enter' && e.target.classList?.contains('term')) showTerm(e.target.dataset.term);
});

// ===== ルーティング =====
const routes = { home: renderHome, lessons: renderLessons, lesson: renderLesson, notes: renderNotes, glossary: renderGlossary, quiz: renderQuizMenu, calc: renderCalcMenu, trend: renderTrend, stats: renderStats };
const navOf = { lesson: 'lessons', notes: 'lessons', glossary: 'lessons' };
function go() {
  const [name, arg] = (location.hash.slice(1) || 'home').split('/');
  const r = routes[name] ? name : 'home';
  hideTerm();
  routes[r](arg);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === (navOf[r] || r)));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', go);

// ===== ホーム =====
function daysLeft() {
  if (!state.examDate) return null;
  const ms = new Date(state.examDate + 'T00:00:00') - new Date(today() + 'T00:00:00');
  return Math.round(ms / 86400000);
}
function phaseRanges() {
  if (!state.examDate) return null;
  const start = new Date(today() + 'T00:00:00');
  const end = new Date(state.examDate + 'T00:00:00');
  const days = Math.max(0, Math.round((end - start) / 86400000));
  const pending = PLAN.filter((p) => !p.tasks.every((t) => state.plan[t.id]));
  const total = pending.reduce((s, p) => s + p.weight, 0) || 1;
  const out = {};
  let cur = 0;
  pending.forEach((p, i) => {
    const len = i === pending.length - 1 ? days - cur : Math.max(1, Math.round(days * p.weight / total));
    const s = new Date(start); s.setDate(s.getDate() + cur);
    const e = new Date(start); e.setDate(e.getDate() + Math.max(cur, cur + len - 1));
    out[p.id] = { s, e, len };
    cur += len;
  });
  return out;
}
const md = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const subjOn = (cat) => (state.subjects || ALL_SUBJ).includes(cat);
const nextLesson = () => LESSONS.find((l) => subjOn(l.cat) && !state.lessons[l.id]);

function renderHome() {
  const left = daysLeft();
  const ranges = phaseRanges();
  const nowPhase = PLAN.find((p) => !p.tasks.every((t) => state.plan[t.id]));
  const todayLog = state.log[today()] || { n: 0, ok: 0 };
  const allTasks = PLAN.flatMap((p) => p.tasks);
  const doneTasks = allTasks.filter((t) => state.plan[t.id]).length;
  const doneLessons = LESSONS.filter((l) => state.lessons[l.id]).length;
  const nl = nextLesson();

  view().innerHTML = `
  <section class="card hero">
    <div class="hero-row">
      <div>
        <div class="muted small">試験日</div>
        <input type="date" id="examDate" value="${state.examDate}" aria-label="試験日">
      </div>
      <div class="count">${left === null ? '<span class="muted small">試験日を設定すると<br>プランに日付が入ります</span>' : left >= 0 ? `あと <b>${left}</b> 日` : '試験日を過ぎました'}</div>
    </div>
    <div class="kpis">
      <div><b>${todayLog.n}</b><span>今日の解答数</span></div>
      <div><b>${doneLessons}/${LESSONS.length}</b><span>レッスン</span></div>
      <div><b>${doneTasks}/${allTasks.length}</b><span>プラン達成</span></div>
    </div>
    <div class="muted small" style="margin-top:12px">今回受験する科目（科目合格済みの科目は外すと、次のレッスンや到達度から除かれます）</div>
    <div class="subj-row">${CATEGORIES.map((c) => `<label><input type="checkbox" data-subj="${c.id}" ${subjOn(c.id) ? 'checked' : ''}>${c.name}</label>`).join('')}</div>
  </section>

  ${nl ? `<section class="card focus">
    <div class="muted small">次のレッスン（${catName(nl.cat)}・${nl.exam}）</div>
    <h3>${nl.title}</h3>
    <div class="btns"><a class="btn primary" href="#lesson/${nl.id}">読んで問題を解く</a><a class="btn" href="#lessons">レッスン一覧</a></div>
  </section>` : `<section class="card focus"><h3>全レッスン完了 🎉</h3><p>「問題」の苦手モード・過去問類題と計算ドリルで仕上げましょう。</p><a class="btn primary" href="#quiz">問題へ</a></section>`}

  ${partsSummaryCard()}

  <section class="card">
    <h2>勉強の進め方</h2>
    <ol class="howto">
      <li><b>理論から</b>：理論は他の3科目の土台です。理論 → 機械 → 電力 → 法規 の順がおすすめ（レッスンもこの順）</li>
      <li><b>レッスンを順番に</b>：概要 → 試験のポイント（公式・図）→ よく出る例題 → 関連問題。<span class="term-sample">点線の用語</span>はタップで意味が出ます</li>
      <li><b>計算は毎日少しずつ</b>：「計算」タブは数値が毎回変わります。★は毎回のように出る形式</li>
      <li><b>「傾向」タブで出題位置を確認</b>：問1〜2はコンデンサ、問14は電気材料…のように、問題番号ごとにテーマがほぼ決まっています</li>
      <li><b>週末は公式の過去問</b>：本番と同じ時間で1回分 → 間違えたテーマをこのアプリで復習</li>
    </ol>
  </section>

  <section class="card">
    <h2>学習プラン</h2>
    <p class="muted small">チェックはこの端末に保存されます。${state.examDate ? '未完了のフェーズに残り日数を自動で割り振ります。' : ''}</p>
    ${PLAN.map((p) => {
      const done = p.tasks.filter((t) => state.plan[t.id]).length;
      const r = ranges && ranges[p.id];
      const complete = done === p.tasks.length;
      return `<details class="phase ${complete ? 'done' : ''}" ${p === nowPhase ? 'open' : ''}>
        <summary><span class="ph-title">${p.title}</span><span class="ph-meta">${complete ? '完了' : r ? `${md(r.s)}〜${md(r.e)}` : `目安 ${Math.round(p.weight * 100)}%`} · ${done}/${p.tasks.length}</span></summary>
        ${p.lessons ? `<div class="ph-lessons">${p.lessons.map((id) => { const l = LESSONS.find((x) => x.id === id); return `<a href="#lesson/${id}" class="chip ${state.lessons[id] ? 'on' : ''}">${state.lessons[id] ? '✓ ' : ''}${l.title}</a>`; }).join('')}</div>` : ''}
        <ul class="tasks">${p.tasks.map((t) => `<li><label><input type="checkbox" data-task="${t.id}" ${state.plan[t.id] ? 'checked' : ''}><span>${t.text}</span></label></li>`).join('')}</ul>
      </details>`;
    }).join('')}
  </section>

  <section class="card">
    <h2>試験について（公表されている問題用紙・解答より）</h2>
    <ul class="small">
      <li>4科目とも <b>100 点満点</b>。合格基準は <b>60 点</b>が目安（年度により調整されることがあります）。</li>
      ${CATEGORIES.map((c) => `<li><b>${c.name}</b>（${c.time}分）：${c.info}</li>`).join('')}
      <li>すべて <b>5 択のマークシート</b>。B問題は (a)(b) の2問セット。</li>
      <li><b>科目合格制度</b>：合格した科目は、その後の連続 5 回（約 3 年間）の試験で免除されます。</li>
      <li>令和4年度から<b>年2回（上期・下期）</b>。CBT 方式でも受験できます。</li>
      <li>このアプリは平成28年度〜令和8年度上期の <b>15 回分</b>の出題テーマを分析して作っています。問題・解説はアプリ作成者（AI）によるもので、数値や法令は公式の情報で必ず確認してください。</li>
    </ul>
  </section>
  <p class="center muted small">アプリの版：${window.APP_VERSION || '-'}</p>`;

  $('#examDate').addEventListener('change', (e) => { state.examDate = e.target.value; save(); renderHome(); });
  view().querySelectorAll('[data-subj]').forEach((cb) => cb.addEventListener('change', () => {
    state.subjects = [...view().querySelectorAll('[data-subj]:checked')].map((x) => x.dataset.subj);
    save(); renderHome();
  }));
  view().querySelectorAll('[data-task]').forEach((cb) => cb.addEventListener('change', (e) => {
    state.plan[e.target.dataset.task] = e.target.checked; save(); renderHome();
  }));
}

// ===== レッスン =====
function renderLessons() {
  const groups = [];
  LESSONS.forEach((l) => {
    const g = groups.find((x) => x.exam === l.exam);
    g ? g.list.push(l) : groups.push({ exam: l.exam, list: [l] });
  });
  const done = LESSONS.filter((l) => state.lessons[l.id]).length;
  view().innerHTML = `<h1 class="page-title">レッスン</h1>
  <section class="card">
    <p class="small">短い解説を読んでから、関連する問題を解きます。上から順に進めるのがおすすめです（${done}/${LESSONS.length} 完了）。</p>
    <div class="btns"><a class="btn" href="#glossary">📖 用語集</a><a class="btn" href="#notes">📝 要点まとめ</a></div>
  </section>
  ${CATEGORIES.map((c) => {
    const ls = LESSONS.filter((l) => l.cat === c.id);
    const dn = ls.filter((l) => state.lessons[l.id]).length;
    return `<h2 class="group-h ${subjOn(c.id) ? '' : 'off'}"><span>${c.name}</span><span class="muted small">${subjOn(c.id) ? '' : '今回は受験しない ・ '}${dn}/${ls.length} 完了</span></h2>
    <section class="card lesson-list ${subjOn(c.id) ? '' : 'off'}">
    ${ls.map((l) => {
      const r = state.lessons[l.id];
      return `<a class="lesson-row ${r ? 'done' : ''}" href="#lesson/${l.id}">
        <span class="ln small">${r ? '✓' : l.id}</span>
        <span class="lt"><b>${l.title}</b><span class="muted small">${l.exam} ・ ${l.qids.length}問${r ? ` ・ 前回 ${r.ok}/${r.n}` : ''}</span></span>
        <span class="chev">›</span>
      </a>`;
    }).join('')}
  </section>`;
  }).join('')}`;
}

// レッスン冒頭の「まずは概要」
function introHtml(id) {
  const it = typeof INTROS !== 'undefined' && INTROS[id];
  if (!it) return '';
  return `<section class="intro">
    <h2 class="lesson-sec">📖 まずは概要</h2>
    <p class="intro-lead">${it.lead}</p>
    ${it.items.map((x) => `<div class="intro-item"><h3>${x.t}</h3><p>${x.d}</p></div>`).join('')}
  </section>`;
}

// レッスン内の「よく出る例題」
function examplesHtml(id) {
  const ex = typeof EXAMPLES !== 'undefined' && EXAMPLES[id];
  if (!ex) return '';
  return `<section class="examples">
    <h2 class="lesson-sec">🎯 よく出る例題</h2>
    <div class="often"><b>出方：</b>${ex.often}</div>
    <div class="traps"><b>⚠ ひっかけ・押さえどころ</b><ul>${ex.traps.map((t) => `<li>${t}</li>`).join('')}</ul></div>
    ${ex.qids.map(qById).filter(Boolean).map((q, n) => `<div class="ex-card" data-q="${q.id}">
      <div class="ex-head"><span class="tag">例題 ${n + 1}</span>${q.past ? '<span class="tag past">過去問類題</span>' : ''}</div>
      <div class="qtext">${q.q}</div>
      <div class="choices ${q.c.some((c) => c.length > 30) ? 'long' : ''}">${(q.abc || q.fix ? q.c.map((_, i) => i) : shuffle(q.c.map((_, i) => i))).map((oi, k) => `<button class="choice" data-i="${oi}"><span class="no">${q.fix ? `(${k + 1})` : NUMS[k]}</span><span class="ct">${q.c[oi]}</span></button>`).join('')}</div>
      <div class="ex-feed"></div>
    </div>`).join('')}
  </section>`;
}
function bindExamples() {
  view().querySelectorAll('.ex-card').forEach((card) => {
    const q = qById(card.dataset.q);
    linkTerms(card.querySelector('.qtext'));
    card.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      const ok = i === q.a;
      const r = state.records[q.id] || { c: 0, w: 0, last: null };
      ok ? r.c++ : r.w++; r.last = ok ? 1 : 0; state.records[q.id] = r;
      logAnswer(ok); save();
      card.querySelectorAll('.choice').forEach((x) => {
        x.disabled = true;
        const xi = Number(x.dataset.i);
        if (xi === q.a) x.classList.add('correct'); else if (xi === i) x.classList.add('wrong');
      });
      const fb = card.querySelector('.ex-feed');
      fb.innerHTML = `<div class="result ${ok ? 'ok' : 'ng'}">${ok ? '⭕ 正解' : '❌ 不正解'}</div><div class="explain">${q.e}</div>`;
      linkTerms(fb.querySelector('.explain'));
    }));
  });
}

function renderLesson(id) {
  const idx = LESSONS.findIndex((l) => l.id === id);
  const l = LESSONS[idx];
  if (!l) { location.hash = '#lessons'; return; }
  view().innerHTML = `
  <div class="qbar"><a class="link" href="#lessons">← レッスン一覧</a><span>${idx + 1} / ${LESSONS.length}</span></div>
  <section class="card lesson">
    <div class="tag">${catName(l.cat)} ・ ${l.exam}</div>
    <h1 class="lesson-title">${l.title}</h1>
    ${introHtml(l.id)}
    <h2 class="lesson-sec">📝 試験のポイント</h2>
    <div class="lesson-body">${l.body}</div>
    ${examplesHtml(l.id)}
    <p class="muted small hint">青い下線の用語はタップで意味を表示</p>
    <button class="btn primary wide" id="startLesson">関連問題を解く（${l.qids.length}問）→</button>
  </section>`;
  linkTerms(view().querySelector('.lesson-body'));
  view().querySelectorAll('.intro-item p').forEach(linkTerms);
  bindExamples();
  $('#startLesson').addEventListener('click', () => {
    const list = l.qids.map(qById).filter(Boolean);
    quiz = { cat: l.cat, mode: 'lesson', lesson: l.id, list, i: 0, results: [] };
    renderQuestion();
  });
}

// ===== 要点まとめ =====
function renderNotes() {
  let open = '';
  try { open = sessionStorage.getItem('openNote') || ''; sessionStorage.removeItem('openNote'); } catch { /* noop */ }
  view().innerHTML = `<div class="qbar"><a class="link" href="#lessons">← レッスン</a></div><h1 class="page-title">要点まとめ</h1>
  ${NOTES.map((n) => `<details class="card note" ${n.cat === open ? 'open' : ''} id="note-${n.cat}">
    <summary><h2>${n.title}</h2></summary>
    <div class="note-body">${n.html}</div>
    <button class="btn primary" data-start="${n.cat}">この分野の問題を解く</button>
  </details>`).join('')}`;
  view().querySelectorAll('.note-body').forEach(linkTerms);
  view().querySelectorAll('[data-start]').forEach((a) => a.addEventListener('click', () => startQuiz(a.dataset.start, 'random')));
}

// ===== 用語集 =====
function renderGlossary() {
  view().innerHTML = `<div class="qbar"><a class="link" href="#lessons">← レッスン</a></div><h1 class="page-title">用語集</h1>
  <section class="card"><input type="search" id="gq" placeholder="用語を検索（例：分散、MTBF）" aria-label="用語を検索"></section>
  <section class="card" id="glist"></section>`;
  const draw = (q) => {
    const k = q.trim().toLowerCase();
    const list = GLOSSARY_LIST.filter(([t, y, d]) => !k || (t + y + d).toLowerCase().includes(k));
    $('#glist').innerHTML = list.length ? list.map(([t, y, d]) => `<div class="gitem"><b>${esc(t)}</b>${y ? ` <span class="muted small">${esc(y)}</span>` : ''}<p>${esc(d)}</p></div>`).join('') : '<p class="muted">見つかりませんでした</p>';
  };
  $('#gq').addEventListener('input', (e) => draw(e.target.value));
  draw('');
}

// ===== 一問一答 =====
let quiz = null;

function catStats(cat, filter = () => true) {
  const qs = QUESTIONS.filter((q) => (cat === 'all' || q.cat === cat) && filter(q));
  const seen = qs.filter((q) => state.records[q.id]);
  const weak = qs.filter((q) => state.records[q.id] && state.records[q.id].last === 0);
  const ok = seen.reduce((s, q) => s + state.records[q.id].c, 0);
  const tot = seen.reduce((s, q) => s + state.records[q.id].c + state.records[q.id].w, 0);
  return { total: qs.length, seen: seen.length, weak: weak.length, rate: tot ? Math.round(ok / tot * 100) : null };
}

function renderQuizMenu() {
  let sel = 'all';
  try { sel = sessionStorage.getItem('quizCat') || 'all'; } catch { /* noop */ }
  const st = catStats(sel);
  const pastN = catStats(sel, (q) => q.past).total;
  view().innerHTML = `<h1 class="page-title">問題演習</h1>
  <section class="card">
    <h2>分野</h2>
    <div class="chips" id="cats">
      <button class="chip ${sel === 'all' ? 'on' : ''}" data-cat="all">すべて</button>
      ${CATEGORIES.map((c) => `<button class="chip ${sel === c.id ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('')}
    </div>
    <p class="muted small">${st.total}問 ・ 学習済み ${st.seen} ・ 苦手 ${st.weak}${st.rate !== null ? ` ・ 正答率 ${st.rate}%` : ''}</p>
  </section>
  <section class="card">
    <h2>モード</h2>
    <div class="modes">
      <button class="btn primary" data-mode="random">ランダム 10 問</button>
      <button class="btn" data-mode="past">過去問類題（本番形式）<span class="badge info">${pastN}</span></button>
      <button class="btn" data-mode="new">未学習の問題</button>
      <button class="btn" data-mode="weak">苦手（前回間違えた問題）<span class="badge">${st.weak}</span></button>
      <button class="btn" data-mode="all">全問（順番どおり）</button>
    </div>
  </section>`;
  view().querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { try { sessionStorage.setItem('quizCat', b.dataset.cat); } catch { /* noop */ } renderQuizMenu(); }));
  view().querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => startQuiz(sel, b.dataset.mode)));
}

function startQuiz(cat, mode) {
  try { sessionStorage.setItem('quizCat', cat); } catch { /* noop */ }
  let qs = QUESTIONS.filter((q) => cat === 'all' || q.cat === cat);
  if (mode === 'new') qs = qs.filter((q) => !state.records[q.id]);
  if (mode === 'weak') qs = qs.filter((q) => state.records[q.id] && state.records[q.id].last === 0);
  if (mode === 'past') qs = qs.filter((q) => q.past);
  if (mode !== 'all') qs = shuffle([...qs]);
  if (mode === 'random' || mode === 'past') qs = qs.slice(0, 10);
  if (!qs.length) {
    if (location.hash !== '#quiz') location.hash = '#quiz';
    setTimeout(() => toast(mode === 'weak' ? '苦手な問題はありません 👍' : '該当する問題はありません'), 50);
    return;
  }
  quiz = { cat, mode, list: qs, i: 0, results: [] };
  if (location.hash !== '#quiz') history.replaceState(null, '', '#quiz');
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === 'quiz'));
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.list[quiz.i];
  // A〜C 判定問題と「〜のうち」形式は選択肢の順番を固定（本番と同じ）
  const order = q.abc || q.fix ? q.c.map((_, i) => i) : shuffle(q.c.map((_, i) => i));
  const long = q.c.some((c) => c.length > 30);
  view().innerHTML = `
  <div class="qbar"><button class="link" id="quit">← やめる</button><span>${quiz.i + 1} / ${quiz.list.length}</span></div>
  <div class="progress"><div style="width:${(quiz.i) / quiz.list.length * 100}%"></div></div>
  <section class="card question">
    <div class="tag">${catName(q.cat)} ・ ${(THEMES[q.t] || {}).name || ''}</div>${q.past ? '<span class="tag past">過去問類題</span>' : ''}
    <div class="qtext">${q.q}</div>
    <div class="choices ${long ? 'long' : ''}">${order.map((oi, k) => `<button class="choice" data-i="${oi}"><span class="no">${q.fix ? `(${k + 1})` : NUMS[k]}</span><span class="ct">${q.c[oi]}</span></button>`).join('')}</div>
    <div id="feedback"></div>
  </section>`;
  $('#quit').addEventListener('click', () => {
    const lid = quiz.lesson, theme = quiz.mode === 'theme'; quiz = null;
    if (theme) { location.hash = '#stats'; go(); return; }
    lid ? renderLesson(lid) : renderQuizMenu();
  });
  view().querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => answer(q, Number(b.dataset.i))));
  linkTerms(view().querySelector('.qtext'));
  window.scrollTo(0, 0);
}

// その問題を扱うレッスンの図を取り出す（解説の下に表示）
function figsFor(qid) {
  const l = LESSONS.find((x) => x.qids.includes(qid));
  if (!l) return '';
  const figs = l.body.match(/<figure class="fig">[\s\S]*?<\/figure>/g);
  if (!figs) return '';
  return `<details class="figbox" open><summary>📈 図で確認（${l.title}）</summary>${figs.join('')}<a class="link small" href="#lesson/${l.id}">レッスンを読む →</a></details>`;
}

function answer(q, i) {
  const ok = i === q.a;
  const r = state.records[q.id] || { c: 0, w: 0, last: null };
  ok ? r.c++ : r.w++;
  r.last = ok ? 1 : 0;
  state.records[q.id] = r;
  logAnswer(ok);
  save();
  quiz.results.push({ id: q.id, ok });
  view().querySelectorAll('.choice').forEach((b) => {
    b.disabled = true;
    const bi = Number(b.dataset.i);
    if (bi === q.a) b.classList.add('correct');
    else if (bi === i) b.classList.add('wrong');
  });
  const last = quiz.i === quiz.list.length - 1;
  $('#feedback').innerHTML = `
    <div class="result ${ok ? 'ok' : 'ng'}">${ok ? '⭕ 正解' : '❌ 不正解'}</div>
    <div class="explain">${q.e}</div>
    ${figsFor(q.id)}
    <button class="btn primary wide" id="next">${last ? '結果を見る' : '次の問題 →'}</button>`;
  linkTerms($('#feedback .explain'));
  $('#next').addEventListener('click', () => { quiz.i++; last ? renderQuizResult() : renderQuestion(); });
  $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderQuizResult() {
  const ok = quiz.results.filter((r) => r.ok).length;
  const n = quiz.results.length;
  const wrong = quiz.results.filter((r) => !r.ok).map((r) => qById(r.id));
  const { cat, mode, lesson } = quiz;
  let nl = null;
  if (lesson) {
    state.lessons[lesson] = { ok, n, t: today() };
    save();
    const idx = LESSONS.findIndex((l) => l.id === lesson);
    nl = LESSONS[idx + 1];
  }
  view().innerHTML = `
  <section class="card center">
    <div class="muted small">${lesson ? LESSONS.find((l) => l.id === lesson).title : quiz.title || (cat === 'all' ? 'すべての分野' : catName(cat))}</div>
    <div class="score">${ok} / ${n}</div>
    <div class="muted">正答率 ${Math.round(ok / n * 100)}%（合格ライン 60%）</div>
    <div class="btns center">
      ${nl ? `<a class="btn primary" href="#lesson/${nl.id}">次のレッスンへ →</a>` : ''}
      ${wrong.length ? `<button class="btn ${nl ? '' : 'primary'}" id="retryWrong">間違えた問題をもう一度</button>` : ''}
      ${lesson ? `<a class="btn" href="#lesson/${lesson}">解説を読み直す</a>` : '<button class="btn" id="again">同じ条件でもう一度</button>'}
      <a class="btn" href="${lesson ? '#lessons' : '#quiz'}" id="menu">${lesson ? 'レッスン一覧' : 'メニューへ'}</a>
    </div>
  </section>
  ${wrong.length ? `<section class="card"><h2>間違えた問題</h2>${wrong.map((q) => `<div class="review"><div>${q.q}</div><p class="ans">正解：${q.c[q.a]}</p><p class="muted small">${q.e}</p></div>`).join('')}</section>` : ''}`;
  $('#again')?.addEventListener('click', () => (mode === 'theme' ? startList(quiz.list.map((q) => q.id), quiz.title) : startQuiz(cat, mode)));
  if (mode === 'theme') $('#menu').setAttribute('href', '#stats');
  $('#menu').addEventListener('click', () => { quiz = null; });
  if (wrong.length) $('#retryWrong').addEventListener('click', () => { quiz = { cat, mode, lesson: null, list: shuffle([...wrong]), i: 0, results: [] }; renderQuestion(); });
  view().querySelectorAll('.review').forEach(linkTerms);
}

// ===== 計算ドリル =====
let calcSel = 'random';
function renderCalcMenu() {
  view().innerHTML = `<h1 class="page-title">計算ドリル</h1>
  <section class="card">
    <p class="muted small">数値は毎回変わります。式を書いて解いてから選んでください。正答 ${state.calc.ok} / ${state.calc.total}</p>
    <div class="chips"><button class="chip ${calcSel === 'random' ? 'on' : ''}" data-t="random">全科目ランダム</button></div>
    ${CATEGORIES.map((c) => {
      const ts = CALC_TYPES.filter((t) => t.cat === c.id);
      return ts.length ? `<div class="muted small" style="margin:10px 0 6px">${c.name}</div><div class="chips">${ts.map((t) => `<button class="chip ${calcSel === t.id ? 'on' : ''}" data-t="${t.id}">${t.name}${t.past ? ' ★' : ''}</button>`).join('')}</div>` : '';
    }).join('')}
    <p class="muted small">★ は過去問で繰り返し出題されている形式</p>
  </section>
  <div id="calcArea"></div>`;
  view().querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
    calcSel = b.dataset.t;
    view().querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('on', x === b));
    newCalc();
  }));
  newCalc();
}

function newCalc() {
  const type = calcSel === 'random' ? pick(CALC_TYPES.filter((t) => subjOn(t.cat)).length ? CALC_TYPES.filter((t) => subjOn(t.cat)) : CALC_TYPES) : CALC_TYPES.find((t) => t.id === calcSel) || CALC_TYPES[0];
  const p = type.gen();
  $('#calcArea').innerHTML = `<section class="card question">
    <div class="tag">${catName(type.cat)} ・ ${type.name}</div>
    <div class="qtext">${p.q}</div>
    <div class="choices">${p.choices.map((c, i) => `<button class="choice" data-i="${i}"><span class="no">${NUMS[i]}</span><span class="ct">${esc(c)}</span></button>`).join('')}</div>
    <div id="cfeed"></div>
  </section>`;
  linkTerms($('#calcArea .qtext'));
  $('#calcArea').querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.i);
    const ok = i === p.answer;
    state.calc.total++; if (ok) state.calc.ok++;
    logAnswer(ok); save();
    $('#calcArea').querySelectorAll('.choice').forEach((x) => {
      x.disabled = true;
      const xi = Number(x.dataset.i);
      if (xi === p.answer) x.classList.add('correct'); else if (xi === i) x.classList.add('wrong');
    });
    $('#cfeed').innerHTML = `<div class="result ${ok ? 'ok' : 'ng'}">${ok ? '⭕ 正解' : '❌ 不正解'}</div>
      <div class="explain"><div class="muted small">解き方</div>${p.steps}</div>
      <button class="btn primary wide" id="cnext">次の問題 →</button>`;
    $('#cnext').addEventListener('click', () => { newCalc(); $('#calcArea').scrollIntoView({ block: 'start' }); });
    $('#cfeed').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
}

// ===== 科目別の到達度 =====
// テーマ情報（TREND.themes：過去15回の出題回数など）に、そのテーマの問題IDを付け足す
const EXAM_ROUNDS = TREND.rounds.length;
const FREQUENT = 12; // 15回中12回以上＝ほぼ毎回出る ★テーマ
const THEMES = {};
Object.entries(TREND.themes).forEach(([id, t]) => {
  THEMES[id] = { id, ...t, qids: QUESTIONS.filter((q) => q.t === id).map((q) => q.id), calc: (typeof CALC_TYPES !== 'undefined' ? CALC_TYPES : []).filter((c) => c.t === id).map((c) => c.id) };
});
const EXAM_PARTS = CATEGORIES.map((c, i) => ({ no: i + 1, id: c.id, title: c.name, points: 100, themes: Object.values(THEMES).filter((t) => t.subj === c.id) }));

// テーマの習得度：そのテーマの問題のうち「前回正解」の割合
function themeMastery(t) {
  const ok = t.qids.filter((id) => state.records[id] && state.records[id].last === 1).length;
  const tried = t.qids.filter((id) => state.records[id]).length;
  return { ok, tried, n: t.qids.length, m: t.qids.length ? ok / t.qids.length : 0 };
}
// 科目のカバー率：過去15回の出題数で重み付けした習得度
function partCoverage(p) {
  const total = p.themes.reduce((s, t) => s + t.n, 0);
  return p.themes.reduce((s, t) => s + t.n * themeMastery(t).m, 0) / total;
}
function frequentShare(p) {
  const total = p.themes.reduce((s, t) => s + t.n, 0);
  return p.themes.filter((t) => t.freq >= FREQUENT).reduce((s, t) => s + t.n, 0) / total;
}
function partStatus(cov) {
  if (cov >= 0.8) return { cls: 'ok', label: '仕上がり' };
  if (cov >= 0.6) return { cls: 'mid', label: '合格ライン付近' };
  if (cov > 0) return { cls: 'low', label: '学習中' };
  return { cls: 'none', label: '未着手' };
}
const partScore = (p) => Math.round(p.points * partCoverage(p));
const posText = (t) => (t.pos.length ? `問${t.pos.join('・')}` : '位置は不定');

function openPart() { try { return sessionStorage.getItem('openPart'); } catch { return null; } }

function partsSummaryCard() {
  const parts = EXAM_PARTS.filter((p) => subjOn(p.id));
  return `<section class="card">
    <h2>科目別の到達度（推定点）</h2>
    <div class="parts-mini">${parts.map((p) => {
      const c = partCoverage(p);
      return `<a href="#stats" class="pm"><span class="pm-no">${p.title}</span><span class="meter"><span class="${partStatus(c).cls}" style="width:${Math.round(c * 100)}%"></span></span><span class="pm-v">${partScore(p)}点</span></a>`;
    }).join('')}</div>
    <p class="small muted">各科目 100 点満点・合格の目安 60 点。このアプリの問題の正答状況から出した目安です。</p>
    <div class="btns"><a class="btn" href="#stats">テーマ別に見る</a><a class="btn" href="#trend">📈 出題傾向</a></div>
  </section>`;
}

function partsDetail() {
  return `<section class="card">
    <h2>科目別の到達度</h2>
    <p class="small">各科目のテーマと、過去 ${EXAM_ROUNDS} 回（平成28年度〜令和8年度上期）で出題された回数です。<b>★ のテーマ（${EXAM_ROUNDS} 回中 ${FREQUENT} 回以上）</b>はほぼ毎回出ます。テーマの問題を 8 割以上正解すると「クリア」。</p>
    <p class="muted small">推定点 ＝ 100 点 × カバー率（過去の出題数で重み付けした正答状況）。本番の点数を保証するものではありません。</p>
  </section>
  ${EXAM_PARTS.map((p) => {
    const c = partCoverage(p);
    const st = partStatus(c);
    const freqThemes = p.themes.filter((t) => t.freq >= FREQUENT);
    const cleared = freqThemes.filter((t) => themeMastery(t).m >= 0.8).length;
    return `<details class="card part" ${openPart() == p.no ? 'open' : ''} data-part="${p.no}">
      <summary>
        <div class="part-head"><b>${p.title}</b><span class="muted small">${subjOn(p.id) ? `推定 ${partScore(p)} / 100 点` : '今回は受験しない'}</span></div>
        <div class="part-bar"><span class="meter big"><span class="${st.cls}" style="width:${Math.round(c * 100)}%"></span></span><span class="pill ${st.cls}">${st.label} ${Math.round(c * 100)}%</span></div>
        <div class="muted small">★ 頻出テーマ ${cleared}/${freqThemes.length} クリア ・ ★だけで過去の出題の約 ${Math.round(frequentShare(p) * 100)}%</div>
      </summary>
      ${p.themes.map((t) => {
        const m = themeMastery(t);
        const done = m.m >= 0.8;
        return `<div class="theme ${done ? 'done' : ''}">
          <div class="theme-head"><span class="star">${t.freq >= FREQUENT ? '★' : '　'}</span><span class="tn">${t.name}</span>${done ? '<span class="pill ok">クリア</span>' : ''}</div>
          <div class="theme-meta"><span class="freq"><span class="dots">${'●'.repeat(t.freq)}${'○'.repeat(EXAM_ROUNDS - t.freq)}</span> ${EXAM_ROUNDS}回中${t.freq}回（計${t.n}問）・ ${posText(t)}</span></div>
          <div class="theme-prog"><span class="meter"><span class="${done ? 'ok' : m.m > 0 ? 'mid' : 'none'}" style="width:${Math.round(m.m * 100)}%"></span></span><span class="muted small">${m.ok}/${m.n}問 正解</span></div>
          <div class="theme-btns">
            ${t.qids.length ? `<button class="btn sm primary" data-theme="${t.id}">解く</button>` : ''}
            ${t.lessons.map((id) => `<a class="btn sm" href="#lesson/${id}">📘 ${id}</a>`).join('')}
            ${t.calc.length ? `<button class="btn sm" data-calc="${t.calc[0]}">🧮 計算</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </details>`;
  }).join('')}`;
}

function bindParts() {
  view().querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
    const t = THEMES[b.dataset.theme];
    const p = EXAM_PARTS.find((x) => x.id === t.subj);
    try { sessionStorage.setItem('openPart', p.no); } catch { /* noop */ }
    startList(t.qids, `${p.title}：${t.name}`);
  }));
  view().querySelectorAll('[data-calc]').forEach((b) => b.addEventListener('click', () => { calcSel = b.dataset.calc; location.hash = '#calc'; }));
  view().querySelectorAll('details.part').forEach((d) => d.addEventListener('toggle', () => {
    try { if (d.open) sessionStorage.setItem('openPart', d.dataset.part); } catch { /* noop */ }
  }));
}

function startList(ids, title) {
  const list = shuffle(ids.map(qById).filter(Boolean));
  quiz = { cat: 'all', mode: 'theme', title, list, i: 0, results: [] };
  if (location.hash !== '#quiz') history.replaceState(null, '', '#quiz');
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === 'stats'));
  renderQuestion();
}

// ===== 出題傾向（過去15回の分析） =====
const THEME_COLORS = ['#f4b183', '#9dc3e6', '#a9d18e', '#ffd966', '#c9a0dc', '#f8a5c2', '#8fd3c7', '#d9c7a7', '#b4c7e7', '#f6c38f', '#c5e0b4', '#e7b3b3'];
let trendSel = 'riron';
function renderTrend() {
  const c = CATEGORIES.find((x) => x.id === trendSel);
  const themes = Object.values(THEMES).filter((t) => t.subj === trendSel).sort((a, b) => b.n - a.n);
  const color = {}; themes.forEach((t, i) => { color[t.id] = THEME_COLORS[i % THEME_COLORS.length]; });
  const mx = TREND.matrix[trendSel];
  const rounds = TREND.rounds;
  const maxQ = Math.max(...rounds.map((r) => mx[r].length));
  const maxN = Math.max(...themes.map((t) => t.n));
  // 問番号ごとの最頻テーマ
  const posLines = [];
  for (let i = 0; i < maxQ; i++) {
    const cnt = {};
    rounds.forEach((r) => { const t = mx[r][i]; if (t) cnt[t] = (cnt[t] || 0) + 1; });
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 2);
    posLines.push(`<div class="posline"><b>問${i + 1}</b><span>${top.map(([t, n]) => `${THEMES[t] ? THEMES[t].name : t}（${n}回）`).join('、')}</span></div>`);
  }
  view().innerHTML = `<h1 class="page-title">出題傾向</h1>
  <div class="tabs">${CATEGORIES.map((x) => `<button class="chip ${x.id === trendSel ? 'on' : ''}" data-ts="${x.id}">${x.name}</button>`).join('')}</div>
  <section class="card">
    <h2>${c.name}：テーマ別の出題数（過去${rounds.length}回）</h2>
    <p class="muted small">棒の長さ＝${rounds.length}回分の合計問題数。●は出題された回数。★はほぼ毎回出るテーマ。</p>
    <div class="hbar">${themes.map((t) => `<div class="hb-row">
      <div class="hb-top"><span>${t.freq >= FREQUENT ? '★' : ''}${t.name}</span><span class="muted small">${t.n}問 ・ ${t.freq}/${rounds.length}回</span></div>
      <div class="hb-track"><span style="width:${t.n / maxN * 100}%;background:${color[t.id]}"></span></div>
    </div>`).join('')}</div>
  </section>
  <section class="card">
    <h2>問題番号 × 年度 のテーマ表</h2>
    <p class="muted small">縦が問題番号、横が試験回（左が古い）。同じ色が横に並ぶほど「その位置にいつも同じテーマが出る」ということです。</p>
    <div class="mx-wrap"><table class="mx">
      <tr><th></th>${rounds.map((r) => `<th class="rn">${r}</th>`).join('')}</tr>
      ${Array.from({ length: maxQ }, (_, i) => `<tr><th>${i + 1}</th>${rounds.map((r) => { const t = mx[r][i]; return t && THEMES[t] ? `<td style="background:${color[t]}" title="${THEMES[t].name}">${THEMES[t].short}</td>` : '<td class="e"></td>'; }).join('')}</tr>`).join('')}
    </table></div>
    <div class="legend">${themes.map((t) => `<span><i style="background:${color[t.id]}"></i>${t.short}＝${t.name}</span>`).join('')}</div>
  </section>
  <section class="card">
    <h2>問題番号ごとの定番テーマ</h2>
    ${posLines.join('')}
  </section>
  <section class="card">
    <h2>分析から言えること</h2>
    <div class="insight">${TREND_INSIGHTS[trendSel] || ''}</div>
    <p class="muted small">テーマ判定は各問の冒頭文のキーワードによる自動分類＋目視補正のため、境界的な問題は別テーマに数えられていることがあります。</p>
  </section>`;
  view().querySelectorAll('[data-ts]').forEach((b) => b.addEventListener('click', () => { trendSel = b.dataset.ts; renderTrend(); }));
}

// ===== 記録 =====
function renderStats() {
  const days = [];
  for (let k = 13; k >= 0; k--) {
    const d = new Date(); d.setDate(d.getDate() - k);
    days.push({ d, n: (state.log[dateKey(d)] || {}).n || 0 });
  }
  const max = Math.max(5, ...days.map((x) => x.n));
  let streak = 0;
  for (let k = days.length - 1; k >= 0; k--) { if (days[k].n > 0) streak++; else if (k !== days.length - 1) break; }

  view().innerHTML = `<h1 class="page-title">到達度と記録</h1>
  ${partsDetail()}
  <section class="card">
    <h2>直近14日の解答数</h2>
    <p class="muted small">連続学習 ${streak} 日</p>
    <div class="bars">${days.map((x) => `<div class="bar"><div class="fill" style="height:${x.n / max * 100}%"></div><span class="v">${x.n || ''}</span><span class="l">${x.d.getDate()}</span></div>`).join('')}</div>
  </section>
  <section class="card">
    <h2>分野別の状況</h2>
    ${CATEGORIES.map((c) => {
      const s = catStats(c.id);
      return `<div class="stat-row">
        <div class="stat-head"><span>${c.name}</span><span class="muted small">${s.rate === null ? '未学習' : `正答率 ${s.rate}%`}</span></div>
        <div class="meter"><div style="width:${s.total ? s.seen / s.total * 100 : 0}%"></div></div>
        <div class="muted small">学習済み ${s.seen}/${s.total}・苦手 ${s.weak}</div>
      </div>`;
    }).join('')}
    <p class="muted small"><a href="#trend">📈 出題傾向を見る</a>　計算ドリル：${state.calc.ok} / ${state.calc.total} 正解</p>
  </section>
  <section class="card">
    <h2>データ</h2>
    <p class="muted small">記録はこのブラウザ内にのみ保存されます。機種変更時などはバックアップを使ってください。</p>
    <div class="btns">
      <button class="btn" id="exp">バックアップをコピー</button>
      <button class="btn" id="imp">バックアップから復元</button>
      <button class="btn danger" id="reset">記録をリセット</button>
    </div>
  </section>`;
  bindParts();
  $('#exp').addEventListener('click', async () => {
    const txt = JSON.stringify(state);
    try { await navigator.clipboard.writeText(txt); toast('コピーしました'); } catch { prompt('この文字列を保存してください', txt); }
  });
  $('#imp').addEventListener('click', () => {
    const txt = prompt('バックアップの文字列を貼り付けてください');
    if (!txt) return;
    try { state = { ...defaultState(), ...JSON.parse(txt) }; save(); toast('復元しました'); renderStats(); } catch { toast('読み込めませんでした'); }
  });
  $('#reset').addEventListener('click', () => {
    if (confirm('すべての学習記録とプランのチェックを消去します。よろしいですか？')) { state = defaultState(); save(); renderStats(); }
  });
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove('show'), 2000);
}

// 同じタブをもう一度押したときも再描画する
document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => {
  if (location.hash === a.getAttribute('href')) { quiz = null; go(); }
}));

go();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // 新しいバージョンが入ったら一度だけ自動で再読み込み
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => r.update()).catch(() => {});
}
