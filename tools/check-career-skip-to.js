// «Пропустить до турнира» — одной кнопкой, без турниров по дороге.
//
// Репорт игрока 6 сентября 2026: «Добавь пожалуйста возможность скипнуть дни
// без просмотра капов одной кнопкой, а то очень лень ждать 102 дня».
// Проверяется:
//   * цель — ближайший день с вечером, который игрок может открыть, и она
//     дальше сегодняшнего дня;
//   * пропуск ставит календарь ровно на цель, а журнал турниров не растёт —
//     вечера по дороге не играются;
//   * в день без турнира хаб показывает кнопку, и она ведёт на модалку с
//     числом дней; в команде кнопка гаснет;
//   * на календаре рядом с «Доиграть» стоит «Пропустить до этого дня».
//
//   node tools/check-career-skip-to.js
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
  try{
    const start = (day) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1, player:{nick:'Skipper', age:20, source:'rookie', country:'de', countryPing:15,
          closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
        career:{season:1, day:day, division:1, earnings:0, balance:500, reach:0,
                tokens:[], log:[], news:[]},
        partner:null}));
      careerEntry();
    };
    // Первый день без турнира от старта карьеры.
    start('2026-02-02');
    let guard=0;
    while(careerNext().type!=='free' && guard++<20) careerSkipWeek();
    if(careerNext().type!=='free') fail('no free day found in twenty steps from 2 Feb');
    const today=careerToday();

    // ---- цель дальше сегодня и открывается этому игроку ---------------------
    const t=careerSkipTarget();
    if(!(t.day>today)) fail('the target is not ahead: '+t.day+' from '+today);
    const evs=(careerEvents().get(t.day)||[]);
    if(t.day!==CC_YEAR_TO && !evs.some(e=>careerCanPlayKindOn(t.day, e.kind)))
      fail('the target day '+t.day+' has nothing this player can open');
    const n=ccFfDays(t.day);
    out.steps.push('from '+today+' the next playable evening is '+t.day+' ('+(t.ev?t.ev.label:'gala')+'), '+n+' days');

    // ---- хаб показывает кнопку, и она спрашивает ---------------------------
    careerRenderHub('centre');
    const btn=document.querySelector('#screen-career-hub .ch-skipto');
    if(!btn) fail('the hub shows no skip-to button on a free day');
    if(btn.disabled) fail('the skip-to button is disabled in a single career');
    btn.click();
    const modal=document.getElementById('ccAskModal');
    if(!modal || modal.style.display!=='flex') fail('the skip-to button asked nothing');
    const text=document.getElementById('ccAskText').textContent;
    if(text.indexOf(String(n))<0) fail('the question does not name the days: '+text);
    ccAskGo(false);
    if(careerToday()!==today) fail('declining the question moved the day');
    out.steps.push('hub: the button asks «'+text+'» and «no» leaves the day where it was');

    // ---- пропуск ставит календарь на цель, журнал не растёт -----------------
    const logWas=(CAREER.career.log||[]).length;
    careerSkipTo(t.day);
    if(careerToday()!==t.day) fail('after the skip the day is '+careerToday()+', not '+t.day);
    if((CAREER.career.log||[]).length!==logWas)
      fail('the skip played tournaments on the way: log grew by '+((CAREER.career.log||[]).length-logWas));
    if(CC_DAY_ERR) fail('the skip left an error: '+CC_DAY_ERR.text);
    out.steps.push('skip lands on '+t.day+' with the log untouched ('+logWas+' rows)');

    // ---- календарь: рядом с «Доиграть» стоит «Пропустить» -------------------
    const later=ccAddDays(careerToday(), 10);
    careerFfAsk(later);
    const calSkip=document.querySelector('#screen-career-hub .cal-skip');
    if(!calSkip) fail('the calendar bar has no skip button next to play-through');
    careerFfCancel();
    out.steps.push('calendar: the picked day offers both «play through» and «skip»');

    // ---- в команде кнопка гаснет --------------------------------------------
    start('2026-02-02');
    CAREER.career.mp={code:'TEST01', role:'host'};
    if(typeof ccMpOn==='function' && ccMpOn()){
      careerRenderHub('centre');
      const b=document.querySelector('#screen-career-hub .ch-skipto');
      if(b && !b.disabled) fail('the skip-to button is live in a team career');
      const was=careerToday();
      careerSkipTo(ccAddDays(was, 5));
      if(careerToday()!==was) fail('careerSkipTo moved the day in a team career');
      out.steps.push('team career: the button is off and the move refuses');
    } else out.steps.push('(team career could not be faked here)');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccskipto-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=180000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('one button skips to the next tournament without playing the ones on the way');
