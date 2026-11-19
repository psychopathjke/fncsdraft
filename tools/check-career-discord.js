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
check('PC: без PR не зовут', !!ccDcWhy('pcJoin'));
check('мобила: зовут с рейтинга', ccDcWhy('mobJoin')===null, ccDcWhy('mobJoin'));
const m0=ccMobileOvr(), e0=careerEnergy(); ccDcGo('mobJoin');
check('мобильная кастомка качает рейтинг', ccMobileOvr()>m0, ccMobileOvr()-m0);
check('стоит энергии', careerEnergy()===e0-CC_DC_ENERGY, e0-careerEnergy());
check('раз в день', ccDcWhy('mobJoin')===L().dcDone, ccDcWhy('mobJoin'));
const b0=CAREER.career.balance; ccDcGo('mobHost');
check('своя мобильная кастомка списывает фонд', CAREER.career.balance<b0 || (CAREER.career.dcLast && CAREER.career.dcLast.cash>0), CAREER.career.balance-b0);
check('пост о своей кастомке', (CAREER.career.news||[]).some(n=>n.k==='ccPostHosted'));
save('2026-05-06', {mobOvr:70});
check('мобила: ниже порога закрыта', ccDcWhy('mobJoin')===L().dcNeedMob(CC_DC_MOB_RATE), ccDcWhy('mobJoin'));
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
