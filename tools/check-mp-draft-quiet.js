// Обычный драфт не ждёт напарника.
//
// Его скрин, 30 августа: «waiting for your partner пишет» — в ДРАФТЕ, не в
// карьере. CAREER с командой остаётся загруженным после входа в карьеру, и
// ccMpOn() отвечал «команда» всему, что спрашивало: барьерам и вопросам
// simulateGamesLive, гейту скипа. Драфт-турнир вставал на «Waiting for your
// partner…», хотя напарник к нему не имеет отношения.
//
// Проверяется путь игрока: карьера с командой в памяти → плитка драфта →
// ccMpOn() молчит и ccMpChoose отдаёт свой выбор сразу; вход в карьеру и
// запуск карьерного вечера возвращают команду.
//
//   node tools/check-mp-draft-quiet.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
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
  if(document.readyState!=='complete')
    await new Promise(r=>window.addEventListener('load', r));
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    localStorage.clear();
    // Команда в памяти — так выглядит вкладка после входа в командную карьеру.
    CAREER = {career:{mp:{code:'ABCDEF', role:'a'}}};
    if(typeof MP==='undefined') window.MP = {};
    check('команда в памяти видна', ccMpTeam() === true);
    check('до драфта команда в силе', ccMpOn() === true, String(ccMpOn()));

    // ---- плитка драфта ---------------------------------------------------
    chooseMode(2, 'cards1');
    check('в драфте команда молчит', ccMpOn() === false, 'ccMpOn=' + ccMpOn());
    const r = await ccMpChoose('probe', () => 'mine', null, 'x');
    check('вопрос отвечается своим выбором сразу', r && r.v === 'mine' && r.mine === true, JSON.stringify(r));
    let synced = false;
    await Promise.race([ccMpSync('probe', 'x', 1).then(() => { synced = true; }),
                        new Promise(res => setTimeout(res, 800))]);
    check('барьер не ждёт напарника', synced);
    out.notes.драфт = {on: ccMpOn(), choose: r};

    // ---- обратно в карьеру: команда снова в силе ----------------------------
    CC_DRAFT_RUN = true;
    try { careerPlayRun({type:'cup'}); } catch(e) {}
    check('карьерный вечер возвращает команду', ccMpOn() === true, 'ccMpOn=' + ccMpOn());
    CC_DRAFT_RUN = true;
    try { careerEntry(); } catch(e) { out.notes.entry = String(e); }
    check('вход в карьеру возвращает команду', CC_DRAFT_RUN === false, 'CC_DRAFT_RUN=' + CC_DRAFT_RUN);
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpdraft-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('драфт не ждёт напарника; карьера ждёт, как и ждала');
fs.rmSync(dir, { recursive: true, force: true });
