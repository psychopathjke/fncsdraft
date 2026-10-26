// Сторонние турниры года для /competitive (26.10, его пункт 8): все A- и B-Tier Liquipedia, кроме самих Epic (FNCS,
// Reload Elite Series, Mobile Series, кэш-капы — их места и призы уже идут от Epic). В lans.json их было пять, на
// Liquipedia за 2026 год двадцать с лишним: Jynxzi Creator Cup, Reddysh Rumble, Twitch Rivals, Coupe de France…
// Пишет tools/measured/comp-lan-list.json: [{ name, page, day, end, place, usd, tier }]; места и призы по каждому
// снимает fetch-lan-lq.js. Список тянется action=parse (лимит Liquipedia — раз в 30 с), поэтому не чаще раза в сутки.
//   node tools/fetch-lan-list.js [2026] [--force]
const fs = require('fs'), path = require('path');
const M = path.join(__dirname, 'measured');
const YEAR = (process.argv.find(a => /^\d{4}$/.test(a)) || '2026');
const OUT = path.join(M, 'comp-lan-list.json');
const UA = 'fncsdraft-competitive/1.0 (keegorka@gmail.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!process.argv.includes('--force') && fs.existsSync(OUT) && Date.now() - fs.statSync(OUT).mtimeMs < 20 * 3600e3) {
  console.log('сторонние турниры: список свежий'); process.exit(0);
}
// Свои турниры Epic: места и призы у нас из таблиц Epic, второй раз их не считать.
const EPIC = /Reload Elite Series|C\d+S\d+:|FNCS|Mobile Series|Days of Play|Ranked Cup|Victory Cup|Cash Cup/i;
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const ent = s => String(s).replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#160;/g, ' ');
// «Sep 17–18, 2026», «Jul 08–13, 2026», «Oct 28, 2026», «Jan 30 – Feb 02, 2026»; без числа («May, 2026») — нет даты.
function days(s) {
  const m = String(s).match(/^(\w{3}) (\d{1,2})(?:\s*[–-]\s*(?:(\w{3}) )?(\d{1,2}))?, (\d{4})$/);
  if (!m || !(m[1] in MON)) return null;
  const d = (mo, dd) => new Date(Date.UTC(+m[5], MON[mo], +dd)).toISOString().slice(0, 10);
  return { day: d(m[1], m[2]), end: m[4] ? d(m[3] || m[1], m[4]) : d(m[1], m[2]) };
}

(async () => {
  const out = [], seen = new Set();
  for (const [i, tier] of ['A', 'B'].entries()) {
    if (i) await sleep(31000);
    const url = 'https://liquipedia.net/fortnite/api.php?action=parse&format=json&formatversion=2&prop=text&page=' + tier + '-Tier_Tournaments/' + YEAR;
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip' } });
    const j = await r.json().catch(() => null);
    const h = j && j.parse && j.parse.text;
    if (!h) throw new Error('нет страницы ' + tier + '-Tier ' + YEAR);
    h.split('row--body').slice(1).forEach(row => {
      const a = row.match(/href="\/fortnite\/([^"]+)" title="([^"]+)"/);
      const td = row.split('<td').slice(1).map(x => ent(x.replace(/^[^>]*>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
      if (!a || td.length < 5) return;
      const name = ent(a[2]), page = decodeURIComponent(a[1]).replace(/_/g, ' ');
      if (EPIC.test(name) || seen.has(page)) return;
      const when = days(td[2]);
      if (!when) return;
      seen.add(page);
      out.push({ name, page, day: when.day, end: when.end, place: (td[4] || '').trim(), usd: +String(td[3]).replace(/[^\d.]/g, '') || 0, tier });
    });
  }
  out.sort((a, b) => a.day < b.day ? -1 : 1);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('сторонние турниры ' + YEAR + ': ' + out.length + ' (' + out.filter(x => x.usd).length + ' с призами)');
})().catch(e => { console.error(e.message || e); process.exit(1); });
