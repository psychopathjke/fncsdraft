// Тестер, 21 сентября 2026: «слишком много во втором сезоне европейцев переезжает
// на америку» и «в конце второго сезона просто все триосы перемешались на глобалах».
//
// Проба: трио-год (сезон 2 карьеры 2026-го, EU, Д1). Сначала своя комната Д1 и
// комнаты чужих регионов той же дорогой, что лента (careerWorldD1 под ccAsRegion),
// по неделям — считаем, сколько в каждой комнате карточек ЧУЖОГО региона и как
// держатся тройки от недели к неделе. Потом Глобалы (careerGlobalsField) — сколько
// команд собраны из людей разных регионов и у скольких пар третий на ЛАНе не тот,
// с кем они ездили весь сезон (cr.trios).
//
// Замер 21.09: комнаты ленты (careerWorldD1) во всех семи регионах чистые — 0 чужих карточек
// на 100 людей каждую неделю; они дуо (третьих лента не сажает). Смешение нашлось не тут, а на
// ЛАНах — см. trio-season2-lan-probe.js.
//
//   node tools/trio-season2-world-probe.js
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
  const out={weeks:[], globals:null, err:null};
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:2, size:3, sizes:{1:2}, day:'2026-02-10', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'w2'},
      partners:[{card:card('M1',88), patience:60, since:'2026-01-01', dev:0},{card:card('M2',87), patience:60, since:'2026-01-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(90,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize(); ccTrioMarket(CAREER.career, true);
    const cr=CAREER.career;
    const regOf=c=>String((c && (c.region||c.cardRegion))||'?');
    const key2=(a,b)=>[hKey(a),hKey(b)].sort().join('+');
    // тройка → ключ пары из памяти + третий
    const trioOf=sq=>{
      if(!sq || sq.length!==3) return null;
      for(let i=0;i<3;i++) for(let j=i+1;j<3;j++){
        const k=key2(sq[i], sq[j]); if(cr.trios && cr.trios[k]){ const t=sq.find((c,x)=>x!==i && x!==j); return {k, third:hKey(t), memo:cr.trios[k]}; }
      }
      return {k:null, third:null, memo:null};
    };
    const seen={};   // reg → {pairKey → [third по неделям]}
    const days=['2026-02-10','2026-03-10','2026-04-14','2026-05-12','2026-06-09','2026-07-21','2026-08-11'];
    days.forEach(day=>{
      cr.day=day; CC_POOLS=null; CC_NOW_CARDS={};
      const row={day, rooms:{}};
      CC_REGIONS.forEach(reg=>{
        let ranked=null;
        try{ ranked=ccAsRegion(reg, ()=>careerWorldD1(day)); }catch(e){ row.rooms[reg]={err:String(e).slice(0,100)}; return; }
        if(!ranked){ row.rooms[reg]={none:true}; return; }
        let foreign=0, people=0, ladder=0, nomemo=0, memoOther=0; const fx=[];
        ranked.forEach(t=>{
          const sq=t.squad||t._cards||[];
          sq.forEach(c=>{ people++; if(regOf(c)!==reg){ foreign++; if(fx.length<4) fx.push(c.handle+'('+regOf(c)+')'); } if(c.tier==='ladder') ladder++; });
          const tr=trioOf(sq);
          if(tr && !tr.k) nomemo++;
          if(tr && tr.k){ if(tr.memo!==tr.third) memoOther++; const bag=(seen[reg]=seen[reg]||{}); (bag[tr.k]=bag[tr.k]||[]).push(tr.third); }
        });
        row.rooms[reg]={teams:ranked.length, foreign, people, ladder, nomemo, memoOther, fx};
      });
      out.weeks.push(row);
    });
    // устойчивость троек: пары, виденные ≥3 недель, у скольких третий менялся
    out.stick={};
    Object.keys(seen).forEach(reg=>{ let n=0, changed=0; Object.values(seen[reg]).forEach(arr=>{ if(arr.length<3) return; n++; if(new Set(arr).size>1) changed++; }); out.stick[reg]={pairs:n, changed}; });
    // Глобалы
    cr.day='2026-09-05'; CC_POOLS=null; CC_NOW_CARDS={};
    const me=careerCard(); const mates=careerMates(); const drafted=[me].concat(mates);
    const you=careerTeam(drafted);
    const field=careerGlobalsField(you, drafted, null);
    let mixed=0, nomemo=0, memoOther=0, memoMissing=0; const mx=[], mo=[];
    const byRoute={};
    field.forEach(t=>{
      const sq=t.squad||[]; byRoute[t.gcRoute||'?']=(byRoute[t.gcRoute||'?']||0)+1;
      const regs=new Set(sq.map(regOf)); if(regs.size>1){ mixed++; if(mx.length<8) mx.push(sq.map(c=>c.handle+'('+regOf(c)+')').join(' / ')+' ['+t.gcRoute+']'); }
      const tr=trioOf(sq);
      if(tr && !tr.k) nomemo++;
      else if(tr && tr.memo!==tr.third){ memoOther++; if(mo.length<8) mo.push(sq.map(c=>c.handle).join(' / ')+' memo→'+tr.memo+' ['+t.gcRoute+']'); }
    });
    out.globals={teams:field.length, byRoute, mixed, nomemo, memoOther, mx, mo, memoSize:Object.keys(cr.trios||{}).length};
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccw2-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=240000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
console.log('неделя      регион  команд  чужих/людей  ладдер  без памяти  третий≠память  примеры чужих');
out.weeks.forEach(w => Object.keys(w.rooms).forEach(reg => { const r = w.rooms[reg];
  console.log([w.day, reg.padEnd(6), r.err ? 'ERR ' + r.err : r.none ? 'нет комнаты' : [String(r.teams).padEnd(6), (r.foreign + '/' + r.people).padEnd(12), String(r.ladder).padEnd(7), String(r.nomemo).padEnd(11), String(r.memoOther).padEnd(14), r.fx.join(', ')].join(' ')].join('  ')); }));
console.log('устойчивость троек по неделям (пары ≥3 недель: сменивших третьего):', JSON.stringify(out.stick));
console.log('Глобалы:', JSON.stringify(out.globals, null, 1));
