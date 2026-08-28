// Каждая таблица Истории — мейджоры и все три ЛАНа.
//
// Его слово, 27 августа: «проверь каждую таблицу, мейджор и ланов, работает ли
// это». Правка про записанную комнату делалась на одном мейджоре; здесь она
// проверяется на всех пяти слотах, которые История вообще открывает:
// Мейджор 1, Мейджор 2, Саммит, Париж (круг Reload) и Мировой чемпионат.
//
// На каждом слоте проверяется одно и то же: таблица — это записанный вечер, до
// последней строки; своя строка одна и стоит на своём месте; очки убывают; зал
// того размера, какой у турнира. Плюс запасной путь для старых сейвов, где
// вечера в журнале нет, а пост в ленте есть.
//
//   node tools/check-career-arc-all-tables.js [папка сборки]
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
  const NICK='AllTbl', MATE='Sbari';
  const seed = (log, news) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:NICK, age:21, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:96, role:'roleIGL',
              attrs:ccRookieAttrs(96,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-10-05', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], news:news||[], log:log}
      , partners:[{handle:MATE, cardRegion:'EU', dev:0, since:'2026-01-12'}]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    CH_ARC_TBL={};
  };
  // Комната вечера: своя строка на нужном месте, остальные — ровным спуском.
  const комната=(n, место, очки)=>{
    const rows=[];
    for(let i=1;i<=n;i++){
      const своя=i===место;
      rows.push({n: своя ? (NICK+' & '+MATE) : ('Team'+i+' & Mate'+i),
                 p: очки+(место-i)*7, w: i%5===0?1:0, e: 60-i%13,
                 r:'EU', you: своя?true:undefined});
    }
    return rows;
  };
  const строка=(o)=>Object.assign({season:1, div:1, passed:true, ovr:96,
    mate:MATE, avg:6, prize:1000}, o);
  const СЛОТЫ=[
    {имя:'Мейджор 1', key:'m|1|EU',   зал:50, место:3,
     row:{day:'2026-05-10', kind:'major', stage:'final', games:12}},
    {имя:'Мейджор 2', key:'m|2|EU',   зал:50, место:1,
     row:{day:'2026-08-02', kind:'major', stage:'final', games:12}},
    {имя:'Саммит',    key:'g|summit', зал:50, место:2,
     row:{day:'2026-05-31', kind:'summit', stage:'final', games:8}},
    {имя:'Париж',     key:'g|rc',     зал:20, место:4,
     row:{day:'2026-07-05', kind:'rc', stage:'final', games:8}},
    {имя:'Глобал',    key:'g|gc',     зал:50, место:7,
     row:{day:'2026-09-26', kind:'globals', stage:'final', games:12}}
  ];
  try {
    СЛОТЫ.forEach(s=>{
      const top=комната(s.зал, s.место, 600);
      const мойРяд=top[s.место-1];
      seed([строка(Object.assign({}, s.row, {place:s.место, of:s.зал,
        pts:мойРяд.p, wins:мойРяд.w, elims:мойРяд.e, top:top}))]);
      const t=careerArchiveFinal(1, s.key);
      if(!t){ check(s.имя+': таблица открывается', false, 'нет таблицы'); return; }
      const было=(t.rows||[]).map(r=>r.name+'|'+r.pts+'|'+r.wins+'|'+r.elims);
      const надо=top.map(r=>r.n+'|'+r.p+'|'+r.w+'|'+r.e);
      let где=-1;
      for(let i=0;i<Math.max(было.length,надо.length);i++)
        if(было[i]!==надо[i]){ где=i+1; break; }
      const своих=(t.rows||[]).filter(r=>r.you).length;
      const моёМесто=((t.rows||[]).find(r=>r.you)||{}).p;
      out.notes[s.имя]={строк:было.length, надоСтрок:надо.length,
                        перваяРазница:где, своихСтрок:своих, моёМесто:моёМесто,
                        первый:(t.rows||[])[0] && t.rows[0].name};
      check(s.имя+': таблица совпадает с вечером до последней строки', где===-1,
            где>0 ? ('строка '+где+': '+было[где-1]+' против '+надо[где-1]) : 'длины разные');
      check(s.имя+': своя строка одна', своих===1, String(своих));
      check(s.имя+': своя строка на своём месте', моёМесто===s.место,
            моёМесто+' вместо '+s.место);
      check(s.имя+': очки убывают',
            (t.rows||[]).every((r,i,a)=>i===0||a[i-1].pts>=r.pts), 'не убывает');
      check(s.имя+': зал того же размера', было.length===s.зал,
            было.length+' из '+s.зал);
    });

    /* Старый сейв, где вечера в журнале нет: верхушка берётся из поста ленты.
       Проверяется на всех тех же слотах — пост пишется для каждого из них. */
    out.notes.старыеСейвы={};
    СЛОТЫ.forEach(s=>{
      const постРядов=[
        {p:1,n:'Alpha & Beta',s:500},{p:2,n:'Gamma & Delta',s:470},
        {p:3,n:NICK+' & '+MATE,s:455},{p:4,n:'Eps & Zeta',s:440},
        {p:5,n:'Eta & Theta',s:430}];
      seed([строка(Object.assign({}, s.row, {place:3, of:s.зал, pts:455,
        wins:1, elims:40}))],
        [{season:1, day:s.row.day, kind:'good', k:'ccNewsCongrats',
          a:['@a @b','x'], id:'n1',
          tbl:{div:1, cap:'x', me:NICK+' & '+MATE, rows:постРядов}}]);
      const t=careerArchiveFinal(1, s.key);
      const шапка=(t.rows||[]).slice(0,5).map(r=>r.name+'|'+r.pts);
      const изПоста=постРядов.map(r=>r.n+'|'+r.s);
      out.notes.старыеСейвы[s.имя]={совпало:шапка.join(';')===изПоста.join(';'),
                                    первые:шапка.slice(0,2)};
      check(s.имя+' (старый сейв): верхушка из поста ленты',
            шапка.join(';')===изПоста.join(';'), шапка.join(' | '));
      check(s.имя+' (старый сейв): таблица убывает',
            (t.rows||[]).every((r,i,a)=>i===0||a[i-1].pts>=r.pts), 'не убывает');
    });

    /* Контроль: без записи И без поста таблица остаётся пересчётом — иначе всё
       выше зелёное просто потому, что таблицы перестали строиться вовсе. */
    seed([строка({day:'2026-05-10', kind:'major', stage:'final', games:12,
                  place:3, of:50, pts:455, wins:1, elims:40})]);
    const g=careerArchiveFinal(1, 'm|1|EU');
    out.notes.контроль={строк:(g.rows||[]).length, первый:(g.rows||[])[0] &&
                        g.rows[0].name};
    check('контроль: без записи и без поста таблица всё равно строится',
          (g.rows||[]).length>=45, String((g.rows||[]).length));
    check('контроль: и своя строка в ней на месте',
          ((g.rows||[]).find(r=>r.you)||{}).p===3,
          JSON.stringify(out.notes.контроль));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alltbl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('каждая таблица Истории — это её вечер');
fs.rmSync(dir, { recursive: true, force: true });
