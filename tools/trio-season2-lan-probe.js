// Тестер, 21 сентября 2026: «слишком много во втором сезоне европейцев переезжает
// на америку» и «в конце второго сезона просто все триосы перемешались на глобалах».
//
// Проба: трио-год (сезон 2 карьеры 2026-го, EU, Д1) скипом целиком — мир сам играет
// Саммит и Глобалы (careerWorldFinals). Перехватываем оба зала и меряем:
//   • сколько команд собраны из людей РАЗНЫХ регионов и кто у них третий;
//   • у скольких пар третий на Глобалах не тот, что был на Саммите / в памяти cr.trios.
//
// Замер 21.09 до починки: Саммит 1 смешанная команда из 32, Глобалы 7 из 32, у 5 пар из 13
// третий на Глобалах другой. После (шаг 59: запись Саммита миром, регион у GC_SUMMIT_DUOS,
// gcFindCard по региону, чужие регионы своей сценой в трио-год): 0 / 0 / 0 из 21. Сторож —
// tools/check-career-trio-lan.js.
//
//   node tools/trio-season2-lan-probe.js
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
  const out={summit:null, globals:null, notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, sizes:{1:2}, day:CC_YEAR_FROM, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'lan2'},
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0},{card:card('M2',87), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    const cr=CAREER.career;
    const regOf=c=>String((c && (c.region||c.cardRegion))||'?');
    const key2=(a,b)=>[hKey(a),hKey(b)].sort().join('+');
    // снимок зала: для каждой команды — регион команды (t.summitRegion|регион большинства), три ника с регионами
    const shot=field=>field.filter(t=>t && !t._stub).map(t=>{
      const sq=(t.squad||[]);
      const regs={}; sq.forEach(c=>{ regs[regOf(c)]=(regs[regOf(c)]||0)+1; });
      const team=t.summitRegion || Object.keys(regs).sort((a,b)=>regs[b]-regs[a])[0];
      return {team, route:t.gcRoute||t.summitRegion||'', sq:sq.map(c=>({h:c.handle, k:hKey(c), r:regOf(c), o:Math.round(ccCardOvr(c)), lad:c.tier==='ladder'}))};
    });
    const _sf=careerSummitField, _gf=careerGlobalsField;
    let summitShot=null, globShot=null;
    careerSummitField=function(stage, you, drafted){ const f=_sf.apply(this, arguments); if(stage==='final') summitShot=shot(f); return f; };
    careerGlobalsField=function(){ const f=_gf.apply(this, arguments); globShot=shot(f); return f; };
    let guard=0; const t0=Date.now();
    while(!cr.seasonOver && guard++<400) careerSkipWeek();
    out.notes.days=guard; out.notes.ms=Date.now()-t0; out.notes.paid=Object.keys(cr.worldPaid||{});
    out.notes.memo=Object.keys(cr.trios||{}).length;
    const analyse=(sh, label)=>{
      if(!sh) return {label, none:true};
      let mixed=0, mixedNonEU=0; const mx=[]; const byPair={};
      sh.forEach(t=>{
        const regs=new Set(t.sq.map(c=>c.r));
        if(regs.size>1){ mixed++; if(t.team!=='EU') mixedNonEU++; if(mx.length<12) mx.push(t.sq.map(c=>c.h+'('+c.r+' '+c.o+')').join(' / ')+' ['+t.route+']'); }
        // пара из памяти + третий
        for(let i=0;i<t.sq.length;i++) for(let j=i+1;j<t.sq.length;j++){
          const k=t.sq[i].k+'+'+t.sq[j].k, ks=[t.sq[i].k,t.sq[j].k].sort().join('+');
          if(cr.trios && cr.trios[ks]!==undefined){ const th=t.sq.find((c,x)=>x!==i&&x!==j); byPair[ks]={third:th&&th.k, memo:cr.trios[ks]}; }
        }
      });
      return {label, teams:sh.length, mixed, mixedNonEU, mx, byPair};
    };
    const A=analyse(summitShot, 'summit'), B=analyse(globShot, 'globals');
    out.summit={teams:A.teams, mixed:A.mixed, mixedNonEU:A.mixedNonEU, mx:A.mx};
    // Саммит → Глобалы: пары, бывшие в обоих залах, у скольких третий другой
    let both=0, changed=0; const ch=[];
    Object.keys(B.byPair||{}).forEach(k=>{ if(A.byPair && A.byPair[k]){ both++; if(A.byPair[k].third!==B.byPair[k].third){ changed++; if(ch.length<10) ch.push(k+': '+A.byPair[k].third+' → '+B.byPair[k].third+' (memo '+B.byPair[k].memo+')'); } } });
    let memoOther=0; Object.keys(B.byPair||{}).forEach(k=>{ if(B.byPair[k].memo && B.byPair[k].memo!==B.byPair[k].third) memoOther++; });
    out.globals={teams:B.teams, mixed:B.mixed, mixedNonEU:B.mixedNonEU, mx:B.mx, pairsInBoth:both, thirdChanged:changed, ch, memoOther, pairsWithMemo:Object.keys(B.byPair||{}).length,
      routes:(globShot||[]).reduce((m,t)=>{ m[t.route]=(m[t.route]||0)+1; return m; },{})};
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclan2-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
console.log(JSON.stringify(out.notes));
console.log('Саммит:', JSON.stringify(out.summit, null, 1));
console.log('Глобалы:', JSON.stringify(out.globals, null, 1));
