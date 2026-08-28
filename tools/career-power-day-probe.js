// Вечер без света — с кнопкой «Следующий день», и невзгоды в случайный день.
//
// Скрин 23 августа: «когда свет вырубают нету кнопки следующий день» —
// ccMisfortune('power') закрывал день до любого выбора, did пуст,
// spent=false, и панель рисовала подсказку «Выбери, на что уходит день»
// вместо кнопки. Подсказка теперь только у открытого дня.
//
// И его слово того же дня (после скрина tr4vassos «at every save, at the
// same day everytime»): «может в случайно день эти события пусть
// происходят» — бросок дня больше не сеется от даты, он кидается
// Math.random-ом в момент наступления дня и пишется в cr.luck (ccDayRoll):
//   * тот же день, спрошенный повторно, отвечает тем же (анти-релоад);
//   * бросок лежит в localStorage — перезагрузка его не переигрывает;
//   * два прохода по одним датам дают разные календари бед.
//
//   node tools/career-power-day-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbePower', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;

    // --- Панель дня без света: кнопка, не подсказка --------------------------
    // День с бедой ставится рукой: панель проверяется отдельно от броска.
    const POWER='2026-07-12', PLAIN='2026-01-06';
    cr.day=POWER; cr.luck={day:POWER, woe:'power', ev:null};
    const htmlP=careerDayPanelHTML(null);
    out.power={closed:careerDayClosed(),
               nextBtn:htmlP.indexOf('careerNextDay')>=0,
               hint:htmlP.indexOf('cc-day-hint')>=0};

    cr.day=PLAIN; cr.luck={day:PLAIN, woe:null, ev:null};
    const htmlF=careerDayPanelHTML(null);
    out.plain={closed:careerDayClosed(),
               nextBtn:htmlF.indexOf('careerNextDay')>=0,
               hint:htmlF.indexOf('cc-day-hint')>=0};

    // --- Бросок дня: один на день, в сейве, и не по расписанию ---------------
    // Тот же день дважды — тот же ответ, и он же после «перезагрузки».
    delete cr.luck;
    const woe1=ccMisfortune(POWER), woe2=ccMisfortune(POWER);
    const saved=JSON.parse(localStorage.getItem('fncsdraft_career')||'{}');
    out.roll={same:woe1===woe2,
              saved:!!(saved.career && saved.career.luck && saved.career.luck.day===POWER),
              ev:ccDayEventOn(POWER)===null || cr.luck.ev!==null};

    // Два прохода по одним и тем же датам — разные календари бед.
    // 2000 дней: ноль бед за проход — вероятность ~3e-11, совпадение двух
    // проходов день в день — того же порядка.
    const sweep=()=>{ const l=[];
      for(let i=0;i<2000;i++){ const iso=ccAddDays('2026-01-05', i);
        const w=ccMisfortune(iso); if(w) l.push(iso+':'+w); } return l; };
    const a=sweep(), b=sweep();
    out.sweeps={a:a.length, b:b.length,
                differ:JSON.stringify(a)!==JSON.stringify(b)};
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpower-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
const ok = !out.fail && (out.errs||[]).length===0 &&
  out.power.closed===true && out.power.nextBtn===true && out.power.hint===false &&
  out.plain.closed===false && out.plain.nextBtn===false && out.plain.hint===true &&
  out.roll.same===true && out.roll.saved===true &&
  out.sweeps.a>0 && out.sweeps.b>0 && out.sweeps.differ===true;
console.log(ok ? 'OK' : 'FAIL');
process.exit(ok ? 0 : 1);
