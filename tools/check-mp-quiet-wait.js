// Ожидание напарника держится на его ПУЛЬСЕ, а не на секундомере.
//
// Его фото, 28 августа (страница «neeww»): вечер сошёлся, а красная строка
// «timeout · q late#1» — этот клиент три минуты ждал ответа на восьмую зону и
// решил сам, хотя напарник был жив и просто медленно досматривал (вкладка в
// фоне). Теперь потолок считается от тишины: пока приходит пульс, ждём.
//
//   node tools/check-mp-quiet-wait.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
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
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Quiet', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'),
        ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], mp:{code:'ABC123', role:'a'}},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    MP.state='live';
    MP.send=function(){};
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90, _attrs:null, _roleKey:'roleFRG'};
    ccMpQnReset(); ccMpWaitReset();
    ccMpSeedOn('quiet-seed');            // вечер идёт: генератор подменён, пульс включён
    check('пульс включён на вечер', !!CC_MP_HB);
    // Восьмая зона — вопрос фраггера. Он молчит, но подаёт пульс каждые 2 с.
    let asked=false, settled=null;
    const p=ccMpChoose('late', function(){ asked=true; return 'hg'; }).then(r=>{ settled=r; return r; });
    // Он ДОШЁЛ до вопроса (приход в барьер), но ответа не даёт — только пульс.
    await wait(50);
    MP.say({t:'act', kind:'late@', by:'peer', n:2, payload:{by:'peer', q:CC_MP_QN.late}});
    out.notes.qn=CC_MP_QN.late; out.notes.waits1=CC_MP_WAIT.map(w=>w.t);
    const hb=setInterval(()=>MP.say({t:'act', kind:'hb', by:'peer', n:1, payload:{by:'peer'}}), 2000);
    await wait(CC_MP_SYNC_MS + 40000);   // дольше старого потолка
    check('пока идёт пульс — ждём, а не решаем сами', settled===null && !asked,
          'settled '+JSON.stringify(settled)+' asked '+asked);
    check('пульс не попадает в очередь решений', !MP.peek('hb'));
    // Пульс пропал — потолок на тишину срабатывает.
    clearInterval(hb);
    await wait(CC_MP_SYNC_MS + 5000);
    out.notes.waits2=CC_MP_WAIT.map(w=>w.t);
    check('без пульса потолок срабатывает', settled!==null && settled.mine===true && asked,
          'settled '+JSON.stringify(settled));
    check('и это помечено как расхождение', !!document.querySelector('.cc-mp-split'));
    ccMpSeedOff();
    check('пульс выключен вместе с вечером', !CC_MP_HB);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccquiet-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const mm = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!mm) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(mm[1]));
console.log(JSON.stringify(out.notes));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('ожидание держится на пульсе напарника, а потолок — на тишине');
