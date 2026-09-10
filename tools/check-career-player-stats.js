// Лист статистики игрока сцены. Его игрок, 10 сентября 2026: «Add players stats».
//
// Проверяется: вечер пишет журнал каждому участнику (cr.plog), лист собирается по
// нику (ПР, призовые, турниры, VR, килы, среднее/лучшее место, последние вечера),
// профиль в соцсети и лупа на карточке его показывают, лестничное имя без карточки
// открывает лист без атрибутов, имена в таблице вечера кликаются, а хвост журнала
// режется по CC_PLOG_KEEP / CC_PLOG_NAMES.
//
//   node tools/check-career-player-stats.js
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
      v:1, player:{nick:'Sheet', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    useLandingSet(careerBrSet());
    // ---- вечер пишет журнал каждому --------------------------------------------
    const me=careerCard();
    const field=careerCupField(cr, [me], 50);
    const teams=field.slice(0, 40);
    teams.forEach((t,i)=>{ t.wins=i===0?2:(i<5?1:0); t.stageElims=30-i; t.stagePts=300-i*5; });
    const ranked=teams.slice();
    careerPrAdd(ranked, {div:1, kind:'cup', stage:null});
    const first=(ranked[0].squad||[])[0], firstH=first && first.handle;
    check('журнал есть у первого', !!(cr.plog && firstH && cr.plog[firstH] && cr.plog[firstH].length===1), JSON.stringify(Object.keys(cr.plog||{}).slice(0,3)));
    const e=cr.plog[firstH][0];
    check('строка журнала: день, вид, место, из, VR, килы, очки, див', e[0]==='2026-02-02' && e[1]==='cup' && e[2]===1 && e[3]===40 && e[4]===2 && e[5]===30 && e[6]===300 && e[7]===1, JSON.stringify(e));
    check('в списке вечеров кубок назван с дивизионом', !/undefined/.test(careerPlayerStatsHTML(firstH)));
    const second=(ranked[1].squad||[])[1] || (ranked[1].squad||[])[0];
    check('и у напарника второй команды', !!(second && cr.plog[second.handle] && cr.plog[second.handle][0][2]===2));
    // ---- второй вечер, другой вид -----------------------------------------------
    cr.day='2026-02-08';
    careerPrAdd(ranked.slice().reverse(), {div:1, kind:'final', stage:null});
    check('второй вечер дописался', cr.plog[firstH].length===2 && cr.plog[firstH][1][2]===40 && cr.plog[firstH][1][1]==='final');
    // ---- лист ---------------------------------------------------------------------
    const html=careerPlayerStatsHTML(firstH);
    check('лист собран', /cc-ps/.test(html) && /cc-ps-grid/.test(html), html.slice(0,120));
    check('в листе — турниров 2, лучшее #1, VR', /Турниров<\\/span><b>2<\\/b>/.test(html) && /Лучшее место<\\/span><b>#1<\\/b>/.test(html) && /Побед \\(VR\\)<\\/span><b>4<\\/b>/.test(html), html.replace(/<[^>]+>/g,' ').slice(0,300));
    check('среднее место 20.5', /Среднее место<\\/span><b>20.5<\\/b>/.test(html), html.replace(/<[^>]+>/g,' ').slice(0,300));
    check('последние вечера — две строки с местом', (html.match(/<b>#\\d+<\\/b>\\//g)||[]).length===2, html.replace(/<[^>]+>/g,' ').slice(-200));
    check('ПР в листе', /Power Ranking<\\/span><b>#\\d+ · /.test(html), html.replace(/<[^>]+>/g,' ').slice(0,200));
    check('у чужого ника пусто', careerPlayerStatsHTML('никто-такой')==='');
    out.steps.push('журнал вечеров пишется всем, лист по нику: '+html.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').slice(0,160));
    // ---- профиль в соцсети и лупа -----------------------------------------------
    const who=careerWhoHTML(firstH);
    check('профиль в соцсети показывает лист', /cc-ps-grid/.test(who));
    SHOWN_SCREEN='screen-career-hub';
    openCardPeek(first);
    const body=document.getElementById('cardPeekBody').innerHTML;
    check('лупа на карточке — с листом сезона', /cc-ps-grid/.test(body) && /fut-back/.test(body));
    closeCardPeek();
    // Лестничное имя без карточки: строка журнала есть, карточки нет — лист один.
    const ladder=ranked.find(t=>!(t.squad||[]).length || (t.squad||[]).some(c=>!c || !c.rating));
    const ladderName=ladder ? (String(ladder.name||'').replace(/<[^>]*>/g,'').split(/\\s*[+&]\\s*/)[0]) : null;
    if(ladderName && cr.plog[ladderName]){
      ccPeekByHandle(ladderName);
      const b2=document.getElementById('cardPeekBody').innerHTML;
      check('лестничное имя открывает лист без атрибутов', /cc-ps-grid/.test(b2) && !/fut-ovr/.test(b2), b2.slice(0,120));
      closeCardPeek();
      out.steps.push('лестничное имя: '+ladderName+' — лист без карточки');
    } else out.steps.push('лестничных имён в поле нет — ветка без карточки не проверялась');
    // ---- имена в таблице вечера --------------------------------------------------
    CAREER_RUN=true;
    const cellOn=ccNamesPeekHTML(ranked[0]);
    check('в таблице вечера имена — ссылками на лист', /class="cc-peek"/.test(cellOn) && /flag|<img/.test(cellOn) && cellOn.indexOf('ccPeekByHandle(')>=0 && cellOn.indexOf(firstH)>=0, cellOn.slice(0,160));
    CAREER_RUN=false;
    check('вне вечера — просто имя', ccNamesPeekHTML(ranked[0])===String(ranked[0].name||''));
    // ---- хвост режется ------------------------------------------------------------
    for(let d=0; d<CC_PLOG_KEEP+5; d++){ cr.day=ccAddDays('2026-03-01', d); careerPrAdd(ranked, {div:1, kind:'cup', stage:null}); }
    check('на человека не больше CC_PLOG_KEEP вечеров', cr.plog[firstH].length===CC_PLOG_KEEP, String(cr.plog[firstH].length));
    for(let i=0;i<CC_PLOG_NAMES*1.4;i++){ careerPlogAdd('ghost'+i, {kind:'cup'}, 5, 50, {wins:0, stageElims:0, stagePts:0}, false); }
    check('имён не больше CC_PLOG_NAMES с запасом чистки', Object.keys(cr.plog).length<=CC_PLOG_NAMES*1.3+1, String(Object.keys(cr.plog).length));
    check('свой ник пережил чистку', !!cr.plog[cr.plogYou || me.handle] || !cr.plogYou);
    out.steps.push('хвост: '+CC_PLOG_KEEP+' вечеров на человека, не больше '+CC_PLOG_NAMES+' имён');
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpstats-'));
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
console.log('every player of the scene has a stat sheet: the journal, the profile, the card peek and the table');
fs.rmSync(dir, { recursive: true, force: true });
