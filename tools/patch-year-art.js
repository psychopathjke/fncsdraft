// Плитки года — как превьюхи на первом экране: с артом сезона.
//
// Его слово 26 сентября: «на кнопках годах, хочу фнкс стиль типо как превьюхи».
// Пластины уже были, но плоские — цвет и полоса. Теперь под номером года стоит
// тот же арт, каким сезон подписан на лендинге: 2026 — ключевой арт FNCS 2026,
// 2025 — Мейджор 1 того года, 2024 — остров Мейджора 1 (art/map-f1.jpg, ровно
// тот файл, которым помечен ряд 2024 в MODE_ART).
//
// Читаемость держит та же вуаль снизу вверх, что у превьюх (.ec-foot), и тень
// под номером; выбранный сезон — рамка его цветом и вуаль тоньше, чтобы арт был
// ярче. Стиль лежит отдельным файлом tools/year-tile-css.txt.
//
//   node tools/patch-year-art.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("--yr-art")) { console.log("уже впаяно"); process.exit(0); }

// 1. Стиль: старый блок пластины заменяется целиком.
const lines = src.split(LF);
const from = lines.findIndex(l => l.indexOf(".cc-year-panel .cc-chips{display:grid") >= 0);
if (from < 0) throw new Error("начало блока пластины не найдено");
let to = from;
while (to < lines.length && !(lines[to].indexOf("cc-year-tile:disabled:hover") >= 0)) to++;
if (to >= lines.length) throw new Error("конец блока пластины не найден");
const css = fs.readFileSync(path.join(__dirname, "year-tile-css.txt"), "utf8")
  .split(CRLF).join(LF).split(LF).filter((s, i, a) => i < a.length - 1 || s.trim());
lines.splice(from, to - from + 1, ...css);
src = lines.join(LF);

// 2. Арт года — в таблицу вида, рядом с цветом и городом.
const look = [
  "    const YEAR_LOOK={2026:{c:'#00b090', lan:'Antwerp'},",
  "                     2025:{c:'#b14bf4', lan:'Lyon'},",
  "                     2024:{c:'#ffdd00', lan:'Fort Worth'}};"
].join(LF);
if (src.split(look).length - 1 !== 1) throw new Error("таблица вида года: якорь не один");
src = src.replace(look, [
  "    /* Арт — тот же файл, которым сезон подписан на лендинге (MODE_ART):",
  "       2026 ключевой арт года, 2025 его Мейджор 1, 2024 остров Мейджора 1. */",
  "    const YEAR_LOOK={2026:{c:'#00b090', lan:'Antwerp',    art:'art/fncs-2026.jpg'},",
  "                     2025:{c:'#b14bf4', lan:'Lyon',       art:'art/mode-major1-2025.jpg'},",
  "                     2024:{c:'#ffdd00', lan:'Fort Worth', art:'art/map-f1.jpg'}};"
].join(LF));

// 3. Кнопка несёт и цвет, и арт.
const oldStyle = 'style="--yr:${look.c}"';
if (src.split(oldStyle).length - 1 !== 1) throw new Error("style кнопки года: якорь не один");
src = src.replace(oldStyle, 'style="--yr:${look.c};--yr-art:url(${look.art})"');

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("арт года впаян; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
