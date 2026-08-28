// Кнопки в менюшках выбора — покрашенные, а не браузерные.
//
// Базовое правило .ch-sign перечисляет модалки ПО ИМЕНИ, потому что они висят
// на body и не видят #screen-career-hub. Список — это список: окно выбора клуба
// (#clubPickModal) написали позже и в него не дописали, и шесть кнопок
// «Попросить» вышли белыми системными. Его скрин 26 августа, обведены красным,
// и слово: «сделай кнопочки нормальные».
//
// Поэтому проверяется не одно окно, а ВСЕ: в каждой менюшке рисуется строка
// .cc-buys > .cc-buy > .ch-sign и спрашивается её настоящий цвет. Белая кнопка
// (то есть краска не доехала) — красное.
//
//   node tools/check-pick-buttons.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // Жёлтый — тот самый, которым красится кнопка в хабе. Берётся с живой
    // кнопки хаба, а не вписывается числом: поменяют краску — проверка
    // поедет за ней, а не станет врать.
    const probe = (host) => {
      const wrap=document.createElement('div');
      wrap.className='cc-buys';
      wrap.innerHTML='<div class="cc-buy"><div class="cc-buy-in"><b>X</b></div>'+
                     '<button class="ch-sign">Y</button></div>';
      host.appendChild(wrap);
      const b=wrap.querySelector('.ch-sign');
      const cs=getComputedStyle(b);
      const got={bg:cs.backgroundColor, radius:cs.borderRadius, weight:cs.fontWeight,
                 up:cs.textTransform, w:Math.round(b.getBoundingClientRect().width)};
      wrap.remove();
      return got;
    };
    const hub=document.getElementById('screen-career-hub');
    const want=probe(hub);
    out.notes.эталон=want;
    check('в хабе кнопка вообще покрашена',
          want.bg !== 'rgba(0, 0, 0, 0)' && want.bg !== 'rgb(255, 255, 255)', JSON.stringify(want));

    ['agentPickModal','clubPickModal','smmPickModal','coachPickModal',
     'mktPickModal','duoFindModal'].forEach(function(id){
      const m=document.getElementById(id);
      if(!m){ check('окно ' + id + ' есть в разметке', false); return; }
      // Окно скрыто, но getComputedStyle читает правила и так — важно, чтобы
      // оно было в потоке: display:none у родителя ширину обнуляет.
      const was=m.style.display; m.style.display='flex';
      const got=probe(m);
      m.style.display=was;
      out.notes[id]=got;
      check(id + ': кнопка того же цвета, что в хабе', got.bg === want.bg,
            got.bg + ' вместо ' + want.bg);
      check(id + ': и та же форма', got.radius === want.radius && got.weight === want.weight &&
            got.up === want.up, JSON.stringify(got));
    });
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pickbtn-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--window-size=1400,1000',
  '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('во всех менюшках кнопки покрашены одинаково');
fs.rmSync(dir, { recursive: true, force: true });
