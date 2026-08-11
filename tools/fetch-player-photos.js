// Portraits for the players who do not have one, from Liquipedia.
//
// Liquipedia's text and images are CC-BY-SA 3.0, and their API terms ask for a
// descriptive User-Agent and a gap between requests — one call every two seconds
// for api.php. Both are honoured below; do not tighten the delay.
//
//   node tools/fetch-player-photos.js            every handle with no portrait
//   node tools/fetch-player-photos.js Wox Clix   just these
//   node tools/fetch-player-photos.js --limit 5  stop after five
//
// It writes into photos/ and prints the PLAYER_PHOTO lines to add. It never
// edits index.html: which portrait belongs to which handle is a judgement call
// when a name is ambiguous, and that stays with a person.
'use strict';

const fs = require('fs'), path = require('path'), https = require('https'), zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');
const UA = 'fncsdraft.com photo fetcher (contact: keegorka@gmail.com)';
const WIKI = 'liquipedia.net';
const GAP_MS = 2000;

const args = process.argv.slice(2);
let limit = Infinity;
const li = args.indexOf('--limit');
if (li >= 0) { limit = Number(args[li + 1]) || Infinity; args.splice(li, 2); }

function get(url, binary) {
  return new Promise((resolve, reject) => {
    // gzip is not an optimisation here, it is required: Liquipedia answers 429
    // to an uncompressed request however slowly you make it.
    https.get(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(get(res.headers.location, binary));
      }
      if (res.statusCode === 429) {
        res.resume();
        // Not a throttle to ride out: Liquipedia blocks the IP and answers with a
        // Cloudflare challenge page. Retrying makes the block longer. Stop.
        const err = new Error('HTTP 429 — Liquipedia has blocked this IP; wait it out');
        err.blocked = true;
        return reject(err);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        let buf = Buffer.concat(chunks);
        if ((res.headers['content-encoding'] || '').indexOf('gzip') >= 0) {
          try { buf = zlib.gunzipSync(buf); } catch (e) { return reject(e); }
        }
        resolve(binary ? buf : buf.toString('utf8'));
      });
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// The handles with no portrait, read out of the page rather than pasted here so
// the list cannot drift from what the game actually shows.
function missingHandles() {
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const mapped = new Set();
  const mapBlock = src.slice(src.indexOf('const PLAYER_PHOTO={'));
  const mapEnd = mapBlock.indexOf('\n};');
  [...mapBlock.slice(0, mapEnd).matchAll(/"([^"]+)"\s*:/g)].forEach(m => mapped.add(m[1].split('@')[0]));

  const names = new Set();
  ['GC2025_M1_TRIOS', 'GC2025_M2_TRIOS', 'GC2025_M3_TRIOS'].forEach(table => {
    const at = src.indexOf('const ' + table + '=[');
    if (at < 0) return;
    const body = src.slice(at, src.indexOf('];', at));
    [...body.matchAll(/'([^']+)'/g)].forEach(m => names.add(m[1]));
  });
  return [...names].filter(n => !mapped.has(n));
}

const safeFile = h => h.replace(/[^A-Za-z0-9_.-]/g, '') + '.jpg';

async function findImage(handle) {
  const api = 'https://' + WIKI + '/fortnite/api.php?action=query&format=json&redirects=1' +
    '&prop=pageimages&pithumbsize=400&titles=' + encodeURIComponent(handle);
  const body = await get(api, false);
  let data;
  try { data = JSON.parse(body); } catch (e) { return null; }
  const pages = (data.query && data.query.pages) || {};
  for (const k of Object.keys(pages)) {
    const p = pages[k];
    if (p.thumbnail && p.thumbnail.source) return {title: p.title, url: p.thumbnail.source};
  }
  return null;
}

(async () => {
  const wanted = args.length ? args : missingHandles();
  const todo = wanted.slice(0, limit);
  if (!fs.existsSync(PHOTOS)) fs.mkdirSync(PHOTOS);
  console.log('looking up ' + todo.length + ' handle' + (todo.length === 1 ? '' : 's') +
    ' on Liquipedia, one every ' + (GAP_MS / 1000) + 's\n');

  const got = [], none = [], failed = [];
  for (let i = 0; i < todo.length; i++) {
    const h = todo[i];
    if (i) await sleep(GAP_MS);
    let hit = null;
    try { hit = await findImage(h); }
    catch (e) {
      failed.push(h + ' (' + e.message + ')');
      console.log('  !! ' + h + ': ' + e.message);
      if (e.blocked) { console.log('  stopping — every further request extends the block.'); break; }
      continue;
    }
    if (!hit) { none.push(h); console.log('  -- ' + h + ': no page image'); continue; }
    try {
      const bytes = await get(hit.url, true);
      const file = safeFile(h);
      fs.writeFileSync(path.join(PHOTOS, file), bytes);
      got.push({handle: h, file, title: hit.title, bytes: bytes.length});
      console.log('  ok ' + h + ' -> photos/' + file + '  (' + hit.title + ', ' + Math.round(bytes.length / 1024) + 'kb)');
    } catch (e) {
      failed.push(h + ' (' + e.message + ')');
      console.log('  !! ' + h + ' download: ' + e.message);
    }
  }

  console.log('\n' + got.length + ' downloaded, ' + none.length + ' with no image, ' + failed.length + ' failed');
  if (got.length) {
    console.log('\nlines for PLAYER_PHOTO:');
    got.forEach(g => console.log('  "' + g.handle + '": "' + g.file + '",'));
    console.log('\nLiquipedia images are CC-BY-SA 3.0 — keep the attribution note beside the map.');
  }
  if (none.length) console.log('\nno image on their page: ' + none.join(', '));
  if (failed.length) console.log('failed: ' + failed.join(', '));
})();
