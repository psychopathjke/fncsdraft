// Отбор FNCS Solos 2026 для всех, кто дошёл до хитов, Fast Track или Last Chance Lobby. Источник: eucompetitive,
// те же таблицы Epic, что у финала. Строки: ник Epic, ник из таблицы, места и статы по этапам.
//   node tools/fetch-solos-rest.js   → tools/measured/solos-2026-rest.json
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'measured', 'solos-2026-rest.json');
const API = 'https://eucompetitive.com/APISYSTEMV2/leaderboard.php';
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const STAGES = [
  ['heat1', 'S42_FNCSSolo_HeatsStage', 'S42_FNCSSolo_HeatsStage_Heat1_'],
  ['heat2', 'S42_FNCSSolo_HeatsStage', 'S42_FNCSSolo_HeatsStage_Heat2_'],
  ['fast', 'S42_FNCSSoloFastTracks', 'S42_FNCSSoloFastTracks_'],
  ['lcq', 'S42_FNCSSolo_LastChanceQualifier', 'S42_FNCSSolo_LastChanceLobby_'],
];
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
(async () => {
  const out = { source: API, fetched: new Date().toISOString(), regions: {} };
  for (const reg of REGS) {
    const rows = out.regions[reg] = {};
    for (const [st, ev, win] of STAGES) {
      const url = API + '?eventId=epicgames_' + ev + '_' + reg + '&eventWindowId=' + win + reg;
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 fncsdraft' } });
      const j = r.ok ? await r.json() : {};
      const e = (j.entries || []).filter(x => x.eventWindowId === win + reg);
      console.log(reg, st, e.length);
      e.forEach(x => {
        const id = x.teamAccountIds[0], ss = (x.sessionHistory || []).map(s => s.trackedStats || {});
        const m = ss.reduce((a, s) => a + (s.MATCH_PLAYED_STAT || 0), 0) || 1;
        const sum = k => ss.reduce((a, s) => a + (s[k] || 0), 0);
        const row = rows[id] = rows[id] || { d: (x.teamAccountDisplayNames || [])[0] || '', c: (x.customNames || [])[0] || '', res: [] };
        row.res.push([st, x.rank, x.pointsEarned, m, sum('VICTORY_ROYALE_STAT'), round(sum('TEAM_ELIMS_STAT_INDEX') / m), round(sum('PLACEMENT_STAT_INDEX') / m)]);
      });
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
})();
