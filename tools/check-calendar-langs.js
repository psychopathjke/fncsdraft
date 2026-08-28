// Календарь открывается на каждом языке, а не только на том, на котором писали.
//
// 26 августа 2026, его скрин: «Calendar not working in italian language»,
// Uncaught TypeError: L(...).calDows.map is not a function. Итальянский и
// португальский держали месяцы и дни недели одной строкой через запятую —
// "Lun,Mar,Mer,..." вместо массива. Ключ на месте, перевод верный,
// tools/i18n-check.js зелёный: он сверял НАЛИЧИЕ ключей, а не их сорт. Код
// зовёт .map — и вкладка падала насмерть, шапка недели не рисовалась вовсе.
//
// Сорт значения теперь стережёт сам i18n-check (правило 5), а это — та же
// проверка с другой стороны: вкладка реально открывается в каждом языке из
// CC_LANGS, шапка недели держит семь РАЗНЫХ подписей, заголовок месяца —
// название, а не первая его буква (индекс по строке даёт ровно её).
//
//   node tools/check-calendar-langs.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BASE = '<base href="file:///' + ROOT + '/">';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Cal', age:16, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:54, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, week:1, division:5, earnings:0, tokens:[], log:[]}, partner:null
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(54, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));

    for (const lang of CC_LANGS) {
      localStorage.setItem('fncsdraft_lang', lang);
      setLang(lang);
      careerLoad();
      careerEntry();
      await wait(120);
      CH_MONTH = null;
      careerTab('calendar');
      await wait(200);

      const dows = [...document.querySelectorAll('#chBody .cal-dow span')].map(x => x.textContent.trim());
      if (dows.length !== 7) fail(lang + ': шапка недели — ' + dows.length + ' подписей вместо семи');
      if (dows.some(d => !d)) fail(lang + ': пустая подпись дня недели');
      if (new Set(dows).size !== 7) fail(lang + ': дни недели повторяются — ' + dows.join(' '));

      const title = ((document.querySelector('#chBody .cal-bar h4') || {}).textContent || '').trim();
      const month = title.split(/\\s+/)[0] || '';
      if (month.length < 3) fail(lang + ': месяц в заголовке — «' + title + '»');

      const days = document.querySelectorAll('#chBody .cal-day').length;
      if (days < 28) fail(lang + ': в месяце ' + days + ' клеток');

      // Соседний месяц — вторая точка, где заголовок читает calMonths.
      careerMonthShift(1);
      await wait(150);
      const next = ((document.querySelector('#chBody .cal-bar h4') || {}).textContent || '').trim();
      if ((next.split(/\\s+/)[0] || '').length < 3) fail(lang + ': следующий месяц — «' + next + '»');

      out.steps.push(lang + ': ' + dows.join(' ') + ' · ' + title + ' → ' + next + ' · ' + days + ' дней');
    }
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callangs-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, BASE + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1440,1400',
  '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 4).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('календарь открывается на всех ' + out.steps.length + ' языках');
fs.rmSync(dir, { recursive: true, force: true });
