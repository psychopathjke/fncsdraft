// Rates the 2025 landing zones by the loot that actually spawned in them.
//
//   node tools/build-2025-zone-loot.js [t1|t2|t3 ...]
//
// ZONE_STATS carried m1 and m2 only, so every rectangle on the three 2025
// islands fell to `points = 1` in useLandingSet and the landing picker decided
// nothing at all. The rule this follows is the one the m1/m2 numbers follow: a
// spot is worth the loot it drops, counted per rectangle and graded against its
// own island — never by how big the rectangle happens to be.
//
// Two sources, both read rather than judged:
//
//   • The Fortnite Wiki's interactive map for the patch each Major was played
//     on. It carries every named location, landmark and unnamed location with
//     real coordinates on a 2048x2048 frame, which is what puts a POI inside a
//     rectangle instead of somebody eyeballing it.
//   • That POI's own page, whose infobox carries the counted chests and ammo
//     boxes. Floor loot and produce boxes are recorded too but are not part of
//     the score: they are filled in on some pages and left blank on others, so
//     counting them would rank a POI by how thoroughly it was documented.
//
// The wiki island image and the map that ships are two renders of one island, so
// they are put in the same frame the way tools/align-zones.js does it — find the
// island's bounding box in each and map one onto the other.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UA = 'FNCSDraft-DataCheck/1.0 (keegorka@gmail.com)';
const SETS = {
  // The patch each Major was actually played on: Major 1 on 15-16 February 2025,
  // Major 2 in April, Major 3 in July. The wiki keeps one interactive map per
  // patch, so this is the island as it stood that weekend rather than whatever
  // the season ended as.
  t1: {map: 'Map:Chapter 6: Season 1 (33.20)', art: 'art/map-t1.jpg'},
  t2: {map: 'Map:Chapter 6: Season 2 (34.30)', art: 'art/map-t2.jpg'},
  t3: {map: 'Map:Chapter 6: Season 3 (36.30)', art: 'art/map-t3.jpg'}
};
const WANT = process.argv.slice(2).filter(a => SETS[a]);
const TARGETS = WANT.length ? WANT : Object.keys(SETS);

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function wiki(params) {
  const res = await fetch('https://fortnite.fandom.com/api.php?format=json&' + params, {headers: {'User-Agent': UA}});
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ---- the grid that ships -----------------------------------------------------
function zoneSet(key) {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const at = html.indexOf('const ZONE_SETS=');
  const k = html.indexOf('\n  ' + key + ':[', at);
  if (k < 0) throw new Error('no zone set ' + key);
  let i = html.indexOf('[', k), d = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '[') d++;
    else if (c === ']') { d--; if (!d) { end = j + 1; break; } }
  }
  return eval(html.slice(i, end));
}

// ---- the island's bounding box in a picture ---------------------------------
// Lifted from tools/align-zones.js, which is the tool that already had to put two
// renders of one island into the same frame.
function islandBox(file) {
  const b64 = fs.readFileSync(file).toString('base64');
  const mime = /\.png$/i.test(file) ? 'image/png' : 'image/jpeg';
  const html = `<pre id="o"></pre><img id="i" src="data:${mime};base64,${b64}">
<script>
document.getElementById('i').onload = function(){
  var im = this, c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  var W = c.width, H = c.height, d = g.getImageData(0, 0, W, H).data;
  var br = 0, bg = 0, bb = 0, n = 0;
  function sample(x, y){ var i = (y*W+x)*4; br += d[i]; bg += d[i+1]; bb += d[i+2]; n++; }
  for (var x = 0; x < W; x += 4){ sample(x, 2); sample(x, H-3); }
  for (var y = 0; y < H; y += 4){ sample(2, y); sample(W-3, y); }
  br /= n; bg /= n; bb /= n;
  var xs = new Int32Array(W), ys = new Int32Array(H), total = 0;
  for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++){
    var i2 = (yy*W+xx)*4, dr = d[i2]-br, dg = d[i2+1]-bg, db = d[i2+2]-bb;
    if (dr*dr + dg*dg + db*db > 40*40){ xs[xx]++; ys[yy]++; total++; }
  }
  function bound(counts, len, frac){
    var want = total * frac, acc = 0;
    for (var i = 0; i < len; i++){ acc += counts[i]; if (acc >= want) return i; }
    return len - 1;
  }
  document.getElementById('o').textContent = 'BEGINB' + JSON.stringify({
    W: W, H: H, x0: bound(xs, W, 0.005), x1: bound(xs, W, 0.995),
    y0: bound(ys, H, 0.005), y1: bound(ys, H, 0.995)}) + 'ENDB';
};
<\/script>`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zloot-'));
  const f = path.join(dir, 'a.html');
  fs.writeFileSync(f, html);
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=30000', '--dump-dom', 'file:///' + f.replace(/\\/g, '/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const m = dom.match(/BEGINB(\{[\s\S]*?\})ENDB/);
  if (!m) throw new Error('island detection failed for ' + file);
  return JSON.parse(m[1]);
}

(async () => {
  const cacheDir = path.join(os.tmpdir(), 'fncs-zone-loot');
  fs.mkdirSync(cacheDir, { recursive: true });
  const lootCache = {};

  for (const set of TARGETS) {
    const cfg = SETS[set];
    // --- markers -------------------------------------------------------------
    const mapPage = await wiki('action=parse&prop=wikitext&page=' + encodeURIComponent(cfg.map));
    if (!mapPage.parse) throw new Error('no map page ' + cfg.map);
    const j = JSON.parse(mapPage.parse.wikitext['*']);
    const cats = {}; (j.categories || []).forEach(c => cats[c.id] = c.name);
    const markers = (j.markers || []).map(m => ({
      n: (m.popup && m.popup.title) || m.title || '',
      x: m.position[0], y: m.position[1], c: cats[m.categoryId] || String(m.categoryId)
    })).filter(m => m.n && m.c !== 'Unnamed Location');
    const bounds = j.mapBounds[1][0];   // square frame, 2048

    // --- loot per POI --------------------------------------------------------
    for (const m of markers) {
      if (lootCache[m.n]) continue;
      const r = await wiki('action=parse&prop=wikitext&redirects=1&page=' + encodeURIComponent(m.n));
      if (!r.parse) { lootCache[m.n] = null; continue; }
      const w = r.parse.wikitext['*'];
      const num = re => { const g = w.match(re); return g ? parseInt(g[1], 10) : 0; };
      lootCache[m.n] = {chests: num(/\|\s*chests\s*=\s*(\d+)/i), ammo: num(/\|\s*ammo_boxes\s*=\s*(\d+)/i),
                        floor: num(/\|\s*floor_loot\s*=\s*(\d+)/i), produce: num(/\|\s*produce_boxes\s*=\s*(\d+)/i)};
      await sleep(120);
    }

    // --- the two frames ------------------------------------------------------
    const imgFile = path.join(cacheDir, set + '-wiki.png');
    if (!fs.existsSync(imgFile)) {
      const info = await wiki('action=query&prop=imageinfo&iiprop=url&titles=' +
        encodeURIComponent('File:' + j.mapImage));
      const pages = info.query.pages;
      const url = pages[Object.keys(pages)[0]].imageinfo[0].url;
      const buf = Buffer.from(await (await fetch(url, {headers: {'User-Agent': UA}})).arrayBuffer());
      fs.writeFileSync(imgFile, buf);
    }
    const wikiBox = islandBox(imgFile);
    const artBox = islandBox(path.join(ROOT, cfg.art));

    // Marker coordinates are on a 2048 frame with the origin at the bottom left,
    // so y flips; then island-relative, then into the shipped map's percentages.
    const toPct = m => {
      const px = m.x / bounds * wikiBox.W, py = (bounds - m.y) / bounds * wikiBox.H;
      const fx = (px - wikiBox.x0) / (wikiBox.x1 - wikiBox.x0);
      const fy = (py - wikiBox.y0) / (wikiBox.y1 - wikiBox.y0);
      return {X: 100 * (artBox.x0 + fx * (artBox.x1 - artBox.x0)) / artBox.W,
              Y: 100 * (artBox.y0 + fy * (artBox.y1 - artBox.y0)) / artBox.H};
    };

    // --- into the rectangles -------------------------------------------------
    const zones = zoneSet(set);
    const stats = zones.map(() => ({loot: 0, pois: []}));
    let placed = 0, outside = 0;
    markers.forEach(m => {
      const l = lootCache[m.n];
      const score = l ? (l.chests + l.ammo) : 0;
      const p = toPct(m);
      let hit = -1;
      zones.forEach((z, i) => {
        if (p.X >= z.x && p.X <= z.x + z.w && p.Y >= z.y && p.Y <= z.y + z.h) {
          // A marker inside two overlapping rectangles goes to the smaller one,
          // which is the more specific place.
          if (hit < 0 || zones[hit].w * zones[hit].h > z.w * z.h) hit = i;
        }
      });
      if (hit < 0) { outside++; return; }
      placed++;
      stats[hit].loot += score;
      if (score) stats[hit].pois.push(m.n + ' ' + score);
    });

    // DUMP_POIS=<file> writes every marker at the position this tool computed for
    // it, so the alignment can be drawn over the shipped map and looked at. A
    // silent axis flip would still land most markers inside some rectangle; only
    // the picture shows that Demon's Domain is on the crater.
    if (process.env.DUMP_POIS) {
      fs.writeFileSync(process.env.DUMP_POIS,
        JSON.stringify(markers.map(m => Object.assign({n: m.n}, toPct(m)))));
    }
    const withLoot = stats.filter(s => s.loot > 0).length;
    console.error(set + ': ' + markers.length + ' markers, ' + placed + ' inside a rectangle, ' +
                  outside + ' outside · ' + withLoot + ' of ' + zones.length + ' rectangles have counted loot');
    stats.forEach((s, i) => console.error('   ' + String(i + 1).padStart(2) + ' loot ' +
                  String(s.loot).padStart(4) + '  ' + s.pois.join(', ')));

    // `r` is what useLandingSet grades on, and it grades within the island — so
    // the raw count is the rating and no scaling is invented on top of it.
    const line = stats.map(s => '{r:' + s.loot + ',loot:' + s.loot + '}');
    console.log('  ' + set + ':[' + line.join(',') + '],');
  }
})();
