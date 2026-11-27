// Карьера сохраняется, когда localStorage целиком занят ДРУГОЙ, уже сжатой карьерой.
//
// iPhone, игрок из Франции: карьера в 14 сезонов (1824 события) в одном слоте, новая
// в другом пишет «Cette carrière n'est pas sauvegardée (QuotaExceededError)». Журнал:
// тот же игрок упирался в квоту и на 13-м сезоне. Сжимать больше нечего, резать —
// терять. Слот уезжает в IndexedDB, в localStorage остаётся заглушка IDB1.
//
// Проба на настоящей квоте Chrome:
//   * чужой слот уже сжат и занимает почти всё, остаток забит до краёв;
//   * свой сейв записывается, журнал цел;
//   * после «перезагрузки» (память базы стёрта) оба слота читаются из базы целиком,
//     плитка чужого слота рисуется по заглушке ещё до чтения базы;
//   * вход в карьеру, пока база не прочитана, ждёт её, а не создаёт карьеру заново;
//   * удаление слота убирает и запись в базе.
//
//   node tools/check-career-save-idb.js
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
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let seed = 11;
  const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n; };
  const rows = n => { const a = []; for(let i = 0; i < n; i++) a.push({day:'2019-0'+(1+rnd(9))+'-'+(10+rnd(18)),
    kind:['cup','victory','major','lcq'][rnd(4)], stage:'r'+rnd(6), place:rnd(5000), pts:rnd(400), elims:rnd(30),
    who:'player'+rnd(40000), pr:rnd(90000)}); return a; };
  const fill = () => {
    localStorage.removeItem('zz_fill');
    let lo = 0, hi = 6000000;
    while(hi - lo > 64){ const mid = (lo + hi) >> 1;
      try{ localStorage.setItem('zz_fill', 'x'.repeat(mid)); lo = mid; }catch(e){ hi = mid; } }
    localStorage.setItem('zz_fill', 'x'.repeat(lo));
  };
  try{
    localStorage.clear();
    // Старая большая карьера в слоте 2 — уже сжатая, как у него.
    const big = JSON.stringify({v:1, player:{nick:'Oldtimer', age:20, ovr:99, country:'fr', region:'EU'},
      career:{season:14, day:'2026-10-23', division:1, earnings:7402448, log:rows(40000)}, partners:[]});
    const bigRaw = CC_SAVE_LZ + LZString.compressToUTF16(big);
    localStorage.setItem('fncsdraft_career_s2', bigRaw);
    // Новая карьера в слоте 1.
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Sky', age:15, source:'rookie', country:'dk', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:89, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2024-12-02', division:1, earnings:0, balance:500, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    ccSlotUse(1); CAREER = null; careerEntry(true);
    if(!CAREER) fail('setup: the new career did not open');
    CAREER.career.log = rows(3000);
    const logN = CAREER.career.log.length;
    fill();
    CC_SAVE_FAIL = null; careerSave();
    if(CC_SAVE_FAIL) fail('the new career is not saved: ' + CC_SAVE_FAIL);
    if(!ccIdbIsStub(localStorage.getItem('fncsdraft_career'))) fail('own slot did not move to IndexedDB');
    out.steps.push('big packed career ' + bigRaw.length + ' chars in slot 2, localStorage full: new career saved to IndexedDB');
    await wait(1500);
    if(!ccIdbIsStub(localStorage.getItem('fncsdraft_career_s2'))) fail('the big other slot was not parked');
    // Ещё одно сохранение — снова без ошибки.
    CAREER.career.balance = 777; CC_SAVE_FAIL = null; careerSave();
    if(CC_SAVE_FAIL) fail('second save failed: ' + CC_SAVE_FAIL);
    await wait(1500);

    // «Перезагрузка»: память базы стёрта.
    CC_IDB_MEM = {}; CC_IDB_ON = {}; CC_IDB_READY = null; CC_IDB_DB = null; CAREER = null;
    const card = ccSlotCard(2);
    if(!card || card.nick !== 'Oldtimer' || card.season !== 14) fail('slot 2 tile does not draw from the stub: ' + JSON.stringify(card));
    let created = false; const keepCreate = window.openCareerCreate; window.openCareerCreate = () => { created = true; };
    careerEntry(true);
    if(created) fail('entering before the base was read offered to create a career over it');
    // Ждать саму базу, а не таймеры: виртуальное время пробы бежит быстрее записи IndexedDB.
    let loaded = false;
    await Promise.race([ccIdbLoadAll().then(() => { loaded = true; }), wait(240000)]); await wait(50);
    if(!loaded) fail('reading the base did not finish');
    window.openCareerCreate = keepCreate;
    if(!CAREER || !CAREER.career) fail('the career did not open after the base was read: mem ' +
      Object.keys(CC_IDB_MEM).join(',') + ' · stub ' + ccIdbIsStub(localStorage.getItem('fncsdraft_career')) + ' · created ' + created);
    if(CAREER.career.log.length !== logN) fail('journal cut: ' + CAREER.career.log.length + ' of ' + logN);
    if(CAREER.career.balance !== 777) fail('the last save was lost: balance ' + CAREER.career.balance);
    const two = ccSlotRead(2);
    if(JSON.stringify(two) !== big) fail('slot 2 does not read back the same from the base');
    out.steps.push('after reload: own career whole (' + logN + ' rows, last save kept), slot 2 byte for byte, tile from the stub before the base');

    // Снимок отката дня — в базе, в localStorage метка; чистка места его не трогает.
    localStorage.removeItem('fncsdraft_career_undo'); ccUndoSnap();
    await ccIdbGet('fncsdraft_career_undo'); await wait(50);
    let mark = null; try{ mark = JSON.parse(localStorage.getItem('fncsdraft_career_undo') || 'null'); }catch(e){}
    if(!mark || !mark.idb) fail('the day snapshot did not go to IndexedDB: ' + JSON.stringify(mark));
    ccSaveMakeRoom('fncsdraft_career', 2);
    if(!localStorage.getItem('fncsdraft_career_undo')) fail('making room deleted the day snapshot mark');
    const snap = await ccIdbGet('fncsdraft_career_undo');
    if(!snap || ccSaveParse(snap).career.log.length !== logN) fail('the day snapshot in the base is not the career');
    out.steps.push('day snapshot for undo lives in the base and survives making room');

    ccSlotWipe(2); await wait(800);
    CC_IDB_MEM = {}; CC_IDB_READY = null; await ccIdbLoadAll();
    if(ccSlotRead(2)) fail('slot 2 survived its wipe');
    if(CC_IDB_MEM['fncsdraft_career_s2'] != null) fail('slot 2 left a record in the base');
    out.steps.push('wiping slot 2 removes its record in the base');
    localStorage.clear();
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccidb-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--user-data-dir=' + path.join(dir, 'prof'),
  '--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('a career saves through IndexedDB when localStorage is full');


