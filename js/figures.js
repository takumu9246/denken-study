// 解説用の図（インラインSVG）。色は CSS 変数で指定しているのでダークモードでも見える
const SVG = (h, body, label) => `<svg viewBox="0 0 320 ${h}" role="img" aria-label="${label}"><defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mk"/></marker>
<marker id="aa" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mka"/></marker>
<marker id="an" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="mkn"/></marker>
</defs>${body}</svg>`;
const fig = (key, caption) => `<figure class="fig">${FIG[key] || ''}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
const AX = (x0, y0, x1, y1) => `<path d="M${x0},${y1}V${y0}" class="st" marker-end="url(#ah)"/><path d="M${x0},${y1}H${x1}" class="st" marker-end="url(#ah)"/>`;
// 抵抗（長方形）を2点の間に置く。線は呼び出し側で描く
const RES = (x1, y1, x2, y2, w = 30, h = 11) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return `<rect x="${mx - w / 2}" y="${my - h / 2}" width="${w}" height="${h}" class="fc st" transform="rotate(${ang.toFixed(1)} ${mx} ${my})"/>`;
};
const WIRE = (d, cls = 'st') => `<path d="${d}" class="${cls}"/>`;
const T = (x, y, s, cls = 'ts') => `<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
const TC = (x, y, s, cls = '') => `<text x="${x}" y="${y}" class="c ts ${cls}">${s}</text>`;
const BAT = (x, y) => `<path d="M${x - 9},${y - 3}H${x + 9}" class="st w2"/><path d="M${x - 5},${y + 3}H${x + 5}" class="st w3"/>`; // 縦向きの電池（上が＋）
const COIL = (x, y, n = 4, r = 6) => `<path d="M${x},${y}${Array.from({ length: n }, () => `a${r},${r} 0 0 1 ${2 * r},0`).join('')}" class="st"/>`;

const FIG = {
  // ===================== 理論 =====================
  bridge: SVG(175, `${WIRE('M40,85L160,25L280,85L160,145Z')}
${RES(40, 85, 160, 25)}${RES(160, 25, 280, 85)}${RES(40, 85, 160, 145)}${RES(160, 145, 280, 85)}
${T(78, 44, 'P', 'tb')}${T(232, 44, 'Q', 'tb')}${T(78, 136, 'R', 'tb')}${T(232, 136, 'S', 'tb')}
${WIRE('M160,25V68')}${WIRE('M160,102V145')}<circle cx="160" cy="85" r="15" class="fc sa w2"/>${TC(160, 89, 'G', 'ta tb')}
${WIRE('M40,85V165H130')}${WIRE('M150,165H280V85')}<path d="M130,158V172" class="st w2"/><path d="M137,161V169" class="st w3"/>${T(142, 160, 'E', 'tm')}
${T(186, 90, '検流計の電流 0', 'ta')}
${TC(160, 12, '平衡条件：P × S ＝ Q × R（向かい合う辺の積）', 'tb')}`, 'ブリッジ回路'),

  thevenin: SVG(120, `<rect x="10" y="22" width="80" height="70" rx="8" class="fs st"/>${TC(50, 52, '複雑な')}${TC(50, 66, '回路')}
${WIRE('M90,35H112M90,80H112')}<circle cx="114" cy="35" r="3" class="fa"/><circle cx="114" cy="80" r="3" class="fa"/>${T(120, 38, 'a')}${T(120, 84, 'b')}
${TC(150, 62, '＝', 'tb')}
${WIRE('M190,80V64')}${BAT(190, 58)}${WIRE('M190,52V30H215')}${RES(215, 30, 255, 30)}${WIRE('M255,30H300V48')}${RES(300, 48, 300, 78)}${WIRE('M300,78V95H190V80')}
${T(168, 62, 'V₀', 'ta tb')}${TC(235, 20, 'R₀', 'ta tb')}${T(306, 66, 'R')}
${TC(240, 114, 'I ＝ V₀ ／（R₀ ＋ R）', 'tb')}`, 'テブナンの定理'),

  fieldLines: SVG(140, `<circle cx="90" cy="70" r="30" class="sa d nofill"/><circle cx="90" cy="70" r="48" class="sa d nofill"/>
<circle cx="230" cy="70" r="30" class="sa d nofill"/><circle cx="230" cy="70" r="48" class="sa d nofill"/>
${WIRE('M104,70H214', 'sn')}<path d="M150,70H170" class="sn" marker-end="url(#an)"/>
<path d="M100,58Q160,10 220,58" class="sn"/><path d="M100,82Q160,130 220,82" class="sn"/>
<path d="M76,64L50,48" class="sn" marker-end="url(#an)"/><path d="M76,76L50,92" class="sn" marker-end="url(#an)"/>
<path d="M270,48L244,64" class="sn" marker-end="url(#an)"/><path d="M270,92L244,76" class="sn" marker-end="url(#an)"/>
<circle cx="90" cy="70" r="11" class="fn"/>${TC(90, 74, '＋', 'tw tb')}<circle cx="230" cy="70" r="11" class="fa"/>${TC(230, 74, '−', 'tw tb')}
${T(6, 136, '赤：電気力線（＋から出て−へ）', 'tn')}${T(184, 136, '点線：等電位面', 'ta')}${TC(160, 12, '電気力線と等電位面はいつも直交', 'tb')}`, '電気力線と等電位面'),

  capLayer: SVG(130, `${TC(80, 14, '板と平行な層 → 直列', 'tb')}${TC(240, 14, '板に垂直な仕切り → 並列', 'tb')}
<path d="M20,30H140M20,110H140" class="st w3"/><rect x="20" y="70" width="120" height="40" class="fs"/>${TC(80, 56, '空気 ε₀', 'tm')}${TC(80, 95, '誘電体 εr', 'ta')}<path d="M20,70H140" class="sa d"/>
<path d="M180,30H300M180,110H300" class="st w3"/><rect x="240" y="30" width="60" height="80" class="fs"/>${TC(210, 74, '空気', 'tm')}${TC(270, 74, '誘電体', 'ta')}<path d="M240,30V110" class="sa d"/>
${TC(80, 126, 'C ＝ C₁C₂/(C₁＋C₂)')}${TC(240, 126, 'C ＝ C₁ ＋ C₂')}`, '誘電体の挿入'),

  parallelWires: SVG(130, `${TC(80, 14, '同じ向き → 引き合う', 'tb ta')}${TC(240, 14, '逆向き → 反発する', 'tb tn')}
<path d="M50,115V30" class="st w2" marker-end="url(#ah)"/><path d="M110,115V30" class="st w2" marker-end="url(#ah)"/>
<path d="M56,72H74" class="sa w2" marker-end="url(#aa)"/><path d="M104,72H86" class="sa w2" marker-end="url(#aa)"/>
<path d="M210,115V30" class="st w2" marker-end="url(#ah)"/><path d="M270,30V115" class="st w2" marker-end="url(#ah)"/>
<path d="M204,72H186" class="sn w2" marker-end="url(#an)"/><path d="M276,72H294" class="sn w2" marker-end="url(#an)"/>
${T(36, 44, 'I₁')}${T(116, 44, 'I₂')}${T(196, 44, 'I₁')}${T(276, 108, 'I₂')}
${TC(160, 128, 'F ＝ 2×10⁻⁷ × I₁I₂ / r ［N/m］', 'tb')}`, '平行導線に働く力'),

  mutual: SVG(110, `${TC(80, 14, '和動接続', 'tb ta')}${TC(240, 14, '差動接続', 'tb tn')}
${WIRE('M14,50H26')}${COIL(26, 50)}${WIRE('M74,50H86')}${COIL(86, 50)}${WIRE('M134,50H146')}<circle cx="30" cy="38" r="3" class="fa"/><circle cx="90" cy="38" r="3" class="fa"/>
${WIRE('M174,50H186')}${COIL(186, 50)}${WIRE('M234,50H246')}${COIL(246, 50)}${WIRE('M294,50H306')}<circle cx="190" cy="38" r="3" class="fn"/><circle cx="290" cy="38" r="3" class="fn"/>
${TC(50, 70, 'L₁')}${TC(110, 70, 'L₂')}${TC(210, 70, 'L₁')}${TC(270, 70, 'L₂')}
${TC(80, 96, 'L ＝ L₁＋L₂＋2M', 'ta')}${TC(240, 96, 'L ＝ L₁＋L₂−2M', 'tn')}`, '和動接続と差動接続'),

  impTriangle: SVG(140, `<path d="M30,110H190V30Z" class="fs st"/><path d="M180,110V100H190" class="st"/>
${TC(110, 126, 'R（抵抗）→ P［W］')}${T(196, 74, 'X → Q［var］')}<text x="70" y="62" class="ts ta tb" transform="rotate(-26.6 70 62)">Z → S［V·A］</text>
<path d="M62,110A32,32 0 0 0 59,96" class="sa"/>${T(68, 104, 'θ', 'ta')}
${T(212, 120, 'cosθ ＝ R/Z ＝ P/S', 'tb')}${T(212, 30, 'Z ＝ √(R²＋X²)', 'tb')}${T(212, 46, 'S ＝ √(P²＋Q²)', '')}`, 'インピーダンス三角形'),

  ydelta: SVG(150, `${TC(80, 14, 'Y 結線', 'tb')}${TC(240, 14, 'Δ 結線', 'tb')}
${WIRE('M80,70V22M80,70L32,108M80,70L128,108')}${RES(80, 70, 80, 22)}${RES(80, 70, 32, 108)}${RES(80, 70, 128, 108)}<circle cx="80" cy="70" r="3" class="fa"/>${T(88, 76, 'N', 'tm')}
${WIRE('M240,30L192,110H288Z')}${RES(240, 30, 192, 110)}${RES(240, 30, 288, 110)}${RES(192, 110, 288, 110)}
${TC(80, 128, 'V線 ＝ √3 V相', 'ta')}${TC(80, 143, 'I線 ＝ I相')}${TC(240, 128, 'V線 ＝ V相')}${TC(240, 143, 'I線 ＝ √3 I相', 'ta')}`, 'Y結線とΔ結線'),

  rcCurve: SVG(150, `${AX(30, 12, 305, 125)}${T(34, 20, 'v_C')}${T(282, 140, 't', 'tm')}
<path d="M30,25H300" class="st d tm2"/>${T(250, 22, 'E（最終値）', 'tm')}
<path d="M30,125C70,60 120,35 300,26" class="sa w3"/>
<path d="M80,125V61H30" class="sn d"/>${TC(80, 140, 'τ', 'tn tb')}${T(34, 57, '0.632E', 'tn')}
${T(110, 100, 'τ ＝ RC（RL 回路は L/R）', 'tb')}`, 'RC回路の充電曲線'),

  electronB: SVG(170, `${[40, 80, 120].map((y) => [30, 70, 250, 290].map((x) => `<circle cx="${x}" cy="${y}" r="5" class="st nofill"/><path d="M${x - 3},${y - 3}l6,6M${x + 3},${y - 3}l-6,6" class="st"/>`).join('')).join('')}
<circle cx="160" cy="80" r="50" class="sa d nofill"/><circle cx="160" cy="30" r="6" class="fa"/>${TC(160, 33, 'e', 'tw tb')}
<path d="M168,30H205" class="sa w2" marker-end="url(#aa)"/>${T(208, 34, 'v', 'ta')}<path d="M160,38V62" class="sn w2" marker-end="url(#an)"/>${T(166, 56, 'F ＝ evB', 'tn')}
${T(6, 150, '⊗ 磁界（紙面の奥向き）', 'tm')}${T(190, 150, 'r ＝ mv/(eB)', 'tb')}${T(190, 164, 'T ＝ 2πm/(eB)', 'tb')}`, '磁界中の電子の円運動'),

  opamp: SVG(160, `<path d="M150,40V110L215,75Z" class="fc st w2"/>${T(155, 62, '−', 'tb')}${T(155, 98, '＋', 'tb')}
${WIRE('M40,55H70')}${RES(70, 55, 110, 55)}${WIRE('M110,55H150')}<circle cx="130" cy="55" r="2.5" class="fa"/>
${WIRE('M130,55V20H170')}${RES(170, 20, 210, 20)}${WIRE('M210,20H240V75')}${WIRE('M215,75H280')}<circle cx="40" cy="55" r="3" class="fa"/><circle cx="280" cy="75" r="3" class="fa"/>
${WIRE('M150,95H130V120')}<path d="M122,120H138M125,124H135M128,128H132" class="st"/>
${TC(90, 46, 'Ri')}${TC(190, 12, 'Rf')}${T(16, 60, 'vin')}${T(266, 92, 'vout')}
${T(6, 154, '仮想短絡：−端子も 0 V とみなせる', 'ta')}${T(190, 120, 'Av ＝ −Rf / Ri', 'tb')}`, '反転増幅回路'),

  meterExt: SVG(130, `${TC(80, 14, '分流器（電流計に並列）', 'tb')}${TC(240, 14, '倍率器（電圧計に直列）', 'tb')}
${WIRE('M20,60H50M110,60H140')}${WIRE('M50,60V40H110V60M50,60V85H65M95,85H110V60')}<circle cx="80" cy="40" r="13" class="fc st"/>${TC(80, 44, 'A', 'tb')}${RES(65, 85, 95, 85)}${TC(80, 104, 'Rs', 'ta')}
${WIRE('M180,60H195')}${RES(195, 60, 235, 60)}${WIRE('M235,60H253M279,60H300')}<circle cx="266" cy="60" r="13" class="fc st"/>${TC(266, 64, 'V', 'tb')}${TC(215, 48, 'Rm', 'ta')}
${TC(80, 124, 'Rs ＝ Ra／(m−1)', 'ta')}${TC(240, 124, 'Rm ＝ (m−1)Rv', 'ta')}`, '分流器と倍率器'),

  // ===================== 機械 =====================
  dcMotor: SVG(130, `${WIRE('M40,95V70')}${BAT(40, 64)}${WIRE('M40,58V30H90')}${RES(90, 30, 130, 30)}${WIRE('M130,30H230V55')}<circle cx="230" cy="72" r="17" class="fc sa w2"/>${TC(230, 76, 'E', 'ta tb')}${WIRE('M230,89V105H40V95')}
<path d="M150,22H190" class="sn" marker-end="url(#an)"/>${T(160, 16, 'Ia', 'tn')}
${T(16, 68, 'V', 'tb')}${TC(110, 20, 'Ra')}${T(254, 66, '逆起電力', 'tm')}${T(254, 80, 'E ＝ KΦN', 'ta')}
${TC(160, 124, '電動機：V ＝ E ＋ IaRa　（発電機は V ＝ E − IaRa）', 'tb')}`, '直流電動機の等価回路'),

  trEq: SVG(130, `<circle cx="30" cy="20" r="3" class="fa"/><circle cx="30" cy="100" r="3" class="fa"/>${WIRE('M30,20H130')}${RES(130, 20, 170, 20)}${WIRE('M170,20H195')}${COIL(195, 20, 3, 7)}${WIRE('M237,20H290V45')}${RES(290, 45, 290, 80)}${WIRE('M290,80V100H30')}
${WIRE('M70,20V40M70,82V100')}${RES(70, 40, 70, 82)}${WIRE('M110,20V40M110,82V100')}${RES(110, 40, 110, 82, 26, 13)}
${T(4, 64, 'V₁', 'tb')}${TC(70, 118, 'g（鉄損）', 'tm')}${TC(116, 118, 'b', 'tm')}${TC(150, 12, 'r（銅損）')}${TC(216, 12, 'x')}${T(298, 66, '負荷')}
${T(128, 56, 'r・x：短絡試験で測る', 'tn')}${T(128, 76, 'g・b：無負荷試験で測る', 'ta')}`, '変圧器の簡易等価回路'),

  tsCurve: SVG(172, `${AX(30, 12, 305, 125)}${T(34, 20, 'トルク T')}${T(250, 140, '回転速度 →', 'tm')}${T(22, 140, 's=1', 'tm')}${T(280, 120, 's=0', 'tm')}
<path d="M30,95C90,85 170,60 215,30C240,18 255,40 288,125" class="sa w3"/>
<path d="M30,32C70,22 100,22 130,30C180,48 230,90 288,125" class="sn w2 d"/>
<path d="M30,100L300,85" class="so"/>${T(232, 82, '負荷トルク', 'to')}
<path d="M215,30H130" class="st d tm2"/>${T(150, 24, '最大トルクは同じ', 'tb')}
${T(6, 156, '実線：通常　点線：二次抵抗を増やした場合', 'tm')}${T(6, 169, '→ 曲線が左へ移動（比例推移）', 'tn')}`, '誘導電動機のトルク特性'),

  vCurve: SVG(150, `${AX(30, 12, 305, 125)}${T(34, 20, '電機子電流')}${T(230, 140, '界磁電流 →', 'tm')}
<path d="M50,30Q140,160 290,25" class="sa w2"/><path d="M50,55Q140,180 290,50" class="so w2"/>
<path d="M140,96V125" class="st d tm2"/>${T(126, 140, '力率 1', 'tm')}
${T(54, 112, '不足励磁', 'tb')}${T(54, 124, '遅れ電流', 'tn')}${T(232, 112, '過励磁', 'tb')}${T(232, 124, '進み電流', 'ta')}
${T(150, 22, '茶：負荷 大　緑：負荷 小', 'tm')}`, '同期電動機のV曲線'),

  chopper: SVG(130, `${WIRE('M30,95V70')}${BAT(30, 64)}${WIRE('M30,58V25H70')}<path d="M70,25L95,14" class="st w2"/><circle cx="70" cy="25" r="2.5" class="fa"/>${WIRE('M100,25H150')}${COIL(150, 25, 4, 6)}${WIRE('M198,25H280V50')}${RES(280, 50, 280, 85)}${WIRE('M280,85V100H30V95')}
${WIRE('M125,25V52M125,72V100')}<path d="M115,52H135L125,68Z" class="fc st"/><path d="M115,52H135" class="st w2"/>
${WIRE('M235,25V55M235,67V100')}<path d="M225,55H245M225,67H245" class="st w2"/>
${T(8, 66, 'E', 'tb')}${TC(82, 10, 'S（IGBT など）')}${T(84, 66, 'D', 'ta')}${T(84, 80, '還流', 'ta')}${TC(174, 15, 'L')}${T(250, 64, 'C')}${T(288, 70, '負荷')}
${TC(160, 122, '出力 Vo ＝ D × E（D：通流率 ＝ オン時間 ／ 周期）', 'tb')}`, '降圧チョッパ'),

  lightGeo: SVG(150, `<circle cx="60" cy="22" r="9" class="fw"/>${T(74, 18, '光源（光度 I）')}
${WIRE('M20,125H300')}${WIRE('M60,31V125', 'st d tm2')}${WIRE('M60,31L240,125', 'sa w2')}<circle cx="240" cy="125" r="3.5" class="fn"/>${T(244, 120, 'P', 'tn tb')}
${T(36, 82, 'h', 'tb')}${TC(150, 140, 'd')}${T(150, 72, 'r ＝ √(h²＋d²)', 'ta')}
<path d="M60,58A27,27 0 0 0 84,43" class="sn"/>${T(66, 70, 'θ', 'tn')}
${T(176, 30, 'Eh ＝ I cosθ ／ r²', 'tb')}${T(176, 46, 'cosθ ＝ h ／ r', '')}`, '水平面照度'),

  feedback: SVG(110, `${T(4, 44, '目標値')}${WIRE('M40,50H78')}<path d="M70,50H78" class="st" marker-end="url(#ah)"/><circle cx="90" cy="50" r="12" class="fc st"/>${TC(90, 54, '＋', 'tb')}${T(96, 76, '−', 'tn tb')}
<path d="M102,50H140" class="st" marker-end="url(#ah)"/><rect x="140" y="34" width="56" height="32" rx="4" class="fs st"/>${TC(168, 55, 'G', 'tb')}
<path d="M196,50H280" class="st" marker-end="url(#ah)"/>${T(282, 54, '出力')}${T(108, 42, '偏差', 'tm')}
${WIRE('M240,50V92H198')}<rect x="142" y="78" width="56" height="28" rx="4" class="fs st"/>${TC(170, 97, 'H', 'tb')}<path d="M142,92H90V64" class="st" marker-end="url(#ah)"/>
${T(210, 20, '全体 ＝ G ／ (1 ＋ GH)', 'tb ta')}`, 'フィードバック制御'),

  gates: SVG(150, `${(() => {
    const g = (x, y, name, shape, out) => `<g>${WIRE(`M${x - 18},${y - 8}H${x}M${x - 18},${y + 8}H${x}`)}${shape}${WIRE(`M${out},${y}H${out + 16}`)}${TC(x + 18, y + 32, name, 'tb')}</g>`;
    const andS = (x, y) => `<path d="M${x},${y - 16}H${x + 18}A16,16 0 0 1 ${x + 18},${y + 16}H${x}Z" class="fc st"/>`;
    const orS = (x, y) => `<path d="M${x},${y - 16}Q${x + 30},${y - 16} ${x + 40},${y}Q${x + 30},${y + 16} ${x},${y + 16}Q${x + 10},${y} ${x},${y - 16}Z" class="fc st"/>`;
    return g(40, 40, 'AND', andS(40, 40), 74) + g(130, 40, 'OR', orS(130, 40), 170) + g(220, 40, 'NAND', andS(220, 40) + '<circle cx="258" cy="40" r="4" class="fc st"/>', 262)
      + `${WIRE('M22,110H40')}<path d="M40,96V124L66,110Z" class="fc st"/><circle cx="70" cy="110" r="4" class="fc st"/>${WIRE('M74,110H90')}${TC(56, 142, 'NOT', 'tb')}`
      + g(130, 110, 'NOR', orS(130, 110) + '<circle cx="174" cy="110" r="4" class="fc st"/>', 178)
      + `<path d="M216,94Q226,110 216,126" class="st"/>` + g(220, 110, 'XOR', orS(220, 110), 260);
  })()}`, '論理ゲート'),

  // ===================== 電力 =====================
  hydro: SVG(172, `<path d="M10,30H80V50L95,50" class="st"/><rect x="10" y="30" width="70" height="20" class="fs"/>${T(14, 26, '貯水池')}
<path d="M95,50L230,115" class="st w3"/><path d="M95,40L230,105" class="st w3"/>${T(104, 92, '水圧管', 'tm')}
<circle cx="245" cy="115" r="14" class="fc sa w2"/>${TC(245, 119, '水車', 'ta')}${WIRE('M259,115H305')}<rect x="250" y="128" width="55" height="12" class="fs"/>${T(262, 148, '放水路', 'tm')}
<path d="M300,30V115" class="st" marker-start="url(#ah)" marker-end="url(#ah)"/>${WIRE('M80,30H305', 'st d tm2')}${T(250, 70, '総落差', 'tb')}
${T(8, 134, 'P ＝ 9.8 Q H η [kW]', 'tb ta')}${T(8, 150, 'H：有効落差＝総落差−損失落差', 'ts')}${T(8, 164, 'Q：流量 [m³/s]', 'ts')}`, '水力発電'),

  rankine: SVG(140, `<rect x="20" y="20" width="80" height="34" rx="6" class="fs st"/>${TC(60, 41, 'ボイラ', 'tb')}
<rect x="200" y="20" width="80" height="34" rx="6" class="fs st"/>${TC(240, 41, 'タービン', 'tb')}
<rect x="200" y="96" width="80" height="34" rx="6" class="fs st"/>${TC(240, 117, '復水器', 'tb')}
<rect x="20" y="96" width="80" height="34" rx="6" class="fs st"/>${TC(60, 117, '給水ポンプ', 'tb')}
<path d="M100,37H198" class="sn w2" marker-end="url(#an)"/>${TC(150, 31, '高温高圧の蒸気', 'tn')}
<path d="M240,54V94" class="st w2" marker-end="url(#ah)"/>${T(246, 78, '排気', 'tm')}
<path d="M200,113H102" class="sa w2" marker-end="url(#aa)"/>${TC(150, 107, '水（復水）', 'ta')}
<path d="M60,96V56" class="sa w2" marker-end="url(#aa)"/>${T(66, 80, '給水', 'ta')}
${T(284, 30, '発電機', 'to')}${T(284, 44, 'へ', 'to')}${T(122, 74, '再熱：途中で再加熱', 'tm')}${T(122, 88, '再生：抽気で給水加熱', 'tm')}`, '汽力発電のサイクル'),

  ctvt: SVG(140, `${TC(80, 14, '変流器 CT（電流用）', 'tb')}${TC(240, 14, '計器用変圧器 VT（電圧用）', 'tb')}
<circle cx="80" cy="50" r="18" class="fc st"/>${WIRE('M20,50H62M98,50H140', 'st w3')}${WIRE('M72,66V90H65M88,66V90H95')}<circle cx="80" cy="96" r="9" class="fc st"/>${TC(80, 100, 'A')}
${TC(80, 122, '二次側の開放は厳禁', 'tn')}${TC(80, 136, '（短絡はOK）', 'tm')}
${WIRE('M190,40H290M190,58H290', 'st w3')}${WIRE('M225,40V25M255,58V25')}<rect x="220" y="62" width="40" height="18" class="fc st"/>${WIRE('M232,80V92M248,80V92')}<circle cx="240" cy="100" r="9" class="fc st"/>${TC(240, 104, 'V')}
${TC(240, 122, '二次側の短絡は厳禁', 'tn')}${TC(240, 136, '（開放はOK）', 'tm')}`, 'CTとVTの注意'),

  sag: SVG(148, `<path d="M30,30V115M290,30V115" class="st w3"/><path d="M30,30Q160,110 290,30" class="sa w2"/>${WIRE('M30,30H290', 'st d tm2')}
<path d="M160,32V68" class="sn" marker-start="url(#an)" marker-end="url(#an)"/>${T(166, 56, 'D（たるみ）', 'tn tb')}
<path d="M32,122H288" class="st" marker-start="url(#ah)" marker-end="url(#ah)"/>${TC(160, 118, 'S（径間）')}
${T(36, 22, 'T（水平張力）')}${TC(220, 98, 'W [N/m]', 'tm')}
${TC(160, 142, 'D ＝ WS² ／ (8T)　　実長 L ＝ S ＋ 8D² ／ (3S)', 'tb')}`, '電線のたるみ'),

  single3: SVG(140, `${COIL(30, 70, 0)}<rect x="16" y="20" width="24" height="100" rx="4" class="fs st"/>${T(8, 136, '変圧器二次側', 'tm')}
${WIRE('M40,30H200M40,70H200M40,110H200')}${T(48, 26, '外線')}${T(48, 66, '中性線', 'ta')}${T(48, 106, '外線')}
${WIRE('M200,30V40M200,60V70')}${RES(200, 40, 200, 60, 20, 10)}${WIRE('M200,70V80M200,100V110')}${RES(200, 80, 200, 100, 20, 10)}
<path d="M140,24H180" class="sn" marker-end="url(#an)"/>${T(144, 20, '30 A', 'tn')}<path d="M180,116H140" class="sn" marker-end="url(#an)"/>${T(144, 128, '20 A', 'tn')}
<path d="M180,64H140" class="sa w2" marker-end="url(#aa)"/>${T(110, 58, '10 A（差）', 'ta tb')}
${T(214, 54, '100 V')}${T(214, 94, '100 V')}<path d="M262,32V108" class="st" marker-start="url(#ah)" marker-end="url(#ah)"/>${T(268, 74, '200 V')}`, '単相3線式'),

  vdrop: SVG(140, `<path d="M30,110H200" class="st w2" marker-end="url(#ah)"/>${T(150, 126, 'Er（受電端）', 'tb')}
<path d="M200,110L250,80" class="sn w2" marker-end="url(#an)"/>${T(226, 106, 'RI', 'tn')}
<path d="M250,80L280,30" class="sa w2" marker-end="url(#aa)"/>${T(270, 64, 'XI', 'ta')}
<path d="M30,110L280,30" class="so w2" marker-end="url(#ah)"/>${T(110, 60, 'Es（送電端）', 'to tb')}
<path d="M30,110L110,150" class="st d" marker-end="url(#ah)"/>${T(70, 140, 'I（θ 遅れ）', 'tm')}
${T(6, 20, '電圧降下 ≒ I(R cosθ ＋ X sinθ)', 'tb')}${T(6, 34, '三相は √3 倍、単相2線式は 2 倍', 'tm')}`, '電圧降下のベクトル図'),

  guy: SVG(150, `<path d="M90,20V140" class="st w3"/>${WIRE('M20,140H300')}<path d="M90,24H30" class="sn w2" marker-end="url(#an)"/>${T(26, 18, '電線の張力 P', 'tn')}
<path d="M90,24L210,140" class="sa w2"/>${T(150, 76, '支線の張力 T', 'ta tb')}<path d="M90,52A28,28 0 0 0 110,44" class="st"/>${T(96, 64, 'θ', 'tb')}
${T(170, 24, 'T sinθ ＝ P', 'tb')}${T(170, 40, 'T ＝ P ／ sinθ', 'tb')}${T(170, 56, '必要な強さ ＝ T × 安全率', 'tm')}`, '支線の張力'),

  loadCurve: SVG(158, `${AX(30, 12, 305, 125)}${T(34, 20, '電力 [kW]')}${T(276, 140, '時刻', 'tm')}
<path d="M30,28H300" class="st d tm2"/>${T(226, 24, '設備容量', 'tm')}
<path d="M30,105H70V95H100V60H130V45H170V50H200V70H240V90H270V105H300" class="sa w2"/>
<path d="M30,45H300" class="sn d"/>${T(230, 41, '最大需要電力', 'tn')}<path d="M30,78H300" class="so d"/>${T(244, 74, '平均電力', 'to')}
${T(6, 154, '需要率＝最大÷設備容量　負荷率＝平均÷最大', 'tb')}`, '負荷曲線'),
};
