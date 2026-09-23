// Деньги 2024-го в карьере: Duos Cash Cup с таблицей мест по региону, Solo Victory Cup по $100 за победу,
// оценка трёх эпох (топ-5 по $200 → $250 → $400 за победу), Reload Duos Cash Cup на острове Reload,
// Форт-Уэрт по месту с финала Мейджора.
//
//   node tools/check-career-2024-cash.js
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
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(div, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Cashman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, year:2024, year0:2024, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y25c'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}, partners:[{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const playThrough=async what=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) throw new Error(what+': no button at all');
    if((play.getAttribute('onclick')||'').indexOf('careerPlay')<0) throw new Error(what+': the button skips instead of playing: '+play.outerHTML.slice(0,200));
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let c=null;
    for(let i=0;i<20000 && !c;i++){ await wait(25); c=[...document.querySelectorAll('#majorStages .stage-card')].find(x=>x.querySelector('button[onclick*="careerBackToHub"]')); }
    clearInterval(sk);
    if(!c) throw new Error(what+': no result card came back');
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  try{
    seed(1, '2023-12-05');
    const days=careerYearDays(); const kinds={};
    days.forEach(list=>list.forEach(e=>{ kinds[e.kind]=(kinds[e.kind]||0)+1; }));
    out.notes.kinds=kinds;
    check('капы с деньгами: 46', kinds.victory===46, String(kinds.victory));
    check('Duos Cash Cup 9 декабря по имени', /Duos Cash Cup 1/.test((days.get('2023-12-09')||[]).map(e=>e.label).join(' ')), (days.get('2023-12-09')||[]).map(e=>e.label).join(' '));
    check('Reload Duos Cash Cup 30 августа снят', !(days.get('2024-08-30')||[]).some(e=>/Reload/.test(e.label)));
    check('карт Reload под метку в 2024-м нет', !careerSpotSets().some(s=>/^r/.test(s.grid)), careerSpotSets().map(s=>s.grid).join(','));
    check('оценка 5 декабря — остров Chapter 5 сезона 1', careerNightSet({type:'eval', day:'2023-12-05'})==='f1', careerNightSet({type:'eval', day:'2023-12-05'}));
    check('оценка: 7 игр', ccEvalR1Games()===7, String(ccEvalR1Games()));
    // Таблицы выплат: Европа и Океания различаются, NA West читает NA Central.
    const v9=careerVictoryOn('2023-12-09');
    check('9 декабря — Duos Cash Cup с таблицей S28', v9 && v9.pay==='S28' && v9.mode==='duo', JSON.stringify(v9));
    check('Duos Cash Cup Европы: №1 $4 000 на дуо, 50-е $200', ccVictoryPayOf(v9, 1)===4000 && ccVictoryPayOf(v9, 50)===200 && ccVictoryPayOf(v9, 51)===0, [1,50,51].map(p=>ccVictoryPayOf(v9,p)).join('/'));
    CAREER.player.region='OCE'; CAREER.career.homeRegion='OCE';
    check('Duos Cash Cup Океании: №1 $500 на дуо', careerPrizeRegion()!=='OCE' || ccVictoryPayOf(v9, 1)===500, careerPrizeRegion()+' '+ccVictoryPayOf(v9,1));
    CAREER.player.region='NAW'; CAREER.career.homeRegion='NAW';
    check('NA West читает NA Central: №1 $3 200', careerPrizeRegion()!=='NAW' || ccVictoryPayOf(v9, 1)===3200, careerPrizeRegion()+' '+ccVictoryPayOf(v9,1));
    CAREER.player.region='EU'; CAREER.career.homeRegion='EU';
    // Duos Cash Cup, 9 декабря: два раунда, второй — по местам.
    seed(1, '2023-12-09');
    const h1=await playThrough('duos cash cup');
    let s=save(); const r1=(s.log||[]).slice(-1)[0];
    check('кап записан как victory, дуо', r1 && r1.kind==='victory' && !r1.solo, JSON.stringify(r1 && {kind:r1.kind, games:r1.games, place:r1.place, of:r1.of, prize:r1.prize}));
    check('карточка вечера зовёт кап по имени', /Duos Cash Cup/.test(h1), h1);
    if(r1 && r1.passed){
      check('второй раунд — 12 игр всего (6+6)', r1.games===12, String(r1.games));
      check('деньги по месту: топ-50 платит, дальше нет', (r1.place<=50)===((s.earnings||0)>0), 'place '+r1.place+' $'+s.earnings);
    }
    out.steps.push('dcc: '+h1+' · #'+(r1&&r1.place)+' of '+(r1&&r1.of)+' · $'+(s.earnings||0));
    // Solo Victory Cup, 8 декабря — соло, $100 за победу.
    seed(1, '2023-12-08');
    const v8=careerVictoryOn('2023-12-08');
    check('8 декабря — Solo Victory Cup, соло, $100', v8 && v8.mode==='solo' && v8.cash===100, JSON.stringify(v8));
    const h2=await playThrough('solo victory');
    s=save(); const r2=(s.log||[]).slice(-1)[0];
    check('соло-кап записан', r2 && r2.kind==='victory' && r2.solo===true, JSON.stringify(r2 && {kind:r2.kind, solo:r2.solo, games:r2.games}));
    out.steps.push('svc: '+h2+' · #'+(r2&&r2.place)+' · wins '+(r2&&r2.wins)+' · $'+(s.earnings||0));
    // Оценка, 5 декабря: топ-5 по $200 на игрока ($400 на дуо).
    seed(1, '2023-12-05');
    check('эпоха топ-5', ccEvalTop5Cash()===400 && ccEvalWinCash()===0);
    const h3=await playThrough('eval dec');
    s=save(); const r3=(s.log||[]).slice(-1)[0];
    check('оценка записана: 7 или 11 игр', r3 && r3.kind==='eval' && (r3.games===7 || r3.games===11), JSON.stringify(r3 && {kind:r3.kind, games:r3.games, place:r3.place, passed:r3.passed}));
    if(r3 && r3.passed) check('деньги оценки — только топ-5', (r3.place<=5)===((s.earnings||0)>0), 'place '+r3.place+' $'+s.earnings);
    out.steps.push('eval: '+h3+' · #'+(r3&&r3.place)+' · $'+(s.earnings||0));
    // Оценка в июне — $400 за победу.
    seed(1, '2024-06-04');
    check('эпоха побед', ccEvalTop5Cash()===0 && ccEvalWinCash()===800);
    /* Дивизионов в 2024-м нет вовсе (ccNoDivisions) — их и не было, а кубка,
       который поднимает наверх, в календаре ни одного. Сейв, заведённый до
       правки в третьем, при загрузке встаёт на первый (careerMigrateNoDiv), и
       ему открыты и квалификатор, и оценка: закрывать их было нечем. Тестер,
       22 сентября: «Как мне выбраться с 5 дивизиона если в 2024 не было их». */
    seed(3, '2024-01-26');
    check('дивизиона нет: сейв встал на первый', CAREER.career.division===1, 'div '+CAREER.career.division);
    check('квалификатор открыт', careerMajorCan(careerMajorOn('2024-01-26')));
    check('оценка открыта — дивизионов в году нет', careerCanPlayKind('eval'));
    // Не-Европа: оценки в календаре нет.
    seed(1, '2024-01-26', {homeRegion:'NAC'}); CAREER.player.region='NAC'; ccWorldReset();
    const kn={}; careerYearDays().forEach(list=>list.forEach(e=>{ kn[e.kind]=(kn[e.kind]||0)+1; }));
    check('NA Central: оценки нет, всё остальное на месте', !kn.eval && kn.major===33 && kn.victory===46, JSON.stringify(kn));
    // Форт-Уэрт: место с финала — Глобалы играются, платят $400 000 за первое.
    seed(1, '2024-09-07', {log:[{season:1, day:'2024-07-27', kind:'major', stage:'final', place:1, of:50, prize:85000}]});
    check('место в Форт-Уэрт есть', !!ccGlobalsSeat(), JSON.stringify(ccGlobalsSeat()));
    check('Глобалы открыты', careerGlobalsCan(careerGlobalsOn('2024-09-07')));
    const h4=await playThrough('globals');
    s=save(); const r4=(s.log||[]).slice(-1)[0];
    check('Глобалы записаны: 12 игр, 50 дуо', r4 && r4.kind==='globals' && r4.games===12 && r4.of===50, JSON.stringify(r4 && {kind:r4.kind, games:r4.games, place:r4.place, of:r4.of, prize:r4.prize}));
    check('Форт-Уэрт в заголовке', /Fort|Форт/.test(h4), h4);
    out.steps.push('globals: '+h4+' · #'+(r4&&r4.place)+' · $'+(r4&&r4.prize));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc25c-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 1500000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2024-cash');
