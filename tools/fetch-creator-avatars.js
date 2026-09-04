// Аватарки контент-мейкеров — с самого Twitch, а не нарисованные.
//
// Его правка 4 сентября: «аватарки контент креаторов». Твич уже отдал этому
// моду ники и число фолловеров (см. CC_PROAM_TWITCH), тем же публичным GraphQL
// отдаёт и картинку канала: user.profileImageURL(width:150).
//
// Что делает: читает CC_PROAM_TWITCH прямо из index.html (один источник имён и
// логинов — второй список разошёлся бы с первым), спрашивает Twitch пачками,
// качает картинки в photos/creators/ и печатает готовую карту для index.html.
//
//   node tools/fetch-creator-avatars.js          — скачать и напечатать карту
//   node tools/fetch-creator-avatars.js --dry    — только спросить Twitch
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'photos', 'creators');
const DRY = process.argv.indexOf('--dry') >= 0;
const CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';   // публичный веб-клиент Twitch

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const from = src.indexOf('const CC_PROAM_TWITCH={');
if (from < 0) throw new Error('CC_PROAM_TWITCH is gone from index.html');
const to = src.indexOf('\n};', from);
const block = src.slice(from, to);
// 'Имя':['login',12345] — комментарии внутри блока этим не ловятся и не мешают.
const pairs = [];
const re = /'([^']+)'\s*:\s*\[\s*'([^']+)'/g;
let m;
while ((m = re.exec(block))) pairs.push({ name: m[1], login: m[2] });
if (!pairs.length) throw new Error('no logins parsed');
console.log('creators with a twitch channel: ' + pairs.length);

const gql = body => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const req = https.request({
    host: 'gql.twitch.tv', path: '/gql', method: 'POST',
    headers: { 'Client-Id': CLIENT, 'Content-Type': 'application/json',
               'Content-Length': Buffer.byteLength(data) }
  }, r => {
    let out = '';
    r.on('data', c => out += c);
    r.on('end', () => { try { res(JSON.parse(out)); } catch (e) { rej(new Error(out.slice(0, 200))); } });
  });
  req.on('error', rej);
  req.write(data); req.end();
});

const download = (url, file) => new Promise((res, rej) => {
  https.get(url, r => {
    if (r.statusCode !== 200) { r.resume(); return rej(new Error(url + ' -> ' + r.statusCode)); }
    const chunks = [];
    r.on('data', c => chunks.push(c));
    r.on('end', () => { fs.writeFileSync(file, Buffer.concat(chunks)); res(chunks.reduce((n, c) => n + c.length, 0)); });
  }).on('error', rej);
});

(async () => {
  if (!DRY) fs.mkdirSync(OUT, { recursive: true });
  const map = {}, missing = [];
  let bytes = 0;
  for (let i = 0; i < pairs.length; i += 20) {
    const chunk = pairs.slice(i, i + 20);
    const q = '{users(logins:[' + chunk.map(p => JSON.stringify(p.login)).join(',') +
              ']){login profileImageURL(width:150)}}';
    const r = await gql({ query: q });
    const users = (r.data && r.data.users) || [];
    for (const p of chunk) {
      const u = users.find(x => x && x.login && x.login.toLowerCase() === p.login.toLowerCase());
      const url = u && u.profileImageURL;
      // Дефолтная картинка Twitch — это отсутствие аватарки, а не аватарка.
      if (!url || url.indexOf('user-default-pictures') >= 0) { missing.push(p.name); continue; }
      const ext = (url.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i) || [null, 'png'])[1].toLowerCase();
      const file = p.login.replace(/[^a-z0-9_.-]/gi, '') + '.' + ext;
      if (!DRY) bytes += await download(url, path.join(OUT, file));
      map[p.name] = file;
    }
  }
  const names = Object.keys(map);
  console.log('avatars: ' + names.length + (DRY ? ' (dry run, nothing written)' :
    ', ' + Math.round(bytes / 1024) + ' KB into photos/creators/'));
  if (missing.length) console.log('no picture on twitch: ' + missing.join(', '));
  // Карта для index.html — по строке на четверых, как и остальные таблицы там.
  const rows = [];
  for (let i = 0; i < names.length; i += 3)
    rows.push('  ' + names.slice(i, i + 3).map(n => "'" + n + "':'" + map[n] + "'").join(', ') + ',');
  fs.writeFileSync(path.join(ROOT, 'tools', 'creator-avatars.txt'),
                   'const CC_PROAM_AVA={\n' + rows.join('\n').replace(/,$/, '') + '\n};\n');
  console.log('map written to tools/creator-avatars.txt');
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
