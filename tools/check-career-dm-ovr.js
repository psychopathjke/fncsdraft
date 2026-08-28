/* Инбокс показывает тот же рейтинг, что и всё остальное.

   Его скрин, 22 августа: в списке «кто пишет» стояли Scroll 89, Tjino 87,
   charyy 86, vic0 89 — при настоящих 96, 93, 89 и 93. Вопрос был «почему у них
   упали статы».

   Не упали. careerDmPool отдавал `ovr:p._ovr` голым — единственное место в
   файле, где число берут без запасного пути; везде рядом написано
   `p._ovr!=null ? p._ovr : attrsFor(p).ovr`. А _ovr появляется только там, где
   карточку уже подняли (ccSceneLift, сезонный рейтинг), и до подъёма его нет
   вовсе.

   Ловушка в том, что число пишется ОДИН раз, когда тред создаётся, и живёт
   дальше само. Поэтому проверять надо ровно то, что кладётся в тред, а не то,
   что можно было бы пересчитать при отрисовке.

   node tools/check-career-dm-ovr.js
*/
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome не найден'); process.exit(2); }

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={divs:[], err:null};
  const done=()=>{
    try{
      // Дивизион 1 — единственный, где инбокс населён настоящими людьми, и
      // единственный, где есть с чем сверять. Ниже него список выдуман, и это
      // намеренно: photos/ — это дивизион 1, и настоящий ник в пятом дивизионе
      // пришёл бы с лицом мейджорного игрока.
      [1,3].forEach(div=>{
        localStorage.clear();
        careerEntry();
        ccPickRole('roleFRG'); ccPickDiv(div); ccPickRegion('EU'); ccPickCountry('de');
        const n=document.getElementById('ccNick');
        n.value='Ovr'+div; n.dispatchEvent(new Event('input',{bubbles:true}));
        if(typeof ccSync==='function') ccSync();
        document.getElementById('ccStart').click();
        const season=ccSeasonOvr();
        const pool=careerDmPool();
        out.divs.push({div:div, real:ccRealNamesHere(),
          rows: pool.map(p=>({h:String(p.handle||''), ovr:p.ovr, roster:!!p.roster,
            season: season.get('EU|'+String(p.handle||'').toLowerCase())||null}))});
      });
    }catch(e){ out.err=String(e&&e.stack||e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dmovr-'));
const tmp = dir + '/index.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + fwd(ROOT) + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + fwd(tmp)], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.error('  БАГ  ' + what); }
                             else console.log('  ok   ' + what); };

out.divs.forEach(d => {
  console.log('\nдивизион ' + d.div + ' — настоящие имена: ' + d.real);
  d.rows.forEach(r => console.log('   ' + r.h.padEnd(16) + 'инбокс ' + String(r.ovr).padStart(3) +
    '   сезон ' + String(r.season == null ? '—' : r.season).padStart(3) +
    (r.season != null && r.ovr !== r.season ? '   ✗' : '')));
});
console.log('');

const d1 = out.divs.find(d => d.div === 1);
const d3 = out.divs.find(d => d.div === 3);
check(!!d1 && d1.rows.length > 0, 'инбокс дивизиона 1 не пустой');
check(d1.rows.every(r => r.ovr != null),
      'ни одна строка не пришла без рейтинга' +
      (d1.rows.some(r => r.ovr == null) ? ' (' + d1.rows.filter(r => r.ovr == null).length + ' пустых)' : ''));
const off = d1.rows.filter(r => r.season != null && r.ovr !== r.season);
check(off.length === 0, 'рейтинг в инбоксе совпадает с сезонным' +
      (off.length ? ': ' + off.map(r => r.h + ' ' + r.ovr + '≠' + r.season).join(', ') : ''));
check(d1.rows.some(r => r.roster), 'в дивизионе 1 это настоящие люди с ростера');
// И то, ради чего список ниже дивизиона 1 выдуман: там сверять не с чем, но
// пустых чисел быть тоже не должно.
check(!!d3 && d3.rows.every(r => r.ovr != null),
      'ниже дивизиона 1 рейтинг тоже проставлен');

if (bad) { console.error('\nне сходится: ' + bad); process.exit(1); }
console.log('\nинбокс и ростер говорят одно и то же');
fs.rmSync(dir, { recursive: true, force: true });
