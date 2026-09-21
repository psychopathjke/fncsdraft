// Мейджор 2024-го в карьере: два открытых квалификатора по три раунда, таблица серии,
// полуфинал в две сетки (чужая сетка играется молча тем же вечером), финал на 50 дуо
// с таблицей выплат своего региона и местами в Форт-Уэрт.
//
//   node tools/check-career-2024-major.js
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
  const seed=(div, day, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Duoman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, size:2, year:2024, year0:2024, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'y24'}, extra||{}),
      partner:{card:card('M1',94), patience:60, since:'2023-11-01', dev:0},
      partners:[{card:card('M1',94), patience:60, since:'2023-11-01', dev:0}]}));
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
    if(!c){ out.notes.debug={day:careerToday(), can:careerMajorCan(careerMajorOn(careerToday())), on:JSON.stringify(careerMajorOn(careerToday())), next:JSON.stringify(careerNext()), ask:(document.getElementById('ccAskModal')||{style:{}}).style.display, stages:(document.getElementById('majorStages')||{}).innerHTML?.slice(0,300)}; throw new Error(what+': no result card came back'); }
    const head=c.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    c.querySelector('button[onclick*="careerBackToHub"]').click();
    return {head};
  };
  const save=()=>JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  const last=()=>(save().log||[]).slice(-1)[0];
  const goto=day=>{ CAREER.career.day=day; careerSave(); careerRenderHub('centre'); };
  const m24=()=>CAREER.career.major24;
  // Проход дальше — гарантированно: если вечер не задался, своя строка дописывается в прошедших.
  const force=(rows)=>{ if(rows && rows.indexOf('you')<0){ rows[rows.length-1]='you'; out.notes.forced=(out.notes.forced||0)+1; } };
  try{
    seed(1, '2024-01-26');
    check('год 2024, дуо', ccIs2024() && careerSquadSize()===2);
    const pool=careerPools();
    out.notes.pool={duos:pool.duos.length, players:pool.players.length, tag:pool.tag};
    check('снимок f1', pool.tag==='f1', pool.tag);
    const years=new Set(); pool.players.forEach(c=>years.add(ccCardYear(c)));
    check('в пуле нет карт новее 2024', ![...years].some(y=>y>2024), [...years].join(','));
    check('дивизион 1 — сотня полуфиналов (≥ 60 дуо)', pool.duos.length>=60, String(pool.duos.length));
    check('Q1R1 открыт', careerMajorCan(careerMajorOn('2024-01-26')));
    check('Q1R2 до Q1R1 закрыт', !careerMajorCan(careerMajorOn('2024-01-27')));
    // Квалификатор 1: три раунда.
    const q1=await playThrough('q1r1'); let r=last();
    check('Q1R1 записан: 10 игр, открытая комната', r && r.kind==='major' && r.stage==='q' && r.games===10 && r.of>1000, JSON.stringify(r && {stage:r.stage, games:r.games, of:r.of, place:r.place}));
    out.steps.push('q1r1: '+q1.head+' · #'+r.place+' of '+r.of);
    check('прошедшие R1 записаны (1000)', m24().q[1].r1.length===1000, String(m24().q[1].r1.length));
    force(m24().q[1].r1); careerSave();
    check('день сдвинулся на 27 января', careerToday()==='2024-01-27', careerToday());
    check('Q1R2 открыт прошедшему', careerMajorCan(careerMajorOn('2024-01-27')));
    const q2=await playThrough('q1r2'); r=last();
    // Европа: суббота — раунды 2 и 3 подряд (прошёл второй — вечер записан по третьему: комната 500, 20 игр).
    check('Q1R2 (Европа): 20 игр на 500 после прохода раунда 2, иначе 10 игр на 1000', (r.games===20 && r.of===500) || (r.games===10 && r.of===1000 && !r.passed), r.of+'/'+r.games+'/'+r.passed);
    check('подпись субботы — раунды 2–3', /2–3/.test(ccYearLabel('Major1_2024_Q1R2', '2024-01-27', '2024-01-27')), ccYearLabel('Major1_2024_Q1R2', '2024-01-27', '2024-01-27'));
    out.steps.push('q1r2: #'+r.place+' of '+r.of);
    force(m24().q[1].r2); careerSave();
    const q3=await playThrough('q1r3'); r=last();
    check('Q1R4 (Европа): комната 250', r.of===250, String(r.of));
    out.steps.push('q1r3: #'+r.place+' of '+r.of);
    const ser=m24().series; const nSer=Object.keys(ser).length;
    check('серия записана на 250 составов', nSer===250, String(nSer));
    check('свои очки серии есть', m24().youKey && ser[m24().youKey]>0, String(m24().youKey));
    check('до полуфинала сетки не строятся', !m24().built);
    // Квалификатор 2 — тоже три вечера.
    goto('2024-02-02');
    await playThrough('q2r1'); force(m24().q[2].r1); careerSave();
    await playThrough('q2r2'); force(m24().q[2].r2); careerSave();
    await playThrough('q2r3'); r=last();
    out.steps.push('q2r3: #'+r.place+' of '+r.of+' · series '+ser[m24().youKey]);
    check('серия за два квалификатора шире 250', Object.keys(m24().series).length>250, String(Object.keys(m24().series).length));
    // Полуфинал: сетки строятся в первый день.
    goto('2024-02-16');
    const canSemi=careerMajorCan(careerMajorOn('2024-02-16'));
    const st=m24();
    out.notes.semi={built:st.built, bracket:st.bracket, rank:ccM24SeriesRank(st, st.youKey), upper:st.upper && st.upper.rows.length, lower:st.lower && st.lower.rows.length};
    check('сетки построены', st.built===true);
    check('верхняя — 50, нижняя — 200', st.upper.rows.length===50 && st.lower.rows.length===200, JSON.stringify(out.notes.semi));
    check('игрок с 96 — в какой-то сетке', !!st.bracket, JSON.stringify(out.notes.semi));
    check('полуфинал открыт', canSemi);
    const s1=await playThrough('semi1'); r=last();
    out.steps.push('semi1 ('+st.bracket+'): '+s1.head+' · #'+r.place+' of '+r.of+' · ticket '+m24().ticket);
    const other=st.bracket==='upper' ? 'lower' : 'upper';
    check('чужая сетка сыграла первый день молча', Array.isArray(m24()[other].r1) && m24()[other].r1.length>0, JSON.stringify(m24()[other].r1 && m24()[other].r1.length));
    if(st.bracket==='upper'){
      check('верхняя, день 1: пять игр, победа — билет', r.games===5, String(r.games));
      check('билеты верхней сетки — не больше пяти', (m24().upper.tickets||[]).length<=5, String((m24().upper.tickets||[]).length));
    } else {
      check('нижняя, день 1: десять игр, топ-100', r.games===10 && r.of===200, r.games+'/'+r.of);
    }
    // Дальше — до билета или до конца третьего дня.
    for(const day of ['2024-02-17','2024-02-18']){
      if(m24().ticket) break;
      goto(day);
      const prev=m24()[m24().bracket][day==='2024-02-17' ? 'r1' : 'r2'];
      force(prev); careerSave(); careerRenderHub('centre');
      if(!careerMajorCan(careerMajorOn(day))){ out.steps.push(day+': closed'); continue; }
      const sx=await playThrough('semi '+day); r=last();
      out.steps.push('semi '+day+': #'+r.place+' of '+r.of+' · ticket '+m24().ticket);
    }
    // Финал: собирается на 50; своё место — по билету (или дописано, чтобы проверить сам финал).
    const st2=m24();
    if(!st2.ticket){ st2.ticket=true; if(st2.upper){ st2.upper.tickets=(st2.upper.tickets||[]).concat(['you']); } out.notes.forcedTicket=true; careerSave(); }
    goto('2024-02-24');
    check('финал открыт по билету', careerMajorCan(careerMajorOn('2024-02-24')));
    const gf=ccM24GfRows(m24());
    out.notes.gf={n:gf && gf.length, you:gf && gf.indexOf('you')>=0, tickets:(m24().upper.tickets||[]).length, u3:(m24().upper.r3||[]).length, l3:(m24().lower.r3||[]).length};
    check('финал — 50 строк, своя среди них', gf && gf.length===50 && gf.indexOf('you')>=0, JSON.stringify(out.notes.gf));
    check('топ-25 верхней и топ-15 нижней досчитаны', (m24().upper.r3||[]).length===25 && (m24().lower.r3||[]).length===15, JSON.stringify(out.notes.gf));
    const pf=await playThrough('final'); r=last();
    out.steps.push('final: '+pf.head+' · #'+r.place+' of '+r.of+' · $'+r.prize);
    check('финал: 12 игр, 50 дуо', r.games===12 && r.of===50, r.games+'/'+r.of);
    check('финал платит таблицей Европы 2024 (№1 $170 000 на дуо → $85 000 своё)', r.place!==1 || r.prize===85000, String(r.prize));
    check('деньги записаны', r.prize===0 || (save().earnings||0)>0);
    const seat=ccGlobalsSeat();
    out.notes.seat=seat;
    check('место в Форт-Уэрт — только топ-2 Европы', (r.place<=2)===!!seat, JSON.stringify(seat)+' place '+r.place);
    check('карточка финала говорит про Форт-Уэрт', /Fort|Форт/.test(ccMajorSeatNote(careerMajorOn('2024-02-24'))), ccMajorSeatNote(careerMajorOn('2024-02-24')));
    // Зал Форт-Уэрта — 50 дуо, настоящие дороги.
    const me=careerCard(), mates=careerMates();
    const you=careerYouTeam([me].concat(mates)); you.isYou=true;
    const field=careerGlobalsField(you, [me].concat(mates), 'major2');
    const routes={}; field.forEach(t=>{ routes[t.gcRoute]=(routes[t.gcRoute]||0)+1; });
    out.notes.gcField={n:field.length, routes, first:field.slice(0,3).map(t=>t.name)};
    check('зал Форт-Уэрта — 50 дуо, свой внутри', field.length===50 && field.indexOf(you)>=0, JSON.stringify(out.notes.gcField));
    check('дороги: 7 с первого, 12 со второго, остальное третий', routes.m1>=6 && routes.m2>=11 && routes.m3>=25, JSON.stringify(routes));
    check('призовые Форт-Уэрта — $400 000 за первое', gcPrize(1)===400000, String(gcPrize(1)));
    // Мир: финал без записи собирается сам.
    const room=ccM24WorldFinalRoom(null, [me].concat(mates), Object.assign({}, CAREER.career, {division:1}));
    check('финал мира без записи — 50 дуо из лестницы', room.length===50, String(room.length));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc2024m-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000 }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs.length) console.log('page errors: ' + out.errs.slice(0, 5).join(' | '));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-2024-major');
