// Живой лидерборд для /competitive и прогноза (26.10, его пункт 6): таблица мест окна Epic с eucompetitive, отданная
// своим адресом /api/live?ev=<eventId>&w=<windowId> — браузер их API напрямую не возьмёт (CORS), а здесь кэш на 60 с,
// так что сотня зрителей финала — один запрос к ним в минуту. Только id Epic вида epicgames_S42_… / S42_… — не
// открытый прокси. Cloudflare Pages Function: живёт в той же выкладке, что и сайт (debug отдельно от прода).
const API = 'https://eucompetitive.com/APISYSTEMV2/leaderboard.php';
const OK_EV = /^epicgames_[A-Za-z0-9_]{3,80}$/, OK_W = /^[A-Za-z0-9_]{3,80}$/;

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const ev = u.searchParams.get('ev') || '', w = u.searchParams.get('w') || '';
  if (!OK_EV.test(ev) || !OK_W.test(w)) return new Response(JSON.stringify({ error: 'bad id' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const m = w.match(/^S(\d+)/);
  const base = m && +m[1] <= 40 ? 'https://eucompetitive.com/apisystem/leaderboard.php' : API;
  let rows = [], synced = null;
  try {
    const r = await fetch(base + '?eventId=' + encodeURIComponent(ev) + '&eventWindowId=' + encodeURIComponent(w),
      { headers: { 'User-Agent': 'fncsdraft-live' }, cf: { cacheTtl: 60, cacheEverything: true } });
    if (r.ok) {
      const j = await r.json();
      synced = j.syncedAt || null;
      // до старта дня отдают посев (mode solo_grands_seeding): строки чужих окон, это не таблица дня
      rows = (j.entries || []).filter(x => x.eventWindowId === w).slice(0, 25).map(x => ({ rank: x.rank, pts: x.pointsEarned,
        n: (x.customNames && x.customNames.some(Boolean) ? x.customNames : x.teamAccountDisplayNames) || [],
        c: (x.customCountries || []).map(c => c ? String(c).toLowerCase() : null),
        g: (x.sessionHistory || []).length }));
    }
  } catch (e) {}
  return new Response(JSON.stringify({ ev, w, synced, rows }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}
