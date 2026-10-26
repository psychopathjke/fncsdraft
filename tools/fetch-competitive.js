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
// Весь год (26.10, его «сделай весь 2026 год»): результаты всех призовых окон с YEAR-01 по сегодня. Уже снятые окна
// не перекачиваются — закончившийся турнир не меняется (comp-results.json хранит их, докачиваются только новые).
const YEAR = process.argv[2] || '2026';
const PAY = JSON.parse(fs.readFileSync(path.join(M, 'comp-payouts.json'), 'utf8'));
// События года со страниц Tracker (imp_event: окна, время, payoutTable) — comp-events-2026.json, снят Playwright'ом.
// Даёт январь–май, которых у eucompetitive нет, и выплаты всех окон сразу.
const EVF = path.join(M, 'comp-events-' + YEAR + '.json');
const EV = fs.existsSync(EVF) ? JSON.parse(fs.readFileSync(EVF, 'utf8')) : {};
Object.values(EV).forEach(e => e && e.w && e.w.forEach(w => { if (w.pay && w.pay.length && !(Array.isArray(PAY[w.w]) && PAY[w.w].length)) PAY[w.w] = w.pay; }));
// Сезоны до S40 у eucompetitive лежат в старом API (apiBaseFor на их сайте).
const apiFor = w => { const m = String(w).match(/^S(\d+)/); return m && +m[1] <= 40 ? 'https://eucompetitive.com/apisystem' : API; };
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

  // Призовые окна года: из календаря eucompetitive и из событий Tracker
  const now = Date.now(), byW = new Map();
  cal.forEach(e => { if (e.status === 'ended' && e.begin.slice(0, 4) === YEAR) byW.set(e.w, e); });
  Object.entries(EV).forEach(([ev, e]) => e && e.w && e.w.forEach(w => {
    if (byW.has(w.w) || w.ex || !w.b || String(w.b).slice(0, 4) !== YEAR || Date.parse(w.e || w.b) > now) return;
    byW.set(w.w, { w: w.w, ev, name: [e.t1, e.t2].filter(Boolean).join(' ') + (w.n ? ' · ' + w.n : ''), pretty: true,
      region: /_Official$/.test(ev) ? 'LAN' : String(ev).split('_').pop(), begin: String(w.b).replace('+00:00', 'Z') });
  }));
  const RF = path.join(M, 'comp-results.json');
  const old = fs.existsSync(RF) ? JSON.parse(fs.readFileSync(RF, 'utf8')) : {};
  const have = new Map((old.windows || []).map(r => [r.w, r]));
  const done = [...byW.values()].filter(e => payTable(e.w) && !have.has(e.w));
  console.log('призовых окон за ' + YEAR + ': ' + [...byW.values()].filter(e => payTable(e.w)).length + ', новых к скачиванию: ' + done.length);
  const results = [...have.values()];
  const missing = [];
  for (let i = 0; i < done.length; i += 8) {
    if (i && i % 200 === 0) console.log('  … ' + i + '/' + done.length);
    await Promise.all(done.slice(i, i + 8).map(async e => {
      const j = await get(apiFor(e.w) + '/leaderboard.php?eventId=' + encodeURIComponent(e.ev) + '&eventWindowId=' + encodeURIComponent(e.w));
      const table = payTable(e.w);
      let top = (j && j.entries || []).slice(0, 100).map(x => ({
        rank: x.rank, pts: x.pointsEarned, usd: payout(table, x.rank, x.pointsEarned),
        ids: x.teamAccountIds, n: (x.customNames && x.customNames.some(Boolean) ? x.customNames : x.teamAccountDisplayNames) || [],
        epic: x.teamAccountDisplayNames || [], c: (x.customCountries || []).map(c => c ? String(c).toLowerCase() : null),
      }));
      // eucompetitive синхронизирует не все окна (25.10: 57 пустых, свежие недели Reload/VCC) — тогда таблица мест
      // с Tracker (imp_leaderboard, снята Playwright'ом в comp-lb-tracker.json: rank, pts, ids, n, c).
      // На ЛАНах (…_Official) играют с турнирных аккаунтов «[FNCS2026] BIG Malibuca» — у eucompetitive они отдельные люди,
      // а Tracker сводит их к основному аккаунту. Для ЛАНа таблица мест с Tracker в приоритете.
      if ((!top.length || /^(Bratwurst|MannekenPis|BOG)_/i.test(e.w)) && TRK[e.w] && TRK[e.w].length) top = TRK[e.w].map(x => ({ ...x, epic: x.n, usd: payout(table, x.rank, x.pts) }));
      if (!top.length) { missing.push([e.ev, e.w]); return; }
      results.push({ w: e.w, ev: e.ev, name: e.name, pretty: !!e.pretty, region: e.region, begin: e.begin, top });
    }));
  }
  // Global Championship (Антверпен, ЛАН 26–27.09): окна Epic нет ни в календаре, ни на Tracker, а $2 000 000 — главный
  // приз года (без него у vic0 и Malibuca не хватало ~$120k против Liquipedia). Места и выплаты — из gc2026-antwerp.json
  // (снят с Tracker 26.09); id аккаунта — по нику из остальных таблиц года, иначе «gc:ник».
  const GCF = path.join(M, 'gc2026-antwerp.json');
  if (YEAR === '2026' && fs.existsSync(GCF) && !results.some(r => r.w === 'MannekenPis_Day2')) {
    let G = JSON.parse(fs.readFileSync(GCF, 'utf8')); if (typeof G === 'string') G = JSON.parse(G); else if (!G.event) G = JSON.parse(Object.values(G).join(''));
    const win = G.event.windows.find(w => w.id === 'MannekenPis_Day2');
    const table = (win.payout || []).map(t => ({ type: t.ScoringType, ranks: (t.Ranks || []).map(r => [r.Threshold, (r.Payouts || []).filter(x => x.Value === 'USD').reduce((a, x) => a + x.Quantity, 0)]).filter(r => r[1] > 0) }));
    const idOf = new Map();
    results.forEach(r => r.top.forEach(x => x.ids.forEach((id, i) => [x.n[i], x.epic[i]].forEach(n => { if (n) idOf.set(String(n).toLowerCase(), id); }))));
    const top = (G.days.MannekenPis_Day2 || []).map(x => ({ rank: x.rank, pts: x.pts, usd: payout(table, x.rank, x.pts),
      ids: x.team.map(p => idOf.get(String(p.nick).toLowerCase()) || idOf.get(String(p.full).toLowerCase()) || 'gc:' + p.nick),
      n: x.team.map(p => p.nick), epic: x.team.map(p => p.full), c: x.team.map(p => p.cc ? String(p.cc).toLowerCase() : null) }));
    results.push({ w: 'MannekenPis_Day2', ev: 'epicgames_MannekenPis_Official', name: 'FNCS Global Championship 2026 · Finals', pretty: true, region: 'LAN', begin: win.begin.replace('+00:00', 'Z'), top });
    console.log('Global Championship: ' + top.length + ' команд, 1-е место $' + (top[0] && top[0].usd));
  }
  // Сторонние ЛАНы и шоу-матчи (Red Bull Reshuffle, Lost Legends, Virtuocity, Amar x Rohat) — не Epic: места и призы
  // с Liquipedia (fetch-lan-lq.js → comp-lan-lq.json), приз уже на игрока. id — по нику из таблиц года, иначе «lq:ник».
  const LQF = path.join(M, 'comp-lan-lq.json');
  if (fs.existsSync(LQF)) {
    const idOf = new Map();
    results.forEach(r => r.top.forEach(x => x.ids.forEach((id, i) => [x.n[i], x.epic[i]].forEach(n => { if (n && !/^lq:|^gc:/.test(id)) idOf.set(String(n).toLowerCase().trim(), id); }))));
    Object.entries(JSON.parse(fs.readFileSync(LQF, 'utf8'))).forEach(([page, L]) => {
      const w = 'LQ_' + page.replace(/[^A-Za-z0-9]+/g, '_');
      const i = results.findIndex(r => r.w === w); if (i >= 0) results.splice(i, 1);
      if (!L.top || !L.top.length) return;
      results.push({ w, ev: 'liquipedia:' + page, name: L.name + (L.city && L.city !== 'Online' ? ' · ' + L.city : ''), pretty: true, region: 'LAN',
        begin: L.day + 'T12:00:00Z', top: L.top.map(x => ({ rank: x.rank, pts: 0, usd: x.usd,
          ids: x.names.map(n => idOf.get(String(n).toLowerCase().trim()) || 'lq:' + n), n: x.names, epic: x.names, c: x.names.map(() => null) })) });
    });
  }
  // Многодневный финал (Major, Global Championship, FNCS Solos): таблица выплат у Epic «cumulative» и висит на окне
  // каждого дня — деньги платятся один раз, по итогу последнего дня. Без этого финалисты получали приз дважды.
  const dayKey = w => /_Day\d+/.test(w) ? w.replace(/_Day\d+/, '_DayN') : null;
  const lastDay = new Map();
  results.forEach(r => { const k = dayKey(r.w); if (!k || !r.top.some(x => x.usd)) return; const d = +r.w.match(/_Day(\d+)/)[1]; if (!lastDay.has(k) || d > lastDay.get(k)) lastDay.set(k, d); });
  // Только если у раннего дня та же таблица, что у последнего (общая cumulative): у Reload Elite Championship каждый
  // день платит своим вылетевшим (группы — 18–20-е, выживание — 7–9-е), это разные деньги.
  const lastW = new Map();
  results.forEach(r => { const k = dayKey(r.w); if (k && lastDay.has(k) && +r.w.match(/_Day(\d+)/)[1] === lastDay.get(k)) lastW.set(k, r.w); });
  results.forEach(r => { const k = dayKey(r.w); if (k && lastW.has(k) && r.w !== lastW.get(k) && JSON.stringify(payTable(r.w)) === JSON.stringify(payTable(lastW.get(k)))) r.top.forEach(x => { x.usd = 0; }); });
  results.sort((a, b) => a.begin < b.begin ? -1 : 1);
  // Хранится только нужное странице: кто получил деньги, и первая тройка (карточки результатов) — 12 МБ → ~1 МБ.
  results.forEach(r => { r.top = r.top.filter(x => x.usd > 0 || x.rank <= 3); });
  // Кеш Tracker нужен только окнам, которых ещё нет в результатах.
  const inRes = new Set(results.map(r => r.w));
  const TRKF = path.join(M, 'comp-lb-tracker.json');
  if (fs.existsSync(TRKF)) fs.writeFileSync(TRKF, JSON.stringify(Object.fromEntries(Object.entries(TRK).filter(([w]) => !inRes.has(w)))));
  fs.writeFileSync(RF, JSON.stringify({ year: YEAR, fetched: new Date().toISOString(), windows: results }));
  // Чего нет ни у eucompetitive, ни в comp-lb-tracker.json — список для следующего прохода Tracker'ом.
  fs.writeFileSync(path.join(M, 'comp-lb-missing.json'), JSON.stringify(missing));
  const total = results.reduce((s, r) => s + r.top.reduce((a, x) => a + x.usd * x.ids.length, 0), 0);
  // Обложки новых серий календаря (art/comp) — см. fetch-comp-art.js.
  try { require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'fetch-comp-art.js')], { stdio: 'inherit' }); } catch (e) { console.log('обложки: не обновились'); }
  console.log('результаты ' + YEAR + ': ' + results.length + ' окон с призами, выплачено $' + total.toLocaleString('en-US') + (missing.length ? ', без таблицы мест: ' + missing.length : ''));
})().catch(e => { console.error(e); process.exit(1); });
