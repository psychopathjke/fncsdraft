// Кого сажают к сироте (ccOrphanPairs): «ближайший по силе свободный» — а проба
// career-duo-swap-probe показала, что всем семи сиротам достался один pixx.
// Печатает силу сироты, pixx и пятёрку ближайших свободных, и сколько свободных
// вообще несут рейтинг. Плюс сценарий тестера 16.09: напарник взят из СВОБОДНЫХ
// (личка «свободен»), потом сменён на половинку живой пары — куда идёт бывший.
//
//   node tools/career-orphan-mate-probe.js
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
    const paired=new Set(); pool.duos.forEach(d=>d.cards.forEach(c=>paired.add(c._k||hKey(c))));
    const free=(pool.players||[]).filter(c=>!paired.has(c._k||hKey(c)));
    const ovrs=free.map(c=>ccCardOvr(c));
    out.freeN=free.length;
    out.freeFinite=ovrs.filter(v=>isFinite(v) && v>0).length;
    out.freeHist={};
    ovrs.forEach(v=>{ const b=isFinite(v)?Math.floor(v/5)*5:'nan'; out.freeHist[b]=(out.freeHist[b]||0)+1; });
    const px=free.find(c=>hKey(c)==='pixx');
    out.pixx=px ? {ovr:ccCardOvr(px), _ovr:px._ovr, ev:String(px.event||'').slice(0,30)} : null;
    // Сирота syaaz (пара scaryy+syaaz из первой пробы): пятёрка ближайших свободных.
    const d=(pool.duos||[]).find(x=>x.cards.some(c=>hKey(c)==='syaaz'));
    if(d){
      const X=d.cards.find(c=>hKey(c)==='syaaz');
      out.orphanOvr=ccCardOvr(X);
      out.nearest=free.map(c=>({h:hKey(c), ovr:ccCardOvr(c), gap:Math.abs(ccCardOvr(c)-ccCardOvr(X))}))
        .sort((a,b)=>a.gap-b.gap).slice(0,6);
    }
    // Сценарий тестера: напарник E из свободных (личка), потом смена на B из живой пары B+Y.
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
    const E=free.filter(c=>isFinite(ccCardOvr(c)) && Math.abs(ccCardOvr(c)-86)<3)[0];
    const dB=(pool.duos||[]).filter(x=>x.cards.length===2 && Math.abs(ccDuoOvr(x)-86)<4)[3];
    if(E && dB){
      const B=dB.cards[0], Y=dB.cards[1];
      careerMateSeat({handle:E.handle, card:E, dev:0});
      room([me, E]); room([me, E]);
      careerMateSeat({handle:B.handle, card:B, dev:0});
      const f1=room([me, B]), f2=room([me, B]);
      out.tester={E:hKey(E), Eovr:ccCardOvr(E), B:hKey(B), Y:hKey(Y), Yovr:ccCardOvr(Y),
                  Ewith:[mateOf(f1,hKey(E)), mateOf(f2,hKey(E))], Ywith:[mateOf(f1,hKey(Y)), mateOf(f2,hKey(Y))],
                  memo:JSON.stringify(cr.orphanMate||{})};
    }
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccorph-'));
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
console.log('свободных:', out.freeN, 'с рейтингом:', out.freeFinite, 'гистограмма:', JSON.stringify(out.freeHist));
console.log('pixx:', JSON.stringify(out.pixx));
console.log('сирота syaaz ovr', out.orphanOvr, 'ближайшие:', JSON.stringify(out.nearest));
console.log('сценарий тестера:', JSON.stringify(out.tester, null, 1));
