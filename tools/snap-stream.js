// Снимки эфира: вкладка стримов с аватарками креаторов и кнопкой «стримить
// турнир», плюс само окошко трансляции поверх вечера.
//
//   node tools/snap-stream.js [out-prefix]
// Пишет <prefix>-tab.png и <prefix>-window.png (по умолчанию во временную папку).
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PRE = process.argv[2] || path.join(os.tmpdir(), 'stream');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const save = `
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

const shots = [
  { name: 'tab', h: 1100, boot: save + `
    careerTab('streams');` },
  { name: 'window', h: 900, boot: save + `
    careerTab('centre');
    CC_STREAM_LIVE = true;
    ccTvMiniOpen({label:'КУБОК ДИВИЗИОНА 1'});
    CC_TV_YOU = {name:'KEEGORKA & FITO', stagePts:174, stageElims:14, wins:1,
      stageLog:[{game:1,place:3},{game:2,place:1},{game:3,place:22},{game:4,place:6},
                {game:5,place:2},{game:6,place:11}]};
    CC_TV_RUN = {teams:[CC_TV_YOU,
        {name:'MALIBUCA & VIC0', stagePts:191, wins:2},
        {name:'SKY & SCROLL', stagePts:180, wins:1},
        {name:'TH0MASHD & FOCUS', stagePts:166, wins:1},
        {name:'PABLOWINGU & TJINO', stagePts:140, wins:0}],
      pts:'stagePts', n:11, cut:3};
    ccTvMiniTick(); ccTvMiniTick();` }
];

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
shots.forEach(sh => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapstream-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, BASE + src + '<script>(function(){' + sh.boot + '})();<\/script>');
  const out = PRE + '-' + sh.name + '.png';
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--virtual-time-budget=20000',
    '--window-size=1440,' + sh.h, '--screenshot=' + out,
    'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
  console.log('wrote ' + out);
  fs.rmSync(dir, { recursive: true, force: true });
});
