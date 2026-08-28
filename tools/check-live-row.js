// Считается ли твоя строка ПОКА идёт игра.
//
// Его правка 24 августа со скрином своей строки: «во время игры не
// насчитывается, не плюс не минус». Очки и килы в живой таблице должны расти
// по ходу матча (liveScore из onZoneFrame), а не появляться разом в конце.
//
// Проба смотрит на настоящую строку игрока в настоящем прогоне и записывает,
// сколько РАЗНЫХ значений она показала за одну игру. Одно значение — значит не
// считается; несколько — считается.
//
//   node tools/check-live-row.js
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
  const out={steps:[], errs:null, fail:null, seen:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Rower', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
      careerRenderHub('centre');
    }
    // Никакой симуляции: смотреть надо именно на живой прогон с картой.
    careerSimSet(false);
    /* Сторож показа (REPLAY_GUARD_MS) отмерян в РЕАЛЬНЫХ миллисекундах, а тут
       виртуальное время: сорок пять секунд проходят в один тик, сторож считает
       показ зависшим и поднимает skipAnimation — после первой игры кадров
       больше нет, и мерить "двигается ли строка ВНУТРИ игры" уже не на чем.
       Замер на контроле (сборка до правок): игра 1 — 8-12 снимков, игры 2-3 —
       по одному, то есть проверка проходила через раз по удаче. Отодвигаем
       сторож (переменная нарочно let), чтобы играли все наблюдаемые игры. */
    REPLAY_GUARD_MS=10*60*1000*1000;

    /* Что показывала строка игрока. Снимается с настоящей таблицы: тот же
       узел, на который он смотрел. Ключ снимка — «очки|матчи|килы», и нас
       интересует, сколько разных снимков было ВНУТРИ одной игры. */
    const seen=new Map();     // номер игры → набор снимков
    /* Наблюдатель, а не таймер. Таймер здесь врёт: виртуальное время
       headless идёт скачками, и один и тот же прогон давал то 27 снимков,
       то один. MutationObserver ловит КАЖДУЮ правку ячеек, сколько бы
       времени между ними ни прошло. */
    const take=()=>{
      const title=document.getElementById('finalsLiveTitle');
      const row=document.querySelector('#finalsLiveBody .lobby-you');
      if(!title || !row) return;
      const c=row.children;
      if(c.length<6) return;
      const n=title.textContent;
      const shot=[c[2].textContent, c[3].textContent, c[5].textContent,
                  c[6]?c[6].textContent:''].join('|');
      if(!seen.has(n)) seen.set(n, new Set());
      seen.get(n).add(shot);
    };
    const mo=new MutationObserver(take);
    const arm=setInterval(()=>{
      const body=document.getElementById('finalsLiveBody');
      if(body && !body.__armed){ body.__armed=1;
        mo.observe(body, {childList:true, subtree:true, characterData:true}); }
      take();
    }, 30);
    const btn=document.querySelector('#screen-career-hub .ch-play');
    if(!btn) fail('нет кнопки «играть»');
    btn.click();
    // Отвечаем на вопросы по ходу игры, как игрок, и ждём результата.
    let card=null;
    /* Итераций вдвое больше, чем было. С 25 августа кубок спрашивает, куда
       падать, перед каждой из одиннадцати игр (см. careerLandingPick), и
       каждая пауза съедает опросы этого цикла: на прежнем бюджете последние
       игры попадали в выборку по одному снимку — не потому, что строка не
       считалась, а потому, что смотреть было некогда. Замер отдельной пробой:
       игрок на высадке в кубке не умирает вовсе (0 из 66 игр), так что дело
       было именно в бюджете. */
    for(let i=0;i<6000;i++){
      await wait(20);
      // Вечер без метки дома спрашивает до раннера (careerSpotGate): отвечаем
      // «сыграть без метки», иначе окно стоит вечно и таблицы не будет вовсе.
      const am=document.getElementById('ccAskModal');
      if(am && am.style.display==='flex'){
        const no=document.getElementById('ccAskNo');
        if(no && no.textContent===L().ccSpotGatePlay) no.click(); }
      const ask=document.querySelector('.cc-choice');
      if(ask){ const b=ask.querySelectorAll('.cc-choice-btn'); if(b.length) b[0].click(); }
      const pick=document.querySelector('.landing-picker .land-zone');
      if(pick){ pick.click();
        const ok=document.querySelector('#gameLandingConfirm');
        if(ok && !ok.disabled) ok.click(); }
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
      // Досматривать весь вечер незачем: вопрос — считается ли строка ВНУТРИ
      // игры, и двух наблюдённых игр для ответа достаточно.
      // Игра засчитывается ДОИГРАННОЙ, когда в заголовке появилась следующая:
      // иначе последняя в списке — та, которую только что открыли, и в ней
      // ровно один снимок просто потому, что цикл на ней и оборвался.
      //
      // Пять доигранных, а не две: под виртуальным временем кадры и опрос
      // ложатся друг на друга как повезёт, и на выборке в две игры проверка
      // была подбрасыванием монеты (контроль на сборке до правок: один прогон
      // из двух красный). Порог тот же — половина игр, — выборка больше.
      if(card || seen.size>=6) break;
    }
    clearInterval(arm); mo.disconnect(); take();
    const rows=[...seen.entries()].map(([n,s])=>({game:n, shots:s.size,
      pows:new Set([...s].map(x=>x.split('|')[3])).size}));
    // Последняя виденная игра не доиграна — она и оборвала цикл. Мерить по ней
    // нечего, поэтому в счёт идут только законченные.
    if(rows.length>1 && !card) rows.pop();
    out.seen=rows;
    if(!rows.length) fail('строку игрока в живой таблице ни разу не увидели');
    const moving=rows.filter(r=>r.shots>1).length;
    out.steps.push('игр под наблюдением: '+rows.length+
      ', из них с движением в строке: '+moving+
      ' (снимков по играм: '+rows.map(r=>r.shots).join(', ')+')');
    if(!moving) fail('строка игрока не изменилась НИ РАЗУ за игру — очки и килы не считаются по ходу матча');
    if(moving < rows.length*0.5)
      fail('строка двигалась только в '+moving+' играх из '+rows.length);
    /* И отдельно — СИЛА. Его правка была именно про неё: выборы в игре
       двигают игровую силу, а колонка показывала силу карточки и потому
       стояла. Проверяется, что хотя бы в одной игре она приняла больше
       одного значения. */
    const powMoving=rows.filter(r=>r.pows>1).length;
    if(!powMoving) fail('сила в строке не менялась ни в одной игре — лут и высота в таблице не видны');
    out.steps.push('сила двигалась в '+powMoving+' играх из '+rows.length);
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrow-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if(out.seen) console.log('  ' + JSON.stringify(out.seen));
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('строка игрока считается по ходу матча');
