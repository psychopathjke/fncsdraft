// Год 2021 в карьере: плитка, тексты на пяти языках, наборы карточек j1–j4, календарные
// развилки (ccIs2021), призовые, острова, Grand Royale, трио с первого дня. Данные и машину
// вклеивает tools/splice-2021.js — его запускать первым.
//   node tools/patch-year-2021.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
if (s.indexOf('function ccIs2021(){') >= 0) { console.log('already patched'); process.exit(0); }
const N = t => t.split('\n').join(nl);
const rep = (a, b, all) => { a = N(a); b = N(b); const n = s.split(a).length - 1; if (all ? n < 1 : n !== 1) throw new Error('found ' + n + ': ' + a.slice(0, 90)); s = all ? s.split(a).join(b) : s.replace(a, () => b); };

// ---- тексты ----
const NOTE = {
  ru: "ccYearNote2021:'Сезон FNCS 2021: трио весь год, Chapter 2, онлайн. Четыре сезона FNCS: квалификаторы, полуфинал хитами, Reboot Round и Гранд-финал; в ноябре — FNCS Grand Royale. Карточки и рейтинги — FNCS 2021.',",
  en: "ccYearNote2021:'FNCS 2021: trios all year, Chapter 2, online. Four FNCS seasons: qualifiers, Semi-Final heats, the Reboot Round and the Grand Finals; the FNCS Grand Royale in November. Cards and ratings are FNCS 2021.',",
  fr: "ccYearNote2021:'FNCS 2021 : trios toute l’année, Chapter 2, en ligne. Quatre saisons FNCS : qualifs, demi-finales en heats, Reboot Round et Grande Finale ; le FNCS Grand Royale en novembre. Cartes et notes FNCS 2021.',",
  it: "ccYearNote2021:\"FNCS 2021: trio tutto l'anno, Chapter 2, online. Quattro stagioni FNCS: qualificazioni, semifinali a heat, Reboot Round e Gran Finale; l'FNCS Grand Royale a novembre. Carte e rating FNCS 2021.\",",
  pt: "ccYearNote2021:\"FNCS 2021: trios o ano todo, Chapter 2, online. Quatro temporadas da FNCS: classificatórias, semifinais em heats, Reboot Round e Grande Final; o FNCS Grand Royale em novembro. Cartas e ratings do FNCS 2021.\","
};
const K = {
  ru: "ccYear2021:'трио', ccYr21Heat:(n,h)=>'Мейджор '+n+' · полуфинал · хит '+h, ccYr21Reboot:n=>'Мейджор '+n+' · Reboot Round', ccYr21ToReboot:'Не прошли — остаётся Reboot Round', ccYr21Gr:'FNCS Grand Royale', ccMajSeatGr21:'Финал сезона — приглашение на FNCS Grand Royale',",
  en: "ccYear2021:'trios', ccYr21Heat:(n,h)=>'Major '+n+' · Semi-Finals · Heat '+h, ccYr21Reboot:n=>'Major '+n+' · Reboot Round', ccYr21ToReboot:'Not through — the Reboot Round is left', ccYr21Gr:'FNCS Grand Royale', ccMajSeatGr21:'A season Grand Final — an invitation to the FNCS Grand Royale',",
  fr: "ccYear2021:'trios', ccYr21Heat:(n,h)=>'Major '+n+' · demi-finales · heat '+h, ccYr21Reboot:n=>'Major '+n+' · Reboot Round', ccYr21ToReboot:'Pas qualifiés — reste le Reboot Round', ccYr21Gr:'FNCS Grand Royale', ccMajSeatGr21:'Une Grande Finale de saison — invitation au FNCS Grand Royale',",
  it: "ccYear2021:'trio', ccYr21Heat:(n,h)=>'Major '+n+' · semifinali · heat '+h, ccYr21Reboot:n=>'Major '+n+' · Reboot Round', ccYr21ToReboot:'Non passati — resta il Reboot Round', ccYr21Gr:'FNCS Grand Royale', ccMajSeatGr21:'Una Gran Finale di stagione — invito al FNCS Grand Royale',",
  pt: "ccYear2021:'trios', ccYr21Heat:(n,h)=>'Major '+n+' · semifinais · heat '+h, ccYr21Reboot:n=>'Major '+n+' · Reboot Round', ccYr21ToReboot:'Não passaram — resta o Reboot Round', ccYr21Gr:'FNCS Grand Royale', ccMajSeatGr21:'Uma Grande Final de temporada — convite para o FNCS Grand Royale',"
};
{
  const lines = s.split(nl);
  const notes = lines.map((l, i) => /ccYearNote2022:/.test(l) ? i : -1).filter(i => i >= 0);
  const keys = lines.map((l, i) => /ccYear2022:/.test(l) ? i : -1).filter(i => i >= 0);
  if (notes.length !== 5 || keys.length !== 5) throw new Error('dictionaries ' + notes.length + '/' + keys.length);
  ['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
    let i = notes[j], l = lines[i], at = l.indexOf('ccYearNote2022:');
    lines[i] = l.slice(0, at) + NOTE[lang] + ' ' + l.slice(at);
    i = keys[j]; l = lines[i]; at = l.indexOf('ccYear2022:');
    const comma = l.indexOf(',', at);
    lines[i] = l.slice(0, comma + 1) + ' ' + K[lang] + l.slice(comma + 1);
  });
  s = lines.join(nl);
}

// ---- плитка ----
rep("  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}   /* пять лет в ряд во всю ширину панели */",
    "  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}   /* шесть лет в ряд во всю ширину панели */");
rep("  /* На телефоне по два: нынешний год — во всю ширину, прошлые парами. */\n  @media (max-width:560px){ .cc-year-panel .cc-chips{grid-template-columns:1fr 1fr;} .cc-year-panel .cc-chips > :first-child{grid-column:1 / -1;} }",
    "  /* На телефоне по два в ряд: шесть лет — три ряда. */\n  @media (max-width:560px){ .cc-year-panel .cc-chips{grid-template-columns:1fr 1fr;} }");
rep("                     2022:{lan:'Raleigh', art:'art/fncs-2022.jpg'}};",
    "                     2022:{lan:'Raleigh', art:'art/fncs-2022.jpg'},\n                     // 2021 — онлайн, ключевой арт FNCS C2S5 (fortnite.com).\n                     2021:{lan:'Online', art:'art/fncs-2021.jpg'}};");
rep('ychips.innerHTML=[2026, 2025, 2024, 2023, 2022].map(y=>{', 'ychips.innerHTML=[2026, 2025, 2024, 2023, 2022, 2021].map(y=>{');
// Трио с первого дня: 2021-й, как 2025-й.
rep("CC.year===2025 ? 3 : 2", "(CC.year===2025 || CC.year===2021) ? 3 : 2", true);
rep("? (CC.year===2025 ? 2 : 1) : careerMateSeats();", "? ((CC.year===2025 || CC.year===2021) ? 2 : 1) : careerMateSeats();");

// ---- наборы карточек ----
rep("const T_SETS=['k1','k2','k3',", "const T_SETS=['j1','j2','j3','j4','k1','k2','k3',");
rep("const T_STAGE_NAME_BY_SET={k1:T_STAGE_K,",
    "// Стадии 2021-го: P = полуфинал (хиты, лучший), L = раунд 4 квалификаторов, G = Гранд-финал.\nconst T_STAGE_J={P:'Semi-Finals', L:'Qualifier', G:'Grand Finals'};\nconst T_STAGE_NAME_BY_SET={j1:T_STAGE_J, j2:T_STAGE_J, j3:T_STAGE_J, j4:T_STAGE_J, k1:T_STAGE_K,");
rep("const T_KILL_BY_SET={k1:{P:4, L:2, G:4},", "const T_KILL_BY_SET={j1:{P:3, L:2, G:3}, j2:{P:3, L:2, G:3}, j3:{P:3, L:2, G:3}, j4:{P:3, L:2, G:3}, k1:{P:4, L:2, G:4},");
{
  const R = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
  const block = ['j1', 'j2', 'j3', 'j4'].map(k => '  ' + k + ':{\n' + R.map(r => { const p = 'CARD_' + k.toUpperCase() + r; return '    ' + (r + ':').padEnd(5) + ' {P:' + p + '_S_RAW, L:' + p + '_Q_RAW, G:' + p + '_GF_RAW}'; }).join(',\n') + '\n  },').join('\n');
  rep("const T_RAW={\n  // 2022 (tools/build-2022-rows.js)",
      "const T_RAW={\n  // 2021 (tools/build-2021-rows.js): Q — раунд 4 квалификаторов, S — хиты полуфинала, GF — Гранд-финал.\n" + block + "\n  // 2022 (tools/build-2022-rows.js)");
}
rep("const T_NAT={k1:K1_NAT,", "const T_NAT={j1:J1_NAT, j2:J2_NAT, j3:J3_NAT, j4:J4_NAT, k1:K1_NAT,");
rep("const T_EVENT_NAME={k1:'FNCS 2022 C3S1',", "const T_EVENT_NAME={j1:'FNCS 2021 C2S5', j2:'FNCS 2021 C2S6', j3:'FNCS 2021 C2S7', j4:'FNCS 2021 C2S8', k1:'FNCS 2022 C3S1',");
rep("// 2022: квалификаторы, полуфинал и Гранд-финал — даты окон Tracker.\n",
    "// 2021: раунд 4 квалификаторов, полуфинал и Гранд-финал — даты окон Tracker.\nconst J1_STAGE_DATE={L:'14–28 фев 2021', P:'6–7 мар 2021', G:'13–14 мар 2021'};\nconst J2_STAGE_DATE={L:'25 апр – 9 мая 2021', P:'22 мая 2021', G:'29–30 мая 2021'};\nconst J3_STAGE_DATE={L:'1–22 авг 2021', P:'28 авг 2021', G:'4–5 сен 2021'};\nconst J4_STAGE_DATE={L:'17–24 окт 2021', P:'28–29 окт 2021', G:'30–31 окт 2021'};\n// 2022: квалификаторы, полуфинал и Гранд-финал — даты окон Tracker.\n");
rep("const T_STAGE_DATE={k1:K1_STAGE_DATE,", "const T_STAGE_DATE={j1:J1_STAGE_DATE, j2:J2_STAGE_DATE, j3:J3_STAGE_DATE, j4:J4_STAGE_DATE, k1:K1_STAGE_DATE,");
rep("const CARD_TRIOS_BY_SET={k1:[],", "const CARD_TRIOS_BY_SET={j1:[], j2:[], j3:[], j4:[], k1:[],");
rep("if(/^k[1-3]$/.test(s)) return 2022;", "if(/^j[1-4]$/.test(s)) return 2021; if(/^k[1-3]$/.test(s)) return 2022;");
rep("const m=/FNCS (2022|2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };", "const m=/FNCS (2021|2022|2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };");
rep("const m=/^[ekft]([1-3])$/.exec(s);", "const m=/^[ejkft]([1-4])$/.exec(s);");
rep("else if(q.cardSet && /^[ekft][1-3]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;", "else if(q.cardSet && /^[ejkft][1-4]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;");

// ---- острова ----
rep("                   {key:'k3', label:'Chapter 3 Season 3'}, {key:'k4', label:'Chapter 3 Season 4'}];",
    "                   {key:'k3', label:'Chapter 3 Season 3'}, {key:'k4', label:'Chapter 3 Season 4'},\n                   // Chapter 2 (2021): острова четырёх сезонов FNCS.\n                   {key:'j1', label:'Chapter 2 Season 5'}, {key:'j2', label:'Chapter 2 Season 6'},\n                   {key:'j3', label:'Chapter 2 Season 7'}, {key:'j4', label:'Chapter 2 Season 8'}];");
rep('  k4:"art/map-k4.jpg",\n', '  k4:"art/map-k4.jpg",\n  // Chapter 2, 2021: карты eucompetitive.com (ch2s5map … ch2s8map), JPEG.\n  j1:"art/map-j1.jpg",\n  j2:"art/map-j2.jpg",\n  j3:"art/map-j3.jpg",\n  j4:"art/map-j4.jpg",\n');
rep("                  k1:'1600/1600', k2:'1600/1600', k3:'1600/1600', k4:'1600/1600',\n",
    "                  k1:'1600/1600', k2:'1600/1600', k3:'1600/1600', k4:'1600/1600',\n                  j1:'1600/1600', j2:'1600/1600', j3:'1600/1600', j4:'1600/1600',\n");
rep("k1:'wiki', k2:'wiki', k3:'wiki', k4:'wiki', m1:'Kinch'", "k1:'wiki', k2:'wiki', k3:'wiki', k4:'wiki', j1:'wiki', j2:'wiki', j3:'wiki', j4:'wiki', m1:'Kinch'");
rep("    if(ccIs2022()){ const d0=careerToday(); const k=d0>='2022-09-18'",
    "    // 2021-й — Chapter 2: остров по сезону (C2S6 с 16.03, C2S7 с 8.06, C2S8 с 13.09).\n    if(ccIs2021()){ const d0=careerToday(); const k=d0>='2021-09-13' ? 4 : d0>='2021-06-08' ? 3 : d0>='2021-03-16' ? 2 : 1;\n      return ZONE_SETS['j'+k] ? 'j'+k : ZONE_SETS['k'+k] ? 'k'+k : 'f'+k; }\n    if(ccIs2022()){ const d0=careerToday(); const k=d0>='2022-09-18'");
rep("&& !ccIs2023() && !ccIs2022()) ? 's42' : careerBrSet();", "&& !ccIs2023() && !ccIs2022() && !ccIs2021()) ? 's42' : careerBrSet();");

// ---- год ----
rep("function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022; }", "function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022 || y===2021; }");
rep("function ccIs2022(){ return ccCalYear()===2022; }\n", "function ccIs2022(){ return ccCalYear()===2022; }\n// 2021-й — FNCS Chapter 2, трио, онлайн; см. CAREER_YEAR_2021.\nfunction ccIs2021(){ return ccCalYear()===2021; }\n");
rep("function ccYearFrom(){ return ccIs2022() ?", "function ccYearFrom(){ return ccIs2021() ? CC_YEAR_2021_FROM : ccIs2022() ?");
rep("function ccYearTo(){ return ccIs2022() ?", "function ccYearTo(){ return ccIs2021() ? CC_YEAR_2021_TO : ccIs2022() ?");
rep("function ccYearRows(){ return ccIs2022() ?", "function ccYearRows(){ return ccIs2021() ? CAREER_YEAR_2021 : ccIs2022() ?");
rep("function ccCupWeeks(){ return ccIs2022() ?", "function ccCupWeeks(){ return ccIs2021() ? [] : ccIs2022() ?");
rep("function ccNoDivisions(){\n", "function ccNoDivisions(){\n  // 2021-й: дивизионных кубков нет (дивизионы Arena — не турнир).\n  if(ccIs2021()) return true;\n");
rep("  if(ccIs2022()) return [];   // у 2022-го оценки в архиве нет\n", "  if(ccIs2022() || ccIs2021()) return [];   // у 2022-го и 2021-го оценки в архиве нет\n");
rep("  if(ccIs2023() || ccIs2022()) return 0;   // 2023-й платил", "  if(ccIs2023() || ccIs2022() || ccIs2021()) return 0;   // 2023-й платил");
rep("function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023() || ccIs2022()) ?", "function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023() || ccIs2022() || ccIs2021()) ?");
rep("  if(y0===2022) return s<=1 ? 2022 :", "  if(y0===2021) return s<=1 ? 2021 : s===2 ? 2022 : s===3 ? 2023 : s===4 ? 2024 : s===5 ? 2025 : 2026+(s-6);\n  if(y0===2022) return s<=1 ? 2022 :");
rep("cr.year0===2022 ? 4 : 0);", "cr.year0===2022 ? 4 : cr.year0===2021 ? 5 : 0);");
rep("function ccSeasonYear(){ return ccIs2022() ? 2022 :", "function ccSeasonYear(){ return ccIs2021() ? 2021 : ccIs2022() ? 2022 :");
rep("  // Карьера 2022-го: Роли, Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.\n",
    "  // Карьера 2021-го: своего ЛАНа нет (онлайн), дальше Роли, Копенгаген, Форт-Уэрт, Лион; жребий после.\n  if(cr && cr.year0===2021){\n    const fact=[null, 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];\n    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);\n    s=s-5;\n  }\n  // Карьера 2022-го: Роли, Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.\n");
rep("  if(ccNowYear()===2022) return CC_SNAPSHOTS_2022[0];", "  if(ccNowYear()===2022) return CC_SNAPSHOTS_2022[0];\n  if(ccNowYear()===2021) return CC_SNAPSHOTS_2021[0];");
rep("year===2022 ? CC_SNAPSHOTS_2022 : CC_SNAPSHOTS;", "year===2022 ? CC_SNAPSHOTS_2022 : year===2021 ? CC_SNAPSHOTS_2021 : CC_SNAPSHOTS;");
rep("  return y===2022 ? [CC_YEAR_2022_FROM, CC_YEAR_2022_TO]", "  return y===2021 ? [CC_YEAR_2021_FROM, CC_YEAR_2021_TO]\n       : y===2022 ? [CC_YEAR_2022_FROM, CC_YEAR_2022_TO]");
rep("  if(ccIs2022()) return CC_SEASONS_2022.find(x=>d>=x.from && d<=x.to) || null;", "  if(ccIs2022()) return CC_SEASONS_2022.find(x=>d>=x.from && d<=x.to) || null;\n  if(ccIs2021()) return CC_SEASONS_2021.find(x=>d>=x.from && d<=x.to) || null;");
rep("  else if(cr.year===2022) cr.year=2023;", "  else if(cr.year===2022) cr.year=2023;\n  else if(cr.year===2021) cr.year=2022;   // после Grand Royale — календарь 2022-го (дуо), люди 2021-го");
rep("  if(cr.year0===2022) cr.size = cr.season<=3 ? 2 : (cr.season%2 ? 2 : 3);",
    "  if(cr.year0===2022) cr.size = cr.season<=3 ? 2 : (cr.season%2 ? 2 : 3);\n  // Карьера 2021-го: 2022–2024 — дуо, 2025-й — трио, 2026-й — дуо, дальше чередование.\n  if(cr.year0===2021) cr.size = cr.season===5 ? 3 : cr.season<=4 ? 2 : (cr.season%2 ? 3 : 2);");
rep("  if(y===2022) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, август", "  if(y===2022) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, август\n  if(y===2021) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, сентябрь");

// ---- ярлыки дней ----
rep("  /* 2022-й: квалификатор (раунды вечера), полуфинал (сессия), Гранд-финал; Invitational — Роли. */\n",
    "  /* 2021-й: квалификатор (раунды вечера), полуфинал (день), Reboot Round, Гранд-финал; «Мейджор 5» — Grand Royale. */\n  const m21=/^Major(\\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|Final)$/.exec(id);\n  if(m21){\n    const n21=+m21[1];\n    if(m21[2]) return L().ccYr24Qual(n21, +m21[2], m21[3].split('').join('–'));\n    if(m21[4]) return L().ccYr24Semi(n21, +m21[4]);\n    if(m21[5]) return L().ccYr21Reboot(n21);\n    if(n21===5) return L().ccYr21Gr;\n    id='Major'+n21+'_Final';\n  }\n  /* 2022-й: квалификатор (раунды вечера), полуфинал (сессия), Гранд-финал; Invitational — Роли. */\n");

// ---- Мейджоры ----
rep("  /* 2022-й: квалификатор (q, раунды вечера), полуфинал (сессия r), финал — своя машина, runCareerMajor2022. */\n",
    "  /* 2021-й: квалификатор, полуфинал (день r), Reboot Round, финал — своя машина, runCareerMajor2021. */\n  const m21=String(e.id||'').match(/^Major(\\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|(Final))$/);\n  if(m21){\n    let nth=0;\n    const row21=ccYearRows().find(r=>r[2]===e.id);\n    if(row21) for(let d=row21[0], i=1; d<=row21[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }\n    const ev21={n:+m21[1], y21:true, id:e.id, label:e.label, nth:nth};\n    if(m21[2]) return Object.assign(ev21, {stage:'q', q:+m21[2], rounds:m21[3].split('').map(Number)});\n    if(m21[4]) return Object.assign(ev21, {stage:'semi', r:+m21[4]});\n    if(m21[5]) return Object.assign(ev21, {stage:'reboot'});\n    return Object.assign(ev21, {stage:'final'});\n  }\n  /* 2022-й: квалификатор (q, раунды вечера), полуфинал (сессия r), финал — своя машина, runCareerMajor2022. */\n");
rep("  if(ev.y22) return ccM22CanStage(ev, cr, gaveUp);", "  if(ev.y22) return ccM22CanStage(ev, cr, gaveUp);\n  if(ev.y21) return ccM21CanStage(ev, cr, gaveUp);");
rep("  if(ccIs2022()) return ccPay24(CC_MAJOR_PAY_2022[",
    "  // 2021-й: таблица финала своего сезона и региона (Tracker, на игрока); 5 — Grand Royale.\n  if(ccIs2021()) return ccPay24(CC_MAJOR_PAY_2021[(ev && ev.y21) ? ev.n : 4], place)*careerSquadSize();\n  if(ccIs2022()) return ccPay24(CC_MAJOR_PAY_2022[");
rep("  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2022() && CC_DCC_PAY_2022[ev.pay])",
    "  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2021() && CC_DCC_PAY_2021[ev.pay]) ? CC_DCC_PAY_2021[ev.pay] : (ccIs2022() && CC_DCC_PAY_2022[ev.pay])");
rep("function ccVictoryList(){ return ccIs2022() ?", "function ccVictoryList(){ return ccIs2021() ? CC_VICTORY_2021 : ccIs2022() ?");
rep("    if(mj && mj.y22 && mj.stage==='final'){",
    "    if(mj && mj.y21 && mj.stage==='final'){\n      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM21WorldFinalRoom(ccM21Of(mj.n), drafted, lobbyCr, mj.n),\n           CC_M21.final.games, majorPoints, CC_M24_KILL, majorPrize, {div:1, kind:'major', stage:'final'});\n    }\n    else if(mj && mj.y22 && mj.stage==='final'){");
rep("return (mj && mj.y22) ? runCareerMajor2022() :", "return (mj && mj.y21) ? runCareerMajor2021() : (mj && mj.y22) ? runCareerMajor2022() :");
rep("  if(ev.y22) return L().ccMajSeatInv22(ccInv22Quota());", "  if(ev.y22) return L().ccMajSeatInv22(ccInv22Quota());\n  if(ev.y21) return ev.n===5 ? '' : L().ccMajSeatGr21;");
rep("  // 2022: приглашение в Роли — место в Гранд-финале сезона не ниже ccInv22Quota.\n", "  // 2021: ЛАНа нет — Grand Royale идёт машиной сезона («Мейджор 5»).\n  if(ccIs2021()) return null;\n  // 2022: приглашение в Роли — место в Гранд-финале сезона не ниже ccInv22Quota.\n");

fs.writeFileSync(file, s);
console.log('patched 2021');
