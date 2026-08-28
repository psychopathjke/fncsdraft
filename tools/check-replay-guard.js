// Реплей не может подвесить вечер.
//
// Его скрин 23 августа: Перфоманс, раунд 2, «игра 1 из 4» — карта стоит,
// таблица в нулях. Воспроизвести не удалось, поэтому чинится не причина, а
// последствие: показ уже посчитанной игры получил сторож (REPLAY_GUARD_MS).
// Проверяется, что сторож реально срабатывает и прогон идёт дальше:
//   * play(), который никогда не резолвится, не вешает playReplayGuarded;
//   * сторож поднимает skipAnimation, чтобы кадры не рисовались поверх;
//   * нормальный реплей отдаёт свой результат и сторож ему не мешает.
//
//   node tools/check-replay-guard.js
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
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  try{
    if(typeof playReplayGuarded!=='function') fail('сторожа нет в сборке');
    if(!(REPLAY_GUARD_MS>0)) fail('REPLAY_GUARD_MS не задан');
    const realPlay=ZoneReplay.play;

    // 1. Реплей, который никогда не заканчивается.
    ZoneReplay.play=function(){ return new Promise(function(){}); };
    skipAnimation=false;
    const t0=Date.now();
    // Сторож ждёт REPLAY_GUARD_MS; чтобы не держать пробу минуту, гоняем его
    // на укороченном ожидании — через ту же функцию, но с подменённой паузой.
    const keep=REPLAY_GUARD_MS;
    REPLAY_GUARD_MS=300;
    const guarded=playReplayGuarded({}, [], {});
    const v=await Promise.race([guarded,
      new Promise(r=>setTimeout(()=>r('ЗАВИС'), 8000))]);
    if(v==='ЗАВИС') fail('сторож не разбудил вечный реплей');
    if(v!==false) fail('сторож вернул '+v+', ждали false');
    if(!skipAnimation) fail('сторож не поднял скип — кадры будут рисоваться поверх');
    out.steps.push('вечный реплей прерван за '+(Date.now()-t0)+'мс, скип поднят');

    // 2. Обычный реплей доходит сам и отдаёт свой ответ.
    REPLAY_GUARD_MS=keep;
    ZoneReplay.play=function(){ return Promise.resolve(true); };
    skipAnimation=false;
    const ok=await playReplayGuarded({}, [], {});
    if(ok!==true) fail('нормальный реплей отдал '+ok);
    if(skipAnimation) fail('сторож поднял скип там, где всё прошло штатно');
    out.steps.push('штатный реплей отдаёт свой результат, скип не трогается');

    ZoneReplay.play=realPlay;
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccguard-'));
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
console.log('зависший реплей не может остановить вечер');
