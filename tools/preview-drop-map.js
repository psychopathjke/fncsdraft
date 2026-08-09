// Draws the Finals drop map for a set with a full 33-trio field scattered over
// its zones, and saves a screenshot. The nickname layout is the thing being
// checked, and arithmetic cannot check whether a name is readable.
//
//   node tools/preview-drop-map.js t3 /tmp/drop-t3.png
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SET = process.argv[2] || 't3';
const OUT = process.argv[3] || path.join(os.tmpdir(), 'drop-' + SET + '.png');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const SIZE = SET === 'm1' || SET === 'm2' ? 2 : 3;
const BOOTSTRAP = `
<div id="__preview" style="width:760px;padding:12px;background:#0b1117;"></div>
<script>
(function(){
  var set = ${JSON.stringify(SET)};
  var size = ${SIZE};
  CARD_SET = set; CARD_MODE = true; squadSize = size;
  useLandingSet(set);
  var roster = cardRosterPlayers(set).filter(function(p){ return p.region === 'EU'; })
                 .sort(function(a,b){ return b.rating - a.rating; });
  var teams = [];
  for (var i = 0; i + size <= roster.length && teams.length < (size === 2 ? 50 : 33); i += size) {
    var sq = roster.slice(i, i + size);
    var t = buildTeam(sq); t.name = teamLabel(sq); teams.push(t);
  }
  teams[0].isYou = true;
  // Scatter them the way pickInitialZone would: most zones get one squad, a few
  // get two or three, which is what makes the layout hard.
  var groups = new Map();
  teams.forEach(function(t, i){
    var z = ALL_LANDING_ZONES[i % ALL_LANDING_ZONES.length];
    if (!groups.has(z)) groups.set(z, []);
    groups.get(z).push(t);
  });
  var host = document.getElementById('__preview');
  host.innerHTML = '<div class="map-frame" style="position:relative;width:100%;' +
    'aspect-ratio:' + (MAP_ASPECT[set] || '1100/970') + ';border-radius:8px;background:#000;' +
    'border:1px solid #263141;overflow:hidden;">' +
    '<img src="' + (MAP_ART[set] || '') + '" style="position:absolute;inset:0;width:100%;height:100%;' +
    'object-fit:cover;display:block;">' +
    '<div id="__layer" style="position:absolute;inset:0;"></div></div>';
  var layer = document.getElementById('__layer');
  ALL_LANDING_ZONES.forEach(function(z){
    var group = groups.get(z);
    var plot = document.createElement('div');
    plot.className = 'land-zone' + (group ? ' taken contested' : '');
    plot.style.left = z.x + '%'; plot.style.top = z.y + '%';
    plot.style.width = z.w + '%'; plot.style.height = z.h + '%';
    plot.style.zIndex = group ? '40' : '20';
    if (group) {
      if (group.length >= 2) {
        plot.style.borderColor = '#ff3b3b'; plot.style.background = 'rgba(255,59,59,.30)';
      } else {
        plot.style.borderColor = 'rgba(255,255,255,.85)'; plot.style.background = 'rgba(10,14,20,.55)';
      }
      fillZoneNames(plot, group, z);
    } else {
      plot.style.borderColor = '#0a0a0a'; plot.style.background = 'rgba(0,0,0,.55)';
      var lab = document.createElement('div');
      lab.className = 'land-zone-label';
      lab.textContent = L().landingPoints(z.points);
      plot.appendChild(lab);
    }
    layer.appendChild(plot);
  });
  document.body.style.background = '#0b1117';
  ['screen-menu','screen-preregion','screen-draft','screen-results','screen-map']
    .forEach(function(id){ var el = document.getElementById(id); if (el) el.style.display = 'none'; });
  document.querySelectorAll('body > *:not(#__preview):not(script)')
    .forEach(function(el){ el.style.display = 'none'; });
  host.style.display = 'block';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
// The map art is a relative path, so the page has to be served from the repo
// root for the island to show up under the boxes.
fs.copyFileSync(tmp, path.join(ROOT, '__map-preview.html'));

execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--window-size=820,900',
  '--screenshot=' + OUT,
  'file:///' + path.join(ROOT, '__map-preview.html').replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
fs.unlinkSync(path.join(ROOT, '__map-preview.html'));
console.log('wrote', OUT);
