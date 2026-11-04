// Сильные команды лобби не сидят на самых бедных точках весь сезон.
// Меряется поле из 50 дуо с разной силой: двенадцать турниров подряд в карьере, разные очереди выбора.
//   node tools/check-drop-strong-floor.js [set]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const SET = process.argv[2] || 'm2';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const HEAD = `<base href="file:///${ROOT}/"><script>window.__errs=[];addEventListener('error',e=>__errs.push(e.message+' @'+e.lineno));<\/script>`;
const BOOT = `<pre id="__out" style="display:none"></pre><script>
(async function(){
  const out = { rows: [], errs: null, fail: null };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    squadSize = 2;
    useLandingSet(${JSON.stringify(SET)});
    await wait(50);
    const N = 50, EVENTS = 12, SEEDS = 8;
    const zonePts = ALL_LANDING_ZONES.map(z => z.points || 0).sort((a, b) => a - b);
    out.sets = Object.keys(ZONE_SETS).map(k => k + ':' + ZONE_SETS[k].length).join(' '); out.active = ACTIVE_LANDING_SET;
    out.zones = { n: zonePts.length, counts: zonePts.reduce((m, p) => { m[p] = (m[p] || 0) + 1; return m; }, {}) };
    const tot = { first: { top10: 0, top10low: 0, top25: 0, top25low: 0, bot25: 0, n: 0 }, last: { top10: 0, top10low: 0, top25: 0, top25low: 0, bot25: 0, n: 0 } };
    let strongMoves = 0, strongRows = 0;
    for (let s = 0; s < SEEDS; s++) {
      CAREER = { career: { season: 1 + s, day: '2025-01-10' } };
      const field = [];
      for (let i = 0; i < N; i++) field.push({ name: 'T' + s + '_' + i, pow: 116 - i * 0.6, closeEdge: 0, stagePts: 0, squad: [{ handle: 'b' + s + '_' + i + 'a', rating: 60 }, { handle: 'b' + s + '_' + i + 'b', rating: 60 }] });
      let prev = null;
      for (let e = 0; e < EVENTS; e++) {
        const day = '2025-0' + (1 + (e % 9)) + '-1' + (e % 10);
        CAREER.career.day = day;
        field.forEach((t, i) => { t.stagePts = (i * 37 + e * 101 + s * 13) % 97; });
        CC_DROP_STAGE = day + '|' + (1 + s) + '|s1|total';
        buildBotLandingAssignment(field);
        const pts = field.map(t => t.landingZone ? t.landingZone.points || 0 : 0), at = field.map(t => t.landingZone ? t.landingZone.x + ',' + t.landingZone.y : '?');
        if (prev) { for (let i = 0; i < 24; i++) { if (at[i] !== prev[i]) strongMoves++; strongRows++; } }
        prev = at;
        const low = zonePts[0];   // самый бедный уровень очков
        const put = b => {
          for (let i = 0; i < 10; i++) { b.top10 += pts[i]; if (pts[i] <= low) b.top10low++; }
          for (let i = 0; i < 25; i++) { b.top25 += pts[i]; if (pts[i] <= low) b.top25low++; }
          for (let i = 25; i < 50; i++) b.bot25 += pts[i];
          b.n++;
        };
        if (e === 0) put(tot.first);
        if (e === EVENTS - 1) put(tot.last);
      }
    }
    const fmt = b => ({ top10: +(b.top10 / b.n / 10).toFixed(2), top10low: +(b.top10low / b.n).toFixed(2), top25: +(b.top25 / b.n / 25).toFixed(2), top25low: +(b.top25low / b.n).toFixed(2), bot25: +(b.bot25 / b.n / 25).toFixed(2) });
    out.first = fmt(tot.first); out.last = fmt(tot.last); out.strongMoves = strongMoves; out.strongRows = strongRows;
    // Как в карьере: сперва кубки в перемешанных лобби из пула 100, потом финал верхних 50.
    const fin = { top4: 0, top10: 0, top25: 0, top4low: 0, top10low: 0, top25low: 0, n: 0 };
    for (let s = 0; s < 24; s++) {
      CAREER = { career: { season: 50 + s, day: '2025-01-10' } };
      const pool = [];
      for (let i = 0; i < 100; i++) pool.push({ name: 'P' + s + '_' + i, pow: 116 - i * 0.3, closeEdge: 0, stagePts: 0, squad: [{ handle: 'p' + s + '_' + i + 'a', rating: 60 }, { handle: 'p' + s + '_' + i + 'b', rating: 60 }] });
      for (let e = 0; e < 4; e++) {
        const day = '2025-02-1' + e;
        CAREER.career.day = day;
        const r = careerRng(ccHashStr('mix|' + s + '|' + e)), mixed = pool.map(x => [r(), x]).sort((u, v) => u[0] - v[0]).map(x => x[1]);
        for (let l = 0; l < 2; l++) {
          const lobby = mixed.slice(l * 50, l * 50 + 50);
          lobby.forEach((x, i) => { x.stagePts = (i * 37 + e * 101) % 97; });
          CC_SEATS_REMIX = true;
          CC_DROP_STAGE = day + '|' + (50 + s) + '|l' + l + '|total';
          buildBotLandingAssignment(lobby);
        }
      }
      CC_SEATS_REMIX = false;
      const final = pool.slice(0, 50), day = '2025-03-01';
      CAREER.career.day = day;
      final.forEach((x, i) => { x.stagePts = (i * 53) % 97; });
      CC_DROP_STAGE = day + '|' + (50 + s) + '|final|total';
      buildBotLandingAssignment(final);
      const pts = final.map(x => x.landingZone ? x.landingZone.points || 0 : 0), low = zonePts[0];
      [[4, 'top4'], [10, 'top10'], [25, 'top25']].forEach(([n, k]) => { for (let i = 0; i < n; i++) { fin[k] += pts[i]; if (pts[i] <= low) fin[k + 'low']++; } });
      fin.n++;
    }
    out.final = { top4: +(fin.top4 / fin.n / 4).toFixed(2), top4low: +(fin.top4low / fin.n).toFixed(2), top10: +(fin.top10 / fin.n / 10).toFixed(2), top10low: +(fin.top10low / fin.n).toFixed(2), top25: +(fin.top25 / fin.n / 25).toFixed(2), top25low: +(fin.top25low / fin.n).toFixed(2) };
    CAREER = null;
  } catch (e) { out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BE' + 'GIN' + encodeURIComponent(JSON.stringify(out)) + 'E' + 'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dropfloor-')), tmp = path.join(dir, 'index.html');
let page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (process.env.NO_FLOOR) page = page.replace('if(!CC_SEATS_REMIX && book){\n        const free=', 'if(false){\n        const free=');
fs.writeFileSync(tmp, HEAD + page + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--window-size=1440,1400', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба не запустилась, копия ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });
console.log(JSON.stringify(out, null, 0));
if (out.fail || (out.errs && out.errs.length)) { console.error('FAILED', out.fail, (out.errs || []).slice(0, 3)); process.exit(1); }
if (process.env.FLOOR_GUARD) {
  if (out.last.top10low > +process.env.FLOOR_GUARD) { console.error('топ-10 на бедных точках: ' + out.last.top10low); process.exit(1); }
}
if (out.final.top10low > 0.2) { console.error('топ-10 финала на самых бедных точках: ' + out.final.top10low); process.exit(1); }
console.log('сильные не застревают на самых бедных точках');
