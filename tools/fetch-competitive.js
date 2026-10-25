// Данные вкладки Competitive (25.10, его «отдельной вкладкой, как компететив: календарь турниров, за месяц призы
// игроков, новости»): /competitive собирает build-competitive.js из того, что кладёт сюда этот скрипт.
//
//   календарь  — eucompetitive.com/APISYSTEMV2/calendar.php (все окна Epic сезона по всем регионам: время, название,
//                картинка, статус) → tools/measured/comp-calendar.json;
//   результаты — их же leaderboard.php (таблица мест Epic: id аккаунтов, ник, страна, очки) по призовым окнам месяца;
//   выплаты    — payoutTable окна Epic со страниц Tracker (imp_eventWindow), сняты Playwright'ом в
//                tools/measured/comp-payouts.json: { windowId: [{type: 'rank'|'value', ranks: [[порог, $]]}] }.
//                rank — место ≤ порога; value — набранные очки ≥ порога (VCC: $ за каждые 100 очков), берётся высший
//                пройденный порог. Окно без снятой таблицы берёт таблицу той же серии и региона с другой недели.
//   Деньги — каждому игроку команды (таблицы Epic — на игрока).
//
//   node tools/fetch-competitive.js [YYYY-MM]   → comp-calendar.json + comp-results.json
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const M = path.join(ROOT, 'tools/measured');
const API = 'https://eucompetitive.com/APISYSTEMV2';
const SEASONS = ['S42', 'S43'];
const MONTH = process.argv[2] || new Date().toISOString().slice(0, 7);
const PAY = JSON.parse(fs.readFileSync(path.join(M, 'comp-payouts.json'), 'utf8'));
const TRK = fs.existsSync(path.join(M, 'comp-lb-tracker.json')) ? JSON.parse(fs.readFileSync(path.join(M, 'comp-lb-tracker.json'), 'utf8')) : {};

async function get(url) {
  for (let a = 0; a < 3; a++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 fncsdraft' } }); if (r.ok) return await r.json(); } catch (e) {}
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}
// Серия окна без номера недели: S42_ConsoleVCC_SolosZB_Event8Round2_EU → S42_ConsoleVCC_SolosZB_EventNRound2_EU.
const series = w => w.replace(/Event\d+/, 'EventN').replace(/Week\d+/, 'WeekN');
function payTable(w) {
  if (Array.isArray(PAY[w]) && PAY[w].length) return PAY[w];
  const s = series(w);
  const k = Object.keys(PAY).find(x => series(x) === s && Array.isArray(PAY[x]) && PAY[x].length);
  return k ? PAY[k] : null;
}
function payout(table, rank, pts) {
  let usd = 0;
  table.forEach(t => {
    if (t.type === 'rank') {   // самый узкий порог «место ≤ N», куда попал
      const r = t.ranks.filter(([thr]) => rank <= thr).sort((a, b) => a[0] - b[0])[0];
      if (r) usd = Math.max(usd, r[1]);
    } else {                   // высший пройденный порог очков
      t.ranks.forEach(([thr, v]) => { if (pts >= thr) usd = Math.max(usd, v); });
    }
  });
  return usd;
}

(async () => {
  // Календарь
  let events = [];
  for (const s of SEASONS) {
    const j = await get(API + '/calendar.php?season=' + s + '&region=ALL');
    if (j && j.events) events = events.concat(j.events);
  }
  if (!events.length) throw new Error('календарь пуст');
  const seen = new Set();
  const cal = events.filter(e => e.windowId && !seen.has(e.windowId) && seen.add(e.windowId)).map(e => ({
    w: e.windowId, ev: e.eventId, name: e.name, region: e.region, begin: e.beginTime, end: e.endTime, img: e.imageUrl || null, status: e.status, lan: !!e.isLan,
  }));
  fs.writeFileSync(path.join(M, 'comp-calendar.json'), JSON.stringify({ fetched: new Date().toISOString(), events: cal }));
  console.log('календарь: ' + cal.length + ' окон');

  // Результаты призовых окон месяца
  const done = cal.filter(e => e.status === 'ended' && e.begin.slice(0, 7) === MONTH && payTable(e.w));
  const results = [];
  for (let i = 0; i < done.length; i += 6) {
    await Promise.all(done.slice(i, i + 6).map(async e => {
      const j = await get(API + '/leaderboard.php?eventId=' + encodeURIComponent(e.ev) + '&eventWindowId=' + encodeURIComponent(e.w));
      const table = payTable(e.w);
      let top = (j && j.entries || []).slice(0, 100).map(x => ({
        rank: x.rank, pts: x.pointsEarned, usd: payout(table, x.rank, x.pointsEarned),
        ids: x.teamAccountIds, n: (x.customNames && x.customNames.some(Boolean) ? x.customNames : x.teamAccountDisplayNames) || [],
        epic: x.teamAccountDisplayNames || [], c: (x.customCountries || []).map(c => c ? String(c).toLowerCase() : null),
      }));
      // eucompetitive синхронизирует не все окна (25.10: 57 пустых, свежие недели Reload/VCC) — тогда таблица мест
      // с Tracker (imp_leaderboard, снята Playwright'ом в comp-lb-tracker.json: rank, pts, ids, n, c).
      if (!top.length && TRK[e.w] && TRK[e.w].length) top = TRK[e.w].map(x => ({ ...x, epic: x.n, usd: payout(table, x.rank, x.pts) }));
      if (!top.length) return;
      results.push({ w: e.w, ev: e.ev, name: e.name, region: e.region, begin: e.begin, top });
    }));
  }
  results.sort((a, b) => a.begin < b.begin ? -1 : 1);
  fs.writeFileSync(path.join(M, 'comp-results.json'), JSON.stringify({ month: MONTH, fetched: new Date().toISOString(), windows: results }));
  const total = results.reduce((s, r) => s + r.top.reduce((a, x) => a + x.usd * x.ids.length, 0), 0);
  // Обложки новых серий календаря (art/comp) — см. fetch-comp-art.js.
  try { require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'fetch-comp-art.js')], { stdio: 'inherit' }); } catch (e) { console.log('обложки: не обновились'); }
  console.log('результаты ' + MONTH + ': ' + results.length + ' окон с призами, выплачено $' + total.toLocaleString('en-US'));
})().catch(e => { console.error(e); process.exit(1); });
