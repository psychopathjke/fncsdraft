// Второй год карьеры 2025-го: календарь 2026-й, люди — 2025-го, пары собираются
// сами по рейтингам 2025-го (его слово, 21 сентября: «2025 — собирается дуо-сезон
// сам по себе, не ориентируясь на рейтинги 2026 года настоящие, а на 25»).
//
//   node tools/check-career-2025-continuity.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nextyear', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:3, year:2025, year0:2025, day:'2025-09-07', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cont'},
      partners:[{card:card('M1',90), patience:60, since:'2024-12-01', dev:0},{card:card('M2',89), patience:60, since:'2024-12-01', dev:0}],
      dev:{'pixie':4, 'vanyak3kk':3}}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(92,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    careerNewSeason();
    const cr=CAREER.career;
    check('сезон 2, календарь 2026', cr.season===2 && cr.year===2026 && ccCalYear()===2026, cr.season+'/'+cr.year);
    check('дуо', careerSquadSize()===2);
    check('карточки — 2025-го (свой мир)', ccNowYear()===2025 && ccContinuity());
    const now=careerRosterNowEU();
    const yrs=new Set(now.map(ccCardYear));
    check('сцена — только карты 2025-го', yrs.size===1 && yrs.has(2025), [...yrs].join(','));
    // Рост за 2025 переносится по нику: берём середняка сцены, даём ему +3 в книге и смотрим в пуле.
    const mid=now.find(p=>p._ovr>=80 && p._ovr<=88);
    CAREER.dev=CAREER.dev||{}; CAREER.dev[hKey(mid)]=3; CC_POOLS=null; CC_NOW_CARDS={};
    out.notes.mid={h:mid.handle, ovr:mid._ovr};
    check('снимок — t3', ccSnapshotNow().tag==='t3', ccSnapshotNow().tag);
    const pool=careerPools();
    out.notes.pool={duos:pool.duos.length, players:pool.players.length};
    check('пары есть и их много (ядра трио + собранные по силе)', pool.duos.length>=60, String(pool.duos.length));
    const lifted=[...pool.duos.reduce((a,d)=>a.concat(d.cards), []), ...pool.players].find(c=>hKey(c)===hKey(mid));
    check('рост за 2025 перенесён в 2026-й (+3 по нику)', lifted && ccCardOvr(lifted)===mid._ovr+3, JSON.stringify({was:mid._ovr, now:lifted && ccCardOvr(lifted)}));
    const bad=pool.duos.filter(d=>d.cards.some(c=>ccCardYear(c)!==2025));
    check('в парах нет карт 2026-го', bad.length===0, String(bad.length));
    const gaps=pool.duos.map(d=>Math.abs(ccCardOvr(d.cards[0])-ccCardOvr(d.cards[1])));
    const avgGap=gaps.reduce((a,b)=>a+b,0)/gaps.length;
    out.notes.avgGap=+avgGap.toFixed(2);
    check('пары ровные по силе (средний разрыв < 4)', avgGap<4, String(avgGap));
    const room=careerCupField(Object.assign({}, cr, {division:1}), [], 50, 'cont', false, 0);
    check('комната Д1 — 49 пар вокруг игрока', room.length>=45, String(room.length));
    check('в комнате все с картами 2025-го', room.every(t=>(t.squad||[]).every(c=>!c.event || /2025|ladder/.test(String(c.event)) || c.tier==='ladder')), room.slice(0,3).map(t=>(t.squad||[]).map(c=>c.handle+'|'+c.event).join(' & ')).join(' ; '));
    // Год целиком скипом — мир 2026-го (Reload, Саммит, Антверпен) на людях 2025-го не падает.
    let guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2026 прошёл', cr.seasonOver, 'дней '+guard);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл Мейджоры и Антверпен', paid.some(k=>/major1/.test(k)) && paid.some(k=>/globals/.test(k)), paid.join(','));
    careerNewSeason();
    check('сезон 3 — трио, люди всё те же', careerSquadSize()===3 && ccNowYear()===2025 && cr.year===2026, cr.season+'/'+cr.size);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccont-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2025-continuity');
