// Откуда в лобби столько японцев.
//
// Его скрин 26 августа: с #29 и ниже поле почти целиком японские флаги. Замер
// по регионам карточек (probe-lan-regions.js) такого не показывал — значит
// смотреть надо по ФЛАГАМ и по хвосту таблицы, а не по региону в карточке.
//
// Строит поля тех событий, что играет карьера, и печатает: сколько всего,
// разбивку по флагам целиком и отдельно по последним двадцати строкам.
//
//   node tools/probe-field-nats.js [регион]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const REG = process.argv[2] || 'EU';
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {rows: [], err: null};
  const REG='${REG}';
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'NatProbe', age:20, source:'rookie', country:REG==='EU'?'de':'au',
              countryPing:15, closeRangeEdge:0, region:REG, ovr:95, role:'roleIGL',
              attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-20', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    const me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const you=()=>{ const y=careerYouTeam([me]); y.isYou=true; y.name='you'; return y; };
    const nats = (field) => {
      const by={};
      field.forEach(t=>(t.squad||[]).forEach(c=>{
        const n=(c && c.nat) || '?';
        by[n]=(by[n]||0)+1;
      }));
      return Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6)
        .map(x=>x[0]+':'+x[1]).join(' ');
    };
    const look = (name, field) => {
      out.rows.push({что:name, команд:field.length,
                     всё:nats(field), хвост:nats(field.slice(-20))});
    };
    look('кубок дивизиона', careerCupField(CAREER.career, [me], ccTeams(50), 'cup', false, 0));
    // Тот же кубок, но собранный МИРОВЫМ пулом: гипотеза про японскую стену.
    look('кубок мировым пулом', ccAsWorld(()=>careerCupField(CAREER.career, [me], ccTeams(50), 'cupW', false, 0)));
    // И кубок в пятом дивизионе — там рейтинги как на его скрине.
    CAREER.career.division=5;
    look('кубок див 5', careerCupField(CAREER.career, [me], ccTeams(50), 'cup5', false, 0));
    look('кубок див 5 мировым пулом', ccAsWorld(()=>careerCupField(CAREER.career, [me], ccTeams(50), 'cup5W', false, 0)));
    CAREER.career.division=1;
    look('саммит upper', careerSummitField('upper', you(), [me]));
    look('саммит final', careerSummitField('final', you(), [me]));
    look('глобалы', careerGlobalsField(you(), [me], 'summit'));
    if(typeof careerMajorField==='function')
      look('мейджор финал', careerMajorField('final', you(), [me]));
    if(typeof ccRcField==='function')
      look('париж финал', ccRcField(CAREER.career, CAREER.career, [me], 'final', 20));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'natprobe-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала, копия: ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log('  карьера ' + REG);
out.rows.forEach(r => {
  console.log('  ' + r.что + ' (' + r.команд + ')');
  console.log('     всё:   ' + r.всё);
  console.log('     хвост: ' + r.хвост);
});
fs.rmSync(dir, { recursive: true, force: true });
