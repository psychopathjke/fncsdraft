// Лестница дивизионов — такая, какая она у Epic: пять ступеней в Европе и NA
// Central, три во всех остальных регионах.
//
// Его слово 26 сентября: «в мидл ист океания азия вест их 3 вроде, не как в еу и
// нак». Проверено по id событий Epic на Tracker (177 дивизионных капов в архиве):
// Division 1, 2 и 3 есть во всех семи регионах, Division 4 и 5 — ТОЛЬКО EU и NAC.
// В игре лестница была одинаковой везде, и карьера в Океании могла начать в
// пятом дивизионе, которого там нет.
//
// Полосы рейтинга у трёхступенчатых регионов — его выбор из двух: не отрезать
// низ (82/75/68), а растянуть ту же полосу на три ступени, 82/68/54. Так низ
// остаётся входным уровнем: в Мидл Исте третий дивизион и есть вход для всех,
// а не «почти первый».
//
//   node tools/patch-div-depth.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("ccDivCount")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Глубина лестницы и полосы под неё.
const oldBand = "const CC_DIV_RATING={1:82, 2:75, 3:68, 4:61, 5:54};";
swap(oldBand,
  "const CC_DIV_RATING={1:82, 2:75, 3:68, 4:61, 5:54};" + LF +
  "/* Сколько ступеней у региона. У Epic дивизионные капы 4 и 5 идут только в" + LF +
  "   Европе и NA Central — в остальных пяти регионах лестница кончается третьим" + LF +
  "   (проверено по id событий: 177 капов в архиве Tracker, D1-D3 везде, D4-D5" + LF +
  "   только EU и NAC). */" + LF +
  "const CC_DIV_DEEP=['EU','NAC'];" + LF +
  "function ccDivCount(reg){" + LF +
  "  const r=reg || (typeof ccCareerRegion==='function' ? ccCareerRegion() : 'EU');" + LF +
  "  return CC_DIV_DEEP.indexOf(r)>=0 ? 5 : 3;" + LF +
  "}" + LF +
  "/* Три ступени держат ту же полосу, что и пять: верх остаётся верхом, низ —" + LF +
  "   входом. Отрезать 4 и 5 было нельзя: тогда третий дивизион Мидл Иста стал бы" + LF +
  "   на четырнадцать очков выше входа, то есть вход в карьеру там оказался бы" + LF +
  "   сильнее, чем в Европе. Его решение 26 сентября. */" + LF +
  "const CC_DIV_RATING_3={1:82, 2:68, 3:54};", "полоса и глубина");

const oldBandFn = "function ccBand(div, reg){ return (CC_DIV_RATING[div]||54)+ccDivShift(reg); }";
swap(oldBandFn,
  "function ccBand(div, reg){" + LF +
  "  const tbl=ccDivCount(reg)===3 ? CC_DIV_RATING_3 : CC_DIV_RATING;" + LF +
  "  return (tbl[div]||54)+ccDivShift(reg);" + LF +
  "}", "функция полосы");

// 2. Выбор дивизиона на создании — столько ступеней, сколько их в регионе.
const oldChips = "  document.getElementById('ccDivChips').innerHTML=[1,2,3,4,5].map(d=>{";
swap(oldChips,
  "  /* Ступеней столько, сколько их в выбранном регионе: в Океании нет ни" + LF +
  "     четвёртого дивизиона, ни пятого. Выбор, оставшийся за краем (сменили" + LF +
  "     регион с Европы на Азию), съезжает на нижнюю ступень. */" + LF +
  "  const divN=ccDivCount(CC.region);" + LF +
  "  if((CC.div||1)>divN) CC.div=divN;" + LF +
  "  const divList=[]; for(let d=1; d<=divN; d++) divList.push(d);" + LF +
  "  document.getElementById('ccDivChips').innerHTML=divList.map(d=>{", "чипы дивизиона");

// 3. Сейв, заведённый до правки, встаёт на нижнюю ступень своего региона.
const oldMig = "function careerMigrateNoDiv(){";
swap(oldMig,
  "/* Сейв из региона, где ступеней три, мог сидеть в четвёртом или пятом:" + LF +
  "   до сегодняшней правки их предлагали везде. Опускаем на нижнюю ступень" + LF +
  "   региона — это то же место в лестнице, просто названное верно. */" + LF +
  "function careerMigrateDivDepth(){" + LF +
  "  const cr=CAREER && CAREER.career;" + LF +
  "  if(!cr) return;" + LF +
  "  const n=ccDivCount(typeof ccCareerRegion==='function' ? ccCareerRegion() : null);" + LF +
  "  if((cr.division||1)>n){ cr.division=n; if(typeof careerSave==='function') careerSave(); }" + LF +
  "}" + LF + oldMig, "миграция сейва");

// Миграция зовётся там же, где и соседняя.
const oldCall = "careerMigrateNoDiv();";
const calls = src.split(oldCall).length - 1;
if (calls < 1) throw new Error("не найден вызов careerMigrateNoDiv()");
src = src.replace(oldCall, "careerMigrateNoDiv(); careerMigrateDivDepth();");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("впаяно; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
