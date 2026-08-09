// Downloads item art for a 2025 loot pool into items/ and prints the
// name -> path map to paste into index.html.
//
//   node tools/fetch-2025-art.js t2
//
// fetch-chapter6-art.js pins a CDN hash path per item because the wiki's own
// spelling differs from the pool's in places. That does not scale to two more
// seasons, so this asks the wiki to resolve the name instead: Special:FilePath
// redirects to whatever file currently backs a title, and a handful of naming
// conventions covers almost everything. Items that resolve to nothing are
// listed and simply keep the built-in silhouette, which is the existing
// behaviour for art-less loot.
const fs = require('fs'), path = require('path'), https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'items');
const SET = process.argv[2];
if (!/^t[23]$/.test(SET || '')) throw new Error('pass t2 or t3');

// Names come from the pools in index.html rather than a second copy here, so the
// two can never drift apart.
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function poolNames(constName) {
  const at = html.indexOf('const ' + constName + '=[');
  if (at < 0) throw new Error(constName + ' not found');
  // Whichever terminator comes first. The weapon lists end "\n];" and the
  // consumable lists end "\n].map(...)"; searching for only one of them runs
  // past the block and swallows a neighbouring pool's names.
  const ends = ['\n];', '\n].map'].map(t => html.indexOf(t, at)).filter(i => i > 0);
  if (!ends.length) throw new Error(constName + ' has no terminator');
  const body = html.slice(at, Math.min.apply(null, ends));
  return [...body.matchAll(/(?:\["|name:")([^"]+)"/g)].map(m => m[1]);
}
const names = [...new Set(poolNames(SET.toUpperCase() + '_WEAPON_NAMES')
                    .concat(poolNames(SET.toUpperCase() + '_CONSUMABLE_POOL')))];

const candidates = name => {
  const u = name.replace(/ /g, '_').replace(/&/g, '%26');
  return [
    u + '_-_Weapon_-_Fortnite.png',
    u + '_-_Item_-_Fortnite.png',
    u + '_-_Consumable_-_Fortnite.png',
    u + '_(Weapon)_-_Fortnite.png',
    u + '_-_Fortnite.png',
    u + '.png'
  ];
};

const slug = (n, ext) => SET + '-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.' + ext;

function sniff(buf) {
  const h = buf.slice(0, 12);
  if (h.slice(0, 4).toString('hex') === '89504e47') return 'png';
  if (h.slice(0, 4).toString('ascii') === 'RIFF' && h.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (h.slice(0, 2).toString('hex') === 'ffd8') return 'jpg';
  return null;
}

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (fncsdraft asset fetch)', 'Accept': 'image/*' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
        res.resume();
        return resolve(get(new URL(res.headers.location, url).href, redirects + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

(async () => {
  const map = {};
  const failed = [];
  for (const name of names) {
    let done = false;
    for (const cand of candidates(name)) {
      const url = 'https://fortnite.fandom.com/wiki/Special:FilePath/' + cand;
      try {
        const buf = await get(url);
        const ext = sniff(buf);
        if (buf.length < 400 || !ext) throw new Error('not an image');
        const file = slug(name, ext);
        fs.writeFileSync(path.join(OUT, file), buf);
        map[name] = 'items/' + file;
        done = true;
        process.stderr.write('.');
        break;
      } catch (e) { /* try the next spelling */ }
      await new Promise(r => setTimeout(r, 120));
    }
    if (!done) { failed.push(name); process.stderr.write('x'); }
    await new Promise(r => setTimeout(r, 120));
  }
  process.stderr.write('\n');
  console.error('resolved ' + Object.keys(map).length + '/' + names.length);
  failed.forEach(f => console.error('  no art: ' + f));
  console.log('const ' + SET.toUpperCase() + '_ART={');
  console.log(Object.keys(map).map(n => '  ' + JSON.stringify(n) + ':' + JSON.stringify(map[n])).join(',\n'));
  console.log('};');
})();
