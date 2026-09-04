// Место на Championship идёт по таблице ниже, если у команды оно уже есть.
//
// Его просьба, 31 августа: «когда финалы релоуд капа играешь и входишь в топ
// три для квала на лан, но ты уже и так в квале — квал переходил по таблице
// ниже, как в игре». Проверяется само правило (ccRelHoldsSeat + awardSeats),
// а не целый вечер: вечер стоит четыре минуты, а решает здесь одна функция.
//
//   node tools/check-career-reload-seat-rolldown.js
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
(function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    // Комната финала: двадцать дуо, ты — одна из них.
    const team = (n) => ({name:'T'+n, squad:[{handle:'a'+n}, {handle:'b'+n}]});
    const mk = (youAt) => { const rows=[]; for(let i=1;i<=20;i++) rows.push(team(i));
      const you=rows[youAt-1]; you.name='You'; you.isYou=true; return {rows:rows, you:you}; };
    const seed = (ewc, relSeats, season) => { CAREER = {player:{nick:'Probe', ovr:88, region:'EU'},
      career:{season:season||1, day:'2026-06-26', division:1, log:[], news:[],
              ewc:ewc||[], relSeats:relSeats||[]}}; };
    const seats = (r) => { CC_REL_HELD = ccRelHoldsSeat(r.you);
      const s = awardSeats(r.rows, 3, holdsLanSeat); CC_REL_HELD = null;
      return s.map(t => t.name); };

    // 1. Обычный финал: места берут первые три.
    let r = mk(1); seed([], []);
    out.notes.plain = seats(r);
    check('первый финал — топ-3', String(out.notes.plain) === 'You,T2,T3', String(out.notes.plain));

    // 2. Место у тебя уже есть: твоё первое место остаётся твоим, а путёвка
    //    уходит четвёртому.
    r = mk(1); seed([{series:1, place:1, day:'2026-03-14'}], []);
    out.notes.mine = seats(r);
    check('уже в квале — место идёт ниже', String(out.notes.mine) === 'T2,T3,T4', String(out.notes.mine));

    // 3. То же про чужую команду: кто взял место в прошлом финале, второго не берёт.
    r = mk(5); seed([], [{s:1, h:['a2','b2']}]);
    out.notes.other = seats(r);
    check('чужое место тоже пропускается', String(out.notes.other) === 'T1,T3,T4', String(out.notes.other));

    // 4. Двое уже с местами — путёвки доезжают до пятого.
    r = mk(1); seed([{series:1, place:2, day:'2026-03-14', season:1}], [{s:1, h:['a3','b3']}]);
    out.notes.two = seats(r);
    check('двое с местами — до пятого', String(out.notes.two) === 'T2,T4,T5', String(out.notes.two));

    // 5. Новый сезон — новые места: прошлогодние никого не держат.
    r = mk(1); seed([{series:1, place:2, day:'2026-03-14', season:1}], [{s:1, h:['a3','b3']}], 2);
    out.notes.season2 = seats(r);
    check('в новом сезоне места разыгрываются заново',
          String(out.notes.season2) === 'You,T2,T3', String(out.notes.season2));

    // 6. Память круга: пишем взявших, себя не пишем, и с номером сезона.
    r = mk(1); seed([], []);
    const cr = CAREER.career;
    ccRelSeatsKeep(cr, new Set([r.you, r.rows[1], r.rows[2]]), r.you);
    out.notes.keep = JSON.stringify(cr.relSeats);
    check('в память попадают только чужие',
          out.notes.keep === '[{"s":1,"h":["a2","b2"]},{"s":1,"h":["a3","b3"]}]', out.notes.keep);

    // 7. Вне вечера Reload вопрос про место снова про Глобалы: хук снят.
    check('хук снят после вечера', CC_REL_HELD === null, String(CC_REL_HELD));
    check('без хука команда без места не считается сидящей',
          holdsLanSeat(mk(1).rows[7]) === false);

    // 8. И вечеру есть чем это сказать — на всех пяти языках, с именем того,
    //    кому путёвка ушла.
    CC_LANGS.forEach(code => {
      LANG = code;
      const card = L().ccRelSeatPass('T4'), have = L().ccRelSeatHave,
            news = L().ccNewsRelSeatPass(2, 1, 'T4');
      check('карточка называет команду (' + code + ')', card.indexOf('T4') >= 0, card);
      check('лента называет команду (' + code + ')', news.indexOf('T4') >= 0, news);
      check('есть и строка без команды (' + code + ')', have.length > 10, have);
    });
    LANG = 'ru';
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
</script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'relseat-'));
process.on('exit', () => { try { fs.rmSync(dir, {recursive: true, force: true}); } catch (e) {} });
fs.writeFileSync(path.join(dir, 'p.html'),
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
['maps.js','zone-sim.js','zone-replay.js','mp.js'].forEach(f => {
  try { fs.copyFileSync(path.join(ROOT, f), path.join(dir, f)); } catch (e) {}
});
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + path.join(dir, 'p.html').split(path.sep).join('/')],
  {maxBuffer: 512*1024*1024, encoding: 'utf8', stdio: ['ignore','pipe','ignore']});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
Object.keys(out.notes).forEach(k => console.log('  ' + k + ': ' + out.notes[k]));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('OK');
