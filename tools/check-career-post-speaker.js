// Слова игроков не пишет аккаунт сцены.
//
// Его слово, 27 августа, скриншотом: пост «@jut: я больше не в дуо с @lr8.
// LFD 🙏» стоял под именем Fortnite Competitive — «это не должны фортнайт
// писать, игроки только». Строка написана от первого лица и начиналась с
// собственного ника, потому что автором была сцена.
//
// Теперь у таких строк автор — тот, чьё имя стоит первым аргументом, а ник из
// текста убран. Здесь стережётся и то и другое: автор — человек, а не сцена, и
// строка не начинается с «@ник:». Плюс контроль: пресса по-прежнему пишет своё.
//
//   node tools/check-career-post-speaker.js [папка сборки]
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
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Speaker', age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-20', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    // Слова людей сцены: расставание, поздравление, три строки про бан.
    const строки=[
      ['ccPostDuoSplitBy', ['jut','lr8','LFD']],
      ['ccPostDuoSplitByt', ['jut','lr8','LFT']],
      ['ccPostBdayPro', ['Scroll','Sky']],
      ['ccPostBanSad1', ['Scroll','Sky']],
      ['ccPostBanSad2', ['Scroll','Sky']],
      ['ccPostBanSad3', ['Scroll','Sky']]
    ];
    out.notes.строки={};
    строки.forEach(([k,a])=>{
      careerNews('flat', k, a);
      const e=CAREER.career.news[0];
      const who=ccPostAuthor(e);
      const текст=ccText(e);
      out.notes.строки[k]={автор:who.name, пресса:!!who.verified,
                           начало:String(текст).slice(0,18)};
      check(k+': пишет человек, а не сцена',
            !who.verified && String(who.name).toLowerCase()===String(a[0]).toLowerCase(),
            who.name);
      check(k+': ник говорящего убран из текста',
            String(текст).indexOf('@'+a[0])!==0 &&
            String(текст).toLowerCase().indexOf(String(a[0]).toLowerCase()+':')!==0,
            String(текст).slice(0,30));
    });
    /* Контроль: то, что действительно пишет сцена, ею и остаётся. Иначе
       проверка зелёная просто оттого, что пресса замолчала совсем. */
    careerNews('good', 'ccNewsWinner', ['Scroll & Sky']);
    const w=ccPostAuthor(CAREER.career.news[0]);
    out.notes.пресса={автор:w.name, галочка:!!w.verified};
    check('контроль: титул по-прежнему объявляет сцена', !!w.verified,
          JSON.stringify(out.notes.пресса));
    // И собственная строка игрока — по-прежнему его.
    careerNews('flat', 'ccNewsLfd', [1, 90]);
    const y=ccPostAuthor(CAREER.career.news[0]);
    out.notes.своя={автор:y.name, ты:!!y.you};
    check('контроль: своя строка остаётся своей', !!y.you, JSON.stringify(out.notes.своя));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speaker-'));
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
console.log('слова игроков подписаны игроками');
fs.rmSync(dir, { recursive: true, force: true });
