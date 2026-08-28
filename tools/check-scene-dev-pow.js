// Книга роста сцены доезжает до силы команды в лобби.
//
// В памяти это лежало как баг одиночного режима: CAREER.dev меняет рейтинг на
// карточке, а pow команды не двигается. Замер 26 августа показал другое —
// прибавка доезжает, а тот старый замер писал книгу РУКАМИ, минуя
// careerGrowField, и читал мир из кэшей, построенных до неё. Пул и снимок
// роастера живут до конца страницы, и вчерашняя сцена отвечала на вопрос про
// сегодняшнюю (та же ловушка, из-за которой появился ccWorldReset).
//
// Поэтому здесь две половины: настоящий путь обязан доезжать, а путь мимо
// сброса — обязан НЕ доезжать. Вторая половина не придирка: пока она красная,
// первая ничего не значит.
//
//   node tools/check-scene-dev-pow.js
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
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'DevProbe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const powOf = (field, handle) => {
      const t=field.find(x=>(x.squad||[]).some(c=>c && hKey(c.handle)===hKey(handle)));
      return t ? t.pow : null;
    };

    // ---- 1. настоящий путь: вечер отыгран, книга написана раннером --------
    const before=careerCupField(cr, [me], ccTeams(50), 'devcheck', false, 0);
    // Поднимаем того, кто выиграл вечер: настоящий человек своего же поля.
    const host=before.find(t=>(t.squad||[]).every(c=>c && c.handle) && !t.isYou);
    const who=host.squad[0].handle;
    const powWas=host.pow, ovrWas=attrsFor(host.squad[0]).ovr;
    out.notes.before={who:who, ovr:ovrWas, pow:powWas};

    // Вечер, в котором эта команда первая, а игрок последний: careerGrowField
    // двигает книгу и сам же выбрасывает кэши мира — это и проверяется.
    const you={squad:[me], isYou:true, stagePts:0, wins:0, stageElims:0,
               pow:70, name:'you'};
    const field=[you].concat(before.filter(t=>!t.isYou));
    field.forEach((t,i)=>{ t.stagePts = t===host ? 900 : (t===you ? 0 : 100+i);
                           t.wins = t===host ? 5 : 0;
                           t.stageElims = t===host ? 60 : 5; });
    let moved=0;
    for(let n=0;n<8;n++) moved+=careerGrowField(field, you);
    out.notes.moved=moved;
    check('вечера сдвинули сцену', moved>0, String(moved));
    check('и книга про него знает', careerDevOf({handle:who})>0,
          String(careerDevOf({handle:who})));

    /* Сравниваются ОДНИ И ТЕ ЖЕ два ника, а не «команда с тем же номером»:
       после сдвига пул пересобирается, пары расходятся (careerGrowField умеет
       и это), и та же самая двойка в новом поле может не встретиться вовсе —
       первый заход проверки так и получил null вместо силы. Карточка берётся
       той же дорогой, какой её берёт лобби: сначала пул, потом ростер с
       поднятым рейтингом. */
    const cardOf = h => {
      const pool=careerPools();
      const inPool=(pool.players||[]).find(c=>hKey(c.handle)===hKey(h)) ||
        ((pool.duos||[]).flatMap(d=>d.cards).find(c=>hKey(c.handle)===hKey(h)));
      if(inPool) return inPool;
      const raw=PLAYERS.find(p=>hKey(p.handle)===hKey(h));
      return raw ? ccSceneLift({...raw}) : null;
    };
    const sameTwo=host.squad.map(c=>c.handle);
    const now=sameTwo.map(cardOf).filter(Boolean);
    const powNow=now.length===sameTwo.length ? buildTeam(now).pow : null;
    out.notes.after={pow:powNow, ovr:now[0] ? attrsFor(now[0]).ovr : null,
                     dev:careerDevOf({handle:who})};
    check('карточка в лобби поднялась', now[0] && attrsFor(now[0]).ovr>ovrWas,
          ovrWas + ' -> ' + (now[0] ? attrsFor(now[0]).ovr : '—'));
    check('прибавка доехала до силы команды в лобби', powNow>powWas,
          powWas + ' -> ' + powNow);

    // ---- 2. контроль: мимо сброса она не доезжает -------------------------
    // Ровно так мерил старый замер — и поэтому решил, что мир растёт только
    // на бумаге.
    const after2=careerCupField(cr, [me], ccTeams(50), 'devcheck2', false, 0);
    const other=after2.find(t=>(t.squad||[]).every(c=>c && c.handle) && !t.isYou &&
                              !t.squad.some(c=>hKey(c.handle)===hKey(who)));
    const who2=other.squad[0].handle, powWas2=other.pow;
    CAREER.dev[hKey(who2)]=(CAREER.dev[hKey(who2)]||0)+8;   // руками, без сброса
    const stale=careerCupField(cr, [me], ccTeams(50), 'devcheck2', false, 0);
    out.notes.control={who:who2, pow:powOf(stale, who2), was:powWas2};
    check('контроль: без сброса мира прибавка не видна',
          powOf(stale, who2)===powWas2, powWas2 + ' -> ' + powOf(stale, who2));
    // А со сбросом — видна, и это тот же ccWorldReset, что чинит командную.
    ccWorldReset();
    const fresh=careerCupField(cr, [me], ccTeams(50), 'devcheck2', false, 0);
    out.notes.control.afterReset=powOf(fresh, who2);
    check('а со сбросом — видна', powOf(fresh, who2)>powWas2,
          powWas2 + ' -> ' + powOf(fresh, who2));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'devpow-'));
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
console.log('сцена растёт не только на бумаге: прибавка доезжает до лобби');
fs.rmSync(dir, { recursive: true, force: true });
