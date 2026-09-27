// Год 2020 в карьере: плитка, тексты, наборы карточек i1–i3, развилки (ccIs2020). Машина — общая
// с 2019-м (runCareerMajorMX), спеки и календарь — tools/career-2020-cal.generated.js.
// Вклейку делает tools/splice-2020.js — её запускать первой.
//   node tools/patch-year-2020.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
if (s.indexOf('function ccIs2020(){') >= 0) { console.log('already patched'); process.exit(0); }
const N = t => t.split('\n').join(nl);
const rep = (a, b, all) => { a = N(a); b = N(b); const n = s.split(a).length - 1; if (all ? n < 1 : n !== 1) throw new Error('found ' + n + ': ' + a.slice(0, 90)); s = all ? s.split(a).join(b) : s.replace(a, () => b); };

const NOTE = {
  ru: "ccYearNote2020:'Сезон 2020: FNCS онлайн, формат меняется по сезонам — C2S2 дуо, C2S3 соло, C2S4 трио. Недели и квалификаторы, хиты, финалы. Состав — трио, каждый вечер — в своём формате. Карточки — 2020 года.',",
  en: "ccYearNote2020:'2020: online FNCS, the format changes by season — C2S2 duos, C2S3 solos, C2S4 trios. Weeks and qualifiers, heats, finals. The roster is a trio; every night is played in its own format. Cards are from 2020.',",
  fr: "ccYearNote2020:'2020 : FNCS en ligne, le format change selon la saison — C2S2 en duos, C2S3 en solo, C2S4 en trios. Semaines et qualifs, heats, finales. L’effectif est un trio ; chaque soirée se joue dans son format. Cartes 2020.',",
  it: "ccYearNote2020:\"2020: FNCS online, il formato cambia con la stagione — C2S2 duo, C2S3 solo, C2S4 trio. Settimane e qualificazioni, heat, finali. La rosa è un trio; ogni serata si gioca nel suo formato. Carte del 2020.\",",
  pt: "ccYearNote2020:\"2020: FNCS online, o formato muda por temporada — C2S2 duplas, C2S3 solo, C2S4 trios. Semanas e classificatórias, heats, finais. O elenco é um trio; cada noite é jogada no seu formato. Cartas de 2020.\","
};
const K = { ru: "ccYear2020:'дуо → соло → трио',", en: "ccYear2020:'duos → solo → trios',", fr: "ccYear2020:'duos → solo → trios',", it: "ccYear2020:'duo → solo → trio',", pt: "ccYear2020:'duplas → solo → trios'," };
{
  const lines = s.split(nl);
  const notes = lines.map((l, i) => /ccYearNote2019:/.test(l) ? i : -1).filter(i => i >= 0);
  const keys = lines.map((l, i) => /ccYear2019:/.test(l) ? i : -1).filter(i => i >= 0);
  if (notes.length !== 5 || keys.length !== 5) throw new Error('dictionaries ' + notes.length + '/' + keys.length);
  ['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
    let i = notes[j], l = lines[i], at = l.indexOf('ccYearNote2019:');
    lines[i] = l.slice(0, at) + NOTE[lang] + ' ' + l.slice(at);
    i = keys[j]; l = lines[i]; at = l.indexOf('ccYear2019:');
    lines[i] = l.slice(0, at) + K[lang] + ' ' + l.slice(at);
  });
  s = lines.join(nl);
}
rep("                     2019:{lan:'New York', art:'art/fncs-2019.jpg'}};",
    "                     2019:{lan:'New York', art:'art/fncs-2019.jpg'},\n                     // 2020 — онлайн, арт FNCS C2S3 (fortnite.com).\n                     2020:{lan:'Online', art:'art/fncs-2020.jpg'}};");
rep('ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021, 2019].map(y=>{', 'ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(y=>{');

const rowsTxt = fs.readFileSync(path.join(__dirname, '2020-rows.generated.js'), 'utf8');
const R = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const blk = ['i1', 'i2', 'i3'].map(k => '  ' + k + ':{\n' + R.filter(r => rowsTxt.indexOf('const CARD_' + k.toUpperCase() + r + '_GF_RAW=') >= 0).map(r => { const p = 'CARD_' + k.toUpperCase() + r; return '    ' + (r + ':').padEnd(5) + ' {P:' + p + '_S_RAW, L:' + p + '_Q_RAW, G:' + p + '_GF_RAW}'; }).join(',\n') + '\n  },').join('\n');
rep("const T_SETS=['h1','h2','h3','h4',", "const T_SETS=['h1','h2','h3','h4','i1','i2','i3',");
rep("const T_STAGE_NAME_BY_SET={h1:T_STAGE_WC,", "const T_STAGE_NAME_BY_SET={i1:T_STAGE_H, i2:T_STAGE_H, i3:T_STAGE_H, h1:T_STAGE_WC,");
rep("const T_KILL_BY_SET={h1:{P:3, L:2, G:3},", "const T_KILL_BY_SET={i1:{P:3, L:2, G:3}, i2:{P:3, L:2, G:3}, i3:{P:3, L:2, G:3}, h1:{P:3, L:2, G:3},");
rep("const T_RAW={\n  // 2019 (tools/build-2019-rows.js)",
    "const T_RAW={\n  // 2020 (tools/build-2020-rows.js, Liquipedia): финалы недель/квалификаторов, хиты, финал — очки оценкой по месту.\n" + blk + "\n  // 2019 (tools/build-2019-rows.js)");
rep("const T_NAT={h1:H1_NAT,", "const T_NAT={i1:I1_NAT, i2:I2_NAT, i3:I3_NAT, h1:H1_NAT,");
rep("const T_EVENT_NAME={h1:'Fortnite 2019 World Cup Solo',", "const T_EVENT_NAME={i1:'FNCS 2020 C2S2', i2:'FNCS 2020 C2S3', i3:'FNCS 2020 C2S4', h1:'Fortnite 2019 World Cup Solo',");
rep("// 2019: недели и финалы — даты окон Tracker и Liquipedia.\n",
    "// 2020: недели, хиты, финалы — даты страниц Liquipedia.\nconst I1_STAGE_DATE={L:'21–29 мар 2020', P:'17–18 апр 2020', G:'19 апр 2020'};\nconst I2_STAGE_DATE={L:'1–9 авг 2020', P:'14–15 авг 2020', G:'16 авг 2020'};\nconst I3_STAGE_DATE={L:'сен – окт 2020', P:'окт 2020', G:'окт 2020'};\n// 2019: недели и финалы — даты окон Tracker и Liquipedia.\n");
rep("const T_STAGE_DATE={h1:H1_STAGE_DATE,", "const T_STAGE_DATE={i1:I1_STAGE_DATE, i2:I2_STAGE_DATE, i3:I3_STAGE_DATE, h1:H1_STAGE_DATE,");
rep("const CARD_TRIOS_BY_SET={h1:[],", "const CARD_TRIOS_BY_SET={i1:[], i2:[], i3:[], h1:[],");
rep("if(/^h[1-4]$/.test(s)) return 2019;", "if(/^h[1-4]$/.test(s)) return 2019; if(/^i[1-3]$/.test(s)) return 2020;");
rep("const m=/(?:FNCS|Fortnite) (2019|2021|", "const m=/(?:FNCS|Fortnite) (2019|2020|2021|");
rep("const m=/^[ehjkft]([1-4])$/.exec(s);", "const m=/^[ehijkft]([1-4])$/.exec(s);");
rep("/^[ehjkft][1-4]$/.test(q.cardSet)", "/^[ehijkft][1-4]$/.test(q.cardSet)");
rep("{key:'h1', label:'Chapter 1 Season 9'}, {key:'h3', label:'Chapter 1 Season X'}, {key:'h4', label:'Chapter 2 Season 1'}];",
    "{key:'h1', label:'Chapter 1 Season 9'}, {key:'h3', label:'Chapter 1 Season X'}, {key:'h4', label:'Chapter 2 Season 1'},\n                   {key:'i1', label:'Chapter 2 Season 2'}, {key:'i2', label:'Chapter 2 Season 3'}, {key:'i3', label:'Chapter 2 Season 4'}];");
rep('  h4:"art/map-h4.jpg",\n', '  h4:"art/map-h4.jpg",\n  i1:"art/map-i1.jpg",\n  i2:"art/map-i2.jpg",\n  i3:"art/map-i3.jpg",\n');
rep("                  h1:'2048/2048', h3:'2048/2048', h4:'2048/2048',\n", "                  h1:'2048/2048', h3:'2048/2048', h4:'2048/2048', i1:'2048/2048', i2:'2048/2048', i3:'2048/2048',\n");
rep("h1:'wiki', h3:'wiki', h4:'wiki', m1:'Kinch'", "h1:'wiki', h3:'wiki', h4:'wiki', i1:'wiki', i2:'wiki', i3:'wiki', m1:'Kinch'");
rep("  if(ccIs2019()){ const d0=careerToday();",
    "  // 2020-й: остров сезона (C2S3 с 17.06, C2S4 с 27.08).\n  if(ccIs2020()){ const d0=careerToday(); const k=d0>='2020-08-27' ? 'i3' : d0>='2020-06-17' ? 'i2' : 'i1';\n    return ZONE_SETS[k] ? k : 'h4'; }\n  if(ccIs2019()){ const d0=careerToday();");
rep("&& !ccIs2021() && !ccIs2019()) ? 's42' : careerBrSet();", "&& !ccIs2021() && !ccIs2020() && !ccIs2019()) ? 's42' : careerBrSet();");
rep("|| y===2021 || y===2019; }", "|| y===2021 || y===2020 || y===2019; }");
rep("function ccIs2019(){ return ccCalYear()===2019; }\n", "function ccIs2019(){ return ccCalYear()===2019; }\n// 2020-й — FNCS онлайн, формат на вечер; см. CAREER_YEAR_2020.\nfunction ccIs2020(){ return ccCalYear()===2020; }\n");
rep("function ccYearFrom(){ return ccIs2019() ?", "function ccYearFrom(){ return ccIs2020() ? CC_YEAR_2020_FROM : ccIs2019() ?");
rep("function ccYearTo(){ return ccIs2019() ?", "function ccYearTo(){ return ccIs2020() ? CC_YEAR_2020_TO : ccIs2019() ?");
rep("function ccYearRows(){ return ccIs2019() ?", "function ccYearRows(){ return ccIs2020() ? CAREER_YEAR_2020 : ccIs2019() ?");
rep("function ccCupWeeks(){ return (ccIs2021() || ccIs2019()) ? [] :", "function ccCupWeeks(){ return (ccIs2021() || ccIs2020() || ccIs2019()) ? [] :");
rep("  if(ccIs2021() || ccIs2019()) return true;\n", "  if(ccIs2021() || ccIs2020() || ccIs2019()) return true;\n");
rep("  if(ccIs2022() || ccIs2021() || ccIs2019()) return [];", "  if(ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) return [];");
rep("|| ccIs2021() || ccIs2019()) return 0;", "|| ccIs2021() || ccIs2020() || ccIs2019()) return 0;");
rep("|| ccIs2021() || ccIs2019()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }", "|| ccIs2021() || ccIs2020() || ccIs2019()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }");
rep("  if(y0===2019) return s<=1 ? 2019 :", "  if(y0===2020) return s<=1 ? 2020 : s===2 ? 2021 : s===3 ? 2022 : s===4 ? 2023 : s===5 ? 2024 : s===6 ? 2025 : 2026+(s-7);\n  if(y0===2019) return s<=1 ? 2019 :");
rep("function ccSeasonYear(){ return ccIs2019() ? 2019 :", "function ccSeasonYear(){ return ccIs2020() ? 2020 : ccIs2019() ? 2019 :");
rep("  // Карьера 2019-го: Нью-Йорк (World Cup), 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.\n",
    "  // Карьера 2020-го: 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.\n  if(cr && cr.year0===2020){\n    const fact=[null, 'Rdu', 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];\n    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);\n    s=s-6;\n  }\n  // Карьера 2019-го: Нью-Йорк (World Cup), 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.\n");
rep("  if(ccNowYear()===2019) return CC_SNAPSHOTS_2019[0];", "  if(ccNowYear()===2019) return CC_SNAPSHOTS_2019[0];\n  if(ccNowYear()===2020) return CC_SNAPSHOTS_2020[0];");
rep("year===2019 ? CC_SNAPSHOTS_2019 : CC_SNAPSHOTS;", "year===2019 ? CC_SNAPSHOTS_2019 : year===2020 ? CC_SNAPSHOTS_2020 : CC_SNAPSHOTS;");
rep("  return y===2019 ? [CC_YEAR_2019_FROM, CC_YEAR_2019_TO]", "  return y===2019 ? [CC_YEAR_2019_FROM, CC_YEAR_2019_TO]\n       : y===2020 ? [CC_YEAR_2020_FROM, CC_YEAR_2020_TO]");
rep("  if(ccIs2019()) return CC_SEASONS_2019.find(x=>d>=x.from && d<=x.to) || null;", "  if(ccIs2019()) return CC_SEASONS_2019.find(x=>d>=x.from && d<=x.to) || null;\n  if(ccIs2020()) return CC_SEASONS_2020.find(x=>d>=x.from && d<=x.to) || null;");
rep("  else if(cr.year===2019) cr.year=2020;", "  else if(cr.year===2019) cr.year=2020;\n  else if(cr.year===2020) cr.year=2021;   // после C2S4 — календарь 2021-го (трио), люди прошлых лет");
rep("  if(cr.year0===2019) cr.size =", "  // Карьера 2020-го: 2021 — трио, 2022–2024 — дуо, 2025 — трио, 2026 — дуо, дальше чередование.\n  if(cr.year0===2020) cr.size = cr.season<=2 ? 3 : cr.season<=5 ? 2 : cr.season===6 ? 3 : (cr.season%2 ? 2 : 3);\n  if(cr.year0===2019) cr.size =");
rep("  if(y===2019) return m<=7 ? 1 : m<=9 ? 2 : 3;       // Нью-Йорк, Season X, C2S1", "  if(y===2019) return m<=7 ? 1 : m<=9 ? 2 : 3;       // Нью-Йорк, Season X, C2S1\n  if(y===2020) return m<=4 ? 1 : m<=8 ? 2 : 3;       // C2S2, C2S3, C2S4");
// Капов 2020-го в календаре нет (на Tracker их окон почти не осталось).
rep("function ccVictoryList(){ return ccIs2019() ?", "function ccVictoryList(){ return ccIs2020() ? [] : ccIs2019() ?");
rep("  if(ccIs2021() || ccIs2019()) return null;\n", "  if(ccIs2021() || ccIs2020() || ccIs2019()) return null;\n");
fs.writeFileSync(file, s);
console.log('patched 2020');
