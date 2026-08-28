/* The ping a country gets, off measured round trips rather than off a curve.
 *
 * What was here before: 45 European numbers written by hand, and everything
 * else — the rest of Europe and all six other regions — produced by fitting
 * those 45 against great-circle distance to the server. Two things were wrong
 * with it, and both show up the moment you look at the table:
 *
 *   * The fitted numbers were written back into CC_COUNTRIES, and the fitting
 *     tool reads CC_COUNTRIES as "the measured table". Re-running it now fits
 *     73 countries at R2 0.969 — of which 28 are its own output. The fit was
 *     confirming itself. On the 45 that really were measured it is R2 0.83.
 *
 *   * The 45 are not distance-consistent with each other. France is 402 km
 *     from Frankfurt and read 29 ms; Austria is 597 km and read 7. Sweden at
 *     1,186 km read 20 and Ireland at 1,087 read 48. No curve can hold all of
 *     that, and the residuals said so: ±20 ms on the worst of them.
 *
 * So this reads a measured city-to-city table instead — tools/ping/*.json, one
 * per server, each one a page of wondernetwork's probe matrix saved with the
 * date it was read.
 *
 * A country's number is its capital's, his call, 20 August. One city per
 * country and the same city every time, named by the country rather than
 * chosen by me: Germany is Berlin and not whichever German datacentre happens
 * to sit nearest the cable. Capitals come out of Natural Earth's ADM0CAP flag
 * rather than a list typed here, so nothing is a judgement call. Where no probe
 * sits in the capital the median of that country's other cities stands in, and
 * where there is no probe at all the model fills it; both are printed.
 *
 * Two corrections on top, both stated rather than hidden:
 *
 *   * The last mile. The probes are hosts in datacentres, so Nuremberg reads 4
 *     and no player in Nuremberg has ever seen 4. A home connection adds its
 *     own hop; LAST_MILE is that, and it is the one invented number here.
 *
 *   * Bad probes. A single misrouted host makes a country read three times what
 *     it is — Beirut answers Frankfurt in 216 ms, which is a satellite path and
 *     not what Lebanon is. Anything more than OUTLIER times the distance model
 *     is dropped and the model fills in, and every one that happens is printed.
 *
 * Countries with no probe at all fall back to the same model, refitted on the
 * measured countries only — never on its own output.
 *
 *   node tools/build-ping-measured.js            # print the table and the working
 *   node tools/build-ping-measured.js --write    # write tools/ping-measured.json
 */
const fs = require('fs'), path = require('path');

const HERE = path.join(__dirname, 'ping');
const GEO = process.env.NE_GEOJSON ||
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude', 'C--Users-FoxOS-User',
            'dd383854-0ff2-4c46-9ee3-dfbeae8175a0', 'scratchpad', 'ne_50m.geojson');
const PLACES = process.env.NE_PLACES || GEO.replace(/ne_50m\.geojson$/, 'ne_places.geojson');

// A home connection on top of a datacentre-to-datacentre probe. Fibre adds a
// few milliseconds, cable and DSL more; this is the middle of that and it is
// the only number in the file that is not read off something.
const LAST_MILE = 8;
/* Which of the two ways of turning a country's probes into one number.
   --rule people weighs them by where the people are; the default is his call of
   20 August, the capital. Both write their own file so the two can be looked at
   side by side. */
const RULE = (process.argv.find(a => a.startsWith('--rule=')) || '').split('=')[1] || 'capital';
/* How far past the model a single probe may sit before it is read as broken.

   2.8 rather than 2.2, and the difference is exactly the countries that really
   do route the long way round: Almaty answers Tokyo in 266 ms and Karachi in
   333, which is not a broken host, it is Central Asia reaching Japan through
   Europe. Above about three times the distance is where a reading stops being
   a bad route and starts being a bad probe — Karaganda at 424 to Tokyo, Beirut
   at 216 to Frankfurt and 309 to a server 1,600 km away. */
const OUTLIER = 2.8;

// The rooms the tournaments actually run in — his own list, 20 August. Two of
// these were wrong before it: NA-Central was being modelled from Ashburn, which
// is the east coast, and NA-West from Santa Clara rather than Oregon.
const SERVERS = {
  EU:   { file: 'frankfurt.json', name: 'Frankfurt', lat: 50.11, lon:   8.68 },
  NAC:  { file: 'dallas.json',    name: 'Dallas',    lat: 32.78, lon: -96.80 },
  NAW:  { file: 'portland.json',  name: 'Portland',  lat: 45.52, lon:-122.68 },
  BR:   { file: 'saopaulo.json',  name: 'Sao Paulo', lat:-23.55, lon: -46.63 },
  ASIA: { file: 'tokyo.json',     name: 'Tokyo',     lat: 35.68, lon: 139.69 },
  /* Qatar now, his correction of 20 August — placed at Doha and still measured
     from Bahrain, which is not a fudge but the only honest reading available.

     The Doha probe answers its own neighbours in 34, 56, 94 and 99 ms; the
     Manama probe answers the same four in nothing, 19, 18 and 17. A city 150 km
     away cannot be five times further in milliseconds, so what that matrix
     measures is the host, not the region — see tools/ping/doha.json, kept
     unused. Manama sits 150 km from Doha, which is two and a half milliseconds
     by the ruler and inside the rounding of every number on the map. */
  ME:   { file: 'manama.json',    name: 'Doha',      lat: 25.29, lon:  51.53 },
  OCE:  { file: 'sydney.json',    name: 'Sydney',    lat:-33.87, lon: 151.21 }
};

// ---- geometry, for the countries no probe covers ---------------------------
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
const R = 6371;
function km(a, b) {
  const t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
const CENTRE = {}, CITIES = {};
if (fs.existsSync(GEO)) {
  JSON.parse(fs.readFileSync(GEO, 'utf8')).features.forEach(f => {
    const p = f.properties;
    const code = String(p.ISO_A2_EH || p.ISO_A2 || '').toLowerCase();
    if (!code || code === '-9' || code.length !== 2 || CENTRE[code]) return;
    const c = centroidOf(f);
    if (c) CENTRE[code] = c;
  });
}
// The capital of each country, off Natural Earth's own flag rather than a list
// typed here. Names are normalised because a probe writes Brasilia and the
// atlas writes Brasília, and Washington, D.C. is Washington to a ping table.
const CAPITAL = {};
// " dc" comes off because the atlas writes Washington, D.C. and a ping table
// writes Washington, and a country losing its capital to a full stop would send
// it silently to the median instead.
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
                    .toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
                    .replace(/ dc$/, '');
/* Where each named city is, and how many people live in it.

   CITY_AT lets a probe be placed on the map — the matrix gives a name and a
   number and nothing else — and TOWNS is every place big enough to be somebody's
   home town, which is what the population rule weighs by. */
const CITY_AT = {}, TOWNS = {};
const TOWN_MIN = 200000;
if (fs.existsSync(PLACES)) {
  JSON.parse(fs.readFileSync(PLACES, 'utf8')).features.forEach(f => {
    const pr = f.properties;
    const code = String(pr.ISO_A2 || '').toLowerCase();
    const pop = +pr.POP_MAX || 0;
    if (!code || code.length !== 2 || !f.geometry) return;
    const [lon, lat] = f.geometry.coordinates;
    if (+pr.ADM0CAP === 1 && !CAPITAL[code]) CAPITAL[code] = norm(pr.NAME);
    if (pop) (CITIES[code] = CITIES[code] || []).push({ pop, lat, lon });
    CITY_AT[norm(pr.NAME) + '|' + code] = { lat, lon };
    if (pop >= TOWN_MIN) (TOWNS[code] = TOWNS[code] || []).push({ pop, lat, lon });
  });
}
/* The average ping of a person rather than of a datacentre.

   A country's probes are whatever the matrix happens to host — six German
   cities, one Moroccan — so a median answers "what does a typical datacentre in
   this country see", and a capital answers "what does the capital see". Neither
   is the question the map asks, which is what somebody who lives there gets.

   So every town over two hundred thousand is assigned to its nearest probe, the
   probe carries that weight, and the answer is the weighted average. Measured
   20 August against the capital rule: for compact countries the two agree
   within a millisecond — Switzerland 0, France −1, Czechia 0, Sweden 0, Poland
   −1 — and they part company exactly where the capital is not where the scene
   is: the United States by 31 ms, Australia by 52, Brazil 16, Canada 15,
   Turkey 13. */
/* Where a country's capital actually is, for the rule that needs no probes.

   The capital's name comes off ADM0CAP and its coordinates off the same row, so
   this is the same city the capital rule reads a ping for — only measured with a
   ruler instead. */
function capitalAt(code) {
  const n = CAPITAL[code];
  return (n && CITY_AT[n + '|' + code]) || null;
}
/* Sixty kilometres to the millisecond — his rule, 20 August, and it is a better
   guess than it looks.
 *
 * Light in glass covers 200 km in a millisecond, a packet makes the trip twice,
 * so pure physics is 100 km per millisecond of ping. Real cable does not run
 * along the great circle: it follows coasts, borders and existing ducts, and the
 * measured European table puts the true figure at 55 km per millisecond — a
 * route about 1.8 times the straight line. Sixty is that, to within nine per
 * cent, arrived at from the other direction.
 *
 * Nothing else goes into it: no probes, no last mile, no local peering. Which is
 * the point of having it as its own version — it is what the map looks like when
 * distance is the only thing that exists. */
const KM_PER_MS = 60;
function byRuler(code, srv) {
  const at = capitalAt(code) || anchor(code, srv);
  if (!at) return null;
  return km(at, srv) / KM_PER_MS;
}
function byPeople(code, probes) {
  const towns = TOWNS[code] || [];
  const located = probes.map(p => ({ p, at: CITY_AT[norm(p.city) + '|' + code] }))
                        .filter(x => x.at);
  if (!located.length || !towns.length) return null;
  const w = new Map(located.map(x => [x.p.city, 0]));
  towns.forEach(t => {
    let best = null, bd = Infinity;
    located.forEach(x => { const d = km(t, x.at); if (d < bd) { bd = d; best = x; } });
    if (best) w.set(best.p.city, w.get(best.p.city) + t.pop);
  });
  const total = [...w.values()].reduce((s, v) => s + v, 0);
  if (!(total > 0)) return null;
  return located.reduce((s, x) => s + x.p.ms * w.get(x.p.city), 0) / total;
}
/* ---- The United States, by state -----------------------------------------
 *
 * His ask, 20 August. Everything below is keyed by code, so a state only has to
 * be given the same three things a country has — a shape to sit in, a list of
 * its cities, and somewhere to read a ping — and it becomes one.
 *
 * Two of the three rules carry over unchanged: the population one weighs a
 * state's own probes, the ruler measures from its biggest city. The capital one
 * does not, and this says so rather than inventing something: Natural Earth
 * flags national capitals at this scale and not state ones, so a state under
 * the capital rule reads its largest city instead — which for a state is the
 * same claim anyway. California is Los Angeles, Texas is Houston, New York is
 * New York.
 */
const STATES = process.argv.includes('--states');
const ADMIN1 = process.env.NE_ADMIN1 ||
  path.join(path.dirname(GEO), 'ne_admin1.geojson');
const STATE_OF_CITY = {};   // normalised city name -> "us-tx"
if (STATES && fs.existsSync(ADMIN1) && fs.existsSync(PLACES)) {
  const byName = {};
  JSON.parse(fs.readFileSync(ADMIN1, 'utf8')).features.forEach(f => {
    const p = f.properties;
    if (String(p.iso_a2 || '').toUpperCase() !== 'US') return;
    const postal = String(p.postal || '').toLowerCase();
    if (!postal || postal.length !== 2) return;
    const code = 'us-' + postal;
    byName[String(p.name || '')] = code;
    const c = centroidOf(f);
    if (c) CENTRE[code] = c;
  });
  JSON.parse(fs.readFileSync(PLACES, 'utf8')).features.forEach(f => {
    const pr = f.properties;
    if (String(pr.ISO_A2 || '') !== 'US' || !f.geometry) return;
    const code = byName[String(pr.ADM1NAME || '')];
    if (!code) return;
    const pop = +pr.POP_MAX || 0;
    const [lon, lat] = f.geometry.coordinates;
    STATE_OF_CITY[norm(pr.NAME)] = code;
    if (pop) (CITIES[code] = CITIES[code] || []).push({ pop, lat, lon });
    CITY_AT[norm(pr.NAME) + '|' + code] = { lat, lon };
    if (pop >= TOWN_MIN) (TOWNS[code] = TOWNS[code] || []).push({ pop, lat, lon });
  });
  // A state's stand-in for a capital is its biggest city — see the note above.
  Object.values(byName).forEach(code => {
    const cs = CITIES[code];
    if (!cs || !cs.length) return;
    const big = cs.slice().sort((a, b) => b.pop - a.pop)[0];
    const at = Object.keys(CITY_AT).find(k => k.endsWith('|' + code) &&
      CITY_AT[k].lat === big.lat && CITY_AT[k].lon === big.lon);
    if (at) CAPITAL[code] = at.slice(0, at.lastIndexOf('|'));
  });
}
// The best-connected big city a country has, which is where somebody choosing
// that country would live. Nearest city over a million to the server, largest
// where the country has none.
function anchor(code, to) {
  const cs = CITIES[code];
  if (!cs || !cs.length) return CENTRE[code] || null;
  const big = cs.filter(c => c.pop >= 1000000);
  const use = big.length ? big : [cs.slice().sort((a, b) => b.pop - a.pop)[0]];
  return use.reduce((b, c) => (km(c, to) < km(b, to) ? c : b));
}
/* And the far end of the same country, which is what the outlier guard has to
   judge against.

   Judging a probe against the country's nearest city calls the United States
   broken four times over from Dallas — Honolulu, Portland, Spokane, Roseburg
   are not misrouted, they are simply four thousand kilometres away, and the
   country was anchored on Houston. A country is only suspicious when a probe
   beats what its own farthest city could explain. */
function farthest(code, to) {
  const cs = CITIES[code];
  if (!cs || !cs.length) return CENTRE[code] || null;
  const big = cs.filter(c => c.pop >= 1000000);
  const use = big.length ? big : cs;
  return use.reduce((b, c) => (km(c, to) > km(b, to) ? c : b));
}

const median = xs => {
  const s = xs.slice().sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

// ---- one server ------------------------------------------------------------
function build(regKey) {
  const srv = SERVERS[regKey];
  const src = JSON.parse(fs.readFileSync(path.join(HERE, srv.file), 'utf8'));
  const byCountry = {};
  src.rows.forEach(([city, code, ms]) => {
    // An American probe belongs to its state when the map is drawn by state.
    const key = (STATES && code === 'us' && STATE_OF_CITY[norm(city)]) || code;
    (byCountry[key] = byCountry[key] || []).push({ city, ms });
  });

  // A first pass over the countries a probe covers, to fit the model that fills
  // the rest and to judge which probes are broken.
  const first = {};
  Object.keys(byCountry).forEach(c => { first[c] = median(byCountry[c].map(r => r.ms)); });

  const fitPts = [];
  Object.keys(first).forEach(c => {
    const a = anchor(c, srv);
    if (a) fitPts.push({ c, d: km(a, srv), ping: first[c] });
  });
  const n = fitPts.length;
  const sx = fitPts.reduce((s, p) => s + p.d, 0);
  const sy = fitPts.reduce((s, p) => s + p.ping, 0);
  const sxx = fitPts.reduce((s, p) => s + p.d * p.d, 0);
  const sxy = fitPts.reduce((s, p) => s + p.d * p.ping, 0);
  let b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  let a0 = (sy - b * sx) / n;
  const r2Of = () => {
    const m = sy / n;
    const tot = fitPts.reduce((s, p) => s + (p.ping - m) ** 2, 0);
    const res = fitPts.reduce((s, p) => s + (a0 + b * p.d - p.ping) ** 2, 0);
    return 1 - res / tot;
  };
  /* Where a region's own matrix cannot produce a line, borrow the slope and fit
     only the height.

     Two of the seven do not: Tokyo comes out at R2 0.31 and Manama at 0.09,
     which is not a curve, it is a cloud. The Middle East is the honest reason —
     Beirut answers a server 1,600 km away in 309 ms, Baghdad in 162, New Delhi
     in 245 against Bangalore's 72 — so routing there is not a function of
     distance and a line fitted through it says nothing.

     What does not vary between regions is what a kilometre of fibre costs, and
     Europe is where we can actually measure it: 250 probes, R2 0.88, a slope of
     0.0182 ms per km against the 0.010 that light in glass would give — so the
     real path is about 1.8 times the great circle. That factor is physics and
     cable, not local peering, so it carries. The height does not, and is fitted
     on the region's own probes: that is what local access actually costs, and in
     the Gulf it costs a lot.

     Stated rather than hidden — every table prints which of the two it used. */
  const EU_SLOPE = 0.01817;
  let slopeFrom = 'its own probes';
  if (n < 8 || !(r2Of() >= 0.5)) {
    const was = r2Of().toFixed(3);
    b = EU_SLOPE;
    /* The height by the median residual rather than by least squares.

       A mean is pulled by exactly the probes that made the line unusable in the
       first place — Beirut at 309 ms drags the whole Gulf up by itself, and the
       outlier guard cannot help because the guard reads the model it is poisoning.
       The median cannot be dragged: half the probes have to be wrong before it
       moves, and half of them are not. */
    a0 = median(fitPts.map(p => p.ping - b * p.d));
    slopeFrom = 'Europe, height by median residual (its own line was R2 ' + was + ')';
  }
  const model = d => Math.max(1, a0 + b * d);

  // Second pass: drop the probes the model says cannot be real, then take the
  // capital's if there is one and the median of what is left if there is not.
  const dropped = [];
  const out = {}, how = {};
  Object.keys(byCountry).forEach(c => {
    const anc = farthest(c, srv);
    const expect = anc ? model(km(anc, srv)) : null;
    const kept = byCountry[c].filter(r => {
      if (expect && r.ms > expect * OUTLIER) {
        dropped.push({ c, city: r.city, ms: r.ms, expect: Math.round(expect) });
        return false;
      }
      return true;
    });
    if (!kept.length) return;
    if (RULE === 'people') {
      const w = byPeople(c, kept);
      if (w != null) { out[c] = w; how[c] = 'people over ' + kept.length; }
      else { out[c] = median(kept.map(r => r.ms)); how[c] = 'median of ' + kept.length; }
      return;
    }
    const cap = CAPITAL[c] && kept.find(r => norm(r.city) === CAPITAL[c]);
    if (cap) { out[c] = cap.ms; how[c] = 'capital ' + cap.city; }
    else { out[c] = median(kept.map(r => r.ms)); how[c] = 'median of ' + kept.length; }
  });

  const r2 = (() => {
    const pts = Object.keys(out).map(c => {
      const anc = anchor(c, srv);
      return anc ? { d: km(anc, srv), ping: out[c] } : null;
    }).filter(Boolean);
    const m = pts.reduce((s, p) => s + p.ping, 0) / pts.length;
    const tot = pts.reduce((s, p) => s + (p.ping - m) ** 2, 0);
    const res = pts.reduce((s, p) => s + (model(p.d) - p.ping) ** 2, 0);
    return 1 - res / tot;
  })();

  return { srv, out, how, model, dropped, fit: { a: a0, b, n, r2, slopeFrom } };
}

// ---- what each map needs ---------------------------------------------------
// Europe's list is CC_COUNTRIES; the other six are the region tables. Read out
// of index.html so the two cannot drift apart.
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mTable = /const CC_COUNTRIES=\[([\s\S]*?)\];/.exec(SRC);
if (!mTable) { console.error('CC_COUNTRIES not found'); process.exit(1); }
const mRegions = /const CC_REGION_PINGS=JSON\.parse\((\"[\s\S]*?\")\);/.exec(SRC);
if (!mRegions) { console.error('CC_REGION_PINGS not found'); process.exit(1); }

const WANT = { EU: [...mTable[1].matchAll(/\{c:'([a-z]{2})',ping:(\d+)\}/g)]
                     .map(m => ({ c: m[1], was: +m[2] })) };
const oldRegions = JSON.parse(eval(mRegions[1]));
Object.keys(oldRegions).forEach(r => {
  WANT[r] = oldRegions[r].map(o => ({ c: o.c, was: o.ping }));
});

const ORDER = ['EU', 'NAC', 'NAW', 'BR', 'ASIA', 'ME', 'OCE'];
const RESULT = {};
ORDER.forEach(reg => {
  if (!SERVERS[reg] || !WANT[reg]) return;
  if (!fs.existsSync(path.join(HERE, SERVERS[reg].file))) {
    console.log('\n' + reg + ': no measured table yet (' + SERVERS[reg].file + ') — left alone');
    return;
  }
  const built = build(reg);
  console.log('\n===== ' + reg + ' — ' + built.srv.name + ' =====');
  console.log('probes cover ' + Object.keys(built.out).length + ' countries; fill model ping = ' +
              built.fit.a.toFixed(2) + ' + ' + built.fit.b.toFixed(5) + ' * km (R2 ' +
              built.fit.r2.toFixed(3) + ' on ' + built.fit.n + ', slope from ' + built.fit.slopeFrom + ')');
  if (built.dropped.length) {
    console.log('dropped as broken (over ' + OUTLIER + 'x the model):');
    built.dropped.forEach(d => console.log('  ' + d.c + '  ' + d.city + '  ' + d.ms +
      ' ms, model says about ' + d.expect));
  }
  const rows = WANT[reg].map(w => {
    // The ruler answers for everybody or for nobody: mixing it with probes would
    // be a third rule rather than a version of the map.
    if (RULE === 'km60') {
      const d = byRuler(w.c, built.srv);
      return { c: w.c, was: w.was,
               now: d == null ? w.was : Math.max(1, Math.round(d)),
               how: d == null ? 'kept — no geometry' : 'ruler' };
    }
    const measured = built.out[w.c];
    let ms, how;
    if (measured != null) { ms = measured + LAST_MILE; how = built.how[w.c]; }
    else {
      const anc = anchor(w.c, built.srv);
      if (!anc) { ms = w.was; how = 'kept — no geometry'; }
      else { ms = built.model(km(anc, built.srv)) + LAST_MILE; how = 'model'; }
    }
    return { c: w.c, was: w.was, now: Math.max(1, Math.round(ms)), how };
  });
  rows.sort((a, b) => a.now - b.now);
  console.log('  cc   was   now   delta   from');
  rows.forEach(r => console.log('  ' + r.c + '   ' + String(r.was).padStart(3) + '   ' +
    String(r.now).padStart(3) + '   ' + (r.now - r.was > 0 ? '+' : '') +
    String(r.now - r.was).padStart(4) + '   ' + r.how));
  const real = rows.filter(r => !/^model|^kept/.test(r.how)).length;
  const moved = rows.filter(r => Math.abs(r.now - r.was) >= 10).length;
  console.log(real + ' of ' + rows.length + ' off a probe; ' + moved + ' move by 10 ms or more');
  RESULT[reg] = { server: built.srv, fit: built.fit, dropped: built.dropped,
                  rows: rows.map(r => ({ c: r.c, ping: r.now, from: r.how })) };
});

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, RULE === 'people' ? 'ping-measured-people.json' : RULE === 'km60' ? 'ping-measured-km60.json' : 'ping-measured.json'),
    JSON.stringify({ lastMile: LAST_MILE, outlier: OUTLIER, regions: RESULT }, null, 1));
  console.log('\nwrote tools/ping-measured.json');
}
