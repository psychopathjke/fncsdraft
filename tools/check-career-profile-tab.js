// Профиль и История — две разные вкладки, и каждая держит своё.
//
// Его правки 24 августа шли парой: лист результатов «как отдельный столбик...
// после центра profile мб», а следом «вот это добавь в историю» про сезоны и
// ленту карьеры. Проверяется, что они действительно разъехались и что ничего
// не потерялось по дороге — плюс обложки турниров, ради которых видно, что на
// строку архива нажимают.
//
//   node tools/check-career-profile-tab.js
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
(function(){
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  try{
    // Карьера с парой сыгранных вечеров: пустой журнал показывает заглушку, и
    // проверять на нём таблицу было бы нечего.
    const log=[
      {season:1, day:'2026-02-10', div:1, place:1, of:50, kind:'cup', stage:'final',
       passed:true, prize:5000, games:6, wins:2, elims:40, avg:6.1, ovr:92, mate:'Mate'},
      {season:1, day:'2026-03-03', div:1, place:7, of:50, kind:'final', stage:'final',
       passed:false, prize:0, games:6, wins:0, elims:22, avg:14.2, ovr:92, mate:'Mate'}
    ];
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Tabs', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-06-20', division:1, earnings:5000, balance:1000, reach:0,
              tokens:[], log:log, news:[]},
      partner:null}));
    careerEntry();

    // ---- вкладки на месте и в нужном порядке ------------------------------
    const tabs=[...document.querySelectorAll('#screen-career-hub .ch-tab')]
      .map(b=>b.dataset.tab);
    if(tabs[0]!=='centre') fail('первой стоит не «Центр»: '+tabs.join(','));
    if(tabs[1]!=='log') fail('Профиль не сразу за Центром: '+tabs.join(','));
    if(tabs.indexOf('hist')<0) fail('вкладки Истории нет: '+tabs.join(','));
    out.steps.push('вкладки: '+tabs.join(' · '));

    // ---- Профиль: лист результатов, и только он ---------------------------
    const prof=careerProfileHTML();
    if(prof.indexOf('ev-table')<0) fail('в Профиле нет таблицы результатов');
    if(prof.indexOf('ev-totals')<0) fail('в Профиле нет итогов сверху');
    if(prof.indexOf('arc-row')>=0) fail('сезоны остались в Профиле');
    // ---- История: сезоны и лента, и только они ----------------------------
    const hist=careerHistoryHTML();
    if(hist.indexOf('arc-row')<0 && hist.indexOf('arcTitle')<0 && hist.indexOf('ch-tile')<0)
      fail('в Истории нет блока сезонов');
    if(hist.indexOf('ev-table')>=0) fail('таблица результатов осталась в Истории');
    out.steps.push('Профиль держит таблицу, История — сезоны и ленту');

    // ---- обложки турниров на строках архива -------------------------------
    const art=(hist.match(/class="arc-logo"/g)||[]).length;
    const rows=(hist.match(/class="ch-row arc-row/g)||[]).length;
    if(!rows) fail('строк архива нет вовсе');
    if(!art) fail('ни у одной строки архива нет обложки');
    if(art<rows*0.5) fail('обложка только у '+art+' строк из '+rows);
    out.steps.push('обложки: '+art+' строк архива из '+rows);

    // ---- и обе вкладки рисуются в хабе без ошибок -------------------------
    careerRenderHub('log');
    const body=document.getElementById('chBody') ||
      document.querySelector('#screen-career-hub .ch-body');
    if(body && body.innerHTML.indexOf('ev-table')<0) fail('вкладка Профиля пуста');
    careerRenderHub('hist');
    if(body && body.innerHTML.indexOf('arc-row')<0 && body.innerHTML.indexOf('ch-tile')<0)
      fail('вкладка Истории пуста');
    out.steps.push('обе вкладки рисуются');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctab-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('Профиль и История разъехались, и на архиве видно, что это турниры');
