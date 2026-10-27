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
  /* КУМУЛЯТИВ (27.10, его «кумулятив не считает в предиктах»). Таблица окна Day2 у Epic — очки ТОЛЬКО второго дня
     (6 игр, у лидера EU 279; лидеры дней разные), суммы по финалу Epic не отдаёт ни в pointsEarned, ни в score.
     Итог финала = очки Day1 + очки Day2 по аккаунту, места — по сумме (при равенстве — по месту второго дня).
     Пока второго дня нет — итог первого. В строке остаются d1 и d2. */
  const day = async (reg, d) => {
    const w = 'S42_FNCSSolo_Final_Day' + d + '_' + reg;
    const j = await get(API + '?eventId=epicgames_S42_FNCSSolo_Final_' + reg + '&eventWindowId=' + w);
    const e = (j && j.entries || []).filter(x => x.eventWindowId === w); // посев до старта — строки чужих окон
    // До начала дня таблица уже есть — список участников с нулями; это не итог.
    return (e.length && e.some(x => x.pointsEarned > 0)) ? { w, e, synced: j.syncedAt || null } : null;
  };
  const idOf = x => String((x.teamAccountIds || [])[0] || '').replace(/-/g, '');
  for (const reg of REGS) {
    const D1 = await day(reg, 1), D2 = await day(reg, 2);
    if (!D1 && !D2) { delete out[reg]; console.log(reg + ': итогов ещё нет'); continue; }
    const m = new Map();
    [[D1, 'd1'], [D2, 'd2']].forEach(([D, k]) => { if (D) D.e.forEach(x => { const id = idOf(x); if (!id) return;
      const r = m.get(id) || { id, d1: 0, d2: 0, r2: 999 }; r[k] = x.pointsEarned || 0; if (k === 'd2') r.r2 = x.rank || 999; m.set(id, r); }); });
    const rows = [...m.values()].map(r => Object.assign(r, { pts: r.d1 + r.d2 }))
      .sort((a, b) => (b.pts - a.pts) || (a.r2 - b.r2));
    rows.forEach((r, i) => { r.rank = i + 1; delete r.r2; });
    out[reg] = { day: D2 ? 2 : 1, cumulative: !!D2, window: (D2 || D1).w, fetched: new Date().toISOString(), synced: (D2 || D1).synced, rows };
    const lead = (D2 || D1).e.find(x => idOf(x) === rows[0].id);
    console.log(reg + ': ' + (D2 ? 'сумма двух дней' : 'день 1') + ', ' + rows.length + ' мест, 1-й ' + ((lead && (lead.customNames || lead.teamAccountDisplayNames || [])[0]) || rows[0].id) + ' ' + rows[0].pts);
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
})();
