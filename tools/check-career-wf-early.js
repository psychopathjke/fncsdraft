// Финал недели не играется за мир РАНЬШЕ, чем игрок до него дошёл.
//
// Его игрок, 27 августа: «баг остался, финалов не было, а результаты уже были»,
// и следом «и получается два финала див капа». Оба про одно: careerWorldTurns
// гонял неделю комнаты по диапазону (откуда, куда] — то есть считал пройденным
// и день ПРИБЫТИЯ. Игрок приходил на субботу финала, сцена тут же играла её,
// писала таблицу, платила призовые и постила поздравление, а карточка на экране
// всё ещё предлагала сыграть. Сыграв, игрок получал ВТОРОЙ финал той же недели.
//
// Проверяется контракт по дням, а не текст ленты:
//   приход на день финала            — мир молчит;
//   уход с него, если игрок сыграл    — мир молчит (не второй раз);
//   уход с него, если игрок пропустил — мир играет ровно один раз.
//
//   node tools/check-career-wf-early.js [папка сборки]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
(function(){
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    // Первый день финала недели в календаре.
    const days=careerYearDays();
    let F=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO && !F; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='final')) F=d;
    if(!F) fail('в календаре нет дня финала недели');
    out.steps.push('день финала недели: ' + F);

    const seed=()=>{
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'WF', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
          attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
          handle:null, cardRegion:null, nat:null},
        career:{season:1, day:ccAddDays(F,-1), division:1, earnings:0, balance:5000,
                reach:9000, tokens:[], log:[], news:[],
                wf:{monday:careerMonday(F)}},
        partners:[{handle:'Sbari', cardRegion:'EU', dev:0, since:'2026-01-12'}]}));
      careerLoad();
    };
    // Сколько раз мир сыграл финал — считаем по вызову careerD1Posts.
    let plays=0;
    const real=window.careerD1Posts;
    window.careerD1Posts=function(){ plays++; return real.apply(this, arguments); };

    // 1. Приход на день финала.
    seed(); plays=0;
    careerWorldTurns(ccAddDays(F,-1), F);
    out.steps.push('приход на день финала: мир сыграл ' + plays + ' раз');
    if(plays) fail('мир сыграл финал в день прибытия — результаты появляются до вечера');

    // 2. Уход с него, когда игрок сыграл сам.
    seed(); plays=0;
    CAREER.career.log.push({season:1, day:F, kind:'final', place:7, of:50, pts:100});
    careerWorldTurns(F, ccAddDays(F,1));
    out.steps.push('игрок сыграл, шагнул дальше: мир сыграл ' + plays + ' раз');
    if(plays) fail('мир сыграл ВТОРОЙ финал той же недели');

    // 3. Уход с него, когда игрок пропустил.
    seed(); plays=0;
    careerWorldTurns(F, ccAddDays(F,1));
    out.steps.push('игрок пропустил, шагнул дальше: мир сыграл ' + plays + ' раз');
    if(plays!==1) fail('пропущенный финал мир сыграл ' + plays + ' раз вместо одного');

    // 4. Перемотка через неделю целиком — ровно один раз.
    seed(); plays=0;
    careerWorldTurns(ccAddDays(F,-3), ccAddDays(F,4));
    out.steps.push('перемотка через финал: мир сыграл ' + plays + ' раз');
    if(plays!==1) fail('перемотка сыграла финал ' + plays + ' раз вместо одного');

    window.careerD1Posts=real;
  }catch(e){ if(!out.fail) out.fail=String(e&&e.stack||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wfearly-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('ошибки страницы: ' + out.errs.slice(0,3).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('финал недели играется за мир ровно один раз и не раньше игрока');
