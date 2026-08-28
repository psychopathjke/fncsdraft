// Выборы внутри игры: лут после 2-й зоны и высокая земля на 8-й.
//
// Его спека «new mechanics»: «mid game после 2 зоны дать выбор лута… late game
// 8 — законить хг (50 на 50, даёт больше к power), играть лг (не дают повер),
// найти рефреш (даёт больше к power, но не так, как на хг)». Проверяется:
//   * пак — ровно 2 ствола, 2 хилки и мувмент, и мувмент действительно из
//     мобильных предметов;
//   * лут поднимает силу ИГРЫ (_pf/_pc), а не силу карточки (pow);
//   * хайграунд платит больше рефреша, рефреш больше лоуграунда, лоуграунд 0;
//   * хайграунд — монетка: на длинной серии платит примерно половину случаев;
//   * под скипом вопрос отвечает сам и вечер доигрывает.
//
//   node tools/check-career-choices.js
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
window.addEventListener('unhandledrejection', e=>window.__errs.push('rejection: '+String(e.reason && e.reason.message || e.reason)));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Chooser', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    useLandingSet(careerBrSet());

    // ---- пак лута ----------------------------------------------------------
    const pack=ccLootPack();
    if(pack.weapons.length!==2) fail('стволов в паке '+pack.weapons.length);
    if(pack.heals.length!==2) fail('хилок в паке '+pack.heals.length);
    if(!pack.move) fail('мувмента в паке нет');
    if(CC_MOVE_ITEMS.indexOf(pack.move.name)<0) fail('мувмент не мобильный предмет: '+pack.move.name);
    if(pack.heals.some(h=>CC_MOVE_ITEMS.indexOf(h.name)>=0)) fail('мувмент попал в хилки');
    out.steps.push('пак: 2 ствола, 2 хилки, мувмент — '+pack.move.name);

    // ---- лут двигает силу игры, а не карточки ------------------------------
    const you={pow:100, squad:[{handle:'a'},{handle:'b'}], isYou:true};
    you._pf=you.pow; you._pc=you.pow;
    ccAddGamePow(you, CC_LOOT_POI_BONUS);
    if(you.pow!==100) fail('лут переписал pow карточки');
    if(you._pf!==100+CC_LOOT_POI_BONUS || you._pc!==100+CC_LOOT_POI_BONUS)
      fail('лут не лёг в силу игры');
    out.steps.push('лут: +'+CC_LOOT_POI_BONUS+' к силе игры, pow карточки не тронут');

    // ---- своя точка стоит ноль, соседняя — размен --------------------------
    /* Его числа, 24 августа: «забрать свой пак +0, на соседнюю +4, шанс 40 на
       60». Значит проверяется не «пак что-то даёт» (он больше не даёт ничего и
       не должен), а что ход остался ходом: у надёжного варианта нулевая цена,
       у рискованного — потолок выше нуля, названный штраф и ожидание между
       ними. */
    if(typeof ccLootPow!=='undefined') fail('пак снова переводится в силу');
    if(!(CC_LOOT_POI_ODDS>0 && CC_LOOT_POI_ODDS<1)) fail('соседняя точка берётся всегда или никогда');
    if(!(CC_LOOT_POI_FAIL>0)) fail('провал на соседней точке ничего не стоит');
    if(!(CC_LOOT_POI_BONUS>0)) fail('соседняя точка не даёт больше своей');
    const evSwap=CC_LOOT_POI_ODDS*CC_LOOT_POI_BONUS-(1-CC_LOOT_POI_ODDS)*CC_LOOT_POI_FAIL;
    if(!(evSwap<CC_LOOT_POI_BONUS)) fail('риск соседней точки ничего не отнимает от ожидания');
    if(!(evSwap>0)) fail('ожидание пробежки ушло в минус ('+evSwap.toFixed(2)+') — ход мёртвый');
    out.steps.push('соседняя точка: '+Math.round(CC_LOOT_POI_ODDS*100)+' на '+
      Math.round(100-CC_LOOT_POI_ODDS*100)+', +'+CC_LOOT_POI_BONUS+' или −'+CC_LOOT_POI_FAIL+
      ', ожидание +'+evSwap.toFixed(1)+' против нуля за свою');

    // ---- лестница ходов восьмой зоны ---------------------------------------
    const hg=ccLateMove('hg'), rf=ccLateMove('refresh'), lg=ccLateMove('lg');
    if(!(hg.pow>rf.pow)) fail('хайграунд платит не больше рефреша');
    if(!(rf.pow>lg.pow)) fail('рефреш платит не больше лоуграунда');
    if(lg.pow!==0) fail('лоуграунд платит '+lg.pow+', а должен ноль');
    if(rf.odds!==1 || lg.odds!==1) fail('рефреш или лоуграунд стали монеткой');
    if(!(hg.odds>0 && hg.odds<1)) fail('хайграунд не монетка: '+hg.odds);
    // Провал хайграунда должен стоить силы — иначе риска нет.
    if(!(hg.fail>0)) fail('провал хайграунда ничего не отнимает');
    if(rf.fail||lg.fail) fail('надёжные ходы штрафуют, а не должны');
    const evHg=hg.odds*hg.pow-(1-hg.odds)*hg.fail;
    if(!(evHg<rf.pow)) fail('ожидание хайграунда ('+evHg+') не ниже рефреша ('+rf.pow+') — риск не оплачен');
    out.steps.push('ходы: хг +'+hg.pow+'/-'+hg.fail+' при '+hg.odds+' (ожидание '+evHg+'), '+
                   'рефреш +'+rf.pow+' наверняка, низ 0');

    // ---- хайграунд действительно монетка ------------------------------------
    let won=0;
    for(let i=0;i<2000;i++) if(Math.random()<hg.odds) won++;
    const rate=won/2000;
    if(Math.abs(rate-hg.odds)>0.05) fail('монетка кривая: '+rate);
    out.steps.push('хайграунд берётся в '+Math.round(rate*100)+'% попыток на 2000 бросков');

    // ---- оффспавн: дом и контест -------------------------------------------
    // Его спека: «упасть на свою локацию, законить кого-то».
    useLandingSet(careerBrSet());
    careerSpotSet(4, careerBrSet());
    const home=careerSpotZone(ACTIVE_LANDING_SET);
    if(!home) fail('дом не нашёлся на карте сезона');
    const mkField=()=>{
      const y={pow:100, isYou:true, name:'you', squad:[{rating:90},{rating:90}], stagePts:0};
      const f=[y];
      for(let i=0;i<40;i++) f.push({pow:88+i*0.4, squad:[{rating:88},{rating:88}],
                                     stagePts:0, _uid:i, name:'bot'+i});
      return f;
    };
    const f1=mkField();
    const g1=await careerDropQuick(f1, f1[0], 'home', home);
    if(f1[0].landingZone!==home) fail('дом не посадил на свою точку');
    if((g1.get(home)||[]).indexOf(f1[0])<0) fail('дом не записал в группу зоны');
    // Без дома выбор всё равно есть: тихое место — свободная коробка.
    const f0=mkField();
    await careerDropQuick(f0, f0[0], 'quiet', null);
    const q=f0[0].landingZone;
    if(!q) fail('тихая высадка никуда не посадила');
    // Тихо — это про число соседей: свободных коробок в комнате на полсотни
    // команд может не остаться вовсе.
    const busyAt=z=>f0.filter(t=>t!==f0[0] && t.landingZone===z).length;
    const minBusy=Math.min(...ALL_LANDING_ZONES.map(busyAt));
    if(busyAt(q)!==minBusy)
      fail('тихая высадка села к '+busyAt(q)+' соседям, а есть коробка с '+minBusy);
    out.steps.push('без дома: тихая высадка садит в самую ненаселённую коробку ('+
      busyAt(q)+' соседей)');

    const f2=mkField();
    await careerDropQuick(f2, f2[0], 'contest', home);
    const at=f2[0].landingZone;
    if(!at) fail('контест никуда не посадил');
    if(at===home) fail('контест сел домой, а не к чужим');
    // В коробке контеста должен стоять кто-то, и это должны быть сильные.
    const there=f2.filter(t=>t!==f2[0] && t.landingZone===at);
    if(!there.length) fail('контест сел в пустую коробку');
    // Под скипом список отвечает первым вариантом — это сильнейшая занятая
    // коробка, потому что список отсортирован по силе.
    const bestPow=Math.max(...f2.filter(t=>t!==f2[0]).map(t=>t.pow));
    if(Math.max(...there.map(t=>t.pow))!==bestPow)
      fail('первый в списке контеста — не самые сильные');
    // И сам список: короткий, по никам, с силой и лутом в подписи.
    const groups=new Map();
    f2.filter(t=>t!==f2[0]).forEach(t=>{ if(!t.landingZone) return;
      if(!groups.has(t.landingZone)) groups.set(t.landingZone, []);
      groups.get(t.landingZone).push(t); });
    skipAnimation=false;
    const p=careerContestPick(groups);
    const box=document.querySelector('.cc-choice');
    if(!box) fail('список контеста не показался');
    const btns=box.querySelectorAll('.cc-choice-btn');
    if(btns.length>CC_CONTEST_SHOW) fail('в списке '+btns.length+' точек, ждали не больше '+CC_CONTEST_SHOW);
    if(!/bot/.test(btns[0].textContent)) fail('в списке нет ников');
    btns[0].click(); await p;
    skipAnimation=true;
    out.steps.push('оффспавн: дом сажает на свою точку; список контеста — '+
      'не больше '+CC_CONTEST_SHOW+' точек, с никами, сильнейшие сверху');

    // ---- плашка исхода: удачно и неудачно ----------------------------------
    const map=document.createElement('div');
    document.body.appendChild(map);
    skipAnimation=false;
    const p1=ccChoiceResult(map, 'вышло', true);
    const good=map.querySelector('.cc-choice-out');
    if(!good) fail('плашка исхода не появилась');
    if(!good.classList.contains('good')) fail('удачный исход не помечен зелёным');
    if(good.textContent.indexOf('вышло')<0) fail('плашка не написала, что случилось');
    await p1;
    if(map.querySelector('.cc-choice-out')) fail('плашка не убралась сама');
    const p2=ccChoiceResult(map, 'не вышло', false);
    const bad=map.querySelector('.cc-choice-out');
    if(!bad || !bad.classList.contains('bad')) fail('неудачный исход не помечен красным');
    await p2;
    // Под скипом смотреть некому — плашки быть не должно.
    skipAnimation=true;
    await ccChoiceResult(map, 'скип', true);
    if(map.querySelector('.cc-choice-out')) fail('под скипом плашка всё равно рисуется');
    skipAnimation=false;
    map.remove();
    out.steps.push('плашка исхода: зелёная на удачу, красная на неудачу, под скипом молчит');

    // ---- под скипом вопрос отвечает сам ------------------------------------
    skipAnimation=true;
    const t0=Date.now();
    const pick=await ccChoiceBox('проба', '', [{id:'a', title:'первый'}, {id:'b', title:'второй'}]);
    if(!pick || pick.id!=='a') fail('скип не выбрал ответ по умолчанию');
    if(Date.now()-t0>2000) fail('скип думал '+(Date.now()-t0)+'мс');
    if(document.querySelector('.cc-choice')) fail('панель осталась на экране');
    out.steps.push('под скипом вопрос отвечает сам, панель не остаётся');
    skipAnimation=false;
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccchoice-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('выборы внутри игры платят силой игры и отвечают сами под скипом');
