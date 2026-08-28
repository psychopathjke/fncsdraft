// Сетка хитов Мейджора: карьера считает её так же, как режим драфта.
//
// Два расхождения, пойманные его игроком 26 августа. Первое — число:
// «idk if the placements for heats were intentional but in duos its top 15 not
// top 10 and trios was top 10 not 7». Карьера стояла на десятке, и тогда из
// хитов выходило тридцать, а двадцать мест финала было неоткуда взять.
//
// Второе нашлось следом: сетка вообще не читала регион. CC_MAJOR_HEATS была
// константой 3, и карьера в Океании играла европейские три хита с отбором 150
// там, где настоящий Мейджор даёт два и 100.
//
// Обе половины проверяются одним способом: majorFormat описывает ТОТ ЖЕ турнир
// глазами драфта, и карьера обязана совпасть с ним регион в регион.
//
//   node tools/check-career-heat-cut.js
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
  const seed = (region, size) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:region, ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:size},
      partners:[]
    }));
    careerLoad();
  };
  try {
    // ---- Европа, дуо и трио: то самое число ------------------------------
    seed('EU', 2);
    const duo = ccScaleStage(CC_MAJOR_STAGE.heats);
    out.notes.euDuo = {field:duo.field, cut:duo.cut};
    check('в дуо хит на пятьдесят', duo.field === 50, String(duo.field));
    check('и проходят из него пятнадцать', duo.cut === 15, String(duo.cut));
    seed('EU', 3);
    const trio = ccScaleStage(CC_MAJOR_STAGE.heats);
    out.notes.euTrio = {field:trio.field, cut:trio.cut};
    check('в трио хит на тридцать три', trio.field === 33, String(trio.field));
    check('и проходят из него десять', trio.cut === 10, String(trio.cut));

    // ---- регион в регион, против драфта ----------------------------------
    // majorFormat — это FNCS 2026 глазами драфта. Один турнир: сколько хитов,
    // сколько игр в каждом, сколько из каждого проходит и сколько отбирает
    // плей-ин — всё обязано совпасть.
    out.notes.byRegion = {};
    [1, 2].forEach(n => {
      const set = 'm' + n;
      CC_REGIONS.forEach(r => {
        seed(r, 2);
        // playInSeats читает ГЛОБАЛЬНЫЙ squadSize, а не состав карьеры: без
        // этой строки драфт отвечает за режим отряда (25 команд в лобби) и
        // расходится с карьерой на ровном месте.
        squadSize = 2;
        const fmt = majorFormat(r, set);
        const want = fmt.heats || [];
        const got = [];
        for (let h = 1; h <= ccMajorHeats(); h++) got.push(ccMajorHeat(n, h));
        const key = set + ' ' + r;
        out.notes.byRegion[key] = {
          heats: got.length,
          games: got.map(h => h.games).join('/'),
          cuts:  got.map(h => h.cut).join('/'),
          playIn: ccScaleStage(CC_MAJOR_STAGE.playin).cut
        };
        check(key + ': столько же хитов, сколько у драфта',
              got.length === want.length, got.length + ' vs ' + want.length);
        check(key + ': столько же игр в каждом',
              got.every((h, i) => want[i] && h.games === want[i].games),
              got.map(h => h.games).join('/') + ' vs ' + want.map(h => h.games).join('/'));
        check(key + ': та же отсечка в каждом',
              got.every((h, i) => want[i] && h.cut === want[i].cut),
              got.map(h => h.cut).join('/') + ' vs ' + want.map(h => h.cut).join('/'));
        check(key + ': плей-ин отбирает столько же',
              ccScaleStage(CC_MAJOR_STAGE.playin).cut === fmt.playInCut,
              ccScaleStage(CC_MAJOR_STAGE.playin).cut + ' vs ' + fmt.playInCut);
        // И места финала обязаны сойтись: то, что дают хиты, плюс Ласт Ченс.
        const fromHeats = got.reduce((s, h) => s + h.cut, 0);
        const fin = ccScaleStage(CC_MAJOR_STAGE.final).field;
        check(key + ': хиты не переполняют финал', fromHeats < fin,
              fromHeats + ' of ' + fin);
        check(key + ': и оставляют Ласт Ченсу хотя бы три места',
              fin - fromHeats >= 3, String(fin - fromHeats));
      });
    });

    // ---- трио: тот же вопрос, но против календаря 2025 ---------------------
    /* Трио-сезон карьера играет по календарю 2025 года, а там были не хиты, а
       группы: три по десять в глубоком регионе и две по пятнадцать в остальных.
       Из обеих схем выходит тридцать — Epic так их и сводил.

       Карьера собственной трио-таблицы не держит: числа записаны в дуо и
       пересчитываются ccTeams (×2/3). Вопрос ровно в том, попадает ли этот
       пересчёт в измеренные числа 2025-го, или трио-сезон играет свою сетку.
       Сверяется с t1/t2/t3 — это и есть три Мейджора того года. */
    out.notes.trioByRegion = {};
    ['t1','t2','t3'].forEach(set => {
      CC_REGIONS.forEach(r => {
        seed(r, 3);
        squadSize = 3;
        const fmt = majorFormat(r, set);
        const want = fmt.heats || [];
        const h = ccScaleStage(CC_MAJOR_STAGE.heats);
        const pi = ccScaleStage(CC_MAJOR_STAGE.playin);
        const key = set + ' ' + r;
        out.notes.trioByRegion[key] = {
          heats: ccMajorHeats(), field: h.field, cut: h.cut,
          through: h.cut * ccMajorHeats(), playIn: pi.cut
        };
        check(key + ': столько же групп, сколько у драфта',
              ccMajorHeats() === want.length, ccMajorHeats() + ' vs ' + want.length);
        check(key + ': та же отсечка группы',
              want.every(w => w.cut === h.cut),
              h.cut + ' vs ' + want.map(w => w.cut).join('/'));
        check(key + ': и тот же отбор плей-ина',
              pi.cut === fmt.playInCut, pi.cut + ' vs ' + fmt.playInCut);
        // Из групп 2025 года выходило тридцать команд, обеими схемами.
        check(key + ': из групп выходит тридцать',
              h.cut * ccMajorHeats() === 30, String(h.cut * ccMajorHeats()));
      });
    });

    // ---- шестиигровой второй хит Мейджора 1 -------------------------------
    // Океания, Азия и Ближний Восток гоняли его на игру длиннее, и проходило
    // из него двадцать четыре. Первый хит там обычный.
    ['OCE','ASIA','ME'].forEach(r => {
      seed(r, 2);
      const h1 = ccMajorHeat(1, 1), h2 = ccMajorHeat(1, 2), m2 = ccMajorHeat(2, 2);
      out.notes['m1 ' + r + ' heat2'] = h2;
      check('m1 ' + r + ': первый хит обычный',
            h1.games === 5 && h1.cut === 23, h1.games + '/' + h1.cut);
      check('m1 ' + r + ': второй хит на игру длиннее',
            h2.games === 6 && h2.cut === 24, h2.games + '/' + h2.cut);
      check('m2 ' + r + ': а в Мейджоре 2 его уже нет',
            m2.games === 5 && m2.cut === 23, m2.games + '/' + m2.cut);
    });
    // В глубоком регионе такого хита нет ни в одном Мейджоре.
    seed('EU', 2);
    check('в Европе все хиты одинаковые',
          [1,2,3].every(h => ccMajorHeat(1, h).games === 5 && ccMajorHeat(1, h).cut === 15));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsheatcut-'));
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
console.log('the career runs its own region\\u2019s bracket, the same one the draft runs');
fs.rmSync(dir, { recursive: true, force: true });
