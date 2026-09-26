// Матчевая статистика — по настоящим числам Кинча.
//
// Его «делай» на калибровку. Опора — пост Kinch Analytics за день 1 Глобалов
// 2026: лидеры дня на игрока за шесть игр (урон 4128, урон в минуту 41.28,
// ассисты 26, нафармлено 20327, пройдено 34.02 км, шторм 47:03). Замер нашей
// модели до правки лежит в комментарии рядом с самими числами.
//
// Правится четыре места: урон (и его связь со временем), ассисты, метсы и время
// в шторме. Время в живых не трогаем — оно сходилось точно.
//
//   node tools/patch-matchstats.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("Kinch Analytics за день 1")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Урон и соотношение.
const oldDmg = [
  "  const hits = Math.round(elims*srnd(7,11) + surv*size*srnd(12,24) + srnd(4,16));",
  "  const acc  = clamp(0.072 + sk*0.055 + srnd(-0.012,0.012), 0.045, 0.19);",
  "  const shots = Math.round(hits/acc);",
  "  const dmgTo = Math.round(hits*srnd(33,43));",
  "  const dmgFrom = Math.round(dmgTo/clamp(0.8 + sk*0.9 + srnd(-0.28,0.28), 0.42, 2.7));"
].join(LF);
swap(oldDmg, fs.readFileSync(path.join(__dirname, "matchstats-new.txt"), "utf8")
  .split(CRLF).join(LF).replace(/\n+$/, ""), "урон");

// 2. Ассисты: у Кинча лидер 26 за день на игрока, у нас выходило 13.5.
swap("  s.assists += Math.round(elims*srnd(0.8,1.3));",
     "  // Ассисты щедрые: любой вклад в выбитого считается. Лидер дня у Кинча — 26" + LF +
     "  // на игрока за шесть игр, у нас до правки выходило 13.5." + LF +
     "  s.assists += Math.round(elims*srnd(1.6,2.5));", "ассисты");

// 3. Метсы: нафармлено 20327 у лидера против наших 3932.
const oldMats = [
  "  const wood = Math.round(surv*srnd(380,880) + srnd(140,400));",
  "  const stone = Math.round(surv*srnd(55,175) + srnd(20,70));",
  "  const metal = Math.round(surv*srnd(85,225) + srnd(30,95));"
].join(LF);
swap(oldMats, [
  "  /* Метсы: у Кинча лидер дня нафармил 20 327 за шесть игр, то есть больше трёх",
  "     тысяч за игру на человека — ферма в комп-Фортнайте идёт весь матч. У нас",
  "     до правки выходило 3 932 за день, впятеро меньше. */",
  "  const wood = Math.round(surv*srnd(1980,4580) + srnd(730,2080));",
  "  const stone = Math.round(surv*srnd(285,910) + srnd(105,365));",
  "  const metal = Math.round(surv*srnd(440,1170) + srnd(155,495));"
].join(LF), "метсы");

// 4. Шторм: 47:03 за день у лидера — почти половина времени в живых.
swap("  const storm = Math.round(alive*srnd(0.05,0.2));",
     "  /* Время в шторме: у Кинча лидер дня провёл в нём 47:03 при сотне минут" + LF +
     "     в живых — то есть почти половину. У нас стояло от пяти до двадцати" + LF +
     "     процентов, и за день выходило 927 секунд против его 2 823. */" + LF +
     "  const storm = Math.round(alive*srnd(0.22,0.62));", "шторм");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("модель откалибрована; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
