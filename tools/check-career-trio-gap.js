// Третий не слабее пары — сторож на то, что чинилось 4 сентября.
//
// Его игрок в тот день: «опять как-то странно триосы распределяются, нету
// никакой логики… и рейтинг не близкий». Замер тогда: в Дивизионе 1 средний
// разрыв «третий минус пара» был −3.2 и десятая часть троек стояла за полосой
// силы, в опенах −4.3 и пятая часть. Чинилось рынком трио (careerTrioRaids):
// в трио-год сцена пересобирается, треть пар распадается, и их люди закрывают
// третьи кресла — см. ccTrioMarket.
//
// Проверка меряет то же самое и держит границы, за которые уходить нельзя:
// в Дивизионе 1 ни одной тройки за полосой, средний разрыв не хуже −2.
//
//   node tools/check-career-trio-gap.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'TrioGap', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null,
              cardRegion:null, nat:null},
      career:{season:2, day:'2026-03-02', division:1, earnings:0, balance:0, reach:9000,
              tokens:[], log:[], news:[], size:3},
      partners:[]}));
    careerLoad();
    const cr=CAREER.career, me=careerCard();
    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };
    check('сезон играется втроём', careerSquadSize()===3);

    // Ядро — та пара из троих, что записана вместе (как в trio-third-gap-probe).
    const pairs=careerRealDuos(new Set(), careerRng(1), 'all', 800, null)||[];
    const pairKey=new Set();
    pairs.forEach(d=>{ if(d.cards.length===2) pairKey.add(d.cards.map(c=>hKey(c)).sort().join('+')); });
    const measure=field=>{
      const gaps=[];
      field.forEach(t=>{
        const s=(t.squad||[]).slice().sort((a,b)=>ovr(b)-ovr(a));
        if(s.length!==3) return;
        let core=null, third=null;
        for(let i=0;i<3 && !core;i++)
          for(let j=i+1;j<3;j++){
            const k=[s[i],s[j]].map(c=>hKey(c)).sort().join('+');
            if(pairKey.has(k)){ core=[s[i],s[j]]; third=s.filter(c=>c!==s[i]&&c!==s[j])[0]; break; }
          }
        if(!core){ core=[s[0],s[1]]; third=s[2]; }
        gaps.push(ovr(third)-(ovr(core[0])+ovr(core[1]))/2);
      });
      const n=gaps.length||1;
      return {n:gaps.length, avg:Math.round(gaps.reduce((s,v)=>s+v,0)/n*10)/10,
              worst:Math.round(Math.min.apply(null, gaps.concat([0]))*10)/10,
              far:gaps.filter(g=>g<-CC_TRIO_BAND).length,
              sizes:field.filter(t=>(t.squad||[]).length!==3).length};
    };

    const d1=measure(careerCupField(cr, [me], careerCupSize(1), null));
    out.notes.d1=d1;
    check('в Дивизионе 1 комната собралась', d1.n>20, JSON.stringify(d1));
    check('и все команды — тройки', d1.sizes===0, String(d1.sizes));
    check('ни одной тройки за полосой силы', d1.far===0, d1.far+' из '+d1.n);
    check('средний разрыв не хуже −2', d1.avg>=-2, String(d1.avg));

    const open=measure(careerCupField(cr, [me], 200, null, true, 0));
    out.notes.open=open;
    check('в опенах за полосой — единицы', open.far<=open.n*0.05, open.far+' из '+open.n);
    check('и средний разрыв не хуже −2', open.avg>=-2, String(open.avg));

    /* Рынок открывается один раз за сезон: второй вызов ничего не меняет,
       иначе сцена пересобиралась бы на каждой комнате. */
    const before=Object.keys(cr.duoSplits||{}).length;
    ccTrioMarket(null);
    check('рынок трио открывается раз за сезон',
          Object.keys(cr.duoSplits||{}).length===before,
          before+' -> '+Object.keys(cr.duoSplits||{}).length);

    // И в дуо-год он не открывается вовсе.
    cr.size=2; cr.raided=null;
    const wasSplits=Object.keys(cr.duoSplits||{}).length;
    ccTrioMarket(null, true);
    check('в дуо-год сцена не пересобирается',
          Object.keys(cr.duoSplits||{}).length===wasSplits);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triogapchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  ' + JSON.stringify(out.notes));
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('третий в тройке стоит по силе пары');
