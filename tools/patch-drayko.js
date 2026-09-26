// Клуб Drayko Esport — его просьба 26 сентября (x.com/Esportdrayko, «добавить»).
//
// Что за клуб: французская организация, основана в 2026-м, в шапке профиля сама
// пишет свой послужной список — «1x final div | 3x final solo | 900$», 82
// подписчика. На esportsearnings и Liquipedia её нет. Поэтому уровень — пол
// списка: это самый молодой и самый маленький клуб в файле, и ставить его выше
// Shimo (80, тоже без призовых) было бы выдумкой в пользу новичка.
//
// Герб — аватар профиля, приведённый к 200×200 (у аватара-фотографии PNG на
// 400×400 весит 202 КБ против 23 КБ у плоских логотипов).
//
//   node tools/patch-drayko.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("Drayko")) { console.log("уже впаяно"); process.exit(0); }
if (!fs.existsSync(path.join(path.resolve(__dirname, ".."), "logos", "Drayko_Esport.png")))
  throw new Error("нет файла logos/Drayko_Esport.png");

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Герб — в список известных файлов (его же регенерирует career-org-check).
swap("'Poyo_Esports.png','QT_DIG.png',",
     "'Drayko_Esport.png','Poyo_Esports.png','QT_DIG.png',", "список гербов");

// 2. Сам клуб — рядом с Shimo, тем же порядком: имя, уровень, новичок.
const shimo = "  {name:'Shimo',          tier:80, n:0, newcomer:true},   // 21.09 вечер, отзыв: «Shimo, просто не Crew»";
swap(shimo, shimo + LF +
  "  /* Drayko Esport — его просьба 26.09 (x.com/Esportdrayko). Основан в 2026-м," + LF +
  "     в шапке профиля сам пишет свой счёт: «1x final div | 3x final solo | 900$»." + LF +
  "     Ни на esportsearnings, ни на Liquipedia его нет, состава в карточках тоже" + LF +
  "     нет — уровень ставится полом списка, ниже Shimo: это самый молодой клуб" + LF +
  "     здесь, и любая цифра выше была бы выдумкой в его пользу. */" + LF +
  "  {name:'Drayko Esport',  tier:78, n:0, newcomer:true},   // 26.09, герб logos/Drayko_Esport.png с аватара",
  "клуб");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("клуб добавлен; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
