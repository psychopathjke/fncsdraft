/* What a month costs to live in a country nobody has priced yet.

   CC_RENT carries 45 European countries and roughly what a flat costs there a
   month. Those are real, approximate and said to be approximate. On 19 August
   the map grew to North Africa and Central Asia — 23 countries with no rent at
   all, which the apartment shop cannot price and check-career-move catches.

   Rather than invent 23 numbers, fit the 45 that exist. Rent tracks how rich a
   country is, and Natural Earth carries GDP and population per country, so this
   fits rent against GDP per head on a log-log line and reads the rest off it.

     node tools/build-rent-fit.js             # print the fit and its residuals
     node tools/build-rent-fit.js --write     # write tools/rent-fit.json
*/
const fs = require('fs'), path = require('path');

const GEO = process.env.NE_GEOJSON ||
  path.join(process.env.LOCALAPPDATA || '', 'Temp', 'claude', 'C--Users-FoxOS-User',
            'dd383854-0ff2-4c46-9ee3-dfbeae8175a0', 'scratchpad', 'ne_50m.geojson');
if (!fs.existsSync(GEO)) { console.error('missing ' + GEO); process.exit(2); }

const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mR = /const CC_RENT=\{([\s\S]*?)\};/.exec(SRC);
if (!mR) { console.error('CC_RENT not found'); process.exit(1); }
const RENT = {};
[...mR[1].matchAll(/([a-z]{2}):\s*(\d+)/g)].forEach(m => { RENT[m[1]] = +m[2]; });

const mC = /const CC_COUNTRIES=\[([\s\S]*?)\];/.exec(SRC);
const ONMAP = new Set([...mC[1].matchAll(/\{c:'([a-z]{2})'/g)].map(m => m[1]));
// And everybody on the other six maps: a career in Oceania rents a flat too.
// Read off what built them rather than back out of the page they were put in.
const RM = path.join(__dirname, 'region-maps.json');
if (fs.existsSync(RM)) {
  const tbl = JSON.parse(fs.readFileSync(RM, 'utf8')).pings;
  Object.keys(tbl).forEach(r => tbl[r].forEach(e => ONMAP.add(e.c)));
}

// GDP per head, in thousands of dollars. GDP_MD is millions, POP_EST is people.
const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));
const GDPC = {};
geo.features.forEach(f => {
  const p = f.properties;
  const c = String(p.ISO_A2_EH || p.ISO_A2 || '').toLowerCase();
  const gdp = +p.GDP_MD, pop = +p.POP_EST;
  if (!c || c.length !== 2 || !(gdp > 0) || !(pop > 1000)) return;
  if (GDPC[c] == null) GDPC[c] = gdp * 1e6 / pop / 1000;
});

// log(rent) = a + b * log(gdp per head). Rich and poor countries differ by a
// factor, not by a fixed number of dollars, so the line belongs in logs.
const pts = [];
Object.keys(RENT).forEach(c => {
  if (GDPC[c] > 0) pts.push({ c, x: Math.log(GDPC[c]), y: Math.log(RENT[c]) });
});
const n = pts.length;
const sx = pts.reduce((s, p) => s + p.x, 0), sy = pts.reduce((s, p) => s + p.y, 0);
const sxx = pts.reduce((s, p) => s + p.x * p.x, 0), sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
const b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
const a = (sy - b * sx) / n;

// Rents are quoted to the nearest fifty, the way the written-in ones are.
const rentOf = g => Math.max(150, Math.round(Math.exp(a + b * Math.log(g)) / 50) * 50);
const resid = pts.map(p => {
  const fit = rentOf(Math.exp(p.x));
  return { c: p.c, real: Math.round(Math.exp(p.y)), fit, err: fit - Math.round(Math.exp(p.y)) };
});
const meanY = sy / n;
const ssTot = pts.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
const ssRes = pts.reduce((s, p) => s + (a + b * p.x - p.y) ** 2, 0);
console.log('countries priced by hand: ' + n);
console.log('fit:  rent = exp(' + a.toFixed(3) + ') * gdpPerHead^' + b.toFixed(3));
console.log('      R2 (in logs) = ' + (1 - ssRes / ssTot).toFixed(3) +
            '   mean abs error = $' +
            (resid.reduce((s, p) => s + Math.abs(p.err), 0) / n).toFixed(0));

resid.sort((p, q) => Math.abs(q.err) - Math.abs(p.err));
console.log('\nworst 6 (fit vs written in):');
resid.slice(0, 6).forEach(p =>
  console.log('  ' + p.c + '  written $' + String(p.real).padStart(4) +
              '   fit $' + String(p.fit).padStart(4) +
              '   ' + (p.err > 0 ? '+' : '') + p.err));

const missing = [...ONMAP].filter(c => RENT[c] == null);
const priced = [];
missing.forEach(c => {
  if (!(GDPC[c] > 0)) { console.log('  no GDP for ' + c); return; }
  priced.push({ c, rent: rentOf(GDPC[c]) });
});
priced.sort((x, y) => x.rent - y.rent);
console.log('\npriced off the fit (' + priced.length + ' of ' + missing.length + '):');
console.log('  ' + priced.map(p => p.c + ' $' + p.rent).join('  '));

if (process.argv.includes('--write')) {
  fs.writeFileSync(path.join(__dirname, 'rent-fit.json'),
    JSON.stringify({ a, b, priced }, null, 1));
  console.log('\nwrote tools/rent-fit.json');
}
