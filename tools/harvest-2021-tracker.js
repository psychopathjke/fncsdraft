// Функция для Playwright (browser_evaluate на странице fortnitetracker.com):
// снимает таблицы FNCS 2021 (Chapter 2, трио) одного сезона во всех регионах.
// __SEASON__ — S15…S18 или GR (Grand Royale). Раунды 1–2 квалификаторов пропускаются
// (тысячи трио), у раунда 3 — одна страница (топ-100), остальное целиком.
// Результат: { "<slug>|<REG>|<окно>": {n, begin, usd:[[место, $]], q, rows:[[rank, pts, matches, wins, elims, avgPlace, [ники], [страны]]]} }
async () => {
  const SEASON = '__SEASON__';
  const REGS = ['EU', 'NAE', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
  const SLUGS = {
    S15: ['S15_FNCS_Qualifier1', 'S15_FNCS_Qualifier2', 'S15_FNCS_Qualifier3', 'S15_FNCS_SemiFinals', 'S15_FNCS_RebootRound', 'S15_FNCS_GrandFinals'],
    S16: ['S16_FNCS_Qualifier1', 'S16_FNCS_Qualifier2', 'S16_FNCS_Qualifier3', 'S16_FNCS_SemiFinals', 'S16_FNCS_RebootRound', 'S16_FNCS_Finals'],
    S17: ['S17_FNCS_Qualifier1', 'S17_FNCS_Qualifier2', 'S17_FNCS_Qualifier3', 'S17_FNCS_SemiFinals', 'S17_FNCS_RebootRound', 'S17_FNCS_Finals'],
    S18: ['S18_FNCS_Qualifier1', 'S18_FNCS_Qualifier2', 'S18_FNCS_SemiFinals_Day1', 'S18_FNCS_SemiFinals_Day2', 'S18_FNCS_Finals'],
    GR: ['S18_GrandRoyale_Finals', 'S18_GrandRoyale_Reload', 'S18_GrandRoyale_VictoryPath'],
    CUPS: ['S15_CashCup', 'S15_SoloCashCup', 'S16_CashCup', 'S16_SoloCashCup', 'S17_CashCup', 'S17_SoloCashCup', 'S18_CashCup', 'S18_SoloCashCup']
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
  const usdOf = w => { try { const t = (w.PayoutTableV2 || [])[0]; return ((t && t.Ranks) || []).map(r => [r.Threshold, ((r.Payouts || []).find(p => p.Value === 'USD') || {}).Quantity || 0]).filter(x => x[1]); } catch (e) { return []; } };
  const qOf = w => { try { return ((w.PointsToQualify || [])[0] || {}).Rank.Threshold || null; } catch (e) { return null; } };
  const out = {};
  const cups = SEASON === 'CUPS';
  for (const reg of REGS) {
    for (const slug of SLUGS) {
      const base = '/events/epicgames_' + slug + '_' + reg;
      let h; try { h = await fetch(base).then(r => r.ok ? r.text() : ''); } catch (e) { h = ''; }
      const ev = h && grab(h, 'imp_event');
      if (!ev) { out[slug + '|' + reg + '|-'] = { err: 'no event' }; continue; }
      if (cups) { out[slug + '|' + reg] = (ev.Windows || []).map(w => ({ id: w.EventWindowId, begin: (w.BeginTime || '').slice(0, 10), usd: usdOf(w), q: qOf(w) })); continue; }
      for (const w of (ev.Windows || [])) {
        const id = w.EventWindowId, short = id.replace('_' + reg, '').replace(/^S1\d_(FNCS_|GrandRoyale_)/, '');
        if (/_Event[12]$/.test(short) && /Qualifier/.test(short)) continue;
        const cap = /Qualifier\d_Event3$/.test(short) ? 1 : 3;
        const rows = []; let tp = 1;
        for (let p = 0; p < Math.min(cap, tp); p++) {
          let hw; try { hw = await fetch(base + Q + 'window=' + id + '&page=' + p).then(r => r.text()); } catch (e) { break; }
          const lb = grab(hw, 'imp_leaderboard'); if (!lb) break;
          tp = lb.totalPages || 1;
          rows.push(...rowsOf(lb));
        }
        out[slug + '|' + reg + '|' + short] = { n: tp, begin: (w.BeginTime || '').slice(0, 10), usd: usdOf(w), q: qOf(w), rows };
      }
    }
  }
  return out;
}
