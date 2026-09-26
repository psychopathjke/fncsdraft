// Доска лидеров — карточкой под постом, как у Кинча.
//
// Его слово: «делай как у кинча реал». У него это картинка-таблица: показатель,
// число, ник. Строкой текста девять показателей читались как каша, поэтому текст
// поста стал заголовком, а числа переехали в то же вложение, которым пост носит
// таблицу этапа (.x-shot). Своя строка подсвечивается — доску читают, чтобы
// найти на ней себя.
//
//   node tools/patch-leadcard.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("ccLeadHTML")) { console.log("уже впаяно"); process.exit(0); }

const read = f => fs.readFileSync(path.join(__dirname, f), "utf8")
  .split(CRLF).join(LF).split(LF).filter((s, i, a) => i < a.length - 1 || s.trim());
const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Рисовальщик — рядом с рисовальщиком таблицы этапа.
swap("function ccShotHTML(tbl){", read("leadcard-code.txt").join(LF) + LF + "function ccShotHTML(tbl){", "рисовальщик");

// 2. Стиль строки: показатель слева, число и ник справа.
swap("  .x-shot-r.me{background:rgba(62,233,184,.08);}",
  "  .x-shot-r.me{background:rgba(62,233,184,.08);}" + LF +
  "  /* Строка доски лидеров: слева показатель, справа число и ник. Числа" + LF +
  "     табличными цифрами, чтобы столбец не плясал. */" + LF +
  "  .x-lead-r{grid-template-columns:minmax(0,1fr) auto auto;}" + LF +
  "  .x-lead-r b{font-weight:700;color:#8ea6d6;}" + LF +
  "  .x-lead-r em{color:#e8f0ff;font-weight:800;font-variant-numeric:tabular-nums;}" + LF +
  "  .x-lead-r i{color:#6f83ab;font-style:normal;max-width:38%;overflow:hidden;" + LF +
  "    text-overflow:ellipsis;white-space:nowrap;}" + LF +
  "  .x-lead-r.me em, .x-lead-r.me i{color:#3ee9b8;}", "стиль");

// 3. Запись несёт доску так же, как таблицу.
swap("                   by:(opt&&opt.by)||undefined, tbl,",
     "                   by:(opt&&opt.by)||undefined, tbl," + LF +
     "                   // Доска лидеров вечера — вложение того же рода, что и tbl." + LF +
     "                   lead:(opt&&opt.lead)||undefined,", "хранение");

// 4. Рисуется везде, где рисуется таблица: лента, цитата и шапка новостей.
let drawn = 0;
src = src.split(LF).map(line => {
  if (line.indexOf("ccShotHTML(n.tbl)") >= 0) { drawn++; return line.replace("ccShotHTML(n.tbl)", "ccShotHTML(n.tbl)+ccLeadHTML(n.lead)"); }
  if (line.indexOf("ccShotHTML(src.tbl)") >= 0) { drawn++; return line.replace("ccShotHTML(src.tbl)", "ccShotHTML(src.tbl)+ccLeadHTML(src.lead)"); }
  if (line.indexOf("ccShotHTML(lead.tbl)") >= 0) { drawn++; return line.replace("ccShotHTML(lead.tbl)", "ccShotHTML(lead.tbl)+ccLeadHTML(lead.lead)"); }
  return line;
}).join(LF);
if (drawn < 3) throw new Error("места отрисовки найдены не все: " + drawn);

// 5. Пост отдаёт доску вложением, а текстом — заголовок.
swap("  careerNews('flat', 'ccNewsStatBoard', [label, rows]);",
     "  careerNews('flat', 'ccNewsStatBoard', [label, rows], {lead:{cap:label, rows:rows}});", "пост");

// 6. Строки: подпись карточки и укороченный текст поста — в пять словарей.
const cap = read("leadcard-lines.txt"), short = read("leadcard-short.txt");
if (cap.length !== 5 || short.length !== 5) throw new Error("в файлах строк не по пять");
const lang = line => line.indexOf("лидеры вечера") >= 0 ? 0
  : line.indexOf("stats leaders") >= 0 ? 1
  : line.indexOf("meilleurs du soir") >= 0 ? 2
  : line.indexOf("migliori della serata") >= 0 ? 3
  : line.indexOf("líderes da noite") >= 0 ? 4 : -1;
let n1 = 0;
src = src.split(LF).map(line => {
  if (line.indexOf("ccNewsStatBoard:(ev,rows)=>") < 0) return line;
  const k = lang(line);
  if (k < 0) return line;
  n1++;
  const pad = (line.match(/^\s*/) || [""])[0];
  return pad + short[k] + LF + pad + cap[k];
}).join(LF);
if (n1 !== 5) throw new Error("строки заменены в " + n1 + " словарях");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("доска стала карточкой; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
