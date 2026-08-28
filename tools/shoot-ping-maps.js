/* A picture of every ping map, so the numbers can be read rather than trusted.
 *
 * Renders ccBuildMap for each of the seven regions against the real page — the
 * same function the creation screen calls, so what comes out is what a player
 * sees — and writes a PNG per region.
 *
 *   node tools/shoot-ping-maps.js [outDir]
 *
 * Flags come off flagcdn.com, so this needs the network and takes a few seconds
 * a map while they land.
 */
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const OUT = ARGS[0] || path.join(os.homedir(), 'Desktop', 'пинги');
/* A table to draw instead of the one in the page.
 *
 * The two rules for turning a country's probes into one number — its capital,
 * or the average of the people who live there — are worth looking at side by
 * side rather than argued about, and neither has to be committed to the file to
 * be seen. --table points at either build-ping-measured output and the numbers
 * are pushed into CC_COUNTRIES and CC_REGION_PINGS before the map is drawn. */
const TABLE = (process.argv.find(a => a.startsWith('--table=')) || '').split('=')[1] || null;
const LABEL = (process.argv.find(a => a.startsWith('--label=')) || '').split('=')[1] || '';
const OVERRIDE = TABLE ? JSON.parse(fs.readFileSync(path.resolve(TABLE), 'utf8')) : null;
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const REGIONS = [
  { key: 'EU',   file: '1-europe-frankfurt' },
  { key: 'NAC',  file: '2-na-central-dallas' },
  { key: 'NAW',  file: '3-na-west-oregon' },
  { key: 'BR',   file: '4-brazil-sao-paulo' },
  { key: 'ASIA', file: '5-asia-tokyo' },
  { key: 'ME',   file: '6-middle-east-bahrain' },
  { key: 'OCE',  file: '7-oceania-sydney' }
];

const WIDTH = 1600;
fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* Each map has its own frame, so the window has to be cut to it.
 *
 * ccBuildMap draws into a viewBox of 1000 by the map's own H, and the seven Hs
 * are not the same — Europe is wide and shallow, Asia is nearly square. Shot at
 * one fixed height, the tall ones lose North Africa off the bottom, which is
 * exactly the part of the European map somebody would want to read. So the
 * heights are asked for first and every picture is cut to its own map. */
function heights() {
  const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const done = () => {
    const h = {};
    try {
      ${JSON.stringify(REGIONS.map(r => r.key))}.forEach(function(reg){
        const m = ccMapHere(reg);
        h[reg] = m ? m.H : null;
      });
    } catch (e) { h.err = String(e && e.message || e); }
    document.getElementById('__out').textContent =
      'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(h)) + 'PE' + 'ND';
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(done); else done();
})();
<\/script>`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shoth-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=30000', '--dump-dom',
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  return m ? JSON.parse(decodeURIComponent(m[1])) : {};
}
const H = heights();
console.log('map frames: ' + REGIONS.map(r => r.key + ' ' + H[r.key]).join(', ') + '\n');

REGIONS.forEach(r => {
  /* The page as it is, with everything but the map taken off the screen. The
     title line is drawn in so a picture is readable on its own — which server
     it is to, and how many of its countries came off a probe rather than off
     the model. */
  const BOOT = `
<style>
  html,body{background:#0b1020!important;margin:0!important;padding:0!important;overflow:hidden!important}
  body>*{display:none!important}
  #shot{display:block!important;position:fixed;inset:0;background:#0b1020;padding:18px 20px 20px;
        font:600 20px/1.3 system-ui,sans-serif;color:#dbe6ff}
  #shot .cc-map{width:100%;height:auto;display:block;margin-top:12px}
  #shot h1{font-size:22px;margin:0}
  #shot p{font:400 14px/1.4 system-ui,sans-serif;color:#8fa3c8;margin:5px 0 0}
</style>
<div id="shot"><h1></h1><p></p><div id="shotmap"></div></div>
<script>
(function(){
  const draw = () => {
    try {
      CAREER = null;
      /* The alternative table, pushed in rather than assigned: both are const,
         and a const array can still be emptied and refilled. */
      const over = ${OVERRIDE ? 'JSON.parse(' + JSON.stringify(JSON.stringify(OVERRIDE.regions)) + ')' : 'null'};
      if (over) Object.keys(over).forEach(function(k){
        const rows = over[k].rows.map(function(x){ return {c: x.c, ping: x.ping}; });
        if (k === 'EU') { CC_COUNTRIES.length = 0; rows.forEach(function(x){ CC_COUNTRIES.push(x); }); }
        else CC_REGION_PINGS[k] = rows;
      });
      const reg = ${JSON.stringify(r.key)};
      document.querySelector('#shot h1').textContent = ${JSON.stringify(LABEL ? LABEL + ' · ' : '')} +
        ${JSON.stringify(r.key)} + ' — ' +
        (${JSON.stringify(r.key)} === 'EU' ? 'Frankfurt' : {NAC:'Dallas', NAW:'Oregon',
          BR:'Sao Paulo', ASIA:'Tokyo', ME:'Bahrain', OCE:'Sydney'}[reg]);
      const list = reg === 'EU' ? CC_COUNTRIES : CC_REGION_PINGS[reg];
      document.querySelector('#shot p').textContent =
        list.length + ' countries, ' + Math.min.apply(null, list.map(x=>x.ping)) + '-' +
        Math.max.apply(null, list.map(x=>x.ping)) + ' ms';
      document.getElementById('shotmap').innerHTML = ccBuildMap('void 0', reg);
      window.__ready = 1;
    } catch (e) { window.__err = String(e && e.message || e); window.__ready = 1; }
  };
  if (typeof ccMapsReady === 'function') ccMapsReady(draw); else draw();
})();
<\/script>`;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
  const png = path.join(OUT, r.file + '.png');
  // The map at this width, plus the two title lines above it and the padding.
  const inner = WIDTH - 40;
  const tall = Math.round(inner * ((H[r.key] || 700) / 1000)) + 18 + 26 + 20 + 12 + 20;
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--hide-scrollbars',
    '--virtual-time-budget=40000', '--window-size=' + WIDTH + ',' + tall,
    '--screenshot=' + png, 'file:///' + tmp.replace(/\\/g, '/')],
    { stdio: ['ignore', 'ignore', 'ignore'] });
  fs.rmSync(dir, { recursive: true, force: true });
  const size = fs.existsSync(png) ? fs.statSync(png).size : 0;
  console.log((size ? '  ok   ' : '  FAIL ') + r.file + '.png  ' +
              (size ? Math.round(size / 1024) + ' KB' : 'nothing written'));
});
console.log('\n' + OUT);
