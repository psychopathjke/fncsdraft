// Метка и сбор состава не текущего формата — за неделю до его первого вечера (его слова 8.10).
//   node tools/check-career-fmt-window.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'P', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:82, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null}, career:{season:1, year:2019, year0:2019, day:'2019-07-01', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, partner:null, partners:[]}));
  careerLoad();
  const cur=careerSquadSize(); const f=[3,4].find(x=>x!==cur && ccFormatNext(x)) || [2,3,4].find(x=>x!==cur && ccFormatNext(x));
  check('есть не текущий формат с вечерами', !!f, String(cur));
  if(f){
    const next=ccFormatNext(f), from=ccAddDays(next, -CC_ROSTER_WEEK);
    out.notes={cur, f, next, from, today:careerToday()};
    if(careerToday()<from){
      check('до окна — острова формата нет в выборе точки', !careerSpotSets().some(x=>x.key===ccFmtSpotKey(f, careerBrSet())));
      const t=ccRostersTileHTML(); check('до окна — в «Составах» дата, а не «Позвать»', t.indexOf('ccDuoFindOpen(null, '+f+')')<0 && t.indexOf(L().roSpotFrom(ccDayLabel(from)))>=0, t.slice(0,300));
      ccDuoFindOpen(null, f); check('до окна — поиск не открывается', CC_DUO_FMT!==f);
      const st=ccRostersStripHTML(); check('до окна — в карточке составов «откроется с»', st.indexOf('ch-ro-spot-lock')>=0 || st.indexOf(L().roSpotFrom(ccDayLabel(from)))>=0 || st.indexOf('ch-ro')<0);
    } else out.notes.alreadyOpen=true;
    CAREER.career.day=from;
    check('в окне — остров формата есть', careerSpotSets().some(x=>x.key===ccFmtSpotKey(f, careerBrSet())));
    check('в окне — «Позвать» есть', ccRostersTileHTML().indexOf('ccDuoFindOpen(null, '+f+')')>=0);
  }
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmtwin-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK окно формата ' + JSON.stringify(out.notes));
