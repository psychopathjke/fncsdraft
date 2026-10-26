// Трансферы для новостей /competitive (26.10, его пункт 6: «настоящих новостей нет»). Liquipedia ведёт помесячные
// страницы «Player Transfers/2026/October»: {{Transfer Row|date=|name=|flag=|name2=…|team1=|team2=|role1=|role2=|ref={{TRef|url=}}}}.
// Берутся текущий и прошлый месяц (два запроса action=query, это дёшево). Пишет tools/measured/comp-transfers.json.
//   node tools/fetch-transfers.js
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const UA = 'fncsdraft-competitive/1.0 (keegorka@gmail.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FLAG = { uk: 'gb', england: 'gb', scotland: 'gb', wales: 'gb', usa: 'us', aus: 'au' };

function rows(text) {
  const out = [];
  (text.match(/\{\{Transfer Row\|.*\}\}\s*$/gm) || []).forEach(line => {
    const ref = (line.match(/\{\{TRef\|url=([^}|\s]+)/) || [])[1] || '';
    const kv = {};
    line.replace(/\{\{TRef\|[^}]*\}\}/g, '').replace(/^\{\{Transfer Row\|/, '').replace(/\}\}\s*$/, '').split('|').forEach(p => {
      const m = p.match(/^\s*(\w+)\s*=(.*)$/); if (m) kv[m[1]] = m[2].trim();
    });
    if (!kv.date || !kv.name) return;
    const who = [];
    for (let i = 1; i <= 6; i++) {
      const n = kv[i === 1 ? 'name' : 'name' + i];
      if (!n) continue;
      const f = String(kv[i === 1 ? 'flag' : 'flag' + i] || '').toLowerCase();
      who.push([n, FLAG[f] || (/^[a-z]{2}$/.test(f) ? f : '')]);
    }
    if (!who.length || (!kv.team1 && !kv.team2)) return;
    out.push({ d: kv.date, who, from: kv.team1 || '', to: kv.team2 || '', r1: kv.role1 || '', r2: kv.role2 || '', ref: /^https?:\/\//.test(ref) ? ref : '' });
  });
  return out;
}

(async () => {
  const now = new Date(), pages = [];
  for (let k = 0; k < 2; k++) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1)); pages.push('Player Transfers/' + d.getUTCFullYear() + '/' + MONTHS[d.getUTCMonth()]); }
  let all = [];
  for (const [i, p] of pages.entries()) {
    if (i) await sleep(3000);
    const url = 'https://liquipedia.net/fortnite/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(p);
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } });
    const j = await r.json().catch(() => null);
    const pg = j && j.query && j.query.pages[0];
    const text = pg && pg.revisions && pg.revisions[0].slots.main.content;
    if (!text) { console.log('трансферы: нет страницы ' + p); continue; }
    all = all.concat(rows(text));
  }
  if (!all.length) throw new Error('трансферов нет');
  all.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  fs.writeFileSync(path.join(M, 'comp-transfers.json'), JSON.stringify({ fetched: now.toISOString(), rows: all }));
  console.log('трансферы: ' + all.length + ' (' + pages.join(', ') + ')');
})().catch(e => { console.error(e.message || e); process.exit(1); });
