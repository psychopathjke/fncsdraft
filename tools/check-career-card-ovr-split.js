// Разбивка рейтинга под числом карточки. Тестер 5.10 (Notion «05»): «чтобы на
// карточке показывался настоящий рейтинг, а не с учётом каких-то плюсов за страну
// и возраст, путает это». Решение: большое число — сумма (как с 21.08), под ним
// мелко «база +пинг +возраст».
//
// Проверяется: у карточки карьеры строка есть и база + прибавки = число (ниже
// потолка шкалы), у карточки сцены без прибавок строки нет.
//
//   node tools/check-career-card-ovr-split.js
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
      v:1, player:{nick:'Split', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:66, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const me=careerCard(), a=attrsFor(me);
    const ping=Math.round(me._pingEdge||0), age=Math.round(me._ageEdge||0);
    check('у карточки карьеры есть прибавки', ping || age, ping+'/'+age);
    const box=document.createElement('div'); box.innerHTML=futCardHTML(me, {}); document.body.appendChild(box);
    const big=box.querySelector('.fut-ovr'), split=box.querySelector('.fut-ovr-split');
    check('строка разбивки под числом', !!split, box.innerHTML.slice(0,200));
    if(split){
      const nums=split.textContent.trim().split(/\\s+/).map(t=>Number(t.replace('−','-')));
      check('первое число — база', nums[0]===Math.round(a.ovr), split.textContent+' vs '+a.ovr);
      const sum=nums.reduce((x,y)=>x+y, 0);
      check('база + прибавки = число карточки', Math.min(CAREER_SCALE_TOP, sum)===Number(big.textContent), split.textContent+' → '+big.textContent);
      out.steps.push('карточка карьеры: '+big.textContent+' / '+split.textContent);
    }
    box.remove();
    // Карточка сцены: ни пинга, ни возраста — строки нет.
    const other=PLAYERS.find(p=>p && p.rating && !p._pingEdge && !p._ageEdge);
    const box2=document.createElement('div'); box2.innerHTML=futCardHTML(other, {});
    check('у карточки сцены строки нет', !box2.querySelector('.fut-ovr-split'));
    out.steps.push('карточка сцены ('+other.handle+'): без разбивки');
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccovrsplit-'));
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
console.log('the card prints base and both edges under the number');
fs.rmSync(dir, { recursive: true, force: true });
