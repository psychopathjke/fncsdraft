// История не спорит сама с собой.
//
// Его слова, 26 августа: «в истории не сходятся ФНКС и Саммиты». Саммит и
// Глобал берут чемпиона из выдуманной верхушки сцены (scene[reg].champs), а
// строка мейджора того же региона умеет говорить другое — когда мейджор взял
// сам игрок, она называет его. Две строки одной Истории про одного и того же
// чемпиона Европы называли двух разных людей.
//
// Здесь стережётся тройное согласие: строка ЛАНа = строка мейджора того же
// региона = первая строка таблицы, которая под ней открывается. И отдельно —
// что чемпионом ЛАНа не объявляют игрока, у которого за этот вечер в журнале
// записано не первое место.
//
//   node tools/check-career-archive-agree.js [папка сборки]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (log) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'ArcAgree', age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:96, role:'roleIGL',
              attrs:ccRookieAttrs(96,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-09-30', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], news:[], log:log},
      partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    /* Кэш таблиц ключуется ДЛИНОЙ журнала, а не его содержимым: в проверке
       два разных вечера одной длины иначе отдали бы одну и ту же таблицу. */
    CH_ARC_TBL={};
  };
  const row=(o)=>Object.assign({season:1, div:1, of:50, passed:true, ovr:96,
    games:8, wins:1, elims:40, avg:6, mate:'Sbari', prize:1000}, o);
  const agree=(a)=>{
    // Строка ЛАНа обязана совпасть со строкой мейджора того же региона.
    const майор=(n,reg)=>{ const r=a.regional.find(x=>x.n===n);
      return r ? (r.perReg[reg]||{}) : {}; };
    const s=a.global.find(g=>g.slot==='summit');
    const g=a.global.find(g=>g.slot==='gc');
    const last=a.regional[a.regional.length-1];
    return {
      саммит:{имя:s.win.name, регион:s.win.reg,
              мейджорТогоЖеРегиона:майор(1, s.win.reg).name},
      глобал:{имя:g.win.name, регион:g.win.reg,
              мейджорТогоЖеРегиона:майор(last.n, g.win.reg).name}
    };
  };
  try {
    // ---- игрок выиграл свой Мейджор 1, а Саммит НЕ выиграл ----------------
    seed([row({day:'2026-05-10', place:1, pts:420, kind:'major', stage:'final'}),
          row({day:'2026-05-31', place:3, pts:380, kind:'summit', stage:'final'})]);
    const a=careerArchiveSeason(1);
    const v=agree(a);
    out.notes.выигралМейджор=v;
    check('строка Саммита совпадает со строкой мейджора его региона',
          v.саммит.имя===v.саммит.мейджорТогоЖеРегиона,
          v.саммит.имя+' против '+v.саммит.мейджорТогоЖеРегиона);
    check('строка Глобала совпадает со строкой последнего мейджора его региона',
          v.глобал.имя===v.глобал.мейджорТогоЖеРегиона,
          v.глобал.имя+' против '+v.глобал.мейджорТогоЖеРегиона);
    const s=a.global.find(x=>x.slot==='summit');
    check('чемпионом Саммита не объявлен тот, у кого в журнале третье место',
          !s.win.you && String(s.win.name).indexOf('ArcAgree')<0, s.win.name);
    // И таблица под строкой называет того же чемпиона.
    const t=careerArchiveFinal(1, 'g|summit');
    out.notes.таблицаСаммита={первый:t.rows[0].name, строк:t.rows.length};
    check('таблица Саммита открывается тем же чемпионом',
          t.rows[0].name===s.win.name, t.rows[0].name+' против '+s.win.name);
    const tm=careerArchiveFinal(1, 'm|1|'+a.home);
    check('и таблица своего мейджора — тоже своей строкой',
          tm.rows[0].name===(a.regional[0].perReg[a.home]||{}).name,
          tm.rows[0].name);
    // Два ЛАНа одного сезона не выигрывает одна и та же пара.
    const rc=a.global.find(x=>x.slot==='rc');
    out.notes.двеЛАНы={саммит:s.win.name, париж:rc.win.name};
    check('Саммит и Париж выигрывают разные пары',
          s.win.name!==rc.win.name, s.win.name);

    /* ---- турнир, который игрок отыграл, называет своего чемпиона --------
       Его снимки, 26 августа: карьера финишировала 25-й на Мировом чемпионате
       и смотрела, как его выигрывают SwizzY & Pixie, — а История называла
       чемпионом другую пару и открывалась таблицей, где той пары нет. */
    const eu=ccSceneRoster('EU');
    const champ=[eu[0], eu[1]];
    const asRow=cs=>cs.map(c=>({h:c.handle, r:c.region, n:c.nat||null,
      o:Math.round((attrsFor(c)||{}).ovr||90), k:(attrsFor(c)||{}).roleKey||null}));
    seed([row({day:'2026-09-26', place:25, of:50, pts:239, passed:false,
               games:12, wins:1, elims:24, kind:'globals', stage:'final',
               won:asRow(champ)})]);
    const d=careerArchiveSeason(1);
    const dg=d.global.find(x=>x.slot==='gc');
    const dt=careerArchiveFinal(1, 'g|gc');
    const имя=champ.map(c=>c.handle).join(' & ');
    out.notes.виденныйЧемпион={видел:имя, строка:dg.win.name,
                               таблица:dt?dt.rows[0].name:null,
                               моёМесто:dt?(dt.rows.find(r=>r.you)||{}).p:null};
    check('строка Глобала называет того, кого игрок видел',
          dg.win.name===имя, dg.win.name+' против '+имя);
    check('и таблица под ней открывается им же',
          dt && dt.rows[0].name===имя, dt?dt.rows[0].name:'нет таблицы');
    check('своё место в таблице стоит там, где записано в журнале',
          dt && (dt.rows.find(r=>r.you)||{}).p===25,
          JSON.stringify(out.notes.виденныйЧемпион));
    // Контроль: без записи (старый сейв) чемпион по-прежнему вычисляется.
    seed([row({day:'2026-09-26', place:25, of:50, pts:239, passed:false,
               games:12, wins:1, elims:24, kind:'globals', stage:'final'})]);
    const e=careerArchiveSeason(1).global.find(x=>x.slot==='gc');
    out.notes.безЗаписи={имя:e.win.name};
    check('контроль: старый сейв без записи всё равно называет чемпиона',
          !!e.win.name && e.win.name!==имя, e.win.name);

    /* ---- верхушка таблицы совпадает с сыгранным вечером -----------------
       Его снимки, 26 августа: пост ленты про финал Мейджора 1 называет топ-5 с
       очками 667 / 566 / 539 / 531 / 517, а таблица того же турнира в Истории
       открывалась на 529 / 524 / 478 / 476 / 472 и с другими командами на
       местах со второго по пятое. */
/* Пишется ВСЯ комната, а не верхушка: его снимок 27 августа — топ-5 сошёлся,
       а с шестой строки таблицы разъехались. Здесь комната из пятидесяти. */
    const пятёрка=[
      {n:'Malibuca & vic0', p:667, w:2, e:52, r:'EU'},
      {n:'Momsy & SkyJump', p:566, w:1, e:44, r:'EU'},
      {n:'ArcAgree & Sbari', p:539, w:1, e:40, r:'EU', you:true},
      {n:'Scaryy & Syaaz',  p:531, w:0, e:38, r:'EU'},
      {n:'Darm & demus',    p:517, w:1, e:36, r:'EU'}
    ];
    for(let i=6;i<=50;i++) пятёрка.push({n:'Room'+i+' & Mate'+i, p:520-i*4,
      w:i%3===0?1:0, e:40-Math.floor(i/3), r:'EU'});
    seed([row({day:'2026-05-10', place:3, pts:539, kind:'major', stage:'final',
               games:12, wins:1, elims:40,
               won:[{h:'Malibuca', r:'EU'},{h:'vic0', r:'EU'}], top:пятёрка})]);
    const f=careerArchiveSeason(1);
    const ft=careerArchiveFinal(1, 'm|1|'+f.home);
    const head=(ft.rows||[]).map(r=>r.name+':'+r.pts+':'+r.wins+':'+r.elims);
    const надо=пятёрка.map(r=>r.n+':'+r.p+':'+(r.w||0)+':'+(r.e||0));
    out.notes.верхушка={таблица:head, вечер:надо,
                        строк:(ft.rows||[]).length,
                        своихСтрок:(ft.rows||[]).filter(r=>r.you).length};
    check('вся таблица — это сыгранный вечер, а не пересчёт',
          head.join('|')===надо.join('|'), head.join(' | '));
    check('своя строка в ней одна и стоит на своём месте',
          (ft.rows||[]).filter(r=>r.you).length===1 &&
          (ft.rows.find(r=>r.you)||{}).p===3,
          JSON.stringify(out.notes.верхушка));
    check('и таблица по-прежнему убывает сверху вниз',
          (ft.rows||[]).every((r,i,arr)=>i===0||arr[i-1].pts>=r.pts), 'не убывает');
    check('зал остался полным', (ft.rows||[]).length>=45,
          String((ft.rows||[]).length));
    /* И сам ПИСАТЕЛЬ кладёт всю комнату, а не верхушку: читатель одинаков в
       обеих сборках, поэтому writer стережётся отдельно. Его снимок 27 августа:
       топ-5 сошёлся, шестая строка разъехалась — ровно эта граница. */
    const комната=[]; for(let i=0;i<50;i++) комната.push(
      {name:'T'+i+' & M'+i, stagePts:500-i, wins:i%4?0:1, stageElims:40-i%7,
       squad:[{handle:'T'+i, region:'EU'},{handle:'M'+i, region:'EU'}]});
    const записано=ccStageTop(комната, комната[3]);
    out.notes.писатель={строк:записано.length, своя:(записано[3]||{}).you===true};
    check('вечер записывает всю комнату, а не пять строк',
          записано.length===комната.length, String(записано.length));
    check('и своя строка в записи помечена', (записано[3]||{}).you===true,
          JSON.stringify(out.notes.писатель));

    // Контроль: без записи вечера таблица — реконструкция, и она ДРУГАЯ.
    seed([row({day:'2026-05-10', place:3, pts:539, kind:'major', stage:'final',
               games:12, wins:1, elims:40})]);
    const g=careerArchiveFinal(1, 'm|1|'+careerArchiveSeason(1).home);
    const ghead=(g.rows||[]).slice(0,5).map(r=>r.name+':'+r.pts);
    out.notes.безВерхушки={первые:ghead.slice(0,3)};
    check('контроль: без записи вечера верхушка отличается',
          ghead.join('|')!==надо.join('|'), ghead.join(' | '));

    /* ---- старый сейв: вечера в журнале нет, но лента его помнит --------
       Его снимок, 27 августа: пост «Топ 2 на Саммит в Дюссельдорфе» называет
       Acorn & Boltz с 390 очками, а таблица того же Саммита открывалась на 411
       и с другими командами на местах 3-5. Карьера сыграна до того, как вечер
       начал записывать комнату; пост поздравления при этом в сейве лежит. */
    const постРядов=[{p:1,n:'Acorn & Boltz',s:390},{p:2,n:'ArcAgree & Sbari',s:365},
      {p:3,n:'Curve & Veno',s:323},{p:4,n:'Clix & Higgs',s:309},
      {p:5,n:'Peterbot & Pollo',s:308}];
    const старый=(сПостом)=>{
      seed([row({day:'2026-05-31', place:2, pts:365, passed:false, games:8,
                 kind:'summit', stage:'final'})]);
      if(сПостом) CAREER.career.news=[{season:1, day:'2026-05-31', kind:'good',
        k:'ccNewsCongrats', a:['@a @b','Саммит'], id:'n1',
        tbl:{div:1, cap:'Саммит', me:'ArcAgree & Sbari', rows:постРядов}}];
      CH_ARC_TBL={};
      return careerArchiveFinal(1, 'g|summit');
    };
    const st=старый(true);
    const шапка=(st.rows||[]).slice(0,5).map(r=>r.name+'|'+r.pts);
    const изПоста=постРядов.map(r=>r.n+'|'+r.s);
    out.notes.старыйСейв={таблица:шапка, пост:изПоста,
                          своихСтрок:(st.rows||[]).filter(r=>r.you).length,
                          строк:(st.rows||[]).length};
    check('старый сейв: верхушка берётся из поста ленты',
          шапка.join(';')===изПоста.join(';'), шапка.join(' | '));
    check('старый сейв: своя строка одна', (st.rows||[]).filter(r=>r.you).length===1,
          String((st.rows||[]).filter(r=>r.you).length));
    check('старый сейв: таблица убывает',
          (st.rows||[]).every((r,i,a2)=>i===0||a2[i-1].pts>=r.pts), 'не убывает');
    // Контроль: нет ни записи, ни поста — снова реконструкция, и она другая.
    const st2=старый(false);
    const шапка2=(st2.rows||[]).slice(0,5).map(r=>r.name+'|'+r.pts);
    out.notes.безПоста={первые:шапка2.slice(0,3)};
    check('контроль: без поста таблица — реконструкция',
          шапка2.join(';')!==изПоста.join(';'), шапка2.join(' | '));

    // ---- контроль: игрок мейджор НЕ выигрывал ----------------------------
    // Строки обязаны сойтись и здесь, иначе проверка ловит только свой случай.
    seed([row({day:'2026-05-10', place:7, pts:300, kind:'major', stage:'final'})]);
    const b=careerArchiveSeason(1);
    const w=agree(b);
    out.notes.безТитула=w;
    check('контроль: без своего титула строки сходятся тоже',
          w.саммит.имя===w.саммит.мейджорТогоЖеРегиона &&
          w.глобал.имя===w.глобал.мейджорТогоЖеРегиона,
          JSON.stringify(w));
    // ---- контроль: выиграл сам ЛАН — строка его -------------------------
    seed([row({day:'2026-05-31', place:1, pts:500, kind:'summit', stage:'final'})]);
    const c=careerArchiveSeason(1);
    const cs=c.global.find(x=>x.slot==='summit');
    out.notes.выигралЛАН={имя:cs.win.name, ты:!!cs.win.you};
    check('контроль: выигранный ЛАН записан на игрока', !!cs.win.you,
          JSON.stringify(out.notes.выигралЛАН));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcagree-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('История называет одного чемпиона одним именем');
fs.rmSync(dir, { recursive: true, force: true });
