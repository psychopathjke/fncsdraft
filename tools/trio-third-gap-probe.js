// Насколько третий слабее пары — по ВСЕМ комнатам, а не по одной.
//
// Его слово, 27 августа: «не по силе будто тимейты у игроков, у них намного
// меньше рейтинга у 3, чем у двух, которые уже в команде», и следом: «не на
// лане а вообще в трио набирают слабых почему-то».
//
// career-trio-who-probe меряет одну комнату Дивизиона 1 свежей карьеры и даёт
// чистые цифры. Здесь то же самое считается по всем дивизионам, по открытой
// комнате (опены/плей-ин) и по мировому ЛАНу — и печатается не только среднее,
// но и хвост: сколько троек, где третий ниже пары на 8 и больше.
//
//   node tools/trio-third-gap-probe.js

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
  const out={rows:[], worst:{}, err:null, band:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'TrioGap', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:2, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:3},
      partners:[]
    }));
    careerLoad();
    out.band=CC_TRIO_BAND;
    const cr=CAREER.career, me=careerCard();
    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };

    // Ядро — та пара из троих, что записана вместе; если такой нет, ядро это
    // два сильнейших, а третий — оставшийся. Так же считает career-trio-who.
    const pairs=careerRealDuos(new Set(), careerRng(1), 'all', 800, null)||[];
    const pairKey=new Set();
    pairs.forEach(d=>{ if(d.cards.length===2) pairKey.add(d.cards.map(c=>hKey(c)).sort().join('+')); });

    const measure=(label, field)=>{
      const gaps=[], sample=[];
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
        const cAvg=(ovr(core[0])+ovr(core[1]))/2;
        const g=ovr(third)-cAvg;
        gaps.push(g);
        sample.push({core:core.map(c=>c.handle).join(' & '), coreOvr:Math.round(cAvg),
                     third:third.handle, thirdOvr:ovr(third), gap:Math.round(g*10)/10,
                     made:third.tier==='ladder'});
      });
      if(!gaps.length) return;
      const avg=gaps.reduce((s,v)=>s+v,0)/gaps.length;
      const sorted=gaps.slice().sort((a,b)=>a-b);
      const far=gaps.filter(g=>g<-CC_TRIO_BAND).length;
      const made=sample.filter(s=>s.made).length;
      out.rows.push({комната:label, троек:gaps.length,
                     среднийРазрыв:Math.round(avg*10)/10,
                     худший:Math.round(sorted[0]*10)/10,
                     нижеПолосы:far, доляНижеПолосы:Math.round(far/gaps.length*100)+'%',
                     выдуманныхТретьих:made});
      out.worst[label]=sample.slice().sort((a,b)=>a.gap-b.gap).slice(0,5);
      // И верх комнаты как есть — ради него всё и затевалось.
      out.top=out.top||{};
      out.top[label]=sample.slice().sort((a,b)=>b.coreOvr-a.coreOvr).slice(0,5);
    };

    /* По ДАТАМ, а не по одной неделе.

       Его вопрос, 27 августа: «а не лан, какой разрыв в начале сезона».
       careerSeed сеется календарной неделей, значит очередь пар каждую неделю
       другая — и разрыв на первом кубке года не обязан совпадать с мартовским.
       Даты берутся с самого календаря: первый кубок, потом через каждые
       восемь недель. */
    const days=careerYearDays();
    const cupDays=[];
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')) cupDays.push(d);
    const marks=[0, 8, 16, 24, 32].map(i=>cupDays[Math.min(i, cupDays.length-1)])
                                  .filter((v,i,a)=>v && a.indexOf(v)===i);

    marks.forEach(function(day, i){
      const c=Object.assign({}, cr, {division:1, day:day});
      const tag=(i===0?'первый кубок ':'') + day;
      measure('Д1 · '+tag, careerCupField(c, [me], careerCupSize(1), null));
    });
    marks.forEach(function(day, i){
      const c=Object.assign({}, cr, {division:1, day:day});
      measure('опены · '+(i===0?'первый кубок ':'')+day,
              careerCupField(c, [me], 200, null, true, 0));
    });
    [2,3,4,5].forEach(function(d){
      const c=Object.assign({}, cr, {division:d, day:marks[0]});
      measure('Дивизион '+d, careerCupField(c, [me], careerCupSize(d), null));
    });
    // Мировой ЛАН.
    try{
      const you=careerYouTeam([me]); you.isYou=true;
      measure('мировой ЛАН', careerGlobalsField(you, [me], null).filter(t=>!t.isYou));
    }catch(e){ out.rows.push({комната:'мировой ЛАН', ошибка:String(e.message||e)}); }
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triogap-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('полоса силы CC_TRIO_BAND = ' + out.band + ' (третий не должен быть дальше неё от пары)');
console.log('');
console.log('комната            троек  средний  худший  ниже полосы  выдуманных');
out.rows.forEach(r => {
  if (r.ошибка) { console.log(String(r.комната).padEnd(19) + ' — ' + r.ошибка); return; }
  console.log(String(r.комната).padEnd(19) +
    String(r.троек).padStart(4) + '   ' +
    String(r.среднийРазрыв).padStart(6) + '  ' +
    String(r.худший).padStart(6) + '  ' +
    (r.нижеПолосы + ' (' + r.доляНижеПолосы + ')').padStart(11) + '  ' +
    String(r.выдуманныхТретьих).padStart(9));
});
Object.keys(out.worst).forEach(k => {
  const w = out.worst[k].filter(s => s.gap < -out.band);
  if (!w.length) return;
  console.log('');
  console.log(k + ' — худшие:');
  w.forEach(s => console.log('   ' + s.coreOvr + '  ' + s.core + '  + ' + s.third +
    ' ' + s.thirdOvr + '  разрыв ' + s.gap + (s.made ? '  (выдуманный)' : '')));
});
['опены · первый кубок 2026-02-02', 'Д1 · первый кубок 2026-02-02', 'мировой ЛАН'].forEach(k => {
  const t = (out.top || {})[k]; if (!t) return;
  console.log('');
  console.log(k + ' — верх комнаты:');
  t.forEach(s => console.log('   ' + s.coreOvr + '  ' + s.core + '  + ' + s.third +
    ' ' + s.thirdOvr + '  разрыв ' + s.gap + (s.made ? '  (выдуманный)' : '')));
});
