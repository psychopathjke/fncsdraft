// Итоги финала FNCS Solos 2026 для «прогноз против факта» (26.10, его пункт 2 из списка идей): таблицы мест Epic по
// регионам с eucompetitive (leaderboard.php). Day 2 — сумма двух дней (cumulative), пока его нет — Day 1. Пустой
// регион (финал ещё не начался) пропускается: страница прогноза покажет факт только там, где он есть.
//   node tools/fetch-solos-results.js   → tools/measured/solos-2026-results.json   (зовёт build-deploy.js)
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'measured', 'solos-2026-results.json');
const API = 'https://eucompetitive.com/APISYSTEMV2/leaderboard.php';
const REGS = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];

async function get(url) {
  try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 fncsdraft' } }); return r.ok ? await r.json() : null; } catch (e) { return null; }
}

(async () => {
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  for (const reg of REGS) {
    for (const day of [2, 1]) {
      const w = 'S42_FNCSSolo_Final_Day' + day + '_' + reg;
      const j = await get(API + '?eventId=epicgames_S42_FNCSSolo_Final_' + reg + '&eventWindowId=' + w);
      const e = j && j.entries || [];
      // До начала дня таблица уже есть — список участников с нулями; это не итог.
      if (!e.length || !e.some(x => x.pointsEarned > 0)) continue;
      out[reg] = { day, window: w, fetched: new Date().toISOString(), synced: j.syncedAt || null,
        rows: e.map(x => ({ id: (x.teamAccountIds || [])[0], rank: x.rank, pts: x.pointsEarned })) };
      console.log(reg + ': день ' + day + ', ' + e.length + ' мест, 1-й ' + ((e[0].customNames || e[0].teamAccountDisplayNames || [])[0] || '?'));
      break;
    }
    if (!out[reg] || !out[reg].rows.some(x => x.pts > 0)) { delete out[reg]; console.log(reg + ': итогов ещё нет'); }
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
})();
