// Функция для Playwright (browser_evaluate на странице fortnitetracker.com):
// снимает таблицы FNCS 2023 одного сезона во всех регионах.
// Вставляется в browser_evaluate как есть; SEASON и REGS — в первой строке.
// Результат: { "<slug>|<REG>|<окно>": {n, rows:[[rank, pts, matches, wins, elims, avgPlace, [ники], [страны]]]} }
// Пропускаются Day 1 недель и Last Chance Major (там тысячи дуо); у Day 2 —
// до двух страниц (200), у LCM Day 2 — до трёх (250 проходят дальше).
async () => {
  const SEASON = '__SEASON__';
  const REGS = ['EU', 'NAE', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
  const SLUGS = {
    S23: ['S23_FNCS_Major1_Week1', 'S23_FNCS_Major1_Week2', 'S23_FNCS_Major1_Week3', 'S23_FNCS_Major1_SurgeWeek', 'S23_FNCS_Major1_GrandFinals'],
    S24: ['S24_FNCS_Major2_Week1', 'S24_FNCS_Major2_Week2', 'S24_FNCS_Major2_Week3', 'S24_FNCS_Major2_SurgeWeek', 'S24_FNCS_Major2_GrandFinals'],
    S25: ['S25_FNCS_Major3_Week1', 'S25_FNCS_Major3_Week2', 'S25_FNCS_Major3_Week3', 'S25_FNCS_Major3_GrandFinals', 'S25_FNCS_LastChanceMajor']
  }[SEASON];
  const Q = String.fromCharCode(63);
  const grab = (h, name) => {
    const re = new RegExp('var ' + name + '\\s*=\\s*'); const m = re.exec(h); if (!m) return null;
    let s = m.index + m[0].length, d = 0, j = s;
    for (; j < h.length; j++) { const c = h[j]; if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) break; } }
    try { return JSON.parse(h.slice(s, j + 1)); } catch (e) { return null; }
  };
  const rowsOf = lb => {
    const acc = lb.internal_Accounts || {};
    return (lb.entries || []).map(e => {
      const ss = e.sessionStats || {};
      const pl = (e.sessionHistory || []).map(h => h.matchStats && h.matchStats.placement).filter(x => x > 0);
      const avgPlace = pl.length ? +(pl.reduce((a, b) => a + b, 0) / pl.length).toFixed(2) : (ss.avgPlace || 0);
      const ids = e.teamAccountIds || [];
      return [e.rank, e.pointsEarned, ss.matches || pl.length || 0, ss.wins || 0, ss.elims || 0, avgPlace,
        ids.map(id => { const a = acc[id] || {}; return a.esportsNickname || a.nickname || id.slice(0, 8); }),
        ids.map(id => { const a = acc[id] || {}; return a.countryCode || null; })];
    });
  };
  const out = {};
  for (const reg of REGS) {
    for (const slug of SLUGS) {
      const base = '/events/epicgames_' + slug + '_' + reg;
      let h; try { h = await fetch(base).then(r => r.ok ? r.text() : ''); } catch (e) { h = ''; }
      const ev = h && grab(h, 'imp_event');
      if (!ev) { out[slug + '|' + reg + '|-'] = { err: 'no event' }; continue; }
      for (const w of (ev.Windows || [])) {
        const id = w.EventWindowId, short = id.replace('_' + reg, '').replace(/^S2\d_FNCS_/, '');
        if (/Week\d_Day1$|LastChanceMajor_Day1$/.test(short)) continue;
        const cap = /Day2$/.test(short) ? (/LastChance/.test(short) ? 3 : 2) : 5;
        const rows = []; let tp = 1;
        for (let p = 0; p < Math.min(cap, tp); p++) {
          let hw; try { hw = await fetch(base + Q + 'window=' + id + '&page=' + p).then(r => r.text()); } catch (e) { break; }
          const lb = grab(hw, 'imp_leaderboard'); if (!lb) break;
          tp = lb.totalPages || 1;
          rows.push(...rowsOf(lb));
        }
        out[slug + '|' + reg + '|' + short] = { n: tp, begin: (w.BeginTime || '').slice(0, 10), rows };
      }
    }
  }
  return out;
}
