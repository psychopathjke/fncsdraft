/* The other six ping maps, drawn the same way Europe's is.

   tools/build-ping-map.js builds Europe off Eurostat GISCO, which only covers
   Europe. The rest of the world needs a world source, so this uses Natural
   Earth 50m admin-0 — the same source that generator says was here first, kept
   for everywhere GISCO does not reach.

   Two things come out of it per region: the shapes, in exactly the structure
   CC_MAP already holds, and a ping table. Europe's pings are measured and are
   not touched; the other six are the fit in tools/build-ping-fit.js applied to
   each region's own server city, because nobody has measured them and 200 made
   up numbers would be worse than one honest curve.

     node tools/build-region-maps.js                    # print what it would do
     node tools/build-region-maps.js --write            # write region-maps.json
*/
const fs = require('fs'), path = require('path');

const SCRATCH = path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude',
  'C--Users-FoxOS-User', 'dd383854-0ff2-4c46-9ee3-dfbeae8175a0', 'scratchpad');
const GEO    = process.env.NE_GEOJSON || path.join(SCRATCH, 'ne_50m.geojson');
const PLACES = process.env.NE_PLACES  || path.join(SCRATCH, 'ne_places.geojson');
for (const f of [GEO, PLACES]) {
  if (!fs.existsSync(f)) { console.error('missing ' + f); process.exit(2); }
}
const FIT = JSON.parse(fs.readFileSync(path.join(__dirname, 'ping-fit.json'), 'utf8'));

/* Each region: the frame you see, the wider box shapes are cut to so a country
   running off the edge still draws, and how many countries to name. The frames
   are the landmass Epic's region actually covers — NA Central and NA West are
   the same continent on two different servers, so they share a frame and differ
   only in the milliseconds. */
const REGIONS = {
  NAC:  { frame: [-140, -52,  12, 62], cut: [-172, -40,   4, 76], want: 30 },
  NAW:  { frame: [-140, -52,  12, 62], cut: [-172, -40,   4, 76], want: 30 },
  BR:   { frame: [ -82, -33, -44, 14], cut: [ -95, -25, -56, 22], want: 14 },
  ASIA: { frame: [  65, 148, -12, 52], cut: [  55, 168, -20, 60], want: 34 },
  ME:   { frame: [  25,  70,  12, 43], cut: [  14,  82,   2, 52], want: 22 },
  OCE:  { frame: [ 110, 180, -48, -6], cut: [  99, 195, -55,   4], want: 16 }
};

const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));
const places = JSON.parse(fs.readFileSync(PLACES, 'utf8'));

// Population-weighted centre per country, and a total population to rank by.
const CITY = {}, POP = {};
places.features.forEach(f => {
  const pr = f.properties, code = String(pr.ISO_A2 || '').toLowerCase();
  const pop = +pr.POP_MAX || 0;
  if (!code || code.length !== 2 || !pop || !f.geometry) return;
  const [lon, lat] = f.geometry.coordinates;
  (CITY[code] = CITY[code] || []).push({ pop: pop, lat: lat, lon: lon });
  POP[code] = (POP[code] || 0) + pop;
});


const BY_CODE = {};
geo.features.forEach(f => {
  const p = f.properties;
  const code = String(p.ISO_A2_EH || p.ISO_A2 || '').toLowerCase();
  if (!code || code.length !== 2 || code === '-9') return;
  if (!BY_CODE[code]) BY_CODE[code] = f;
});

const R = 6371;
function km(a, b) {
  const t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
const pingOf = d => Math.max(1, Math.round(FIT.a + FIT.b * d));
// The same anchor rule the fit was made on: nearest city over a million.
const BIG = 1000000;
function anchor(code, to) {
  const cs = CITY[code];
  if (!cs || !cs.length) return null;
  const big = cs.filter(c => c.pop >= BIG);
  const use = big.length ? big : [cs.slice().sort((a, b) => b.pop - a.pop)[0]];
  return use.reduce((b, c) => km(c, to) < km(b, to) ? c : b);
}
// Where a country sits on the map is still its biggest city.
function seat(code) {
  const cs = CITY[code];
  return cs && cs.length ? cs.slice().sort((a, b) => b.pop - a.pop)[0] : null;
}

// ---- geometry, lifted from build-ping-map.js -------------------------------
function polysOf(f) {
  const g = f.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return [g.coordinates];
  if (g.type === 'MultiPolygon') return g.coordinates;
  return [];
}
function unwrap(r) {
  let off = 0; const out = [r[0]];
  for (let i = 1; i < r.length; i++) {
    const d = r[i][0] - r[i - 1][0];
    if (d > 180) off -= 360; else if (d < -180) off += 360;
    out.push([r[i][0] + off, r[i][1]]);
  }
  const a = out[0], b = out[out.length - 1];
  if (Math.abs(b[0] - a[0]) > 180) {
    let lat = 0; for (const q of out) lat += q[1];
    const pole = lat / out.length < 0 ? -89 : 89;
    out.push([b[0], pole], [a[0], pole]);
  }
  return out;
}
function clipRing(r, keep, inter) {
  const out = [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], ka = keep(a), kb = keep(b);
    if (ka) out.push(a);
    if (ka !== kb) out.push(inter(a, b));
  }
  return out;
}
function clipTo(r, x0, x1, y0, y1) {
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  r = clipRing(r, p => p[0] >= x0, (a, b) => lerp(a, b, (x0 - a[0]) / (b[0] - a[0])));
  if (!r.length) return r;
  r = clipRing(r, p => p[0] <= x1, (a, b) => lerp(a, b, (x1 - a[0]) / (b[0] - a[0])));
  if (!r.length) return r;
  r = clipRing(r, p => p[1] >= y0, (a, b) => lerp(a, b, (y0 - a[1]) / (b[1] - a[1])));
  if (!r.length) return r;
  r = clipRing(r, p => p[1] <= y1, (a, b) => lerp(a, b, (y1 - a[1]) / (b[1] - a[1])));
  return r;
}
function dp(pts, eps) {
  if (pts.length < 4) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [i, j] = st.pop();
    let best = -1, bd = eps;
    const [x1, y1] = pts[i], [x2, y2] = pts[j];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs((pts[k][0] - x1) * dy - (pts[k][1] - y1) * dx) / len;
      if (d > bd) { bd = d; best = k; }
    }
    if (best >= 0) { keep[best] = true; st.push([i, best], [best, j]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function dpRing(pts, eps) {
  if (pts.length < 8) return pts;
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > fd) { fd = d; far = i; }
  }
  if (far < 2 || far > pts.length - 2) return dp(pts, eps);
  return dp(pts.slice(0, far + 1), eps).concat(dp(pts.slice(far), eps).slice(1));
}
function poleOfInaccessibility(rings, H) {
  const inside = (px, py) => {
    let s = false;
    for (const r of rings)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) s = !s;
      }
    return s;
  };
  const edge = (px, py) => {
    let m = 1e9;
    for (const r of rings)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const a = r[j], b = r[i];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
        let t = L ? ((px - a[0]) * dx + (py - a[1]) * dy) / L : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const d = Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
        if (d < m) m = d;
      }
    return m;
  };
  let bx = 0, by = 0, bd = -1;
  const scan = (x0, x1, y0, y1, step) => {
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) {
      if (x < 0 || x > 1000 || y < 0 || y > H || !inside(x, y)) continue;
      const d = Math.min(edge(x, y), x, 1000 - x, y, H - y);
      if (d > bd) { bd = d; bx = x; by = y; }
    }
  };
  let lo = [1e9, 1e9], hi = [-1e9, -1e9];
  rings.forEach(r => r.forEach(p => {
    if (p[0] < lo[0]) lo[0] = p[0]; if (p[0] > hi[0]) hi[0] = p[0];
    if (p[1] < lo[1]) lo[1] = p[1]; if (p[1] > hi[1]) hi[1] = p[1];
  }));
  scan(lo[0], hi[0], lo[1], hi[1], 4);
  if (bd < 0) return { x: +((lo[0] + hi[0]) / 2).toFixed(1), y: +((lo[1] + hi[1]) / 2).toFixed(1),
                       r: +(Math.min(hi[0] - lo[0], hi[1] - lo[1]) / 2).toFixed(1) };
  scan(bx - 4, bx + 4, by - 4, by + 4, 1);
  return { x: +bx.toFixed(1), y: +by.toFixed(1), r: +bd.toFixed(1) };
}

// ---- build ------------------------------------------------------------------
const EPS = 0.55;
const maps = {}, pings = {}, names = { ru: {}, en: {} };
// The names come off the same source as the shapes, so a country on the map is
// always a country with a name under it.
/* A few come out of the source in their full legal form, which is not what
   anybody calls them and does not fit under a flag on a map. */
const SHORT_RU = {cn:'Китай', kr:'Корея', ae:'ОАЭ', do:'Доминикана', ht:'Гаити',
  bs:'Багамы', bm:'Бермуды', vc:'Сент-Винсент', ag:'Антигуа', kn:'Сент-Китс',
  tt:'Тринидад', pg:'Папуа', sb:'Соломоновы о-ва', sa:'Саудовская Аравия'};
const SHORT_EN = {cn:'China', kr:'South Korea', vc:'St Vincent', kn:'St Kitts',
  ag:'Antigua', tt:'Trinidad', bs:'Bahamas', pg:'Papua New Guinea'};
function nameInto(code) {
  const p = BY_CODE[code] && BY_CODE[code].properties;
  if (!p) return;
  names.ru[code] = SHORT_RU[code] || p.NAME_RU || p.NAME_EN || p.NAME || code.toUpperCase();
  names.en[code] = SHORT_EN[code] || p.NAME_EN || p.NAME || code.toUpperCase();
}

for (const [reg, spec] of Object.entries(REGIONS)) {
  const [LON0, LON1, LAT0, LAT1] = spec.frame;
  const [WLON0, WLON1, WLAT0, WLAT1] = spec.cut;
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  const W = 1000;
  const X = lon => (lon - LON0) / (LON1 - LON0) * W;
  const K = W / (LON1 - LON0) * (180 / Math.PI);
  const Y0 = merc(LAT1) * K;
  const Y = lat => Y0 - merc(lat) * K;
  const H = Math.round(Y(LAT0));

  const clip      = r => clipTo(unwrap(r), WLON0, WLON1, WLAT0, WLAT1);
  const clipFrame = r => clipTo(unwrap(r), LON0, LON1, LAT0, LAT1);

  // Who is on this map: every country whose people sit inside the frame, the
  // biggest first, cut to the number the frame has room to label.
  const inFrame = Object.keys(CITY).filter(c => {
    const p = seat(c);
    if (!p) return false;
    return BY_CODE[c] && p.lon >= LON0 && p.lon <= LON1 && p.lat >= LAT0 && p.lat <= LAT1;
  }).sort((a, b) => (POP[b] || 0) - (POP[a] || 0));
  /* Who is on the map is decided by reach, not by a headcount: everybody in
     frame a duo could actually be played from. 150 ms is his line.

     Being on two maps is not a mistake: a Kazakh really can queue in Europe at
     127 ms or in the Middle East at 74, and which one they pick is theirs. */
  const REACH = 150;
  const want = inFrame.filter(c => {
    const a = anchor(c, FIT.servers[reg]);
    return a && pingOf(km(a, FIT.servers[reg])) <= REACH;
  });

  const server = FIT.servers[reg];
  const table = want.map(c => ({ c, ping: pingOf(km(anchor(c, server), server)) }))
                    .sort((x, y) => x.ping - y.ping);

  const out = {};
  for (const code of want) {
    let d = '', minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, best = null, bestA = 0;
    const framed = [];
    polysOf(BY_CODE[code]).forEach(poly => {
      poly.forEach((r, ri) => {
        const c = clip(r);
        if (c.length < 4) return;
        const pts = dpRing(c.map(([lon, lat]) => [X(lon), Y(lat)]), EPS);
        if (pts.length < 4) return;
        let A = 0;
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
        if (Math.abs(A) / 2 < 0.7) return;
        d += 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
        const fr = clipFrame(r);
        if (fr.length < 4) return;
        const fp = dpRing(fr.map(([lon, lat]) => [X(lon), Y(lat)]), EPS);
        framed.push(fp);
        fp.forEach(p => {
          if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
          if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
        });
        let fa = 0;
        for (let i = 0; i < fp.length; i++) { const p = fp[i], q = fp[(i + 1) % fp.length]; fa += p[0] * q[1] - q[0] * p[1]; }
        fa = Math.abs(fa) / 2;
        if (fa > bestA) { bestA = fa; best = fp; }
      });
    });
    if (!d || !framed.length) { console.log('  ' + reg + ': nothing drawn for ' + code); continue; }
    const pole = poleOfInaccessibility(framed, H);
    let px = minx, py = miny, pw = maxx - minx, ph = maxy - miny;
    if (best) {
      let a = 1e9, b2 = 1e9, c2 = -1e9, e = -1e9;
      best.forEach(q => { if (q[0] < a) a = q[0]; if (q[0] > c2) c2 = q[0]; if (q[1] < b2) b2 = q[1]; if (q[1] > e) e = q[1]; });
      px = a; py = b2; pw = c2 - a; ph = e - b2;
    }
    out[code] = { d, cx: pole.x, cy: pole.y, r: pole.r,
                  w: +(maxx - minx).toFixed(1), h: +(maxy - miny).toFixed(1),
                  px: +px.toFixed(1), py: +py.toFixed(1), pw: +pw.toFixed(1), ph: +ph.toFixed(1) };
  }

  let landD = '';
  geo.features.forEach(f => {
    polysOf(f).forEach(poly => {
      poly.forEach(r => {
        const c = clip(r); if (c.length < 4) return;
        const pts = dpRing(c.map(([lon, lat]) => [X(lon), Y(lat)]), 1.1);
        if (pts.length < 4) return;
        let A = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
        if (Math.abs(A) / 2 < 4) return;
        landD += 'M' + pts.map(p => p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join('L') + 'Z';
      });
    });
  });

  Object.keys(out).forEach(nameInto);
  maps[reg] = { H, land: landD, c: out };
  pings[reg] = table.filter(t => out[t.c]);
  const kb = (JSON.stringify(maps[reg]).length / 1024).toFixed(0);
  console.log(reg.padEnd(5) + ' H=' + String(H).padStart(4) +
              '  countries=' + String(Object.keys(out).length).padStart(3) +
              '  ' + kb + ' KB  server=' + server.name +
              '  ping ' + pings[reg][0].ping + '..' + pings[reg][pings[reg].length - 1].ping + ' ms');
}

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, 'region-maps.json'), JSON.stringify({ maps, pings, names }));
  const kb = (fs.statSync(path.join(__dirname, 'region-maps.json')).size / 1024).toFixed(0);
  console.log('\nwrote tools/region-maps.json  (' + kb + ' KB)');
}
