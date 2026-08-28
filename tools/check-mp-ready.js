// «0/2» и «1/2» на кнопке дня: видно ли, что вечер ждёт второго.
//
// Его слово, 27 августа: «нужно, чтоб при нажатие кнопки играть было написано
// 1/2 если жмет кто-то или 0/2, игра начинается если нажмут два человека».
// До этого нажатие уходило в ccMpGate и вечер молча ждал напарника — кнопка
// выглядела сломанной.
//
// Считает готовность сервер (server/src/lobby.js, ready), клиент только
// запоминает и показывает. Здесь проверяется клиентская половина: что счёт
// берётся из пришедшего сообщения, что вчерашняя готовность к сегодняшнему
// вечеру не относится, что старт её гасит и что одиночная карьера подписи не
// получает вовсе. Серверную половину стережёт server/tools/check-lobby.js.
//
//   node tools/check-mp-ready.js

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
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const seed=(team)=>{
    const cr={season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world', size:2};
    if(team) cr.mp={code:'ABC123', role:'a'};
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Ready', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:cr, partners:[]}));
    careerLoad();
    MP.waiting=null;
  };
  try{
    // ---- одиночная карьера подписи не получает --------------------------
    seed(false);
    check('в одиночной карьере на кнопке ничего не приписано',
          ccMpReadyTag()==='', JSON.stringify(ccMpReadyTag()));

    // ---- командная: пока не жал никто ------------------------------------
    seed(true);
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:90,
             _targetOvr:90, _attrs:null, _roleKey:'roleFRG'};
    out.notes.доНажатия=ccMpReadyTag();
    check('пока не нажимал никто — 0/2', ccMpReadyTag()===' 0/2', ccMpReadyTag());

    // ---- один нажал ------------------------------------------------------
    MP.say({t:'ready', by:'peer', day:careerToday(), ready:1, of:2});
    out.notes.одинНажал=ccMpReadyTag();
    check('нажал один — 1/2', ccMpReadyTag()===' 1/2', ccMpReadyTag());

    /* Готовность заявляется НА ДЕНЬ: вчерашняя к сегодняшнему вечеру
       отношения не имеет, иначе вечер выглядел бы наполовину начатым до
       первого нажатия. */
    MP.say({t:'ready', by:'peer', day:'2026-01-01', ready:1, of:2});
    check('вчерашняя готовность сегодня не считается',
          ccMpReadyTag()===' 0/2', ccMpReadyTag());

    // ---- вечер начался — ждать больше нечего -----------------------------
    MP.say({t:'ready', by:'peer', day:careerToday(), ready:1, of:2});
    check('перед стартом снова 1/2', ccMpReadyTag()===' 1/2', ccMpReadyTag());
    MP.say({t:'start', seed:'x', day:careerToday()});
    check('старт гасит счётчик', MP.waiting===null && ccMpReadyTag()===' 0/2',
          ccMpReadyTag());

    /* И то же самое на самой кнопке, а не только в функции: подпись живёт в
       разметке дня, и её легко потерять при следующей правке панели. */
    MP.state='live';
    MP.say({t:'ready', by:'peer', day:careerToday(), ready:1, of:2});
    careerRenderHub('centre');
    const html=(document.getElementById('chBody')||{}).innerHTML||'';
    const btn=(html.match(/<button[^>]*class="ch-play"[^>]*>([^<]*)</)||[])[1]||'';
    out.notes.кнопка=btn;
    check('счёт стоит на самой кнопке', /1\\/2/.test(btn), btn||'кнопки нет');

    // Выход из лобби гасит и его: вечера, которого ждали, больше не будет.
    MP.drop();
    check('уход из лобби гасит счётчик', MP.waiting===null, JSON.stringify(MP.waiting));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpready-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('готовность видна на кнопке');
fs.rmSync(dir, { recursive: true, force: true });
