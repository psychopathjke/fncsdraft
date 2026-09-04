// Снимок церемонии игрока года на экране конца сезона.
//
//   node tools/snap-goty.js [out.png]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'goty.png');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Keegorka',age:17,source:'rookie',country:'rs',countryPing:26,closeRangeEdge:6,
            region:'EU',ovr:88,ovrExact:88.2,potential:96,role:'roleIGL',
            attrs:null,ageEdge:4,photo:null,handle:null,cardRegion:null,nat:null},
    career:{season:1,day:'2026-09-20',division:1,earnings:4200,reach:120000,twitch:64000,
            tokens:[],log:[],news:[]},
    partners:[{card:{handle:'FiTo',region:'EU',tier:'ranked',rating:88,_targetOvr:88},patience:70}]}));
  var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
  s.player.attrs = ccRookieAttrs(88,'roleIGL');
  localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  careerEntry();
  var cr = CAREER.career;
  cr.pr = {rows:{
    'Malibuca':{v:[[820,40],[760,120],[700,200]]},
    'Keegorka':{you:true, v:[[790,50],[720,130],[640,210]]},
    'Vic0':{v:[[700,60],[660,140],[610,220]]},
    'th0masHD':{v:[[640,70],[600,150],[560,230]]},
    'Sky':{v:[[590,80],[560,160],[520,240]]},
    'Scroll':{v:[[520,90],[500,170],[470,250]]}
  }};
  careerAwardSeason();
  cr.seasonOver = true;
  careerTab('centre');`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapgoty-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') +
  '<script>(function(){' + BOOT + '})();<\/script>');
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--allow-file-access-from-files', '--virtual-time-budget=20000',
  '--window-size=1440,1100', '--screenshot=' + OUT,
  'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
fs.rmSync(dir, { recursive: true, force: true });
console.log('wrote ' + OUT);
