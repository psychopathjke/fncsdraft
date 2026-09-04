// Бифы выключены — и выключены везде, а не только в ленте.
//
// Его слово, 30 августа (страница «playin»): «убери бифы с игры». Скрин: семь
// одинаковых постов «@swizzy опять сел нам на голову» за один вечер. Ключ
// CC_BEEFS_ON=false должен закрыть всю цепочку разом, потому что у неё пять
// выходов и любой из них может остаться торчать:
//   1) две встречи дома больше не записываются и поста не рождают;
//   2) даже горячая ссора в сейве не тянет соперника на дом (landingScore);
//   3) и не рисуется ярлыком на плитке точки;
//   4) старые посты ссор и сами ссоры вычищаются из сейва при загрузке;
//   5) вечер против «врага» больше не стоит вдвое.
// Если ключ когда-нибудь вернут в true — проба скажет об этом и выйдет.
//
//   node tools/check-career-beef.js
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
const SL = String.fromCharCode(92);

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null, skipped:false};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  let home=null, away=null;
  const seed=(extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Beefer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]}, extra||{}),
      partner:null}));
    careerEntry();
    useLandingSet(careerBrSet());
    careerSpotSet(4, careerBrSet());
    home=careerSpotZone(careerBrSet());
    away=ALL_LANDING_ZONES.find(z=>z!==home);
  };
  const night=(zone, rivalCard, youWin)=>{
    const you={isYou:true, name:'you', squad:[{handle:'Beefer'}], landingZone:zone};
    const foe={name:'foe', squad:[rivalCard], landingZone:zone};
    if(youWin){ foe._droppedOut=true; foe._deathCause='you'; }
    else { you._droppedOut=true; you._deathCause='foe'; }
    creditLandingFights([you, foe]);
    return you;
  };
  try{
    if(typeof CC_BEEFS_ON==='undefined') throw new Error('ключа CC_BEEFS_ON нет');
    if(CC_BEEFS_ON){ out.skipped=true; throw new Error('CC_BEEFS_ON=true: бифы включены, проба выключенных бифов не о том'); }
    seed();
    const foeCard=careerRosterNowEU()[0];
    if(!home || !away || !foeCard) throw new Error('нечем играть: дом, чужая коробка или соперник не нашлись');

    // 1. Две встречи дома — ни записи, ни поста.
    night(home, foeCard, true); night(home, foeCard, true); night(home, foeCard, false);
    check('встречи дома не записываются', careerBeefOf(foeCard.handle)===null, JSON.stringify(careerBeefs()));
    check('поста ссоры нет', !(CAREER.career.news||[]).some(n=>n && n.beef));
    check('живых ссор нет', careerBeefHot().length===0);

    // 2. Горячая ссора, подложенная в сейв, не тянет на дом и не рисуется.
    CAREER.career.beefs=[{h:foeCard.handle, w:2, l:0, met:3, since:careerToday(), last:careerToday(), hot:true}];
    check('careerBeefHot пуст при горячей записи', careerBeefHot().length===0);
    careerSpotFearOn({pow:100});
    check('набор ссор не выставляется', CC_BEEF_SET===null, String(CC_BEEF_SET && [...CC_BEEF_SET]));
    const foeTeam={pow:100, squad:[foeCard]};
    const calm={pow:100, squad:[careerRosterNowEU()[5]]};
    const avg=(team, zone)=>{ let s=0; for(let i=0;i<400;i++) s+=landingScore(team, zone, []); return s/400; };
    const pullFoe=avg(foeTeam, home)-avg(foeTeam, away);
    const pullCalm=avg(calm, home)-avg(calm, away);
    careerSpotFearOff();
    out.notes.pull={foe:+pullFoe.toFixed(2), calm:+pullCalm.toFixed(2)};
    check('на дом никого не тянет сильнее других', Math.abs(pullFoe-pullCalm) < CC_BEEF_PULL*0.5,
          pullFoe.toFixed(2)+' против '+pullCalm.toFixed(2));
    // 3. Ярлык на плитке.
    const tile=String(careerNightSpotHTML ? careerNightSpotHTML() : '');
    check('ярлыка «Биф с @…» на плитке нет', tile.indexOf('ch-spot-beef')<0);

    // 4. Старые посты и ссоры вычищаются при загрузке.
    seed({beefs:[{h:foeCard.handle, w:2, l:0, met:3, since:'2026-02-01', last:'2026-02-01', hot:true}],
          news:[{season:1, day:'2026-02-01', kind:'bad', k:'ccBeefStart', a:['beefer'], f:0, id:'n1',
                 by:{name:foeCard.handle, handle:ccHandle(foeCard.handle), verified:false, ovr:90}, beef:foeCard.handle},
                {season:1, day:'2026-02-01', kind:'good', k:'ccBeefHit', a:['x'], f:0, id:'n2'},
                {season:1, day:'2026-02-01', kind:'flat', k:'ccNewsWelcome', a:[], f:0, id:'n3'}]});
    const news=CAREER.career.news||[];
    check('пост ссоры вычищен из сейва', !news.some(n=>n && n.beef), JSON.stringify(news.map(n=>n.k)));
    check('остальные посты на месте', news.length===2, String(news.length));
    check('сами ссоры вычищены', Array.isArray(CAREER.career.beefs) && CAREER.career.beefs.length===0);
    check('кнопок ответа в ленте нет', String(careerNewsHTML(10)).indexOf('x-beef')<0);

    // 5. Вечер против «врага» больше не идёт по двойному счёту: careerSpotNight
    //    удваивает по метке _beefMet, а её ставит только careerBeefNight.
    seed();
    CAREER.career.beefs=[{h:foeCard.handle, w:2, l:0, met:3, since:careerToday(), last:careerToday(), hot:true}];
    const you=night(home, foeCard, true);
    check('метки двойного счёта нет', !you._beefMet);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccbeefoff-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.skipped){ console.log('CC_BEEFS_ON=true — бифы включены, проба выключенных бифов пропущена'); process.exit(0); }
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('бифы выключены везде: встречи, тяга, ярлык, старые посты, удвоение вечера · '+JSON.stringify(out.notes));
