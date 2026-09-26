// Флаг в поиске напарника — отбор по национальности.
//
// Его слово 26 сентября (скрин из лички): «in the section to find your t8 in the
// career, it would make sense to put where you choose the nationality, like ex
// ita, and rax pred, etc. comes up». То есть: выбрал Италию — видишь итальянцев.
//
// Флаги берутся из самого списка, а не из справочника всех стран: показываются
// те, кто в поиске действительно есть, и сразу с числом. Порядок — по числу
// людей, потолок десять флагов: строка фильтров шире экрана телефона бесполезна.
// Выбранный флаг живёт рядом с сортировкой и сбрасывается вместе с поиском.
//
//   node tools/patch-duo-nat.js
const fs = require("fs"), path = require("path");
const FILE = path.join(path.resolve(__dirname, ".."), "index.html");
const CRLF = String.fromCharCode(13) + String.fromCharCode(10), LF = String.fromCharCode(10);
let src = fs.readFileSync(FILE, "utf8");
const WAS_CRLF = src.includes(CRLF);
if (WAS_CRLF) src = src.split(CRLF).join(LF);
if (src.includes("CC_DUO_NAT")) { console.log("уже впаяно"); process.exit(0); }

const swap = (needle, repl, what) => {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error(what + ": якорь встречается " + n + " раз");
  src = src.replace(needle, repl);
};

// 1. Состояние фильтра рядом с сортировкой.
swap("function ccDuoFindSort(v){ CC_DUO_SORT=(v==='pr' ? 'pr' : 'ovr'); ccDuoFindRender(); }",
  "function ccDuoFindSort(v){ CC_DUO_SORT=(v==='pr' ? 'pr' : 'ovr'); ccDuoFindRender(); }" + LF +
  "/* Отбор по флагу. Пусто — все; иначе код страны, как его знает FLAG_CODE." + LF +
  "   Живёт рядом с сортировкой и сбрасывается там же, где строка поиска. */" + LF +
  "let CC_DUO_NAT='';" + LF +
  "function ccDuoFindNat(v){ CC_DUO_NAT=(String(v||'')===CC_DUO_NAT) ? '' : String(v||''); ccDuoFindRender(); }" + LF +
  "// Код страны человека из списка: в карточках лежит НАЗВАНИЕ страны, не код." + LF +
  "function ccDuoNatCode(w){" + LF +
  "  const n=(w && (w.nat || (w.card && w.card.nat))) || '';" + LF +
  "  return n ? String(FLAG_CODE[n] || '').toLowerCase() : '';" + LF +
  "}", "состояние фильтра");

// 2. Сброс вместе с поиском.
swap("  CC_DUO_Q='';", "  CC_DUO_Q=''; CC_DUO_NAT='';", "сброс");

// 3. Отбор списка.
swap("  const list=(q ? all.filter(w=>String(w.handle).toLowerCase().indexOf(q)>=0) : all).slice(0, 120);",
  "  // Сначала флаг, потом набранное имя: флаг сужает, строка ищет внутри." + LF +
  "  const byNat=CC_DUO_NAT ? all.filter(w=>ccDuoNatCode(w)===CC_DUO_NAT) : all;" + LF +
  "  const list=(q ? byNat.filter(w=>String(w.handle).toLowerCase().indexOf(q)>=0) : byNat).slice(0, 120);" + LF +
  "  /* Флаги — те, что в списке есть, с числом людей у каждого. Десять самых" + LF +
  "     населённых: строка фильтров шире экрана телефона бесполезна, а хвост из" + LF +
  "     стран с одним человеком ищется строкой быстрее, чем флагом. */" + LF +
  "  const natCount={};" + LF +
  "  all.forEach(w=>{ const c=ccDuoNatCode(w); if(c) natCount[c]=(natCount[c]||0)+1; });" + LF +
  "  const natTop=Object.keys(natCount).sort((a,b)=>natCount[b]-natCount[a]).slice(0, 10);" + LF +
  "  if(CC_DUO_NAT && natTop.indexOf(CC_DUO_NAT)<0) natTop.push(CC_DUO_NAT);", "отбор");

// 4. Строка флагов — сразу под строкой сортировки. Разметка лежит отдельным
//    файлом tools/duo-nat-row.txt: в ней и кавычки, и обратные кавычки, и
//    ${...} — в строке JavaScript это превращается в частокол экранирования,
//    на котором легко ошибиться молча. Якорь построчный: `<div class="cc-buys">`
//    встречается на пяти экранах, а строка с cc-duo-sort в файле одна.
const rowFile=path.join(__dirname, 'duo-nat-row.txt');
const rowLines=fs.readFileSync(rowFile, 'utf8').split(CRLF).join(LF).split(LF).filter((s,k,a)=>k<a.length-1 || s.trim());
const lines=src.split(LF);
const si=lines.findIndex(l=>l.indexOf('class="cc-duo-sort"')>=0);
if(si<0) throw new Error('строка сортировки не найдена');
if(lines.findIndex((l,i)=>i>si && l.indexOf('class="cc-duo-sort"')>=0)>=0)
  throw new Error('строка сортировки не одна');
lines.splice(si+1, 0, ...rowLines);
src=lines.join(LF);
// 5. Стиль: флаг и число в одной кнопке, строка переносится.
swap("  .cc-duo-q{", "  .cc-duo-nat{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:4px;}" + LF +
  "  .cc-duo-flag{display:inline-flex;align-items:center;gap:4px;}" + LF +
  "  .cc-duo-flag img{height:10px;width:auto;border-radius:2px;display:block;}" + LF +
  "  .cc-duo-q{", "стиль");

// 6. Подписи на пяти языках — по соседству с сортировкой, язык по самой строке.
const byLang = [
  [/Сортировать/,  "ccDuoNat:'Флаг', ccDuoNatAll:'все',"],
  [/Trier par/,    "ccDuoNat:'Drapeau', ccDuoNatAll:'tous',"],
  [/Ordina per/,   "ccDuoNat:'Bandiera', ccDuoNatAll:'tutti',"],
  [/Ordenar por/,  "ccDuoNat:'Bandeira', ccDuoNatAll:'todos',"],
  [/Sort by/,      "ccDuoNat:'Flag', ccDuoNatAll:'all',"]
];
let added = 0;
src = src.split(LF).map(line => {
  if (line.indexOf("ccDuoSortBy:") < 0) return line;
  const hit = byLang.find(([re]) => re.test(line));
  if (!hit) return line;
  added++;
  const pad = (line.match(/^\s*/) || [""])[0];
  return line + LF + pad + hit[1];
}).join(LF);
if (added < 5) throw new Error("подписи добавлены только в " + added + " словарей");

fs.writeFileSync(FILE, WAS_CRLF ? src.split(LF).join(CRLF) : src, "utf8");
console.log("фильтр по флагу впаян, словарей: " + added + "; index.html " +
            (fs.statSync(FILE).size / 1048576).toFixed(2) + " МБ");
