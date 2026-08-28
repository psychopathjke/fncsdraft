// Держатся ли трио, когда идёт ВРЕМЯ. Жалоба его игрока, 28 августа: «триосы
// сломались — поначалу они играли вместе и по силам нормально, но через месяц
// они стали каждый турнир меняться».
//
// Проба career-trio-stick-probe меряла шесть полей одного дня разными тегами:
// там время стоит, книга роста пуста и очередь недели одна и та же. Здесь
// вечер играется по-настоящему: поле кубка Дивизиона 1 строится на КАЖДУЮ
// календарную неделю подряд, между неделями комната доигрывается и двигает
// рейтинги (careerGrowField), и меряется то же самое — сколько разных третьих
// у пары, живущей из недели в неделю, и отдельно по неделям, чтобы увидеть,
// когда именно начинается текучка.
//
//   node tools/career-trio-drift-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeTrio', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, day:'2026-01-13', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=3;
    const cr=CAREER.career;
    out.squad=careerSquadSize();

    const W=12;                      // двенадцать недель — это его «через месяц» и ещё два
    const day0=new Date('2026-01-13T00:00:00Z');
    const weeks=[], sizes=[], invented=[], memoRewrites=[];
    for(let w=0; w<W; w++){
      const d=new Date(day0.getTime()+w*7*86400000);
      cr.day=d.toISOString().slice(0,10);
      /* Неделя карьеры — это не только кубок дивизиона. Раз в две недели тут
         стоит ОТКРЫТЫЙ турнир (опен релоада, Victory Cup, Ласт Ченс): комната
         в разы больше, пул тот же, а пары в ней те же самые. Именно на нём и
         проверяется, переживает ли память третьих чужой формат. */
      const openWeek=(w%2===1);
      const before=JSON.stringify(cr.trios||{});
      const field=openWeek
        ? careerCupField(cr, [], 600, null, true, 0.3)
        : careerCupField(cr, [], careerCupSize(1), null, false, 0);
      const after=JSON.parse(JSON.stringify(cr.trios||{}));
      const prev=JSON.parse(before);
      let rewritten=0;
      Object.keys(prev).forEach(k=>{ if(after[k]!==undefined && after[k]!==prev[k]) rewritten++; });
      memoRewrites.push(rewritten);
      const real=t=>(t.squad||[]).filter(c=>c && c.handle && c.tier!=='ladder');
      const teams=field.map(t=>real(t).map(c=>hKey(c)).sort()).filter(s=>s.length===3);
      weeks.push(openWeek ? [] : teams);   // мерим по кубку, открытая неделя только портит память
      sizes.push(teams.length);
      invented.push(field.filter(t=>(t.squad||[]).length===3 && real(t).length===2).length);
      // Вечер играется: рейтинги двигаются ровно так, как двигает их турнир.
      simulateGames(field, 6, victoryR1Points, 3);
      careerGrowField(field, null);
    }
    out.realTriosPerWeek=sizes;
    out.memoRewritesPerWeek=memoRewrites;
    out.pairsWithInventedThird=invented;
    out.devBookSize=Object.keys(CAREER.dev||{}).length;

    // Сколько разных третьих у пары, дожившей до четырёх недель и больше.
    const pairThirds=new Map();
    weeks.forEach((teams,w)=>{
      teams.forEach(s=>{
        [[0,1],[0,2],[1,2]].forEach(([a,b])=>{
          const pk=s[a]+'+'+s[b], third=s[3-a-b];
          const e=pairThirds.get(pk)||{weeks:0, thirds:new Set(), seq:[]};
          e.weeks++; e.thirds.add(third); e.seq.push(w+':'+third);
          pairThirds.set(pk, e);
        });
      });
    });
    const persistent=[...pairThirds.values()].filter(e=>e.weeks>=4);
    out.persistentPairs=persistent.length;
    const dist={};
    persistent.forEach(e=>{ const k=e.thirds.size; dist[k]=(dist[k]||0)+1; });
    out.thirdsPerPair=dist;

    /* Главная мера: у пары, приехавшей на ОБА турнира подряд, тот же третий
       или новый? Доля «тех же троек» этого не отвечает — половину её съедает
       явка: в комнату помещается сто пятьдесят команд, а пар в пуле больше,
       и часть их просто не приезжает на эту неделю. */
    const coresOf=teams=>{
      const m=new Map();
      teams.forEach(s=>{
        // Ядро — пара, третий — тот, кого к ней посадили. Кто здесь ядро,
        // видно только по памяти карьеры: ключ пары в cr.trios.
        [[0,1],[0,2],[1,2]].forEach(([a,b])=>{
          const pk=s[a]+'+'+s[b];
          if((cr.trios||{})[pk]!==undefined) m.set(pk, s[3-a-b]);
        });
      });
      return m;
    };
    /* И тот же вопрос ПОПЕРЁК форматов: в один и тот же день комната кубка и
       комната открытого турнира — это одни и те же пары. Третий у них один? */
    const cupNow=careerCupField(cr, [], careerCupSize(1), null, false, 0);
    const openNow=careerCupField(cr, [], 600, null, true, 0.3);
    const trioOf=field=>field.map(t=>(t.squad||[])
        .filter(c=>c && c.handle && c.tier!=='ladder').map(c=>hKey(c)).sort())
      .filter(s=>s.length===3);
    (function(){
      const a=coresOf(trioOf(cupNow)), b=coresOf(trioOf(openNow));
      let both=0, changed=0;
      a.forEach((third,pk)=>{ if(b.has(pk)){ both++; if(b.get(pk)!==third) changed++; } });
      out.crossFormat={pairsInBoth:both, changedThird:changed,
                       pct: both ? Math.round(changed/both*100) : null};
    })();
    /* И ЛАН. Комнаты Саммита, Глобалов и Парижа собираются своим кодом
       (ccLanSeats → ccLanTeam → ccLanThird), а не полем кубка. Тот же вопрос:
       у пары, которую карьера всю весну видела с одним третьим, на ЛАНе тот
       же третий — или новый? И держится ли он от ЛАНа к ЛАНу, когда книга
       роста подвинула среднюю пары. */
    (function(){
      const lanTrios=seed=>{
        const seats=ccLanSeats(gcRegionFinals('m1','EU'), 20, 'EU', new Set());
        return seats.filter(Boolean).map(t=>(t.squad||[])
          .filter(c=>c && c.handle).map(c=>hKey(c)).sort()).filter(s=>s.length===3);
      };
      const lanA=coresOf(lanTrios());
      const cup=coresOf(trioOf(cupNow));
      let both=0, changed=0;
      lanA.forEach((third,pk)=>{ if(cup.has(pk)){ both++; if(cup.get(pk)!==third) changed++; } });
      out.lanVsCup={pairsInBoth:both, changedThird:changed,
                    pct: both ? Math.round(changed/both*100) : null};
      /* А у тех, кто всё же разошёлся, — почему. Если запомненный третий сам
         сидит в этой комнате (своей парой или чужим третьим), два места ему
         не выдать, и замена честная. */
      const seatsNow=lanTrios();
      const inRoom=new Set();
      seatsNow.forEach(s=>s.forEach(h=>inRoom.add(h)));
      let busy=0, robbed=0;
      lanA.forEach((third,pk)=>{
        if(!cup.has(pk) || cup.get(pk)===third) return;
        if(inRoom.has(cup.get(pk))) busy++; else robbed++;
      });
      out.lanWhyChanged={rememberedThirdAlreadyInRoom:busy, notInRoomAtAll:robbed};
      // И два ЛАНа подряд с подвинутой книгой: тот же третий или новый?
      const before=lanTrios().map(s=>s.join('+')).sort().join('|');
      const room=careerCupField(cr, [], careerCupSize(1), null, false, 0);
      simulateGames(room, 6, victoryR1Points, 3);
      careerGrowField(room, null);
      const after=lanTrios().map(s=>s.join('+')).sort().join('|');
      out.lanStableAfterANight = before===after;
    })();
    out.thirdChangedPct=[];
    for(let w=2; w<W; w+=2){
      const a=coresOf(weeks[w-2]), b=coresOf(weeks[w]);
      let both=0, changed=0;
      a.forEach((third,pk)=>{ if(b.has(pk)){ both++; if(b.get(pk)!==third) changed++; } });
      out.thirdChangedPct.push(both ? Math.round(changed/both*100) : null);
    }
    // Когда начинается текучка: доля троек недели, доживших до следующей.
    const key=s=>s.join('+');
    out.sameAsPrevPct=[];
    for(let w=1; w<W; w++){
      const prev=new Set(weeks[w-1].map(key)), now=weeks[w].map(key);
      const kept=now.filter(k=>prev.has(k)).length;
      out.sameAsPrevPct.push(Math.round(kept/Math.max(1,now.length)*100));
    }
    // И то же самое от ПЕРВОЙ недели — доживает ли исходный состав.
    const first=new Set(weeks[0].map(key));
    out.week1SurvivalPct=weeks.slice(1).map(teams=>{
      const now=new Set(teams.map(key));
      let n=0; first.forEach(k=>{ if(now.has(k)) n++; });
      return Math.round(n/Math.max(1,first.size)*100);
    });
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdrift-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
if (out.fail) process.exit(1);
