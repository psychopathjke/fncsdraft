// Трио 2025-го по ВСЕМ регионам: состав не зависит от вечера и подобран по силе.
//
// Его слово 22 сентября: «на европе триосы пофиксились, но на остальных
// регионах они очень странные, не по сили составляются», и отдельно — «в конце
// второго сезона просто все триосы перемешались на глобалс».
//
// Правка 25 сентября (ccRestPairs: пары и тройки режутся один раз на сезон по
// всему остатку, комната берёт их целиком) мерилась только на 2024-м с дуо и
// только по Европе — 272→0 и 580→0. Здесь тот же замер на трио 2025 и по
// каждому из семи регионов, и вдобавок то, о чём он писал на самом деле:
// РАЗБРОС РЕЙТИНГА ВНУТРИ ТРОЙКИ. «Не по силе» — это когда рядом с 96-м сидит
// 60-й, а не когда состав меняется.
//
//   node tools/check-career-trio-regions.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, errs:[], err:null};
  window.addEventListener('error', e=>out.errs.push(String(e.message)+' @'+e.lineno));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const REGS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
  try{
    REGS.forEach(function(REG){
      const card=(h,o)=>({handle:h, region:REG, rating:o, _ovr:o, nat:'de', tier:'ladder',
                          event:'ladder', placement:null, rarity:'common', partner:null});
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Reg', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:REG, ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
          photo:null, handle:null, cardRegion:null, nat:null},
        career:{season:2, size:3, year:2025, year0:2025, day:'2025-01-13', division:1,
                earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'reg'+REG},
        partner:{card:card('M1',94), patience:60, since:'2024-11-01', dev:0},
        partners:[{card:card('M1',94), patience:60, since:'2024-11-01', dev:0},
                  {card:card('M2',93), patience:60, since:'2024-11-01', dev:0}]}));
      const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.player.attrs=ccRookieAttrs(96,'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s));
      careerEntry();

      const roomN=(n, open)=>{
        const cr=CAREER.career, me=careerCard(), mates=careerMates();
        return careerCupField(cr, [me].concat(mates.filter(Boolean)), n, null, open, 0);
      };
      const squadsIn=field=>{
        const m=new Map();
        (field||[]).forEach(t=>{
          const sq=(t.squad||[]).filter(Boolean).map(hKey);
          if(sq.length<2) return;
          sq.forEach(x=>m.set(x, sq.filter(y=>y!==x).sort().join('+')));
        });
        return m;
      };
      const w400=roomN(400, true), w800=roomN(800, true), wShut=roomN(400, false);
      const real=new Set();
      [w400,w800,wShut].forEach(f=>f.forEach(t=>(t.squad||[]).forEach(c=>{
        if(c && c.tier!=='ladder' && c.handle) real.add(hKey(c)); })));
      const churn=(a,b)=>{
        const ma=squadsIn(a), mb=squadsIn(b); let both=0, moved=0;
        ma.forEach((s1,who)=>{ if(!real.has(who)||!mb.has(who)) return; both++;
          if(mb.get(who)!==s1) moved++; });
        return {вОбоих:both, сменили:moved};
      };
      /* «Не по силе» — это разброс ВНУТРИ тройки: сильнейший минус слабейший.
         Составы режутся по соседям в рейтинге, значит разрыв обязан быть
         маленьким у подавляющего большинства. Мерим худшую тройку и медиану. */
      const spreads=(w400||[]).map(t=>{
        const o=(t.squad||[]).filter(Boolean).map(c=>Math.round(attrsFor(c).ovr));
        return o.length>1 ? Math.max.apply(null,o)-Math.min.apply(null,o) : 0;
      }).sort((a,b)=>a-b);
      const med=spreads.length ? spreads[Math.floor(spreads.length/2)] : 0;
      const worst=spreads.length ? spreads[spreads.length-1] : 0;
      const big=spreads.filter(x=>x>12).length;

      out.notes[REG]={размер:churn(w400,w800), открытость:churn(w400,wShut),
                      разбросМедиана:med, разбросХудший:worst, тройкиСразрывом13плюс:big,
                      троек:spreads.length};

      check(REG+': состав не зависит от размера вечера',
            churn(w400,w800).сменили===0, JSON.stringify(out.notes[REG]));
      check(REG+': состав не зависит от открытости вечера',
            churn(w400,wShut).сменили===0, JSON.stringify(out.notes[REG]));
      /* Порог не ноль: на стыке настоящих и выдуманных одна тройка смешанная по
         построению, и ещё лестница добирает комнату снизу — там разрыв законен.
         Меряем долю, а не отдельные случаи. */
      check(REG+': тройки собраны по силе',
            big <= Math.max(3, Math.round(spreads.length*0.05)),
            JSON.stringify(out.notes[REG]));
    });
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccreg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1800000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 300)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-trio-regions');
