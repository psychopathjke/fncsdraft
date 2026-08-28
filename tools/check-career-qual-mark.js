// Куда квалифицировался — написано на карточке дня и помечено в календаре.
//
// careerSlotHeld знал про место давно, но называл его только там, где место
// ТЕРЯЮТ — в предупреждениях. Пока ничего не рвёшь, узнать, что впереди уже
// занятое тобой место, было неоткуда.
//
// Его правка, 26 августа: «можно ещё написать где-то в карьере, куда
// квальнулись, и в календаре цветом пометить».
//
// Проверяется и точность метки: она обязана лечь на дни СВОЕГО турнира и ни на
// один чужой. Календарь, который красит лишнее, читается как «я везде прошёл».
//
//   node tools/check-career-qual-mark.js
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
  const seed = (day) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
              attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day||'2026-04-10', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  // Какие дни года помечены при текущем месте.
  const marked = () => {
    const days = careerYearDays(), hit = [];
    [...days.keys()].sort().forEach(k => {
      if((days.get(k)||[]).some(ccQualOn)) hit.push(k);
    });
    return hit;
  };
  // Идентификаторы событий этих дней — по ним и видно, тот ли турнир.
  const idsOn = list => {
    const days = careerYearDays(), s = new Set();
    list.forEach(k => (days.get(k)||[]).forEach(e => s.add(e.id)));
    return [...s].sort();
  };
  try {
    // ---- места нет: ничего не помечено ------------------------------------
    seed();
    check('без квалы место не держится', careerSlotHeld() === null);
    check('и полоски на карточке нет', careerQualHTML() === '', careerQualHTML());
    check('и в календаре не помечено ничего', marked().length === 0,
          marked().slice(0, 5).join(','));

    // ---- квала на Мейджор 1 ------------------------------------------------
    seed('2026-04-10');
    CAREER.career.major = {n:1, got:'heats', pass:'heats', ticket:true};
    out.notes.held = careerSlotHeld();
    const m1 = marked();
    out.notes.majorDays = m1.length;
    out.notes.majorIds = idsOn(m1);
    check('дни Мейджора 1 помечены', m1.length > 0, String(m1.length));
    /* На помеченном дне может стоять и что-то ещё, и это не ошибка: Плей-Ин
       Мейджора 1 (6-7 апреля) делит календарь с неделей дивизионного кубка.
       Проверять надо не «на дне нет ничего чужого», а «день помечен ЗА своё»:
       у каждого помеченного дня обязана быть строка этого турнира. */
    const days0 = careerYearDays();
    check('каждый помеченный день несёт строку Мейджора 1',
          m1.every(k => (days0.get(k)||[]).some(e => /^Major1_/.test(String(e.id||'')))),
          m1.filter(k => !(days0.get(k)||[]).some(e => /^Major1_/.test(String(e.id||'')))).join(','));
    // Все четыре этапа Мейджора — плей-ин, хиты, ласт ченс, финал.
    check('помечены все четыре этапа турнира',
          idsOn(m1).filter(id => /^Major1_/.test(id)).length === 4,
          idsOn(m1).join(','));
    // Чужой Мейджор не задет: место на первом ничего не говорит про второй.
    check('Мейджор 2 не помечен', !idsOn(m1).some(id => /^Major2_/.test(id)),
          idsOn(m1).join(','));

    // Полоска на карточке называет турнир и ближайший его день.
    const html = careerQualHTML();
    out.notes.strip = html.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim();
    check('полоска появилась', html !== '');
    check('и называет турнир', html.indexOf(careerSlotHeld().what) >= 0, out.notes.strip);
    const next = ccQualNextDay();
    out.notes.next = next;
    check('ближайший день найден', !!next, String(next));
    check('и он не в прошлом', next >= careerToday(), next + ' vs ' + careerToday());
    check('и он принадлежит этому турниру',
          (careerYearDays().get(next)||[]).some(ccQualOn), next);

    // ---- Глобалы и их Ласт Ченс не путаются -------------------------------
    // GlobalChampionship и GlobalChampionshipLastChance начинаются одинаково:
    // приставка спутала бы их, поэтому оба опознаются точным именем.
    seed('2026-09-01');
    delete CAREER.career.major;
    CAREER.career.gclc = {through:true, done:false};
    const g1 = idsOn(marked());
    out.notes.gclcIds = g1;
    check('место на Ласт Ченсе метит его дни',
          g1.indexOf('GlobalChampionshipLastChance') >= 0, g1.join(','));
    check('и НЕ метит сам Мировой чемпионат',
          g1.indexOf('GlobalChampionship') < 0, g1.join(','));

    // ---- разметка календаря доезжает до клетки -----------------------------
    seed('2026-04-10');
    CAREER.career.major = {n:1, got:'heats', pass:'heats', ticket:true};
    CH_TAB = 'cal';
    const cal = careerCalendarHTML();
    const cells = (cal.match(/class="cal-day[^"]*"/g) || []);
    const qual = cells.filter(c => c.indexOf('cal-qual') >= 0);
    out.notes.cells = cells.length;
    out.notes.qualCells = qual.length;
    // Календарь рисует ОДИН месяц — тот, в котором стоит игрок (апрель).
    check('месяц нарисован', cells.length >= 28, String(cells.length));
    check('и в нём есть помеченные клетки', qual.length > 0, String(qual.length));
    // В апреле у Мейджора 1 плей-ин (6-7) и хиты (17-19): пять дней.
    const inApril = m1.filter(k => k.slice(0, 7) === '2026-04').length;
    out.notes.aprilDays = inApril;
    check('помечено столько клеток, сколько дней турнира в этом месяце',
          qual.length === inApril, qual.length + ' vs ' + inApril);

    // Место отдали — метка ушла.
    careerSlotGiveUp();
    check('после отказа от места календарь чист', marked().length === 0,
          marked().slice(0, 5).join(','));
    check('и полоска пропала', careerQualHTML() === '', careerQualHTML());
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsqual-'));
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
console.log('a place you already hold is named on the day card and lit on the calendar');
fs.rmSync(dir, { recursive: true, force: true });
