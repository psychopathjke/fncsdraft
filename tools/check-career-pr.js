// Power Rankings, против опубликованной модели Fortnite Tracker.
//
// Со 2 сентября 2026 ПР считается по их модели, а не по Epic'овой: она
// накопительная, база за место 5…1000 и «крайне тяжёлая сверху», множитель
// важности события x1…x10, затухание с четырёх месяцев до нуля к восемнадцати.
// Источник — их же анонс, fortnitetracker.com/article/921.
//
// Модель Epic (рейтинг поля, вес 0.8–1.6, лучшие двадцать, потолок 40 000) сняли
// потому, что она склеивала верхнюю половину любого тяжёлого поля в одно число:
// отчёт игрока «me and my friend made a duo carreer and we have same pr even if
// there are solo cups». Три строки её примера (23 000 / 20 000 / 17 000 в поле
// дивизиона 3) ушли вместе с ней — проверять их больше не по чему.
//
//   node tools/check-career-pr.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    // A career has to exist for ccPrAge to know what day it is.
    CAREER = {player:{ovr:70}, career:{season:1, day:'2026-08-01', division:3, log:[]}, partner:null};
    const ev = (o) => Object.assign({season:1, day:'2026-08-01', div:3, place:1, of:150}, o);

    // ---- база за место: три числа из их анонса ---------------------------
    // «flat point distribution between 5-1000», «players outside the top 100
    // receive less than 200 points», верхушка под 1000.
    // База читается на событии с множителем ×1 — это кубок второго дивизиона.
    const base = place => ccEventPR(ev({place:place, of:20000, kind:'cup', div:2}));
    if (base(1) !== 1000) fail('first place should be worth 1000 points, is ' + base(1));
    // 225, а не «меньше 200 из анонса 2020 года»: таблица с тех пор поменялась,
    // и здесь стоит ИЗМЕРЕННОЕ 2 сентября 2026 число, а не старый текст.
    if (base(100) !== 225) fail('100th should be worth the measured 225, is ' + base(100));
    if (base(10000) !== 5) fail('10,000th should be worth 5, is ' + base(10000));
    // Плоская верхушка — то, чем их таблица отличается от степенной кривой:
    // второе место стоит девять десятых первого.
    if (base(2) !== 900) fail('second place should be 900, is ' + base(2));
    out.steps.push('the base curve lands: 1st ' + base(1) + ', 100th ' + base(100) + ', 10,000th ' + base(10000));

    // ---- и она тяжёлая сверху -------------------------------------------
    // Смысл всей замены: наверху ступени большие. У Epic'овой модели шаг между
    // соседними местами выходил в один пункт, и игрок это увидел.
    const stepTop = base(1) - base(2), stepLow = base(100) - base(101);
    if (!(stepTop > stepLow * 50))
      fail('the curve is not top heavy: 1st->2nd drops ' + stepTop + ', 100th->101st drops ' + stepLow);
    out.steps.push('top heavy: 1st to 2nd is ' + stepTop + ' points, 100th to 101st is ' + stepLow);

    // ---- множители важности, x1…x10 --------------------------------------
    // Их пример: кэш-кап x1 (победа 1000), квал Мирового кубка x10 (10 000).
    const m = e => ccPrMult(ev(e));
    if (m({kind:'cup', div:1}) !== 1.5) fail('a Division 1 cup day should be the measured x1.5, is x' + m({kind:'cup', div:1}));
    if (m({kind:'cup', div:2}) !== 1) fail('a Division 2 cup day should be the measured x1, is x' + m({kind:'cup', div:2}));
    if (m({kind:'final'}) !== 3) fail('a Division 1 weekly final should be the measured x3, is x' + m({kind:'final'}));
    if (m({kind:'globals'}) !== 10) fail('the biggest event should be x10, is x' + m({kind:'globals'}));
    // Порядок — ИЗМЕРЕННЫЙ, и наверху у него площадка: гранд-финал Мейджора,
    // финал Саммита и Мировой чемпионат стоят одинаково, ×10. Поэтому сравнение
    // нестрогое, а сам список идёт ровно так, как читается из их данных.
    const order = [['globals',''],['summit','final'],['major','final'],['rc',''],
                   ['gclc','final'],['reload','final'],['major','heats'],['solo','final'],
                   ['major','playin'],['reload','open'],['cup','']];
    for (let i = 1; i < order.length; i++) {
      const a = m({kind:order[i-1][0], stage:order[i-1][1], div:1});
      const b = m({kind:order[i][0], stage:order[i][1], div:1});
      if (!(a >= b)) fail(order[i-1][0] + ' (x' + a + ') should not weigh less than ' + order[i][0] + ' (x' + b + ')');
    }
    if (!(m({kind:'cup', div:1}) > m({kind:'cup', div:5})))
      fail('a Division 1 cup should be worth more than a Division 5 one');
    out.steps.push('multipliers are the measured ones: cup day x1.5, weekly final x3, grand final x10');

    // Победа в самом дорогом событии — ровно десять тысяч, как у них в тексте.
    const huge = ccEventPR(ev({div:1, place:1, of:100, kind:'globals'}));
    if (huge !== 10000) fail('winning the biggest event should be 10,000 points, is ' + huge);
    out.steps.push('winning the biggest event is ' + huge + ' points, their own number');

    // ---- затухание: 4 месяца держит, к 18 нет ничего ---------------------
    const dec = [[0,1],[120,1],[121,0.9],[540,0],[900,0]];
    for (const [age, f] of dec) {
      const got = ccPrDecay(age);
      if (Math.abs(got - f) > 0.005) fail('a result ' + age + ' days old should keep ' + f + ', keeps ' + got);
    }
    out.steps.push('decay holds four months, drops a tenth at once, and is gone by eighteen');

    // ---- накопительно: играть всегда выгодно -----------------------------
    // Именно это игрок и просил: любой лишний результат добавляет, а лучше
    // сыгранный добавляет больше. У старой модели двадцать первый результат не
    // менял НИЧЕГО, а два разных соло-места давали одно и то же число.
    const log = [];
    for (let i = 0; i < 20; i++) log.push(ev({place: 10 + i, of:150, day:'2026-03-01'}));
    const before = ccPrTable(log).pr;
    log.push(ev({place: 149, of:150, day:'2026-03-02'}));
    const after = ccPrTable(log).pr;
    if (!(after > before)) fail('a twenty-first result did not add: ' + before + ' -> ' + after);
    out.steps.push('a twenty-first, weak result still adds: ' + before + ' -> ' + after);

    // И лучше сыгранный добавляет заметно больше — то самое «кто лучше
    // заплейсил соло, у того пр больше».
    const third = ccPrTable([ev({place:3, of:100, kind:'solo', stage:'final', div:1})]).pr;
    const seventh = ccPrTable([ev({place:7, of:100, kind:'solo', stage:'final', div:1})]).pr;
    if (!(third > seventh)) fail('3rd in a solo final (' + third + ') does not beat 7th (' + seventh + ')');
    if (!(third - seventh > 100))
      fail('3rd and 7th in a solo final differ by only ' + (third - seventh) + ' points, which reads as noise');
    out.steps.push('a solo final separates: 3rd ' + third + ' against 7th ' + seventh);

    // ---- старый год выцветает ---------------------------------------------
    CAREER.career.season = 2;
    const old = ccPrTable([ev({place:1, of:150, season:1, day:'2026-03-01'})]);
    const now = ccPrTable([ev({place:1, of:150, season:2, day:'2026-03-01'})]);
    if (!(old.pr > 0 && old.pr < now.pr))
      fail('a result a career year old should have faded, reads ' + old.pr + ' against ' + now.pr);
    CAREER.career.season = 3;
    const older = ccPrTable([ev({place:1, of:150, season:1, day:'2026-03-01'})]);
    if (older.pr !== 0) fail('a result two career years old should be gone, reads ' + older.pr);
    out.steps.push('a win a year ago has faded to ' + old.pr + ' from ' + now.pr + ', and two years ago to nothing');
    CAREER.career.season = 1;

    // ---- and nothing rates without a field --------------------------------
    if (ccEventPR(ev({of:1})) !== null) fail('a one-team event rated something');
    out.steps.push('an event with no field to beat rates nothing');

    // ---- комната — не турнир ----------------------------------------------
    /* Его отчёт 1 сентября 2026: «пр 743 000 почему-то, когда так не должно»,
       и следом «не надо платить больше, надо как у трекера». У самого Tracker
       вершина мира стоит около двухсот пятидесяти тысяч за полтора года.

       Карьера играет турниры выборкой: кубок пятого дивизиона собирает тысячу
       дуо, а играется комнатой в полторы сотни. Место рейтинговалось в
       комнате — и последний в ней получал очки сотого места мира. Проверяется
       и механика, и её итог на доске. */
    const cupDay = (() => {
      let found = null;
      careerYearDays().forEach((list, iso) => {
        if (!found && list.some(e => e.kind === 'cup')) found = iso;
      });
      return found;
    })();
    if (!cupDay) fail('the career year holds no divisional cup to measure');
    const inRoom = ccEventPR({place:150, of:150, div:5, kind:'cup', day:cupDay});
    const asIs   = Math.round(ccPrBase(150) * ccPrMult({kind:'cup', div:5}) * 10) / 10;
    if (!(inRoom < asIs * 0.6))
      fail('last in a room of 150 still rates ' + inRoom + ' against ' + asIs +
           ' — the room is being read as the whole tournament');
    // Первое место остаётся первым: концы закреплены, растянута середина.
    if (ccEventPR({place:1, of:150, div:5, kind:'cup', day:cupDay}) !==
        Math.round(ccPrBase(1) * ccPrMult({kind:'cup', div:5}) * 10) / 10)
      fail('winning the room stopped being winning the tournament');
    out.steps.push('last in a room of 150 rates ' + inRoom + ' where the room-as-world reading gave ' + asIs);

    // И итог: год на вершине мира должен стоить как вершина у Tracker, а не втрое.
    const year = [];
    careerYearDays().forEach((list, iso) => list.forEach(e => year.push({kind:e.kind, stage:e.stage, day:iso})));
    const topYear = year.reduce((sum, e) =>
      sum + (ccEventPR({place:3, of:150, div:1, kind:e.kind, stage:e.stage, day:e.day}) || 0), 0);
    if (!(topYear > 60000 && topYear < 400000))
      fail('a year of third places is worth ' + Math.round(topYear) +
           ' — Tracker tops out near 250,000 over eighteen months');
    out.steps.push('a whole year of third places across ' + year.length +
                   ' events is worth ' + Math.round(topYear) + ", Tracker's own scale");

    // ---- the board -------------------------------------------------------
    // Every event rates its whole field, so there is a standing to stand in,
    // and the player's row on it has to be the same number the History tab
    // prints: same events, same ratings, same arithmetic.
    CAREER.career.pr = null; CAREER.career.log = [];
    const played = [];
    const play = (place, of, div) => {
      const ranked = [];
      for (let i = 1; i <= of; i++)
        ranked.push(i === place ? {name:'You & Mate', isYou:true} : {name:'Duo ' + i});
      careerPrAdd(ranked, {div: div});
      played.push(ev({place: place, of: of, div: div, day: CAREER.career.day}));
    };
    play(3, 150, 4); play(61, 150, 4); play(9, 150, 3);
    const board = careerPrRows();
    const mine = board.find(r => r.you);
    if (!mine) fail('the player is not on their own board');
    const fromLog = ccPrTable(played).pr;
    if (mine.pr !== fromLog)
      fail('the board reads ' + mine.pr + ' where the history reads ' + fromLog);
    if (mine.events !== 3) fail('three events played, the board counts ' + mine.events);
    out.steps.push('the board and the history agree on the player: ' + mine.pr + ' over ' + mine.events + ' events');

    // Everyone in the lobby is rated, and the order is the order they finished.
    if (board.length < 150) fail('only ' + board.length + ' of the field reached the board');
    const first = board[0];
    if (!(first.pr >= mine.pr)) fail('the board is not sorted by rating');
    out.steps.push(board.length + ' teams on the board, led by ' + first.name + ' on ' + first.pr.toLocaleString('en-US'));

    // A fresh lobby every week would fill a save with names, so the board keeps
    // the best CC_PR_ROWS and never prunes the player.
    for (let w = 0; w < 4; w++) {
      const ranked = [];
      for (let i = 1; i <= 150; i++) ranked.push({name: 'Week' + w + ' Duo ' + i});
      ranked.splice(140, 0, {name:'You & Mate', isYou:true});
      careerPrAdd(ranked, {div:4});
    }
    const kept = Object.keys(CAREER.career.pr.rows).length;
    if (kept > CC_PR_ROWS * 1.5) fail('the board kept ' + kept + ' names, past the prune');
    if (!careerPrRows().some(r => r.you)) fail('the player was pruned off their own board');
    out.steps.push('after five lobbies the save holds ' + kept + ' names, and the player is still one of them');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + '<base href="file:///' + ROOT + '/">' + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=60000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], { maxBuffer: 512*1024*1024, encoding:'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
fs.rmSync(dir, { recursive: true, force: true });

out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('PR is Epic\'s own model, on this mode\'s own events');
