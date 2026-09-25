// Дуо 2024-го не зависят от вечера: с кем человек выходит — свойство сезона,
// а не комнаты, в которую он сегодня попал.
//
// Его слово 25 сентября: «дуосы до сих пор меняются в 2024». Предыдущая правка
// (23 сентября, check-career-scene-stable) держала состав ОТ НЕДЕЛИ К НЕДЕЛЕ и
// мерила его на 2025-м и тройках; 2024-й с дуо не мерился ни разу, а ломалось
// там другое место.
//
// Остаток ростера — все, у кого пара не записана в книге, — резался на пары
// ВНУТРИ комнаты: сначала отбирали, кто в неё влез, и только потом делили по
// соседям в рейтинге. Значит напарника назначал размер вечера и то, кого этот
// вечер успел впустить, а careerCupField зовут с разной величиной и разной
// открытостью (кубок, мейджор, ласт-шанс, опен) — иногда в один день.
//
// Замер до правки, один день и одна карьера (2024, Европа, дуо):
//   комната 400 против 800 мест — 272 настоящих из 798 с другим напарником
//   открытая против закрытой     — 580 из 762
// Разным населением это не объясняется: careerRealPlayers на scope 1 и на
// scope 'all' отдаёт один и тот же пул.
//
// После: ноль и ноль. Пары считаются один раз по всему остатку (ccRestPairs),
// комната берёт их целиком, и порядок в ней идёт по сезонной нарезке, а не по
// рейтингу заново — иначе пары на одинаковом овере переслаивались (78 из 798).
//
//   node tools/check-career-2024-duos.js
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
      career:{season:1, size:2, year:2024, year0:2024, day:'2024-01-15', division:1,
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
    const roomN=(n, open)=>{
      const cr=CAREER.career, me=careerCard(), mates=careerMates();
      return careerCupField(cr, [me].concat(mates.filter(Boolean)), n, null, open, 0);
    };
    const w1=roomN(400, true);
    const w2=roomN(400, true);           // та же комната дважды — контроль
    const wBig=roomN(800, true);         // комната больше
    const wClosed=roomN(400, false);     // закрытая, тот же размер
    out.notes.churn={};
    const churn=(a,b,label)=>{
      const ma=squadsIn(a), mb=squadsIn(b); let both=0, moved=0; const ex=[];
      ma.forEach((s1, who)=>{ if(!real.has(who)||!mb.has(who)) return; both++;
        if(mb.get(who)!==s1){ moved++; if(ex.length<3) ex.push(who+': '+s1+' → '+mb.get(who)); } });
      out.notes.churn[label]={вОбоих:both, сменили:moved, примеры:ex};
    };

    // Кто настоящий, а кто выдуманный.
    const real=new Set();
    [w1,w2,wBig,wClosed].forEach(f=>f.forEach(t=>(t.squad||[]).forEach(c=>{
      if(c && c.tier!=='ladder' && c.handle) real.add(hKey(c)); })));
    churn(w1,w2,'та же комната дважды'); churn(w1,wBig,'комната 400 против 800');
    churn(w1,wClosed,'открытая против закрытой');
    const m1=squadsIn(w1), m2=squadsIn(w2);

    let both=0, moved=0; const sample=[];
    m1.forEach((mates1, who)=>{
      if(!real.has(who) || !m2.has(who)) return;
      both++;
      if(m2.get(who)!==mates1){ moved++; if(sample.length<5) sample.push(who+': '+mates1+' → '+m2.get(who)); }
    });
    out.notes.настоящие={вОбоих:both, сменилиСостав:moved, примеры:sample};
    ['та же комната дважды', 'комната 400 против 800', 'открытая против закрытой']
      .forEach(k=>{
        const c=out.notes.churn[k]||{};
        check('пара не зависит от вечера — '+k,
              c.вОбоих>300 && c.сменили===0, JSON.stringify(c));
      });
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
console.log('OK check-career-2024-duos');
