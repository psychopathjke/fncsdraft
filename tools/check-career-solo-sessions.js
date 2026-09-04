// Квалификация Solo Series — три сессии, идёт лучшая.
//
// Его слово, 30 августа: «лучшими карточками даже в хиты не могу пройти».
// Замер (career-solo-qual-probe): с одной попытки в топ-100 из 4900 проходили
// 43% карт 96. У Epic сессий было четыре, считалась лучшая; карьера даёт три
// (6, 10, 11 января). Проверяется правило целиком:
//   1) все три дня — квал, подписаны «Сессия 1/2/3», хиты и финал на местах;
//   2) не прошёл в первой — вторая открыта; в один день дважды — нет;
//   3) прошёл — остальные сессии закрыты, день свободен, хиты открыты;
//   4) лучшее место копится (best), проход не теряется от худшей сессии;
//   5) в команде «свой вечер закрыт» считает сессии: сыграл 6-го — 10-го ещё
//      можешь, и день без тебя не шагнёт;
//   6) сессия по-настоящему играется и пишет день в состояние.
//
//   node tools/check-career-solo-sessions.js
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  setInterval(function(){
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Sessions', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-06', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(typeof careerSpotEnsure==='function') careerSpotEnsure();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;
    // 1. Календарь.
    const s1=careerSoloSeriesOn('2026-01-06'), s2=careerSoloSeriesOn('2026-01-10'), s3=careerSoloSeriesOn('2026-01-11');
    check('6 января — квал', s1 && s1.stage==='qual' && s1.day==='2026-01-06', JSON.stringify(s1));
    check('10 января — квал', s2 && s2.stage==='qual', JSON.stringify(s2));
    check('11 января — квал', s3 && s3.stage==='qual', JSON.stringify(s3));
    const lab=n=>L().calSession.replace('{N}', String(n));
    check('подписи сессий', s1 && s1.label.indexOf(lab(1))>=0 && s2.label.indexOf(lab(2))>=0 && s3.label.indexOf(lab(3))>=0,
          [s1&&s1.label, s2&&s2.label, s3&&s3.label].join(' | '));
    check('7 января — не квал', careerSoloSeriesOn('2026-01-07')===null);
    check('хиты и финал на местах', careerSoloSeriesOn('2026-01-17').stage==='heats' && careerSoloSeriesOn('2026-01-24').stage==='final');
    check('6 января в хабе — соло', careerNext().type==='solo', careerNext().type);
    // Карточка дня говорит цифры самого квала, а не дивизионного кубка
    // («33 из 113, матч 1 из 11» — его скрин 30 августа).
    const shp=ccNextShape({type:'solo'});
    check('карточка квала: комната, отсечка, игры', shp.of===careerVictoryField(true) && shp.cut===soloSeriesQualCut() && shp.games===CC_SOLO_QUAL_GAMES, JSON.stringify(shp));
    check('это не кубок дивизиона', shp.of!==careerCupSize(cr.division) || shp.cut!==careerCupCut(cr.division), JSON.stringify(shp));
    cr.day='2026-01-17';
    const shpH=ccNextShape({type:'solo'});
    check('карточка хитов: сотня, топ-25, 6 игр', shpH.of===CC_SOLO_FIELD && shpH.cut===soloSeriesHeatCut() && shpH.games===CC_SOLO_HEAT_GAMES, JSON.stringify(shpH));
    cr.day='2026-01-24';
    const shpF=ccNextShape({type:'solo'});
    check('карточка финала: сотня, 12 игр', shpF.of===CC_SOLO_FIELD && shpF.cut===0 && shpF.games===CC_SOLO_FINAL_GAMES, JSON.stringify(shpF));
    cr.day='2026-01-06';
    // 2. Не прошёл — следующая открыта; дважды в день — нет.
    cr.solo={got:'qual', pass:null, day:'2026-01-06', best:700};
    check('после первой (мимо) вторая открыта', careerSoloSeriesCanFor(s2, cr.solo)===true);
    check('та же сессия второй раз — нет', careerSoloSeriesCanFor(s1, cr.solo)===false);
    check('хиты без прохода закрыты', careerSoloSeriesCanFor(careerSoloSeriesOn('2026-01-17'), cr.solo)===false);
    // Старый сейв без дня — одна сыгранная сессия, остальные открыты.
    check('сейв без дня: 11 января открыто', careerSoloSeriesCanFor(s3, {got:'qual', pass:null})===true);
    // 3. Прошёл — остальные закрыты, день свободен, хиты открыты.
    cr.solo={got:'qual', pass:'qual', day:'2026-01-10', best:40};
    cr.day='2026-01-11';
    check('прошёл — третья сессия закрыта', careerSoloSeriesCanFor(s3, cr.solo)===false);
    check('11 января прошедшему не играется', careerCanPlayKind('solo')===false);
    check('хиты открыты', careerSoloSeriesCanFor(careerSoloSeriesOn('2026-01-17'), cr.solo)===true);
    check('финал закрыт', careerSoloSeriesCanFor(careerSoloSeriesOn('2026-01-24'), cr.solo)===false);
    // 5. Команда: свой вечер закрыт — с учётом сессий.
    check('сыграл 6-го, 10-го ещё можешь: вечер не закрыт', ccSoloDoneToday(s2, {got:'qual', pass:null, day:'2026-01-06'})===false);
    check('сыграл сегодня — закрыт', ccSoloDoneToday(s2, {got:'qual', pass:null, day:'2026-01-10'})===true);
    check('прошёл раньше — сегодня закрыт', ccSoloDoneToday(s3, {got:'qual', pass:'qual', day:'2026-01-06'})===true);
    check('хиты: сыграл — закрыт', ccSoloDoneToday(careerSoloSeriesOn('2026-01-17'), {got:'heats', pass:'qual', day:'2026-01-17'})===true);
    check('пусто — не закрыт', ccSoloDoneToday(s2, null)===false);
    // 6. Сессия играется по-настоящему и пишет день.
    delete cr.solo; cr.day='2026-01-06'; careerSave();
    await runCareerSoloSeries();
    check('день шагнул', cr.day==='2026-01-07', cr.day);
    check('состояние с днём сессии', cr.solo && cr.solo.got==='qual' && cr.solo.day==='2026-01-06' && cr.solo.best>=1, JSON.stringify(cr.solo));
    const row=cr.log[cr.log.length-1];
    check('строка журнала — квал', row && row.kind==='solo' && row.stage==='qual', JSON.stringify(row||null));
    out.notes.first={place:row && row.place, pass:cr.solo && cr.solo.pass};
    // 4. Лучшее место копится, проход не теряется.
    if(cr.solo && cr.solo.pass!=='qual'){
      cr.day='2026-01-10'; careerSave();
      check('10 января открыто после мимо', careerSoloSeriesCan(s2)===true);
      const wasBest=cr.solo.best;
      await runCareerSoloSeries();
      check('день шагнул после второй', cr.day==='2026-01-11', cr.day);
      check('best не хуже прежнего', cr.solo.best<=wasBest, wasBest+' → '+cr.solo.best);
      out.notes.second={place:cr.log[cr.log.length-1].place, pass:cr.solo.pass, best:cr.solo.best};
    }
    cr.solo={got:'qual', pass:'qual', day:'2026-01-10', best:5};
    cr.day='2026-01-11'; careerSave();
    check('прошедшему 11 января играть нечего', careerSoloSeriesCan(s3)===false);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsolosess-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('квал Solo Series — три сессии, идёт лучшая · '+JSON.stringify(out.notes));
