// Перерисовка хаба не утаскивает взгляд наверх.
//
// Его отчёт, 28 августа: «нажимаю ТОЛЬКО СМОТРЮ и меня перебрасывает». Кнопка
// режима стоит под карточкой матча, довольно низко; хаб перерисовывался целиком,
// и страница уезжала в начало.
//
// В одиночной карьере это редкость — перерисовку зовёт своё же нажатие. В
// командной она стала частой и ЧУЖОЙ: её вызывает каждый голос напарника
// (готовность, пропуск, карточка, состояние от сервера). Поэтому правило
// стережётся отдельно: та же вкладка — положение сохраняется, другая — нет,
// там начало и есть то, что нужно.
//
//   node tools/check-hub-scroll.js

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
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Scroll', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:5000,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world', size:2},
      partners:[]}));
    careerEntry();
    careerTab('centre');
    const body=document.getElementById('chBody');
    check('хаб нарисован', !!body && body.innerHTML.length>0);

    /* Прокрутка меряется на том, что реально скроллится: в headless высота
       окна условная, поэтому положение ставится руками и там же читается. */
    const set=(y)=>{ if(body) body.scrollTop=y;
                     if(body && body.parentElement) body.parentElement.scrollTop=y;
                     try{ window.scrollTo(0, y); }catch(e){} };
    const get=()=>({b:body?body.scrollTop:0,
                    p:(body&&body.parentElement)?body.parentElement.scrollTop:0,
                    w:(window.scrollY||document.documentElement.scrollTop||0)});

    set(400);
    const was=get();
    out.notes.доПерерисовки=was;
    // Перерисовка ТОЙ ЖЕ вкладки — положение на месте.
    careerRenderHub('centre');
    const now=get();
    out.notes.послеПерерисовки=now;
    check('та же вкладка сохраняет положение',
          now.b===was.b && now.p===was.p && now.w===was.w,
          JSON.stringify(was)+' -> '+JSON.stringify(now));

    // И перерисовка без имени вкладки — та же самая вкладка.
    set(400);
    careerRenderHub();
    check('перерисовка без имени вкладки тоже сохраняет',
          get().b===400 || get().p===400 || get().w===400, JSON.stringify(get()));

    /* А смена вкладки положение НЕ тащит: там другой список, и начало его —
       то, что нужно. Проверяется тем, что после возврата на прежнюю вкладку
       старое положение не восстанавливается само. */
    set(400);
    careerTab('log');
    const other=get();
    out.notes.другаяВкладка=other;
    /* Ноль здесь не требуется: браузер сам ПОДРЕЗАЕТ прокрутку по высоте
       нового списка, а не обнуляет её. Требуется другое — что запомненное
       положение НЕ восстанавливается: вкладка другая, наследовать нечего. */
    check('другая вкладка не наследует чужое положение',
          other.b!==400 && other.p!==400 && other.w!==400, JSON.stringify(other));

    /* И самое важное для команды: чужое нажатие. Перерисовку зовёт mp.js на
       каждый голос напарника — она обязана быть такой же тихой. */
    careerTab('centre');
    set(360);
    CAREER.career.mp={code:'ABC123', role:'a'};
    MP.state='live';
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:90, _targetOvr:90,
             _attrs:null, _roleKey:'roleFRG', sim:false};
    MP.say({t:'ready', by:'peer', day:careerToday(), ready:1, of:2});
    const after=get();
    out.notes.чужойГолос=after;
    check('голос напарника не утаскивает взгляд',
          after.b===360 || after.p===360 || after.w===360, JSON.stringify(after));

    // И своё нажатие режима — то, с чего всё началось.
    set(360);
    careerSimSet(true);
    const mode=get();
    out.notes.сменаРежима=mode;
    check('смена режима не утаскивает взгляд',
          mode.b===360 || mode.p===360 || mode.w===360, JSON.stringify(mode));
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hubscroll-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--window-size=420,760', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('перерисовка той же вкладки взгляд не трогает');
fs.rmSync(dir, { recursive: true, force: true });
