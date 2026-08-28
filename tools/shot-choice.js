// Снимки панелей решения поверх карты — чтобы на дизайн можно было
// посмотреть, а не рассуждать о нём.
//
// Панель живёт внутри одной игры и пятнадцать секунд, поймать её кадром руками
// нельзя. Здесь она поднимается настоящей ccChoiceBox с настоящими строками и
// настоящей картинкой своего места, на настоящей карте острова, — меняется
// только срок ожидания (CC_CHOICE_WAIT), иначе виртуальное время headless'а
// отвечает за игрока мгновенно.
//
//   node tools/shot-choice.js [drop|loot|late|out ...]     по умолчанию все
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
                                          : ['drop', 'loot', 'late', 'out'];

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
    } else if(WHAT==='late'){
      ccChoiceBox(L().ccLateTitle, L().ccLateHint,
        [{id:'hg', title:L().ccLateHg, note:L().ccLateHgNote(CC_HG_POW)},
         {id:'refresh', title:L().ccLateRefresh, note:L().ccLateRefreshNote(CC_REFRESH_POW)},
         {id:'lg', title:L().ccLateLg, note:L().ccLateLgNote}], map);
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
