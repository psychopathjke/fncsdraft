// Сторонние ЛАНы года (не Epic: Red Bull Reshuffle, Saudi eLeague, Lost Legends, Virtuocity, Amar x Rohat) для
// /competitive (26.10, его «добавляй»): места и призы — с Liquipedia (страница из tools/measured/lans.json, поле page).
// Слоты Prize Pool идут по местам: usdprize — доллары, localprize — местная валюта (пересчёт по курсу из lans.json:
// pay[0] в долларах / приз первого места). Приз команды делится на игроков (Epic платит на игрока, Liquipedia — на команду).
// Liquipedia: gzip обязателен, User-Agent с контактом, пауза между запросами (жёсткие лимиты, см. память).
//
// С 26.10 (его пункт 8) к lans.json добавлен весь список A/B-Tier года (comp-lan-list.json, fetch-lan-list.js):
// у таких турниров курса в lans.json нет — курс из призового фонда списка (доллары) / сумму слотов в местной валюте.
// Прошедшие давно не перекачиваются: страница тянется, если её нет в кеше или турнир был за последние три недели.
// Будущий турнир лежит без мест — только днём в календаре.
//   node tools/fetch-lan-lq.js [2026]   → tools/measured/comp-lan-lq.json
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const YEAR = process.argv[2] || '2026';
const LANS = JSON.parse(fs.readFileSync(path.join(M, 'lans.json'), 'utf8')).filter(l => String(l.day).startsWith(YEAR));
const LIST = fs.existsSync(path.join(M, 'comp-lan-list.json')) ? JSON.parse(fs.readFileSync(path.join(M, 'comp-lan-list.json'), 'utf8')) : [];
const OUT = path.join(M, 'comp-lan-lq.json');
const OLD = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const UA = 'fncsdraft-competitive/1.0 (keegorka@gmail.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

function slots(text) {
  // TeamPrizePool — клубы, а не игроки (Saudi eLeague): призов на игрока нет, пропуск.
  if (/\{\{TeamPrizePool/i.test(text)) return [];
  const i = text.search(/\{\{(Solo|Duo|Trio|Squad|Quad)?PrizePool/i);
  if (i < 0) return [];
  const body = text.slice(i, text.indexOf('adjacentContent', i) > 0 ? text.indexOf('adjacentContent', i) : undefined);
  // Слот — одно место или общий диапазон («place=5-8» и четыре соперника): приз в слоте — на КАЖДОГО соперника, делится
  // только внутри его команды. Соперник — {{Opponent}}, {{SoloOpponent}}, {{2Opponent}}…; флаг — p1flag (страна игрока).
  const FLAG = { uk: 'gb', england: 'gb', scotland: 'gb', wales: 'gb', usa: 'us' };
  const out = [];
  let at = 1;
  body.split('{{Slot|').slice(1).forEach(s => {
    const num = re => { const m = s.match(re); return m ? +String(m[1]).replace(/,/g, '') : null; };
    const opps = (s.match(/\{\{(?:Solo|Duo|Trio|Squad|Team|\d)?Opponent\|[^}]*\}\}/g) || []).map(o => {
      const kv = {}, bare = [];
      o.replace(/^\{\{\w*Opponent\|/, '').replace(/\}\}$/, '').split('|').forEach(p => { const m = p.match(/^(\w+)=(.*)$/); if (m) kv[m[1]] = m[2].trim(); else if (p.trim()) bare.push(p.trim()); });
      const names = [], flags = [];
      for (let i = 1; i <= 4; i++) if (kv['p' + i]) { names.push(kv['p' + i]); const f = String(kv['p' + i + 'flag'] || '').toLowerCase(); flags.push(FLAG[f] || (/^[a-z]{2}$/.test(f) ? f : null)); }
      bare.forEach(n => { names.push(n); flags.push(null); });
      return { names, flags };
    }).filter(o => o.names.length);
    const pm = s.match(/place=(\d+)/);
    const place = pm ? +pm[1] : at;
    at = place + Math.max(1, opps.length);
    opps.forEach(o => out.push({ place, usd: num(/usdprize=([\d,.]+)/), local: num(/localprize\d?=([\d,.]+)/), names: o.names, flags: o.flags }));
  });
  return out;
}

(async () => {
  const out = {};
  const todo = LANS.map(l => ({ ...l, src: 'lans' }));
  LIST.forEach(l => { if (!todo.some(t => t.page === l.page)) todo.push({ name: l.name, day: l.day, end: l.end, city: l.place, page: l.page, usd: l.usd, src: 'list' }); });
  let got = 0;
  for (const l of todo) {
    const old = OLD[l.page];
    const fresh = old && old.top && old.top.length && Date.parse(l.end || l.day) < Date.now() - 21 * 86400e3;
    if (l.day > today || fresh) { out[l.page] = { ...(old || {}), name: l.name, day: l.day, end: l.end || l.day, city: l.city, top: l.day > today ? [] : old.top }; continue; }
    if (got++) await sleep(6000);
    const url = 'https://liquipedia.net/fortnite/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(l.page);
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } }).catch(() => null);
    const j = r && await r.json().catch(() => null);
    const text = j && j.query && j.query.pages[0] && j.query.pages[0].revisions && j.query.pages[0].revisions[0].slots.main.content;
    if (!text) { console.log('нет страницы: ' + l.page); if (old) out[l.page] = old; continue; }
    const S = slots(text);
    const firstLocal = S.find(s => s.local);
    const localSum = S.reduce((a, s) => a + (s.usd == null ? s.local || 0 : 0), 0);
    const rate = l.pay && l.pay[0] && firstLocal ? l.pay[0][1] / firstLocal.local
      : l.usd && localSum ? Math.max(0, l.usd - S.reduce((a, s) => a + (s.usd || 0), 0)) / localSum : 1;
    out[l.page] = { name: l.name, day: l.day, end: l.end || l.day, city: l.city, top: S.map(s => ({ rank: s.place, names: s.names,
      c: s.flags, usd: Math.round(((s.usd != null ? s.usd : (s.local || 0) * rate)) / Math.max(1, s.names.length)) })) };
    console.log(l.name + ': ' + S.length + ' мест, 1-е ' + (S[0] ? S[0].names.join('+') : '?') + ' $' + (out[l.page].top[0] && out[l.page].top[0].usd) + ' на игрока');
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
})().catch(e => { console.error(e); process.exit(1); });
