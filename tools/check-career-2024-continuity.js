// Свой мир карьеры 2024-го: после Форт-Уэрта — календарь 2025-го (трио) на людях 2024-го,
// тройки собирает рынок; потом 2026-й (дуо); год скипом не падает.
//
//   node tools/check-career-2024-continuity.js
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
      career:{season:1, size:2, year:2024, year0:2024, day:'2024-09-08', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'cont24'},
      partner:{card:card('M1',90), patience:60, since:'2023-11-01', dev:0},
      partners:[{card:card('M1',90), patience:60, since:'2023-11-01', dev:0}],
      dev:{'pixie':4, 'vanyak3kk':3}}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(92,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    careerNewSeason();
    const cr=CAREER.career;
    check('сезон 2, календарь 2025', cr.season===2 && cr.year===2025 && ccCalYear()===2025, cr.season+'/'+cr.year);
    check('трио', careerSquadSize()===3);
    check('карточки — 2024-го (свой мир)', ccNowYear()===2024 && ccContinuity());
    const now=careerRosterNowEU();
    const yrs=new Set(now.map(ccCardYear));
    check('сцена — только карты 2024-го', yrs.size===1 && yrs.has(2024), [...yrs].join(','));
    check('снимок — f3', ccSnapshotNow().tag==='f3', ccSnapshotNow().tag);
    const pool=careerPools();
    out.notes.pool={duos:pool.duos.length, players:pool.players.length, trios:Object.keys(cr.trios||{}).length};
    check('пары есть', pool.duos.length>=40, String(pool.duos.length));
    const bad=pool.duos.filter(d=>d.cards.some(c=>ccCardYear(c)!==2024));
    check('в парах нет карт новее 2024', bad.length===0, String(bad.length));
    // Комната трио-года: третьих досаживает рынок (в 2025-м с людьми 2025-го он выключен, тут — нет).
    const room=careerCupField(Object.assign({}, cr, {division:1}), [], 33, 'cont24', false, 0);
    out.notes.room={n:room.length, sizes:[...new Set(room.map(t=>(t.squad||[]).length))]};
    check('комната Д1 — тройки', room.length>=30 && room.every(t=>(t.squad||[]).length===3), JSON.stringify(out.notes.room));
    check('в комнате все с картами 2024-го', room.every(t=>(t.squad||[]).every(c=>!c.event || /2024|ladder/.test(String(c.event)) || c.tier==='ladder')), room.slice(0,3).map(t=>(t.squad||[]).map(c=>c.handle+'|'+c.event).join(' & ')).join(' ; '));
    // Год 2025 целиком скипом — мир 2025-го (группы, Showdown, Лион) на людях 2024-го не падает.
    let guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2025 прошёл', cr.seasonOver, 'дней '+guard);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const paid=Object.keys(cr.worldPaid||{});
    out.notes.paid=paid;
    check('мир сыграл Мейджоры и Лион', paid.some(k=>/major1/.test(k)) && paid.some(k=>/globals/.test(k)), paid.join(','));
    careerNewSeason();
    check('сезон 3 — 2026, дуо, люди всё те же', careerSquadSize()===2 && ccNowYear()===2024 && cr.year===2026, cr.season+'/'+cr.size+'/'+cr.year);
    const pool3=careerPools();
    out.notes.pool3={duos:pool3.duos.length};
    check('дуо-год: пары собраны (ядра троек + по силе)', pool3.duos.length>=40, String(pool3.duos.length));
    guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('год 2026 прошёл', cr.seasonOver, 'дней '+guard);
    check('без ошибок JS (2026)', out.errs.length===0, out.errs.slice(0,3).join(' | '));
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
console.log('OK check-career-2024-continuity');
