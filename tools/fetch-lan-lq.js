// Сторонние ЛАНы года (не Epic: Red Bull Reshuffle, Saudi eLeague, Lost Legends, Virtuocity, Amar x Rohat) для
// /competitive (26.10, его «добавляй»): места и призы — с Liquipedia (страница из tools/measured/lans.json, поле page).
// Слоты Prize Pool идут по местам: usdprize — доллары, localprize — местная валюта (пересчёт по курсу из lans.json:
// pay[0] в долларах / приз первого места). Приз команды делится на игроков (Epic платит на игрока, Liquipedia — на команду).
// Liquipedia: gzip обязателен, User-Agent с контактом, пауза между запросами (жёсткие лимиты, см. память).
//   node tools/fetch-lan-lq.js [2026]   → tools/measured/comp-lan-lq.json
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const YEAR = process.argv[2] || '2026';
const LANS = JSON.parse(fs.readFileSync(path.join(M, 'lans.json'), 'utf8')).filter(l => String(l.day).startsWith(YEAR));
const UA = 'fncsdraft-competitive/1.0 (keegorka@gmail.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function slots(text) {
  // TeamPrizePool — клубы, а не игроки (Saudi eLeague): призов на игрока нет, пропуск.
  if (/\{\{TeamPrizePool/i.test(text)) return [];
  const i = text.search(/\{\{(Solo|Duo|Trio|Squad|Quad)?PrizePool/i);
  if (i < 0) return [];
  const body = text.slice(i, text.indexOf('adjacentContent', i) > 0 ? text.indexOf('adjacentContent', i) : undefined);
  return body.split('{{Slot|').slice(1).map((s, k) => {
    const num = re => { const m = s.match(re); return m ? +String(m[1]).replace(/,/g, '') : null; };
    const names = [];
    const op = s.match(/\{\{(\d?)Opponent\|([^}]*)\}\}/g) || [];
    op.forEach(o => {
      const parts = o.replace(/^\{\{\d?Opponent\|/, '').replace(/\}\}$/, '').split('|');
      parts.forEach(p => { const m = p.match(/^p\d=(.+)$/); if (m) names.push(m[1].trim()); else if (!/=/.test(p) && p.trim()) names.push(p.trim()); });
    });
    return { place: num(/place=(\d+)/) || k + 1, usd: num(/usdprize=([\d,.]+)/), local: num(/localprize=([\d,.]+)/), names };
  }).filter(s => s.names.length);
}

(async () => {
  const out = {};
  for (const l of LANS) {
    const url = 'https://liquipedia.net/fortnite/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(l.page);
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } });
    const j = await r.json().catch(() => null);
    const text = j && j.query && j.query.pages[0] && j.query.pages[0].revisions && j.query.pages[0].revisions[0].slots.main.content;
    if (!text) { console.log('нет страницы: ' + l.page); await sleep(6000); continue; }
    const S = slots(text);
    const firstLocal = S.find(s => s.local);
    const rate = firstLocal && l.pay && l.pay[0] ? l.pay[0][1] / firstLocal.local : 1;
    out[l.page] = { name: l.name, day: l.day, city: l.city, top: S.map(s => ({ rank: s.place, names: s.names,
      usd: Math.round(((s.usd != null ? s.usd : (s.local || 0) * rate)) / Math.max(1, s.names.length)) })) };
    console.log(l.name + ': ' + S.length + ' мест, 1-е ' + (S[0] ? S[0].names.join('+') : '?') + ' $' + (out[l.page].top[0] && out[l.page].top[0].usd) + ' на игрока');
    await sleep(6000);
  }
  fs.writeFileSync(path.join(M, 'comp-lan-lq.json'), JSON.stringify(out));
})().catch(e => { console.error(e); process.exit(1); });
