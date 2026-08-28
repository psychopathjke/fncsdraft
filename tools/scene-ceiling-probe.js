// Упирается ли верхушка сцены в потолок за несколько сезонов.
//
// Возрастную кривую 27 августа двигали дважды: вес 0.6 и точка отсчёта
// CC_SCENE_AGE_REF. Годовые замеры дают верху +0.2…+1.5, но за длинную
// дистанцию её никто не мерил, а потолок 99 близко: если молодые прибавляют
// каждый год, через три-четыре сезона наверху может стоять стена из 99.
//
// Сезоны здесь НЕ перематываются календарём — этого достаточно и надёжнее:
// книга роста ключуется никами и живёт в сейве, поэтому год гоняется, книга
// сохраняется, сезон поднимается руками и год гоняется снова по той же книге.
//
//   node tools/scene-ceiling-probe.js [сезонов]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const YEARS = +(process.argv[2] || 4);
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={err:null, years:[]};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }

    const ov=c=>{ const a=attrsFor(c)||{}; return (c._ovr!=null?c._ovr:a.ovr)||0; };
    const snap=(season)=>{
      const top=ccSceneRoster(ccCareerRegion()).slice(0, 20);
      return {сезон:season,
              среднийТоп20:Math.round(top.reduce((s,c)=>s+ov(c),0)/top.length*10)/10,
              максимум:Math.round(Math.max.apply(null, top.map(ov))*10)/10,
              вПотолке:top.filter(c=>ov(c)>=99).length,
              записей:Object.keys((CAREER.dev)||{}).length};
    };

    let book=null;
    for(let y=1; y<=${YEARS}; y++){
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Ceil', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
          photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:y, day:day, division:1, earnings:0, balance:1000, reach:0,
                tokens:[], log:[], news:[], seed:'fixed-world'},
        partner:null, dev:book||undefined}));
      careerEntry();
      if(book) CAREER.dev=book;              // книга переносится между сезонами
      ccWorldReset();
      if(!careerPartnerCard()){
        careerSeatTopUp();
        const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
        if(s) careerDmAccept(s.id);
      }
      if(y===1) out.years.push(Object.assign({до:true}, snap(0)));
      const real=careerFfDigest; careerFfDigest=function(){};
      await careerFastForward(365);
      careerFfDigest=real;
      out.years.push(snap(y));
      book=CAREER.dev;
    }
  }catch(e){ out.err=String((e&&(e.stack||e.message))||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ceiling-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=6000000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('сезон   средний топ-20   максимум   в потолке (99)   записей в книге');
out.years.forEach(y => console.log(
  '  ' + (y.до ? 'старт' : String(y.сезон).padStart(2) + '   ') +
  '      ' + String(y.среднийТоп20).padStart(5) +
  '        ' + String(y.максимум).padStart(4) +
  '          ' + String(y.вПотолке).padStart(2) +
  '            ' + y.записей));
