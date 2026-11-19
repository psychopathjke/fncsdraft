// Discord в соцсети: три сервера рисуются на пяти языках, вход на кастомки по порогам, раз в день, в свободный день;
// мобильная кастомка без телефона закрыта и качает мобильный рейтинг; своя кастомка списывает фонд.
//   node tools/check-career-discord.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const errs=[]; window.addEventListener('error', e=>errs.push(String(e.message)));
const phone=CC_SHOP.find(x=>x.unlock==='mobile').id;
const save=(day, extra, own)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:Object.assign({season:1, size:2, year:2026, year0:2026, day:day, seasonOver:false, division:1, earnings:0, balance:20000, reach:50000, tokens:[], log:[], news:[], seed:'dc', mobOvr:80, energy:100}, extra||{}),
  gear:{own:own===false ? [] : [phone]}, partners:[]}));
  CC_POOLS=null; CC_VICTORY_LIST=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); };
save('2026-05-06');
show('screen-career-hub');
for(const lang of ['ru','en','fr','it','pt']){
  setLang(lang); CH_SOCIAL='discord';
  for(const s of ['pc','mob','own']){ CH_DC=s; careerRenderHub('social');
    const h=(document.getElementById('chBody')||document.body).innerHTML;
    check(lang+' '+s+': сервер нарисован', h.indexOf('dc-wrap')>=0 && h.indexOf('undefined')<0 && h.indexOf('NaN')<0); }
}
setLang('en');
check('свободный день открыт', ccCentreDayOpen());
check('PC: сессии открыты всем', ccDcWhy('pcJoin')===null, ccDcWhy('pcJoin'));
check('мобила: с телефоном открыта', ccDcWhy('mobJoin')===null, ccDcWhy('mobJoin'));
// Как на настоящих: запись → чек-ин (код лобби) → живые игры → таблица.
ccDcRegister('mob', 's1');
check('запись', ccDcReg() && ccDcReg().kind==='mob' && !ccDcReg().checked);
CH_DC='mob'; careerRenderHub('social');
check('до чек-ина кода нет', (document.getElementById('chBody')||document.body).innerText.indexOf(ccDcReg().code)<0);
ccDcCheckIn(); careerRenderHub('social');
check('после чек-ина код виден', (document.getElementById('chBody')||document.body).innerText.indexOf(ccDcReg().code)>=0);
skipAnimation=true; CC_SKIP_RUN=true;
const sk=setInterval(()=>{ const p=document.querySelector('.landing-picker'); if(p){ const z=p.querySelectorAll('.land-zone'); if(z.length){ z[0].click(); const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click(); } }
  const c0=document.querySelector('.cc-choice-btn'); if(c0) c0.click(); const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 30);
const m0=ccMobileOvr(), e0=careerEnergy();
await Promise.race([ccScrimRun(), new Promise(r=>setTimeout(r, 300000))]);
clearInterval(sk);
const res=ccDcReg() && ccDcReg().res; notes.mob=res;
check('мобильная сессия сыграна: 16 человек', res && res.of===16, JSON.stringify(res));
check('мобильная сессия качает рейтинг', ccMobileOvr()>m0, ccMobileOvr()-m0);
check('стоит энергии', careerEnergy()===e0-CC_DC_ENERGY, e0-careerEnergy());
check('раз в день', ccDcWhy('mobJoin')===L().dcDone, ccDcWhy('mobJoin'));
// Инвайт за топ-5 держит ступень: Practice Scrims → Division 3.
save('2026-05-06', {division:5}); CAREER.player.ovr=70;
const tierA=ccNobleTier(); CAREER.career.nobleInv=CC_NOBLE_PROMO[tierA];
check('инвайт поднимает ступень', CC_NOBLE_LADDER[ccNobleTier()].name==='Noble Division 3', CC_NOBLE_LADDER[ccNobleTier()].name);
save('2026-05-06');
const b0=CAREER.career.balance; ccDcGo('mobHost');
check('своя мобильная кастомка списывает фонд', CAREER.career.balance<b0 || (CAREER.career.dcLast && CAREER.career.dcLast.cash>0), CAREER.career.balance-b0);
check('пост о своей кастомке', (CAREER.career.news||[]).some(n=>n.k==='ccPostHosted'));
save('2026-05-06', {}, false);
check('мобила: без телефона закрыта', ccDcWhy('mobJoin')===L().ccMobTrainNeed && ccDcWhy('mobHost')===L().ccMobTrainNeed);
save('2026-05-06', {energy:20});
check('без энергии закрыто', /40|20/.test(String(ccDcWhy('mobJoin'))), ccDcWhy('mobJoin'));
// Сервер практики по региону: EU — Noble с лестницей, остальные — свои (проверено в X 19.11.2026).
const want={EU:'Noble Practice', NAC:'Vital Scrims', NAW:'Vital Scrims', OCE:'Vital Scrims', ME:'Vital Scrims Middle East', BR:'Major Scrims', ASIA:'LYNX Pro Scrim'};
for(const reg of Object.keys(want)){
  save('2026-05-06'); CAREER.player.region=reg; CAREER.career.region=reg;
  CH_SOCIAL='discord'; CH_DC='pc'; careerRenderHub('social');
  const h=(document.getElementById('chBody')||document.body).innerText;
  check(reg+': '+want[reg], ccPracSrv()===want[reg] && ccActName('noble')===want[reg] && h.indexOf(want[reg])>=0, ccPracSrv());
  check(reg+': лестница Noble только в EU', (h.indexOf('Noble X')>=0)===(reg==='EU'));
  check(reg+': Noble не в чужом регионе', reg==='EU' || !/Noble/.test(ccNobleServer().name), ccNobleServer().name);
}
check('без ошибок', !errs.length, errs.slice(0,3).join(' | '));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'dc-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const r=JSON.parse(out); if(r.err){ console.log('ERR', r.err); process.exit(1); }
if(r.fails.length){ console.log('FAIL\n- '+r.fails.join('\n- ')); process.exit(1); }
console.log('OK discord: three servers, customs on PC and mobile, own server');
