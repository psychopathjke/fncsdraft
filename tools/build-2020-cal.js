// Календарь и спеки сезонов 2020-го из tools/measured/2020-shape.json (даты страниц Liquipedia,
// число команд в хитах и финале Европы). Выход — tools/career-2020-cal.generated.js:
// CC_YEAR_2020_FROM/TO, CAREER_YEAR_2020, CC_SEASONS_2020, CC_SNAPSHOTS_2020, CC_MX_SPEC[2020].
//   node tools/build-2020-rows.js && node tools/build-2020-cal.js
'use strict';
const fs = require('fs'), path = require('path');
const { dates, shape } = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', '2020-shape.json'), 'utf8'));
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const NAMES = { i1: 'FNCS Chapter 2 Season 2', i2: 'FNCS Chapter 2 Season 3', i3: 'FNCS Chapter 2 Season 4' };
const rows = [], spec = {};
let last = '2020-01-06';
['i1', 'i2', 'i3'].forEach((set, idx) => {
  const n = idx + 1, d = dates[set], sh = shape[set], size = sh.size, eu = sh.EU || {};
  const lobby = size === 1 ? 100 : size === 2 ? 50 : size === 3 ? 33 : 25;
  // Wildcard (неделя 9) у C2S4 по датам Liquipedia в день финала — вечера наложились бы; не берём.
  const weeks = Object.keys(d.weeks).map(Number).filter(w => !(d.gf && d.weeks[w][0] >= d.gf[0])).sort((a, b) => a - b);
  weeks.forEach(w => {
    const [a, b] = d.weeks[w];
    if (!a) return;
    if (!b || b === a) rows.push([a, a, 'Major' + n + '_2020_W' + w + 'R12', 'major']);
    else { rows.push([a, a, 'Major' + n + '_2020_W' + w + 'R1', 'major']); rows.push([b, b, 'Major' + n + '_2020_W' + w + 'R2', 'major']); }
  });
  const heatDays = d.heats.length ? d.heats : [];
  heatDays.slice(0, 2).forEach((h, i) => rows.push([h, h, 'Major' + n + '_2020_Heat' + (i + 1), 'major']));
  if (d.gf && d.gf[0]) { rows.push([d.gf[0], d.gf[1] || d.gf[0], 'Major' + n + '_2020_Final', 'major']); last = d.gf[1] || d.gf[0]; }
  const H = Math.max(1, eu.heats || 2), gf = eu.gf || lobby, perHeat = Math.max(1, Math.floor(gf / H));
  const days = heatDays.length >= 2 ? 2 : 1;
  spec[n] = { set, name: NAMES[set], size, qual: set === 'i2', weeks,
    rounds: [{ games: 10, cut: lobby, open: true }, { games: 6, cut: 0 }],
    heats: Array.from({ length: H }, (_, i) => ({ day: days === 2 && i >= Math.ceil(H / 2) ? 2 : 1, cut: perHeat })), heatGames: 6, finalGames: 12, island: set };
});
rows.sort((a, b) => a[0] < b[0] ? -1 : 1);
const to = addDays(last, 28);
const nat = [addDays(last, 7), addDays(last, 14), addDays(last, 21)];
const out = [];
out.push("const CC_YEAR_2020_FROM='2020-01-06', CC_YEAR_2020_TO='" + to + "';");
out.push('const CAREER_YEAR_2020=[');
out.push(rows.map(r => '  ' + JSON.stringify(r).replace(/"/g, "'")).join(',\n') + ',');
out.push("  ['" + nat[0] + "','" + nat[0] + "','NationsTrial','nations'], ['" + nat[1] + "','" + nat[1] + "','NationsQual','nations'], ['" + nat[2] + "','" + nat[2] + "','NationsFinal','nations']");
out.push('];');
out.push("const CC_SEASONS_2020=[{id:'S11', from:'2019-10-15', to:'2020-02-19'}, {id:'S12', from:'2020-02-20', to:'2020-06-16'}, {id:'S13', from:'2020-06-17', to:'2020-08-26'}, {id:'S14', from:'2020-08-27', to:'2020-12-01'}];");
out.push("CAREER_YEAR_2020.forEach(r=>{ const m=/^Major(\\d)_2020_/.exec(r[2]); if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-i'+m[1]+'.jpg'; });");
out.push("const CC_SNAPSHOTS_2020=[{tag:'i1', from:CC_YEAR_2020_FROM, playIn:/2020 C2S[234] . Grand Finals/, lcq:/2020 C2S[234] . (Semi-Finals|Qualifier)/}];");
out.push('var CC_MX_SPEC=CC_MX_SPEC||{};');
out.push('CC_MX_SPEC[2020]=' + JSON.stringify(spec).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'") + ';');
const head = "/* ---- 2020 в карьере -----------------------------------------------------------------\n   Формат меняется по ходу года: FNCS C2S2 — дуо, C2S3 — соло, C2S4 — трио. Состав года — трио,\n   вечер — в своём формате (runCareerMajorMX). Даты — страницы Liquipedia (на Tracker этих\n   сезонов нет), квота хита — финал Европы поровну на хиты; генерируется tools/build-2020-cal.js. */\n";
fs.writeFileSync(path.join(__dirname, 'career-2020-cal.generated.js'), head + out.join('\n') + '\n');
console.log('rows', rows.length, 'to', to, JSON.stringify(spec).slice(0, 600));
