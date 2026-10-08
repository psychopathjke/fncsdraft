// Гербы клубов с Liquipedia (его слово 8.10: «не у всех орг есть логотипы, особенно в 2019»).
// Вход — JSON {имя клуба: {...}} или список имён; для каждого клуба без файла в logos/ берётся логотип из карточки
// команды на liquipedia.net/fortnite (|imagedark= — для тёмного фона, иначе |image=), миниатюра 128 px сохраняется как
// logos/<clubLogoFile(имя)>. API — не чаще раза в 2,5 с (правила Liquipedia), картинки — с паузой 0,3 с. Кэш ответов —
// %TEMP%/liqui-logos.json, повторный запуск не ходит за уже найденным.
//   node tools/fetch-org-logos.js <names.json>
// Потом: node tools/fetch-org-logos.js --crests — дописывает новые файлы в CAREER_CRESTS в index.html.
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..'), LOGOS = path.join(ROOT, 'logos');
const CACHE = path.join(os.tmpdir(), 'liqui-logos.json');
const UA = { 'User-Agent': 'fncsdraft.com club logos (keegorka@gmail.com)', 'Accept-Encoding': 'gzip' }   // Liquipedia без gzip отвечает 406;
const API = 'https://liquipedia.net/fortnite/api.php';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = org => String(org).replace(/[^A-Za-z0-9.\-]+/g, '_').replace(/^_+|_+$/g, '');
const get = (u, bin) => new Promise(res => https.get(u, { headers: UA }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return get(new URL(r.headers.location, u).href, bin).then(res);
  const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => { let b = Buffer.concat(ch); if (/gzip/.test(r.headers['content-encoding'] || '')) { try { b = zlib.gunzipSync(b); } catch (e) {} } res({ code: r.statusCode, body: bin ? b : b.toString() }); });
}).on('error', e => res({ code: 0, body: bin ? Buffer.alloc(0) : '' })));
let lastApi = 0;
async function api(params) {
  const wait = 2500 - (Date.now() - lastApi); if (wait > 0) await sleep(wait);
  lastApi = Date.now();
  const r = await get(API + '?format=json&' + params);
  if (r.code === 429) { console.log('429 — пауза 60 с'); await sleep(60000); return api(params); }
  try { return JSON.parse(r.body); } catch (e) { return {}; }
}
function crests() {
  const F = path.join(ROOT, 'index.html'); let s = fs.readFileSync(F, 'utf8');
  const i = s.indexOf('const CAREER_CRESTS=new Set(['), j = s.indexOf(']);', i);
  const have = new Set((s.slice(i, j).match(/'[^']+'/g) || []).map(x => x.slice(1, -1)));
  const files = fs.readdirSync(LOGOS).filter(f => /\.(png|jpg|webp)$/i.test(f) && !have.has(f));
  if (!files.length) { console.log('CAREER_CRESTS: нового нет'); return; }
  s = s.slice(0, j) + ",\n  " + files.map(f => "'" + f.replace(/'/g, "\\'") + "'").join(',') + s.slice(j);
  fs.writeFileSync(F, s); console.log('CAREER_CRESTS: +' + files.length);
}
(async () => {
  if (process.argv[2] === '--crests') return crests();
  const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  // Псевдонимы ({вариант: наше название}, значения — строки): страница ищется под вариантом, файл — под нашим именем.
  const alias = (!Array.isArray(src) && Object.values(src).every(v => typeof v === 'string')) ? src : null;
  const own = n => alias ? alias[n] : n;
  const names = (Array.isArray(src) ? src : Object.keys(src)).filter(n => slug(own(n)) && !fs.existsSync(path.join(LOGOS, slug(own(n)) + '.png')));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { file: {}, url: {} };
  console.log('клубов без герба:', names.length);
  // 1. имя файла логотипа из карточки
  const todo = names.filter(n => !(n in cache.file));
  for (let i = 0; i < todo.length; i += 50) {
    const part = todo.slice(i, i + 50);
    // Текст 50 страниц сразу не влезает в один ответ — API просит продолжение (rvcontinue); без него у половины пачки
    // «нет логотипа», хотя он есть (Lazarus, 8.10).
    const base = 'action=query&redirects=1&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(part.join('|'));
    let j = await api(base); const q = j.query || {}; q.pages = q.pages || {};
    for (let k = 0; k < 20 && j.continue && j.continue.rvcontinue; k++) {
      j = await api(base + '&rvcontinue=' + encodeURIComponent(j.continue.rvcontinue));
      Object.entries((j.query || {}).pages || {}).forEach(([id, p]) => { if (p.revisions) q.pages[id] = p; });
    }
    const back = {};
    part.forEach(n => back[n] = n);
    (q.normalized || []).forEach(x => { back[x.to] = back[x.from] || x.from; });
    (q.redirects || []).forEach(x => { back[x.to] = back[x.from] || x.from; });
    part.forEach(n => cache.file[n] = null);
    Object.values(q.pages || {}).forEach(p => {
      const name = back[p.title]; if (!name) return;
      const c = (((p.revisions || [])[0] || {}).slots || {}).main || {}; const t = c['*'] || '';
      const dark = (t.match(/\|\s*imagedark\s*=\s*([^\n|}]+)/) || [])[1], light = (t.match(/\|\s*image\s*=\s*([^\n|}]+)/) || [])[1];
      const f = (dark || light || '').trim(); cache.file[name] = f || null;
    });
    fs.writeFileSync(CACHE, JSON.stringify(cache));
    console.log('карточки', Math.min(i + 50, todo.length) + '/' + todo.length);
  }
  // 2. ссылка на миниатюру
  const files = [...new Set(names.map(n => cache.file[n]).filter(f => f && !(f in cache.url)))];
  for (let i = 0; i < files.length; i += 50) {
    const part = files.slice(i, i + 50);
    const j = await api('action=query&prop=imageinfo&iiprop=url&iiurlwidth=128&titles=' + encodeURIComponent(part.map(f => 'File:' + f).join('|')));
    const q = j.query || {}, back = {};
    part.forEach(f => { back['File:' + f] = f; cache.url[f] = null; });
    (q.normalized || []).forEach(x => { back[x.to] = back[x.from]; });
    Object.values(q.pages || {}).forEach(p => { const f = back[p.title]; const ii = (p.imageinfo || [])[0]; if (f && ii) cache.url[f] = ii.thumburl || ii.url; });
    fs.writeFileSync(CACHE, JSON.stringify(cache));
    console.log('файлы', Math.min(i + 50, files.length) + '/' + files.length);
  }
  // 3. скачивание
  let ok = 0, miss = 0;
  for (const n of names) {
    const u = cache.url[cache.file[n]]; if (!u) { miss++; continue; }
    const out = path.join(LOGOS, slug(own(n)) + '.png'); if (fs.existsSync(out)) continue;
    const r = await get(u, true);
    if (r.code === 200 && r.body.length > 200) { fs.writeFileSync(out, r.body); ok++; } else miss++;
    await sleep(300);
  }
  console.log('скачано', ok, 'без логотипа', miss);
})();
