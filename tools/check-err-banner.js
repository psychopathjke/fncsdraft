// Упавший прогон говорит, что упало.
//
// Его сообщения 24 августа — «не работает таблица», «не делается симуляция
// просто» — и скрин застывшего вечера. Так выглядит исключение, улетевшее из
// раннера: экран остаётся как есть, текст ошибки уходит в консоль, игрок видит
// пустую таблицу и не знает ничего.
//
// Проверяется то, что теперь видит игрок, и то, что плашка не мешает жить:
// не всплывает на 404 картинки, не заваливает экран десятком копий и не ловит
// штатную отмену прогона.
//
//   node tools/check-err-banner.js
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

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  const wait=ms=>new Promise(r=>setTimeout(r, ms));
  const boxes=()=>document.querySelectorAll('.cc-err');
  try{
    if(boxes().length) fail('плашка висит с самого начала');

    // ---- исключение из промиса ------------------------------------------
    Promise.reject(new Error('подстроенная поломка вечера'));
    await wait(60);
    if(boxes().length!==1) fail('плашек после падения: '+boxes().length+', ждали одну');
    const txt=boxes()[0].textContent||'';
    if(txt.indexOf('подстроенная поломка вечера')<0)
      fail('в плашке нет текста ошибки: '+txt.slice(0,140));
    if(!boxes()[0].querySelector('.cc-err-copy')) fail('нет кнопки «скопировать»');
    out.steps.push('падение показывает текст ошибки и кнопку копирования');

    // ---- закрывается ------------------------------------------------------
    boxes()[0].querySelector('.cc-err-x').click();
    if(boxes().length) fail('плашка не закрылась');
    out.steps.push('плашка закрывается');

    // ---- не заваливает экран ---------------------------------------------
    for(let i=0;i<8;i++) Promise.reject(new Error('поломка '+i));
    await wait(90);
    if(boxes().length>3) fail('на экране '+boxes().length+' плашек — потолок не держит');
    out.steps.push('десять падений подряд дают не больше трёх плашек ('+boxes().length+')');
    [...boxes()].forEach(b=>b.remove());

    // ---- 404 картинки — не поломка ---------------------------------------
    const было=CC_ERR_SHOWN;
    const img=document.createElement('img');
    img.src='photos/__нет-такого-файла__.jpg';
    document.body.appendChild(img);
    await wait(200);
    if(CC_ERR_SHOWN!==было) fail('404 картинки всплыло как поломка');
    img.remove();
    out.steps.push('не отдавшаяся картинка плашку не поднимает');

    // ---- отменённый прогон — штатный выход, а не поломка ------------------
    CC_ERR_SHOWN=0;
    ccErrShow(RUN_ABANDONED);
    if(boxes().length) fail('отмена прогона показалась как поломка');
    out.steps.push('отмена прогона (RUN_ABANDONED) молчит');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccerr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('поломка на экране называет себя, закрывается и не мешает жить');
