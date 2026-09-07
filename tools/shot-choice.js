// Снимки панелей решения поверх карты — чтобы на дизайн можно было
// посмотреть, а не рассуждать о нём.
//
// Панель живёт внутри одной игры и пятнадцать секунд, поймать её кадром руками
// нельзя. Здесь она поднимается настоящей ccChoiceBox с настоящими строками и
// настоящей картинкой своего места, на настоящей карте острова, — меняется
// только срок ожидания (CC_CHOICE_WAIT), иначе виртуальное время headless'а
// отвечает за игрока мгновенно.
//
//   node tools/shot-choice.js [drop|chests|site|loot|rot|late|out ...]     по умолчанию все
//
// Кладёт shot-choice-<что>.png рядом с репозиторием.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SHOT_DIR || ROOT;
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const WANT = process.argv.slice(2).length ? process.argv.slice(2)
                                          : ['drop', 'chests', 'site', 'loot', 'rot', 'late', 'out'];

const BOOT = (what) => `
<!-- Поверх приложения, а не под ним: careerEntry рисует хаб во весь экран, и
     дописанный в конец body кадр уезжает за нижний край снимка. -->
<div id="__shot" style="position:fixed;left:0;top:0;width:640px;z-index:99999;
     background:#0d1230;padding:0;margin:0"></div>
<script>
(async function(){
  const WHAT=${JSON.stringify(what)};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    const set=ACTIVE_LANDING_SET;
    careerSpotSet(4, set);
    careerSpotList(set)[0].aura=6;
    skipAnimation=false;
    if(typeof CC_FF!=='undefined') CC_FF=false;
    CC_CHOICE_WAIT=1e9;                 // панель должна дождаться снимка
    // Бот-напарник со своим мнением под заголовком (ccMateOpinion) — как в дуо-вечере.
    careerMates=()=>[{handle:'Setty', ovr:88}]; careerSquadSize=()=>2; ccMpOn=()=>false;

    // Остров под панелью — тот же, на котором играется вечер.
    const host=document.getElementById('__shot');
    const ratio=MAP_ASPECT[set].split('/');
    const handle=ZoneReplay.mount(host, 'art/map-'+set+'.jpg',
      ratio[0]+' / '+ratio[1], Number(ratio[1])/Number(ratio[0]), {});
    const map=handle.wrap;

    if(WHAT==='drop'){
      const spot=careerSpotOn(set), home=careerSpotZone(set), aura=careerSpotAura(set);
      ccChoiceBox(L().ccDropTitle, L().ccDropHint,
        [{id:'home', title:L().ccDropHome, note:L().ccDropHomeNote(aura),
          art:careerSpotShotHTML(spot.i, set, 'cc-choice-art', 16/7)},
         {id:'contest', title:L().ccDropContest, note:L().ccDropContestNote,
          art:careerIslandThumbHTML(set, 'cc-choice-art')}], map);
    } else if(WHAT==='loot'){
      const name=o=>o?o.name:'—';
      const listOf=p=>[...p.weapons, ...p.heals, p.move].map(name).join(' · ');
      const mine=ccLootPack(), other=ccLootPack();
      ccChoiceBox(L().ccLootTitle, L().ccLootHint,
        [{id:'take', title:L().ccLootTake, note:listOf(mine)+' — '+L().ccLootTakeSafe},
         {id:'swap', title:L().ccLootSwap, note:listOf(other)+' — '+
            L().ccLootSwapRisk(CC_LOOT_POI_BONUS, CC_LOOT_POI_FAIL,
              Math.round(CC_LOOT_POI_ODDS*100))}], map);
    } else if(WHAT==='chests'){
      // Своя точка: сундуки открыты, пак собран — одна кнопка «забрать и идти».
      const mine=ccChestPack(Math.random, ccLootSet(), CC_CHESTS_POI); const pv=ccPackPow(mine);
      const labels=[...mine.weapons, ...mine.heals, mine.move].filter(Boolean).map(ccItemLabel).join(' · ');
      ccChoiceBox(L().ccSiteOwnTitle, L().ccSiteOwnHint(CC_CHESTS_POI), [
        {id:'take', def:true, icon:ccItemIconHTML(mine.weapons[0], CC_CHOICE_ICON.chest), title:L().ccSiteTake, note:labels+' — '+L().ccSitePackPow(pv)}], map);
    } else if(WHAT==='site'){
      // Чужие на точке: первый сундук свой и их, «уйти» или «файтить» — как в ccAskSite.
      const mine=ccChestPack(Math.random, ccLootSet(), CC_CHESTS_POI), theirs=ccChestRoll(Math.random, ccLootSet());
      const eMine=CC_LOOT_EDGE[ccRarityKey(mine.first.weapon.rarity)]||0, eFoe=CC_LOOT_EDGE[ccRarityKey(theirs.weapon.rarity)]||0;
      const p=ccSiteOdds({_pc:96}, {_pc:88}, eMine, eFoe);
      ccChoiceBox(L().ccSiteTitle('Malibuca & Vic0'), L().ccSiteHint(ccItemLabel(mine.first.weapon), ccItemLabel(theirs.weapon)), [
        {id:'leave', def:true, icon:CC_CHOICE_ICON.run, title:L().ccSiteLeave, note:L().ccSiteLeaveNote(CC_CHESTS_LEAVE, CC_CHESTS_POI)},
        {id:'fight', icon:ccItemIconHTML(mine.first.weapon, CC_CHOICE_ICON.fight), title:L().ccSiteFight,
         note:L().ccSiteFightNote(Math.round(p*100), CC_CHESTS_POI, eMine, eFoe)}], map);
    } else if(WHAT==='rot'){
      // Ротация четвёртой зоны — те же строки и картинки, что у ccAskRot, плюс мувмент из пака.
      const mv={name:'Shockwave Grenade', rarity:'epic'};
      ccChoiceBox(L().ccRotTitle, L().ccKitLine(400, '', 'Striker Pump Shotgun'), [
        {id:'early', def:true, icon:CC_CHOICE_ICON.run, title:L().ccRotEarly, note:L().ccRotEarlyNote(CC_ROT_REAL.early.share, CC_ROT_REAL.early.surv)},
        {id:'with', icon:CC_CHOICE_ICON.storm, title:L().ccRotWith, note:L().ccRotWithNote(CC_ROT_REAL.with.share, CC_ROT_REAL.with.surv)},
        {id:'late', icon:CC_CHOICE_ICON.stay, title:L().ccRotLate, note:L().ccRotLateNote},
        {id:'move', icon:ccItemIconHTML(mv, CC_CHOICE_ICON.run), title:L().ccRotMove, note:L().ccRotMoveNote(mv.name)}], map);
    } else if(WHAT==='late'){
      // Меню берётся ОТТУДА ЖЕ, откуда его берёт сама игра (CC_LATE_MOVES). Пока
      // тут стоял свой список из трёх ходов, снимок показывал три даже после
      // того, как в игре их стало пять, — то есть врал ровно про то, ради чего
      // его и делают.
      ccChoiceBox(L().ccLateTitle, L().ccLateHint,
        CC_LATE_MOVES.map(m=>({id:m.id, title:L()[CC_LATE_NAME[m.id]], note:ccLateNote(m), icon:CC_CHOICE_ICON[CC_LATE_ICON[m.id]]||CC_CHOICE_ICON.stay})), map);
    } else {
      /* Плашка исхода гасит себя двумя setTimeout на 1.5 и 1.9 сек, а
         виртуальное время headless'а проматывает их до первого кадра — снимок
         выходил пустой картой. Поэтому на время этого одного вызова таймеры
         глушатся: рисуется настоящая ccChoiceResult, просто ей не дают себя
         убрать. Промис после этого не разрешается, и это здесь ровно то, что
         нужно. */
      const realTimeout=window.setTimeout;
      window.setTimeout=()=>0;
      ccChoiceResult(map, L().ccLateHgWon(CC_HG_POW), true);
      window.setTimeout=realTimeout;
    }
  }catch(e){
    document.title='ERR '+String(e && e.message || e);
  }
})();
<\/script>`;

for(const what of WANT){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccshot-'));
  const tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
    fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT(what));
  const out = path.join(OUT, 'shot-choice-' + what + '.png');
  execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
    '--allow-file-access-from-files','--hide-scrollbars','--window-size=660,600',
    '--run-all-compositor-stages-before-draw','--virtual-time-budget=20000',
    '--screenshot=' + out, 'file:///' + tmp.replace(/\\/g,'/')], {stdio:'ignore'});
  fs.rmSync(dir, {recursive:true, force:true});
  console.log('  ' + path.relative(ROOT, out));
}
