// Сцена держит состав ВЕСЬ СЕЗОН, а неделя решает только, кто сегодня приехал.
//
// Его слово 23 сентября: «и в сезоне 2025 триосы сражу меняться начинают».
// Замер двух недель одной карьеры (2025, Европа, трио): 421 настоящий человек
// из 928 выходил в другом составе, и 403 из них сидели с настоящими же людьми,
// то есть это была не возня выдуманных, а настоящая сцена.
//
// Ломалось двумя местами сразу, оба в хвосте careerCupField:
//
//   1. Остаток ростера (все, кто не в записанной паре и не закреплённый третий —
//      четыреста с лишним человек) перетасовывался НЕДЕЛЬНЫМ броском и резался
//      по три подряд. Новая неделя — новая нарезка, с нуля.
//   2. Резались они вперемешку с выдуманными: список сортируется по рейтингу,
//      и тройка настоящего зависела от того, кто из ботов встал рядом. Боты
//      приходят каждую неделю разные, а с 23 сентября их рейтинг ещё и
//      дрейфует (CAREER.devL) — один сдвинувшийся сосед переписывал всю
//      нарезку после себя.
//
// Здесь проверяется результат: одна карьера, две недели, и настоящие имена
// стоят теми же составами. Выдуманные при этом пересобираться МОГУТ — их
// комната и должна меняться от явки.
//
//   node tools/check-career-scene-stable.js
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
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Scene', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:3, year:2025, year0:2025, day:'2025-01-13', division:1,
              earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'scn'},
      partner:{card:card('M1',94), patience:60, since:'2024-11-01', dev:0},
      partners:[{card:card('M1',94), patience:60, since:'2024-11-01', dev:0},
                {card:card('M2',93), patience:60, since:'2024-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();

    /* Комната строится тем же вызовом, что у кубкового вечера. ОДНА карьера на
       обе недели: память троек (cr.trios) копится, как в живой игре, — прошлая
       версия пробы заводила карьеру заново и мерила сборку без памяти. */
    const roomOf=()=>{
      const cr=CAREER.career, me=careerCard(), mates=careerMates();
      return careerCupField(cr, [me].concat(mates.filter(Boolean)), 400, null, true, 0);
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
    const w1=roomOf();
    CAREER.career.day='2025-02-24'; careerSave();
    const w2=roomOf();

    // Кто настоящий, а кто выдуманный.
    const real=new Set();
    [w1,w2].forEach(f=>f.forEach(t=>(t.squad||[]).forEach(c=>{
      if(c && c.tier!=='ladder' && c.handle) real.add(hKey(c)); })));
    const m1=squadsIn(w1), m2=squadsIn(w2);

    let both=0, moved=0; const sample=[];
    m1.forEach((mates1, who)=>{
      if(!real.has(who) || !m2.has(who)) return;
      both++;
      if(m2.get(who)!==mates1){ moved++; if(sample.length<5) sample.push(who+': '+mates1+' → '+m2.get(who)); }
    });
    out.notes.настоящие={вОбоих:both, сменилиСостав:moved, примеры:sample};
    check('в комнате есть настоящая сцена', both>300, JSON.stringify(out.notes.настоящие));
    /* Порог, а не ноль: одна тройка на стыке настоящих и выдуманных смешанная
       по построению (остаток настоящих не всегда делится на три), и её состав
       от явки зависит законно. Замер до правки — 421, после — 1. */
    check('настоящие стоят теми же составами обе недели',
          moved <= Math.max(5, Math.round(both*0.02)), JSON.stringify(out.notes.настоящие));

    // А выдуманные пересобираться могут — их комната и должна жить от явки.
    let madeBoth=0, madeMoved=0;
    m1.forEach((mates1, who)=>{
      if(real.has(who) || !m2.has(who)) return;
      madeBoth++; if(m2.get(who)!==mates1) madeMoved++;
    });
    out.notes.выдуманные={вОбоих:madeBoth, сменилиСостав:madeMoved};
    check('выдуманные при этом не заморожены намертво',
          madeBoth===0 || madeMoved>0, JSON.stringify(out.notes.выдуманные));

    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccscn-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-scene-stable');
