// Дроп спрашивается каждую игру, а не раз на этап.
//
// Его правка, 24 августа, со скрина игрока: «пусть каждую игру будет вопрос
// куда падать». Драфт так и играет с самого начала — высадка и стычка решаются
// заново перед каждой из двенадцати игр, — а карьера спрашивала один раз и
// потом одиннадцать игр падала в ту же коробку.
//
// Проверяется контракт, а не текст вопроса: simulateGamesLive зовёт
// opts.dropEachGame перед КАЖДОЙ игрой, включая первую, и раздача, которую
// вернул раннер, идёт в дело.
//
// Первая игра попала сюда 25 августа, его правкой: «не надо первой таблички,
// пусть 1 игра стартует, с картой и табличкой, которая ниже». До неё первый
// вопрос задавал сам раннер, до входа в прогон, — карты на экране ещё не
// было, и он выходил карточкой в ленте.
//
// Дивизионный кубок с 25 августа тоже спрашивает (его правка: «боты могут на
// любые локации падать, хочу такую же возможность сделать игроку»); что вечер
// без хука по-прежнему молчит — проверяется третьим шагом, потому что Опены
// так и остались без выбора.
//
// И где стоит вопрос: с 25 августа — маленьким окном на карте, как лут и
// высокая земля («сделай так же, как в mid гейме и late»). Контроль — тот же
// вызов без карты: тогда это по-прежнему карточка в ленте.
//
//   node tools/check-career-drop-each-game.js
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
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Dropper', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const mkField=()=>{
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const field=[you, ...careerCupField(cr, [me], ccTeams(50), null, false, 0)];
      const {zoneGroups}=buildBotLandingAssignment(field.filter(t=>t!==you));
      you.landingZone=careerSpotZone(careerBrSet()) || ALL_LANDING_ZONES[0];
      if(!zoneGroups.has(you.landingZone)) zoneGroups.set(you.landingZone, []);
      zoneGroups.get(you.landingZone).push(you);
      return {you, field, zoneGroups};
    };

    // ---- 1. этап с высадкой спрашивает перед каждой игрой ----------------
    const a=mkField();
    const askedAt=[];
    await simulateGamesLive(a.field, 6, majorPoints, 1, 'stage', 0, null, a.zoneGroups,
      {lobbySize:ccTeams(50), stageName:'probe', mapReplay:false, stopOnYourDeath:false,
       dropEachGame:(n)=>{ askedAt.push(n); return a.zoneGroups; }});
    out.notes.askedAt=askedAt;
    check('спрошено перед каждой игрой, включая первую',
          askedAt.join(',')==='1,2,3,4,5,6', askedAt.join(','));
    check('этап при этом доигран', (a.you.stageLog||[]).length===6,
          String((a.you.stageLog||[]).length));

    /* ---- 2. раздача, которую вернул раннер, идёт в дело ------------------
       Возвращаем ДРУГУЮ коробку и требуем, чтобы игрок в неё сел: иначе хук
       есть, а высадка всё равно одна на этап. */
    const b=mkField();
    const first=b.you.landingZone;
    const other=ALL_LANDING_ZONES.find(z=>z!==first);
    let moved=false;
    await simulateGamesLive(b.field, 3, majorPoints, 1, 'stage', 0, null, b.zoneGroups,
      {lobbySize:ccTeams(50), stageName:'probe2', mapReplay:false, stopOnYourDeath:false,
       dropEachGame:()=>{ b.you.landingZone=other; moved=true;
                          const g=new Map(); g.set(other, [b.you]); return g; }});
    check('высадка следующей игры — та, что вернул раннер',
          moved && b.you.landingZone===other);

    // ---- 3. без хука ничего не спрашивается (кубок дивизиона) -------------
    const c=mkField();
    let asked=0;
    await simulateGamesLive(c.field, 3, pointsForPlace, 4, 'stage', 0, null, null,
      {lobbySize:ccTeams(50), stageName:'cup', mapReplay:false, stopOnYourDeath:false});
    check('этап без высадки не спрашивает ничего', asked===0);
    check('и тоже доигран', (c.you.stageLog||[]).length===3,
          String((c.you.stageLog||[]).length));

    /* ---- 4. вопрос стоит на карте, если карта идёт --------------------
       ccChoiceBox под skipAnimation отвечает сам и ничего не рисует, поэтому
       здесь показ включается обратно, а срок ответа делается коротким: нам
       нужен сам факт, куда встала панель. */
    skipAnimation=false; CC_SKIP_RUN=false;
    const waitWas=CC_CHOICE_WAIT; CC_CHOICE_WAIT=40;
    const d=mkField();
    const fakeMap=document.createElement('div');
    fakeMap.className='zone-replay'; document.body.appendChild(fakeMap);
    CC_RUN_MAP=fakeMap;
    const onMapP=careerLandingPick(d.field, d.you, 'probe', ['cup']);
    const onMapCls=(document.querySelector('.cc-choice')||{}).className||'';
    const inMap=!!fakeMap.querySelector('.cc-choice');
    const withArt=!!(document.querySelector('.cc-choice .cc-choice-btn.has-art'));
    await onMapP;
    check('на карте — маленькое окно, как у середины игры',
          inMap && /cc-choice-map/.test(onMapCls), onMapCls);
    check('и без картинок во всю ширину', !withArt);

    /* Контроль: без карты вопрос уезжает в ленту — но такой же компактный.
       Плитки во всю ширину убраны его правкой 25 августа («этого не должно
       быть» под снимком старого вида), поэтому картинок нет и здесь. */
    CC_RUN_MAP=null;
    const e=mkField();
    const feedP=careerLandingPick(e.field, e.you, 'probe', ['cup']);
    const feedCls=(document.querySelector('.cc-choice')||{}).className||'';
    const feedArt=!!document.querySelector('.cc-choice .cc-choice-btn.has-art');
    await feedP;
    check('контроль: без карты — карточка в ленте',
          /stage-card/.test(feedCls) && !/cc-choice-map/.test(feedCls), feedCls);
    check('и в ленте тоже без плиток во всю ширину', !feedArt);
    fakeMap.remove(); CC_CHOICE_WAIT=waitWas;

    /* ---- 5. между играми карта возвращается к целому острову ------------
       Иначе вопрос задаётся над последним кругом прошлой игры — его слова:
       «карту показывает не полностью заполненную почему-то». */
    const host=document.createElement('div'); document.body.appendChild(host);
    const rep=ZoneReplay.mount(host, MAP_ART[ACTIVE_LANDING_SET],
      MAP_ASPECT[ACTIVE_LANDING_SET].replace('/', ' / '), 0.88);
    rep.stage.style.transform='translate(-900px,-400px) scale(6.3)';
    rep.svg.innerHTML='<circle r=\"1\"></circle>';
    if(rep.head) rep.head.innerHTML='ЗОНА 12';
    ZoneReplay.whole(rep);
    check('камера вернулась на весь остров',
          rep.stage.style.transform.indexOf('scale(1)')>=0, rep.stage.style.transform);
    check('и на нём ничего не осталось от прошлой игры',
          rep.svg.innerHTML==='' && (!rep.head || rep.head.innerHTML===''));
    host.remove();
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdrop-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log(s));
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) process.exit(1);
console.log('дроп спрашивается каждую игру там, где высадка вообще есть');
