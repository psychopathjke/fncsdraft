// Хиты 2019–2020 собираются из очков недель у ВСЕХ (его вопрос 7.10: «а очки считаются у всех? и так собираются хиты?»).
// Замер до правки: Season X — очки у 37 команд на 132 места, C2S1 43/100, C2S2 58/200, C2S3 118/400, C2S4 39/132;
// поле хитов, спрошенное посреди сезона, запоминалось без последних недель (0 из 8 прямых мест недель 3–5).
// Правило для каждого сезона с неделями: у каждого места в хитах есть очки недель; прямые места каждой недели —
// в хитах; то же, если поле хитов уже спрашивали после 2-й недели.
//   node tools/check-mx-heat-points.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const CASES = [[2019, 3, '2019-07-01'], [2019, 4, '2019-10-20'], [2020, 1, '2020-03-01'], [2020, 2, '2020-07-20'], [2020, 3, '2020-10-01']];
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(y, day)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'MxProbe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:3, year:y, year0:y, day:day, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'mxp'},
      partner:{card:card('M1',80), patience:60, since:'2019-01-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2019-01-01', dev:0},{card:card('M2',80), patience:60, since:'2019-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); };
  ${JSON.stringify(CASES)}.forEach(([y, n, d0])=>{
    seed(y, d0);
    const sp=ccMXSpec(y, n), ends=sp.weeks.map(w=>ccMXWeekEnd(y, n, w)), direct=CC_MX_WEEK_DIRECT[sp.set]||0, tag=sp.name;
    const audit=(m, label)=>{
      const H=ccMXHeats(m), rows=[].concat(...H.map(h=>h.rows)), keys=new Set(rows.map(ccMXKey));
      const pts=new Set(Object.keys(m.series).map(k=>ccMXKey(m.seriesRows[k])));
      const noPts=rows.filter(r=>r!=='you' && !pts.has(ccMXKey(r))).length;
      if(noPts) out.fails.push(tag+' '+label+': '+noPts+' из '+rows.length+' мест в хитах без очков недель');
      sp.weeks.forEach(w=>{ const wf=(m.wf||{})[w]||[]; const got=wf.slice(0, direct).filter(r=>keys.has(ccMXKey(r))).length;
        if(got<direct) out.fails.push(tag+' '+label+', неделя '+w+': прямых мест в хитах '+got+' из '+direct); });
      return rows.length+'/'+noPts;
    };
    seed(y, ccAddDays(ends[ends.length-1], 1));
    const a=audit(ccMXState(y, n), 'после недель');
    seed(y, ccAddDays(ends[1], 1)); ccMXHeats(ccMXState(y, n));
    CAREER.career.day=ccAddDays(ends[ends.length-1], 1);
    const b=audit(ccMXOf(y, n), 'спросили посреди сезона');
    out.notes[tag]=a+' · '+b;
  });
  // Его «а типо если не квал»: не прошёл полуфинал недели — очки за своё место в полуфинале всё равно есть.
  { seed(2019, '2019-10-20'); const sp=ccMXSpec(2019, 4), w=sp.weeks[1], m=ccMXState(2019, 4);
    const semi=ccM23World(200, 'semi-probe').slice(0, 60).map(ccMajorSeatRow); semi.splice(39, 0, 'you');
    m.youKey='YOU-KEY'; m.q[w]={semi:semi, r2:semi.slice(0, ccMXWeekCut(sp)).filter(r=>r!=='you')};
    CAREER.career.day=ccAddDays(ccMXWeekEnd(2019, 4, w), 1);
    ccMXSettleWeek(m, w);
    const p=m.series['YOU-KEY']||0; out.notes.semiFail40=p;
    if(!(p>0)) out.fails.push('не прошёл полуфинал недели (40-й) — очков за неделю 0'); }
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mxhp-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails.slice(0, 15)).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK у всех мест в хитах есть очки недель ' + JSON.stringify(out.notes));
