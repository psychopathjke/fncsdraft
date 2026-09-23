// Мейджор 2025-го в карьере: плей-ин → своя группа в свой день → LCQ → лобби
// последнего шанса на следующий день → финал; и комната из людей 2025-го.
//
// Его слово, 20 сентября 2026: «сделай карьеру как для выбора с расписанием
// 2025 года полностью и игроки тоже из того года». Стадии — CC_MAJOR_STAGE_2025
// (Epic'овы MatchCap и отсечки, измерены 19 августа).
//
//   node tools/check-career-2025-major.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"), yes=document.getElementById("ccAskYes");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; }
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); am.style.display="none"; careerPlay(); return; } }
    const cb=document.querySelector(".cc-choice-btn"); if(cb){ cb.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  window.addEventListener('unhandledrejection', e=>{ out.errs.push('rej '+String(e.reason && e.reason.stack || e.reason)); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(div, day, major, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Trioman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:3, year:2025, year0:2025, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], major:major, seed:'y25'}, extra||{}),
      partners:[{card:card('M1',93), patience:60, since:'2024-12-01', dev:0},
                {card:card('M2',92), patience:60, since:'2024-12-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button at all');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': the button skips instead of playing');
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<16000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c){ const pb=document.querySelector('#screen-career-hub .ch-play'); out.notes.debug={screen:document.body.dataset.screen||[...document.querySelectorAll('.screen')].filter(x=>x.style.display!=='none').map(x=>x.id).join(','), stages:(document.getElementById('majorStages')||{}).innerHTML?.slice(0,300), lobby:(document.getElementById('lobbyTitle')||{}).textContent, run:CAREER_RUN, major:JSON.stringify(CAREER.career.major), day:careerToday(), can:careerMajorCan(careerMajorOn(careerToday())), on:JSON.stringify(careerMajorOn(careerToday()))}; const mm=careerMates(); out.notes.debug2={me:!!careerCard(), mates:mm.length, seats:careerMateSeats(), ask:(document.getElementById('ccAskModal')||{style:{}}).style.display, askNo:(document.getElementById('ccAskNo')||{}).textContent, next:JSON.stringify(careerNext())}; out.notes.debug3={askHtml:(document.getElementById('ccAskModal')||{}).innerText?.slice(0,300), hub:(document.querySelector('#screen-career-hub .ch-play')||{}).outerHTML?.slice(0,300)}; throw new Error(what+': no result card came back'); }
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    const rows=[...c.querySelectorAll('tbody tr')].length;
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return {head, rows};
  };
  const save=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  const dayOf=(n, want, nth)=>{ for(let d=CC_YEAR_2025_FROM; d<=CC_YEAR_2025_TO; d=ccAddDays(d,1)){ const ev=careerMajorOn(d); if(ev && ev.n===n && ev.stage===want && (nth==null || ev.nth===nth)) return d; } return null; };
  try{
    seed(1, '2025-01-29', undefined);
    check('год карьеры 2025', ccIs2025());
    check('трио', careerSquadSize()===3);
    const d={playin:dayOf(1,'playin'), g1:dayOf(1,'heats',1), g2:dayOf(1,'heats',2), g3:dayOf(1,'heats',3), lcq:dayOf(1,'lcq'), lobby:dayOf(1,'lclobby'), final:dayOf(1,'final')};
    out.notes.days=d;
    check('все стадии Мейджора 1 на календаре', Object.values(d).every(Boolean), JSON.stringify(d));
    check('плей-ин 29 января, группы 2/8/9 февраля, LCQ 12, лобби 13, финал 15', d.playin==='2025-01-29' && d.g1==='2025-02-02' && d.g3==='2025-02-09' && d.lcq==='2025-02-12' && d.lobby==='2025-02-13' && d.final==='2025-02-15');
    check('три группы', ccMajorHeats()===3);
    const sp=ccScaleStage(ccMajorStageSpec('playin')), sl=ccScaleStage(ccMajorStageSpec('lcq')), sf=ccScaleStage(ccMajorStageSpec('final'));
    check('плей-ин: 20 игр, 99 трио дальше', sp.games===20 && sp.cut===99, sp.games+'/'+sp.cut);
    check('LCQ: 10 игр, 33 трио дальше', sl.games===10 && sl.cut===33, sl.games+'/'+sl.cut);
    check('финал: 12 игр, 33 трио', sf.games===12 && sf.field===33, sf.games+'/'+sf.field);
    check('группа: 5 игр, топ-5', ccMajorHeat(1,1).games===5 && ccMajorHeat(1,1).cut===5 && ccMajorHeat(1,1).raw===true);
    // Ярлыки календаря — с именами 2026-го и своими словами для групп и лобби.
    const lbl=id=>ccYearLabel(id, '2025-02-02', '2025-02-02');
    check('ярлык плей-ина — из 2026-х имён', /плей-ин|Play-In/i.test(lbl('Major1_2025_PlayIn')) && !/2025/.test(lbl('Major1_2025_PlayIn')), lbl('Major1_2025_PlayIn'));
    check('ярлык группы', /групп|group/i.test(lbl('Major1_2025_Group2')), lbl('Major1_2025_Group2'));
    check('ярлык лобби', /лобби|lobby/i.test(lbl('Major1_2025_LCLobby')), lbl('Major1_2025_LCLobby'));
    check('Лион на календаре', /Лион|Lyon/.test(lbl('GlobalChampionship2025')), lbl('GlobalChampionship2025'));
    // Комната — люди 2025-го, реальные трио с карточек.
    const pool=careerPools();
    out.notes.pool={duos:pool.duos.length, players:pool.players.length, tag:pool.tag};
    check('снимок t1', pool.tag==='t1', pool.tag);
    const years=new Set(); pool.players.forEach(c=>years.add(ccCardYear(c)));
    check('в пуле нет карт 2026-го', ![...years].some(y=>y>2025), [...years].join(','));
    const trios=Object.keys(save().trios||{}).length;
    out.notes.trios=trios;
    check('третьи записаны с карточек 2025-го (≥ 60)', trios>=60, String(trios));
    // Плей-ин.
    const p1=await playThrough('play-in');
    let s=save();
    const r1=(s.log||[]).slice(-1)[0];
    check('плей-ин записан', r1 && r1.kind==='major' && r1.stage==='playin', JSON.stringify(r1||null));
    check('плей-ин: 20 игр', r1 && r1.games===20, String(r1 && r1.games));
    out.steps.push('play-in: '+p1.head+' · rows '+p1.rows);
    // Группа — только в свой день.
    seed(1, d.g1, {n:1, got:'playin', pass:'playin', ticket:false});
    const cr=CAREER.career;
    cr.majorSeed={n:1, season:1, size:3, rows:Array.from({length:99}, (_,i)=>i===40 ? 'you' : null)};
    // rows без реальных строк — только чтобы змейка знала место игрока (41-е → группа 2)
    const mine=ccMajorMyHeat(careerMajorOn(d.g1));
    out.notes.myGroup=mine;
    check('своя группа известна', mine>=1 && mine<=3, String(mine));
    const dayMine=dayOf(1,'heats',mine);
    check('чужой день группы закрыт', [d.g1,d.g2,d.g3].filter(x=>x!==dayMine).every(x=>{ cr.day=x; return !careerMajorCan(careerMajorOn(x)); }));
    cr.day=dayMine;
    check('свой день группы открыт', careerMajorCan(careerMajorOn(dayMine)));
    /* ---- ЗАПИСЬ ПРОШЕДШИХ КОПИТСЯ ПО ВСЕМ ТРЁМ ГРУППАМ -------------------

       Блок групп — три дня: свою играет игрок, соседние мир в свои дни
       (ccMajorWorldHeats). Раннер своей группы писал through=rows, то есть
       ЗАМЕЩАЛ запись, и всё, что мир посчитал до дня игрока, стиралось. А
       Ласт Ченс не пускает тех, кто уже прошёл, читая ровно эту запись — вот
       он и открывался для всех: его скрин 22 сентября. */
    {
      const c2=CAREER.career;
      c2.majorSeed={n:1, season:1, size:3, rows:['you'],
                    through:[[{h:'World1'}],[{h:'World2'}]], played:[1]};
      ccMajorSeedThrough(c2, [[{h:'Mine1'}], 'you'], 2);
      const faces=()=>ccMajorSeatedHandles({n:1}).map(String);
      out.notes.seedThrough={through:c2.majorSeed.through.length, played:c2.majorSeed.played.slice(), faces:faces()};
      check('своя группа не стирает посчитанные миром',
            faces().indexOf('World1')>=0 && faces().indexOf('World2')>=0,
            JSON.stringify(out.notes.seedThrough));
      check('и своих дописывает', faces().indexOf('Mine1')>=0, JSON.stringify(faces()));
      check('номера сыгранных групп копятся', c2.majorSeed.played.join()==='1,2', c2.majorSeed.played.join());
      // Перемотка через тот же день ничего не задваивает.
      const was=c2.majorSeed.through.length;
      ccMajorSeedThrough(c2, [[{h:'Mine1'}], 'you'], 2);
      check('повтор дня не задваивает запись', c2.majorSeed.through.length===was,
            was+' → '+c2.majorSeed.through.length);
      check('и номер группы тоже', c2.majorSeed.played.join()==='1,2', c2.majorSeed.played.join());
    }

    // LCQ → лобби завтра → билет.
    seed(2, d.lcq, undefined);
    check('LCQ открыт дивизиону 2', careerMajorCan(careerMajorOn(d.lcq)));
    check('лобби без прохода LCQ закрыто', !careerMajorCan(careerMajorOn(d.lobby)));
    const pl=await playThrough('lcq');
    s=save();
    const rl=(s.log||[]).slice(-1)[0];
    check('LCQ записан: 10 игр', rl && rl.stage==='lcq' && rl.games===10, JSON.stringify(rl && {stage:rl.stage, games:rl.games, place:rl.place, of:rl.of}));
    check('в LCQ нет лобби в тот же день', !/лобби|lobby/i.test(pl.head), pl.head);
    out.steps.push('lcq: '+pl.head+' · #'+(rl&&rl.place)+' of '+(rl&&rl.of));
    if(s.major && s.major.pass==='lcq'){
      check('прошёл LCQ — билета ещё нет', !s.major.ticket);
      check('прошедшие записаны для лобби', s.majorLc && s.majorLc.n===1 && s.majorLc.rows.length===33, JSON.stringify(s.majorLc && s.majorLc.rows.length));
      CAREER.career.day=d.lobby; careerSave(); careerRenderHub('centre');
      check('лобби открыто прошедшему', careerMajorCan(careerMajorOn(d.lobby)));
      const pb=await playThrough('lobby');
      s=save();
      const rb=(s.log||[]).slice(-1)[0];
      check('лобби записано: 3 игры', rb && rb.stage==='lclobby' && rb.games===3, JSON.stringify(rb && {stage:rb.stage, games:rb.games}));
      check('комната лобби — 33', rb && rb.of===33, String(rb && rb.of));
      out.steps.push('lobby: '+pb.head+' · ticket '+(s.major && s.major.ticket));
      check('после лобби: билет = победа', s.major.ticket===(rb.wins>0 || rb.passed===true) || typeof rb.wins!=='number');
    } else {
      out.steps.push('lcq: вылетел — лобби проверяется сидом');
      seed(2, d.lobby, {n:1, got:'lcq', pass:'lcq', ticket:false}, {majorLc:{n:1, season:1, rows:[]}});
      check('лобби открыто прошедшему LCQ', careerMajorCan(careerMajorOn(d.lobby)));
    }
    // Финал — по билету, платит таблицей 2025-го.
    seed(1, d.final, {n:1, got:'lclobby', pass:'lclobby', ticket:true});
    check('финал по билету открыт', careerMajorCan(careerMajorOn(d.final)));
    const pf=await playThrough('final');
    s=save();
    const rf=(s.log||[]).slice(-1)[0];
    check('финал записан: 12 игр', rf && rf.stage==='final' && rf.games===12, JSON.stringify(rf && {stage:rf.stage, games:rf.games, place:rf.place, of:rf.of}));
    check('финал: 33 трио', rf && rf.of===33, String(rf && rf.of));
    check('финал платит таблицей 2025-го: $180 000 за первое', majorPrize(1)===180000 && majorPrize(14)===17400, majorPrize(1)+'/'+majorPrize(14));
    out.steps.push('final: '+pf.head+' · #'+(rf&&rf.place)+' of '+(rf&&rf.of)+' · $'+(s.earnings||0));
    /* Квота — та же таблица, что читает код, а не число из головы.

       Здесь стояло «топ-2 ЕС»: GC2025_M1_SEATS.EU действительно 2, но это ДУО,
       а сезон трио — ccGcSlots переводит их в ccTeams(2) = 1. Проба сходилась
       на всех местах, кроме ровно второго, и падала в тот прогон, где симуляция
       ставила второе: «place 2 seat null». */
    const gcCut=ccGcSlots(GC2025_M1_SEATS);
    out.notes.gcCut=gcCut;
    check('место в Лион — по квоте региона с финала Мейджора 1',
          (rf.place<=gcCut)===!!ccGlobalsSeat(),
          'cut '+gcCut+' place '+rf.place+' seat '+JSON.stringify(ccGlobalsSeat()));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc25m-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=400000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0,5).forEach(e => console.log('JSERR ' + e.slice(0,400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2025-major');
