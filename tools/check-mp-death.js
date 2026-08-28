// КОМАНДНЫЙ ВЕЧЕР СО СЛАБЫМ ИГРОКОМ, который гибнет на высадке (28 августа):
// та же подставная лобби-проба, что check-mp-seed, но игрок CC_OVR (75) на
// дне CC_DAY (Victory Cup, открытая комната 2450), и на каждом решении
// записывается счётчик общих бросков (CC_MP_ROLLS). Сравниваются торопящийся
// (скип) и досматривающий — как двое за разными машинами.
//   CC_OVR=75 CC_DAY=2026-01-12 node tools/check-mp-death.js
// (исходный текст ниже — от check-mp-seed)
// Считает ли ИГРА вечер под сидом сервера — без подмены снаружи.
//
// check-lockstep-live подменяет Math.random сидом ДО загрузки страницы и
// показывает: при одном сиде два браузера дают одну таблицу. Это доказывает
// СЛЕДСТВИЕ. Предпосылку — «сид действительно раздан» — до 28 августа не
// выполнял никто: сид приезжал в 'start', раскладывался в mpStart во всех
// одиннадцати раннерах и не читался ни разу, а вечер считался на обычном
// Math.random каждого браузера. Сторож был зелёный, режим — сломан.
//
// Здесь страница НЕ засеивается снаружи. Сид приходит единственным законным
// путём — сообщением лобби, — и дальше сравниваются таблицы двух процессов.
//
// Контроль обязателен и проверяет именно ту ошибку, которая тут возможна:
// если бы вечер оказался детерминирован и без сида, A и B совпали бы сами
// собой и сторож был бы пустым. Поэтому третий прогон идёт с ДРУГИМ сидом
// сервера и обязан дать другую таблицу.
//
// Лобби подставное и живёт в самой странице: сервер здесь не нужен, нужен
// только его порядок сообщений. Напарник в нём всегда голосует так же, как
// этот клиент: решение с 28 августа общее (ccMpVote), и без второго голоса
// вечер просто стоял бы — в одиночном процессе его подать некому.
//
//   node tools/check-mp-seed.js

const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const OVR = Number(process.env.CC_OVR || 75);
const DAY = process.env.CC_DAY || '2026-01-12';
const BASE = '<base href="file:///' +
  ROOT.split(String.fromCharCode(92)).join('/') + '/">';
const head = BASE + `<script>
window.__errs=[];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });
<\/script>`;

const boot = (seed, skip) => `
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
  }, 20);
  const out={notes:{}, errs:null, fail:null};
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Aseed', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:${OVR}, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'${DAY}', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'fixed-world',
              mp:{code:'ABC123', role:'a'}}, partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(${OVR},'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    /* ---- подставное лобби ----------------------------------------------
       Настоящего сокета нет и не нужно: проверяется не транспорт, а порядок.
       Исходящее превращается во входящее ровно так, как это делает сервер
       (server/src/lobby.js): 'ready' -> 'start' с сидом, 'act' -> эхо всем,
       'digest' -> 'close' с тем состоянием, которое клиент и прислал. */
    let n=0;
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.send=function(m){
      if(!m) return;
      if(m.t==='ready') return MP.say({t:'start', seed:${JSON.stringify(String(seed))},
                                       n:++n, day:m.day});
      if(m.t==='act'){
        window.__acts=window.__acts||[];
        window.__acts.push(m.kind+':'+JSON.stringify(m.payload && m.payload.v)+'@'+(typeof CC_MP_ROLLS!=='undefined'?CC_MP_ROLLS:'?'));
        /* Эхо — как у сервера, всем и с именем отправителя.

           И сверх того подставное лобби ОТВЕЧАЕТ ЗА НАПАРНИКА на его вопросы:
           вопросы разделены по ролям (CC_MP_WHO), восьмая зона принадлежит
           фраггеру, а фраггер здесь ненастоящий и сам не ответит никогда.
           Без этого клиент честно ждал бы его до конца вечера.

           Ответ шлётся на ПРИХОД ('kind@'), то есть ровно тогда, когда вопрос
           открывается, и одним и тем же значением — проба про сид, лишняя
           случайность ей ни к чему. Свои вопросы клиент отвечает сам, лишний
           ответ в очереди ему не мешает. */
        // Как сервер: сначала эхо МОЕГО действия (с моим именем), потом голос напарника.
        MP.say({t:'act', kind:m.kind, n:++n, by:ccMpId(), payload:Object.assign({}, m.payload||{})});
        if(m.kind==='skip'){
          MP.say({t:'act', kind:'skip', n:++n, by:'peer', payload:{by:'peer'}});
          window.__skipAt=window.__skipAt||[]; window.__skipAt.push(CC_MP_ROLLS);
          return;
        }
        MP.say({t:'act', kind:m.kind, n:++n, by:'peer',
                payload:{v:m.payload && m.payload.v, by:'peer'}});
        const base=String(m.kind).replace(/@$/, '');
        const canned={drop:{id:'quiet'}, loot:'take', late:'hg'};
        if(/@$/.test(m.kind) && canned.hasOwnProperty(base))
          MP.say({t:'act', kind:base, n:++n, by:'peer',
                  payload:{v:canned[base], by:'peer'}});
        return;
      }
      if(m.t==='digest')return MP.say({t:'close', team:m.team, n:++n});
    };
    MP.state='live';
    // Напарник нужен живой: без него careerMates не соберёт команду, а
    // careerCanPlayKind не пустит в вечер.
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:92, org:null,
             tier:'ranked', event:'', placement:null, _targetOvr:92,
             _attrs:null, _roleKey:'roleFRG', form:0, tired:0, sick:false,
             camp:null, gear:[]};
    careerEntry();
    window.__costs=[];
    const cost=(name, fn)=>function(){ const a=CC_MP_ROLLS; const r=fn.apply(this, arguments);
      const fin=()=>window.__costs.push(name+':'+(CC_MP_ROLLS-a));
      if(r && typeof r.then==='function') return r.then(v=>{ fin(); return v; });
      fin(); return r; };
    playGameWithChoices=cost('own', playGameWithChoices);
    simulateGame=cost('other', simulateGame);
    ccAskLoot=cost('askLoot', ccAskLoot);
    ccAskLate=cost('askLate', ccAskLate);
    careerLandingPick=cost('pick', careerLandingPick);
    out.notes.напарник=(careerPartnerCard()||{}).handle||null;
    out.notes.сид=${JSON.stringify(String(seed))};
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play){ out.fail='нет кнопки вечера'; throw new Error(out.fail); }
    /* Скип — не украшение, а разная скорость показа у двоих: один торопится,
       второй досматривает вечер. Если бы показ тратил броски, потоки
       Math.random у них разъехались бы, и общий сид не спас бы. */
    const sk=setInterval(()=>{ if(!${skip?"true":"false"}) return;
      const b=document.getElementById('majorSkipBtn');
      if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let card=null;
    for(let i=0;i<16000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if(!card){ out.fail='результат не пришёл'; throw new Error(out.fail); }
    out.notes.table=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
      .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
      .map(tr=>[...tr.children].map(td=>td.textContent.trim()).join(' '));
    /* След вечера в карьере. В первом дивизионе понедельничный вечер не
       пишется в журнал, а откладывается до вторника (careerBanking, cr.d1) —
       поэтому годится любой из двух следов, но хоть один быть обязан: без
       него сравнивать таблицы было бы нечего, вечер прошёл бы мимо карьеры. */
    const log=(CAREER.career.log||[]);
    const last=log[log.length-1]||{};
    out.notes.след = log.length ? {журнал:{place:last.place, of:last.of, pts:last.pts}}
              : (CAREER.career.d1 ? {отложено:CAREER.career.d1.monday||true} : null);
    // И генератор вкладки вернулся себе: оставленный сид заморозил бы
    // страницу до перезагрузки.
    out.notes.сидСнят=(CC_MP_RAND===null);
    out.notes.решения=(window.__acts||[]).join(' | ');
    out.notes.rolls=(typeof CC_MP_ROLLS!=='undefined'?CC_MP_ROLLS:null);
    out.notes.skipRounds=(window.__skipAt||[]).length; out.notes.skipWas=!!CC_SKIP_RUN;
    out.notes.costs=window.__costs;
    out.notes.mine=(function(){ const l=(CAREER.career.log||[]); const r=l[l.length-1]||{}; return {place:r.place, of:r.of, pts:r.pts, wins:r.wins, elims:r.elims}; })();
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=(window.__errs||[]).slice(0,3);
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const run = (tag, seed, skip) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpdeath-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, head + src + boot(seed, skip !== false));
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
    'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
  const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
  if (!m) { console.error(tag + ': проба не отработала, копия ' + tmp); process.exit(2); }
  const out = JSON.parse(decodeURIComponent(m[1]));
  if (out.fail) {
    if (out.errs && out.errs.length) console.error(tag + ' ошибки страницы: ' + out.errs.join(' | '));
    console.error(tag + ': ' + out.fail); process.exit(1);
  }
  if (out.errs && out.errs.length) console.error(tag + ' ошибки страницы: ' + out.errs.join(' | '));
  fs.rmSync(dir, { recursive: true, force: true });
  return out.notes;
};

const SEED = 'team-ABC123|'+DAY;
const a = run('клиент A', SEED);
const b = run('клиент B', SEED);
const c = run('контроль', SEED + '|другой');
// Тот же сид, но этот клиент вечер досматривает целиком.
const d = run('без скипа', SEED, false);
const hash = t => crypto.createHash('sha1').update(t.join('\n')).digest('hex').slice(0, 12);
const show = (n, r) => console.log(n + ': решений ' +
  (r.решения ? r.решения.split(' | ').length : 0) + ' · строк ' + r.table.length +
  ' · след ' + JSON.stringify(r.след) + ' · хеш ' + hash(r.table) +
  ' · сид снят: ' + r.сидСнят);
show('A        ', a); show('B        ', b); show('контроль ', c); show('без скипа', d);
(function(){ const agg={}; (a.costs||[]).forEach(c=>{ const [k,v]=c.split(':'); const o=agg[k]=agg[k]||{n:0,sum:0,list:[]}; o.n++; o.sum+=+v; o.list.push(+v); });
  Object.keys(agg).forEach(k=>console.log('  цена '+k+': вызовов '+agg[k].n+', всего '+agg[k].sum+(k==='own'||k==='pick'||k==='askLoot'||k==='askLate'?' · по играм '+agg[k].list.join(','):''))); })();
console.log('скип у A: голосований '+a.skipRounds+', CC_SKIP_RUN '+a.skipWas+' · у D: '+d.skipRounds);
console.log('игрок '+OVR+' · '+DAY+' · броски A '+a.rolls+' / без скипа '+d.rolls+' · своё A '+JSON.stringify(a.mine)+' D '+JSON.stringify(d.mine));
(function(){ const x=(a.решения||'').split(' | '), y=(d.решения||'').split(' | ');
  for(let i=0;i<Math.max(x.length,y.length);i++) if(x[i]!==y[i]){ console.log('СЛЕД РЕШЕНИЙ разошёлся на '+(i+1)+': A '+x[i]+' | D '+y[i]); console.log('  до: '+x.slice(Math.max(0,i-3),i).join(' ')); break; } })();

let bad = 0;
if (hash(a.table) !== hash(b.table)) {
  const at = a.table.findIndex((r, i) => r !== b.table[i]);
  console.error('FAIL два клиента с ОДНИМ сидом сервера разошлись на строке ' + (at + 1));
  console.error('  A: ' + a.table[at]);
  console.error('  B: ' + b.table[at]);
  bad++;
}
if (hash(a.table) !== hash(d.table)) {
  const at = a.table.findIndex((r, i) => r !== d.table[i]);
  if (a.решения !== d.решения) {
    console.error('  решения разошлись, а не расчёт:');
    console.error('    со скипом: ' + a.решения);
    console.error('    без скипа: ' + d.решения);
  } else {
    console.error('  решения ОДНИ И ТЕ ЖЕ — разошёлся сам расчёт');
  }
  console.error('FAIL скип поменял вечер: тот, кто досматривает, получил другую таблицу');
  console.error('  со скипом:  ' + a.table[at]);
  console.error('  без скипа:  ' + d.table[at]);
  bad++;
}
if (hash(a.table) === hash(c.table)) {
  console.error('FAIL другой сид сервера дал ту же таблицу — значит сид не читается,');
  console.error('     и совпадение A и B ничего не доказывает');
  bad++;
}
if (!a.след || !b.след) {
  console.error('FAIL вечер прошёл мимо карьеры: ни записи в журнале, ни отложенного');
  bad++;
}
if (!a.table.length) {
  console.error('FAIL таблица пустая — сравнивать нечего, сторож был бы пустым');
  bad++;
}
if (!a.сидСнят || !b.сидСнят) {
  console.error('FAIL после вечера Math.random остался подменённым: вкладка заморожена');
  bad++;
}
if (bad) process.exit(1);
console.log('игра считает вечер под сидом сервера и возвращает генератор себе');
