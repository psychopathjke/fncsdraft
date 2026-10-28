// Подписчики X и YouTube про ПО ГОДАМ 2019–2025 — из снимков Wayback Machine (web.archive.org), для карьеры прошлых лет
// (28.10, его «можно сделать другим годам всю статистику по соцсетям, но чтоб цифры были именно тех годов»).
// Аккаунты — те же, что в анкете Liquipedia (fetch-liqui-socials.js), то есть ровно тот профиль, чьи числа 2026 года уже
// в CC_PRO_SOCIAL. На каждый год берётся снимок, ближайший к середине февраля (старт сезона карьеры); не разобрался —
// следующий ближайший того же года. Разбор:
//   X       — старая вёрстка профиля: «ProfileNav-item--followers … data-count=N» (страницы на JS с 2021 года — без чисел);
//   YouTube — «"subscriberCountText" … "N subscribers"» (английская вёрстка; локализованные снимки пропускаются);
//   Twitch  — страница SocialBlade socialblade.com/twitch/user/<логин> (29.10): в шапке «N followers»; у twitch.tv в снимках
//             чисел нет. Снимки SocialBlade бывают в gzip — распаковываются.
// Четвёртый аргумент — какие сети снимать через запятую (x,yt,tw); по умолчанию x,yt.
// Один запрос в 1,3 с, на 429 — пауза. Третий аргумент — прошлый выход: уже снятые ники не повторяются.
//   node tools/fetch-wayback-socials.js <socials.tsv> <out.tsv> [прошлый-out.tsv]   → ник<TAB>сеть<TAB>год<TAB>число<TAB>снимок
'use strict';
const fs = require('fs'), https = require('https'), zlib = require('zlib');
const NETS = (process.argv[5] || 'x,yt').split(',');
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const have = process.argv[4] && fs.existsSync(process.argv[4]) ? fs.readFileSync(process.argv[4], 'utf8').split(/\r?\n/).filter(Boolean) : [];
const done = new Set(have.map(l => l.split('\t')[0] + '|' + l.split('\t')[1]));
// Отмечается и «пусто»: строка с числом -1, чтобы при перезапуске не ходить снова.
const rows = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const get = url => new Promise((res, rej) => {
  const req = https.get(url, { headers: { 'User-Agent': 'fncsdraft.com stats (contact: keegorka@gmail.com)' }, timeout: 60000 }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400) { r.resume(); return res({ code: r.statusCode, body: '' }); }
    const bufs = []; let n = 0, done = false;
    const fin = () => { if (done) return; done = true; let b = Buffer.concat(bufs); if (b[0] === 0x1f && b[1] === 0x8b) { try { b = zlib.gunzipSync(b); } catch (e) { try { b = zlib.unzipSync(b, { finishFlush: zlib.constants.Z_SYNC_FLUSH }); } catch (e2) {} } } res({ code: r.statusCode, body: b.toString('utf8') }); };
    r.on('data', c => { bufs.push(c); n += c.length; if (n > 3e6) r.destroy(); }); r.on('end', fin); r.on('close', fin);
  });
  req.on('timeout', () => req.destroy(new Error('timeout'))); req.on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchOk(url){
  for (let k = 0; k < 3; k++) {
    let r; try { r = await get(url); } catch (e) { await sleep(5000); continue; }
    await sleep(1300);
    if (r.code === 429) { console.log('  429, пауза'); await sleep(60000); continue; }
    return r;
  }
  return { code: 0, body: '' };
}
const num = t => { const m = /^([\d.,]+)\s*([KMB]?)$/i.exec(String(t).trim()); if (!m) return null; const v = parseFloat(m[1].replace(/,/g, '')); return Math.round(v * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()] || 1)); };
const PARSE = {
  x: html => { const m = /ProfileNav-item--followers[\s\S]{0,800}?data-count=(\d+)/.exec(html); return m ? +m[1] : null; },
  tw: html => { const m = /([\d,]{1,13})\s+followers/i.exec(html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')); return m ? +m[1].replace(/,/g, '') : null; },
  yt: html => { const m = /"subscriberCountText":\{[\s\S]{0,300}?"(?:label|simpleText)":"([\d.,]+[KMB]?) subscribers"/.exec(html) || /yt-subscription-button-subscriber-count[^>]*title="([\d.,]+[KMB]?)"/.exec(html); return m ? num(m[1]) : null; }
};
const URL_OF = { x: h => 'twitter.com/' + h, yt: p => 'www.youtube.com/' + p, tw: l => 'socialblade.com/twitch/user/' + String(l).toLowerCase() };
const out = have.slice();
const flush = () => fs.writeFileSync(process.argv[3], out.join('\n'));
(async () => {
  let n = 0;
  for (const t of rows) {
    for (const [net, acc] of [['x', t[3]], ['yt', t[2]], ['tw', t[1]]]) {
      if (!acc || !NETS.includes(net) || done.has(t[0] + '|' + net)) continue;
      const cdx = await fetchOk('https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(URL_OF[net](acc)) + '&output=txt&from=2019&to=2025&filter=statuscode:200&collapse=timestamp:6&fl=timestamp');
      const ts = (cdx.body || '').split(/\s+/).filter(s => /^\d{14}$/.test(s));
      let got = 0;
      for (const y of YEARS) {
        const aim = Date.UTC(y, 1, 15);
        const cand = ts.filter(s => +s.slice(0, 4) === y)
          .sort((a, b) => Math.abs(Date.UTC(+a.slice(0, 4), +a.slice(4, 6) - 1, 15) - aim) - Math.abs(Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, 15) - aim)).slice(0, 2);
        for (const s of cand) {
          const r = await fetchOk('https://web.archive.org/web/' + s + 'id_/https://' + URL_OF[net](acc));
          const v = r.body ? PARSE[net](r.body) : null;
          if (v != null && v >= 0) { out.push([t[0], net, y, v, s].join('\t')); got++; break; }
        }
      }
      if (!got) out.push([t[0], net, 0, -1, ''].join('\t'));
      if (++n % 10 === 0) { flush(); console.log('  ' + n + ' аккаунтов, точек ' + out.filter(l => !/\t-1\t/.test(l)).length); }
    }
  }
  flush();
  console.log('wayback points', out.filter(l => !/\t-1\t/.test(l)).length);
})();
