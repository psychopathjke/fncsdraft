// В командной карьере кресло напарника — только живой человек.
//
// Его правило, 26 августа: «запретить, если онлайн играешь, набирать рандомных
// игроков, только со своим можешь».
//
// Дверей у случайного напарника три, и закрыть надо все: письма «возьми меня в
// дуо» (careerSeatDm/careerSeatTopUp), согласие на такое письмо (careerDmAccept)
// и меню «кому написать» (ccDuoFindOpen). Иначе в команде из двух живых людей
// у одного в кресле оказывается бот, и это уже не одна команда: напарник видит
// у себя другой состав, а состав — это сила, синергия и роли.
//
// Одиночная карьера не должна заметить ничего: там всё это и есть игра.
//
//   node tools/check-mp-no-randoms.js
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
  const seed = () => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
              attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[], size:2},
      partners:[]
    }));
    careerLoad();
  };
  const offers = () => careerDms().filter(t => t.state === 'offer' &&
                                               t.who && !t.who.org && !t.who.brand);
  try {
    // ---- одиночная: всё как было ----------------------------------------
    seed();
    careerSeatTopUp();
    const solo = offers().length;
    out.notes.одиночная = {писем: solo};
    check('в одиночной карьере в кресло пишут', solo > 0, String(solo));
    const one = offers()[0];
    careerDmAccept(one.id);
    check('и согласие сажает человека', careerMates().length === 1,
          JSON.stringify(careerMates().map(m => m && m.handle)));

    // ---- командная: не пишут вовсе ---------------------------------------
    seed();
    CAREER.career.mp = {code:'ABC123', role:'a'};
    careerSeatTopUp();
    const team = offers().length;
    out.notes.командная = {писем: team};
    check('в командной карьере в кресло не пишут', team === 0, String(team));
    check('и одиночная дверь careerSeatDm заперта', careerSeatDm('x') === false);

    // ---- и согласиться не на что, даже если письмо осталось со вчера ------
    seed();
    careerSeatTopUp();
    const old = offers()[0];
    check('письмо со вчера есть', !!old);
    CAREER.career.mp = {code:'ABC123', role:'a'};   // сегодня карьера командная
    careerDmAccept(old.id);
    check('согласие в командной карьере никого не сажает',
          careerMates().length === 0, JSON.stringify(careerMates().map(m => m && m.handle)));

    /* ---- трио: третьего брать МОЖНО, и он общий ---------------------------
       Его правка, 26 августа: «в три разреши брать». Живых в команде двое,
       а кресел в трио-сезоне три — последнее и есть кресло третьего. Но
       третий обязан быть ОБЩИМ: наберёт каждый своего — и у двоих снова
       разные составы, то есть то самое расхождение, ради которого случайных
       и запретили. Поэтому берёт его владелец лобби, а едет он в командном
       состоянии. */
    seed();
    CAREER.career.size = 3; CAREER.career.sizes = {1:3};
    CAREER.career.mp = {code:'ABC123', role:'a'};
    MP.peer = {handle:'howly', nat:'ru', region:'EU', rating:91,
               _targetOvr:91, _attrs:null, _roleKey:'roleFRG'};
    check('в трио-сезоне кресел два', careerMateSeats() === 2, String(careerMateSeats()));
    careerSeatTopUp();
    const trio = offers().length;
    out.notes.трио = {писем: trio, кресел: careerMateSeats()};
    check('в трио на третье кресло пишут', trio > 0, String(trio));
    const third = offers()[0];
    /* Третьего сажает СОГЛАСИЕ ОБОИХ, а не владелец лобби. Его слово,
       27 августа: «кто-то нажимается взять в трио и у его тимейта
       высвечивается берем ли в комнаду». Значит прямой вызов больше не
       сажает никого, а рукопожатие — сажает. */
    ccMpThirdWire();
    careerDmAccept(third.id);
    check('прямое согласие в командной карьере третьего не сажает',
          careerMates().length === 1,
          JSON.stringify(careerMates().map(m => m && m.handle)));
    ccMpThirdAsk(third.id);
    // Отказ напарника не сажает никого.
    MP.say({t:'act', kind:'third-ok', by:'peer',
            payload:{id:third.id, ok:false, to:ccMpId()}});
    check('отказ напарника третьего не сажает', careerMates().length === 1,
          JSON.stringify(careerMates().map(m => m && m.handle)));
    ccMpThirdAsk(third.id);
    MP.say({t:'act', kind:'third-ok', by:'peer',
            payload:{id:third.id, ok:true, to:ccMpId()}});
    check('и третьего сажают на два «да»', careerMates().length === 2,
          JSON.stringify(careerMates().map(m => m && m.handle)));
    check('первым в составе — живой напарник',
          (careerMates()[0] || {}).handle === 'howly',
          JSON.stringify(careerMates().map(m => m && m.handle)));
    check('третий уехал в командное состояние',
          (ccTeamState().mates || []).length === 1,
          JSON.stringify(ccTeamState().mates));
    // Кресло третьего занято — больше никто не пишет.
    const was = offers().length;
    careerSeatTopUp();
    check('на занятое кресло больше не пишут', offers().length === was,
          was + ' -> ' + offers().length);

    // Вошедший вторым третьего не набирает: это решение владельца.
    CAREER.career.mp = {code:'ABC123', role:'b'};
    CAREER.career.mates = [];
    careerSeatTopUp();
    check('второму в лобби писем про кресло не приходит',
          offers().filter(t => t.state === 'offer').length === was, String(offers().length));

    // ---- меню «кому написать» не открывается ------------------------------
    seed();
    CAREER.career.mp = {code:'ABC123', role:'a'};
    const modal = document.getElementById('duoFindModal');
    ccDuoFindOpen(0);
    check('меню поиска дуо в командной карьере не открывается',
          !modal || modal.style.display !== 'flex', modal && modal.style.display);
    delete CAREER.career.mp;
    ccDuoFindOpen(0);
    check('а в одиночной открывается', modal && modal.style.display === 'flex',
          modal && modal.style.display);
    ccDuoFindClose();

    // ---- и на экране сказано, почему кресло пустое ------------------------
    seed();
    CAREER.career.mp = {code:'ABC123', role:'a'};
    MP.peer = null;
    careerRenderHub('centre');
    const html = (document.getElementById('chBody') || {}).innerHTML || '';
    out.notes.строка = html.indexOf(L().ccMpOnlyMate) >= 0;
    check('на хабе сказано, что кресло только для напарника',
          html.indexOf(L().ccMpOnlyMate) >= 0, L().ccMpOnlyMate);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mprnd-'));
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
console.log('в команде кресло только для напарника, в одиночной — как было');
fs.rmSync(dir, { recursive: true, force: true });
