// Screenshots the qualification card for each LAN, so the flag treatment is
// looked at rather than imagined.
//
//   node tools/preview-qual-card.js fr /tmp/qual-fr.png
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FLAG = process.argv[2] || 'fr';
const OUT = process.argv[3] || path.join(os.tmpdir(), 'qual-' + FLAG + '.png');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const TITLES = {
  fr: ['celLyonTitle', 'celLyonSub'],
  be: ['celWorldsTitle', 'celWorldsSub'],
  de: ['celLanTitle', 'celLanSub']
};
const BOOTSTRAP = `
<script>
(function(){
  var t = ${JSON.stringify(TITLES[FLAG] || TITLES.fr)};
  skipAnimation = false;
  // celebrate() removes itself after a couple of seconds, so the card is rebuilt
  // here from the same markup with the animations frozen at their end state.
  var tone = QUAL_FLAGS[${JSON.stringify(FLAG)}];
  var ov = document.createElement('div');
  ov.className = 'qual-overlay';
  ov.style.setProperty('--q1', tone.q1); ov.style.setProperty('--q2', tone.q2);
  ov.style.setProperty('--q3', tone.q3); ov.style.setProperty('--qglow', tone.glow);
  ov.style.setProperty('--qflag', tone.bands);
  var words = String(L()[t[0]]).split(/\\s+/).map(function(w){
    return '<span class="qw" style="animation:none;opacity:1;">' + w + '</span>';
  }).join(' ');
  ov.innerHTML = '<div class="qual-punch" style="animation:none;">' +
    '<div class="qual-card qual-flag" style="animation:none;">' +
    '<div class="qual-kicker" style="animation:none;">' + L().celKicker + '</div>' +
    '<div class="qual-title">' + words + '</div>' +
    '<div class="qual-sub" style="animation:none;opacity:1;">' + L()[t[1]] + '</div>' +
    '<div class="qual-bar" style="animation:none;transform:scaleX(1);"></div>' +
    '</div></div>';
  document.body.appendChild(ov);
  var sweep = document.createElement('style');
  sweep.textContent = '.qual-card::after{display:none;} .qual-overlay{position:fixed;}';
  document.head.appendChild(sweep);
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qual-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOTSTRAP);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=20000', '--window-size=900,520', '--screenshot=' + OUT,
  'file:///' + tmp.replace(/\\/g, '/')], { encoding: 'utf8' });
console.log('wrote', OUT);
