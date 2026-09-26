// Коуч Bloodx — его просьба 26 сентября (x.com/BloodxEU, «а это коуч»).
//
// Кто он по своей же странице: 82 100 подписчиков — больше, чем у любого коуча
// в списке, — и перечисленный в шапке ростер, с которым он работает:
// KamiFN1, charyy__, kbmrapid, Clix, RiseFn, MuzFN, kaan_fn, fadedpigeon_,
// PeterbotFN, Pollofn6. Это и Европа, и NA Central, и Азия, и пары целиком
// (Peterbot с Pollo), поэтому он встаёт ПЕРВЫМ: условия коучу назначает место в
// списке (ccCoachRankTerms — сверху $3 500 и +0.35, снизу $2 500 и +0.28), а
// сильнее этого ростера в списке нет ни у кого.
//
// Чему учит, его строка не говорит — значит все шесть, как у остальных голов
// списка. Химия 0.4: он работает с дуо, и это видно по парам в той же шапке.
// Регион EU — по его собственному хендлу.
//
//   node tools/patch-coach-bloodx.js
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("BloodxEU")) { console.log("уже впаяно"); process.exit(0); }
if (!fs.existsSync(path.join(ROOT, "photos", "BloodxEU.jpg")))
  throw new Error("нет файла photos/BloodxEU.jpg");

const anchor = "const CC_COACHES=[";
if (src.split(anchor).length - 1 !== 1) throw new Error("якорь CC_COACHES не один");
src = src.replace(anchor, anchor + LF +
  "  /* Первый по списку, и это не оценка на глаз: 82 100 подписчиков и ростер," + LF +
  "     перечисленный в его же шапке — Kami, charyy, Rapid, Clix, Rise, Muz, Kaan," + LF +
  "     Faded, Peterbot, Pollo. Условия ему, как и всем, назначит место" + LF +
  "     (ccCoachRankTerms); чему учит — строки нет, значит все шесть. */" + LF +
  "  {id:'bloodx', name:'Bloodx',     at:'BloodxEU',     reg:'EU',    cost:3500, train:0.35, keys:ATTR_KEYS.slice(), chem:0.4, photo:'BloodxEU.jpg'},");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("коуч добавлен; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
