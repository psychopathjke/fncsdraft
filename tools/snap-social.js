// Снимок экрана соцсети с постами, под которыми лежит таблица вечера, — чтобы
// смотреть глазами, как выглядит скрин стандингов в ленте.
//
//   node tools/snap-social.js [out.png]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'social.png');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script>
(function(){
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Keegorka',age:16,source:'rookie',country:'rs',countryPing:26,closeRangeEdge:6,
            region:'EU',ovr:90,ovrExact:90.4,potential:96,role:'roleIGL',
            attrs:null,ageEdge:4,photo:null,handle:null,cardRegion:null,nat:null},
    career:{season:1,day:'2026-03-10',division:1,earnings:4200,reach:38000,tokens:[],log:[],
      news:[]},
    partner:null}));
  var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
  s.player.attrs = ccRookieAttrs(90,'roleIGL');
  localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  careerEntry();
  var rows=[{p:1,n:'Malibuca + vic0',s:1460,m:22,w:4,e:88},{p:2,n:'Sky + Scroll',s:1301,m:22,w:2,e:74},
            {p:3,n:'Keegorka + FiTo',s:1244,m:22,w:2,e:69},{p:4,n:'Th0masHD + Focus',s:1180,m:22,w:1,e:71},
            {p:5,n:'PabloWingu + Tjino',s:1102,m:22,w:1,e:63}];
  var tbl={div:1, cap:'Division 1 · cup', rows:rows, me:'Keegorka + FiTo', pts:1244,
           sum:{vr:2,t5:9,t10:14,e:69,ae:3.1,ap:8.4}, mode:'Duos'};
  // Другим днём, иначе careerNews снимет одинаковую пятёрку с раннего поста.
  careerNews('good','ccPostPlaced',[3,1,'fito',4],{tbl:tbl, day:'2026-03-09'});
  careerNews('good','ccPostPlaced',[1,1,'vic0',3],{by:{name:'Malibuca',ovr:95,card:{handle:'Malibuca',region:'EU'}},
             tbl:Object.assign({},tbl,{me:'Malibuca + vic0',pts:1460,sum:{vr:4,t5:12,t10:16,e:88,ae:4,ap:5.2}})});
  careerNews('good','ccNewsCongrats',['@malibuca @vic0','Weekly Final'],{tbl:{div:1,cap:'Weekly Final',rows:rows.map(function(r){return {p:r.p,n:r.n,s:r.s};}),me:'Malibuca + vic0'},art:'final'});
  careerSave();
  CH_SOCIAL='feed';
  careerTab('social');
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapsocial-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);
const SNAP_H = Number(process.env.SNAP_H) || 1500;
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--allow-file-access-from-files', '--virtual-time-budget=20000',
  '--window-size=1440,' + SNAP_H, '--screenshot=' + OUT,
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
console.log('wrote ' + OUT);
fs.rmSync(dir, { recursive: true, force: true });
