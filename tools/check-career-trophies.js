// Плитка трофеев в «Соцсетях» считает то, что карьера действительно выиграла.
//
// Его правка, 27 августа: «пусть в сошиал показывает о EWC сколько выиграл
// финалов или ланов». Место на Esports World Cup даёт выигранный финал капа
// Reload; до сих пор об этом говорила одна строка на карточке дня и пропадала
// вместе с днём.
//
// Здесь стережётся счёт: места на EWC берутся из записи карьеры, титулы — из
// журнала, и ни один чужой вечер в них не попадает. Плюс контроль: пустая
// карьера показывает «пока ни одного», а не пустую плитку.
//
//   node tools/check-career-trophies.js [папка сборки]
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
  const seed = (log, ewc) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Trophy', age:22, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:96, role:'roleIGL',
              attrs:ccRookieAttrs(96,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-10-05', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], news:[], log:log, ewc:ewc||[]},
      partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
  };
  const r=(o)=>Object.assign({season:1, div:1, of:50, passed:true, ovr:96,
    games:8, wins:1, elims:40, avg:6, mate:'Sbari', prize:1000}, o);
  try {
    /* Карьера с полным набором: два ЛАНа, мейджор, финал недели, финал Reload,
       и три вечера, которые титулами НЕ являются — второе место, чужой вид,
       непройденная стадия. */
    seed([
      r({day:'2026-05-31', place:1, kind:'summit',  stage:'final'}),
      r({day:'2026-09-26', place:1, kind:'globals', stage:'final'}),
      r({day:'2026-05-10', place:1, kind:'major',   stage:'final'}),
      r({day:'2026-02-14', place:1, kind:'final'}),
      r({day:'2026-03-08', place:1, kind:'reload',  stage:'final'}),
      r({day:'2026-07-05', place:2, kind:'rc',      stage:'final'}),
      r({day:'2026-06-01', place:1, kind:'major',   stage:'heats'}),
      r({day:'2026-04-04', place:1, kind:'cup'})
    ], [{series:1, place:1, day:'2026-03-08'}, {series:2, place:1, day:'2026-06-06'}]);
    const t=careerTrophies();
    out.notes.счёт=t;
    check('места на EWC читаются из записи карьеры', t.seats===2, String(t.seats));
    check('финал Reload засчитан один', t.relFinals===1, String(t.relFinals));
    check('ЛАНов два: Саммит и Антверпен', t.lans===2,
          t.lans+' (саммит '+t.summit+', париж '+t.paris+', глобал '+t.globals+')');
    check('второе место на ЛАНе титулом не считается', t.paris===0, String(t.paris));
    check('мейджор один, и только его финал', t.majors===1, String(t.majors));
    check('финал недели один', t.weekly===1, String(t.weekly));
    // И плитка рисует ровно эти строки.
    const box=document.createElement('div');
    box.innerHTML=careerTrophiesHTML();
    const rows=[].slice.call(box.querySelectorAll('.ch-row'))
      .map(x=>x.textContent.replace(/\\s+/g,' ').trim());
    out.notes.плитка=rows;
    check('в плитке пять строк — по одной на каждый непустой счёт',
          rows.length===5, JSON.stringify(rows));
    check('строка про EWC в плитке есть',
          rows.some(x=>x.indexOf(L().ccEwcSeat)===0), JSON.stringify(rows));

    /* Контроль: пустая карьера — плитка говорит «пока ни одного», а не пустоту,
       и ни одной строки со счётом в ней нет. */
    seed([]);
    const box2=document.createElement('div');
    box2.innerHTML=careerTrophiesHTML();
    out.notes.пустая={строк:box2.querySelectorAll('.ch-row').length,
                      текст:(box2.querySelector('.ch-empty')||{}).textContent||''};
    check('контроль: пустая карьера показывает пустую подпись',
          box2.querySelectorAll('.ch-row').length===0 &&
          String(out.notes.пустая.текст).length>0,
          JSON.stringify(out.notes.пустая));
    // И контроль в другую сторону: плитка стоит на экране «Соцсети».
    seed([r({day:'2026-05-31', place:1, kind:'summit', stage:'final'})]);
    const html=careerSocialHTML();
    out.notes.наЭкране=html.indexOf(L().ccTroTitle)>=0;
    check('плитка стоит на экране Соцсетей', out.notes.наЭкране===true,
          'не найдена');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trophy-'));
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
console.log('плитка трофеев считает выигранное');
fs.rmSync(dir, { recursive: true, force: true });
