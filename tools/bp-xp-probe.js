// Батл пасс: сколько вечеров, игр, киллов и побед даёт сезон карьеры — замер для темпа опыта (ccBpXpOf).
// Карьера карточкой за игрока, год перематывается целиком (careerFastForward, как career-year-run-probe).
// Пишет журнал вечеров в %TEMP%/bp-xp-<ник>.json: день, вид, игры, победы, киллы, место, прошёл ли.
//
//   node tools/bp-xp-probe.js [ник] [напарник] [дней] [старт ГГГГ-ММ-ДД]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const ME = process.argv[2] || 'Sky', MATE = process.argv[3] || 'Scroll', DAYS = +(process.argv[4] || 366), FROM = process.argv[5] || '';
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
  const out={errs:null, err:null};
  try{
    const days=careerYearDays();
    let day=${JSON.stringify(FROM)}||null;
    if(!day) for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1)) if((days.get(d)||[]).length){ day=d; break; }
    // '#N' — N-я по силе карточка EU (слабый игрок без имени под рукой)
    const eu=PLAYERS.filter(p=>p && (p.region||'EU')==='EU').sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0));
    const card=h=>h[0]==='#' ? eu[+h.slice(1)] : PLAYERS.filter(p=>p && hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card(${JSON.stringify(ME)}), mate=card(${JSON.stringify(MATE)});
    if(!me || !mate) throw new Error('нет карточки');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:me.handle, age:20, source:'card', country:me.nat||'dk', countryPing:12, closeRangeEdge:0,
              region:me.region||'EU', ovr:Math.round(attrsFor(me).ovr), role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:me.handle, cardRegion:me.region||'EU', nat:me.nat||null},
      career:{season:1, day:day, division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[], size:2},
      partners:[{handle:mate.handle, cardRegion:mate.region||'EU', dev:0, since:'2025-06-01'}]}));
    careerEntry();
    const realDigest=careerFfDigest; careerFfDigest=function(){};
    const t0=Date.now();
    await careerFastForward(${DAYS});
    careerFfDigest=realDigest;
    out.ms=Date.now()-t0; out.from=day; out.to=careerToday(); out.ovr=CAREER.player.ovr;
    out.log=(CAREER.career.log||[]).filter(r=>r && !r.who).map(r=>({d:r.day, k:r.kind, st:r.stage||'', g:r.games||0, w:r.wins||0, e:r.elims||0,
      pl:r.place, of:r.of, ok:!!r.passed, lan:!!r.lan, sn:ccSeasonNumOn(r.day)}));
  }catch(e){ out.err=String((e&&(e.stack||e.message))||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bpxp-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=6000000','--dump-dom', 'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
const file = path.join(os.tmpdir(), 'bp-xp-' + ME + '.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
if (out.errs && out.errs.length) console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | '));
if (out.err) console.error('встала: ' + out.err.slice(0, 400));
console.log(ME + ' ' + out.from + ' -> ' + out.to + ' за ' + Math.round((out.ms||0)/1000) + ' с, вечеров ' + (out.log||[]).length + ', рейтинг ' + out.ovr + ' -> ' + file);
