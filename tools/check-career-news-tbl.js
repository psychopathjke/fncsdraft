// Одна и та же таблица в ленте — один раз за вечер.
//
// Его снимок, 26 августа: два поста подряд, под каждым один и тот же топ-5
// «ДИВИЗИОН 1 · КУБОК». Замер нашёл четыре: вечер Дивизиона 1 пишет три поста
// с местами (третье, второе, первое) и поздравление от сцены, и каждый кладёт
// под себя копию одной и той же пятёрки. В ленте это читается как четыре
// разных турнира за одну ночь.
//
// Правило простое: картинка остаётся у того, кто написал последним, — он же
// оказывается верхним, потому что записи кладутся наверх. Места остаются
// текстом. Таблица сезона под правило не попадает: у неё другие строки.
//
//   node tools/check-career-news-tbl.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  const seed = (day) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:86, role:'roleIGL',
              attrs:ccRookieAttrs(86,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    drafted=[careerCard()]; CARD_MODE=true; squadSize=2;
  };
  try {
    // ---- вечер, который игрок не играл ------------------------------------
    seed('2026-02-13');
    careerAdvanceTo('2026-02-16');
    const news=(CAREER.career.news||[]).map(e=>({day:e.day, k:e.k, tbl:!!e.tbl,
      rows:e.tbl?(e.tbl.rows||[]).map(r=>r.p+':'+r.n+':'+r.s).join(','):null}));
    out.notes.вечер={постов:news.length, сТаблицей:news.filter(e=>e.tbl).length,
                     кто:news.filter(e=>e.tbl).map(e=>e.k)};
    // Разных картинок может быть больше одной (таблица сезона — другая), а вот
    // ОДИНАКОВЫХ быть не должно ни одной.
    const byRows={};
    news.filter(e=>e.tbl).forEach(e=>{ const k=e.day+'|'+e.rows;
      byRows[k]=(byRows[k]||0)+1; });
    const dup=Object.entries(byRows).filter(x=>x[1]>1);
    out.notes.повторы=dup.map(x=>x[1]+'× ' + x[0].slice(0,40));
    check('одна и та же таблица не висит под двумя постами', dup.length===0,
          out.notes.повторы.join(' | '));
    check('но картинка вечера в ленте есть',
          news.some(e=>e.tbl), JSON.stringify(out.notes.вечер));

    // ---- игрок выиграл: таблица под ЕГО постом -----------------------------
    // Его просьба от 17 августа: когда выиграл сам, под постом стоит таблица.
    // Правило про повторы не должно её съесть — свой пост пишется последним и
    // потому остаётся верхним.
    seed('2026-02-14');
    const me=careerCard();
    const team=(n,p)=>({name:n, stagePts:p, squad:[me]});
    const you=team('you', 100); you.isYou=true;
    const ranked=[you, team('Bravo',90), team('Charlie',80),
                  team('Delta',70), team('Echo',60)];
    careerCupPosts(ranked, 1, 0);
    careerCongrats(ranked, you, L().calWeeklyFinal);
    const after=(CAREER.career.news||[]).map(e=>({k:e.k, tbl:!!e.tbl}));
    out.notes.своя={первые:after.slice(0,3), сТаблицей:after.filter(e=>e.tbl).length};
    check('под собственной победой таблица стоит',
          after[0] && after[0].tbl, JSON.stringify(out.notes.своя.первые));
    check('и она в этом вечере одна',
          after.filter(e=>e.tbl).length===1, JSON.stringify(out.notes.своя));

    // ---- контроль: разные таблицы не съедаются ----------------------------
    // Иначе проверка выше зелёная просто потому, что картинки исчезают все.
    seed('2026-02-14');
    const rowsA=[{p:1,n:'Alpha',s:100},{p:2,n:'Bravo',s:90}];
    const rowsB=[{p:1,n:'Zulu',s:80},{p:2,n:'Yankee',s:70}];
    careerNews('flat','ccNewsD1Table',[3],{tbl:{div:1, rows:rowsA, me:'Alpha'}});
    careerNews('flat','ccNewsD1Table',[3],{tbl:{div:1, rows:rowsB, me:'Zulu'}});
    const two=(CAREER.career.news||[]).slice(0,2).map(e=>!!e.tbl);
    out.notes.контроль=two;
    check('контроль: две РАЗНЫЕ таблицы обе остаются',
          two[0]===true && two[1]===true, JSON.stringify(two));
    // И контроль в другую сторону: две одинаковые — остаётся верхняя.
    seed('2026-02-14');
    careerNews('flat','ccNewsD1Table',[3],{tbl:{div:1, rows:rowsA, me:'Alpha'}});
    careerNews('flat','ccNewsD1Table',[3],{tbl:{div:1, rows:rowsA, me:'Alpha'}});
    const same=(CAREER.career.news||[]).slice(0,2).map(e=>!!e.tbl);
    out.notes.контроль2=same;
    check('две одинаковые — картинка у верхней',
          same[0]===true && same[1]===false, JSON.stringify(same));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'newstbl-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('одна ночь — одна картинка таблицы');
fs.rmSync(dir, { recursive: true, force: true });
