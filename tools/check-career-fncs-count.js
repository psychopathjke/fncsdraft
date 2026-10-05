// Счётчик FNCS у каждого игрока сцены (5.10, Notion «05», испанский игрок: «mas contador de
// fncs de todos los jugadores»).
//
// Проверяется правило, а не число дня:
//  — у известного игрока (Peterbot, Pollo — NAC) счётчик настоящих турниров > 0 и РАВЕН числу
//    разных турниров «FNCS …» в его карточках своего региона и строках RANKED, посчитанному здесь
//    независимо; титул Глобалов 2024 у обоих есть;
//  — тёзки другого региона в счёт не идут (тот же ник с чужим регионом не прибавляет);
//  — лестничное имя без карточек показывает ТОЛЬКО сыгранное в этой карьере, и число вечеров
//    FNCS совпадает с его журналом (cr.plog);
//  — лист собирается на всех пяти языках без «undefined».
//
//   node tools/check-career-fncs-count.js
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
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fails:[], errs:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Counter', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    // Независимый счёт: разные «FNCS …» до « — » в карточках региона и в RANKED.
    const indep=(h, reg)=>{ const k=hKey(h), s=new Set();
      PLAYERS.forEach(p=>{ if(p && p.handle && hKey(p.handle)===k && p.region===reg && /^FNCS /.test(String(p.event||''))) s.add(String(p.event).split(/\\s+—\\s+/)[0].trim()); });
      RANKED.forEach(x=>{ if((!x.region || x.region===reg) && String(x.duo||'').split(/\\s*[&+]\\s*/).some(n=>hKey(n)===k)){ const e=String(x.event||'').split(/\\s+—\\s+/)[0].trim(); if(/^FNCS /.test(e)) s.add(e); } });
      return s.size; };
    for(const h of ['Peterbot','Pollo']){
      const rec=ccFncsRecord(h, 'NAC'), n=indep(h, 'NAC');
      check(h+': турниров больше нуля', rec.events>0, rec.events);
      check(h+': счётчик = данные', rec.events===n, rec.events+' vs '+n);
      check(h+': титул Глобалов 2024', rec.titles.indexOf('FNCS 2024 Global Championship')>=0, JSON.stringify(rec.titles));
      out.steps.push(h+': '+rec.events+' FNCS ('+rec.from+'–'+rec.to+'), финалов '+rec.finals+', титулов '+rec.titles.length);
    }
    // Чужой регион не прибавляет: тот же ник в регионе, где карточек нет, — ноль.
    check('чужой регион — ноль', ccFncsRecord('Peterbot', 'OCE').events===0, ccFncsRecord('Peterbot', 'OCE').events);
    // Лестничное имя: только сыгранное в карьере.
    const ghost='ghostfncs77';
    cr.plog={}; cr.plog[ghost]=[['2026-03-01','major:final',4,50,0,3,120,null],['2026-03-08','cup',2,100,1,5,200,1],['2026-03-15','summit',1,50,2,9,300,null]];
    const gh=careerPlayerStatsHTML(ghost);
    const rec=ccFncsRecord(ghost);
    check('лестница: настоящих нет', rec.events===0, rec.events);
    check('лестница: блок есть, только своя половина', gh.indexOf(L().ccPsFncsMine(CC_PLOG_KEEP))>=0 && gh.indexOf(L().ccPsFncsReal)<0, gh.replace(/<[^>]+>/g,' ').slice(0,200));
    check('лестница: вечеров FNCS = журнал', ccFncsCareer(cr.plog[ghost]).n===2 && ccFncsCareer(cr.plog[ghost]).best===1);
    check('у чужого ника пусто', careerPlayerStatsHTML('никто-такой')==='');
    // Пять языков.
    for(const lg of ['ru','en','fr','it','pt']){
      LANG=lg; CC_L_CACHE={};
      const t=careerPlayerStatsHTML('Peterbot','NAC');
      check(lg+': без undefined', t && !/undefined/.test(t) && t.indexOf(L().ccPsFncs)>=0, t.slice(0,120));
    }
    LANG='ru'; CC_L_CACHE={};
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccfncscount-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('every scene player carries an FNCS counter: real events from the data, career nights from the journal');
fs.rmSync(dir, { recursive: true, force: true });
