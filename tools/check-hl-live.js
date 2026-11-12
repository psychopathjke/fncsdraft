// «Больше или меньше» (#hl) и live-ивенты Fortnite в карьере.
//   node tools/check-hl-live.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[]}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    // ---- Больше или меньше.
    check('финалов с местами хватает', hlGroups().length>=300, String(hlGroups().length));
    let bad=0, kinds={place:0, earn:0};
    for(let i=0;i<200;i++){ const r=i%2 ? hlRoundPlace() : hlRoundEarn(); if(!r){ bad++; continue; } kinds[r.kind]++;
      if(r.a.val===r.b.val || r.a.name===r.b.name || /[\u2014\u2013]/.test(r.ev||'')) bad++; }
    check('пары разные, без ничьих и длинных тире', bad===0 && kinds.place>0 && kinds.earn>0, bad+' '+JSON.stringify(kinds));
    hlOpen();
    check('экран открыт', document.querySelector('.screen.active').id==='screen-hl');
    for(let i=0;i<3;i++){ hlPick(hlWinner(HL.round)); await wait(1300); }
    check('три верных = серия 3', HL.streak===3 && !HL.over, HL.streak+' '+HL.over);
    hlPick(1-hlWinner(HL.round));
    check('ошибка заканчивает серию', HL.over && document.querySelector('.hl-end')!=null);
    check('рекорд записан', hlBest()>=3, String(hlBest()));
    hlHome(); check('назад на главную', document.querySelector('.screen.active').id==='screen-mode');
    // ---- Live-ивенты.
    const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    const seed=(Y, day)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:Y, year0:Y, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'lv'}, partner:{card:card('M1',80), patience:60, since:day, dev:0}}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); };
    const live=()=>(CAREER.career.news||[]).filter(x=>/^lfNewsLive/.test(x.k||''));
    seed(2019, '2019-07-15'); ccLifeTick(); CAREER.career.day='2019-07-25'; ccLifeTick();
    check('2019: Final Showdown в ленте', live().length===1 && live()[0].day==='2019-07-20' && live()[0].a[0]==='The Final Showdown', JSON.stringify(live()));
    ccLife().tick='2019-07-10'; ccLifeTick();
    check('второй раз не пишется', live().length===1, String(live().length));
    check('ответы зрителей свои', ccCoMood(live()[0])==='Live');
    const html=String(ccPostHTML(live()[0]));
    check('пост от аккаунта сцены', /FNCompetitive/.test(html));
    seed(2027, '2026-06-01'); ccLifeTick(); CAREER.career.day='2026-06-10'; ccLifeTick();
    check('после 2026-го ивенты 2026-го не повторяются', live().length===0, String(live().length));
    ['ru','en','fr','it','pt'].forEach(lg=>{ const d=I18N[lg]; ['lfNewsLivemajor','lfNewsLivefinale','lfNewsLiveconcert','hlTitle','hlQPlace','hlOver'].forEach(k=>check(lg+' '+k, d[k]!=null)); check(lg+' ccCoLive', Array.isArray(d.ccCoLive)); });
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hllive-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs.length) out.fails.push('ошибки страницы: ' + out.errs.join(' | '));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK больше или меньше: серия и рекорд; live-ивенты: один раз, в своём году, ответы зрителей');
