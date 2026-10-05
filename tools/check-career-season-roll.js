// Стык года у карьеры, перешедшей из 2024-го в 2025-й (тестер, Notion «05», 5.10.2026):
//  1. «рейтинг не меняется, когда новый сезон начинается» — в день стыка сцена уже сдвинута
//     к рейтингам года календаря (доля CC_REAL_PULL_OPEN), а в сезоне после 2026-го не откатывается;
//  2. «малибука без сквада» — третий настоящей тройки не читается свободным (ccSquadMatesOf/ccWhoStatus);
//  3. «двое свиззи» — смена третьего у тройки не даёт второй строки в таблице сезона.
//
//   node tools/check-career-season-roll.js
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
    const P=c=>({card:c, patience:60, since:'2023-11-01', dev:0});
    const seed=(cr)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Roll', age:20, source:'rookie', country:'ru', countryPing:15, closeRangeEdge:6,
          region:'EU', ovr:85, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
        career:Object.assign({division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'roll'}, cr),
        partner:P(card('M1',85)), partners:[P(card('M1',85))]}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(85,'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      CC_POOLS=null; careerLoad(); careerMigrateSize();
    };
    // 1. Стык: конец 2024-го → первый день 2025-го.
    seed({season:1, size:2, year:2024, year0:2024, day:'2024-09-08', seasonOver:true});
    const before=new Map(); careerPools().players.forEach(c=>before.set(c._k||hKey(c), c._ovr));
    careerNewSeason();
    const cr=CAREER.career;
    check('стык: календарь 2025-го, трио', cr.year===2025 && careerSquadSize()===3, cr.year+'/'+careerSquadSize());
    const T=ccRealTargets(2025);
    CC_POOLS=null;
    let n=0, moved=0, toward=0;
    careerPools().players.forEach(c=>{
      const k=c._k||hKey(c), b=before.get(k), t=T.get(k);
      if(b==null || t==null || Math.abs(t-b)<3) return;
      n++; if(c._ovr!==b) moved++;
      if(Math.abs(t-c._ovr)<Math.abs(t-b)) toward++;
    });
    out.notes.roll={n, moved, toward, frac:ccRealPullFrac()};
    check('стык: люди с целью есть', n>=100, String(n));
    check('стык: в первый день рейтинг уже сдвинут к году календаря', moved>=n*0.8 && toward===moved, moved+'/'+n+' (к цели '+toward+')');
    // 2. Третий тройки — в составе.
    const trios=cr.trios||{};
    const thirds=Object.keys(trios).map(k=>trios[k]).filter(Boolean);
    let lone=[], coreNo=[];
    thirds.slice(0, 60).forEach(h=>{ if(!ccPairMateOf(h)) lone.push(h); });
    Object.keys(trios).slice(0, 60).forEach(k=>{
      const a=k.split('+')[0], m=ccSquadMatesOf(a);
      if(!(ccPoolsHas(k)) ) return;
      if(!m.some(c=>hKey(c)===trios[k])) coreNo.push(a+'→'+trios[k]);
    });
    function ccPoolsHas(key){ return (careerPools().duos||[]).some(d=>d.cards.map(c=>hKey(c)).sort().join('+')===key); }
    out.notes.thirds={n:thirds.length, lone:lone.slice(0,5), coreNo:coreNo.slice(0,5)};
    check('тройки посеяны', thirds.length>=20, String(thirds.length));
    check('третий не свободен: у него есть состав', lone.length===0, lone.slice(0,5).join(', '));
    check('в составе пары виден её третий', coreNo.length===0, coreNo.slice(0,5).join(', '));
    const mal=ccWhoStatus(thirds[0]);
    check('статус третьего — не F/A и не LFT', !mal || (mal.kind!=='fa' && mal.kind!=='lft'), JSON.stringify(mal));
    // 3. Таблица сезона: одно ядро — одна строка, как бы ни звали третьего.
    const mk=(h)=>({handle:h, region:'EU'});
    const t0=careerTable(); t0.rows={}; t0.weeks=0;
    careerTableAdd([{name:'A1 & B1 & C1', squad:[mk('A1'),mk('B1'),mk('C1')], stagePts:50, wins:1},
                    {name:'X1 & Y1 & Z1', squad:[mk('X1'),mk('Y1'),mk('Z1')], stagePts:40}]);
    careerTableAdd([{name:'A1 & B1 & D1', squad:[mk('A1'),mk('B1'),mk('D1')], stagePts:30},
                    {name:'X1 & Y1 & Z1', squad:[mk('X1'),mk('Y1'),mk('Z1')], stagePts:20}]);
    const rows=careerTableRows();
    const a=rows.filter(r=>/A1/.test(r.name));
    out.notes.table=rows.map(r=>r.name+':'+r.pts+'/'+r.weeks);
    check('таблица: смена третьего — та же строка', a.length===1 && a[0].pts===80 && a[0].weeks===2, JSON.stringify(out.notes.table));
    check('таблица: строка зовётся нынешним составом', a.length===1 && a[0].name==='A1 & B1 & D1', a[0] && a[0].name);
    check('таблица: дуо — по-прежнему по имени', rows.length===2);
    // 4. Сезон после 2026-го не откатывает подтяжку к нулю.
    seed({season:3, size:2, year:2026, year0:2024, day:'2026-09-20', sizes:{1:2, 2:3}});
    const lateY=ccRealPullFrac();
    seed({season:4, size:3, year:2026, year0:2024, day:CC_YEAR_FROM, sizes:{1:2, 2:3, 3:2}});
    const nextY=ccRealPullFrac();
    out.notes.after2026={lateY, nextY};
    check('сезон после 2026-го: цель 2026-го не откатывается', nextY>=lateY-0.02, lateY+' → '+nextY);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccroll-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
fs.rmSync(dir, { recursive: true, force: true });
console.log('OK check-career-season-roll');
