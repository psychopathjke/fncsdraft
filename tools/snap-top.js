// Шапка сайта на разных ширинах: главный экран и хаб карьеры.
// Нужна ровно для одного вопроса — держится ли навбар («Карьера · Драфт ·
// История») в одной строке с логотипом и языками, и что уходит первым, когда
// места не хватает.
//
//   node tools/snap-top.js [out-prefix]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PRE = process.argv[2] || path.join(os.tmpdir(), 'top');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const CAREER = `
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Keegorka',age:17,source:'rookie',country:'rs',countryPing:26,closeRangeEdge:6,
            region:'EU',ovr:88,ovrExact:88.2,potential:96,role:'roleIGL',
            attrs:null,ageEdge:4,photo:null,handle:null,cardRegion:null,nat:null},
    career:{season:1,day:'2026-03-02',division:1,earnings:4200,reach:120000,twitch:64000,
            tokens:[],log:[],news:[]},
    partners:[{card:{handle:'FiTo',region:'EU',tier:'ranked',rating:88,_targetOvr:88},patience:70}]}));
  var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
  s.player.attrs = ccRookieAttrs(88,'roleIGL');
  localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  careerEntry();`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
const shots = [];
[1440, 1280, 1100, 900].forEach(w => {
  shots.push({ name: 'mode-' + w, w: w, h: 620, boot: '' });
  shots.push({ name: 'hub-' + w, w: w, h: 620, boot: CAREER });
});
shots.forEach(sh => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snaptop-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, BASE + src + '<script>(function(){' + sh.boot + '})();<\/script>');
  const out = PRE + '-' + sh.name + '.png';
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--virtual-time-budget=20000',
    '--window-size=' + sh.w + ',' + sh.h, '--screenshot=' + out,
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
  console.log('wrote ' + out);
  fs.rmSync(dir, { recursive: true, force: true });
});
