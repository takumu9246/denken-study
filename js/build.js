// LESSON_DEFS（科目ごとのファイルで定義）から、画面で使うデータを組み立てる
//   LESSONS   … レッスン一覧（並び順＝おすすめの学習順）
//   QUESTIONS … すべての問題（cat＝科目、t＝出題テーマ）
//   INTROS    … レッスン冒頭の「まずは概要」
//   EXAMPLES  … レッスン内の「よく出る例題」（各レッスンの先頭5問）
const LESSONS = [];
const QUESTIONS = [];
const INTROS = {};
const EXAMPLES = {};

(() => {
  const order = CATEGORIES.map((c) => c.id);
  const defs = [...LESSON_DEFS].sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat));
  for (const d of defs) {
    const qs = d.qs || [];
    qs.forEach((q) => {
      q.cat = d.cat;
      q.t = q.t || d.theme;
      if (q.a === undefined) q.a = 0;
      QUESTIONS.push(q);
    });
    LESSONS.push({ id: d.id, cat: d.cat, theme: d.theme, exam: d.exam, title: d.title, body: d.body, qids: qs.map((q) => q.id) });
    if (d.intro) INTROS[d.id] = d.intro;
    if (d.often) EXAMPLES[d.id] = { often: d.often, traps: d.traps || [], qids: qs.filter((q) => q.past).slice(0, 5).map((q) => q.id) };
  }
  // 例題が5問に満たないときはレッスンの問題で補う
  Object.entries(EXAMPLES).forEach(([id, ex]) => {
    const l = LESSONS.find((x) => x.id === id);
    for (const qid of l.qids) { if (ex.qids.length >= 5) break; if (!ex.qids.includes(qid)) ex.qids.push(qid); }
  });
})();
