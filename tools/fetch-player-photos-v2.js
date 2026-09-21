// Portraits from Liquipedia, second edition (21 September 2026).
//
// The first fetcher asked `prop=pageimages`, and Liquipedia has since dropped the
// PageImages extension: every lookup now answers "no page image" whoever you ask.
// This one reads the player's infobox instead — `|image=` in the wikitext — and
// resolves the file through `prop=imageinfo`. Both calls take fifty titles at a
// time, so a thousand names cost forty api.php requests rather than a thousand.
//
// Liquipedia's terms: descriptive User-Agent, gzip, one api.php call per two
// seconds. All three honoured; do not tighten the delay — a burst blocks the IP.
// Images are CC-BY-SA 3.0; keep the attribution beside PLAYER_PHOTO.
//
//   node tools/fetch-player-photos-v2.js <handles.txt>      one handle per line
//   node tools/fetch-player-photos-v2.js Wox Clix           just these
//
// Writes into photos/ and prints PLAYER_PHOTO lines plus a JSON map
// (tools/photos-v2.json). It never edits index.html.
'use strict';
const fs = require('fs'), path = require('path'), https = require('https'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');
const UA = 'fncsdraft.com photo fetcher (contact: keegorka@gmail.com)';
const API = 'https://liquipedia.net/fortnite/api.php';
const GAP_MS = 2100, BATCH = 50;

function get(url, binary) {
  return new Promise((resolve, reject) => {
    https.get(url, {headers: {'User-Agent': UA, 'Accept-Encoding': 'gzip'}}, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); return resolve(get(res.headers.location, binary)); }
      if (res.statusCode === 429) { res.resume(); const e = new Error('HTTP 429 — blocked, wait it out'); e.blocked = true; return reject(e); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        let buf = Buffer.concat(chunks);
        if ((res.headers['content-encoding'] || '').indexOf('gzip') >= 0) { try { buf = zlib.gunzipSync(buf); } catch (e) { return reject(e); } }
        resolve(binary ? buf : buf.toString('utf8'));
      });
    }).on('error', reject);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const safeFile = (h, ext) => h.replace(/[^A-Za-z0-9_.-]/g, '') + ext;

(async () => {
  let args = process.argv.slice(2);
  let handles = [];
  if (args.length === 1 && fs.existsSync(args[0])) handles = fs.readFileSync(args[0], 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  else handles = args;
  handles = [...new Set(handles)];
  if (!fs.existsSync(PHOTOS)) fs.mkdirSync(PHOTOS);
  console.log('looking up ' + handles.length + ' handles, ' + BATCH + ' per call, one call per ' + (GAP_MS / 1000) + 's');
  // 1. infobox image per player page
  const imageOf = new Map();   // handle -> file title
  let calls = 0;
  for (let i = 0; i < handles.length; i += BATCH) {
    const batch = handles.slice(i, i + BATCH);
    if (calls) await sleep(GAP_MS);
    calls++;
    let data;
    try {
      const url = API + '?action=query&format=json&redirects=1&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(batch.join('|'));
      data = JSON.parse(await get(url, false));
    } catch (e) { console.log('  !! batch ' + (i / BATCH + 1) + ': ' + e.message); if (e.blocked) { console.log('stopping'); break; } continue; }
    const norm = new Map(); ((data.query || {}).normalized || []).forEach(n => norm.set(n.to, n.from));
    const redir = new Map(); ((data.query || {}).redirects || []).forEach(r => redir.set(r.to, r.from));
    const pages = (data.query || {}).pages || {};
    let hit = 0;
    Object.values(pages).forEach(p => {
      if (!p.revisions) return;
      const text = p.revisions[0].slots.main['*'] || '';
      if (!/\{\{Infobox player/i.test(text)) return;
      const m = /\|\s*image\s*=\s*([^\n|}]+)/.exec(text);
      if (!m) return;
      const file = m[1].trim();
      if (!file || /^(no|none)$/i.test(file)) return;
      // back to the handle that was asked for (redirects and normalisation undone)
      let title = p.title; if (redir.has(title)) title = redir.get(title); if (norm.has(title)) title = norm.get(title);
      const handle = batch.find(h => h === title) || batch.find(h => h.toLowerCase() === String(title).toLowerCase());
      if (!handle) return;
      imageOf.set(handle, file); hit++;
    });
    console.log('  batch ' + (i / BATCH + 1) + '/' + Math.ceil(handles.length / BATCH) + ': ' + hit + ' with a portrait');
  }
  // 2. file → url, fifty at a time
  const files = [...new Set([...imageOf.values()])];
  const urlOf = new Map();
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await sleep(GAP_MS);
    let data;
    try {
      const url = API + '?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=400&titles=' + encodeURIComponent(batch.map(f => 'File:' + f).join('|'));
      data = JSON.parse(await get(url, false));
    } catch (e) { console.log('  !! imageinfo: ' + e.message); if (e.blocked) break; continue; }
    const norm = new Map(); ((data.query || {}).normalized || []).forEach(n => norm.set(n.to, n.from));
    Object.values((data.query || {}).pages || {}).forEach(p => {
      const ii = p.imageinfo && p.imageinfo[0]; if (!ii) return;
      let t = p.title; if (norm.has(t)) t = norm.get(t);
      const f = batch.find(x => 'File:' + x === t) || batch.find(x => ('File:' + x).replace(/_/g, ' ') === t.replace(/_/g, ' '));
      if (f) urlOf.set(f, ii.thumburl || ii.url);
    });
  }
  // 3. download
  const got = [], failed = [];
  for (const [handle, file] of imageOf) {
    const url = urlOf.get(file); if (!url) { failed.push(handle + ' (no url)'); continue; }
    const ext = /\.png(\?|$)/i.test(url) ? '.png' : '.jpg';
    const out = safeFile(handle, ext);
    if (fs.existsSync(path.join(PHOTOS, out))) { got.push({handle, file: out, bytes: 0}); continue; }
    await sleep(700);
    try {
      const bytes = await get(url, true);
      if (bytes.length < 500) { failed.push(handle + ' (tiny)'); continue; }
      fs.writeFileSync(path.join(PHOTOS, out), bytes);
      got.push({handle, file: out, bytes: bytes.length});
      console.log('  ok ' + handle + ' -> photos/' + out + ' (' + Math.round(bytes.length / 1024) + 'kb)');
    } catch (e) { failed.push(handle + ' (' + e.message + ')'); }
  }
  console.log('\n' + got.length + ' portraits, ' + (handles.length - imageOf.size) + ' without one on Liquipedia, ' + failed.length + ' failed');
  fs.writeFileSync(path.join(__dirname, 'photos-v2.json'), JSON.stringify(Object.fromEntries(got.map(g => [g.handle, g.file])), null, 1));
  if (failed.length) console.log('failed: ' + failed.join(', '));
})();
