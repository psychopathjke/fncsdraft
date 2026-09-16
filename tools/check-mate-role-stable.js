// «Почему тип из игла у меня в команде становится фраггером со временем?» —
// его вопрос 16 сентября 2026. Подтяжка карточки к рейтингу (attrsFor,
// _targetOvr) прибавляла всем статам одно число и резала на 99: у растущего
// напарника сильная половина упиралась в потолок, слабая догоняла — и роль по
// профилю переворачивалась. Теперь роль берётся с сырого профиля, до подтяжки.
//
// Проверка: у всех карточек ростера EU роль при подъёме на +5, +10, +15, +20
// (ccMateLift) та же, что без подъёма.
//
//   node tools/check-mate-role-stable.js
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
(function(){
  const out = {fail:null, flips:[], n:0};
  try{
    const cards=careerRosterNowEU();
    cards.forEach(c=>{
      const base=(attrsFor({...c})||{}).roleKey; if(!base) return;
      out.n++;
      [5,10,15,20].forEach(dev=>{
        const l=ccMateLift({...c}, dev);
        const r=(attrsFor(l)||{}).roleKey;
        if(r!==base && out.flips.length<20) out.flips.push(c.handle+' +'+dev+': '+base+' → '+r);
      });
    });
  } catch(e){ out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrole-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the check produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('  карточек: ' + out.n);
if (out.flips.length) { console.error('FAILED: роль меняется с ростом: ' + out.flips.join(' | ')); process.exit(1); }
console.log('OK mate-role-stable');
