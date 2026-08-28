// Вечер можно отыграть самому, а можно отдать симуляции.
//
// Его правка, 24 августа: «надо дать выбор игроку: сыграть самому игру или
// простимулировать... за него просто варианты выберут». Проверяется то, что
// делает эту правку правдой:
//   1) на карточке матча стоит переключатель, и он держится через сохранение;
//   2) с правой кнопкой вечер доигрывается САМ — ни один вопрос не всплыл,
//      никто ничего не нажал, результат пришёл, — но КАРТА ПРИ ЭТОМ ИДЁТ:
//      правка 24 августа по просьбе игрока («не хочет кликать, а хочет
//      смотреть круги»), раньше правая кнопка ещё и гасила показ;
//   3) ходы за игрока при этом выбраны, а не пропущены: сила игрока в игре
//      сдвинулась так же, как у комнаты;
//   4) без симуляции вопрос по-прежнему встаёт и ждёт.
//
//   node tools/check-career-sim.js
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
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  // Переключатель стоит только на карточке вечера, который МОЖНО играть, —
  // значит и сеяться надо в такой день, а не в первый попавшийся.
  const days=()=>careerYearDays();
  const findDay=kind=>{
    const map=days();
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((map.get(d)||[]).some(e=>e.kind===kind)) return d;
    return null;
  };
  const seed=(day)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Simmer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    // Дуо-вечер без напарника играть нельзя, и карточка тогда показывает
    // «пропустить», а не «играть» — вместе с ней уходит и переключатель.
    // Место занимается той же дверью, что у игрока: кто-то свободный написал.
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
      careerRenderHub('centre');
    }
  };
  try{
    const cupDay=findDay('cup');
    seed(cupDay);
    useLandingSet(careerBrSet());

    // ---- 1. переключатель есть, и он запоминается -------------------------
    const row=()=>document.querySelectorAll('#screen-career-hub .ch-simbtn');
    if(row().length!==2) fail('на карточке матча нет двух кнопок выбора: '+row().length);
    if(careerSimOn()) fail('карьера заводится сразу в симуляции');
    if(!row()[0].classList.contains('on')) fail('по умолчанию не горит «играю сам»');
    row()[1].click();
    if(!careerSimOn()) fail('нажатие на симуляцию ничего не переключило');
    if(!row()[1].classList.contains('on')) fail('кнопка симуляции не загорелась после нажатия');
    // Пережить перезагрузку слота: настройка про прохождение, а не про вкладку.
    careerEntry();
    if(!careerSimOn()) fail('симуляция не пережила перезагрузку карьеры');
    out.steps.push('переключатель: две кнопки, по умолчанию «играю сам», выбор переживает загрузку');

    // ---- 1б. на превью видно, куда садимся --------------------------------
    /* Его правка, 24 августа: «одна локация ещё должна быть на превью, ту
       которую выбрал». Показывается ОДИН дом — того острова, на котором
       играется этот вечер; пока дома нет, блока нет вовсе. */
    const spotBlock=()=>document.querySelector('#screen-career-hub .ch-spot');
    if(spotBlock()) fail('без дома на превью всё равно что-то нарисовано');
    const brSet=careerBrSet();
    if(!careerSpotSet(4, brSet)) fail('дом на сезонной карте не поставился');
    careerRenderHub('centre');
    const blk=spotBlock();
    if(!blk) fail('дом поставлен, а на превью его нет');
    if(!blk.querySelector('.ch-spot-shot')) fail('на превью нет картинки места');
    if(!blk.querySelector('.cc-aura-bar')) fail('на превью нет полосы ауры');
    if(document.querySelectorAll('#screen-career-hub .ch-spot').length!==1)
      fail('на превью больше одной локации');
    // И это именно тот остров, на котором играется вечер, а не первый попавшийся.
    const next=careerNext();
    if(careerNightSet(next)!==brSet)
      fail('вечер играется не на сезонной карте: '+careerNightSet(next));
    out.steps.push('превью: одна локация — дом того острова, где играется вечер, с картинкой и аурой');

    // ---- 2. правая кнопка: вечер доигрывается сам, но на карте ------------
    /* Никто не отвечает: если панель встанет, она встанет насовсем, и проба
       упадёт по времени, а не по классу — это и есть то, что проверяется. */
    let sawPanel=false, sawPicker=false, sawMap=false;
    const watch=setInterval(()=>{
      if(document.querySelector('.cc-choice')) sawPanel=true;
      if(document.querySelector('.landing-picker')) sawPicker=true;
      // Та самая карта с кругами: её рисует ZoneReplay.mount.
      if(document.querySelector('.zone-replay')) sawMap=true;
    }, 20);
    const play=async ()=>{
      const btn=document.querySelector('#screen-career-hub .ch-play');
      if(!btn) fail('нет кнопки «играть»: день '+careerToday());
      btn.click();
      // Вечер теперь ИГРАЕТСЯ, а не считается разом, — ждать надо дольше.
      for(let i=0;i<12000;i++){
        await wait(20);
        const card=[...document.querySelectorAll('#majorStages .stage-card')]
          .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
        if(card) return card;
      }
      return null;
    };
    const card=await play();
    clearInterval(watch);
    if(!card) fail('вечер не дошёл до результата'+(sawPanel?' — встал вопрос':''));
    if(sawPanel) fail('правая кнопка всё равно спросила');
    if(sawPicker) fail('правая кнопка всё равно открыла пикер высадки');
    if(!sawMap) fail('карта не показывалась — правая кнопка снова гасит показ');
    out.steps.push('правая кнопка: вечер доигран на карте, без единого вопроса и без пикера');

    // ---- 3. ходы всё-таки сделаны, а не пропущены -------------------------
    /* stop.room с null вместо игрока — это и есть «за него выберут»: раздача
       идёт по всему лобби, включая его. Проверяется тем же способом, что и в
       check-career-choice-stacking: силой игры до и после. */
    const me=careerCard();
    const field=[careerYouTeam([me]), ...careerCupField(CAREER.career, [me], ccTeams(20), null, false, 0)];
    field[0].isYou=true;
    let moved=0;
    for(let g=0; g<200; g++){
      field.forEach(t=>{ t._pf=Math.max(1, t.pow); t._pc=t._pf; });
      const before=field[0]._pf;
      ccRoomLoot(field, null);
      ccRoomLate(field, null);
      if(field[0]._pf!==before) moved++;
    }
    if(moved===0) fail('в симуляции игрок не получает ни лута, ни высоты');
    if(moved>=200) fail('в симуляции игрок ходит каждую игру — это не бросок, а константа');
    out.steps.push('ходы за игрока: сила сдвинулась в '+moved+' играх из 200 — тем же броском, что у комнаты');

    // ---- 4. без симуляции вопрос по-прежнему ждёт -------------------------
    seed(cupDay);
    careerSimSet(false);
    if(careerSimOn()) fail('обратно на «играю сам» не переключается');
    // Панель поднимается напрямую: доиграть до неё целым вечером долго, а
    // проверяется здесь ровно то, что она вообще встаёт и НЕ отвечает сама.
    skipAnimation=false;
    if(typeof CC_FF!=='undefined') CC_FF=null;
    CC_CHOICE_WAIT=1e9;
    const host=document.createElement('div');
    document.body.appendChild(host);
    let answered=false;
    ccChoiceBox('t', 'h', [{id:'a', title:'A'},{id:'b', title:'B'}], host).then(()=>{ answered=true; });
    await wait(120);
    if(!host.querySelector('.cc-choice')) fail('без симуляции вопрос не встал');
    if(answered) fail('без симуляции вопрос ответил за игрока');
    host.querySelector('.cc-choice-btn').click();
    await wait(40);
    if(!answered) fail('нажатие на кнопку вопроса ничего не решило');
    out.steps.push('без симуляции: вопрос встаёт, ждёт и уходит только по нажатию');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsim-'));
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
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('вечер играется самому или отдаётся симуляции, и симуляция ходит за игрока');
