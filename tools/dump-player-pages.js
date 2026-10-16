// Данные для страниц игроков (/player/<ник>): все карточки сайта, сгруппированные по игроку.
// Снимаются с самой страницы в headless Chrome — те же карточки и те же рейтинги, что в игре.
//
//   node tools/dump-player-pages.js [out.json]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'player-pages.json'));
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `<script>
window.addEventListener("load", function(){ setTimeout(function(){
  var out={players:[], err:null};
  try{
    var en=(typeof CC_NAMES!=="undefined" && CC_NAMES.en) || {};
    var by=new Map();
    PLAYERS_BASE.forEach(function(p){
      if(!p || !p.handle || p.tier==="qualifier") return;
      var k=hKey(p)+"|"+(p.nat||"");
      var g=by.get(k); if(!g){ g={handle:p.handle, nat:p.nat||null, regions:{}, cards:[]}; by.set(k, g); }
      g.regions[p.region]=(g.regions[p.region]||0)+1;
      var ph=null; try{ ph=photoURLReal(p)||null; }catch(e){}
      if(ph && !g.photo) g.photo=ph;
      var cc=null; try{ cc=(FLAG_CODE[p.nat]||null); }catch(e){}
      if(cc) g.cc=cc;
      var setName=""; try{ setName=p.cardSet ? cardSetName(p.cardSet) : ""; }catch(e){}
      g.cards.push({ev:String(p.event||""), date:String(p.date||""), place:p.placement||null, rating:Math.round(p.rating||0),
        region:p.region, org:p.org||"", set:setName, tier:p.tier||"", pts:(p.real&&p.real.pts)||null, wins:(p.real&&p.real.wins)||null,
        elims:(p.real&&p.real.avgElims)||null, matches:(p.real&&p.real.matches)||null});
    });
    by.forEach(function(g){ out.players.push(g); });
    out.earn=(typeof HOME_EARN_LQ!=="undefined") ? HOME_EARN_LQ : [];
  }catch(e){ out.err=String(e && e.stack || e); }
  var pre=document.createElement("pre"); pre.id="__out"; pre.textContent="@@B@@"+encodeURIComponent(JSON.stringify(out))+"@@E@@";
  document.body.appendChild(pre);
}, 800); });
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppages-')), tmp = path.join(dir, 'index.html');
const root = ROOT.split(path.sep).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + root + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')],
    { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/@@B@@([^@<]*)@@E@@<\/pre>/);
if (!m) throw new Error('страница не отдала данные');
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) throw new Error(out.err);
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('игроков: ' + out.players.length + ', карточек: ' + out.players.reduce((s, g) => s + g.cards.length, 0) + ' → ' + OUT);
