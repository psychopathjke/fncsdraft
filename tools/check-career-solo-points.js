// Соло считается одной сеткой на все свои этапы.
//
// В хитах стояло «плюс 940 за первое место», то есть победа 1000 против 53 за
// второе: одна победа стоила двадцати вторых мест, и вечер решался только тем,
// взял ли ты Виктори. Замер 27 августа: две победы и четыре смерти на высадке
// (среднее место 46) давали первое место в таблице, а ровный вечер без побед
// не догонял никогда. Его слова: «соло хитс сделай такую поинт систему,
// которая нужна».
//
// Здесь стережётся то, что теперь верно: сетка у хитов та же, что у
// квалификации и финала; ровный вечер обгоняет вечер из двух побед и четырёх
// смертей; и победа при этом остаётся самой дорогой строкой.
//
//   node tools/check-career-solo-points.js [папка сборки]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
    const места=[1,2,3,4,5,10,15,25,40,50,51,75,100];
    const хиты=места.map(soloHeatsPoints), общая=места.map(victoryR1Points);
    out.notes.сетка={места:места, хиты:хиты, квалификацияИфинал:общая};
    check('у хитов та же сетка, что у остальных соло-этапов',
          хиты.join(',')===общая.join(','), хиты.join(',')+' против '+общая.join(','));
    check('победы больше нет в тысячу очков', soloHeatsPoints(1)<200,
          String(soloHeatsPoints(1)));

    /* Вечер из шести игр, килл по CC_SOLO_KILL. Две победы и четыре смерти на
       высадке против ровного вечера в топ-10 без побед. */
    const вечер=(места, killsPerGame)=>места.reduce((s,p)=>
      s+soloHeatsPoints(p)+(killsPerGame||0)*CC_SOLO_KILL, 0);
    const дваВиктори=вечер([1,1,90,95,88,99], 1);
    const ровный=вечер([8,9,12,7,10,11], 2);
    out.notes.вечера={двеПобедыИчетыреСмерти:дваВиктори, ровныйБезПобед:ровный};
    check('ровный вечер обгоняет две победы с четырьмя смертями',
          ровный>дваВиктори, ровный+' против '+дваВиктори);

    // Контроль: победа всё равно самая дорогая игра вечера.
    check('контроль: победа дороже любого другого места',
          места.filter(p=>p>1).every(p=>soloHeatsPoints(1)>soloHeatsPoints(p)),
          'победа '+soloHeatsPoints(1)+', второе '+soloHeatsPoints(2));
    // И контроль в другую сторону: сетка вообще убывает и ниже 50-го даёт ноль.
    check('контроль: сетка убывает',
          места.every((p,i)=>i===0||soloHeatsPoints(места[i-1])>=soloHeatsPoints(p)),
          хиты.join(','));
    check('контроль: ниже пятидесятого места очков нет',
          soloHeatsPoints(51)===0 && soloHeatsPoints(100)===0,
          soloHeatsPoints(51)+'/'+soloHeatsPoints(100));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'solopts-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('соло считается одной сеткой');
fs.rmSync(dir, { recursive: true, force: true });
