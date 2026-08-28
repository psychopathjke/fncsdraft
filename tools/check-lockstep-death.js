// Второй сторож локстепа: тот же вечер, но ЖИВОЙ — тот, который игрок видит.
//
// Первый сторож (check-lockstep.js) считала вечер через simulateGames, то есть
// чистым расчётом, и два браузера сошлись до последнего килла. Показывает же
// вечер simulateGamesLive: таймеры, кадры, вопрос о высадке перед каждой игрой,
// выборы посреди игры. Если в этом пути хоть одна случайность зависит от того,
// сколько кадров успело нарисоваться, два клиента разъедутся — и мультиплеер
// придётся показывать иначе (посчитать вечер целиком, потом проигрывать).
//
// Поэтому Math.random подменяется ДО загрузки приложения, харнесс отвечает на
// все вопросы одинаково, и сравниваются итоговые таблицы двух процессов.
//
// Это СТОРОЖ, а не проба: он гоняется на каждой сборке. Локстеп — единственное
// допущение, на котором стоит командная карьера, и ломается он молча: таблицы
// разъезжаются, а на экране у обоих всё выглядит нормально до конца вечера.
//
//   node tools/check-lockstep-live.js
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

// ПРОБА «СМЕРТЬ НА ВЫСАДКЕ» (28 августа): тот же сторож, но игрок слабый
// (CC_OVR, по умолчанию 45), высадка — КОНТЕСТ самой сильной точки, и на
// каждом вопросе записывается счётчик бросков генератора. Так видно, В КАКОЙ
// игре и на каком шаге два клиента (со скипом и без) начали тратить разное
// число бросков — а не только что итог разошёлся.
//   node tools/check-lockstep-death.js
const OVR = Number(process.env.CC_OVR || 45);
// <base href> ОБЯЗАТЕЛЕН: без него копия страницы во временной папке не
// находит zone-sim.js и zone-replay.js, ZoneSim остаётся undefined, и вечер
// идёт БЕЗ КАРТЫ — другим путём, чем у игрока. Так этот сторож с 25 по 28
// августа мерил не тот вечер и был зелёным. Найдено 28 августа.
// Сид ставится в самое начало страницы: всё, что рисуется и считается после,
// тянет числа из него. Это и есть «сервер раздал сид» в чистом виде.
const head = (seed) => `<script>
(function(){
  var a=${seed}>>>0;
  window.__rolls=0;
  Math.random=function(){
    window.__rolls++;
    a=a+0x6D2B79F5|0;
    var t=Math.imul(a^a>>>15, 1|a);
    t=t+Math.imul(t^t>>>7, 61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
  window.__errs=[];
  window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });
})();
<\/script>`;

const boot = (pollMs, skip) => `<script>var OVR_=${OVR};</script>`+`
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // Харнесс отвечает на всё одинаково: первая зона, первый выбор, скип.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, ${pollMs});
  const out={notes:{}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Lockstep', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:OVR_, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'${process.env.CC_DAY||'2026-02-02'}', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]}, partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(OVR_,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    window.__trace=[];
    const tr=(name, fn)=>function(){ window.__trace.push(name+'@'+window.__rolls); return fn.apply(this, arguments); };
    careerLandingPick=tr('pick', careerLandingPick);
    ccAskLoot=tr('loot', ccAskLoot);
    ccAskLate=tr('late', ccAskLate);
    creditLandingFights=tr('fights', creditLandingFights);
    showVictoryRoyale=tr('vr', showVictoryRoyale);
    // Цена фаз: своё лобби (с вопросами), чужое лобби, комната лута/высоты.
    const cost=(name, fn)=>function(){ const a=window.__rolls; const r=fn.apply(this, arguments);
      const fin=()=>window.__costs.push(name+':'+(window.__rolls-a));
      if(r && typeof r.then==='function') return r.then(v=>{ fin(); return v; });
      fin(); return r; };
    window.__costs=[];
    playGameWithChoices=cost('own', playGameWithChoices);
    simulateGame=cost('other', simulateGame);
    ccRoomLoot=cost('roomLoot', ccRoomLoot);
    ccRoomLate=cost('roomLate', ccRoomLate);
    creditLandingFights=cost('fights', creditLandingFights);
    accumulateMatchStats=cost('stats', accumulateMatchStats);
    // Напарник — первый, кто написал: у обоих клиентов он один и тот же,
    // потому что и мир, и очередь писем посеяны одним сидом.
    const dm=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
    if(dm){ careerDmAccept(dm.id); careerRenderHub('centre'); }
    out.notes.mate=(careerPartnerCard()||{}).handle||null;
    out.notes.zone={sim:typeof ZoneSim, replay:typeof ZoneReplay, use:(function(){ try{ return useZoneSim([{squad:[{},{}]}]); }catch(e){ return 'err '+e.message; } })(), set:ACTIVE_LANDING_SET, zones:(ZONE_SETS[ACTIVE_LANDING_SET]||[]).length};
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play){ out.fail='нет кнопки вечера'; throw new Error(out.fail); }
    const sk=setInterval(()=>{ if(!${skip?'true':'false'}) return; const b=document.getElementById('majorSkipBtn');
      if(b && !b.disabled) b.click(); }, ${pollMs});
    play.click();
    let card=null;
    for(let i=0;i<16000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if(!card){ out.fail='результат не пришёл'; throw new Error(out.fail); }
    out.notes.head=[...document.querySelectorAll('#majorStages .stage-card h4')]
      .map(h=>h.textContent.replace(/\\s+/g,' ').trim()).join(' | ');
    // Вся турнирная таблица вечера, как её увидел игрок.
    out.notes.table=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
      .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
      .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' '));
    const log=(CAREER.career.log||[]);
    const last=log[log.length-1]||{};
    out.notes.mine={place:last.place, of:last.of, pts:last.pts, wins:last.wins, elims:last.elims};
    out.notes.trace=window.__trace; out.notes.rolls=window.__rolls; out.notes.costs=window.__costs;
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=(window.__errs||[]).slice(0,3);
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const run = (tag, seed, pollMs, skip) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdeath-' + tag + '-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + head(seed) + src + boot(pollMs === undefined ? 20 : pollMs, skip !== false));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
    'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(tag + ': проба не отработала, копия ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.fail) { console.error(tag + ': ' + out.fail); process.exit(1); }
  if (out.errs && out.errs.length) console.error(tag + ' ошибки страницы: ' + out.errs.join(' | '));
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
};

const SEED = 20260825;
const a = run('клиент A', SEED);
const b = run('клиент B', SEED);
 const d = run('медленный', SEED, 7, false);
const hash = t => crypto.createHash('sha1').update(t.join('\n')).digest('hex').slice(0, 12);
const show = (n, r) => console.log(n + ': ' + r.head + ' · строк ' + r.table.length +
  ' · своё ' + JSON.stringify(r.mine) + ' · хеш ' + hash(r.table));
console.log('движок:', JSON.stringify(a.zone));
show('A', a); show('B', b); show('другой темп', d);
(function(){ const agg={}; (a.costs||[]).forEach(c=>{ const [k,v]=c.split(':'); const o=agg[k]=agg[k]||{n:0,sum:0,min:1e9,max:0}; o.n++; o.sum+=+v; o.min=Math.min(o.min,+v); o.max=Math.max(o.max,+v); });
  Object.keys(agg).forEach(k=>console.log('  цена '+k+': вызовов '+agg[k].n+', всего '+agg[k].sum+', в среднем '+Math.round(agg[k].sum/agg[k].n)+' ['+agg[k].min+'..'+agg[k].max+']')); })();
const diffTrace=(x, y, nx, ny)=>{
  const n=Math.max(x.length, y.length);
  for(let i=0;i<n;i++){ if(x[i]!==y[i]){
    console.error('СЛЕД РАЗОШЁЛСЯ на шаге '+(i+1)+': '+nx+' '+x[i]+' | '+ny+' '+y[i]);
    console.error('  до него: '+x.slice(Math.max(0,i-4), i).join(' '));
    return true; } }
  return false;
};
if (hash(a.table) !== hash(b.table)) {
  const at = a.table.findIndex((r, i) => r !== b.table[i]);
  console.error('РАЗОШЛОСЬ на строке ' + (at + 1));
  console.error('  A: ' + a.table[at]);
  console.error('  B: ' + b.table[at]);
  console.error('совпало строк подряд: ' + at + ' из ' + a.table.length);
  process.exit(1);
}
console.log('игрок '+OVR+': своё A '+JSON.stringify(a.mine)+' · D '+JSON.stringify(d.mine)+' · бросков A '+a.rolls+' D '+d.rolls);
const tdiff=diffTrace(a.trace, d.trace, 'A', 'D');
if (hash(d.table) !== hash(a.table) || tdiff) {
  const at2 = a.table.findIndex((r, i) => r !== d.table[i]);
  console.error('ТЕМП РЕШАЕТ: клиент без скипа и с другим шагом опроса разъехался на строке ' + (at2 + 1));
  console.error('  A: ' + a.table[at2]);
  console.error('  D: ' + d.table[at2]);
  process.exit(1);
}
console.log('другой темп показа: та же таблица — кадры на исход не влияют');
console.log('СОШЛОСЬ — живой вечер с выборами считается одинаково в двух браузерах');
