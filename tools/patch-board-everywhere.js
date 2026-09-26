// Доска лидеров — после КАЖДОГО турнирного финала, а не только девяти крупных.
//
// Его вопрос: «fncs major соло и тд все финалы турниров?» Нет, не все: доска
// висела на careerCongrats, через который проходят недельный финал, Мейджоры,
// Саммит, Глобалы, Париж, финал круга и Кубок наций. Мимо шли Victory Cup,
// Про-Ам, соло-серия (и январская, и FNCS Solos) и Ласт-Ченс Глобалов.
//
// Теперь доска (а где есть своя команда — и личный разбор) идёт и там. Правило
// одно: только ФИНАЛ турнира. Квалы, хиты и отборы молчат — лидеров объявляют,
// когда турнир кончился, а не посреди него.
//
//   node tools/patch-board-everywhere.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("ccBoardAfter")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// Общая дверь: и доска, и личный разбор, одним вызовом.
swap("function ccStatBoardPost(ranked, label){",
  "/* Один вызов на конец турнира: личный разбор и доска лидеров." + LF +
  "   Зовётся из каждого раннера, чей вечер — финал. */" + LF +
  "function ccBoardAfter(ranked, you, label){" + LF +
  "  ccKinchPost(ranked, you, label);" + LF +
  "  ccStatBoardPost(ranked, label);" + LF +
  "}" + LF +
  "function ccStatBoardPost(ranked, label){", "общая дверь");

// 1. Victory Cup — вечер сам себе финал.
swap("  careerPrAdd(ranked1, {div:CAREER.career.division, kind:'victory'});",
     "  careerPrAdd(ranked1, {div:CAREER.career.division, kind:'victory'});" + LF +
     "  ccBoardAfter(ranked1, you, ev.label);", "victory");

// 2. Про-Ам — одна ночь, она же финал.
swap("  careerPrAdd(ranked, {div:cr.division, kind:'proam'});",
     "  careerPrAdd(ranked, {div:cr.division, kind:'proam'});" + LF +
     "  ccBoardAfter(ranked, you, ev.label);", "проам");

// 3. Соло — только финальный вечер серии.
swap("  careerPrAdd(ranked, {div:cr.division, kind:'solo', stage:ev.stage});",
     "  careerPrAdd(ranked, {div:cr.division, kind:'solo', stage:ev.stage});" + LF +
     "  // Соло играется в несколько вечеров: доска — только на финальном." + LF +
     "  if(ev.stage==='final') ccBoardAfter(ranked, you, ev.label);", "соло");

// 4. Ласт-Ченс Глобалов — доска на его финале.
swap("  careerPrAdd(ranked, {div:CAREER.career.division, kind:'gclc'});",
     "  careerPrAdd(ranked, {div:CAREER.career.division, kind:'gclc'});" + LF +
     "  if(ev.final) ccBoardAfter(ranked, you, ev.label);", "ласт-ченс");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("доска впаяна во все финалы; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
