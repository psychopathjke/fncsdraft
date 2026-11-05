// Скин-капы: стоят в календаре своих годов и в 2027+ их нет, скин у всех есть в данных, денег не платят,
// верхняя четверть первого раунда получает скин в шкафчик, ниже и повторно нет, настоящий вечер проходит.
//   node tools/check-career-skin-cups.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const errs=[]; window.addEventListener('error', e=>errs.push(String(e.message)));
setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const y=document.getElementById('ccAskYes'); if(y) y.click(); }
  const p=document.querySelector('.landing-picker'); if(!p) return; const z=p.querySelectorAll('.land-zone'); if(!z.length) return; z[0].click(); const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click(); }, 30);
const card=(h,o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
const save=(year, day, size)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null},
  career:{season:1, size:size||2, year:year, year0:year, day:day, seasonOver:false, division:5, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'sk'},
  partner:{card:card('M1',80), patience:60, since:'2020-01-01', dev:0}, partners:[{card:card('M1',80), patience:60, since:'2020-01-01', dev:0}]}));
  CC_POOLS=null; CC_VICTORY_LIST=null; careerLoad(); careerMigrateSize(); careerMigrateClock(); };
notes.total=CC_SKIN_CUPS.length;
check('капов много', CC_SKIN_CUPS.length>=50, CC_SKIN_CUPS.length);
check('у каждого скин, имя и формат', CC_SKIN_CUPS.every(c=>c.skin && c.skinN && c.name && ['solo','duo','trio','squad'].includes(c.mode)));
const byY={}, lost=[];
for(const y of [2021,2022,2023,2024,2025,2026]){
  const c=CC_SKIN_CUPS.find(v=>v.day.startsWith(String(y)));
  save(y, y===2026 ? '2026-01-05' : y+'-01-10', y===2021||y===2025 ? 3 : 2);
  const on=ccVictoryList().filter(v=>v.skin);
  byY[y]=on.length;
}
notes.byYear=byY;
check('в каждом году есть', Object.values(byY).every(n=>n>0), JSON.stringify(byY));
// 2027: календарь тот же, скин-капов нет.
save(2026, '2026-01-05'); CAREER.career.season=2; CC_VICTORY_LIST=null;
check('в 2027 нет', !ccVictoryList().some(v=>v.skin));
// Настоящий вечер: Aloy Cup 2021.
const ev0=CC_SKIN_CUPS.find(v=>v.id==='S16_AloyCup');
save(2021, ev0.day, 3);
const alts=ccVictoryAlts(ev0.day); notes.alts=alts.map(v=>v.id);
check('Aloy Cup в свой день', alts.some(v=>v.id==='S16_AloyCup'), alts.map(v=>v.id).join());
CAREER.career.vpick={[ev0.day]:'S16_AloyCup'};
const on=careerVictoryOn(ev0.day); check('выбирается', on && on.id==='S16_AloyCup', on && on.id);
check('формат капа', ccVictoryFormat(on)===2, ccVictoryFormat(on));
check('денег не платит', ccVictoryPayOf(on, 1)===0);
// Правило награды.
const own=ccFnOwn();
check('ниже четверти ничего', ccSkinCupAfter(on, 60, 100)===false && !own[on.skin]);
CC_FF=true; const won=ccSkinCupAfter(on, 25, 100); CC_FF=false;
check('верхняя четверть получает скин', won && ccFnOwn()[on.skin] && ccFnOwn()[on.skin].t==='o', JSON.stringify(ccFnOwn()[on.skin]));
check('второй раз не выдаёт', ccSkinCupAfter(on, 1, 100)===false);
delete ccFnOwn()[on.skin];
const bal0=CAREER.career.balance||0, n0=CAREER.career.log.length;
skipAnimation=true; CC_SKIP_RUN=true;
const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
await Promise.race([runCareerVictory(), new Promise(r=>setTimeout(r, 500000))]);
clearInterval(sk);
const last=CAREER.career.log[CAREER.career.log.length-1]; notes.night={place:last&&last.place, prize:last&&last.prize, own:!!ccFnOwn()[on.skin]};
check('вечер записан', CAREER.career.log.length>n0);
check('денег нет', (CAREER.career.balance||0)===bal0 && !(last && last.prize), (CAREER.career.balance||0)-bal0);
check('без ошибок', !errs.length, errs.slice(0,3).join(' | '));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'skin-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '900000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-career-skin-cups');
