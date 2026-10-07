// Даты рождения игроков с Liquipedia (его слово 7.10: «найди возраста каждого игрока на ликвидпедии и добавь»).
// 1) все страницы категории Players; 2) вики-текст пачками по 50 → |id=, |country=, |birthdate=/birth_date=.
// API Liquipedia: action=query не чаще раза в 2 с — берём 2.5 с. Кэш в %TEMP%/liqui-dob, повторный запуск дёшев.
//   node tools/fetch-liqui-dob.js  → tools/measured/liqui-dob-raw.json
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const UA = 'fncsdraft-tools/1.0 (keegorka@gmail.com)';
const API = 'https://liquipedia.net/fortnite/api.php';
const GAP_MS = 2500;
const CACHE = path.join(process.env.TEMP || os.tmpdir(), 'liqui-dob');
fs.mkdirSync(CACHE, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let last = 0;
async function get(params, key) {
  const f = path.join(CACHE, key.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 120) + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const wait = last + GAP_MS - Date.now(); if (wait > 0) await sleep(wait);
  const url = API + '?' + Object.entries(Object.assign({ format: 'json' }, params)).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  let j = null;
  for (let t = 0; t < 3 && !j; t++) {
    try { j = JSON.parse(execFileSync('curl', ['-s', '--compressed', '-A', UA, url], { maxBuffer: 1 << 28 }).toString('utf8')); }
    catch (e) { await sleep(10000); }
  }
  last = Date.now();
  if (!j) throw new Error('no json for ' + key);
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
function field(text, names) {
  for (const n of names) {
    const m = text.match(new RegExp('\\|\\s*' + n + '\\s*=\\s*([^\\n|}]*)', 'i'));
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}
(async () => {
  const titles = [];
  let cont = null, page = 0;
  do {
    const p = { action: 'query', list: 'categorymembers', cmtitle: 'Category:Players', cmlimit: '500', cmnamespace: '0' };
    if (cont) p.cmcontinue = cont;
    const j = await get(p, 'cat_' + (page++) + '_' + (cont || 'start'));
    (j.query && j.query.categorymembers || []).forEach(m => titles.push(m.title));
    cont = j.continue && j.continue.cmcontinue;
    console.error('category page', page, 'titles', titles.length);
  } while (cont);
  const out = [];
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const j = await get({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: batch.join('|') }, 'rev_' + i + '_' + batch[0]);
    Object.values((j.query && j.query.pages) || {}).forEach(pg => {
      const rev = pg.revisions && pg.revisions[0];
      const text = rev ? ((rev.slots && rev.slots.main && rev.slots.main['*']) || rev['*'] || '') : '';
      const born = field(text, ['birth_date', 'birthdate', 'born']);
      const m = born && born.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!m || m[2] === '00' || m[3] === '00') return;
      out.push({ title: pg.title, id: field(text, ['id']) || pg.title, ids: field(text, ['ids', 'alternate_ids']) || '',
                 country: field(text, ['country', 'country1']), born: m[0] });
    });
    console.error('pages', Math.min(i + 50, titles.length), '/', titles.length, 'with birth date', out.length);
  }
  fs.writeFileSync(path.join(__dirname, 'measured', 'liqui-dob-raw.json'), JSON.stringify(out));
  console.log('player pages', titles.length, 'with full birth date', out.length);
})().catch(e => { console.error(e); process.exit(1); });
