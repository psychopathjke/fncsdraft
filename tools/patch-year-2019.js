// Год 2019 в карьере (и общее для 2019–2020): плитка, тексты, наборы карточек h1–h4, развилки
// (ccIs2019), состав года — сквад, формат вечера — свой (runCareerMajorMX), World Cup в Нью-Йорке.
// Данные и машину вклеивает tools/splice-2019.js — его запускать первым.
//   node tools/patch-year-2019.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
if (s.indexOf('function ccIs2019(){') >= 0) { console.log('already patched'); process.exit(0); }
const N = t => t.split('\n').join(nl);
const rep = (a, b, all) => { a = N(a); b = N(b); const n = s.split(a).length - 1; if (all ? n < 1 : n !== 1) throw new Error('found ' + n + ': ' + a.slice(0, 90)); s = all ? s.split(a).join(b) : s.replace(a, () => b); };

// ---- тексты ----
const NOTE = {
  ru: "ccYearNote2019:'Сезон 2019: World Cup и первые FNCS. Недели Online Open (соло и дуо) и финалы в Нью-Йорке, осенью FNCS Season X (трио) и Chapter 2 Season 1 (сквады). Состав — сквад, каждый вечер — в своём формате. Карточки — 2019 года.',",
  en: "ccYearNote2019:'2019: the World Cup and the first FNCS. Online Open weeks (solo and duos) and the finals in New York, then FNCS Season X (trios) and Chapter 2 Season 1 (squads). The roster is a squad; every night is played in its own format. Cards are from 2019.',",
  fr: "ccYearNote2019:'2019 : la World Cup et les premières FNCS. Semaines Online Open (solo et duos) et finales à New York, puis FNCS Season X (trios) et Chapter 2 Season 1 (escouades). L’effectif est une escouade ; chaque soirée se joue dans son format. Cartes 2019.',",
  it: "ccYearNote2019:\"2019: la World Cup e le prime FNCS. Settimane Online Open (solo e duo) e finali a New York, poi FNCS Season X (trio) e Chapter 2 Season 1 (squadre). La rosa è una squadra; ogni serata si gioca nel suo formato. Carte del 2019.\",",
  pt: "ccYearNote2019:\"2019: a World Cup e as primeiras FNCS. Semanas Online Open (solo e duplas) e as finais em Nova York, depois FNCS Season X (trios) e Chapter 2 Season 1 (squads). O elenco é um squad; cada noite é jogada no seu formato. Cartas de 2019.\","
};
const K = {
  ru: "ccYear2019:'соло → сквад', ccYrXWeek:(w,r,q)=>(w===0 ? 'разминка' : (q ? 'квалификатор ' : 'неделя ')+w)+' · раунд '+r, ccYrXHeats:d=>'хиты · день '+d, ccYrXHeatN:(l,h)=>l+' · хит '+h, ccYrXFinal:wc=>wc ? 'финал · Нью-Йорк' : 'финал', ccYrXWcIn:k=>'Топ-'+k+' региона — в финал World Cup в Нью-Йорке',",
  en: "ccYear2019:'solo → squads', ccYrXWeek:(w,r,q)=>(w===0 ? 'warm-up' : (q ? 'Qualifier ' : 'Week ')+w)+' · round '+r, ccYrXHeats:d=>'Heats · day '+d, ccYrXHeatN:(l,h)=>l+' · Heat '+h, ccYrXFinal:wc=>wc ? 'Finals · New York' : 'Finals', ccYrXWcIn:k=>'Top '+k+' of the region — to the World Cup Finals in New York',",
  fr: "ccYear2019:'solo → escouades', ccYrXWeek:(w,r,q)=>(w===0 ? 'échauffement' : (q ? 'qualificatif ' : 'semaine ')+w)+' · manche '+r, ccYrXHeats:d=>'heats · jour '+d, ccYrXHeatN:(l,h)=>l+' · heat '+h, ccYrXFinal:wc=>wc ? 'finale · New York' : 'finale', ccYrXWcIn:k=>'Top '+k+' de la région — en finale de la World Cup à New York',",
  it: "ccYear2019:'solo → squadre', ccYrXWeek:(w,r,q)=>(w===0 ? 'riscaldamento' : (q ? 'qualificazione ' : 'settimana ')+w)+' · round '+r, ccYrXHeats:d=>'heat · giorno '+d, ccYrXHeatN:(l,h)=>l+' · heat '+h, ccYrXFinal:wc=>wc ? 'finale · New York' : 'finale', ccYrXWcIn:k=>'Top '+k+' della regione — alla finale della World Cup a New York',",
  pt: "ccYear2019:'solo → squads', ccYrXWeek:(w,r,q)=>(w===0 ? 'aquecimento' : (q ? 'classificatória ' : 'semana ')+w)+' · rodada '+r, ccYrXHeats:d=>'heats · dia '+d, ccYrXHeatN:(l,h)=>l+' · heat '+h, ccYrXFinal:wc=>wc ? 'final · Nova York' : 'final', ccYrXWcIn:k=>'Top '+k+' da região — para a final da World Cup em Nova York',"
};
{
  const lines = s.split(nl);
  const notes = lines.map((l, i) => /ccYearNote2021:/.test(l) ? i : -1).filter(i => i >= 0);
  const keys = lines.map((l, i) => /ccYear2021:/.test(l) ? i : -1).filter(i => i >= 0);
  if (notes.length !== 5 || keys.length !== 5) throw new Error('dictionaries ' + notes.length + '/' + keys.length);
  ['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
    let i = notes[j], l = lines[i], at = l.indexOf('ccYearNote2021:');
    lines[i] = l.slice(0, at) + NOTE[lang] + ' ' + l.slice(at);
    i = keys[j]; l = lines[i]; at = l.indexOf('ccYear2021:');
    const comma = l.indexOf(',', at);
    lines[i] = l.slice(0, comma + 1) + ' ' + K[lang] + l.slice(comma + 1);
  });
  s = lines.join(nl);
}

// ---- плитка: восемь лет — по четыре в ряд ----
rep("  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}   /* шесть лет в ряд во всю ширину панели */",
    "  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}   /* годы по четыре в ряд */");
rep("  /* На телефоне по два в ряд: шесть лет — три ряда. */", "  /* На телефоне по два в ряд. */");
rep("                     2021:{lan:'Online', art:'art/fncs-2021.jpg'}};",
    "                     2021:{lan:'Online', art:'art/fncs-2021.jpg'},\n                     // 2019 — ключевой арт Fortnite World Cup (fortnite.com).\n                     2019:{lan:'New York', art:'art/fncs-2019.jpg'}};");
rep('ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021].map(y=>{', 'ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021, 2019].map(y=>{');
// Состав года: 2019 — сквад, 2025/2021/2020 — трио, остальные — дуо.
rep("(CC.year===2025 || CC.year===2021) ? 3 : 2", "ccYearRosterSize(CC.year)", true);
rep("? ((CC.year===2025 || CC.year===2021) ? 2 : 1) : careerMateSeats();", "? (ccYearRosterSize(CC.year)-1) : careerMateSeats();");
rep("function careerSquadSize(){\n  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;\n  const n=CAREER && CAREER.career && CAREER.career.size;\n  return n===3 ? 3 : 2;\n}",
    "function careerSquadSize(){\n  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;\n  const n=CAREER && CAREER.career && CAREER.career.size;\n  return n===3 ? 3 : n===4 ? 4 : 2;\n}\n// Состав года карьеры при создании: 2019 — сквад (C2S1 FNCS), трио-годы — трио, остальные — дуо.\nfunction ccYearRosterSize(y){ return y===2019 ? 4 : (y===2025 || y===2021 || y===2020) ? 3 : 2; }");
rep("  return n===3 ? Math.round(duoCount*2/3) : n===1 ? duoCount*2 : duoCount;", "  return n===3 ? Math.round(duoCount*2/3) : n===4 ? Math.round(duoCount/2) : n===1 ? duoCount*2 : duoCount;");

// ---- наборы карточек (регионы — какие есть в 2019-rows: у World Cup нет Ближнего Востока) ----
const rowsTxt = fs.readFileSync(path.join(__dirname, '2019-rows.generated.js'), 'utf8');
const R = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const blk = ['h1', 'h2', 'h3', 'h4'].map(k => '  ' + k + ':{\n' + R.filter(r => rowsTxt.indexOf('const CARD_' + k.toUpperCase() + r + '_GF_RAW=') >= 0).map(r => { const p = 'CARD_' + k.toUpperCase() + r; return '    ' + (r + ':').padEnd(5) + ' {P:' + p + '_S_RAW, L:' + p + '_Q_RAW, G:' + p + '_GF_RAW}'; }).join(',\n') + '\n  },').join('\n');
rep("const T_SETS=['j1',", "const T_SETS=['h1','h2','h3','h4','j1',");
rep("const T_STAGE_NAME_BY_SET={j1:T_STAGE_J,",
    "// Стадии 2019-го: World Cup — недели Online Open и финал в Нью-Йорке; FNCS — финалы недель, хиты, финал.\nconst T_STAGE_WC={P:'Online Open', L:'Online Open', G:'Grand Finals'};\nconst T_STAGE_H={P:'Semi-Finals', L:'Qualifier', G:'Grand Finals'};\nconst T_STAGE_NAME_BY_SET={h1:T_STAGE_WC, h2:T_STAGE_WC, h3:T_STAGE_H, h4:T_STAGE_H, j1:T_STAGE_J,");
rep("const T_KILL_BY_SET={j1:{P:3, L:2, G:3},", "const T_KILL_BY_SET={h1:{P:3, L:2, G:3}, h2:{P:3, L:2, G:3}, h3:{P:3, L:2, G:3}, h4:{P:3, L:2, G:3}, j1:{P:3, L:2, G:3},");
rep("const T_RAW={\n  // 2021 (tools/build-2021-rows.js)",
    "const T_RAW={\n  // 2019 (tools/build-2019-rows.js): World Cup — недели и Нью-Йорк; FNCS — финалы недель, хиты, финал.\n" + blk + "\n  // 2021 (tools/build-2021-rows.js)");
rep("const T_NAT={j1:J1_NAT,", "const T_NAT={h1:H1_NAT, h2:H2_NAT, h3:H3_NAT, h4:H4_NAT, j1:J1_NAT,");
rep("const T_EVENT_NAME={j1:'FNCS 2021 C2S5',", "const T_EVENT_NAME={h1:'Fortnite 2019 World Cup Solo', h2:'Fortnite 2019 World Cup Duos', h3:'FNCS 2019 Season X', h4:'FNCS 2019 C2S1', j1:'FNCS 2021 C2S5',");
rep("// 2021: раунд 4 квалификаторов, полуфинал и Гранд-финал — даты окон Tracker.\n",
    "// 2019: недели и финалы — даты окон Tracker и Liquipedia.\nconst H1_STAGE_DATE={L:'13 апр – 9 июн 2019', P:'13 апр – 9 июн 2019', G:'28 июл 2019'};\nconst H2_STAGE_DATE={L:'20 апр – 21 июн 2019', P:'20 апр – 21 июн 2019', G:'27 июл 2019'};\nconst H3_STAGE_DATE={L:'17 авг – 15 сен 2019', P:'20–21 сен 2019', G:'22 сен 2019'};\nconst H4_STAGE_DATE={L:'26 окт – 24 ноя 2019', P:'6–7 дек 2019', G:'8 дек 2019'};\n// 2021: раунд 4 квалификаторов, полуфинал и Гранд-финал — даты окон Tracker.\n");
rep("const T_STAGE_DATE={j1:J1_STAGE_DATE,", "const T_STAGE_DATE={h1:H1_STAGE_DATE, h2:H2_STAGE_DATE, h3:H3_STAGE_DATE, h4:H4_STAGE_DATE, j1:J1_STAGE_DATE,");
rep("const CARD_TRIOS_BY_SET={j1:[],", "const CARD_TRIOS_BY_SET={h1:[], h2:[], h3:[], h4:[], j1:[],");
rep("if(/^j[1-4]$/.test(s)) return 2021;", "if(/^h[1-4]$/.test(s)) return 2019; if(/^j[1-4]$/.test(s)) return 2021;");
rep("const m=/FNCS (2021|2022|2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };", "const m=/(?:FNCS|Fortnite) (2019|2021|2022|2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };");
rep("const m=/^[ejkft]([1-4])$/.exec(s);", "const m=/^[ehjkft]([1-4])$/.exec(s);");
rep("else if(q.cardSet && /^[ejkft][1-4]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;", "else if(q.cardSet && /^[ehjkft][1-4]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;");

// ---- острова ----
rep("                   {key:'j3', label:'Chapter 2 Season 7'}, {key:'j4', label:'Chapter 2 Season 8'}];",
    "                   {key:'j3', label:'Chapter 2 Season 7'}, {key:'j4', label:'Chapter 2 Season 8'},\n                   // 2019: остров World Cup (Season 9), Season X, Chapter 2 Season 1.\n                   {key:'h1', label:'Chapter 1 Season 9'}, {key:'h3', label:'Chapter 1 Season X'}, {key:'h4', label:'Chapter 2 Season 1'}];");
rep('  j4:"art/map-j4.jpg",\n', '  j4:"art/map-j4.jpg",\n  // 2019: карты вики (tools/build-mx-islands.js).\n  h1:"art/map-h1.jpg",\n  h3:"art/map-h3.jpg",\n  h4:"art/map-h4.jpg",\n');
rep("                  j1:'1600/1600', j2:'1600/1600', j3:'1600/1600', j4:'1600/1600',\n",
    "                  j1:'1600/1600', j2:'1600/1600', j3:'1600/1600', j4:'1600/1600',\n                  h1:'2048/2048', h3:'2048/2048', h4:'2048/2048',\n");
rep("j1:'wiki', j2:'wiki', j3:'wiki', j4:'wiki', m1:'Kinch'", "j1:'wiki', j2:'wiki', j3:'wiki', j4:'wiki', h1:'wiki', h3:'wiki', h4:'wiki', m1:'Kinch'");
rep("    if(ccIs2021()){ const d0=careerToday(); const k=d0>='2021-09-13'",
    "    // 2019-й: World Cup — Season 9, осень — Season X, с 13.10 — Chapter 2 Season 1.\n    if(ccIs2019()){ const d0=careerToday(); const k=d0>='2019-10-13' ? 'h4' : d0>='2019-08-01' ? 'h3' : 'h1';\n      return ZONE_SETS[k] ? k : 'j1'; }\n    if(ccIs2021()){ const d0=careerToday(); const k=d0>='2021-09-13'");
rep("&& !ccIs2023() && !ccIs2022() && !ccIs2021()) ? 's42' : careerBrSet();", "&& !ccIs2023() && !ccIs2022() && !ccIs2021() && !ccIs2019()) ? 's42' : careerBrSet();");

// ---- год ----
rep("function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022 || y===2021; }", "function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022 || y===2021 || y===2019; }");
rep("function ccIs2021(){ return ccCalYear()===2021; }\n", "function ccIs2021(){ return ccCalYear()===2021; }\n// 2019-й — World Cup и первые FNCS, формат на вечер; см. CAREER_YEAR_2019.\nfunction ccIs2019(){ return ccCalYear()===2019; }\n");
rep("function ccYearFrom(){ return ccIs2021() ?", "function ccYearFrom(){ return ccIs2019() ? CC_YEAR_2019_FROM : ccIs2021() ?");
rep("function ccYearTo(){ return ccIs2021() ?", "function ccYearTo(){ return ccIs2019() ? CC_YEAR_2019_TO : ccIs2021() ?");
rep("function ccYearRows(){ return ccIs2021() ?", "function ccYearRows(){ return ccIs2019() ? CAREER_YEAR_2019 : ccIs2021() ?");
rep("function ccCupWeeks(){ return ccIs2021() ? [] :", "function ccCupWeeks(){ return (ccIs2021() || ccIs2019()) ? [] :");
rep("  if(ccIs2021()) return true;\n", "  if(ccIs2021() || ccIs2019()) return true;\n");
rep("  if(ccIs2022() || ccIs2021()) return [];", "  if(ccIs2022() || ccIs2021() || ccIs2019()) return [];");
rep("  if(ccIs2023() || ccIs2022() || ccIs2021()) return 0;", "  if(ccIs2023() || ccIs2022() || ccIs2021() || ccIs2019()) return 0;");
rep("|| ccIs2022() || ccIs2021()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }", "|| ccIs2022() || ccIs2021() || ccIs2019()) ? careerWeekIndex(ccYearTo()) : CAREER_WEEKS; }");
rep("  if(y0===2021) return s<=1 ? 2021 :", "  if(y0===2019) return s<=1 ? 2019 : s===2 ? 2020 : s===3 ? 2021 : s===4 ? 2022 : s===5 ? 2023 : s===6 ? 2024 : s===7 ? 2025 : 2026+(s-8);\n  if(y0===2021) return s<=1 ? 2021 :");
rep("cr.year0===2021 ? 5 : 0);", "cr.year0===2021 ? 5 : cr.year0===2020 ? 6 : cr.year0===2019 ? 7 : 0);");
rep("function ccSeasonYear(){ return ccIs2021() ? 2021 :", "function ccSeasonYear(){ return ccIs2019() ? 2019 : ccIs2021() ? 2021 :");
rep("  // Карьера 2021-го: своего ЛАНа нет (онлайн), дальше Роли, Копенгаген, Форт-Уэрт, Лион; жребий после.\n",
    "  // Карьера 2019-го: Нью-Йорк (World Cup), 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.\n  if(cr && cr.year0===2019){\n    const fact=[null, 'Nyc', 'Nyc', 'Nyc', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];\n    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);\n    s=s-7;\n  }\n  // Карьера 2021-го: своего ЛАНа нет (онлайн), дальше Роли, Копенгаген, Форт-Уэрт, Лион; жребий после.\n");
rep("  if(ccNowYear()===2021) return CC_SNAPSHOTS_2021[0];", "  if(ccNowYear()===2021) return CC_SNAPSHOTS_2021[0];\n  if(ccNowYear()===2019) return CC_SNAPSHOTS_2019[0];");
rep("year===2021 ? CC_SNAPSHOTS_2021 : CC_SNAPSHOTS;", "year===2021 ? CC_SNAPSHOTS_2021 : year===2019 ? CC_SNAPSHOTS_2019 : CC_SNAPSHOTS;");
rep("  return y===2021 ? [CC_YEAR_2021_FROM, CC_YEAR_2021_TO]", "  return y===2019 ? [CC_YEAR_2019_FROM, CC_YEAR_2019_TO]\n       : y===2021 ? [CC_YEAR_2021_FROM, CC_YEAR_2021_TO]");
rep("  if(ccIs2021()) return CC_SEASONS_2021.find(x=>d>=x.from && d<=x.to) || null;", "  if(ccIs2021()) return CC_SEASONS_2021.find(x=>d>=x.from && d<=x.to) || null;\n  if(ccIs2019()) return CC_SEASONS_2019.find(x=>d>=x.from && d<=x.to) || null;");
rep("  else if(cr.year===2021) cr.year=2022;", "  else if(cr.year===2021) cr.year=2022;\n  else if(cr.year===2019) cr.year=2020;   // после FNCS C2S1 — календарь 2020-го (трио), люди 2019-го");
rep("  if(cr.year0===2021) cr.size = cr.season===5 ? 3 : cr.season<=4 ? 2 : (cr.season%2 ? 3 : 2);",
    "  if(cr.year0===2021) cr.size = cr.season===5 ? 3 : cr.season<=4 ? 2 : (cr.season%2 ? 3 : 2);\n  // Карьера 2019-го: 2020–2021 — трио, 2022–2024 — дуо, 2025 — трио, 2026 — дуо, дальше чередование.\n  if(cr.year0===2019) cr.size = cr.season<=3 ? 3 : cr.season<=6 ? 2 : cr.season===7 ? 3 : (cr.season%2 ? 3 : 2);");
rep("  if(y===2021) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, сентябрь", "  if(y===2021) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, сентябрь\n  if(y===2019) return m<=7 ? 1 : m<=9 ? 2 : 3;       // Нью-Йорк, Season X, C2S1");

// ---- ярлыки дней ----
rep("  /* 2021-й: квалификатор (раунды вечера), полуфинал (день), Reboot Round, Гранд-финал; «Мейджор 5» — Grand Royale. */\n",
    "  /* 2019–2020: неделя/квалификатор (раунды вечера), хиты (день), финал — по спеке сезона (CC_MX_SPEC). */\n  const mx=/^Major(\\d)_(2019|2020)_(?:W(\\d+)R([1-4]+)|Heat([12])|Final)$/.exec(id);\n  if(mx){\n    const sp=(typeof ccMXSpec==='function') ? ccMXSpec(+mx[2], +mx[1]) : null, nm=sp ? sp.name : 'FNCS';\n    if(mx[3]!=null) return nm+' · '+L().ccYrXWeek(+mx[3], mx[4].split('').join('–'), !!(sp && sp.qual));\n    if(mx[5]) return nm+' · '+L().ccYrXHeats(+mx[5]);\n    return nm+' · '+L().ccYrXFinal(!!(sp && sp.kind==='wc'));\n  }\n  /* 2021-й: квалификатор (раунды вечера), полуфинал (день), Reboot Round, Гранд-финал; «Мейджор 5» — Grand Royale. */\n");

// ---- Мейджоры ----
rep("  /* 2021-й: квалификатор, полуфинал (день r), Reboot Round, финал — своя машина, runCareerMajor2021. */\n",
    "  /* 2019–2020: неделя w (раунды вечера), хиты (день r), финал — машина runCareerMajorMX. */\n  const mx=String(e.id||'').match(/^Major(\\d)_(2019|2020)_(?:W(\\d+)R([1-4]+)|Heat([12])|(Final))$/);\n  if(mx){\n    const evx={n:+mx[1], yx:+mx[2], id:e.id, label:e.label, nth:1};\n    if(mx[3]!=null) return Object.assign(evx, {stage:'q', w:+mx[3], rounds:mx[4].split('').map(Number)});\n    if(mx[5]) return Object.assign(evx, {stage:'heat', r:+mx[5]});\n    return Object.assign(evx, {stage:'final'});\n  }\n  /* 2021-й: квалификатор, полуфинал (день r), Reboot Round, финал — своя машина, runCareerMajor2021. */\n");
rep("  if(ev.y21) return ccM21CanStage(ev, cr, gaveUp);", "  if(ev.y21) return ccM21CanStage(ev, cr, gaveUp);\n  if(ev.yx) return ccMXCanStage(ev, cr, gaveUp);");
rep("  // 2021-й: таблица финала своего сезона и региона (Tracker, на игрока); 5 — Grand Royale.\n",
    "  // 2019–2020: World Cup — призовые Нью-Йорка (одна таблица на мир), FNCS — финал сезона и региона.\n  if(ev && ev.yx) return ccMXPrize(ev.yx, ev.n, place);\n  // 2021-й: таблица финала своего сезона и региона (Tracker, на игрока); 5 — Grand Royale.\n");
rep("  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2021() && CC_DCC_PAY_2021[ev.pay])", "  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2019() && CC_DCC_PAY_2019[ev.pay]) ? CC_DCC_PAY_2019[ev.pay] : (ccIs2021() && CC_DCC_PAY_2021[ev.pay])");
rep("function ccVictoryList(){ return ccIs2021() ?", "function ccVictoryList(){ return ccIs2019() ? CC_VICTORY_2019 : ccIs2021() ?");
rep("    if(mj && mj.y21 && mj.stage==='final'){",
    "    if(mj && mj.yx && mj.stage==='final'){\n      const spx=ccMXSpec(mj.yx, mj.n);\n      ccWithEventSize(spx.size, ()=>play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccMXWorldFinalRoom(mj.yx, mj.n, drafted, lobbyCr),\n           spx.finalGames||12, majorPoints, CC_M24_KILL, p=>ccMXPrize(mj.yx, mj.n, p), {div:1, kind:'major', stage:'final'}));\n    }\n    else if(mj && mj.y21 && mj.stage==='final'){");
rep("return (mj && mj.y21) ? runCareerMajor2021() :", "return (mj && mj.yx) ? runCareerMajorMX() : (mj && mj.y21) ? runCareerMajor2021() :");
rep("  if(ev.y21) return ev.n===5 ? '' : L().ccMajSeatGr21;", "  if(ev.y21) return ev.n===5 ? '' : L().ccMajSeatGr21;\n  if(ev.yx) return '';");
rep("  if(ccIs2021()) return null;\n", "  if(ccIs2021() || ccIs2019()) return null;\n");

fs.writeFileSync(file, s);
console.log('patched 2019');
