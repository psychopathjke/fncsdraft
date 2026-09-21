// ЛАНы трио-года — те же тройки, что весь сезон, и без чужих регионов в команде.
//
// Тестер, 21 сентября 2026: «слишком много во втором сезоне европейцев переезжает на
// америку» и «в конце второго сезона просто все триосы перемешались на глобалах».
// Замер (tools/trio-season2-lan-probe.js, трио-год скипом): на Глобалах 7 команд из 32
// собраны из людей разных регионов (Acorn & Boltz + SkyJump из Европы, Golden & Ozone +
// Shur4), у 5 пар из 13, бывших и на Саммите, третий на Глобалах другой. Причины:
// Саммит, сыгранный миром, не оставлял записи, и Глобалы сажали статический список
// GC_SUMMIT_DUOS без региона (третий — с европейской доски); gcFindCard брал карточку
// тёзки из другого региона (Cold NAW 62 рядом с Ritual NAC 96); чужие регионы ехали
// статическими списками 2026-го, а не своей сценой сезона.
//
//   node tools/check-career-trio-lan.js
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
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
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
    // Тёзки: карточка — того региона, за который спрашивают.
    const cold=gcFindCard('Cold', 'NAC', 80, 2026), yuma=gcFindCard('yuma', 'ASIA', 80, 2026);
    check('gcFindCard: Cold для NAC — карточка NAC', cold && cold.region==='NAC', cold && (cold.region+' '+cold.rating));
    check('gcFindCard: yuma для ASIA — карточка ASIA', yuma && yuma.region==='ASIA', yuma && (yuma.region+' '+yuma.rating));
    const regOf=c=>String((c && (c.region||c.cardRegion))||'?');
    const shot=field=>field.filter(t=>t && !t._stub).map(t=>{
      const sq=(t.squad||[]);
      return {route:t.gcRoute||'', sq:sq.map(c=>({h:c.handle, k:hKey(c), r:regOf(c), o:Math.round(ccCardOvr(c))}))};
    });
    const _sf=careerSummitField, _gf=careerGlobalsField;
    let summitShot=null, globShot=null;
    careerSummitField=function(stage){ const f=_sf.apply(this, arguments); if(stage==='final') summitShot=shot(f); return f; };
    careerGlobalsField=function(){ const f=_gf.apply(this, arguments); globShot=shot(f); return f; };
    let guard=0; while(!cr.seasonOver && guard++<400) careerSkipWeek();
    check('сезон прошёл', cr.seasonOver, 'дней '+guard);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
    const gc=cr.summitSeed && cr.summitSeed.gc;
    check('Саммит, сыгранный миром, оставил места на Глобалы', Array.isArray(gc) && gc.length===ccTeams(SUMMIT_GC_SLOTS), JSON.stringify(cr.summitSeed && Object.keys(cr.summitSeed)));
    check('и в записи у каждого свой регион', Array.isArray(gc) && gc.every(r=>r==='you' || (Array.isArray(r) && r.every(c=>c.r))));
    const pairs=sh=>{ const m={}; (sh||[]).forEach(t=>{ for(let i=0;i<t.sq.length;i++) for(let j=i+1;j<t.sq.length;j++){ const ks=[t.sq[i].k,t.sq[j].k].sort().join('+'); if(cr.trios && cr.trios[ks]!==undefined){ const th=t.sq.find((c,x)=>x!==i&&x!==j); m[ks]=th&&th.k; } } }); return m; };
    const mixed=sh=>(sh||[]).filter(t=>new Set(t.sq.map(c=>c.r)).size>1).map(t=>t.sq.map(c=>c.h+'('+c.r+')').join('/')+' ['+t.route+']');
    out.notes.summitMixed=mixed(summitShot); out.notes.globMixed=mixed(globShot);
    check('Саммит: ни одной команды из людей разных регионов', out.notes.summitMixed.length===0, out.notes.summitMixed.join(' | '));
    check('Глобалы: ни одной команды из людей разных регионов', out.notes.globMixed.length===0, out.notes.globMixed.join(' | '));
    const A=pairs(summitShot), B=pairs(globShot);
    let both=0; const ch=[];
    Object.keys(B).forEach(k=>{ if(A[k]!==undefined){ both++; if(A[k]!==B[k]) ch.push(k+': '+A[k]+' → '+B[k]); } });
    out.notes.pairsInBoth=both; out.notes.changed=ch;
    check('пары, бывшие на обоих ЛАНах, приехали с тем же третьим', both>=8 && ch.length===0, both+' пар, сменили: '+ch.join(' | '));
    out.notes.routes=(globShot||[]).reduce((m,t)=>{ m[t.route]=(m[t.route]||0)+1; return m; },{});
    check('зал Глобалов полон', (globShot||[]).length===ccGlobField()-1, String((globShot||[]).length));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-trio-lan');
