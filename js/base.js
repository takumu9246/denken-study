// 共通の定義とデータ作成用ヘルパー
// 科目（＝問題の分野）。電験三種は科目ごとに 100 点満点・60 点で科目合格
const CATEGORIES = [
  { id: 'riron', name: '理論', short: '理', time: 90, info: 'A問題14問×5点＋B問題3問×10点（問17・18は選択）' },
  { id: 'denryoku', name: '電力', short: '電', time: 90, info: 'A問題14問×5点＋B問題3問×10点' },
  { id: 'kikai', name: '機械', short: '機', time: 90, info: 'A問題14問×5点＋B問題3問×10点（問17・18は選択）' },
  { id: 'hoki', name: '法規', short: '法', time: 65, info: 'A問題10問×6点＋B問題3問（(a)(b)で計40点）' },
];

// レッスン定義の置き場（riron.js などが LESSON() で追加し、build.js がまとめる）
const LESSON_DEFS = [];
const LESSON = (def) => LESSON_DEFS.push(def);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 穴埋め（ア）〜（ウ）の組合せ選択肢を作る
// rows: [['2倍','1/2','大きく'], ...] → 「(ア) 2倍　(イ) 1/2　(ウ) 大きく」
const KANA = ['ア', 'イ', 'ウ', 'エ', 'オ'];
const combo = (rows) => rows.map((r) => r.map((v, i) => `(${KANA[i]}) ${v}`).join('　'));

// 数式・表のちょっとした部品
const F = (s) => `<div class="formula">${s}</div>`;
const TBL = (head, rows) => `<div class="tblwrap"><table class="tbl"><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
