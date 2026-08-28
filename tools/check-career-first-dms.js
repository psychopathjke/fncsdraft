// Первые письма в новой карьере — каждый раз от разных людей.
//
// Просьба игрока, 24 августа (страница «bags» в Notion): «чтобы при создании
// новой карьеры не одни и те же каждый раз предлагали дуо, а менялись первые
// тиммейты с предложением».
//
// Так и было: бросок в careerSeatDm сеялся сезоном и днём, а у новой карьеры
// это всегда сезон 1 и один и тот же стартовый день. Соль карьеры (cr.seed,
// см. ccCareerSeed) ставится один раз при создании и лежит в сейве — значит
// разные карьеры получают разный инбокс, а ОДНА карьера после перезагрузки
// получает тот же самый.
//
// Проба заводит десять карьер с одинаковыми входными данными и смотрит, кто
// написал первым; потом перезагружает одну из них и требует тот же список.
//
//   node tools/check-career-first-dms.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RUNS = 10;
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
  const out={lists:[], reload:null, errs:null, fail:null};
  try{
    /* Одна и та же карьера, заведённая заново: ник, дивизион, овер, день — всё
       совпадает, различаться может только соль. Заводится тем же путём, каким
       её заводит игрок: ccStart собирает CAREER и кладёт его в localStorage. */
    const make=()=>{
      localStorage.removeItem('fncsdraft_career');
      CC.diff='easy'; CC.div=4; CC.nick='Sameguy'; CC.age=17; CC.country='de';
      CC.role='roleIGL'; CC.sex='m'; CC.photo=null; CC.card=null;
      CC.spa=null;
      ccStart();
      careerSeatTopUp();
      return careerDms().filter(t=>t.state==='offer' && !t.who.org && !t.who.brand)
        .map(t=>t.who.handle);
    };
    for(let i=0;i<${RUNS};i++) out.lists.push(make());

    // И та же карьера после перезагрузки — тот же инбокс.
    const saved=localStorage.getItem('fncsdraft_career');
    const before=careerDms().filter(t=>t.state==='offer' && !t.who.org && !t.who.brand)
      .map(t=>t.who.handle);
    localStorage.setItem('fncsdraft_career', saved);
    careerEntry();
    careerSeatTopUp();
    const after=careerDms().filter(t=>t.state==='offer' && !t.who.org && !t.who.brand)
      .map(t=>t.who.handle);
    out.reload={before:before, after:after};
    out.seed=(CAREER.career||{}).seed||null;
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccdms-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:256*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }

let bad = 0;
const say = (ok, s) => { console.log((ok ? '  ok  ' : ' FAIL ') + s); if (!ok) bad++; };
const keys = out.lists.map(l => l.join(','));
const uniq = new Set(keys);
out.lists.slice(0, 4).forEach((l, i) => console.log('  карьера ' + (i + 1) + ': ' + l.join(', ')));
const all = new Set(); out.lists.forEach(l => l.forEach(h => all.add(h)));
console.log('  всего разных имён за ' + out.lists.length + ' карьер: ' + all.size + ' (' + [...all].slice(0, 12).join(', ') + ')');
say(out.lists.every(l => l.length > 0), 'в новой карьере кто-то пишет');
// Десять карьер подряд с одним и тем же входом: одинаковых списков быть не
// должно. Порог — «больше половины разные», чтобы совпадение двух случайных
// бросков не красило пробу.
say(uniq.size >= Math.ceil(out.lists.length * 0.6),
    'первые письма разные: ' + uniq.size + ' разных списков из ' + out.lists.length);
// И это РАЗНЫЕ ЛЮДИ, а не тот же пул в другом порядке: до правки
// careerSeed не знал про карьеру, и десять карьер видели одни и те же
// четыре имени. Порог — по двое новых на карьеру; общий пул даёт единицы.
say(all.size >= out.lists.length * 2,
    'и это разные люди: ' + all.size + ' разных имён за ' + out.lists.length + ' карьер');
say(out.reload && out.reload.before.join(',') === out.reload.after.join(','),
    'перезагрузка отдаёт тот же инбокс',
    out.reload ? out.reload.before.join(',') + ' → ' + out.reload.after.join(',') : '');
say(!!out.seed, 'у карьеры есть своя соль: ' + out.seed);
if ((out.errs || []).length) { console.error('page errors: ' + out.errs.join(' | ')); bad++; }
process.exit(bad ? 1 : 0);
