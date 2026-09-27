// Год 2022 в карьере: плитка, тексты на пяти языках, наборы карточек k1–k3, календарные
// развилки (ccIs2022), призовые, острова, Invitational. Данные и машину вклеивает
// tools/splice-2022.js — его запускать первым.
//   node tools/patch-year-2022.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
if (s.indexOf('function ccIs2022(){') >= 0) { console.log('already patched'); process.exit(0); }
const N = t => t.split('\n').join(nl);
const rep = (a, b) => { a = N(a); b = N(b); const n = s.split(a).length - 1; if (n !== 1) throw new Error('found ' + n + ': ' + a.slice(0, 90)); s = s.replace(a, () => b); };

// ---- тексты ----
const NOTE = {
  ru: "ccYearNote2022:'Сезон FNCS 2022: дуо весь год, Chapter 3. Три сезона FNCS: открытые квалификаторы, полуфинал в три сессии и Гранд-финал; осенью — дивизионные кубки, в ноябре — Invitational в Роли. Карточки и рейтинги — FNCS 2022.',",
  en: "ccYearNote2022:'FNCS 2022: duos all year, Chapter 3. Three FNCS seasons: open qualifiers, three Semi-Final sessions and the Grand Finals; divisional cups in the autumn and the Invitational in Raleigh in November. Cards and ratings are FNCS 2022.',",
  fr: "ccYearNote2022:'FNCS 2022 : duos toute l’année, Chapter 3. Trois saisons FNCS : qualifs ouvertes, demi-finales en trois sessions et Grande Finale ; coupes divisionnaires à l’automne, l’Invitational à Raleigh en novembre. Cartes et notes FNCS 2022.',",
  it: "ccYearNote2022:\"FNCS 2022: duo tutto l'anno, Chapter 3. Tre stagioni FNCS: qualificazioni aperte, semifinali in tre sessioni e Gran Finale; coppe divisionali in autunno, l'Invitational a Raleigh a novembre. Carte e rating FNCS 2022.\",",
  pt: "ccYearNote2022:\"FNCS 2022: duplas o ano todo, Chapter 3. Três temporadas da FNCS: classificatórias abertas, semifinais em três sessões e Grande Final; copas divisionais no outono e o Invitational em Raleigh em novembro. Cartas e ratings do FNCS 2022.\","
};
const K = {
  ru: "ccYear2022:'дуо', ccYr22Direct:k=>'Топ-'+k+' квалификатора — сразу в Гранд-финал', ccYr22SemiUp:'Проход в Гранд-финал', ccYr22SemiNext:'Не прошли — следующая сессия полуфинала', ccYr22Inv:'FNCS Invitational · Роли', ccMajSeatInv22:n=>'Топ-'+n+' — приглашение на FNCS Invitational в Роли',",
  en: "ccYear2022:'duos', ccYr22Direct:k=>'Top '+k+' of the qualifier — straight to the Grand Finals', ccYr22SemiUp:'Through to the Grand Finals', ccYr22SemiNext:'Not through — the next Semi-Finals session', ccYr22Inv:'FNCS Invitational · Raleigh', ccMajSeatInv22:n=>'Top '+n+' — an invitation to the FNCS Invitational in Raleigh',",
  fr: "ccYear2022:'duos', ccYr22Direct:k=>'Top '+k+' du qualificatif — directement en Grande Finale', ccYr22SemiUp:'Qualifiés pour la Grande Finale', ccYr22SemiNext:'Pas qualifiés — session suivante des demi-finales', ccYr22Inv:'FNCS Invitational · Raleigh', ccMajSeatInv22:n=>'Top '+n+' — invitation au FNCS Invitational à Raleigh',",
  it: "ccYear2022:'duo', ccYr22Direct:k=>'Top '+k+' della qualificazione — direttamente in Gran Finale', ccYr22SemiUp:'In Gran Finale', ccYr22SemiNext:'Non passati — prossima sessione delle semifinali', ccYr22Inv:'FNCS Invitational · Raleigh', ccMajSeatInv22:n=>'Top '+n+' — invito al FNCS Invitational a Raleigh',",
  pt: "ccYear2022:'duplas', ccYr22Direct:k=>'Top '+k+' da classificatória — direto para a Grande Final', ccYr22SemiUp:'Vaga na Grande Final', ccYr22SemiNext:'Não passaram — próxima sessão das semifinais', ccYr22Inv:'FNCS Invitational · Raleigh', ccMajSeatInv22:n=>'Top '+n+' — convite para o FNCS Invitational em Raleigh',"
};
{
  const lines = s.split(nl);
  const notes = lines.map((l, i) => /ccYearNote2023:/.test(l) ? i : -1).filter(i => i >= 0);
  const keys = lines.map((l, i) => /ccYear2023:/.test(l) ? i : -1).filter(i => i >= 0);
  if (notes.length !== 5 || keys.length !== 5) throw new Error('dictionaries ' + notes.length + '/' + keys.length);
  ['ru', 'en', 'fr', 'it', 'pt'].forEach((lang, j) => {
    let i = notes[j], l = lines[i], at = l.indexOf('ccYearNote2023:');
    lines[i] = l.slice(0, at) + NOTE[lang] + ' ' + l.slice(at);
    i = keys[j]; l = lines[i]; at = l.indexOf('ccYear2023:');
    const comma = l.indexOf(',', at);
    lines[i] = l.slice(0, comma + 1) + ' ' + K[lang] + l.slice(comma + 1);
  });
  s = lines.join(nl);
}

// ---- плитка ----
rep("  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}   /* четыре года в ряд во всю ширину панели */",
    "  .cc-year-panel .cc-chips{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}   /* пять лет в ряд во всю ширину панели */");
rep("                     2023:{lan:'Copenhagen', art:'art/map-e1.jpg'}};",
    "                     2023:{lan:'Copenhagen', art:'art/map-e1.jpg'},\n                     // 2022 — остров первого сезона Chapter 3.\n                     2022:{lan:'Raleigh', art:'art/map-k1.jpg'}};");
rep('ychips.innerHTML=[2026, 2025, 2024, 2023].map(y=>{', 'ychips.innerHTML=[2026, 2025, 2024, 2023, 2022].map(y=>{');

// ---- наборы карточек ----
rep("const T_SETS=['e1','e2','e3',", "const T_SETS=['k1','k2','k3','e1','e2','e3',");
rep("const T_STAGE_NAME_BY_SET={e1:T_STAGE_E,",
    "// Стадии 2022-го: P = полуфинал (три сессии, лучшая), L = предпоследний раунд квалификаторов, G = Гранд-финал.\nconst T_STAGE_K={P:'Semi-Finals', L:'Qualifier', G:'Grand Finals'};\nconst T_STAGE_NAME_BY_SET={k1:T_STAGE_K, k2:T_STAGE_K, k3:T_STAGE_K, e1:T_STAGE_E,");
rep("const T_KILL_BY_SET={e1:{P:4, L:2, G:4},", "const T_KILL_BY_SET={k1:{P:4, L:2, G:4}, k2:{P:4, L:2, G:4}, k3:{P:4, L:2, G:4}, e1:{P:4, L:2, G:4},");
{
  const R = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
  const block = ['k1', 'k2', 'k3'].map(k => '  ' + k + ':{\n' + R.map(r => { const p = 'CARD_' + k.toUpperCase() + r; return '    ' + (r + ':').padEnd(5) + ' {P:' + p + '_S_RAW, L:' + p + '_Q_RAW, G:' + p + '_GF_RAW}'; }).join(',\n') + '\n  },').join('\n');
  rep("const T_RAW={\n  // 2023 (tools/build-2023-rows.js)",
      "const T_RAW={\n  // 2022 (tools/build-2022-rows.js): Q — предпоследний раунд квалификаторов, S — полуфинал, GF — Гранд-финал.\n" + block + "\n  // 2023 (tools/build-2023-rows.js)");
}
rep("const T_NAT={e1:E1_NAT,", "const T_NAT={k1:K1_NAT, k2:K2_NAT, k3:K3_NAT, e1:E1_NAT,");
rep("const T_EVENT_NAME={e1:'FNCS 2023 Major 1',", "const T_EVENT_NAME={k1:'FNCS 2022 C3S1', k2:'FNCS 2022 C3S2', k3:'FNCS 2022 C3S3', e1:'FNCS 2023 Major 1',");
rep("const T_STAGE_DATE={e1:E1_STAGE_DATE,",
    "// 2022: квалификаторы, полуфинал и Гранд-финал — даты окон Tracker.\nconst K1_STAGE_DATE={L:'17–20 фев 2022', P:'25–27 фев 2022', G:'5–6 мар 2022'};\nconst K2_STAGE_DATE={L:'2–15 мая 2022', P:'20–22 мая 2022', G:'28–29 мая 2022'};\nconst K3_STAGE_DATE={L:'8–17 июл 2022', P:'22–24 июл 2022', G:'13–14 авг 2022'};\nconst T_STAGE_DATE={k1:K1_STAGE_DATE, k2:K2_STAGE_DATE, k3:K3_STAGE_DATE, e1:E1_STAGE_DATE,");
rep("const CARD_TRIOS_BY_SET={e1:[],", "const CARD_TRIOS_BY_SET={k1:[], k2:[], k3:[], e1:[],");
rep("const _oyYear=q=>{ const s=String(q.cardSet||''); if(/^e[1-3]$/.test(s)) return 2023;",
    "const _oyYear=q=>{ const s=String(q.cardSet||''); if(/^k[1-3]$/.test(s)) return 2022; if(/^e[1-3]$/.test(s)) return 2023;");
rep("const m=/FNCS (2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };", "const m=/FNCS (2022|2023|2024|2025)/.exec(String(q.event||'')); return m ? +m[1] : 0; };");
rep("const m=/^[eft]([1-3])$/.exec(s);", "const m=/^[ekft]([1-3])$/.exec(s);");
rep("else if(q.cardSet && /^[eft][1-3]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;", "else if(q.cardSet && /^[ekft][1-3]$/.test(q.cardSet) && !ORG_2025[q.handle]) q.org=null;");

// ---- острова ----
rep("                   {key:'e3', label:'Chapter 4 Season 3'}, {key:'e4', label:'Chapter 4 Season 4'}];",
    "                   {key:'e3', label:'Chapter 4 Season 3'}, {key:'e4', label:'Chapter 4 Season 4'},\n                   // Chapter 3 (2022): острова трёх сезонов FNCS и Роли.\n                   {key:'k1', label:'Chapter 3 Season 1'}, {key:'k2', label:'Chapter 3 Season 2'},\n                   {key:'k3', label:'Chapter 3 Season 3'}, {key:'k4', label:'Chapter 3 Season 4'}];");
rep('  e4:"art/map-e4.jpg",\n', '  e4:"art/map-e4.jpg",\n  // Chapter 3, 2022: карты eucompetitive.com (ch3s1map … ch3s3map; у C3S4 — остров C3S3), JPEG.\n  k1:"art/map-k1.jpg",\n  k2:"art/map-k2.jpg",\n  k3:"art/map-k3.jpg",\n  k4:"art/map-k4.jpg",\n');
rep("                  e1:'1600/1600', e2:'1600/1600', e3:'1600/1600', e4:'1600/1600',\n",
    "                  e1:'1600/1600', e2:'1600/1600', e3:'1600/1600', e4:'1600/1600',\n                  k1:'1600/1600', k2:'1600/1600', k3:'1600/1600', k4:'1600/1600',\n");
rep("e1:'wiki', e2:'wiki', e3:'wiki', e4:'wiki', m1:'Kinch'", "e1:'wiki', e2:'wiki', e3:'wiki', e4:'wiki', k1:'wiki', k2:'wiki', k3:'wiki', k4:'wiki', m1:'Kinch'");
rep("    if(ccIs2023()){ const d0=careerToday(); const k=d0>='2023-08-25'",
    "    // 2022-й — Chapter 3: остров по сезону (C3S2 с 20.03, C3S3 с 5.06, C3S4 с 18.09 — Роли).\n    if(ccIs2022()){ const d0=careerToday(); const k=d0>='2022-09-18' ? 4 : d0>='2022-06-05' ? 3 : d0>='2022-03-20' ? 2 : 1;\n      return ZONE_SETS['k'+k] ? 'k'+k : ZONE_SETS['e'+k] ? 'e'+k : 'f'+k; }\n    if(ccIs2023()){ const d0=careerToday(); const k=d0>='2023-08-25'");
rep("return (ev && ev.spec && ZONE_SETS.s42 && !ccIs2025() && !ccIs2024() && !ccIs2023()) ? 's42' : careerBrSet();",
    "return (ev && ev.spec && ZONE_SETS.s42 && !ccIs2025() && !ccIs2024() && !ccIs2023() && !ccIs2022()) ? 's42' : careerBrSet();");

// ---- год ----
rep("function ccPastYear(y){ return y===2025 || y===2024 || y===2023; }", "function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022; }");
rep("function ccIs2023(){ return ccCalYear()===2023; }\n", "function ccIs2023(){ return ccCalYear()===2023; }\n// 2022-й — FNCS Chapter 3, дуо; см. CAREER_YEAR_2022.\nfunction ccIs2022(){ return ccCalYear()===2022; }\n");
rep("function ccYearFrom(){ return ccIs2023() ?", "function ccYearFrom(){ return ccIs2022() ? CC_YEAR_2022_FROM : ccIs2023() ?");
rep("function ccYearTo(){ return ccIs2023() ?", "function ccYearTo(){ return ccIs2022() ? CC_YEAR_2022_TO : ccIs2023() ?");
rep("function ccYearRows(){ return ccIs2023() ?", "function ccYearRows(){ return ccIs2022() ? CAREER_YEAR_2022 : ccIs2023() ?");
rep("function ccCupWeeks(){ return ccIs2023() ?", "function ccCupWeeks(){ return ccIs2022() ? CC_CUP_WEEKS_2022 : ccIs2023() ?");
rep("function ccNoDivisions(){\n",
    "function ccNoDivisions(){\n  /* 2022-й: дивизионы только в C3S4 (кубки осени). Создание — без ступени, как у 2024-го;\n     ступень ставится в день Placement Cup (ccDiv22Place). */\n  if(ccIs2022()){\n    if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return true;\n    const d=careerToday(); return d<CC_DIV_FROM_2022 || d>CC_DIV_END_2022;\n  }\n");
rep("  if(ccIs2023()) return ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2023 : [];\n",
    "  if(ccIs2022()) return [];   // у 2022-го оценки в архиве нет\n  if(ccIs2023()) return ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2023 : [];\n");
rep("  if(ccIs2023()) return 0;   // 2023-й платил", "  if(ccIs2023() || ccIs2022()) return 0;   // 2023-й платил");
rep("function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023()) ?", "function ccYearWeeks(){ return (ccIs2025() || ccIs2024() || ccIs2023() || ccIs2022()) ?");
rep("  if(typeof ccIs2023==='function' && ccIs2023()) return 3;", "  if(typeof ccIs2023==='function' && (ccIs2023() || ccIs2022())) return 3;");
rep("  if(typeof ccIs2023==='function' && ccIs2023()) careerMigrateNoDiv();",
    "  if(typeof ccIs2023==='function' && ccIs2023()) careerMigrateNoDiv();\n  // 2022-й: дивизионы только осенью — ступень по рейтингу в день Placement Cup, после — «вся сцена».\n  if(typeof ccIs2022==='function' && ccIs2022()){ ccDiv22Place(); careerMigrateNoDiv(); }");
rep("  if(y0===2023) return s<=1 ? 2023 :", "  if(y0===2022) return s<=1 ? 2022 : s===2 ? 2023 : s===3 ? 2024 : s===4 ? 2025 : 2026+(s-5);\n  if(y0===2023) return s<=1 ? 2023 :");
rep("cr.year0===2023 ? 3 : 0);", "cr.year0===2023 ? 3 : cr.year0===2022 ? 4 : 0);");
rep("function ccSeasonYear(){ return ccIs2023() ? 2023 :", "function ccSeasonYear(){ return ccIs2022() ? 2022 : ccIs2023() ? 2023 :");
rep("  // Карьера 2023-го: Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.\n",
    "  // Карьера 2022-го: Роли, Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.\n  if(cr && cr.year0===2022){\n    const fact=[null, 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];\n    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);\n    s=s-4;\n  }\n  // Карьера 2023-го: Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.\n");
rep("  if(ccNowYear()===2023) return CC_SNAPSHOTS_2023[0];", "  if(ccNowYear()===2023) return CC_SNAPSHOTS_2023[0];\n  if(ccNowYear()===2022) return CC_SNAPSHOTS_2022[0];");
rep("year===2023 ? CC_SNAPSHOTS_2023 : CC_SNAPSHOTS;", "year===2023 ? CC_SNAPSHOTS_2023 : year===2022 ? CC_SNAPSHOTS_2022 : CC_SNAPSHOTS;");
rep("  return y===2023 ? [CC_YEAR_2023_FROM, CC_YEAR_2023_TO]", "  return y===2022 ? [CC_YEAR_2022_FROM, CC_YEAR_2022_TO]\n       : y===2023 ? [CC_YEAR_2023_FROM, CC_YEAR_2023_TO]");
rep("  if(ccIs2023()) return CC_SEASONS_2023.find(x=>d>=x.from && d<=x.to) || null;",
    "  if(ccIs2023()) return CC_SEASONS_2023.find(x=>d>=x.from && d<=x.to) || null;\n  if(ccIs2022()) return CC_SEASONS_2022.find(x=>d>=x.from && d<=x.to) || null;");
rep("  else if(cr.year===2023) cr.year=2024;", "  else if(cr.year===2023) cr.year=2024;\n  else if(cr.year===2022) cr.year=2023;   // после Роли — календарь 2023-го (дуо), люди 2022-го");
rep("  cr.size = ((cr.season + ((cr.year0===2025 || cr.year0===2023) ? 1 : 0)) % 2) ? 2 : 3;",
    "  cr.size = ((cr.season + ((cr.year0===2025 || cr.year0===2023) ? 1 : 0)) % 2) ? 2 : 3;\n  // Карьера 2022-го: 2023-й и 2024-й — дуо, 2025-й — трио, дальше чередование.\n  if(cr.year0===2022) cr.size = cr.season<=3 ? 2 : (cr.season%2 ? 2 : 3);");
rep("  if(y===2023) return m<=3 ? 1 : m<=5 ? 2 : 3;", "  if(y===2023) return m<=3 ? 1 : m<=5 ? 2 : 3;\n  if(y===2022) return m<=3 ? 1 : m<=6 ? 2 : 3;       // март, май, август");

// ---- ярлыки дней ----
rep("  /* 2023-й: недели (день 1, день 2, финал недели), Surge Week, финал; «Мейджор 4» — Last Chance Major. */\n  const m23=/^Major(\\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/.exec(id);",
    "  /* 2022-й: квалификатор (раунды вечера), полуфинал (сессия), Гранд-финал; Invitational — Роли. */\n  const m22=/^Major(\\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|Final)$/.exec(id);\n  if(m22){\n    if(m22[2]) return L().ccYr24Qual(+m22[1], +m22[2], m22[3].split('').join('–'));\n    if(m22[4]) return L().ccYr24Semi(+m22[1], +m22[4]);\n    id='Major'+m22[1]+'_Final';\n  }\n  if(id==='Invitational2022') return L().ccYr22Inv;\n  /* 2023-й: недели (день 1, день 2, финал недели), Surge Week, финал; «Мейджор 4» — Last Chance Major. */\n  const m23=/^Major(\\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/.exec(id);");

// ---- Мейджоры ----
rep("  /* 2023-й: недели (d1, d2, финал недели wf), Surge Week, финал — своя машина, runCareerMajor2023. */\n",
    "  /* 2022-й: квалификатор (q, раунды вечера), полуфинал (сессия r), финал — своя машина, runCareerMajor2022. */\n  const m22=String(e.id||'').match(/^Major(\\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|(Final))$/);\n  if(m22){\n    let nth=0;\n    const row22=ccYearRows().find(r=>r[2]===e.id);\n    if(row22) for(let d=row22[0], i=1; d<=row22[1]; d=ccAddDays(d,1), i++) if(d===iso){ nth=i; break; }\n    const ev22={n:+m22[1], y22:true, id:e.id, label:e.label, nth:nth};\n    if(m22[2]) return Object.assign(ev22, {stage:'q', q:+m22[2], rounds:m22[3].split('').map(Number)});\n    if(m22[4]) return Object.assign(ev22, {stage:'semi', r:+m22[4]});\n    return Object.assign(ev22, {stage:'final'});\n  }\n  /* 2023-й: недели (d1, d2, финал недели wf), Surge Week, финал — своя машина, runCareerMajor2023. */\n");
rep("  if(ev.y23) return ccM23CanStage(ev, cr, gaveUp);", "  if(ev.y23) return ccM23CanStage(ev, cr, gaveUp);\n  if(ev.y22) return ccM22CanStage(ev, cr, gaveUp);");
rep("  if(ccIs2023()) return ccPay24(CC_MAJOR_PAY_2023[",
    "  // 2022-й: таблица Гранд-финала своего сезона и региона (Tracker, на игрока).\n  if(ccIs2022()) return ccPay24(CC_MAJOR_PAY_2022[(ev && ev.y22) ? ev.n : 3], place)*careerSquadSize();\n  if(ccIs2023()) return ccPay24(CC_MAJOR_PAY_2023[");
rep("  if(ccIs2023()) return ccPay24(CC_WF_PAY_2023, place)*careerSquadSize();", "  if(ccIs2023()) return ccPay24(CC_WF_PAY_2023, place)*careerSquadSize();\n  if(ccIs2022()) return ccPay24(CC_WF_PAY_2022, place)*careerSquadSize();");
rep("function ccPay24Table(tables){\n  let r=careerPrizeRegion(); if(r==='NAW') r='NAC';", "function ccPay24Table(tables){\n  // У 2022-го NA West платил своей таблицей; где её нет — таблица NA Central.\n  let r=careerPrizeRegion(); if(r==='NAW' && !(tables && tables.NAW)) r='NAC';");
rep("  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2023() && CC_DCC_PAY_2023[ev.pay])",
    "  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2022() && CC_DCC_PAY_2022[ev.pay]) ? CC_DCC_PAY_2022[ev.pay] : (ccIs2023() && CC_DCC_PAY_2023[ev.pay])");
rep("  return ccPay24(t, place)*careerSquadSize();\n}", "  // Соло-кап 2022-го платит таблицей на одного.\n  return ccPay24(t, place)*(ev.mode==='solo' ? 1 : careerSquadSize());\n}");
rep("function ccVictoryList(){ return ccIs2023() ?", "function ccVictoryList(){ return ccIs2022() ? CC_VICTORY_2022 : ccIs2023() ?");
rep("    if(mj && mj.y23 && mj.stage==='final'){",
    "    if(mj && mj.y22 && mj.stage==='final'){\n      play(d, 'major'+mj.n, 'major', mj.label||'Major', ()=>ccM22WorldFinalRoom(ccM22Of(mj.n), drafted, lobbyCr),\n           CC_M22.final.games, majorPoints, CC_M24_KILL, majorPrize, {div:1, kind:'major', stage:'final'});\n    }\n    else if(mj && mj.y23 && mj.stage==='final'){");
rep("return (mj && mj.y23) ? runCareerMajor2023() :", "return (mj && mj.y22) ? runCareerMajor2022() : (mj && mj.y23) ? runCareerMajor2023() :");
rep("  if(ev.y23) return L().ccMajSeatGc23(ccGc23Seats('m'+ev.n));", "  if(ev.y23) return L().ccMajSeatGc23(ccGc23Seats('m'+ev.n));\n  if(ev.y22) return L().ccMajSeatInv22(ccInv22Quota());");

// ---- Invitational ----
rep("  /* 2023: в Копенгаген — финалы трёх Мейджоров",
    "  // 2022: приглашение в Роли — место в Гранд-финале сезона не ниже ccInv22Quota.\n  if(ccIs2022()){\n    const cr=CAREER.career;\n    const log=(cr.log||[]).filter(r=>r.season===cr.season).reverse();\n    const hit=log.find(r=>{\n      if(r.kind!=='major' || r.stage!=='final' || !r.place) return false;\n      const ev=careerMajorOn(r.day);\n      return !!ev && ev.y22 && r.place<=ccInv22Quota();\n    });\n    return hit ? {via:'major2', place:hit.place, note:L().ccMajSeatInv22(ccInv22Quota())} : null;\n  }\n  /* 2023: в Копенгаген — финалы трёх Мейджоров");
rep("  if(ccIs2023()) return buildGlobalChampionship2023Field(you);", "  if(ccIs2022()) return buildInvitational2022Field(you);\n  if(ccIs2023()) return buildGlobalChampionship2023Field(you);");
rep("  const t=ccIs2023() ? GC2023_PRIZES :", "  const t=ccIs2022() ? INV2022_PRIZES : ccIs2023() ? GC2023_PRIZES :");

fs.writeFileSync(file, s);
console.log('patched 2022');
