// Строки живой таблицы переживают перестановку, а не рождаются заново.
//
// Жалоба игрока 24 августа: «game is laggy for me», и на второй скрин он
// ответил «phone». Замер на телефоне (Chrome, CPU ×6, вечер дивизионного
// кубка, 30 секунд): задачи главного потока 21.8 с, из них скрипт 3.9 с, а
// пересчёт стилей и раскладка — 9.2 с. То есть интерфейс стоил дороже всей
// симуляции, и почти всё это была одна строка кода: body.innerHTML='' на
// каждой перестановке, то есть шестьдесят новых строк по семь ячеек ради
// пары изменившихся чисел.
//
// После правки (узел принадлежит команде, appendChild переносит, пишется
// только изменившееся): задачи 11.4 с, раскладка 1.1 с, стили 1.3-2.5 с.
//
// Эта проверка сторожит именно то, чем куплено ускорение: сколько строк
// СОЗДАНО за вечер против того, сколько раз таблица перестраивалась. Если
// кто-нибудь вернёт innerHTML='', число созданных подскочит в десятки раз.
//
//   node tools/check-live-row-reuse.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={created:0, moves:0, rows:0, games:0, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Reuse', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
      careerRenderHub('centre');
    }
    careerSimSet(false);
    /* Считаем два числа: сколько НОВЫХ <tr> появилось в теле таблицы и сколько
       раз таблица переставлялась. Перестановка узнаётся по тому же событию —
       строки переносятся, — поэтому мерой перестановок берём число пачек
       мутаций с перемещением (removed+added одного и того же узла). */
    const seenNodes=new WeakSet();
    let created=0, batches=0;
    const mo=new MutationObserver(recs=>{
      let touched=false;
      recs.forEach(r=>{
        r.addedNodes.forEach(n=>{
          if(n.nodeType!==1 || n.tagName!=='TR') return;
          touched=true;
          if(!seenNodes.has(n)){ seenNodes.add(n); created++; }
        });
      });
      if(touched) batches++;
    });
    const arm=setInterval(()=>{
      const body=document.getElementById('finalsLiveBody');
      if(body && !body.__armed){ body.__armed=1; mo.observe(body, {childList:true}); }
    }, 25);
    const ans=setInterval(()=>{
      const am=document.getElementById('ccAskModal');
      if(am && am.style.display==='flex'){
        const no=document.getElementById('ccAskNo');
        if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
      const c0=document.querySelector('.cc-choice-btn'); if(c0){ c0.click(); return; }
      const p=document.querySelector('.landing-picker'); if(!p) return;
      const z=p.querySelectorAll('.land-zone'); if(!z.length) return;
      z[0].click();
      const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click();
    }, 25);
    const btn=document.querySelector('#screen-career-hub .ch-play');
    if(!btn) throw new Error('нет кнопки «играть»');
    btn.click();
    const games=new Set();
    for(let i=0;i<4000;i++){
      await wait(20);
      const t=(document.getElementById('finalsLiveTitle')||{}).textContent;
      if(t) games.add(t);
      const card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
      if(card || games.size>=4) break;
    }
    clearInterval(arm); clearInterval(ans); mo.disconnect();
    out.created=created;
    out.moves=batches;
    out.rows=document.querySelectorAll('#finalsLiveBody tr').length;
    out.games=games.size;
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccreuse-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }

let bad = 0;
const say = (ok, s) => { console.log((ok ? '  ok  ' : ' FAIL ') + s); if (!ok) bad++; };
console.log('  строк на экране ' + out.rows + ', игр под наблюдением ' + out.games +
            ', перестановок ' + out.moves + ', создано строк ' + out.created);
say(out.moves >= 3, 'таблица переставлялась (' + out.moves + ' раз)');
/* Мерой берём строки НА ОДНУ перестановку. Пересборка целиком — это ровно
   столько, сколько строк на экране (шестьдесят); переиспользование — только
   те команды, что впервые вошли в показанную часть таблицы, то есть единицы.
   Порог посередине этой пропасти и потому ни к чему не подогнан: на сборке до
   правки проба даёт около шестидесяти, после — около четырёх. */
const perMove = out.created / Math.max(1, out.moves);
say(perMove < 10,
    'строки переживают перестановку: ' + perMove.toFixed(1) + ' новых на перестановку' +
    ' (создано ' + out.created + ' за ' + out.moves + '; пересборка дала бы ≈' + out.rows + ')');
if ((out.errs || []).length) { console.error('page errors: ' + out.errs.join(' | ')); bad++; }
process.exit(bad ? 1 : 0);
