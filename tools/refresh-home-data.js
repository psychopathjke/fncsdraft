// Свежие данные главной с Liquipedia — гонять перед «деплоем» (16.10: «свежие данные при каждом деплое»).
//   node tools/refresh-home-data.js            — переписывает в index.html три константы:
//     HOME_EARN_LQ / HOME_EARN_AT — призовые игроков за год, Portal:Statistics/<год>, таблица «Money Ranking · By player»;
//     HOME_SCHED_LQ               — все «Upcoming» с Portal:Tournaments (с призовыми; капы одной недели — одна строка);
//     HOME_RECENT_LQ              — все «Most recent» оттуда же, с победителями (строка «Победил: …» в «Сцене»).
// Liquipedia просит не чаще запроса в 30 с к parse — между запросами пауза 31 с (как tools/build-year-orgs.js).
// Окна Epic с точным временем (HOME_WINDOWS, таймер) отсюда не берутся: они сняты со страниц Tracker через браузер
// (tools/measured/event-windows-eu.json); когда они кончаются, таймер считает дни до турнира по HOME_SCHED_LQ.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), F = path.join(ROOT, 'index.html');
const UA = 'fncsdraft-tools/1.0 (keegorka@gmail.com)';
const YEAR = new Date().getFullYear();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function parsePage(page) {
  const url = 'https://liquipedia.net/fortnite/api.php?action=parse&page=' + encodeURIComponent(page) + '&prop=text&format=json';
  const r = await fetch(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip'}});
  if (!r.ok) throw new Error(page + ': HTTP ' + r.status);
  const j = await r.json();
  if (!j.parse) throw new Error(page + ': ' + JSON.stringify(j).slice(0, 200));
  return j.parse.text['*'];
}
const strip = x => x.replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// ---- призовые за год --------------------------------------------------------
function earnings(t) {
  const i = t.indexOf('id="By_player"');
  if (i < 0) throw new Error('нет таблицы By_player');
  const sec = t.slice(i, t.indexOf('id="Largest', i));
  const out = [];
  sec.split('<tr').slice(2).forEach(r => {
    const rank = (r.match(/<td[^>]*>(\d+)<\/td>/) || [])[1];
    const fl = r.match(/<span class="flag"><img alt="([^"]*)" src="[^"]*\/([A-Za-z]+)_hd\.png/);
    const nm = (r.match(/<span class="name"[^>]*><a [^>]*>([^<]+)<\/a>/) || [])[1];
    const earn = (r.match(/data-align="right"[^>]*>\$([0-9,]+)/) || [])[1];
    const m = (r.match(/<td data-nowrap="">(\d+)<\/td><td data-nowrap="">(\d+)<\/td><td data-nowrap="">(\d+)<\/td>/) || []).slice(1, 4).map(Number);
    if (rank && nm && earn) out.push({n: strip(nm), c: fl ? fl[2].toLowerCase() : '', e: +earn.replace(/,/g, ''), m: m.length === 3 ? m : [0, 0, 0]});
  });
  return out;
}

// ---- турниры: Upcoming и Most recent ----------------------------------------
const MON = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const iso = (y, m, d) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
function dates(s) {
  s = s.replace(/–/g, '-');
  let m = s.match(/^(\w{3}) (\d+) - (\w{3}) (\d+), (\d{4})$/); if (m) return [iso(m[5], MON[m[1]], m[2]), iso(m[5], MON[m[3]], m[4])];
  m = s.match(/^(\w{3}) (\d+)-(\d+), (\d{4})$/); if (m) return [iso(m[4], MON[m[1]], m[2]), iso(m[4], MON[m[1]], m[3])];
  m = s.match(/^(\w{3}) (\d+), (\d{4})$/); if (m) return [iso(m[3], MON[m[1]], m[2]), iso(m[3], MON[m[1]], m[2])];
  return null;
}
const REG = {'Europe':'EU','North America Central':'NAC','North America West':'NAW','Brazil':'BR','Asia':'ASIA','Middle East':'ME','Oceania':'OCE'};
function tables(t, idRe) {
  const rows = [];
  const re = new RegExp('id="' + idRe + '(_\\d+)?"', 'g');
  let mt;
  while ((mt = re.exec(t))) {
    const i = mt.index;
    const next = t.slice(i + 20).search(/<h[23][ >]/);
    const sec = t.slice(i, next < 0 ? undefined : i + 20 + next);
    const h2 = t.lastIndexOf('<h2', i);
    const head = strip(t.slice(h2, t.indexOf('</h2>', h2)));
    sec.split('<tr class="table2&#95;&#95;row--body"').slice(1).forEach(r => {
      const td = r.split('<td').slice(1).map(c => '<td' + c);
      const k = td.findIndex(c => c.indexOf('column&#95;&#95;tournament') >= 0); if (k < 0) return;
      const place = td.filter(c => c.indexOf('column&#95;&#95;placement') >= 0);
      const names = c => [...(c || '').matchAll(/<span class="name"[^>]*>(?:<a [^>]*>)?([^<]+)/g)].map(x => strip(x[1])).filter(x => x && x !== 'TBD');
      rows.push({tier: k >= 2 ? strip(td[0] || '') : head, name: strip(td[k] || ''), date: strip(td[k + 1] || ''),
                 prize: strip(td[k + 2] || ''), loc: [...(td[k + 3] || '').matchAll(/<\/span>(?:&#160;| )([^<]+)<\/span>/g)].map(x => strip(x[1])).filter(Boolean),
                 win: names(place[0])});
    });
  }
  return rows;
}
// Капы одной недели в разных регионах — одна строка: p = [[регион, $, победитель]…].
function group(rows, needPrize) {
  const groups = {}, seen = new Set();
  rows.forEach(x => {
    if (seen.has(x.name)) return; seen.add(x.name);
    const d = dates(x.date); const prize = +String(x.prize).replace(/[$,]/g, '') || 0;
    if (!d || (needPrize && !prize)) return;
    let name = x.name.replace(/^CH\d+S\d+:\s*/, ''), reg = '';
    let m = name.match(/^(.*): ([A-Za-z ]+)$/); if (m && REG[m[2]]) { name = m[1]; reg = REG[m[2]]; }
    m = name.match(/^(FNCS \d{4} - Solos BR): (.*) - Grand Finals$/); if (m && REG[m[2]]) { name = 'FNCS Solos · Grand Finals'; reg = REG[m[2]]; }
    const key = name + '|' + d[0];
    const g = groups[key] = groups[key] || {n: name, f: d[0], t: d[1], tier: x.tier, loc: reg ? '' : x.loc.join(', '), p: []};
    g.p.push([reg, Math.round(prize)].concat(x.win.length ? [x.win.join(' & ')] : []));
  });
  return Object.values(groups).sort((a, b) => a.f < b.f ? -1 : a.f > b.f ? 1 : 0);
}

function put(s, name, value) {
  const re = new RegExp('^const ' + name + '=.*;$', 'm');
  if (!re.test(s)) throw new Error('в index.html нет строки «const ' + name + '=…;»');
  return s.replace(re, () => 'const ' + name + '=' + value + ';');
}

(async () => {
  const stat = await parsePage('Portal:Statistics/' + YEAR);
  const earn = earnings(stat);
  if (earn.length < 10) throw new Error('призовые: всего ' + earn.length + ' строк — разметка поменялась?');
  await sleep(31000);
  const tour = await parsePage('Portal:Tournaments');
  const up = group(tables(tour, 'Upcoming'), true);
  const recent = group(tables(tour, 'Most_[Rr]ecent'), true);
  let s = fs.readFileSync(F, 'utf8');
  const crlf = /\r\n/.test(s);
  s = s.replace(/\r\n/g, '\n');
  const d0 = new Date(), today = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  s = put(s, 'HOME_EARN_LQ', JSON.stringify(earn));
  s = put(s, 'HOME_EARN_AT', "'" + today + "'");
  s = put(s, 'HOME_SCHED_LQ', JSON.stringify(up));
  s = put(s, 'HOME_RECENT_LQ', JSON.stringify(recent));
  fs.writeFileSync(F, crlf ? s.replace(/\n/g, '\r\n') : s);
  console.log('призовые ' + earn.length + ' (1-й ' + earn[0].n + ' $' + earn[0].e + '), впереди ' + up.length + ', недавние ' + recent.length + ' — на ' + today);
})().catch(e => { console.error('refresh-home-data: ' + e.message); process.exit(1); });
