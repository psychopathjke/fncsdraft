// Кап в чужом регионе (ccAwayPlay): кнопка на хабе, поле и призы того региона, пинг до чужого сервера и штраф
// к силе, 25 энергии, день не сдвигается и свой вечер того же дня остаётся.
//   node tools/check-career-away.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found, set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const y=document.getElementById("ccAskYes"); if(y) y.click(); return; }
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    const DAY='2026-03-22';   // Solo Victory Cup: соло, напарник не нужен
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'AwayMan', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:DAY, division:4, earnings:0, balance:0, reach:0, energy:100,
              tokens:[], log:[], news:[], life:{rp:500}},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    if(careerNext().type!=='victory') fail(DAY+' is not a cup day: '+careerNext().type);

    // ---- числа ------------------------------------------------------------------
    // Пинг — замер cloudping (AWS): EU–NAC 92, EU–ME 85, EU–OCE 251.
    if(ccXregMs('EU','NAC')!==92 || ccXregMs('NAC','EU')!==92 || ccXregMs('EU','ME')!==85 || ccXregMs('EU','OCE')!==251) fail('ping matrix is not the measured one');
    if(ccAwayPen(92)!==18 || ccAwayPen(85)!==16) fail('penalty: NAC '+ccAwayPen(92)+', ME '+ccAwayPen(85));
    if(ccAwayPen(400)!==CC_AWAY_PEN_MAX || ccAwayPen(10)!==0) fail('penalty is not clamped');
    out.steps.push('ping EU-NAC 92 ms, EU-ME 85 (cloudping), penalty NAC -18, ME -16, cap -'+CC_AWAY_PEN_MAX);

    // ---- region lock: FNCS, Trial, дивизионные капы на выезд не идут ------------------------
    if(ccAwayFits({id:'S39_FNCSDivisionalCupTrial', placement:true, single:true})) fail('FNCS Trial is open away');
    if(!ccAwayFits({id:'S37_DuosDivisionalCup_Division1'})) fail('a divisional cup is closed away');
    if(!ccAwayFits({id:'S40_SoloVictoryCup'}) || !ccAwayFits({id:'S43_TriosCashCup'})) fail('ordinary cups are closed away');
    out.steps.push('region lock: FNCS and Trial stay home, divisional and Victory/Cash cups travel');

    // ---- кнопки на хабе -----------------------------------------------------------
    careerRenderHub('centre');
    const row=document.querySelector('#screen-career-hub .cc-away');
    if(!row) fail('no other-regions row on a cup day');
    const btns=[...row.querySelectorAll('button')];
    // \u0414\u043e \u0441\u0432\u043e\u0435\u0433\u043e \u043a\u0430\u043f\u0430 (EU 13:00\u201317:00) \u2014 \u0442\u043e\u043b\u044c\u043a\u043e \u0442\u043e, \u0447\u0442\u043e \u0443\u0441\u043f\u0435\u0432\u0430\u0435\u0442 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u0442\u044c\u0441\u044f \u0440\u0430\u043d\u044c\u0448\u0435: OCE 02:00, ASIA 04:00.
    const order0=btns.map(b=>((b.getAttribute('onclick')||'').match(/'([A-Z]+)'/)||[])[1]);
    // До своего капа (EU 13:00–17:00): OCE и ASIA обычной кнопкой, поздние (BR, NAC, NAW) — с пометкой и вопросом о пропуске.
    if(order0.slice(0,2).join()!=='OCE,ASIA') fail('morning regions first: '+order0.join());
    if(ccAwayWhy('NAC')!=='later' || ccAwayWhy('BR')!=='later') fail('NAC/BR not marked as after the home cup: '+ccAwayWhy('NAC')+'/'+ccAwayWhy('BR'));
    const nacB=btns.find(b=>(b.getAttribute('onclick')||'').indexOf("ccAwayPlay('NAC'")===0);
    if(!nacB || !nacB.disabled || nacB.textContent!==L().awAfterOwn) fail('NAC before the home cup should be a grey «'+L().awAfterOwn+'» button: '+(nacB && nacB.outerHTML.slice(0,160)));
    const afterTx=L().awAfterOwn;
    const oce=btns[0];
    const oceRow=oce.closest('.cc-aw-r');
    if(!oceRow || !/251/.test(oceRow.textContent) || !/-35/.test(oceRow.textContent) || oce.textContent!==L().awGo) fail('OCE row does not show ping, penalty and Play: '+(oceRow && oceRow.textContent));
    if(/\u2014/.test(row.textContent)) fail('long dash on the row');
    out.steps.push('hub before home: '+order0.join(' ')+' \u00b7 '+afterTx);
    const btns2=btns;
    // \u0420\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435 Epic: 22.03 Solo Victory Cup EU 13:00 UTC, NAC +5 \u0447; \u0443 ME \u0442\u043e\u0442 \u0436\u0435 \u00abDay 1\u00bb \u0448\u0451\u043b \u043d\u0430\u043a\u0430\u043d\u0443\u043d\u0435.
    const sl=ccAwaySlot('NAC');
    if(!(sl instanceof Date) || sl.getUTCHours()!==18) fail('NAC start is not 18:00 UTC: '+sl);
    if(ccAwaySlot('ME')!==null || ccAwayWhy('ME')!=='off') fail('ME is offered on a day it had no cup');
    if(btns2.some(b=>(b.getAttribute('onclick')||'').indexOf("'ME'")>=0)) fail('ME button on the hub');
    out.steps.push('schedule: NAC '+sl.toISOString().slice(11,16)+' UTC, no ME that day');
    // \u0414\u0435\u043d\u044c \u0431\u0435\u0437 \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f (\u043f\u0440\u043e\u0448\u043b\u044b\u0439 \u0433\u043e\u0434) \u2014 \u0440\u0435\u0433\u0438\u043e\u043d\u044b \u043e\u0442\u043a\u0440\u044b\u0442\u044b \u0431\u0435\u0437 \u0432\u0440\u0435\u043c\u0435\u043d\u0438.
    const keep=careerVictoryOn; careerVictoryOn=()=>({id:'NoSuchCup_X', name:'X'});
    // Без расписания — обычный вечер по медианам 2026: EU 17:00, NAC +6 ч.
    { const fs0=ccAwaySlot('NAC'); if(!(fs0 instanceof Date) || fs0.getUTCHours()!==23) fail('a cup without schedule: NAC should be 23:00 UTC: '+fs0); }
    careerVictoryOn=keep;

    // ---- вечер в NAC: после своего капа, ночью ------------------------------------------
    ccAwayHomeDone(DAY, 'victory'); careerAdvanceTo(ccAddDays(DAY, 1)); careerSave();
    CAREER.career.energy=100;
    const en0=careerEnergy();
    let fieldReg=null, ping=null, youPow=null, basePow=null;
    const cyt=careerYouTeam; careerYouTeam=function(){ const t=cyt.apply(this, arguments); basePow=t.pow; ping=ccPingNow(); return t; };
    const csf=careerSoloField; careerSoloField=function(){ fieldReg=ccCareerRegion(); return csf.apply(this, arguments); };
    const sgl=simulateGamesLive; simulateGamesLive=function(field){ if(youPow==null){ const y=field.find(t=>t.isYou); youPow=y && y.pow; } return sgl.apply(this, arguments); };
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    const pr=ccAwayPlay('NAC', DAY);
    let card=null;
    for(let i=0; i<8000 && !card; i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')].find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    await pr;
    careerYouTeam=cyt; careerSoloField=csf; simulateGamesLive=sgl;
    if(!card) fail('no result card after the away cup');
    if(fieldReg!=='NAC') fail('the field was built for '+fieldReg);
    if(ping!==92) fail('ping during the night was '+ping);
    if(!(basePow-youPow===18)) fail('power penalty: '+basePow+' -> '+youPow);
    out.steps.push('night: field NAC, ping 92, power '+basePow+' -> '+youPow);
    const cr=CAREER.career;
    if(careerToday()!==ccAddDays(DAY, 1)) fail('the night NAC moved the day: '+careerToday());
    if(Math.round(en0-careerEnergy())!==CC_AWAY_ENERGY) fail('energy spent '+(en0-careerEnergy()));
    if(!(cr.away && (cr.away[DAY]||[]).indexOf('NAC')>=0)) fail('the away night is not remembered');
    const last=(cr.log||[]).slice(-1)[0];
    if(!last || last.away!=='NAC' || last.day!==DAY) fail('the log row is not tagged NAC: '+JSON.stringify(last));
    if(CC_REGION_AS!==null || CC_AWAY!==null) fail('the region switch leaked: '+CC_REGION_AS);
    if(ccCareerRegion()!=='EU') fail('home region changed: '+ccCareerRegion());
    if(ccAwayWhy('NAC', DAY)!=='done') fail('NAC can be played twice: '+ccAwayWhy('NAC', DAY));
    if(ccAwayWhy('NAW', DAY)!=='past') fail('NAW 20:00 not over after NAC until 22:00: '+ccAwayWhy('NAW', DAY));
    card.querySelector('button[onclick*="careerBackToHub"]').click(); await wait(50);
    out.steps.push('after: day '+careerToday()+', energy -'+CC_AWAY_ENERGY+', log #'+last.place+' on '+last.day+', NAW over');

    // ---- старый сейв, где часы ушли за свой кап: свой кап всё равно открыт --------------------------
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry();
    CAREER.career.awayClock={day:DAY, t:Date.parse(DAY+'T22:00:00Z')};
    if(ccAwayHomeBusy(DAY) || !careerCanPlayKindOn(DAY, 'victory')) fail('home cup closed by an earlier away night');
    out.steps.push('home cup never closed by an away night');
    // До своего капа поздний регион не играется (его время не настало).
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry();
    { const n0=(CAREER.career.log||[]).length; await ccAwayPlay('NAC', DAY);
      if((CAREER.career.log||[]).length!==n0 || ccAwayHomeBusy(DAY) || !careerCanPlayKindOn(DAY, 'victory')) fail('NAC played before its time or closed the home cup'); }
    out.steps.push('NAC before the home cup: grey, does not play, home cup open');

    // ---- в порядке расписания: OCE утром, свой EU, ночью NAC ---------------------------------
    const play=async (reg, day)=>{
      const sk3=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
      const p=ccAwayPlay(reg, day); let c=null;
      for(let i=0; i<8000 && !c; i++){ await wait(25);
        c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
      clearInterval(sk3); await p; if(!c) fail('no result card after '+reg); c.querySelector('button[onclick*="careerBackToHub"]').click(); await wait(50);
    };
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry();
    await play('OCE');
    if(ccAwayWhy('ASIA')!=='past') fail('ASIA 04:00 not over after OCE 02:00-06:00: '+ccAwayWhy('ASIA'));
    if(ccAwayHomeBusy(DAY) || !careerCanPlayKindOn(DAY, 'victory')) fail('home 13:00 closed after OCE until 06:00');
    // Свой вечер сыгран (как в конце runCareerVictoryNight): часы до 17:00, день вперёд.
    ccAwayHomeDone(DAY); careerAdvanceTo(ccAddDays(DAY, 1)); careerSave();
    if(ccAwayCarryDay()!==DAY) fail('late regions not carried to the night');
    careerRenderHub('centre');
    const late=document.querySelector('#screen-career-hub .cc-away');
    const lateRegs=late ? [...late.querySelectorAll('button')].map(b=>((b.getAttribute('onclick')||'').match(/'([A-Z]+)'/)||[])[1]) : [];
    if(lateRegs.join()!=='NAC,NAW') fail('night row should be NAC, NAW (BR 16:00 over): '+lateRegs.join());
    if(late.textContent.indexOf(L().awLateT)<0 || !late.classList.contains('cc-away-late')) fail('night block has no title');
    await play('NAC', DAY);
    if(careerToday()!==ccAddDays(DAY, 1)) fail('night NAC moved the day: '+careerToday());
    const ln=(CAREER.career.log||[]).slice(-1)[0];
    if(!ln || ln.away!=='NAC' || ln.day!==DAY) fail('night NAC logged on '+(ln && ln.day));
    if(ccAwayWhy('NAW', DAY)!=='past') fail('NAW 20:00 not over after NAC 18:00-22:00');
    out.steps.push('in order: OCE, home EU, night row NAC+NAW, NAC played on '+DAY+' without moving '+careerToday());

    // ---- нет сил -----------------------------------------------------------------------
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry(); CAREER.career.energy=10;
    if(ccAwayWhy('OCE')!=='tired') fail('a tired player can go away: '+ccAwayWhy('OCE'));
    out.steps.push('with 10 energy: '+ccAwayWhy('OCE'));

    // ---- Performance Evaluation: у Epic только EU и NAC, в карьере Д1 ------------------------
    const EV_DAY='2026-03-20';
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'AwayEval', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88, 'roleIGL'), ageEdge:4},
      career:{season:1, day:EV_DAY, division:1, earnings:0, balance:0, reach:0, energy:100,
              tokens:[], log:[], news:[], life:{rp:500}},
      partner:null}));
    careerEntry();
    { const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand); if(!careerPartnerCard() && s){ careerDmAccept(s.id); } }
    if(careerNext().type!=='eval') fail(EV_DAY+' is not an evaluation night in D1: '+careerNext().type);
    if(ccAwayKind('NAC')!=='eval') fail('NAC evaluation not offered: '+ccAwayKind('NAC'));
    const evRegs=CC_REGIONS.filter(r=>r!=='EU' && ccAwayWhy(r)!=='off');
    if(evRegs.join()!=='NAC') fail('evaluation away regions should be NAC only: '+evRegs.join());
    const esl=ccAwaySlot('NAC'); if(!(esl instanceof Date) || esl.getUTCHours()!==23) fail('NAC evaluation start: '+esl);
    careerRenderHub('centre');
    if(!document.querySelector('#screen-career-hub .cc-away')) fail('no away row on an evaluation night');
    if(ccAwayWhy('NAC')!=='later') fail('NAC evaluation 23:00 open before the home one at 17:00: '+ccAwayWhy('NAC'));
    // Своя оценка сыграна — NAC ночью.
    ccAwayHomeDone(EV_DAY, 'eval'); careerAdvanceTo(ccAddDays(EV_DAY, 1)); careerSave(); CAREER.career.energy=100;
    let eBase=null, ePow=null;
    const cyt2=careerYouTeam; careerYouTeam=function(){ const t=cyt2.apply(this, arguments); eBase=t.pow; return t; };
    const sgl2=simulateGamesLive; simulateGamesLive=function(field){ if(ePow==null){ const y=field.find(t=>t.isYou); ePow=y && y.pow; } return sgl2.apply(this, arguments); };
    const en1=careerEnergy();
    await play('NAC', EV_DAY);
    careerYouTeam=cyt2; simulateGamesLive=sgl2;
    if(careerToday()!==ccAddDays(EV_DAY, 1)) fail('the evaluation away moved the day: '+careerToday());
    if(Math.round(en1-careerEnergy())!==CC_AWAY_ENERGY) fail('evaluation away energy: '+(en1-careerEnergy()));
    if(!(eBase-ePow===18)) fail('evaluation away penalty: '+eBase+' -> '+ePow);
    const lr=(CAREER.career.log||[]).slice(-1)[0];
    if(!lr || lr.kind!=='eval' || lr.away!=='NAC' || lr.day!==EV_DAY) fail('evaluation log row: '+JSON.stringify(lr));
    out.steps.push('evaluation: NAC only (23:00 UTC), after the home one, power '+eBase+' -> '+ePow+', logged on '+lr.day);

    // ---- кап дивизиона: тоже на выезд, по часам, без перехода между дивизионами ----------------
    const seedDiv=(day)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'AwayDiv', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:82, role:'roleIGL', attrs:ccRookieAttrs(82, 'roleIGL'), ageEdge:4},
      career:{season:1, day, division:2, earnings:0, balance:0, reach:0, energy:100, tokens:[], log:[], news:[], life:{rp:500}},
      partner:null})); careerEntry();
      const sd=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand); if(!careerPartnerCard() && sd) careerDmAccept(sd.id); };
    const divDays=Object.keys(CC_AWAY_SCHED).filter(k=>k.indexOf('_FNCSDivisionalCup_Division2_Event')>0).map(k=>k.split('|')[0]);
    let DD=null;
    for(const d of divDays){ seedDiv(d); if(careerNext().type==='cup' && careerNext().day===d){ DD=d; break; } }
    if(!DD) fail('no Division 2 cup day with an Epic schedule in the career calendar');
    if(ccAwayKind('NAC')!=='cup') fail('NAC div cup not offered on '+DD+': '+ccAwayKind('NAC'));
    if(ccAwayWhy('NAC')!=='later') fail('NAC div cup should wait for the home one: '+ccAwayWhy('NAC'));
    const divSlot=ccAwaySlot('NAC'), homeSlot=ccAwaySlot('EU');
    if(!(divSlot instanceof Date) || !(homeSlot instanceof Date) || divSlot<=homeSlot) fail('div cup slots: EU '+homeSlot+' NAC '+divSlot);
    // Свой вечер сыгран: часы и перенос, как в конце runCareerCup.
    ccAwayHomeDone(DD, 'cup'); careerAdvanceTo(ccAddDays(DD, 1)); careerSave();
    careerRenderHub('centre');
    const lateDiv=document.querySelector('#screen-career-hub .cc-away');
    const lateDivRegs=lateDiv ? [...lateDiv.querySelectorAll('button')].map(b=>((b.getAttribute('onclick')||'').match(/'([A-Z]+)'/)||[])[1]) : [];
    if(lateDivRegs.indexOf('NAC')<0) fail('night row after the home div cup has no NAC: '+lateDivRegs.join());
    { const nbD=[...lateDiv.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').indexOf("'NAC'")>=0);
      const rD=nbD && nbD.closest('.cc-aw-r'); if(!rD || rD.textContent.indexOf(L().awDivD(ccDivCount('NAC')))<0) fail('NAC row does not show its division: '+(rD && rD.textContent)); }
    let dBase=null, dPow=null;
    const cyt3=careerYouTeam; careerYouTeam=function(){ const t=cyt3.apply(this, arguments); dBase=t.pow; return t; };
    const sgl3=simulateGamesLive; simulateGamesLive=function(field){ if(dPow==null){ const y=field.find(t=>t.isYou); dPow=y && y.pow; } return sgl3.apply(this, arguments); };
    await play('NAC', DD);
    careerYouTeam=cyt3; simulateGamesLive=sgl3;
    if(CAREER.career.division!==2) fail('away div cup moved the division: '+CAREER.career.division);
    if(careerToday()!==ccAddDays(DD, 1)) fail('away div cup moved the day: '+careerToday());
    if(!(dBase-dPow===18)) fail('away div cup penalty: '+dBase+' -> '+dPow);
    const ld=(CAREER.career.log||[]).slice(-1)[0];
    const lowNAC=ccDivCount('NAC');
    if(!ld || ld.away!=='NAC' || ld.day!==DD || ld.div!==lowNAC) fail('away div cup should be played in NAC Division '+lowNAC+': '+JSON.stringify(ld));
    const upNAC=ld.place<=careerCupCut(lowNAC);
    if(upNAC ? ccAwayDiv('NAC')!==lowNAC-1 : ccAwayDiv('NAC')!==lowNAC) fail('NAC ladder after #'+ld.place+': D'+ccAwayDiv('NAC'));
    // Переход в NAC — по отсечке того дивизиона; проверяем и прямо: проход вверх двигает только лестницу NAC.
    CAREER.career.regDiv={NAC:lowNAC};
    if(CAREER.career.wf && CAREER.career.wf.monday===careerMonday(DD)) fail('away div cup gave a Weekly Final seat');
    out.steps.push('div cup '+DD+': NAC Division '+lowNAC+' at night, #'+ld.place+(upNAC?' promoted there':'')+', power '+dBase+' -> '+dPow+', home division stays 2, day stays');

    // ---- финал недели из чужого Д1 ------------------------------------------------------------------------
    { const wfDays=[...careerYearDays().entries()].filter(([d, l])=>l.some(e=>e.kind==='final') && d>'2026-01-15').map(([d])=>d).sort();
      const WF=wfDays[0]; if(!WF) fail('no Weekly Final day in 2026');
      // Путёвка: кап дивизиона в Д1 NAC на этой неделе, отсечку проходят все (careerCupCut подменён).
      const cupDay=[...careerYearDays().entries()].filter(([d, l])=>l.some(e=>e.kind==='cup') && careerMonday(d)===careerMonday(WF) && d<WF).map(([d])=>d).sort()[0];
      if(!cupDay) fail('no cup day in the week of '+WF);
      seedDiv(cupDay); CAREER.career.regDiv={NAC:1};
      const cutKeep=careerCupCut; careerCupCut=()=>999999;
      const sl=ccAwaySlot('NAC'); if(ccAwayWhy('NAC')==='later'){ ccAwayHomeDone(cupDay, 'cup'); careerAdvanceTo(ccAddDays(cupDay, 1)); careerSave(); }
      await play('NAC', cupDay);
      careerCupCut=cutKeep;
      const seat=(CAREER.career.regWf||{}).NAC;
      if(!seat || seat.monday!==careerMonday(WF)) fail('NAC Division 1 cup gave no Weekly Final seat: '+JSON.stringify(CAREER.career.regWf));
      if(CAREER.career.wf) fail('away seat leaked into the home seat');
      // Финал недели NAC в субботу.
      CAREER.career.day=WF; CAREER.career.energy=100; careerSave();
      if(ccAwayKind('NAC')!=='final') fail('NAC Weekly Final not offered on '+WF+': '+ccAwayKind('NAC'));
      let wfDay=WF;
      if(ccAwayWhy('NAC')==='later'){ ccAwayHomeDone(WF, ccAwayKind('EU')||'victory'); careerAdvanceTo(ccAddDays(WF, 1)); careerSave(); }
      if(ccAwayWhy('NAC', WF)) fail('NAC Weekly Final closed: '+ccAwayWhy('NAC', WF));
      const tbl0=JSON.stringify(CAREER.career.table||null), div0=CAREER.career.division, today0=careerToday();
      await play('NAC', wfDay);
      const lw=(CAREER.career.log||[]).slice(-1)[0];
      if(!lw || lw.kind!=='final' || lw.away!=='NAC' || lw.day!==WF) fail('NAC Weekly Final log: '+JSON.stringify(lw));
      if(CAREER.career.division!==div0 || careerToday()!==today0) fail('away final moved division/day: D'+CAREER.career.division+' '+careerToday());
      if(JSON.stringify(CAREER.career.table||null)!==tbl0) fail('away final wrote the home season table');
      if((CAREER.career.regWf||{}).NAC) fail('the NAC seat was not spent');
      if(CAREER.career.wf) fail('home seat appeared after the away final');
      out.steps.push('Weekly Final from NAC D1: seat from the cup '+cupDay+', final '+WF+' played #'+lw.place+' of '+lw.of+', $'+(lw.prize||0)+', home D'+div0+' and table untouched'); }

    // ---- полный свой вечер, потом NAC кнопкой прямо с карточки итога ---------------------------------
    localStorage.setItem('fncsdraft_career', JSON.stringify(s)); careerEntry();
    const askNo=setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const n=document.getElementById('ccAskNo'); if(n) n.click(); } }, 20);
    const sk4=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    document.getElementById('majorStages').innerHTML='';   // старые карточки прошлых сценариев
    try{ careerSpotEnsure(); }catch(e){}
    const homeP=careerPlay();
    let hc=null; for(let i=0; i<8000 && !hc; i++){ await wait(25);
      hc=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    await homeP;
    if(!hc) fail('no result card after the home cup');
    const nb=[...hc.querySelectorAll('.cc-away-card button')].find(b=>(b.getAttribute('onclick')||'').indexOf("'NAC'")>=0);
    if(!nb || nb.disabled) fail('no usable NAC button on the home result card: '+((hc.querySelector('.cc-away-card')||{}).textContent||'none'));
    const n0=(CAREER.career.log||[]).length;
    document.querySelectorAll('#majorStages .stage-card').forEach(c=>c.classList.add('old'));
    nb.click();
    let nc=null; for(let i=0; i<8000 && !nc; i++){ await wait(25);
      nc=[...document.querySelectorAll('#majorStages .stage-card:not(.old)')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]') && (CAREER.career.log||[]).length>n0); }
    clearInterval(sk4); clearInterval(askNo);
    const lnc=(CAREER.career.log||[]).slice(-1)[0];
    if(!lnc || lnc.away!=='NAC' || lnc.day!==DAY) fail('NAC from the result card not played: '+JSON.stringify(lnc));
    if(nc) nc.querySelector('button[onclick*="careerBackToHub"]').click();
    out.steps.push('full home cup, then NAC from its result card: played, logged on '+lnc.day+', today '+careerToday());

    // ---- пять языков ---------------------------------------------------------------------
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(!(typeof D.awH==='function' && D.awBtn('NA', 90, 18).indexOf('90')>=0 && D.aw_done && D.aw_tired && D.aw_mate)) fail(l+': away strings missing'); });
    out.steps.push('five languages');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccaway-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK a cup in another region: its field, its ping, 25 energy, the day stays');
