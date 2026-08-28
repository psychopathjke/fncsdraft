// Состав зала Саммита: меняется ли он от карьеры к карьере — и решает ли сила.
//
// Его слово, 27 августа: «должно быть по силе всё в симуляции, понятно, что не
// всегда сильные выигрывают, но составы могут быть любые в финале, не как в
// реальной жизни», и следом «а может и совпасть, всегда же шанс есть».
//
// Посев зала был чистой сортировкой по pow: у кого сила выше — тот ВСЕГДА в
// верхней сетке. Здесь считается то, что он просит проверить: насколько состав
// верхней сетки гуляет между сезонами и держится ли при этом сила наверху.
//
//   node tools/summit-seed-spread-probe.js [сезонов] [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[3] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
const RUNS = +(process.argv[2] || 8);
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
  const out={err:null, rows:[], summary:null};
  try{
    const seedSave=(season)=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Seed', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:season, day:'2026-05-29', division:1, earnings:0, balance:0,
                reach:9000, tokens:[], log:[], news:[]},
        partners:[]}));
      careerLoad();
      skipAnimation=true; CC_SKIP_RUN=true;
      const me=careerCard();
      drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
      return Object.assign(careerYouTeam([me]), {isYou:true, name:'you'});
    };
    const key=t=>(t.squad||[]).map(c=>c&&c.handle).filter(Boolean).sort().join('&');

    const uppers=[];
    for(let s=1;s<=${RUNS};s++){
      const you=seedSave(s);
      const up=careerSummitField('upper', you, [careerCard()]).filter(t=>!t.isYou);
      uppers.push({season:s, set:new Set(up.map(key)),
                   pow:up.map(t=>Math.round(t.pow||0))});
    }
    // Насколько два разных сезона дают разный зал.
    const pairs=[];
    for(let i=0;i<uppers.length;i++)
      for(let j=i+1;j<uppers.length;j++){
        let same=0;
        uppers[i].set.forEach(k=>{ if(uppers[j].set.has(k)) same++; });
        pairs.push({a:uppers[i].season, b:uppers[j].season, совпало:same,
                    из:uppers[i].set.size});
      }
    const avgSame=pairs.reduce((s,p)=>s+p.совпало,0)/pairs.length;
    const size=uppers[0].set.size;
    // И держится ли сила: средняя сила верхней сетки против всего зала.
    const you=seedSave(1);
    const up=careerSummitField('upper', you, [careerCard()]).filter(t=>!t.isYou);
    const low=careerSummitField('lower', you, [careerCard()]).filter(t=>!t.isYou);
    const avg=a=>a.length ? Math.round(a.reduce((s,t)=>s+(t.pow||0),0)/a.length*10)/10 : 0;
    out.summary={
      сезонов:${RUNS}, командВВерхней:size,
      совпадаетВСреднем:Math.round(avgSame*10)/10,
      доляСовпадения:Math.round(avgSame/size*100)+'%',
      полностьюОдинаковых:pairs.filter(p=>p.совпало===p.из).length,
      силаВерхней:avg(up), силаНижней:avg(low)
    };
    out.rows=pairs.slice(0,10);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'summitseed-'));
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
console.log(JSON.stringify(out.summary, null, 1));
console.log('пары сезонов (сколько команд верхней сетки совпало):');
out.rows.forEach(p => console.log('  сезон ' + p.a + ' против ' + p.b + ': ' +
  p.совпало + ' из ' + p.из));
