/* What a ping is, as a function of distance — fitted on the one table we
   measured rather than guessed for six more regions.

   CC_COUNTRIES holds 45 European countries and the milliseconds each one gets
   to Frankfurt. That is real data. Every other region needs the same table and
   nobody has measured one, so instead of inventing 200 numbers this fits the
   European ones against great-circle distance to Frankfurt and reuses the curve
   with each region's own server city.

   Light in fibre goes about 200 km/ms, and a packet makes the trip twice, so
   the floor is d/100 ms. Everything above that is routing, and routing is what
   the fit measures.

     node tools/build-ping-fit.js            # print the fit and its residuals
     node tools/build-ping-fit.js --write    # write tools/ping-fit.json
*/
const fs = require('fs'), path = require('path');

const GEO = process.env.NE_GEOJSON ||
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude', 'C--Users-FoxOS-User',
            'dd383854-0ff2-4c46-9ee3-dfbeae8175a0', 'scratchpad', 'ne_50m.geojson');
if (!fs.existsSync(GEO)) {
  console.error('Natural Earth geojson not found at ' + GEO);
  console.error('set NE_GEOJSON to its path');
  process.exit(2);
}

// The measured table, lifted from index.html so the two cannot drift apart.
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mTable = /const CC_COUNTRIES=\[([\s\S]*?)\];/.exec(SRC);
if (!mTable) { console.error('CC_COUNTRIES not found'); process.exit(1); }
const MEASURED = [...mTable[1].matchAll(/\{c:'([a-z]{2})',ping:(\d+)\}/g)]
  .map(m => ({ c: m[1], ping: +m[2] }));
console.log('measured countries: ' + MEASURED.length);

// Where the servers are. Epic names its regions after them; these are the cities
// each region's traffic actually lands in.
const SERVERS = {
  EU:   { name: 'Frankfurt',   lat: 50.11, lon:   8.68 },
  NAC:  { name: 'Ashburn',     lat: 39.04, lon: -77.49 },
  NAW:  { name: 'Santa Clara', lat: 37.35, lon:-121.96 },
  BR:   { name: 'Sao Paulo',   lat:-23.55, lon: -46.63 },
  ASIA: { name: 'Tokyo',       lat: 35.68, lon: 139.69 },
  ME:   { name: 'Bahrain',     lat: 26.07, lon:  50.56 },
  OCE:  { name: 'Sydney',      lat:-33.87, lon: 151.21 }
};

const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));

/* A country's centre for this purpose is where its people are, and the only
   proxy in the file is the polygon. Take the area-weighted centroid of the
   largest ring, which keeps overseas territories from dragging France into the
   Atlantic. */
function ringsOf(f) {
  const g = f.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return g.coordinates;
  if (g.type === 'MultiPolygon') return g.coordinates.flat();
  return [];
}
function ringArea(r) {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) / 2;
}
function centroidOf(f) {
  const rings = ringsOf(f);
  if (!rings.length) return null;
  let best = null, bestA = -1;
  rings.forEach(r => { const a = ringArea(r); if (a > bestA) { bestA = a; best = r; } });
  if (!best) return null;
  let x = 0, y = 0;
  best.forEach(p => { x += p[0]; y += p[1]; });
  return { lon: x / best.length, lat: y / best.length };
}

/* Where the people are, not where the polygon balances. Russia's centroid sits
   in Siberia and its players sit in Moscow; the same is true of Canada, Brazil
   and Australia. Natural Earth's populated places carry a population, so take
   the largest city in each country - where its players are - and fall back to the
   polygon only where no city is listed. */
const PLACES = process.env.NE_PLACES ||
  GEO.replace(/ne_50m.geojson$/, 'ne_places.geojson');
const CENTRE = {}, CITIES = {};
if (fs.existsSync(PLACES)) {
  const pg = JSON.parse(fs.readFileSync(PLACES, 'utf8'));
  const acc = {};
  pg.features.forEach(f => {
    const pr = f.properties;
    const code = String(pr.ISO_A2 || '').toLowerCase();
    const pop = +pr.POP_MAX || 0;
    if (!code || code.length !== 2 || !pop || !f.geometry) return;
    const [lon, lat] = f.geometry.coordinates;
    (acc[code] = acc[code] || []).push({ pop: pop, lat: lat, lon: lon });
  });
  Object.keys(acc).forEach(c => { CITIES[c] = acc[c]; });
  console.log('countries anchored on their largest city: ' + Object.keys(CENTRE).length);
}

geo.features.forEach(f => {
  const p = f.properties;
  const code = String(p.ISO_A2_EH || p.ISO_A2 || '').toLowerCase();
  if (!code || code === '-9' || code.length !== 2) return;
  if (CENTRE[code]) return;
  const c = centroidOf(f);
  if (c) CENTRE[code] = c;
});
console.log('countries with a centre: ' + Object.keys(CENTRE).length);

const R = 6371;
function km(a, b) {
  const t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/* The anchor a country gets is the best-connected big city it has: a player
   choosing a country would live where the connection is, and the United States
   is 4,000 km wide with a server at each end — anchored on its largest city it
   reads 11 ms from Virginia and 77 ms from California, which is New York twice
   rather than either coast. Nearest city over a million, largest where a country
   has none. */
const BIG = 1000000;
function anchor(code, to) {
  const cs = CITIES[code];
  if (!cs || !cs.length) return CENTRE[code] || null;
  const big = cs.filter(c => c.pop >= BIG);
  const use = big.length ? big : [cs.slice().sort((a, b) => b.pop - a.pop)[0]];
  return use.reduce((b, c) => km(c, to) < km(b, to) ? c : b);
}

// ---- the fit ---------------------------------------------------------------
// ping = a + b * distance. Least squares on the 45 measured countries.
const pts = [];
MEASURED.forEach(m => {
  const c = anchor(m.c, SERVERS.EU);
  if (!c) { console.log('  no geometry for ' + m.c); return; }
  pts.push({ c: m.c, d: km(c, SERVERS.EU), ping: m.ping });
});
const n = pts.length;
const sx = pts.reduce((s, p) => s + p.d, 0);
const sy = pts.reduce((s, p) => s + p.ping, 0);
const sxx = pts.reduce((s, p) => s + p.d * p.d, 0);
const sxy = pts.reduce((s, p) => s + p.d * p.ping, 0);
const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
const a = (sy - b * sx) / n;

const pred = d => Math.max(1, Math.round(a + b * d));
const resid = pts.map(p => ({ ...p, fit: pred(p.d), err: pred(p.d) - p.ping }));
const meanY = sy / n;
const ssTot = pts.reduce((s, p) => s + (p.ping - meanY) ** 2, 0);
const ssRes = resid.reduce((s, p) => s + p.err ** 2, 0);
const r2 = 1 - ssRes / ssTot;
const mae = resid.reduce((s, p) => s + Math.abs(p.err), 0) / n;

console.log('\nfit:  ping = ' + a.toFixed(2) + ' + ' + b.toFixed(5) + ' * km');
console.log('      R2 = ' + r2.toFixed(3) + '   mean abs error = ' + mae.toFixed(1) + ' ms');
console.log('      light-in-fibre floor would be km/100 = ' + (0.01).toFixed(5) + ' per km');

resid.sort((p, q) => Math.abs(q.err) - Math.abs(p.err));
console.log('\nworst 8 residuals (fit vs measured):');
resid.slice(0, 8).forEach(p =>
  console.log('  ' + p.c + '  ' + Math.round(p.d).toString().padStart(5) + ' km   ' +
              'measured ' + String(p.ping).padStart(3) + '   fit ' +
              String(p.fit).padStart(3) + '   ' + (p.err > 0 ? '+' : '') + p.err));

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, 'ping-fit.json'),
    JSON.stringify({ a, b, r2, mae, servers: SERVERS, n }, null, 1));
  console.log('\nwrote tools/ping-fit.json');
}
