// Какими карточками ЛАН карьеры сажает людей — и сходится ли это со сценой.
//
// Его слово, 27 августа: «так у нас в карьере карточки ток за 26 год», после
// вопроса «почему фликзи 96».
//
// ccSceneRoster (вся карьера) фильтрует ccCardYear(p)===CC_NOW_YEAR и берёт
// САМУЮ СВЕЖУЮ карточку человека. gcCardIndex (ЛАН) не фильтрует год вовсе и
// берёт САМУЮ ВЫСОКУЮ. Значит один и тот же человек на ЛАНе может быть сильнее
// себя же в хабе — и настолько, насколько удачен был его лучший год.
//
// Печатается: сколько людей поля ЛАНа расходятся со своей карточкой 2026,
// на сколько в среднем и кто расходится сильнее всех.
//
//   node tools/lan-card-year-probe.js

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
  const out={err:null, rows:[], summary:null, year:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'LanYear', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
        attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]}));
    careerLoad();
    out.year=CC_NOW_YEAR;
    const me=careerCard();
    const you=careerYouTeam([me]); you.isYou=true;
    const field=careerGlobalsField(you, [me], null).filter(t=>!t.isYou);

    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };
    const rows=[];
    field.forEach(t=>{
      (t.squad||[]).forEach(c=>{
        if(!c || !c.handle) return;
        const reg=c.region||ccCareerRegion();
        const now=ccSceneRoster(reg).find(x=>hKey(x)===hKey(c));
        rows.push({h:c.handle, lan:ovr(c),
                   scene: now ? ovr(now) : null,
                   year: (typeof ccCardYear==='function' ? ccCardYear(c) : null)});
      });
    });
    const known=rows.filter(r=>r.scene!=null);
    const diff=known.filter(r=>r.lan!==r.scene);
    const avg=diff.length ? diff.reduce((s,r)=>s+(r.lan-r.scene),0)/diff.length : 0;
    out.summary={
      людейНаЛане: rows.length,
      естьКарточка2026: known.length,
      нетКарточки2026: rows.length-known.length,
      расходятся: diff.length,
      доля: rows.length ? Math.round(diff.length/rows.length*100)+'%' : '0%',
      среднийПерекос: Math.round(avg*10)/10
    };
    out.rows=diff.sort((a,b)=>(b.lan-b.scene)-(a.lan-a.scene)).slice(0,12);
    // Годы карточек, которыми сажает ЛАН.
    const years={};
    rows.forEach(r=>{ const y=r.year==null?'—':String(r.year); years[y]=(years[y]||0)+1; });
    out.summary.годаКарточекЛана=years;
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lanyear-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('год карьеры: ' + out.year);
console.log(JSON.stringify(out.summary, null, 1));
console.log('сильнее всего расходятся (ЛАН → сцена):');
out.rows.forEach(r => console.log('  ' + r.h.padEnd(22) + ' ЛАН ' + r.lan +
  '  сцена ' + r.scene + '  разница ' + (r.lan - r.scene) + '  год карточки ' + r.year));
