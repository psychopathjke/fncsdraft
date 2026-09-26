// Значки и флаги на доске лидеров — как в самом посте Кинча.
//
// Его пост целиком (значки видны только если читать alt у картинок, X рисует
// эмодзи картинками):
//   🏆 Global Champs 2026 - Day 1 🏆 / 🔥 Stats Leaders 🔥
//   💥 Damage: 4128 🇯🇵 @Koyota0 · 🎯 Elims: 16 🇵🇱 @DemusFN · 💁‍♂️ Assists: 26 🇺🇸 @CurveFN
//   👍 Damage Ratio · 📈 Net Damage · ⏰ Damage Per Minute · 🧱 Builds · ⛏️ Farmed
//   🏃‍♂️ Distance · 🌧️ Storm Time
// Его слово: «так же со значками».
//
// Значок у каждой строки — его же. Флаг рядом с ником рисуется КАРТИНКОЙ из
// flags/, а не эмодзи: эмодзи-флаги на Windows не рисуются вовсе, а весь
// остальной файл показывает страну картинкой (flagImg).
//
//   node tools/patch-lead-icons.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("CC_LEAD_ICO")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Значки — по строкам его поста.
swap("function ccStatFace(t){",
  "/* Значки строк — те же, что в посте Кинча. Языка у них нет, поэтому они" + LF +
  "   живут в коде, а не в словарях. */" + LF +
  "const CC_LEAD_ICO={s_dmgTo:'\u{1F4A5}', s_elims:'\u{1F3AF}', s_assists:'\u{1F481}',"  + LF +
  "  s_dmgRatio:'\u{1F44D}', s_dmgNet:'\u{1F4C8}', s_dpm:'\u23F0'," + LF +
  "  s_matsFarmed:'\u26CF\uFE0F', s_distance:'\u{1F3C3}', s_timeStorm:'\u{1F327}\uFE0F'};" + LF +
  "/* Флаг лидера — его собственный, с карточки: доску читают по людям, а" + LF +
  "   человек в этой сцене узнаётся по флагу раньше, чем по нику. */" + LF +
  "function ccStatNat(t){" + LF +
  "  const sq=(t && (t.squad||t._cards||t.cards)) || [];" + LF +
  "  const best=sq.slice().sort((a,b)=>((b&&(b.rating||b._ovr))||0)-((a&&(a.rating||a._ovr))||0))[0];" + LF +
  "  if(t && t.isYou){ const c=(typeof careerCard==='function') ? careerCard() : null; return (c && c.nat) || (best && best.nat) || null; }" + LF +
  "  return (best && best.nat) || null;" + LF +
  "}" + LF +
  "function ccStatFace(t){", "значки");

// 2. Строка доски несёт ещё и флаг.
swap("    rows.push([key, fmt(bv), ccStatFace(best)]);",
     "    rows.push([key, fmt(bv), ccStatFace(best), ccStatNat(best)||'']);", "строка");

// 3. Рисуем значок слева и флаг перед ником.
swap("    return `<div class=\"x-shot-r x-lead-r${mine?' me':''}\"><b>${esc(L()[r[0]]||r[0])}</b>`+" + LF +
     "           `<em>${esc(String(r[1]))}</em><i>@${esc(who)}</i></div>`;",
     "    const ico=CC_LEAD_ICO[r[0]] || '';" + LF +
     "    const flag=r[3] ? flagImg(r[3], 11) : '';" + LF +
     "    return `<div class=\"x-shot-r x-lead-r${mine?' me':''}\">`+" + LF +
     "           `<b><span class=\"x-lead-ico\">${ico}</span>${esc(L()[r[0]]||r[0])}</b>`+" + LF +
     "           `<em>${esc(String(r[1]))}</em><i>${flag}@${esc(who)}</i></div>`;", "отрисовка");

// 4. Стиль значка: он читается, но не спорит с числом.
swap("  .x-lead-r b{font-weight:700;color:#8ea6d6;}",
     "  .x-lead-r b{font-weight:700;color:#8ea6d6;}" + LF +
     "  .x-lead-r .x-lead-ico{margin-right:6px;font-size:12px;line-height:1;}" + LF +
     "  .x-lead-r i img{margin-right:4px;}", "стиль значка");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("значки и флаги на доске; index.html " + (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
