// Тройки ботов переживают межсезонье — но не все.
//
// Жалоба его игрока, 24 августа (скрин на странице «bags»): «когда второй
// сезон начинается, чтобы каждый сезон тиммейты у ботов не менялись». Память
// третьих (cr.trios) чистилась начисто в careerNewSeason, и комната каждый год
// собиралась заново — лица, за которыми игрок следил сезон, исчезали разом.
//
// Совсем не чистить нельзя: если тройки стоят вечно, свободных третьих не
// остаётся, и карьере, потерявшей напарника, некого взять — это записано в
// комментарии у самой памяти. Его решение: «держаться, но часть распадается».
//
// Проверка требует ровно этого: большинство троек доживает до следующего
// сезона, часть расходится, а те, кого сезон развёл (CAREER.splits), уходят
// обязательно. Плюс сквозная: запомненный третий садится к своему ядру в
// комнате НОВОГО сезона.
//
//   node tools/check-career-trio-carry.js
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
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Carry', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;

    /* Сотня записанных троек и три развода. Ключи — как в careerCupField:
       два ника ядра через плюс, значение — ник третьего. */
    const memo={};
    for(let i=0;i<100;i++) memo['a'+i+'+b'+i]='c'+i;
    cr.trios=memo;
    CAREER.splits={'a1+b1':'2026-05-01', 'a2+b2':'2026-05-02', 'a3+b3':'2026-05-03'};
    const before=Object.keys(cr.trios).length;
    // Книга разводов — тоже вход межсезонья: стык пишет в неё и сам (трансферы
    // верхних пар, careerTrioRaids). Для повторного прогона её надо вернуть,
    // иначе второй заход считает ДРУГОЙ год, а не тот же самый.
    const splits0=JSON.stringify(cr.duoSplits||{});

    careerNewSeason();
    const after=Object.keys(cr.trios||{}).length;
    out.notes.before=before; out.notes.after=after;
    check('память троек пережила сезон', after>0, after+' из '+before);
    check('но не целиком — часть распалась', after<before, after+' из '+before);
    // Доля: бросок на сотне даёт 70±5, поэтому границы широкие, а не «ровно 70».
    check('доживает большинство', after>=before*0.55 && after<=before*0.85,
          after+' из '+before);
    ['a1+b1','a2+b2','a3+b3'].forEach(k=>
      check('развалившееся ядро '+k+' не носит третьего', !(cr.trios||{})[k]));

    /* И сквозная: тот же бросок при перезагрузке даёт тот же результат —
       иначе межсезонье пересобиралось бы на каждый заход в карьеру. */
    const snapshot=JSON.stringify(cr.trios);
    cr.trios=Object.assign({}, memo);
    // Разводы тоже назад: их стирает сам careerNewSeason, и без них второй
    // проход считал бы другое межсезонье — не потому, что бросок пляшет.
    CAREER.splits={'a1+b1':'2026-05-01', 'a2+b2':'2026-05-02', 'a3+b3':'2026-05-03'};
    cr.duoSplits=JSON.parse(splits0);  // и книга разводов тоже назад
    CC_POOLS=null;
    cr.season--;                       // назад на сезон и ещё раз
    careerNewSeason();
    check('межсезонье повторяемо', JSON.stringify(cr.trios)===snapshot);

    /* И плохой трио-сезон разводит пару на стыке года.

       Его слово, 28 августа: «пусть могут дуо распасться и собраться в хороший
       триос», и рядом — менять тиммейта можно, «когда сезон закончится, если
       плохие результаты». В трио-сезоне четыре провальных вечера подряд пишут
       пару в CAREER.lft («ищем третьего», его правило 27 августа: посреди
       сезона в трио никого не бросают); до сегодня этот ключ нигде не читался
       и умирал вместе с годом. Теперь он идёт туда же, куда дуо-разводы. */
    {
      const keepSplits=JSON.stringify(cr.duoSplits||{});
      const keepSeason=cr.season;
      const pair=(careerPools().duos||[])[0];
      const key=pair ? pair.cards.map(c=>hKey(c)).sort().join('+') : null;
      check('в пуле есть с чего начать', !!key, key||'пусто');
      if(key){
        // Контроль: без плохого сезона пара переживает стык.
        cr.season--; CC_POOLS=null;
        careerNewSeason();
        const aliveNoLft=(careerPools().duos||[]).some(d=>
          d.cards.map(c=>hKey(c)).sort().join('+')===key);
        CAREER.lft={}; CAREER.lft[key]='2026-06-01';
        cr.season--; CC_POOLS=null;
        careerNewSeason();
        const alive=(careerPools().duos||[]).some(d=>
          d.cards.map(c=>hKey(c)).sort().join('+')===key);
        check('контроль: без плохого сезона пара остаётся', aliveNoLft, key);
        check('пара с плохим трио-сезоном распалась', !alive, key);
        // И половинки не пропали: они либо в новой паре, либо свободны.
        const halves=key.split('+');
        const pool=careerPools();
        const seen=new Set();
        (pool.duos||[]).forEach(d=>d.cards.forEach(c=>seen.add(hKey(c))));
        (pool.players||[]).forEach(c=>seen.add(hKey(c)));
        check('обе половинки остались в сцене', halves.every(h=>seen.has(h)), key);
        const remade=(pool.duos||[]).find(d=>d.cards.some(c=>halves.indexOf(hKey(c))>=0));
        out.notes.remade=remade ? remade.cards.map(c=>c.handle).join(' & ') : null;
        out.notes.splitBook=Object.keys(cr.duoSplits||{}).length;
        out.notes.splitHasKey=!!(cr.duoSplits||{})[key];
      }
      // Состояние назад: дальше проверяется повторяемость межсезонья, и лишние
      // разводы в книге сделали бы второй проход другим годом.
      CAREER.lft={};
      cr.duoSplits=JSON.parse(keepSplits);
      cr.season=keepSeason;
      CC_POOLS=null;
      cr.trios=Object.assign({}, memo);
    }

  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctrio2-'));
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
out.steps.forEach(s => console.log(s));
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) process.exit(1);
console.log('тройки живут дольше сезона, но не вечно');
