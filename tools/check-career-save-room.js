// Карьера сохраняется, даже когда место в localStorage заняли ДРУГИЕ слоты.
//
// Notion 26.10, игрок: «3 дня не играли, сейчас зашли и мы не на той дате, где
// закончили: в карьере 1 сентября закончили, сейчас 17 августа». Журнал поломок
// 22.10: QuotaExceededError в командной карьере 2019 года, день 08-18 — каждый
// сейв после 17 августа падал, и перезагрузка вернула последний удачный. Своё
// сжатие (lz) не помогало: квоту держали чужие слоты обычным JSON.
//
// Проба на НАСТОЯЩЕЙ квоте Chrome (без подмены setItem):
//   * три чужих слота карьеры лежат обычным JSON, остаток забит до краёв;
//   * свой сейв не влезает даже сжатым — и всё равно записывается;
//   * свой журнал цел (ничего не срезано), чужие слоты читаются те же байт в байт;
//   * контроль: без ccSaveMakeRoom тот же расклад сохраниться не может.
//
//   node tools/check-career-save-room.js
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
(function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  // Строки журнала, похожие на настоящие: сжимаются, но не в ноль.
  let seed = 7;
  const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n; };
  const rows = n => { const a = []; for(let i = 0; i < n; i++) a.push({day:'2019-0'+(1+rnd(9))+'-'+(10+rnd(18)),
    kind:['cup','victory','major','lcq'][rnd(4)], stage:'r'+rnd(6), place:rnd(5000), pts:rnd(400), elims:rnd(30),
    who:'player'+rnd(40000), pr:rnd(90000)}); return a; };
  const fill = () => { // забить остаток до краёв ключом, который игре не принадлежит
    localStorage.removeItem('zz_fill');
    let lo = 0, hi = 6000000;
    while(hi - lo > 64){ const mid = (lo + hi) >> 1;
      try{ localStorage.setItem('zz_fill', 'x'.repeat(mid)); lo = mid; }catch(e){ hi = mid; } }
    localStorage.setItem('zz_fill', 'x'.repeat(lo));
  };
  const setup = () => {
    localStorage.clear();
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Roomer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2019-08-17', division:1, earnings:0, balance:500, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    CAREER = null; careerEntry();
    const others = {};
    ['fncsdraft_career_s2','fncsdraft_career_s3','fncsdraft_career_s4'].forEach(k => {
      others[k] = JSON.stringify({v:1, career:{day:'2020-03-01', log:rows(9000)}});
      localStorage.setItem(k, others[k]);
    });
    CAREER.career.log = rows(6000);
    const json = JSON.stringify(CAREER);
    fill();
    // Своему сейву нет места даже сжатым.
    return {others, logN:CAREER.career.log.length, own:json.length, ownLz:LZString.compressToUTF16(json).length,
            free:(() => { let n = 0; try{ for(;; n += 4096) localStorage.setItem('zz_probe', 'x'.repeat(n + 4096)); }catch(e){} localStorage.removeItem('zz_probe'); return n; })()};
  };
  try{
    // ---- контроль: без освобождения места сейв падает ----------------------
    const keep = window.ccSaveMakeRoom;
    let s = setup();
    if(s.free >= s.ownLz) fail('setup: the own save still fits compressed (' + s.ownLz + ' vs free ' + s.free + ')');
    window.ccSaveMakeRoom = () => false;
    CC_SAVE_FAIL = null; careerSave();
    if(!CC_SAVE_FAIL) fail('control: with no room made the save still went through, the probe proves nothing');
    out.steps.push('control: other slots full, own save ' + s.own + ' chars (' + s.ownLz + ' packed), free ' + s.free + ': ' + CC_SAVE_FAIL);
    window.ccSaveMakeRoom = keep;

    // ---- с освобождением: сохраняется, и ничего не потеряно ------------------
    s = setup();
    CC_SAVE_FAIL = null; careerSave();
    if(CC_SAVE_FAIL) fail('the career is still not saved: ' + CC_SAVE_FAIL);
    const back = ccSaveParse(localStorage.getItem('fncsdraft_career'));
    if(!back || !back.career || back.career.log.length !== s.logN)
      fail('the save went through by cutting the journal: ' + (back && back.career ? back.career.log.length : 'none') + ' of ' + s.logN);
    Object.keys(s.others).forEach(k => {
      const raw = localStorage.getItem(k);
      if(!raw) fail(k + ' was deleted to make room');
      const got = ccSaveParse(raw);
      if(JSON.stringify(got) !== s.others[k]) fail(k + ' does not read back the same after repacking');
    });
    out.steps.push('saved with the journal whole (' + s.logN + ' rows); the other three slots repacked and read back byte for byte');
    localStorage.clear();
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccroom-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--user-data-dir=' + path.join(dir, 'prof'),
  '--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('a career saves even when the other slots have taken the room');
