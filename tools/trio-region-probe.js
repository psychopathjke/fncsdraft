// Почему на ЛАНе в трио-год верх у Америки, а не у Европы.
//
// Его игрок, 4 сентября: «на NAC надо рейтинг немного меньше сделать, слишком
// много челов у которых огромный рейтинг… поэтому и на ланах все топ места у
// американцев, а европы нету». И он же перед этим: «странно триосы
// распределяются, рейтинг не близкий».
//
// Проба меряет ровно эти две вещи вместе, потому что подозрение в том, что это
// одна вещь: РЕЗЕРВ. Тройка собирается как «записанная пара + свободный», и
// если в регионе свободных сильных много, его тройки собираются сильными, а
// если все сильные стоят в парах — третьим идёт тот, кто на десять ниже.
//
// Печатает по регионам: сколько карточек 90+/85+ в мировом пуле, сколько из
// них СВОБОДНЫ (не стоят в записанной паре), и какой разрыв «третий минус
// пара» выходит у команд этого региона в поле мирового ЛАНа.
//
//   node tools/trio-region-probe.js
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
  const out={pool:{}, lan:{}, err:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'TrioReg', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:2, day:'2026-03-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:3},
      partners:[]
    }));
    careerLoad();
    const cr=CAREER.career, me=careerCard();
    const ovr=c=>{ const a=attrsFor(c)||{}; return Math.round(c._ovr!=null?c._ovr:(a.ovr||0)); };
    const regOf=c=>String((c && (c.region||c.cardRegion)) || '?');

    // ---- пул мира: кто есть и кто свободен -------------------------------
    const pool=ccAsWorld(()=>careerPools());
    const paired=new Set();
    (pool.duos||[]).forEach(d=>d.cards.forEach(c=>paired.add(hKey(c))));
    (pool.players||[]).forEach(c=>{
      const r=regOf(c), o=ovr(c), free=!paired.has(hKey(c));
      const row=out.pool[r]||(out.pool[r]={all:0, p90:0, p85:0, free90:0, free85:0, freeTop:0});
      row.all++;
      if(o>=90) row.p90++;
      if(o>=85) row.p85++;
      if(free){
        if(o>=90) row.free90++;
        if(o>=85) row.free85++;
        if(o>row.freeTop) row.freeTop=o;
      }
    });

    // ---- поле мирового ЛАНа: разрыв «третий минус пара» по регионам -------
    const pairs=careerRealDuos(new Set(), careerRng(1), 'all', 800, null)||[];
    const pairKey=new Set();
    pairs.forEach(d=>{ if(d.cards.length===2) pairKey.add(d.cards.map(c=>hKey(c)).sort().join('+')); });
    const you=careerYouTeam([me]); you.isYou=true;
    const field=careerGlobalsField(you, [me], null).filter(t=>!t.isYou);
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
      const r=String(t.summitRegion||regOf(s[0]));
      const row=out.lan[r]||(out.lan[r]={n:0, gap:0, pow:0, core:0, third:0});
      row.n++;
      row.gap+=ovr(third)-(ovr(core[0])+ovr(core[1]))/2;
      row.core+=(ovr(core[0])+ovr(core[1]))/2;
      row.third+=ovr(third);
      row.pow+=(t.pow||0);
    });
    // И титулы: 200 прогонов того же зала, кто чемпион.
    out.titles={};
    const N=200;
    for(let k=0;k<N;k++){
      field.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
      for(let g=0; g<CC_GLOB_GAMES; g++){
        const order=simulateGame(field);
        order.forEach((t,i)=>{ t.stagePts+=pointsForPlace(i+1); if(i===0)t.wins++; });
      }
      const ranked=field.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0));
      const r=String(ranked[0].summitRegion||regOf((ranked[0].squad||[])[0]));
      out.titles[r]=(out.titles[r]||0)+1;
    }
    Object.keys(out.lan).forEach(r=>{
      const v=out.lan[r], n=v.n||1;
      v.gap=Math.round(v.gap/n*10)/10; v.pow=Math.round(v.pow/n*10)/10;
      v.core=Math.round(v.core/n*10)/10; v.third=Math.round(v.third/n*10)/10;
    });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trioreg-'));
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

const pad = (s, n) => String(s).padEnd(n);
console.log('пул мира: сколько сильных и сколько из них свободно');
console.log(pad('регион', 8) + pad('карт', 6) + pad('90+', 6) + pad('85+', 6) +
            pad('своб.90+', 10) + pad('своб.85+', 10) + 'лучший свободный');
Object.keys(out.pool).sort((a, b) => out.pool[b].p90 - out.pool[a].p90).forEach(r => {
  const v = out.pool[r];
  console.log(pad(r, 8) + pad(v.all, 6) + pad(v.p90, 6) + pad(v.p85, 6) +
              pad(v.free90, 10) + pad(v.free85, 10) + v.freeTop);
});
console.log('');
console.log('мировой ЛАН (трио): чей третий ближе к своей паре');
console.log(pad('регион', 8) + pad('команд', 8) + pad('пара', 8) + pad('третий', 8) +
            pad('разрыв', 8) + pad('сила', 8) + 'титулов из 200');
Object.keys(out.lan).sort((a, b) => out.lan[b].n - out.lan[a].n).forEach(r => {
  const v = out.lan[r];
  console.log(pad(r, 8) + pad(v.n, 8) + pad(v.core, 8) + pad(v.third, 8) +
              pad(v.gap, 8) + pad(v.pow, 8) + ((out.titles||{})[r]||0));
});
