// Хиты сеются финишем Плей-Ина, змейкой 1-2-3-3-2-1.
//
// Его просьба, 25 августа: «хочу только посев как у эпик». Змейка стояла и
// раньше, но раскладывала она СИЛУ: комната хитов строилась заново и
// сортировалась по мощности состава. У Epic змейку раскладывает таблица
// Плей-Ина — первый номер в первый хит, второй во второй, третий и четвёртый
// в третий.
//
// Здесь это проверяется насквозь: карьера играет Плей-Ин, запись остаётся
// (cr.majorSeed, в порядке финиша), Хиты садятся по ней, и номер хита на
// карточке — тот, который даёт змейка для места, занятого в Плей-Ине.
//
//   node tools/check-career-heat-seeding.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // Харнесс — это игрок: он отвечает на окно про метку и на вопрос о высадке.
  setInterval(function(){
    const am=document.getElementById("ccAskModal");
    if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo");
      if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } }
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out={notes:{}, fails:[], errs:null, fail:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const die=m=>{ out.fail=m; throw new Error(m); };
  const ccProbeSeat=()=>{ if(careerPartnerCard()) return;
    const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
    if(s){ careerDmAccept(s.id); careerRenderHub('centre'); } };
  const seed=(day)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Seedman', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[]}, partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry(); ccProbeSeat();
  };
  const playThrough=async(what)=>{
    const play=document.querySelector('#screen-career-hub .ch-play');
    if(!play) die(what+': no button at all');
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn');
      if(b && !b.disabled) b.click(); }, 20);
    play.click();
    let card=null;
    for(let i=0;i<16000 && !card;i++){
      await wait(25);
      card=[...document.querySelectorAll('#majorStages .stage-card')]
        .find(c=>c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if(!card) die(what+': no result card came back');
    // Заголовки всех карточек этапа: имя комнаты пишет своя, а кнопка «назад»
    // живёт на итоговой.
    const head=[...document.querySelectorAll('#majorStages .stage-card h4')]
      .map(h=>h.textContent.replace(/\\s+/g,' ').trim()).join(' | ');
    // Строки турнирной таблицы: первая клетка — «#место».
    const names=[...document.querySelectorAll('#majorStages .stage-card table.lobby-table tbody tr')]
      .filter(tr=>/^#/.test((tr.children[0]||{}).textContent||''))
      .map(tr=>(tr.children[1]||{}).textContent||'').filter(Boolean);
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    return {head:head, names:names};
  };
  const dayOf=(n, want)=>{ for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1)){
      const ev=careerMajorOn(d); if(ev && ev.n===n && ev.stage===want) return d; } return null; };
  // Змейка, посчитанная отдельно от кода, который проверяется.
  const heatOf=(i, n)=>{ const lap=Math.floor(i/n), pos=i%n; return (lap%2 ? n-1-pos : pos)+1; };

  try{
    const pi=dayOf(2,'playin'), he=dayOf(2,'heats');
    out.notes.days={playin:pi, heats:he};
    seed(pi);
    const r1=await playThrough('play-in');
    out.notes.playin=r1.head;
    const cr=CAREER.career;
    const s=cr.majorSeed;
    out.notes.seed=s ? {n:s.n, season:s.season, size:s.size, rows:s.rows.length,
                        you:s.rows.indexOf('you')+1} : null;
    if(!s) die('Плей-Ин ничего не оставил после себя');
    const st=ccScaleStage(CC_MAJOR_STAGE.playin);
    check('записаны все, кто прошёл', s.rows.length===st.cut,
          s.rows.length+' против отсечки '+st.cut);
    const place=(cr.log||[]).filter(e=>e.kind==='major' && e.stage==='playin').pop().place;
    out.notes.place=place;
    check('и своя строка стоит на своём месте', s.rows.indexOf('you')+1===place,
          'место '+place+', строка '+(s.rows.indexOf('you')+1));

    // ---- и Хиты сеются по этой таблице -----------------------------------
    careerAdvanceTo(he);
    careerRenderHub('centre');
    const r2=await playThrough('heats');
    out.notes.heats=r2.head;
    const want=heatOf(place-1, ccMajorHeats());
    out.notes.wantHeat=want;
    check('номер хита — тот, который даёт змейка для места в Плей-Ине',
          r2.head.indexOf(L().ccHeatOf(want, ccMajorHeats()))>=0,
          r2.head+' — ждали «'+L().ccHeatOf(want, ccMajorHeats())+'»');
    // Комната — только те, кто в этой таблице записан.
    const seeded=new Set(s.rows.map((row,i)=>i).filter(i=>heatOf(i, ccMajorHeats())===want)
      .map(i=>s.rows[i]).filter(r=>r!=='you')
      .map(row=>row.map(c=>String(typeof c==='string'?c:c.h).toLowerCase()).sort().join('+')));
    const shown=r2.names.map(n=>n.replace(/^[^:]*:\\s*/,'')
      .split(/\\s*&\\s*/).map(x=>x.trim().toLowerCase()).sort().join('+'))
      .filter(n=>n && seeded.size);
    // Своя строка отдельной записью не посеяна — она и есть 'you' в таблице.
    const meKey=[CAREER.player.nick].concat(careerMates().filter(Boolean).map(c=>c.handle))
      .map(x=>String(x).toLowerCase()).sort().join('+');
    const alien=shown.filter(n=>!seeded.has(n) && n!==meKey);
    out.notes.room={rows:shown.length, seededInHeat:seeded.size, alien:alien.length,
                    example:alien.slice(0,3)};
    check('и в комнате нет никого, кто в этот хит не посеян',
          shown.length>5 && !alien.length, alien.length+' чужих из '+shown.length);

    // ---- старый сейв без записи всё равно играет --------------------------
    delete CAREER.career.majorSeed;
    CAREER.career.major={n:2, got:'playin', pass:'playin', ticket:false};
    careerSave(); careerAdvanceTo(he); careerRenderHub('centre');
    const r3=await playThrough('heats without a table');
    out.notes.fallback=r3.head;
    check('сейв без таблицы Плей-Ина сеет хиты по силе и не падает',
          r3.head.indexOf(L().brk_heat)>=0 || r3.head.indexOf('Heat')>=0, r3.head);
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  out.errs=(window.__errs||[]).slice(0, 5);
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccseed-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.errs && out.errs.length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error(out.fail); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('хиты сеются финишем Плей-Ина');
fs.rmSync(dir, { recursive: true, force: true });
