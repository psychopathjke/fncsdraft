// «Если взять новое дуо, твой бывший тимейт обязательно уйдёт к бывшему
// тимейту твоего нового дуо». Отчёт тестера, 16 сентября 2026.
//
// Проба: дуо-сезон, игрок берёт напарника A (из записанной пары A+X), играет
// комнату, потом меняет его на B (из пары B+Y) и смотрит, с кем сидят A и Y
// в следующих комнатах. Так по шести разным парам подряд.
//
//   node tools/career-duo-swap-probe.js
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
(function(){
  const out = {rows:[], errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeS', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:'probes', cardRegion:'EU', nat:null},
      career:{season:1, size:2, day:'2026-02-10', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=2;
    const cr=CAREER.career;
    const me=careerCard();
    const pool=careerPools();
    // Пары с рейтингом около игрока, чтобы карточка «стоила» взять.
    const duos=(pool.duos||[]).filter(d=>d.cards.length===2 && Math.abs(ccDuoOvr(d)-86)<4).slice(0, 14);
    const mateOf=(field, h)=>{
      const t=(field||[]).find(x=>(x.squad||[]).some(c=>hKey(c)===h));
      if(!t) return null;
      return (t.squad||[]).map(c=>hKey(c)).filter(k=>k!==h).join('&')||'(один)';
    };
    let day=new Date('2026-02-10T00:00:00Z');
    const room=(drafted)=>{
      cr.day=day.toISOString().slice(0,10);
      day=new Date(day.getTime()+3*86400000);
      const f=careerCupField(cr, drafted, careerCupSize(1), null, false, 0);
      simulateGames(f.slice(0, Math.min(f.length, 400)), 6, victoryR1Points, 3);
      careerGrowField(f.slice(0, Math.min(f.length, 400)), null);
      return f;
    };
    let prev=null;   // {A, X}
    for(let i=0;i<duos.length && i<7;i++){
      const d=duos[i];
      const A=d.cards[0], X=d.cards[1];
      const kA=hKey(A), kX=hKey(X);
      // Взять A: сесть в кресло и играть две комнаты.
      careerMateSeat({handle:A.handle, card:A, dev:0});
      const f1=room([me, A]);
      const f2=room([me, A]);
      const row={take:kA, orphan:kX, orphanWith:[mateOf(f1,kX), mateOf(f2,kX)]};
      if(prev){
        row.exMate=prev.A; row.exOrphan=prev.X;
        row.exWith=[mateOf(f1,prev.A), mateOf(f2,prev.A)];
        row.exOrphanWith=[mateOf(f1,prev.X), mateOf(f2,prev.X)];
        row.exWentToNewOrphan=row.exWith.some(m=>m===kX);
      }
      out.rows.push(row);
      prev={A:kA, X:kX};
    }
    out.orphanMemo=JSON.stringify(cr.orphanMate||{});
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccswap-'));
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
if (out.fail) { console.error(out.fail); process.exit(1); }
if (out.errs && out.errs.length) console.log('ошибки страницы:', out.errs);
console.log('память сирот:', out.orphanMemo);
out.rows.forEach((r, i) => {
  console.log('#' + (i+1) + ' взял ' + r.take + ' (его пара ' + r.orphan + ' → ' + r.orphanWith.join(', ') + ')');
  if (r.exMate) console.log('    бывший ' + r.exMate + ' → ' + r.exWith.join(', ') +
    ' | сирота бывшего ' + r.exOrphan + ' → ' + r.exOrphanWith.join(', ') +
    (r.exWentToNewOrphan ? '   <<< бывший ушёл к сироте нового' : ''));
});
