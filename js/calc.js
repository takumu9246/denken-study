// 計算ドリル：毎回数値が変わる問題を生成する
// 誤答の選択肢は「よくある間違い」の計算結果で作り、足りない分は倍率で補う
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmt = (x, d) => Number(x.toFixed(d)).toLocaleString('ja-JP', { minimumFractionDigits: d, maximumFractionDigits: d });
const N_CHOICES = 5;

function makeChoices(ans, wrongs, d, unit = '') {
  const s = (v) => fmt(v, d) + unit;
  const set = new Set([s(ans)]);
  for (const w of wrongs) {
    if (Number.isFinite(w) && w > 0) set.add(s(w));
    if (set.size >= N_CHOICES) break;
  }
  for (const m of [1.25, 0.8, 1.5, 0.5, 2, 1.1, 0.9, 3, 0.33]) {
    if (set.size >= N_CHOICES) break;
    set.add(s(ans * m));
  }
  let k = 1;
  while (set.size < N_CHOICES) set.add(s(ans + k++ * Math.pow(10, -d)));
  const list = shuffle([...set]);
  return { choices: list, answer: list.indexOf(s(ans)) };
}
const SQ3 = Math.sqrt(3);

const CALC_TYPES = [
  // ===================== 理論 =====================
  {
    id: 'res', cat: 'riron', t: 'r_dc', name: '合成抵抗・分流', past: true,
    gen() {
      const a = pick([2, 3, 4, 6, 12]), b = pick([3, 6, 12, 4]), c = R(1, 8), I = R(2, 12);
      const p = a * b / (a + b), tot = p + c, Ia = I * b / (a + b);
      if (R(0, 1)) {
        return { q: `${a} Ω と ${b} Ω の並列回路に ${c} Ω を直列に接続した。合成抵抗 [Ω] はいくらか。`, ...makeChoices(tot, [a + b + c, (a + b) / 2 + c, p, a * b / c], 2, ' Ω'), steps: `並列部分は和分の積：${a}×${b}/(${a}＋${b})＝${fmt(p, 2)} Ω<br>直列に ${c} Ω を足して <b>${fmt(tot, 2)} Ω</b>` };
      }
      return { q: `${a} Ω と ${b} Ω の並列回路に全体で ${I} A が流れている。${a} Ω に流れる電流 [A] はいくらか。`, ...makeChoices(Ia, [I * a / (a + b), I / 2, I - Ia + 0.5], 2, ' A'), steps: `分流は「相手の抵抗」を分子に：I＝${I}×${b}/(${a}＋${b})＝<b>${fmt(Ia, 2)} A</b>` };
    },
  },
  {
    id: 'cap', cat: 'riron', t: 'r_cap', name: 'コンデンサ', past: true,
    gen() {
      const c1 = pick([1, 2, 3, 4, 6]), c2 = pick([2, 3, 4, 6, 8]), V = pick([100, 120, 200, 300, 600]);
      if (R(0, 1)) {
        const v2 = V * c1 / (c1 + c2);
        return { q: `${c1} μF と ${c2} μF のコンデンサを直列に接続し、${V} V を加えた。${c2} μF の端子電圧 [V] はいくらか。`, ...makeChoices(v2, [V * c2 / (c1 + c2), V / 2, V * c1 / c2], 1, ' V'), steps: `直列は電荷が等しい → 電圧は容量に反比例<br>V₂＝${V}×${c1}/(${c1}＋${c2})＝<b>${fmt(v2, 1)} V</b>` };
      }
      const W = 0.5 * c1 * 1e-6 * V * V;
      return { q: `${c1} μF のコンデンサを ${V} V で充電した。蓄えられる静電エネルギー [J] はいくらか。`, ...makeChoices(W, [2 * W, c1 * 1e-6 * V, W / 2], 3, ' J'), steps: `W＝½CV²＝½×${c1}×10⁻⁶×${V}²＝<b>${fmt(W, 3)} J</b>` };
    },
  },
  {
    id: 'coulomb', cat: 'riron', t: 'r_static', name: 'クーロン力・電位', past: true,
    gen() {
      const q1 = R(1, 5), q2 = R(1, 5), r = pick([0.1, 0.2, 0.3, 0.5]);
      if (R(0, 1)) {
        const F = 9e9 * q1 * q2 * 1e-12 / (r * r);
        return { q: `真空中で ${r} m 離れた ${q1} μC と ${q2} μC の点電荷の間に働く力 [N] はいくらか（1/(4πε₀)＝9×10⁹）。`, ...makeChoices(F, [F * r, F / 10, F * 2], 2, ' N'), steps: `F＝9×10⁹×(${q1}×10⁻⁶)(${q2}×10⁻⁶)/${r}²＝<b>${fmt(F, 2)} N</b>` };
      }
      const V = 9e9 * q1 * 1e-9 / r;
      return { q: `真空中の点電荷 ${q1} nC から ${r} m 離れた点の電位 [V] はいくらか（1/(4πε₀)＝9×10⁹）。`, ...makeChoices(V, [V / r, V * r, V / 2], 0, ' V'), steps: `V＝9×10⁹×${q1}×10⁻⁹/${r}＝<b>${fmt(V, 0)} V</b>（電位は r の1乗で割る）` };
    },
  },
  {
    id: 'wires', cat: 'riron', t: 'r_mag', name: '磁界・電磁力', past: true,
    gen() {
      const I1 = R(2, 20), I2 = R(2, 20), r = pick([0.05, 0.1, 0.2, 0.4]);
      if (R(0, 1)) {
        const F = 2e-7 * I1 * I2 / r;
        return { q: `真空中で ${r} m 離れた平行導線にそれぞれ ${I1} A、${I2} A が流れている。1 m あたりの力 [×10⁻⁵ N] はいくらか。`, ...makeChoices(F * 1e5, [F * 1e5 * 2 * Math.PI, F * 1e5 / r, F * 1e5 * 2], 2), steps: `F＝2×10⁻⁷×${I1}×${I2}/${r}＝${(F).toExponential(2)} N＝<b>${fmt(F * 1e5, 2)}×10⁻⁵ N</b>` };
      }
      const H = I1 / (2 * Math.PI * r);
      return { q: `直線導体に ${I1} A が流れている。導体から ${r} m の点の磁界の強さ [A/m] はいくらか。`, ...makeChoices(H, [I1 / (2 * r), I1 / r, I1 / (Math.PI * r * r)], 2, ' A/m'), steps: `H＝I/(2πr)＝${I1}/(2π×${r})＝<b>${fmt(H, 2)} A/m</b>` };
    },
  },
  {
    id: 'rlc', cat: 'riron', t: 'r_ac', name: 'RLC直列回路', past: true,
    gen() {
      const [Rr, X] = pick([[3, 4], [6, 8], [5, 12], [8, 6], [12, 16], [9, 12]]);
      const V = pick([100, 200, 120, 260]);
      const Z = Math.hypot(Rr, X), I = V / Z, P = I * I * Rr;
      return { q: `抵抗 ${Rr} Ω と誘導性リアクタンス ${X} Ω の直列回路に ${V} V の交流電圧を加えた。消費電力 [W] はいくらか。`, ...makeChoices(P, [V * I, I * I * X, V * V / Rr], 0, ' W'), steps: `Z＝√(${Rr}²＋${X}²)＝${fmt(Z, 1)} Ω、I＝${V}/${fmt(Z, 1)}＝${fmt(I, 2)} A<br>P＝I²R＝<b>${fmt(P, 0)} W</b>（力率 ${fmt(Rr / Z, 2)}）` };
    },
  },
  {
    id: 'three', cat: 'riron', t: 'r_3phase', name: '三相電力', past: true,
    gen() {
      const [Rr, X] = pick([[6, 8], [8, 6], [3, 4], [12, 16]]);
      const V = pick([200, 400]), Z = Math.hypot(Rr, X);
      if (R(0, 1)) {
        const I = V / SQ3 / Z, P = 3 * I * I * Rr;
        return { q: `1相 ${Rr}＋j${X} Ω の平衡 Y 負荷に、線間電圧 ${V} V を加えた。三相電力 [kW] はいくらか。`, ...makeChoices(P / 1000, [3 * P / 1000, P / 3000, SQ3 * P / 1000], 2, ' kW'), steps: `相電圧＝${V}/√3＝${fmt(V / SQ3, 1)} V、I＝${fmt(I, 2)} A<br>P＝3I²R＝<b>${fmt(P / 1000, 2)} kW</b>` };
      }
      const Ip = V / Z, IL = SQ3 * Ip;
      return { q: `1相 ${Rr}＋j${X} Ω の平衡 Δ 負荷に、線間電圧 ${V} V を加えた。線電流 [A] はいくらか。`, ...makeChoices(IL, [Ip, Ip / SQ3, 3 * Ip], 1, ' A'), steps: `相電流＝${V}/${Z}＝${fmt(Ip, 1)} A、線電流＝√3×相電流＝<b>${fmt(IL, 1)} A</b>` };
    },
  },
  {
    id: 'tau', cat: 'riron', t: 'r_trans', name: '時定数', past: true,
    gen() {
      if (R(0, 1)) {
        const r = pick([1, 2, 5, 10, 20]), c = pick([1, 2, 5, 10, 50]);
        const t = r * c; // kΩ×μF = ms
        return { q: `抵抗 ${r} kΩ と静電容量 ${c} μF の直列回路の時定数 [ms] はいくらか。`, ...makeChoices(t, [r / c, c / r, t * 10], 1, ' ms'), steps: `τ＝RC＝${r}×10³×${c}×10⁻⁶＝<b>${fmt(t, 1)} ms</b>` };
      }
      const L = pick([0.1, 0.2, 0.5, 1]), r = pick([5, 10, 20, 50]);
      return { q: `インダクタンス ${L} H と抵抗 ${r} Ω の直列回路の時定数 [ms] はいくらか。`, ...makeChoices(L / r * 1000, [L * r * 1000, r / L, L / r * 100], 1, ' ms'), steps: `τ＝L/R＝${L}/${r}＝<b>${fmt(L / r * 1000, 1)} ms</b>` };
    },
  },
  {
    id: 'meter', cat: 'riron', t: 'r_meas', name: '分流器・倍率器', past: true,
    gen() {
      const m = pick([2, 4, 5, 10, 20]);
      if (R(0, 1)) {
        const Ra = pick([0.1, 0.2, 0.5, 1, 2]), Rs = Ra / (m - 1);
        return { q: `内部抵抗 ${Ra} Ω の電流計の測定範囲を ${m} 倍にする分流器の抵抗 [Ω] はいくらか。`, ...makeChoices(Rs, [Ra / m, Ra * (m - 1), Ra * m], 4, ' Ω'), steps: `Rs＝Ra/(m−1)＝${Ra}/${m - 1}＝<b>${fmt(Rs, 4)} Ω</b>` };
      }
      const Rv = pick([5, 10, 20, 50]), Rm = (m - 1) * Rv;
      return { q: `内部抵抗 ${Rv} kΩ の電圧計の測定範囲を ${m} 倍にする倍率器の抵抗 [kΩ] はいくらか。`, ...makeChoices(Rm, [m * Rv, Rv / (m - 1), (m + 1) * Rv], 0, ' kΩ'), steps: `Rm＝(m−1)Rv＝${m - 1}×${Rv}＝<b>${Rm} kΩ</b>` };
    },
  },
  // ===================== 電力 =====================
  {
    id: 'hydro', cat: 'denryoku', t: 'p_hydro', name: '水力発電の出力', past: true,
    gen() {
      const Q = R(5, 60), H = pick([30, 50, 80, 100, 150, 200]), eta = pick([0.8, 0.85, 0.88, 0.9]);
      const P = 9.8 * Q * H * eta / 1000;
      return { q: `有効落差 ${H} m、使用水量 ${Q} m³/s、総合効率 ${eta * 100}% の水力発電所の出力 [MW] はいくらか。`, ...makeChoices(P, [9.8 * Q * H / 1000, Q * H * eta / 1000, 9.8 * Q * H / eta / 1000], 2, ' MW'), steps: `P＝9.8QHη＝9.8×${Q}×${H}×${eta}＝${fmt(P * 1000, 0)} kW＝<b>${fmt(P, 2)} MW</b>` };
    },
  },
  {
    id: 'thermal', cat: 'denryoku', t: 'p_thermal', name: '火力の熱効率', past: true,
    gen() {
      const P = pick([100, 250, 350, 500, 600, 1000]), Hc = pick([42000, 44000, 50000, 26000]);
      const eta = R(36, 46) / 100, B = 3600 * P * 1000 / (eta * Hc) / 1000; // t/h
      const Bt = Math.round(B);
      const e = 3600 * P * 1000 / (Bt * 1000 * Hc) * 100;
      return { q: `出力 ${P} MW の火力発電所で、燃料（発熱量 ${Hc.toLocaleString()} kJ/kg）を毎時 ${Bt} t 消費している。発電端熱効率 [%] はいくらか。`, ...makeChoices(e, [e * 1000 / 3600, 100 - e, e * 1.2], 1, ' %'), steps: `η＝3600P/(BH)＝3600×${P}×10³/(${Bt}×10³×${Hc.toLocaleString()})＝<b>${fmt(e, 1)} %</b>` };
    },
  },
  {
    id: 'sag', cat: 'denryoku', t: 'p_trans', name: 'たるみ', past: true,
    gen() {
      const S = pick([100, 150, 200, 250, 300]), W = pick([10, 15, 20, 25]), T = pick([10, 15, 20, 25, 30]);
      const D = W * S * S / (8 * T * 1000);
      return { q: `径間 ${S} m、電線の荷重 ${W} N/m、水平張力 ${T} kN の架空電線のたるみ [m] はいくらか。`, ...makeChoices(D, [W * S * S / (4 * T * 1000), W * S / (8 * T), D * 2], 2, ' m'), steps: `D＝WS²/(8T)＝${W}×${S}²/(8×${T}×10³)＝<b>${fmt(D, 2)} m</b>` };
    },
  },
  {
    id: 'vdrop', cat: 'denryoku', t: 'p_dist', name: '三相の電圧降下', past: true,
    gen() {
      const I = pick([50, 80, 100, 120, 150, 200]), r = pick([0.2, 0.3, 0.5, 0.6]), x = pick([0.3, 0.4, 0.5, 0.8, 1]);
      const [c, s] = pick([[0.8, 0.6], [0.6, 0.8], [1, 0]]);
      const v = SQ3 * I * (r * c + x * s);
      return { q: `三相 3 線式配電線で、1 線の抵抗 ${r} Ω、リアクタンス ${x} Ω、線電流 ${I} A、力率 ${c}（遅れ）のとき、電圧降下 [V] はいくらか（近似式）。`, ...makeChoices(v, [I * (r * c + x * s), 2 * I * (r * c + x * s), SQ3 * I * (r * s + x * c)], 1, ' V'), steps: `v＝√3I(Rcosθ＋Xsinθ)＝√3×${I}×(${r}×${c}＋${x}×${s})＝<b>${fmt(v, 1)} V</b>` };
    },
  },
  {
    id: 'shortc', cat: 'denryoku', t: 'p_sub', name: '%Zと短絡電流', past: true,
    gen() {
      const Pn = pick([5, 10, 20, 30]), z = pick([4, 5, 6, 8, 10, 12]), V = pick([6.6, 22, 66]);
      const In = Pn * 1e6 / (SQ3 * V * 1000), Is = In * 100 / z / 1000;
      if (R(0, 1)) {
        return { q: `基準容量 ${Pn} MV·A で %インピーダンスが ${z}% の地点の三相短絡容量 [MV·A] はいくらか。`, ...makeChoices(Pn * 100 / z, [Pn * z / 100, Pn * z, Pn / z], 1, ' MV·A'), steps: `Ps＝Pn×100/%Z＝${Pn}×100/${z}＝<b>${fmt(Pn * 100 / z, 1)} MV·A</b>` };
      }
      return { q: `基準容量 ${Pn} MV·A、%Z＝${z}% の系統で、${V} kV 側の三相短絡電流 [kA] はいくらか。`, ...makeChoices(Is, [Is * SQ3, Is / SQ3, In / 1000], 2, ' kA'), steps: `In＝${Pn}×10⁶/(√3×${V}×10³)＝${fmt(In, 0)} A<br>Is＝In×100/%Z＝<b>${fmt(Is, 2)} kA</b>` };
    },
  },
  {
    id: 'pfc', cat: 'denryoku', t: 'p_dist', name: '力率改善', past: true,
    gen() {
      const P = pick([100, 200, 300, 400, 600]);
      const [c1, t1] = pick([[0.6, 4 / 3], [0.8, 0.75]]);
      const [c2, t2] = c1 === 0.6 ? pick([[0.8, 0.75], [1, 0]]) : pick([[1, 0], [0.96, 0.2917]]);
      const Qc = P * (t1 - t2);
      return { q: `${P} kW、遅れ力率 ${c1} の負荷の力率を ${c2} に改善するコンデンサ容量 [kvar] はいくらか。`, ...makeChoices(Qc, [P * (c2 - c1), P * t1, P * (Math.sqrt(1 - c1 * c1) - Math.sqrt(1 - c2 * c2))], 1, ' kvar'), steps: `tanθ₁＝${fmt(t1, 3)}、tanθ₂＝${fmt(t2, 3)}<br>Qc＝P(tanθ₁−tanθ₂)＝${P}×(${fmt(t1, 3)}−${fmt(t2, 3)})＝<b>${fmt(Qc, 1)} kvar</b>` };
    },
  },
  // ===================== 機械 =====================
  {
    id: 'dcm', cat: 'kikai', t: 'm_dc', name: '直流電動機の速度', past: true,
    gen() {
      const V = pick([100, 200, 220, 440]), Ra = pick([0.1, 0.2, 0.25, 0.5]), I1 = pick([20, 40, 50, 80]), N1 = pick([1000, 1200, 1500, 1800]);
      const k = pick([0.5, 1.5, 2]), I2 = I1 * k;
      const E1 = V - I1 * Ra, E2 = V - I2 * Ra, N2 = N1 * E2 / E1;
      return { q: `端子電圧 ${V} V、電機子抵抗 ${Ra} Ω の他励直流電動機が、電機子電流 ${I1} A で ${N1} min⁻¹ で回転している。界磁一定で電機子電流が ${I2} A になったときの回転速度 [min⁻¹] はいくらか。`, ...makeChoices(N2, [N1 * E1 / E2, N1 * I1 / I2, N1 * (V + I2 * Ra) / (V + I1 * Ra)], 0, ' min⁻¹'), steps: `E₁＝${V}−${I1}×${Ra}＝${fmt(E1, 1)} V、E₂＝${V}−${I2}×${Ra}＝${fmt(E2, 1)} V<br>N は E に比例：N₂＝${N1}×${fmt(E2, 1)}/${fmt(E1, 1)}＝<b>${fmt(N2, 0)} min⁻¹</b>` };
    },
  },
  {
    id: 'slip', cat: 'kikai', t: 'm_ind', name: '誘導機の滑り・出力', past: true,
    gen() {
      const f = pick([50, 60]), p = pick([2, 4, 6, 8]), Ns = 120 * f / p, s = pick([0.02, 0.03, 0.04, 0.05]);
      if (R(0, 1)) {
        const N = Ns * (1 - s);
        return { q: `${p} 極、${f} Hz の三相誘導電動機が滑り ${s * 100}% で運転している。回転速度 [min⁻¹] はいくらか。`, ...makeChoices(N, [Ns, Ns * (1 + s), 60 * f / p * (1 - s)], 0, ' min⁻¹'), steps: `Ns＝120f/p＝${Ns} min⁻¹、N＝Ns(1−s)＝<b>${fmt(N, 0)} min⁻¹</b>` };
      }
      const P2 = pick([5, 10, 15, 20, 30]);
      return { q: `三相誘導電動機の二次入力が ${P2} kW、滑りが ${s} のとき、機械出力 [kW] はいくらか。`, ...makeChoices(P2 * (1 - s), [P2 * s, P2, P2 / (1 - s)], 2, ' kW'), steps: `P₂：Pc₂：Po＝1：s：(1−s)<br>Po＝${P2}×(1−${s})＝<b>${fmt(P2 * (1 - s), 2)} kW</b>` };
    },
  },
  {
    id: 'sync', cat: 'kikai', t: 'm_sync', name: '同期速度・短絡比', past: false,
    gen() {
      if (R(0, 1)) {
        const f = pick([50, 60]), p = pick([2, 4, 6, 8, 10, 12, 16]);
        return { q: `${p} 極、${f} Hz の同期発電機の同期速度 [min⁻¹] はいくらか。`, ...makeChoices(120 * f / p, [60 * f / p, 120 * f / (p / 2), 120 * f * p / 10], 0, ' min⁻¹'), steps: `Ns＝120f/p＝120×${f}/${p}＝<b>${120 * f / p} min⁻¹</b>` };
      }
      const k = pick([0.8, 1.0, 1.25, 1.5, 2.0]);
      return { q: `短絡比 ${k} の同期発電機の百分率同期インピーダンス [%] はいくらか。`, ...makeChoices(100 / k, [100 * k, k * 10, 100 - k * 10], 1, ' %'), steps: `%Zs＝100/Ks＝100/${k}＝<b>${fmt(100 / k, 1)} %</b>` };
    },
  },
  {
    id: 'treff', cat: 'kikai', t: 'm_tr', name: '変圧器の効率', past: true,
    gen() {
      const S = pick([20, 50, 100, 200, 500]), Pi = S * pick([4, 5, 8, 10]), Pc = Pi * pick([2, 2.5, 3, 4]);
      const a = pick([0.5, 0.75, 1]), pf = pick([1, 0.8]);
      const out = a * S * 1000 * pf, eta = out / (out + Pi + a * a * Pc) * 100;
      return { q: `定格 ${S} kV·A、鉄損 ${Pi} W、全負荷銅損 ${Pc} W の変圧器を、負荷率 ${a * 100}%・力率 ${pf} で運転した。効率 [%] はいくらか。`, ...makeChoices(eta, [out / (out + Pi + Pc) * 100, out / (out + a * Pi + a * a * Pc) * 100, out / (out + Pi + a * Pc) * 100], 2, ' %'), steps: `出力＝${a}×${S}×${pf}＝${fmt(out / 1000, 1)} kW、銅損＝${a}²×${Pc}＝${fmt(a * a * Pc, 0)} W<br>η＝${fmt(out, 0)}/(${fmt(out, 0)}＋${Pi}＋${fmt(a * a * Pc, 0)})＝<b>${fmt(eta, 2)} %</b>（銅損は負荷率の2乗）` };
    },
  },
  {
    id: 'chop', cat: 'kikai', t: 'm_pe', name: 'チョッパ・整流', past: true,
    gen() {
      const E = pick([100, 120, 200, 300]), D = pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]);
      const k = R(0, 2);
      if (k === 0) return { q: `入力 ${E} V の降圧チョッパを通流率 ${D} で運転した。出力電圧の平均値 [V] はいくらか。`, ...makeChoices(E * D, [E / (1 - D), E * (1 - D), E / D], 1, ' V'), steps: `Vo＝D×E＝${D}×${E}＝<b>${fmt(E * D, 1)} V</b>` };
      if (k === 1) return { q: `入力 ${E} V の昇圧チョッパを通流率 ${D} で運転した。出力電圧の平均値 [V] はいくらか。`, ...makeChoices(E / (1 - D), [E * D, E / D, E * (1 + D)], 1, ' V'), steps: `Vo＝E/(1−D)＝${E}/${fmt(1 - D, 2)}＝<b>${fmt(E / (1 - D), 1)} V</b>` };
      const V = pick([100, 200, 400]), typ = pick([['単相半波', 0.45], ['単相全波', 0.9], ['三相全波', 1.35]]);
      return { q: `実効値（三相は線間電圧）${V} V の交流を、ダイオードの${typ[0]}整流回路で整流した。出力電圧の平均値 [V] はおよそいくらか（抵抗負荷）。`, ...makeChoices(V * typ[1], [V * 0.45, V * 0.9, V * 1.35, V * 1.41].filter((x) => Math.abs(x - V * typ[1]) > 0.01), 0, ' V'), steps: `${typ[0]}の平均値 ≒ ${typ[1]}V ＝ ${typ[1]}×${V}＝<b>${fmt(V * typ[1], 0)} V</b>` };
    },
  },
  {
    id: 'hoist', cat: 'kikai', t: 'm_motorapp', name: '巻上機・ポンプ', past: true,
    gen() {
      if (R(0, 1)) {
        const m = pick([500, 800, 1000, 1200, 2000]), v = pick([0.5, 0.6, 0.8, 1, 1.5]), eta = pick([0.7, 0.75, 0.8, 0.85]);
        const P = m * 9.8 * v / eta / 1000;
        return { q: `質量 ${m} kg の物体を ${v} m/s で巻き上げる。巻上機の効率 ${eta * 100}% のとき、電動機出力 [kW] はいくらか。`, ...makeChoices(P, [m * 9.8 * v * eta / 1000, m * v / eta / 1000, m * 9.8 * v / 1000], 2, ' kW'), steps: `P＝mgv/η＝${m}×9.8×${v}/${eta}＝<b>${fmt(P, 2)} kW</b>` };
      }
      const Q = pick([1, 2, 3, 6, 12]), H = pick([10, 15, 20, 30]), eta = pick([0.7, 0.75, 0.8]), K = pick([1.1, 1.15, 1.2]);
      const P = 9.8 * Q / 60 * H / eta * K;
      return { q: `揚水量 ${Q} m³/min、全揚程 ${H} m のポンプ（効率 ${eta * 100}%）を、余裕係数 ${K} で選ぶ。電動機の所要出力 [kW] はいくらか。`, ...makeChoices(P, [P * 60, 9.8 * Q / 60 * H * eta * K, 9.8 * Q / 60 * H / eta], 2, ' kW'), steps: `Q＝${Q}/60 m³/s<br>P＝9.8×(${Q}/60)×${H}/${eta}×${K}＝<b>${fmt(P, 2)} kW</b>` };
    },
  },
  {
    id: 'illum', cat: 'kikai', t: 'm_light', name: '照度', past: true,
    gen() {
      const I = pick([100, 200, 300, 400, 500, 1000]);
      const [h, d] = pick([[3, 4], [4, 3], [6, 8], [2, 0], [3, 0], [8, 6]]);
      const r = Math.hypot(h, d), E = I * (h / r) / (r * r);
      return { q: `光度 ${I} cd（全方向一様）の点光源が床面から ${h} m の高さにある。光源の真下から水平に ${d} m 離れた床面上の点の水平面照度 [lx] はいくらか。`, ...makeChoices(E, [I / (r * r), I / (h * h), I * (d / r || 0.5) / (r * r)], 2, ' lx'), steps: `r＝√(${h}²＋${d}²)＝${fmt(r, 1)} m、cosθ＝h/r＝${fmt(h / r, 2)}<br>Eh＝I cosθ/r²＝${I}×${fmt(h / r, 2)}/${fmt(r * r, 0)}＝<b>${fmt(E, 2)} lx</b>` };
    },
  },
  {
    id: 'heat', cat: 'kikai', t: 'm_heat', name: '電熱（水の加熱）', past: true,
    gen() {
      const m = pick([10, 20, 50, 100, 200]), t1 = pick([10, 15, 20]), t2 = pick([60, 70, 80, 90]), eta = pick([0.8, 0.85, 0.9]);
      const W = m * 4.18 * (t2 - t1) / 3600 / eta;
      return { q: `${m} kg の水を ${t1} ℃ から ${t2} ℃ に加熱する。効率 ${eta * 100}%、水の比熱 4.18 kJ/(kg·K) のとき、必要な電力量 [kW·h] はいくらか。`, ...makeChoices(W, [W * eta * eta, m * 4.18 * (t2 - t1) / 3600, m * 4.18 * t2 / 3600 / eta], 2, ' kW·h'), steps: `Q＝mcΔT＝${m}×4.18×${t2 - t1}＝${fmt(m * 4.18 * (t2 - t1), 0)} kJ<br>W＝Q/(3600η)＝<b>${fmt(W, 2)} kW·h</b>` };
    },
  },
  // ===================== 法規 =====================
  {
    id: 'bearth', cat: 'hoki', t: 'h_earth', name: 'B種接地抵抗', past: true,
    gen() {
      const L = pick([60, 100, 150, 200, 250, 300, 400]);
      let Ig = Math.ceil(1 + Math.max(0, (6 / 3 * L - 100) / 150) - 1e-9); if (Ig < 2) Ig = 2;
      const [k, cond] = pick([[150, '混触時に自動遮断する装置がない'], [300, '混触時に 1 秒を超え 2 秒以内に自動遮断する'], [600, '混触時に 1 秒以内に自動遮断する']]);
      const Rb = k / Ig;
      return { q: `公称電圧 6.6 kV の非接地式高圧架空配電線（ケーブルなし）の電線延長が ${L} km である。${cond}場合の B 種接地抵抗の最大値 [Ω] はいくらか。1 線地絡電流は I＝1＋(V/3×L−100)/150（V＝6 kV、切り上げ、最小 2 A）とする。`, ...makeChoices(Rb, [150 / Ig, 300 / Ig, 600 / Ig, k / (Ig + 1)].filter((x) => Math.abs(x - Rb) > 0.01), 1, ' Ω'), steps: `I＝1＋(6/3×${L}−100)/150 → 切り上げて ${Ig} A<br>R＝${k}/I＝${k}/${Ig}＝<b>${fmt(Rb, 1)} Ω</b>` };
    },
  },
  {
    id: 'insul', cat: 'hoki', t: 'h_zetsu', name: '絶縁耐力試験電圧', past: true,
    gen() {
      const V = pick([3300, 6600]), cable = R(0, 1);
      const Vm = V * 1.15 / 1.1, Vt = Vm * 1.5 * (cable ? 2 : 1);
      return { q: `公称電圧 ${V} V の高圧電路${cable ? '（ケーブル）を直流' : 'を交流'}で絶縁耐力試験する。試験電圧 [V] はいくらか。`, ...makeChoices(Vt, [V * 1.5 * (cable ? 2 : 1), Vm * 1.25 * (cable ? 2 : 1), Vm * 1.5 * (cable ? 1 : 2)], 0, ' V'), steps: `最大使用電圧＝${V}×1.15/1.1＝${fmt(Vm, 0)} V<br>7 000 V 以下なので 1.5 倍：${fmt(Vm * 1.5, 0)} V${cable ? '<br>ケーブルの直流試験は 2 倍' : ''} → <b>${fmt(Vt, 0)} V</b>（連続 10 分間）` };
    },
  },
  {
    id: 'demand', cat: 'hoki', t: 'h_kanri', name: '需要率・負荷率・不等率', past: true,
    gen() {
      const k = R(0, 1);
      if (k === 0) {
        const cap = pick([400, 500, 800, 1000, 1200]), dr = pick([0.5, 0.6, 0.7, 0.8]), lf = pick([0.4, 0.5, 0.6, 0.7]);
        const W = cap * dr * lf * 24;
        return { q: `設備容量 ${cap} kW、需要率 ${dr * 100}%、日負荷率 ${lf * 100}% の工場の 1 日の使用電力量 [kW·h] はいくらか。`, ...makeChoices(W, [cap * dr * 24, cap * lf * 24, cap * dr * lf * 12], 0, ' kW·h'), steps: `最大＝${cap}×${dr}＝${fmt(cap * dr, 0)} kW、平均＝×${lf}＝${fmt(cap * dr * lf, 0)} kW<br>電力量＝平均×24＝<b>${fmt(W, 0)} kW·h</b>` };
      }
      const a = pick([200, 300, 400, 500]), b = pick([100, 200, 300]), m = Math.round((a + b) / pick([1.1, 1.2, 1.25, 1.4]) / 10) * 10;
      return { q: `最大需要電力が ${a} kW と ${b} kW の2つの需要家の合成最大需要電力が ${m} kW であった。不等率はいくらか。`, ...makeChoices((a + b) / m, [m / (a + b), a / m, (a + b) / (2 * m)], 2), steps: `不等率＝(${a}＋${b})/${m}＝<b>${fmt((a + b) / m, 2)}</b>（1 以上）` };
    },
  },
  {
    id: 'mains', cat: 'hoki', t: 'h_use', name: '幹線の許容電流', past: true,
    gen() {
      const IM = pick([20, 30, 40, 45, 60, 80, 100]), IH = pick([5, 10, 15, 20]);
      const need = IM <= IH ? IM + IH : (IM <= 50 ? 1.25 * IM + IH : 1.1 * IM + IH);
      return { q: `低圧幹線に、電動機等の定格電流の合計 ${IM} A と、その他の負荷 ${IH} A を接続する。幹線の許容電流の最小値 [A] はいくらか。`, ...makeChoices(need, [IM + IH, 1.25 * IM + IH, 1.1 * IM + IH, 3 * IM + IH].filter((x) => Math.abs(x - need) > 0.01), 1, ' A'), steps: `I<sub>M</sub>＝${IM} A ${IM <= 50 ? '≦' : '＞'} 50 A → ${IM <= 50 ? '1.25' : '1.1'}×I<sub>M</sub>＋I<sub>H</sub><br>＝<b>${fmt(need, 1)} A</b>` };
    },
  },
  {
    id: 'guyc', cat: 'hoki', t: 'h_line', name: '支線の張力', past: true,
    gen() {
      const P = pick([5, 8, 10, 12, 15]), th = pick([30, 45, 60]), sf = 2.5;
      const T = P / Math.sin(th * Math.PI / 180);
      return { q: `水平張力 ${P} kN の電線を、電柱と ${th}° の角度をなす支線で支える。安全率 ${sf} とすると、支線に必要な引張強さ [kN] はいくらか。`, ...makeChoices(T * sf, [T, P * sf, P / Math.cos(th * Math.PI / 180) * sf], 1, ' kN'), steps: `T sinθ＝P → T＝${P}/sin${th}°＝${fmt(T, 2)} kN<br>×安全率 ${sf}＝<b>${fmt(T * sf, 1)} kN</b>` };
    },
  },
];
