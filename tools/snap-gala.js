// Снимки церемонии закрытия сезона: четыре экрана подряд.
//
//   node tools/snap-gala.js [out-prefix]
// Пишет <prefix>-1.png … <prefix>-4.png (по умолчанию во временную папку).
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PRE = process.argv[2] || path.join(os.tmpdir(), 'gala');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

// Год, в котором есть что показать: два мейджора, ЛАН, месячная награда и
// доска PR, по которой считается игрок года.
const SEED = `
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Keegorka',age:17,source:'rookie',country:'rs',countryPing:26,closeRangeEdge:6,
            region:'EU',ovr:88,ovrExact:88.2,potential:96,role:'roleIGL',
            attrs:null,ageEdge:4,photo:null,handle:null,cardRegion:null,nat:null},
    career:{season:1,day:'2026-10-27',division:1,earnings:41200,reach:120000,twitch:64000,
            tokens:[],log:[],news:[]},
    partners:[{card:{handle:'FiTo',region:'EU',tier:'ranked',rating:88,_targetOvr:88},patience:70}]}));
  var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
  s.player.attrs = ccRookieAttrs(88,'roleIGL');
  localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  careerEntry();
  var cr = CAREER.career;
  cr.log = [
    {season:1,day:'2026-03-02',div:1,place:6,of:150,pts:400,ovr:88,games:11,wins:1,elims:38,kind:'cup',prize:0},
    {season:1,day:'2026-04-06',div:1,place:2,of:150,pts:520,ovr:89,games:11,wins:3,elims:52,kind:'cup',prize:1200},
    {season:1,day:'2026-05-24',div:1,place:4,of:33,pts:310,ovr:90,games:9,wins:1,elims:31,kind:'major',stage:'final',prize:9500},
    {season:1,day:'2026-07-19',div:1,place:9,of:75,pts:280,ovr:90,games:10,wins:0,elims:27,kind:'summit',stage:'final',prize:6000},
    {season:1,day:'2026-09-28',div:1,place:3,of:100,pts:460,ovr:91,games:12,wins:2,elims:44,kind:'globals',prize:24500}
  ];
  cr.pr = {rows:{
    'Malibuca':{v:[[820,40],[760,120],[700,200]]},
    'Keegorka':{you:true, v:[[790,50],[720,130],[640,210]]},
    'Vic0':{v:[[700,60],[660,140],[610,220]]},
    'th0masHD':{v:[[640,70],[600,150],[560,230]]},
    'Sky':{v:[[590,80],[560,160],[520,240]]}
  }};
  cr.aw = {last:'2026-10', won:[{kind:'month',key:'2026-05',season:1,name:'Keegorka',you:true}]};
  careerAwardSeason();
  cr.seasonOver = true;
  careerTab('centre');
  ccGalaOpen();`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
[0, 1, 2, 3].forEach(step => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapgala-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, BASE + src + '<script>(function(){' + SEED +
    '\nfor(var k=0;k<' + step + ';k++) ccGalaGo(1);' + '})();<\u002fscript>');
  const out = PRE + '-' + (step + 1) + '.png';
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--virtual-time-budget=20000',
    '--window-size=1280,860', '--screenshot=' + out,
    'file:///' + tmp.split(path.sep).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
  console.log('wrote ' + out);
  fs.rmSync(dir, { recursive: true, force: true });
});
