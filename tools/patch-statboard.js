// Доска лидеров вечера — в формате самого Kinch Analytics.
//
// Его ссылка на пост 26 сентября и слово «и все статистики можно добавить
// как-то». Оказалось, считать ничего не надо: матчевая статистика в моде уже
// ведётся (accumulateMatchStats) — урон нанесённый и полученный, ассисты,
// метсы, время в живых, время в шторме, расстояние. Доска достаёт лидера по
// каждой строке и постит одним сообщением от аккаунта аналитика.
//
//   node tools/patch-statboard.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("ccStatLeaders")) { console.log("уже впаяно"); process.exit(0); }

const read = f => fs.readFileSync(path.join(__dirname, f), "utf8")
  .split(CRLF).join(LF).split(LF).filter((s, i, a) => i < a.length - 1 || s.trim());

// 1. Код доски — рядом с разбором вечера.
const anchor = "function careerCongrats(ranked, you, label){";
if (src.split(anchor).length - 1 !== 1) throw new Error("якорь careerCongrats не один");
src = src.replace(anchor, read("statboard-code.txt").join(LF) + LF + anchor);

// 2. Доска постится вместе с разбором.
const call = "  ccKinchPost(ranked, you, label);";
if (src.split(call).length - 1 !== 1) throw new Error("якорь вызова разбора не один");
src = src.replace(call, call + LF + "  ccStatBoardPost(ranked, label);");

// 3. Автор — тот же аналитик.
const by = "  ccNewsKinch:'analyst',";
if (src.split(by).length - 1 !== 1) throw new Error("якорь автора не один");
src = src.replace(by, by + LF + "  ccNewsStatBoard:'analyst',");

// 4. Строки доски и две новые подписи — в пять словарей, язык по соседней строке.
const board = read("statboard-lines.txt");
const labels = read("statboard-labels.txt");
if (board.length !== 5 || labels.length !== 5) throw new Error("в файлах строк не по пять");
const lang = line =>
  /РАЗБОР/.test(line) ? 0 : /BREAKDOWN/.test(line) ? 1 : /ANALYSE/.test(line) ? 2 :
  /ANALISI/.test(line) ? 3 : /ANÁLISE/.test(line) ? 4 : -1;
let a1 = 0, a2 = 0;
src = src.split(LF).map(line => {
  const pad = (line.match(/^\s*/) || [""])[0];
  if (line.indexOf("ccNewsKinch:(") >= 0) {
    const k = lang(line);
    if (k < 0) return line;
    a1++;
    return line + LF + pad + board[k];
  }
  if (line.indexOf("s_surge:") >= 0) {
    // Подписи новых двух строк — рядом с остальными s_*; язык опознаётся по
    // тому, как в этом же словаре написан Surge.
    const k = line.indexOf('Surge-') >= 0 ? 0
            : line.indexOf('Surge Hits') >= 0 ? 1
            : line.indexOf('surtension') >= 0 ? 2
            : line.indexOf('Colpi di Surge') >= 0 ? 3
            : line.indexOf('Acertos de Surge') >= 0 ? 4 : -1;
    if (k < 0) return line;
    a2++;
    return line + LF + pad + labels[k];
  }
  return line;
}).join(LF);
if (a1 !== 5) throw new Error("доска добавлена в " + a1 + " словарей");
if (a2 !== 5) throw new Error("подписи добавлены в " + a2 + " словарей");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("доска лидеров впаяна; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
