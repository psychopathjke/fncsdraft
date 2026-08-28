// «В трио поставил метку: в 1 игре всё норм, во 2 пустая карта».
//
// Его слово, 27 августа. Проба играет настоящий дивизионный кубок в трио-сезоне
// с поставленной меткой и печатает по КАЖДОЙ игре: сколько команд лобби
// получили коробку, сколько коробок занято и где стоит игрок. Пустая карта —
// это игра, в которой коробок нет ни у кого.
//
//   node tools/probe-trio-empty-map.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
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
  const out={games:[], errs:null, fail:null, size:null, field:null};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  try{
    // Метка ставится окном перед вечером; в харнессе на него отвечаем сами.
    setInterval(function(){
      const am=document.getElementById('ccAskModal');
      if(am && am.style.display==='flex'){
        const no=document.getElementById('ccAskNo');
        if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; }
      }
      // Вопрос о высадке — первой кнопкой («домой»), это и есть «метка».
      document.querySelectorAll('.cc-choice-btn').forEach(b=>b.click());
    }, 25);

    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Trio', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:93, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:9000,
              tokens:[], log:[], news:[], size:3},
      partners:[]}));
    careerLoad();
    out.size=careerSquadSize();
    // Состав трио: добираем свободные кресла.
    let guard=0;
    while(careerMates().filter(Boolean).length<careerMateSeats() && guard++<8){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id); else break;
    }
    if(careerMates().filter(Boolean).length<careerMateSeats())
      { out.fail='состав трио не собрался: '+careerMates().filter(Boolean).length; throw 0; }

    // Своя точка на острове кубка — та самая «метка».
    const set=careerBrSet();
    useLandingSet(set);
    const stats=ZONE_STATS[set]||[];
    let best=0; stats.forEach((s,i)=>{ if((s&&s.r||0)>(stats[best]&&stats[best].r||0)) best=i; });
    careerSpotSet(best, set);

    /* Снимаем состояние острова в момент, когда игра уже началась: коробки
       раздаёт careerLandingPick, а считает их simulateGameOnMap. Вешаемся на
       второе — это ровно та игра, которую видит игрок. */
    const realGame=window.simulateGameOnMap;
    window.simulateGameOnMap=function(teams, lobbyOpts){
      const withZone=teams.filter(t=>t.landingZone).length;
      const boxes=new Set(teams.filter(t=>t.landingZone)
                               .map(t=>t.landingZone.x+','+t.landingZone.y));
      const me=teams.find(t=>t.isYou);
      out.games.push({лобби:teams.length, сКоробкой:withZone, коробок:boxes.size,
                      игрок: me && me.landingZone ? (me.landingZone.x+','+me.landingZone.y) : null});
      return realGame.apply(this, arguments);
    };

    skipAnimation=true; CC_SKIP_RUN=true;
    await runCareerCup();
    window.simulateGameOnMap=realGame;
    out.field=(out.games[0]||{}).лобби||null;
  }catch(e){ if(!out.fail) out.fail=String((e&&(e.stack||e.message))||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trioempty-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,1400',
  '--virtual-time-budget=900000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
console.log('размер состава: ' + out.size + ', лобби: ' + out.field);
out.games.forEach((g,i)=>console.log('  игра ' + (i+1) + ': лобби ' + g.лобби +
  ', с коробкой ' + g.сКоробкой + ', занято коробок ' + g.коробок +
  ', игрок на ' + (g.игрок||'—')));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
const empty = out.games.filter(g=>g.сКоробкой===0).length;
if (empty) { console.error('ПУСТЫХ КАРТ: ' + empty + ' из ' + out.games.length); process.exit(1); }
console.log('коробки есть во всех ' + out.games.length + ' играх');
