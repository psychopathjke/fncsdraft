// Команда соперника по гонке — та же, что у него самого, до атрибута.
//
// Его скрин 10.09 («Notion ошибка») и годовая проба: вечер расходится на игре 2,
// «table,rolls @ #30», причём БРОСКОВ поровну, поле одно и силы равны. Столько же
// бросков при разном исходе значит, что движку дали разные ЧИСЛА: он читает у
// команды attrs (skill, seek, power в createSquads) и team.squad.length, а сверка
// поля равняет только ники и силу. Проверяем ровно это: своя команда у себя и та
// же команда, собранная из строки гонки у соперника (ccRacePackCard →
// ccRaceRivalTeam через JSON, как по проводу).
//
//   node tools/check-race-rival-team.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
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
  const seed = (nick, ovr, role, life) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:nick, age:(life.age||19), source:'rookie', country:(life.country||'de'), countryPing:(life.ping!=null?life.ping:15),
              closeRangeEdge:(life.close||0), livesIn:life.livesIn||null, region:'EU', ovr:ovr, role:role,
              attrs:ccRookieAttrs(ovr, role), ageEdge:(life.ageEdge||0), photo:null,
              handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2}, life.career||{}),
      gear:life.gear||{own:[], conf:0},
      partners:life.partners||[]
    }));
    careerLoad();
  };
  const wire = o => JSON.parse(JSON.stringify(o));
  try {
    CARD_MODE = true; squadSize = 2;
    // Настоящая карточка сцены в напарники — у неё есть и _r, и рейтинг, и роль.
    const snap = ccSnapshotNow();
    const pool = [...ccPeopleOf(snap.playIn).values()].filter(c => c && c.handle && c.rating >= 85);
    out.notes.pool = pool.length;
    const mate = pool[3];
    check('в сцене нашёлся напарник', !!mate);
    if(!mate) throw new Error('no mate card');

    seed('Alpha', 94, 'roleIGL', {age:17, ageEdge:4, career:{form:3, grind:6},
                                  partners:[{handle:mate.handle, since:'2026-02-01', patience:80}]});
    const me = careerCard();
    // Так вечер собирает СВОЮ команду.
    const mine = careerYouTeam([me, mate]);
    // Так она уезжает сопернику и так он её собирает.
    const line = wire({id:'zz', card: ccRacePackCard(me), mates: [ccRacePackCard(mate)],
                       pow: mine.pow, edge: mine.closeEdge, squad: 2, ev: 'ev1'});
    const his = ccRaceRivalTeam(line);
    check('соперник собрал команду', !!his);
    out.notes.mine = {pow: mine.pow, attrs: mine.attrs, edge: mine.closeEdge,
                      squad: mine.squad.map(c => c.handle).join('+')};
    out.notes.his  = his ? {pow: his.pow, attrs: his.attrs, edge: his.closeEdge,
                      squad: (his.squad||[]).map(c => c.handle).join('+')} : null;
    if(his){
      check('состав тот же', mine.squad.map(c=>c.handle).join('+') === (his.squad||[]).map(c=>c.handle).join('+'));
      check('сила та же', mine.pow === his.pow, mine.pow + ' vs ' + his.pow);
      check('край ближнего боя тот же', (mine.closeEdge||0) === (his.closeEdge||0), (mine.closeEdge||0) + ' vs ' + (his.closeEdge||0));
      // ВОТ ОНО: движок читает attrs (createSquads → skill/seek/power).
      check('АТРИБУТЫ ДЛЯ ДВИЖКА ТЕ ЖЕ', JSON.stringify(mine.attrs||null) === JSON.stringify(his.attrs||null),
            JSON.stringify(mine.attrs||null) + ' vs ' + JSON.stringify(his.attrs||null));
      // И по карточкам — чтобы было видно, чья именно поехала.
      const pair = (a, b) => (a||[]).map((c,i) => c.handle + ' ' + JSON.stringify(attrsFor(c)) + ' | ' + JSON.stringify(attrsFor((b||[])[i]||{})));
      out.notes.cards = pair(mine.squad, his.squad);
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccrivteam-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f));
if (out.fails.length) process.exit(1);
console.log('команда соперника по гонке совпадает с его собственной до атрибута');
