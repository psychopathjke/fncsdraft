// Кто контестит на настоящих дроп-картах финалов (eucompetitive, EU 2021–2024) — по силе команды.
// Сила — средний лучший рейтинг карточек её игроков (PLAYERS). Notion 13.10: «все самые сильные
// контестятся, а к слабым никто не летит». Печатает долю команд на общей коробке по пятым частям силы
// и то же для движка (поле 50, острова сезона целиком, без книги).
//   node tools/probe-drop-real-tiers.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const maps = {};
[2021, 2022, 2023, 2024].forEach(y => {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'measured', 'eucomp-' + y + '-dropmaps.json'), 'utf8'));
  Object.keys(j.shapes).forEach(k => { maps[y + ':' + k] = j.shapes[k].map(s => s.teams || []); });
});
const BOOT = `<pre id="__out" style="display:none"></pre><script>const __MAPS=${JSON.stringify(maps)};
window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  const best=new Map();
  PLAYERS.forEach(p=>{ if(!p || !p.handle) return; const k=String(p.handle).toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(!(best.get(k)>=(p.rating||0))) best.set(k, p.rating||0); });
  const key=s=>String(s).toUpperCase().replace(/[^A-Z0-9]/g,'');
  const teamStr=name=>{ const w=String(name).split(/\\s+/).filter(Boolean), got=[];
    for(let i=0;i<w.length;){ let hit=0;
      for(let n=Math.min(3, w.length-i); n>=1; n--){ const k=key(w.slice(i, i+n).join('')); if(best.has(k)){ got.push(best.get(k)); i+=n; hit=1; break; } }
      if(!hit) i++; }
    return got.length ? got.reduce((a,b)=>a+b,0)/got.length : null; };
  const Q=5, tier=Array(Q).fill(0), seen=Array(Q).fill(0); let teams=0, matched=0, boxes=0, shared=0;
  Object.keys(__MAPS).forEach(m=>{
    const list=[]; __MAPS[m].forEach(box=>{ boxes++; if(box.length>1) shared++;
      box.forEach(t=>{ teams++; const s=teamStr(t); if(s!=null){ matched++; list.push({s, sh:box.length>1}); } }); });
    list.sort((a,b)=>b.s-a.s);
    list.forEach((t,i)=>{ const q=Math.min(Q-1, Math.floor(i*Q/list.length)); seen[q]++; if(t.sh) tier[q]++; });
  });
  out.notes.real={maps:Object.keys(__MAPS).length, teams, matched, boxes, shared, sharedPctByFifth:tier.map((v,i)=>Math.round(100*v/seen[i])).join('/')};
  const R={};
  ['m1','m2','f1','f2','f3','f4'].forEach(set=>{
    for(let seed=0; seed<12; seed++){
      squadSize=2; useLandingSet(set); try{ trimLandingZonesForMode(); }catch(e){} if(!ALL_LANDING_ZONES.length) return;
      const rnd=careerRng(ccHashStr('tier|'+set+'|'+seed)), pool=PLAYERS.filter(p=>p && p.handle).slice(0, 2000), bots=[];
      for(let i=0;i<50;i++){ const a=pool[Math.floor(rnd()*pool.length)], b=pool[Math.floor(rnd()*pool.length)];
        bots.push({name:a.handle+' & '+b.handle, squad:[a,b].map(p=>Object.assign({}, p, {rating:p.rating||80})), pow:60+rnd()*60, closeEdge:0}); }
      const base=new Map(bots.map(t=>[t, t.pow]));
      const g=buildBotLandingAssignment(bots).zoneGroups;
      const byPow=bots.slice().sort((x,y)=>base.get(y)-base.get(x));
      const r=R[set]||(R[set]={t:Array(Q).fill(0), s:Array(Q).fill(0), z:ALL_LANDING_ZONES.length, sh:0, n:0});
      g.forEach(list=>{ if(list.length>1) r.sh++; list.forEach(t=>{ const q=Math.floor(byPow.indexOf(t)*Q/50); r.s[q]++; if(list.length>1) r.t[q]++; }); });
      r.n++;
    } });
  Object.keys(R).forEach(k=>{ out.notes[k+'('+R[k].z+' boxes, '+(R[k].sh/R[k].n).toFixed(1)+' shared)']=R[k].t.map((v,i)=>Math.round(100*v/R[k].s[i])).join('/'); });
  // С книгой сезона: финал, постоянное поле, 12 вечеров, очередь по прошлому этапу (как в check-drop-top-on-top-book).
  const B={};
  ['m2','f1','f2','f3'].forEach(set=>{
    for(let seed=0; seed<6; seed++){
      const rnd=careerRng(ccHashStr('btier|'+set+'|'+seed));
      const days=[]; for(let e=0;e<12;e++) days.push('2024-0'+(1+(e%9))+'-1'+(e%10));
      CAREER={career:{season:1, day:days[0]}};
      const field=[]; for(let i=0;i<50;i++) field.push({name:'T'+seed+'_'+i, pow:60+rnd()*60, closeEdge:0, stagePts:0, squad:[{handle:'s'+seed+'a'+i, rating:80},{handle:'s'+seed+'b'+i, rating:80}]});
      const base=new Map(field.map(t=>[t, t.pow])), byPow=field.slice().sort((a,b)=>base.get(b)-base.get(a));
      const r=B[set]||(B[set]={t:Array(Q).fill(0), s:Array(Q).fill(0), sh:0, n:0});
      for(let e=0;e<12;e++){
        squadSize=2; useLandingSet(set); try{ trimLandingZonesForMode(); }catch(err){}
        CAREER.career.day=days[e]; field.forEach(t=>{ t.pow=base.get(t); t.stagePts=rnd()*100; });
        CC_DROP_STAGE=days[e]+'|1|s1|total';
        buildBotLandingAssignment(field).zoneGroups.forEach(list=>{ if(list.length>1) r.sh++;
          list.forEach(t=>{ const q=Math.floor(byPow.indexOf(t)*Q/50); r.s[q]++; if(list.length>1) r.t[q]++; }); });
        r.n++;
      }
    } });
  Object.keys(B).forEach(k=>{ out.notes['book '+k+' ('+(B[k].sh/B[k].n).toFixed(1)+' shared)']=B[k].t.map((v,i)=>Math.round(100*v/B[k].s[i])).join('/'); });
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiers-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'u'), '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { console.log(out.fails.join(String.fromCharCode(10))); process.exit(1); }
