// Плитки года — в своём виде, и ссылка «что это за игра» перестаёт быть чужой.
//
// Его слово 26 сентября, два скрина: «как-то неуместно выглядит дизайн» про
// ссылку на первом экране и «эти года панельки в дизайне года фнкс сделать типо»
// про выбор года.
//
// ГОД. Три года — это три сезона FNCS, а выглядели они как три одинаковых чипа,
// таких же, как сложность ниже. Теперь это пластина сезона: номер года узким
// капсом, под ним формат, третьей строкой — международка, ради которой сезон и
// играется: Антверпен, Лион, Форт-Уэрт. Имена городов не переводятся (то же
// правило, что у «Reload Championship»). У каждого сезона своя полоса сверху и
// свой цвет выбранного состояния: бирюза бренда, фиолетовый редкости карточек и
// жёлтый единственной кнопки действия — все три уже живут в файле. Срез угла —
// тот же --cut, что у плиток режимов.
//
// ССЫЛКА. Была голая подчёркнутая строка между двумя большими кнопками и
// читалась как обрывок текста. Стала тихой кнопкой той же геометрии (скос -8°,
// узкий капс), но без заливки: третье действие, а не третий призыв.
//
//   node tools/patch-year-tiles.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
const Q = String.fromCharCode(39), BT = String.fromCharCode(96), BS = String.fromCharCode(92);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("cc-year-tile")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Разметка ссылки: внутренний span, чтобы текст не ехал вместе со скосом.
swap('<div class="hero-about"><a href="about.html" data-i18n="aboutLink"></a></div>',
     '<div class="hero-about"><a href="about.html"><span data-i18n="aboutLink"></span></a></div>',
     "разметка ссылки");

// 2. Стиль ссылки.
swap('.hero-about a{color:var(--ink-dim,#96a3b5);font-size:13px;text-decoration:underline;text-underline-offset:3px}' + LF +
     '.hero-about a:hover{color:var(--ink,#e6ecf5)}',
     [
       "/* Тихая третья кнопка: геометрия двух главных, но без заливки и на тон",
       "   темнее — она объясняет, а не зовёт. */",
       '.hero-about a{display:inline-block;font-family:var(--font-display);font-weight:500;font-size:12px;',
       '  letter-spacing:.08em;text-transform:uppercase;line-height:1;padding:8px 16px 7px;',
       '  color:var(--ink-dim,#96a3b5);text-decoration:none;border:1px solid rgba(255,255,255,.16);',
       '  background:rgba(255,255,255,.03);transform:skewX(-8deg);transition:color .15s,border-color .15s;}',
       '.hero-about a>span{display:inline-block;transform:skewX(8deg);}',
       '.hero-about a:hover{color:var(--ink,#e6ecf5);border-color:rgba(255,255,255,.34);}',
       '.hero-about a:focus-visible{outline:2px solid var(--go,#ffdd00);outline-offset:2px;}'
     ].join(LF), "стиль ссылки");

// 3. Пластины сезона.
const oldGrid = "  .cc-year-panel .cc-chips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;max-width:620px;}";
const newGrid = [
  "  .cc-year-panel .cc-chips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;max-width:620px;}",
  "  /* Пластина сезона: полоса своего цвета сверху, год узким капсом, под ним",
  "     формат и международка. Цвет приезжает переменной --yr с самой кнопки. */",
  "  .cc-year-tile{position:relative;display:block;text-align:left;padding:12px 12px 10px;",
  "    border:1px solid rgba(255,255,255,.14);border-radius:0;background:rgba(255,255,255,.05);",
  "    color:var(--ink,#e6ecf5);clip-path:var(--cut);overflow:hidden;",
  "    font-family:var(--font-display);line-height:1;transition:border-color .15s,background .15s;}",
  '  .cc-year-tile::before{content:"";position:absolute;left:0;top:0;right:0;height:3px;',
  "    background:var(--yr,#00b090);opacity:.65;}",
  "  .cc-year-tile b{display:block;font-size:28px;font-weight:600;letter-spacing:.01em;}",
  "  .cc-year-tile small{display:block;margin-top:5px;font-size:10.5px;font-weight:500;",
  "    letter-spacing:.08em;text-transform:uppercase;opacity:.72;}",
  "  .cc-year-tile i{display:block;margin-top:2px;font-style:normal;font-size:9.5px;font-weight:400;",
  "    letter-spacing:.12em;text-transform:uppercase;opacity:.45;}",
  "  .cc-year-tile:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.08);}",
  "  .cc-year-tile:hover::before{opacity:1;}",
  "  .cc-year-tile.on{background:var(--yr,#00b090);border-color:var(--yr,#00b090);color:#0b0f12;}",
  "  .cc-year-tile.on::before{background:rgba(255,255,255,.55);opacity:1;}",
  "  .cc-year-tile.on small{opacity:.8;}",
  "  .cc-year-tile.on i{opacity:.6;}",
  "  .cc-year-tile:disabled{opacity:.4;cursor:not-allowed;}",
  "  .cc-year-tile:disabled:hover{border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.05);}"
].join(LF);
if (src.split(oldGrid).length - 1 !== 1) throw new Error("сетка года: якорь не один");
src = src.replace(oldGrid, newGrid);

// 4. Рендер: цвет и город года.
const anchorMap = "    ychips.innerHTML=[2026, 2025, 2024].map(y=>{";
const lookTable = [
  "    /* Международка года — та, ради которой сезон и играется. Имена городов",
  "       одинаковы на всех языках, поэтому строкой словаря не идут. */",
  "    const YEAR_LOOK={2026:{c:" + Q + "#00b090" + Q + ", lan:" + Q + "Antwerp" + Q + "},",
  "                     2025:{c:" + Q + "#b14bf4" + Q + ", lan:" + Q + "Lyon" + Q + "},",
  "                     2024:{c:" + Q + "#ffdd00" + Q + ", lan:" + Q + "Fort Worth" + Q + "}};",
  anchorMap
].join(LF);
swap(anchorMap, lookTable, "таблица вида года");

const lines = src.split(LF);
const bi = lines.findIndex(l => l.indexOf("return " + BT + '<button class="cc-chip${on?') === 6);
if (bi < 0) throw new Error("строка кнопки года не найдена");
lines.splice(bi, 0, "      const look=YEAR_LOOK[y]||{c:" + Q + "#00b090" + Q + ", lan:" + Q + Q + "};");
lines[bi + 1] = "      return " + BT + '<button class="cc-chip cc-year-tile${on?' + BS + Q + " on" + BS + Q + ":" + BS + Q + BS + Q + "}${off?" + BS + Q + " soon" + BS + Q + ":" + BS + Q + BS + Q + '}" style="--yr:${look.c}" ' +
  "${off?" + BS + Q + 'disabled title="' + BS + Q + "+esc(L().ccMpLockedBy)+" + BS + Q + '"' + BS + Q + ":" + BS + Q + BS + Q + "} " +
  'onclick="ccPickYear(${y})"><b>${y}</b><small>${L()[' + BS + Q + "ccYear" + BS + Q + "+y]}</small><i>${look.lan}</i></button>" + BT + ";";
src = lines.join(LF);

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("впаяно; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
