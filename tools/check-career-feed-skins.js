// СКИНЫ В ЛЕНТЕ УБИЙСТВ (его слово 20.10). Своя команда — надетый образ, остальные — постоянный образ из тех, что к
// началу сезона карьеры уже выходили в магазине Fortnite. Проверяется функция window.CC_FN_SKIN и сама строка ленты.
//   node tools/check-career-feed-skins.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d ? ': '+d : '')); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const seed=(day)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0, reach:100, tokens:[], log:[]}, partner:null})); careerLoad(); };
  try{
    seed('2026-03-01');
    window.CC_FN_SKIN('Pixie & SwizzY', false);          // первый вызов грузит магазин
    for(let i=0;i<200 && typeof CC_FN_SHOP==='undefined';i++) await wait(50);
    check('магазин подгрузился', typeof CC_FN_SHOP!=='undefined');
    const a=window.CC_FN_SKIN('Pixie & SwizzY', false), b=window.CC_FN_SKIN('Pixie & SwizzY', false), c=window.CC_FN_SKIN('Sky & Scroll', false);
    out.notes.a=a; out.notes.c=c;
    check('у команды есть образ', /fortnite-api\\.com\\/images\\/cosmetics\\/br\\/cid_|fortnite-api\\.com\\/images\\/cosmetics\\/br\\/character_/i.test(String(a)), a);
    check('один и тот же у одной команды', a===b);
    check('у разных команд обычно разные', a!==c, a+' / '+c);
    const n26=CC_FN_SKIN_POOL.ids.length;
    const n19=CC_FN_SKIN_FIRST.filter(e=>e[1]<=ccDaysBetween(CC_FN_SHOP.first, '2019-06-01')).length;   // пул сезона 2019-го (ccYearFrom года карьеры)
    out.notes.pool={y2019:n19, y2026:n26};
    check('в 2019-м выбор беднее — только вышедшие к сезону', n19>0 && n19<n26, n19+' / '+n26);
    seed('2026-03-01');
    CAREER.fnOwn={CID_A_400_Athena_Commando_M_CyberSamurai:{t:'o', n:'X'}}; CAREER.fnEq={o:'CID_A_400_Athena_Commando_M_CyberSamurai'};
    check('своя команда — в надетом', /cid_a_400_athena_commando_m_cybersamurai/.test(window.CC_FN_SKIN('Probe', true)), window.CC_FN_SKIN('Probe', true));
    // Строка ленты: картинка перед именем.
    const host=document.createElement('div'); host.style.cssText='width:600px;height:400px;position:relative'; document.body.appendChild(host);
    const h=ZoneReplay.mount(host, MAP_ART[ACTIVE_LANDING_SET]||'', 'probe');
    ZoneReplay.note(h, ['Sky & Scroll:Pixie & SwizzY'], [{name:'Sky & Scroll'}, {name:'Pixie & SwizzY'}]);
    const imgs=[...h.feed.querySelectorAll('img')].map(i=>i.getAttribute('src'));
    out.notes.feed=imgs;
    check('в строке ленты два образа', imgs.filter(s=>/cosmetics/.test(s)).length===2, JSON.stringify(imgs));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fskin-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('в ленте убийств у команд образы: свой надетый, у остальных постоянный по сезону');
fs.rmSync(dir, { recursive: true, force: true });
