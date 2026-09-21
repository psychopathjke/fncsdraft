// История трио-года: финал Мейджора 2 (август) ложится во второй слот, а не в третий,
// и таблица под ним — записанная, а не переигранная.
//
// Тестер 21 сентября 2026: «баг во втором сезоне на втором фнкс — в истории не настоящая
// таблица с финала фнкс, не синхронизировала с настоящим». ccArcMajorOf считал номер
// Мейджора по размеру состава (трио → три Мейджора: май = второй, август = третий), а
// трио-год 2026-го играет два — по календарю. Теперь номер идёт от календаря сезона.
//
//   node tools/check-career-archive-trio.js
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    const top=(names, pts)=>names.map((n,i)=>({n:n, p:pts-i*7, w:i===0?2:0, e:20-i, r:'EU', you: n.indexOf('Probe')===0 || undefined}));
    const t1=top(['A1 & A2 & A3','B1 & B2 & B3','Probe & M1 & M2','C1 & C2 & C3','D1 & D2 & D3','E1 & E2 & E3'], 700);
    const t2=top(['F1 & F2 & F3','G1 & G2 & G3','H1 & H2 & H3','I1 & I2 & I3','Probe & M1 & M2','J1 & J2 & J3'], 650);
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, year:2026, year0:2026, day:'2026-09-01', division:1, earnings:0, balance:0, reach:0, tokens:[], news:[], seed:'arc3',
        log:[{season:2, day:'2026-05-31', kind:'major', stage:'final', place:3, of:33, pts:686, games:12, mates:['M1','M2'], mate:'M1', top:t1, won:[{h:'A1'},{h:'A2'},{h:'A3'}]},
             {season:2, day:'2026-08-02', kind:'major', stage:'final', place:5, of:33, pts:622, games:12, mates:['M1','M2'], mate:'M1', top:t2, won:[{h:'F1'},{h:'F2'},{h:'F3'}]}]},
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0},{card:card('M2',87), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    check('сезон 2 — трио', careerSquadSize()===3);
    check('календарь 2026-го — два Мейджора', ccArcMajors(2).length===2, JSON.stringify(ccArcMajors(2)));
    check('май — Мейджор 1, август — Мейджор 2', ccArcMajorOf('2026-05-31', 2)===1 && ccArcMajorOf('2026-08-02', 2)===2, ccArcMajorOf('2026-05-31', 2)+'/'+ccArcMajorOf('2026-08-02', 2));
    const a=careerArchiveSeason(2);
    out.notes.regional=a.regional.map(r=>({n:r.n, mine:r.mine && r.mine.day}));
    check('оба финала в своих слотах', a.regional.length===2 && a.regional[0].mine && a.regional[0].mine.day==='2026-05-31' && a.regional[1].mine && a.regional[1].mine.day==='2026-08-02', JSON.stringify(out.notes.regional));
    const tb=careerArchiveFinal(2, 'm|2|EU');
    out.notes.rows=tb && tb.rows.slice(0,6).map(r=>r.name+' '+r.pts+(r.you?' *':''));
    check('таблица Мейджора 2 — записанная: первые шесть строк те, что видел игрок', tb && tb.rows.length>=6 && tb.rows[0].name==='F1 & F2 & F3' && tb.rows[0].pts===650 && tb.rows[4].you===true && tb.rows[4].pts===622, JSON.stringify(out.notes.rows));
    const tb1=careerArchiveFinal(2, 'm|1|EU');
    check('и Мейджора 1 тоже', tb1 && tb1.rows[0].name==='A1 & A2 & A3' && tb1.rows[2].you===true, JSON.stringify(tb1 && tb1.rows.slice(0,3).map(r=>r.name)));
    // Строка чемпиона в плитке — тот, кого видел игрок.
    check('чемпион Мейджора 2 в плитке — F1 & F2 & F3', /F1/.test(a.regional[1].perReg.EU.name), a.regional[1].perReg.EU.name);
    // 2025-й год: три Мейджора по своему календарю.
    CAREER.career.year0=2025; CAREER.career.year=2025; CAREER.career.season=1; CH_ARC_TBL={};
    check('календарь 2025-го — три Мейджора, апрель — второй, август — третий', ccArcMajors(1).length===3 && ccArcMajorOf('2025-04-27', 1)===2 && ccArcMajorOf('2025-08-03', 1)===3);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arc3-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-archive-trio');
