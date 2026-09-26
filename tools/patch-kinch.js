// Разбор вечера от аналитика — его просьба 26 сентября.
//
// Его слова: «u should add kinch analyst… like after every grands and cash cup
// ewc etc yu should see how your player played» и ссылка на x.com/KinchAnalytics
// («вот посмотри про что он, чтоб после капов больши были посты как у него»).
//
// Что делает этот аккаунт в жизни: после турнира выкладывает разбор цифрами —
// сколько игр, какое среднее место, сколько элимов, откуда очки. Здесь то же
// самое и по ТОМУ ЖЕ журналу, который видит карточка вечера (you.stageLog):
// ничего не досчитывается отдельным броском, иначе пост и карточка расходились
// бы на глазах.
//
// Постится один раз за крупный вечер — из careerCongrats, через который
// проходят все девять: недельный финал, Мейджоры, Саммит, Глобалы, Париж,
// финал круга и Кубок наций. Меньше двух игр — не разбор, пост не идёт.
//
//   node tools/patch-kinch.js
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("ccNewsKinch")) { console.log("уже впаяно"); process.exit(0); }
if (!fs.existsSync(path.join(ROOT, "photos", "KinchAnalytics.jpg")))
  throw new Error("нет файла photos/KinchAnalytics.jpg");

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Аккаунт аналитика рядом с аккаунтом сцены.
swap("const CC_PRESS={name:'Fortnite Competitive', handle:'FNCompetitive', verified:true,",
  "/* Аналитик сцены: свой аккаунт, как у прессы, со своим лицом. */" + LF +
  "const CC_ANALYST={name:'Kinch Analytics', handle:'KinchAnalytics', verified:true," + LF +
  "                  av:'KinchAnalytics.jpg'};" + LF +
  "const CC_PRESS={name:'Fortnite Competitive', handle:'FNCompetitive', verified:true,", "аккаунт");

// 2. Автор поста.
swap("  if(who==='press' && !ccPressWorthy(e)) who='you';",
  "  // Разбор пишет аналитик и только он: это его формат, не пресса и не игрок." + LF +
  "  if(who==='analyst') return Object.assign({}, CC_ANALYST);" + LF +
  "  if(who==='press' && !ccPressWorthy(e)) who='you';", "автор");

// 3. Ключ в списке авторов.
swap("  ccNewsPromoted:'press', ccNewsWinner:'press',",
  "  ccNewsPromoted:'press', ccNewsWinner:'press'," + LF +
  "  ccNewsKinch:'analyst',", "ключ автора");

// 4. Сам разбор — из careerCongrats, через который проходят все крупные вечера.
swap("function careerCongrats(ranked, you, label){" + LF + "  if(!ranked || !ranked.length) return;",
  "/* Разбор вечера цифрами. Считается по журналу игр, который уже собран" + LF +
  "   вечером: места, элимы и разложение очков. Лобби меряется тем же полем," + LF +
  "   что стоит в таблице, поэтому «по элимам в лобби» — не оценка, а место." + LF +
  "   Одна игра — не разбор: вечер, оборванный на первой, промолчит. */" + LF +
  "function ccKinchPost(ranked, you, label){" + LF +
  "  if(!you || !ranked || !ranked.length) return;" + LF +
  "  const log=(you.stageLog||[]).filter(g=>g && g.place!=null);" + LF +
  "  if(log.length<2) return;" + LF +
  "  const games=log.length;" + LF +
  "  const place=ranked.indexOf(you)+1;" + LF +
  "  if(place<1) return;" + LF +
  "  const avg=log.reduce((s,g)=>s+g.place, 0)/games;" + LF +
  "  const elims=log.reduce((s,g)=>s+(g.elims||0), 0);" + LF +
  "  const elimPts=log.reduce((s,g)=>s+(g.elimPts||0), 0);" + LF +
  "  const pts=(you.stagePts!=null ? you.stagePts : log.reduce((s,g)=>s+(g.pts||0), 0));" + LF +
  "  const placePts=Math.max(0, pts-elimPts);" + LF +
  "  const better=ranked.filter(t=>t!==you && (t.stageElims||0)>elims).length;" + LF +
  "  careerNews('flat', 'ccNewsKinch', [label, place, games, avg.toFixed(1), elims," + LF +
  "             (elims/games).toFixed(1), ccNum(placePts), ccNum(elimPts), better+1]);" + LF +
  "}" + LF +
  "function careerCongrats(ranked, you, label){" + LF +
  "  if(!ranked || !ranked.length) return;" + LF +
  "  ccKinchPost(ranked, you, label);", "разбор");

// 5. Строки на пяти языках — рядом со строкой поздравления, язык по ней же.
const byLang = fs.readFileSync(path.join(__dirname, "kinch-line.txt"), "utf8")
  .split(CRLF).join(LF).split(LF).filter(s => s.trim());
if (byLang.length !== 5) throw new Error("в kinch-line.txt не пять строк, а " + byLang.length);
const order = [/РАЗБОР/, /BREAKDOWN/, /ANALYSE/, /ANALISI/, /ANÁLISE/];
const pick = [
  [/ccNewsCongrats:\(t,\s*e\)=>'/, null]
];
let added = 0;
src = src.split(LF).map(line => {
  // Только строка СЛОВАРЯ: в карте авторов (CC_POST_BY) ключ тот же, но это не текст.
  const i = (line.indexOf("ccNewsCongrats:(") >= 0) ? line.indexOf("ccNewsCongrats:(") : -1;
  if (i < 0) return line;
  // Язык словаря — по языку соседней строки поздравления.
  let k = -1;
  if (/Поздравля|ЧЕМПИОН|поздрав/i.test(line)) k = 0;
  else if (/Congratulations|congrats/i.test(line)) k = 1;
  else if (/Félicitations|Bravo/i.test(line)) k = 2;
  else if (/Congratulazioni|Complimenti/i.test(line)) k = 3;
  else if (/Parabéns/i.test(line)) k = 4;
  if (k < 0) return line;
  added++;
  const pad = (line.match(/^\s*/) || [""])[0];
  return line + LF + pad + byLang[k];
}).join(LF);
if (added !== 5) throw new Error("строка разбора добавлена в " + added + " словарей, а нужно 5");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("разбор впаян, словарей: " + added + "; index.html " +
            (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
