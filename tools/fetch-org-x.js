// Гербы клубов из X (его слово 8.10: «в 2019 до сих пор нет аватарок у орг — посмотри в интернете или в твиттере»).
// Для клуба без файла в logos/: 1) хэндл из карточки команды на Liquipedia (|twitter=), 2) если страницы нет —
// хэндл из имени (без пробелов, с/без «Esports/Gaming»), но только при строгом совпадении: имя аккаунта совпадает с
// названием клуба, а в описании есть esport/gaming/fortnite/clan/team. Аватар 400×400 — api.fxtwitter.com, файл —
// logos/<clubLogoFile(имя)>. Liquipedia — не чаще раза в 2,5 с, кэш %TEMP%/liqui-orgx.json; X — пауза 0,6 с.
//   node tools/fetch-org-x.js <names.json>   — {имя: {...}} или список имён
//   node tools/fetch-org-logos.js --crests  — потом дописать новые файлы в CAREER_CRESTS
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..'), LOGOS = path.join(ROOT, 'logos');
const CACHE = path.join(os.tmpdir(), 'liqui-orgx.json');
const UA = { 'User-Agent': 'fncsdraft.com club logos (keegorka@gmail.com)', 'Accept-Encoding': 'gzip' };
const API = 'https://liquipedia.net/fortnite/api.php';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = org => String(org).replace(/[^A-Za-z0-9.\-]+/g, '_').replace(/^_+|_+$/g, '');
const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const core = s => norm(String(s).replace(/\b(e-?sports?|gaming|clan|team|club|gg|org)\b/ig, '')) || norm(s);
const get = (u, bin) => new Promise(res => https.get(u, { headers: UA }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return get(new URL(r.headers.location, u).href, bin).then(res);
  const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => { let b = Buffer.concat(ch); if (/gzip/.test(r.headers['content-encoding'] || '')) { try { b = zlib.gunzipSync(b); } catch (e) {} } res({ code: r.statusCode, type: r.headers['content-type'] || '', body: bin ? b : b.toString() }); });
}).on('error', () => res({ code: 0, body: bin ? Buffer.alloc(0) : '' })));
let lastApi = 0;
async function api(params) {
  const wait = 2500 - (Date.now() - lastApi); if (wait > 0) await sleep(wait);
  lastApi = Date.now();
  const r = await get(API + '?format=json&' + params);
  if (r.code === 429) { console.log('429 — пауза 60 с'); await sleep(60000); return api(params); }
  try { return JSON.parse(r.body); } catch (e) { return {}; }
}
async function xUser(h) {
  await sleep(600);
  const r = await get('https://api.fxtwitter.com/' + encodeURIComponent(h));
  try { const j = JSON.parse(r.body); return j && j.user ? j.user : null; } catch (e) { return null; }
}
(async () => {
  const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const names = (Array.isArray(src) ? src : Object.keys(src)).filter(n => slug(n) && !fs.existsSync(path.join(LOGOS, slug(n) + '.png')));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { tw: {} };
  const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));
  console.log('клубов без герба:', names.length);
  // 1. хэндл из карточки Liquipedia
  const todo = names.filter(n => !(n in cache.tw));
  for (let i = 0; i < todo.length; i += 50) {
    const part = todo.slice(i, i + 50);
    const base = 'action=query&redirects=1&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(part.join('|'));
    let j = await api(base); const q = j.query || {}; q.pages = q.pages || {};
    for (let k = 0; k < 20 && j.continue && j.continue.rvcontinue; k++) {
      j = await api(base + '&rvcontinue=' + encodeURIComponent(j.continue.rvcontinue));
      Object.entries((j.query || {}).pages || {}).forEach(([id, p]) => { if (p.revisions) q.pages[id] = p; });
    }
    const back = {}; part.forEach(n => back[n] = n);
    (q.normalized || []).forEach(x => { back[x.to] = back[x.from] || x.from; });
    (q.redirects || []).forEach(x => { back[x.to] = back[x.from] || x.from; });
    part.forEach(n => cache.tw[n] = null);
    Object.values(q.pages).forEach(p => {
      const n = back[p.title]; if (!n) return;
      const txt = (((p.revisions || [])[0] || {}).slots || {}).main;
      const t = txt && (txt['*'] || txt.content) || '';
      const m = t.match(/\|\s*twitter\s*=\s*([^\n|}]+)/i);
      const h = m && m[1].trim().replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, '');
      cache.tw[n] = h ? { h, wiki: 1 } : { page: 1 };
    });
    save(); console.log('Liquipedia', Math.min(i + 50, todo.length) + '/' + todo.length);
  }
  // 2. аватары
  let got = 0, miss = [];
  for (const n of names) {
    const c = cache.tw[n] || {};
    let u = null;
    if (c.h) u = await xUser(c.h);
    if (!u && !c.wiki) {
      // без хэндла с вики — угадываем, но берём только при точном совпадении имени и «киберспортивном» описании
      const raw = String(n).replace(/[^A-Za-z0-9 ]/g, '');
      const cands = [...new Set([raw.replace(/ /g, ''), core(n), raw.replace(/ /g, '_'), core(n) + 'gg', core(n) + 'esports'])].filter(x => x && x.length >= 3 && x.length <= 15);
      for (const h of cands) {
        const v = await xUser(h); if (!v) continue;
        const nameOk = norm(v.name) === norm(n) || core(v.name) === core(n) || norm(v.name).startsWith(core(n)) && core(n).length >= 4;
        const descOk = /e-?sport|gaming|fortnite|clan|team|org|competitive/i.test((v.description || '') + ' ' + (v.name || ''));
        if (nameOk && descOk) { u = v; c.guess = h; break; }
      }
    }
    if (!u || !u.avatar_url || /default_profile/.test(u.avatar_url)) { miss.push(n); continue; }
    const img = await get(u.avatar_url.replace(/_normal\./, '_400x400.'), true);
    if (img.code !== 200 || img.body.length < 800 || !/image/.test(img.type)) { miss.push(n); continue; }
    fs.writeFileSync(path.join(LOGOS, slug(n) + '.png'), img.body);
    got++; console.log('+', n, '←', '@' + u.screen_name, c.guess ? '(угадан)' : '');
  }
  save();
  console.log('новых гербов:', got, '| не найдено:', miss.length);
  fs.writeFileSync(path.join(os.tmpdir(), 'org-x-miss.json'), JSON.stringify(miss, null, 1));
})();
