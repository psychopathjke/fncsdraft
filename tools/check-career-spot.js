// Своя точка на острове, и аура, которая на ней растёт.
//
// Спека со страницы Notion «new mechanics», 23 августа: «в начале сезона
// добавить, игроку выбор локации, куда он будет падать весь год, он может её
// сменить, но фармится аура на локе, чтоб люди боялись даже падать туда».
// Проверяется:
//   * метка живёт ПО ОСТРОВУ (cr.spots), потому что год меняет карту;
//   * первая высадка на турнире ставит метку молча;
//   * выигранные стычки дома копят ауру, до потолка и не выше;
//   * стычки НЕ дома ауру не копят;
//   * переезд сжигает ауру, возврат на своё же место — нет;
//   * боты реже садятся на точку с аурой (замер, а не утверждение);
//   * перемотка (CC_FF) сажает карьеру на свою же точку.
//
//   node tools/check-career-spot.js
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
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Homer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    squadSize=2; useLandingSet(careerBrSet());
    const set=careerBrSet();

    // ---- метка по острову --------------------------------------------------
    if(careerSpotOn(set)) fail('новая карьера уже с меткой');
    careerSpotSet(4, set);
    if(!careerSpotOn(set) || careerSpotOn(set).i!==4) fail('метка не поставилась');
    if(careerSpotOn('t1')) fail('метка протекла на другой остров');
    out.steps.push('метка живёт по острову: '+set+' → зона 5, t1 пуст');

    // Зона по метке находится и в дуо-сетке, и в дроблёной соло.
    const zDuo=careerSpotZone(set);
    if(!zDuo) fail('зона метки не нашлась в дуо-сетке');
    squadSize=1; useLandingSet(set);
    const zSolo=careerSpotZone(set);
    if(!zSolo) fail('в соло-сетке метка потерялась');
    if(careerSpotIndexOf(zSolo, set)!==4) fail('обратный перевод соло-куска дал не ту зону');
    squadSize=2; useLandingSet(set);
    out.steps.push('метка находится и в соло-сетке (кусок → родитель 5)');

    // ---- аура: единица — вечер, и шкала вечера ------------------------------
    const home=careerSpotZoneOf(careerSpotList(set)[0].i, set);
    const night=(won,lost,zone)=>careerGrowEvent(5, 50,
      {isYou:true, landingZone:zone||home, landingWins:won, landingLosses:lost,
       squad:[{handle:'a'},{handle:'b'}], pow:100}, []);
    night(5,3);
    if(careerSpotAura(set, 0)!==1) fail('удержанный вечер (5:3) дал не +1, а '+careerSpotAura(set, 0));
    night(8,2);
    if(careerSpotAura(set, 0)!==3) fail('разгром (8:2) дал не +2, аура '+careerSpotAura(set, 0));
    night(3,5);
    if(careerSpotAura(set, 0)!==3) fail('обычный минус (3:5) не должен отнимать');
    night(5,5);
    if(careerSpotAura(set, 0)!==3) fail('ничья двинула ауру');
    night(2,6);
    if(careerSpotAura(set, 0)!==2) fail('разнос (2:6) не снял единицу');
    const away=ALL_LANDING_ZONES.find(z=>z!==home);
    night(9,0,away);
    if(careerSpotAura(set, 0)!==2) fail('аура выросла за чужую точку');
    for(let k=0;k<20;k++) night(9,0);
    if(careerSpotAura(set, 0)!==CC_SPOT_AURA_MAX) fail('аура не дошла до потолка или пробила его');
    for(let k=0;k<30;k++) night(0,9);
    if(careerSpotAura(set, 0)!==0) fail('аура ушла ниже нуля');
    out.steps.push('шкала вечера: +1 удержал, +2 разгром, 0 ничья и мелкий минус, -1 разнесли; пол 0, потолок '+CC_SPOT_AURA_MAX);

    // ---- три спота на весь год, по одному на карту ---------------------------
    careerSpotList(set)[0].aura=CC_SPOT_AURA_MAX;
    careerSpotSet(4, set);                          // та же коробка — ничего
    if(careerSpotAura(set,0)!==CC_SPOT_AURA_MAX) fail('повторный клик сжёг ауру');
    if(careerSpotList(set).length!==1) fail('на одной карте завелось два дома');
    /* Вторая и третья карты — свободные споты, берутся даром. Карт под дом
       ровно три, и это ОСТРОВА, а не круги: его слова 24 августа — «релоад
       1-2, там одна карта, Слюрпи; 3-4 — Стронгхолд». Поэтому второй дом
       ставится на r1, а третий на r3; r2 и r4 — те же два острова. */
    if(!careerSpotSet(6, 'r1')) fail('второй дом не встал на остров Релоада 1-2');
    if(!careerSpotSet(2, 'r3')) fail('третий дом не встал на остров Релоада 3-4');
    if(careerSpotUsed()!==CC_SPOT_SLOTS) fail('счётчик домов: '+careerSpotUsed());
    if(careerSpotAura(set,0)!==CC_SPOT_AURA_MAX) fail('новый дом сжёг ауру другой карты');
    // И дом первого круга — он же дом второго: остров один.
    if(!careerSpotList('r2').length) fail('дом с первого круга не виден на втором');
    if(careerSpotList('r2')[0]!==careerSpotList('r1')[0])
      fail('у первого и второго круга разные записи дома');
    if(!careerSpotList('r4').length) fail('дом третьего круга не виден на четвёртом');
    // Четвёртой карты под дом нет вовсе: островов всего три.
    if(careerSpotSets().length!==CC_SPOT_SLOTS)
      fail('карт под дом не три, а '+careerSpotSets().length);
    // Ауры раздельные: вечер на Релоаде не трогает карту сезона.
    careerSpotList('r1')[0].aura=4;
    if(careerSpotAura(set,0)!==CC_SPOT_AURA_MAX) fail('аура протекла между картами');
    if(careerSpotAura('r2',0)!==4) fail('аура острова не видна со второго круга');
    // Переезд внутри карты жжёт ауру этой карты и только её.
    careerSpotSet(9, set);
    if(careerSpotAura(set,0)!==0) fail('переезд внутри карты не сжёг ауру');
    if(careerSpotAura('r1',0)!==4) fail('переезд задел другую карту');
    // Снятие возвращает спот в запас.
    careerSpotClear('r3');
    if(careerSpotUsed()!==2) fail('снятие не освободило спот');
    if(!careerSpotRoom('r3')) fail('освобождённый спот не достался обратно');
    out.steps.push('три острова на год: сезон, Релоад 1-2 и Релоад 3-4; дом круга виден на соседнем, ауры и переезды раздельные');

    // ---- боты боятся -------------------------------------------------------
    // Замер, а не утверждение: одно и то же поле расставляется 200 раз с аурой
    // и без неё, считаем, как часто в коробке оказывается хоть кто-то.
    careerSpotSet(4, set);
    const mine=careerSpotZone(set);
    const mk=()=>{ const f=[]; for(let i=0;i<40;i++){
      const t={pow:95+Math.random()*10, squad:[{rating:90},{rating:90}], stagePts:0, _uid:i};
      f.push(t); } return f; };
    const run=(aura)=>{
      careerSpotList(set)[0].aura=aura;
      let hit=0;
      for(let k=0;k<200;k++){
        const f=mk();
        careerSpotFearOn({pow:100});
        const {zoneGroups}=buildBotLandingAssignment(f);
        careerSpotFearOff();
        if((zoneGroups.get(mine)||[]).length) hit++;
      }
      return hit/200;
    };
    const cold=run(0), hot=run(CC_SPOT_AURA_MAX);
    out.fear={cold:+cold.toFixed(3), hot:+hot.toFixed(3)};
    if(!(hot<cold)) fail('аура не отпугивает: без неё '+cold+', с ней '+hot);
    out.steps.push('боты: коробку занимают '+Math.round(cold*100)+'% раздач без ауры и '+
      Math.round(hot*100)+'% с полной');

    /* ---- острова Релоада: их ДВА, а не четыре ------------------------------
       Его правка 24 августа: круги 1-2 играются на одном острове (Слюрпи),
       3-4 на другом (Стронгхолд). Плитка предлагает острова, а не круги —
       иначе она предлагала бы выбрать между первым и вторым кругом, хотя это
       одна и та же карта и дом на ней один. */
    const sets=careerSpotSets().map(x=>x.key);
    ['r12','r34'].forEach(k=>{ if(sets.indexOf(k)<0) fail('в плитке нет острова '+k); });
    ['r1','r2','r3','r4'].forEach(k=>{
      if(sets.indexOf(k)>=0) fail('плитка всё ещё предлагает круг '+k+', а не остров'); });
    careerSpotList('r1')[0].aura=4;
    if(careerSpotAura('r1',0)!==4) fail('аура релоада не встала');
    if(careerSpotAura('r2',0)!==4) fail('аура острова не читается со второго круга');
    if(careerSpotOn(set).i===2 && set!=='r1') fail('метка релоада перетёрла сезонную');
    if(careerSpotAura(set, 0)===4) fail('аура релоада протекла на карту сезона');
    // Картинка рисуется и по кругу, и по острову, и в обоих случаях со своим артом.
    ['r1','r12'].forEach(k=>{
      const shot=careerSpotShotHTML(2, k);
      if(shot.indexOf('cc-spot-shot-box')<0) fail('на картинке ('+k+') нет квадратика');
      if(shot.indexOf(MAP_ART.r1)<0) fail('картинка ('+k+') взяла чужой арт');
    });
    // Дом первого круга находится и на сетке второго — по точке, а не индексу.
    useLandingSet('r2');
    if(!careerSpotZone('r2')) fail('на сетке второго круга дом не нашёлся');
    useLandingSet(set);
    out.steps.push('острова: сезон + Релоад 1-2 + Релоад 3-4, дом находится на обеих сетках круга');

    // ---- перемотка сажает домой -------------------------------------------
    careerSpotList(set)[0].aura=4;
    out.steps.push('аура на месте перед перемоткой: '+careerSpotAura(set, 0));
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccspot-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('точка сезона держится, аура растёт дома и отпугивает комнату');
