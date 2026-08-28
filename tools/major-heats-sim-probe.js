// Сколько мест финала Мейджора приезжает из СЫГРАННОГО, а не из посева.
//
// Его вопрос, 27 августа: «а могут всегда из симуляции собирать». До правки в
// финал из твоего хита приезжали настоящие пятнадцать, а тридцать пять мест
// добирались из таблицы Плей-Ина по силе — соседние хиты не играл никто.
//
// check-career-major-final этого не мерит: он подкладывает запись фикстурой, а
// не играет хиты. Здесь хиты играются по-настоящему (runCareerMajor), и
// печатается длина записи и время вечера.
//
//   node tools/major-heats-sim-probe.js [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={errs:null, fail:null, notes:{}};
  try{
    // Окна за игрока: метка и выборы внутри игры.
    setInterval(function(){
      const am=document.getElementById('ccAskModal');
      if(am && am.style.display==='flex'){
        const no=document.getElementById('ccAskNo');
        if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; }
      }
      document.querySelectorAll('.cc-choice-btn').forEach(b=>b.click());
    }, 25);

    const days=careerYearDays();
    let heatsDay=null, n=0;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO && !heatsDay; d=ccAddDays(d,1)){
      const e=(days.get(d)||[]).find(x=>x.kind==='major' && /Heats$/.test(String(x.id||'')));
      if(e){ heatsDay=d; n=+String(e.id).match(/^Major(\\d)/)[1]; }
    }
    if(!heatsDay) { out.fail='в календаре нет дня хитов Мейджора'; throw 0; }
    out.notes.день=heatsDay; out.notes.мейджор=n;

    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Heats', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
        attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:heatsDay, division:1, earnings:0, balance:5000,
              reach:9000, tokens:[], log:[], news:[],
              major:{n:n, got:'playin', pass:'playin', ticket:false}},
      partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]}));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career;

    // Таблица Плей-Ина, по которой сеются хиты: тем же кодом, что её пишет вечер.
    const me=careerCard();
    const st=ccScaleStage(CC_MAJOR_STAGE.playin);
    const you=careerYouTeam([me].concat(careerMates().filter(Boolean)));
    you.isYou=true;
    const pool=[you, ...careerCupField(Object.assign({}, cr, {division:1}),
                                       [me], st.cut, null, false, CC_FIELD_SHARP.heats)];
    cr.majorSeed={n:n, season:cr.season, size:careerSquadSize(),
                  rows:pool.slice(0, st.cut).map(t=>t.isYou ? 'you' : ccMajorSeatRow(t))};
    careerSave();

    out.notes.хитов=ccMajorHeats();
    out.notes.отсечкаХита=ccScaleStage(CC_MAJOR_STAGE.heats).cut;
    out.notes.полеФинала=ccScaleStage(CC_MAJOR_STAGE.final).field;

    const t0=performance.now();
    await runCareerMajor();
    out.notes.вечерМс=Math.round(performance.now()-t0);

    out.notes.записьПослеСвоегоДня=
      ((CAREER.career.majorSeed && CAREER.career.majorSeed.through)||[]).length;
    out.notes.мойХит=ccMajorMyHeat(careerMajorOn(heatsDay));

    /* Соседние хиты идут в свои дни — значит блок надо пройти. Дни двигаются
       тем же careerAdvanceTo, каким их двигает игрок, и время каждого дня
       меряется отдельно: цель была в том, чтобы ни один вечер не подорожал. */
    /* Доходим не до конца хитов, а до дня ФИНАЛА: между ними стоит Ласт Ченс,
       и его мир играет там же, когда у игрока билет уже есть. */
    let finalDay=null;
    for(let d=heatsDay; d<=CC_YEAR_TO && !finalDay; d=ccAddDays(d,1)){
      const e=(days.get(d)||[]).find(x=>x.kind==='major' && /Final$/.test(String(x.id||'')));
      if(e) finalDay=d;
    }
    const row=[heatsDay, finalDay ? ccAddDays(finalDay,-1) : heatsDay];
    out.notes.деньФинала=finalDay;
    out.notes.дниБлока=[];
    for(let d=heatsDay; d<=row[1]; d=ccAddDays(d,1)){
      const t=performance.now();
      careerAdvanceTo(ccAddDays(d,1));
      out.notes.дниБлока.push({день:d, мс:Math.round(performance.now()-t),
        записьПосле:((CAREER.career.majorSeed&&CAREER.career.majorSeed.through)||[]).length});
    }
    /* Одна ли модель у моего хита и у чужих.

       Код предупреждает прямо: «every stage of a run uses one model — a
       standings table assembled from two would drift». Прошедшие соседних хитов
       играют финал против моих, значит планка прохода обязана быть одной.
       Меряется тем, чем она и определяется: идёт ли комната через движок карты
       и сколько очков набирает проходящий. */
    const rows2=ccMajorSeedRows(careerMajorOn(heatsDay));
    const stub={name:'—', pow:0, squad:[], _stub:true};
    const seeded2=rows2.map(r=>r==='you' ? stub : ccMajorTeamFrom(r));
    const heats2=seedHeats(seeded2, ccMajorHeats());
    const probeRoom=(heats2[1]||[]).filter(t=>!t._stub).slice(0, 50);
    out.notes.чужойХитЧерезКарту=useZoneSim(probeRoom);
    const hh=ccMajorHeat(n, 2);
    const stw=Object.assign({}, ccScaleStage(CC_MAJOR_STAGE.heats),
                            {games:hh.games, cut:ccTeams(hh.cut)});
    const t2=performance.now();
    (winIsATicket() ? simulateGamesStopOnWin : simulateGames)(
      probeRoom, stw.games, stw.pts, stw.kill);
    out.notes.чужойХитМс=Math.round(performance.now()-t2);
    const rk=probeRoom.slice().sort(heatsRank);
    out.notes.очкиОтсечкиЧужого=Math.round((rk[stw.cut-1]||{}).stagePts||0);
    out.notes.очкиОтсечкиМоего=out.notes.мойОтсечка||null;

    const thr=(CAREER.career.majorSeed && CAREER.career.majorSeed.through) || [];
    out.notes.записьПрошедших=thr.length;
    out.notes.ожидалось=ccMajorHeats()*ccScaleStage(CC_MAJOR_STAGE.heats).cut;
    out.notes.доляФиналаИзСыгранного=
      Math.round(Math.min(thr.length, out.notes.полеФинала)/out.notes.полеФинала*100)+'%';
  }catch(e){ if(!out.fail) out.fail=String(e&&e.stack||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'majheats-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--window-size=1440,1400',
  '--virtual-time-budget=900000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
console.log(JSON.stringify(out.notes, null, 1));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
