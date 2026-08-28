/* Допуск к стадиям Reload.

   Стадия — это окно в несколько дней, а не один вечер: отборы капа 1 идут с 8
   по 16 января, плей-ин с 23 по 28. Значит одна и та же стадия предлагается
   много раз подряд, и правило, кого она пускает, должно различать две вещи,
   которые легко слипаются:

     проиграл вечер  → окно ещё открыто, приходи завтра;
     выиграл вечер   → окно для тебя закрыто, ты уже дальше.

   Раньше стояло "не ниже предыдущей ступени", а got поднимается ровно на одну
   ступень за успех — поэтому пройденная стадия оставалась открытой, и человек с
   местом в финале мог во вторник сыграть плей-ин на вылет.

   Проверяется careerReloadCan напрямую, подставляя запись о прогрессе: тут
   нечего мерить статистикой, это таблица истинности.

   node tools/check-career-reload-gate.js
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
  const out={rows:[], days:{}, err:null};
  const done=()=>{
    try{
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Gate'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      // Сколько дней держится каждая стадия: если окно в один день, повтор
      // недостижим и правило ниже нечего охранять. Пусть тест это знает.
      const days={};
      careerYearDays().forEach((list, iso)=>{
        list.forEach(e=>{
          const m=String(e.id||'').match(/^ReloadEliteSeries1(Opens|PlayIn|Heats|Final)$/);
          if(m) days[m[1]]=(days[m[1]]||0)+1;
        });
      });
      out.days=days;

      const cr=CAREER.career;
      const ev=st=>({series:1, set:'r1', stage:st, id:'ReloadEliteSeries1x', label:'x'});
      const can=(got, st)=>{
        cr.reload = got===null ? null : {series:1, got:got};
        return !!careerReloadCan(ev(st));
      };
      // got — последняя ПРОЙДЕННАЯ стадия. null значит "ещё ничего".
      [[null,'open',true,  'первый заход в отборы'],
       [null,'playin',false,'плей-ин без отборов'],
       [null,'heat',false, 'хиты без ничего'],
       ['open','open',false,'отборы уже пройдены'],
       ['open','playin',true,'плей-ин после отборов'],
       ['open','heat',false, 'хиты через голову плей-ина'],
       ['playin','playin',false,'плей-ин уже пройден'],
       ['playin','heat',true, 'хиты после плей-ина'],
       ['playin','final',false,'финал через голову хитов'],
       ['heat','heat',false, 'хиты уже пройдены'],
       ['heat','final',true, 'финал после хитов'],
       ['final','final',false,'финал уже сыгран'],
       ['final','heat',false, 'хиты при месте в финале'],
       ['final','playin',false,'плей-ин при месте в финале']
      ].forEach(([got, st, want, why])=>{
        out.rows.push({got:got, stage:st, want:want, got_:can(got, st), why:why});
      });
      // Чужая серия прогресс не открывает.
      cr.reload={series:2, got:'playin'};
      out.rows.push({got:'playin(кап 2)', stage:'heat', want:false,
                     got_:!!careerReloadCan(ev('heat')), why:'прогресс другого капа'});
    }catch(e){ out.err=String(e&&e.stack||e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relgate-'));
const tmp = dir + '/index.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + fwd(ROOT) + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=240000', '--dump-dom',
  'file:///' + fwd(tmp)], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }

console.log('окно стадии, дней: ' + JSON.stringify(out.days));
let bad = 0;
out.rows.forEach(r => {
  const ok = r.got_ === r.want;
  if (!ok) bad++;
  console.log((ok ? '  ok   ' : '  БАГ  ') +
    ('пройдено ' + String(r.got)).padEnd(24) +
    ('→ ' + r.stage).padEnd(12) +
    (r.got_ ? 'пускает' : 'не пускает').padEnd(12) + r.why);
});
// Окно в несколько дней — то, ради чего правило и нужно.
const wide = (out.days.Opens > 1) && (out.days.PlayIn > 1);
if (!wide) { console.error('\nотборы и плей-ин перестали быть многодневными — правило проверяет не то'); bad++; }
if (bad) { console.error('\nне сходится: ' + bad); process.exit(1); }
console.log('\nвсе ' + out.rows.length + ' случаев сходятся');
fs.rmSync(dir, { recursive: true, force: true });
