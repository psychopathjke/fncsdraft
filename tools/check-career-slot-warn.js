// Место на ЛАНе не сгорает молча.
//
// Квала принадлежит ПАРЕ: разрыв пары её сжигает, и место уходит команде ниже
// (careerSlotGiveUp, правило от 17 августа). Само правило работало давно, а
// сказано вслух было в одном месте из трёх — строчкой над кнопкой в личке.
// «Выгнать» и переезд сжигали место без единого слова.
//
// Его игрок, 26 августа: «you should add a warning if you qualled lan with your
// team and then try switch like "are you sure you wanna disband your globals
// spot" or smth with ewc».
//
// Проверяется и обратное: когда терять нечего, лишнего окна нет. Подтверждение,
// которое спрашивает всегда, перестают читать через неделю.
//
//   node tools/check-career-slot-warn.js
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
      player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
              attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-04', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    // Без этого в личке нет ни одного предложения: кресло наполняет хаб,
    // а не загрузка. Ту же дверь открывает игрок.
    careerSeatTopUp();
  };
  // Окно подтверждения на экране? Текст его вопроса?
  const modal = () => {
    const m = document.getElementById('ccAskModal');
    return (m && m.style.display === 'flex')
      ? document.getElementById('ccAskText').textContent : null;
  };
  const shut = () => { const m=document.getElementById('ccAskModal');
                       if(m) m.style.display='none'; };
  try {
    // ---- места нет: спрашивать не о чем ------------------------------------
    seed();
    check('без квалы место не держится', careerSlotHeld() === null,
          JSON.stringify(careerSlotHeld()));
    out.notes.noSeatTail = ccSlotCostText();
    check('и хвост к вопросу пустой', ccSlotCostText() === '', out.notes.noSeatTail);
    let ran = false;
    ccSlotAsk(() => { ran = true; });
    check('без места действие идёт сразу, без окна', ran === true && modal() === null,
          String(modal()));

    // ---- место есть ---------------------------------------------------------
    // Мейджор пройден и впереди этап, на который уже квалифицировался, — ровно
    // то, что careerSlotHeld считает удержанным местом.
    seed();
    CAREER.career.major = {n:1, got:'heats', pass:'heats', ticket:true};
    const held = careerSlotHeld();
    out.notes.held = held;
    check('место держится', !!held, JSON.stringify(held));

    out.notes.tail = ccSlotCostText();
    check('хвост к вопросу непустой', ccSlotCostText() !== '');
    check('и называет, что именно теряется',
          ccSlotCostText().indexOf(held.what) >= 0, out.notes.tail);

    ran = false;
    ccSlotAsk(() => { ran = true; });
    const asked = modal();
    out.notes.asked = asked;
    check('с местом сначала спрашивают', ran === false && asked !== null, String(asked));
    check('в вопросе назван турнир', asked && asked.indexOf(held.what) >= 0, asked);
    // И «да» действительно доводит действие до конца.
    document.getElementById('ccAskYes').click();
    check('после согласия действие выполняется', ran === true);
    shut();

    // ---- «выгнать» тоже предупреждает --------------------------------------
    seed();
    CAREER.career.major = {n:1, got:'heats', pass:'heats', ticket:true};
    // Посадить напарника через ту же дверь, какой пользуется игрок.
    const offer = careerDms().find(x => x.state === 'offer' && x.who && !x.who.org && !x.who.brand);
    if(offer) careerDmAccept(offer.id);
    out.notes.mate = careerPartnerCard() && careerPartnerCard().handle;
    check('напарник сидит', !!careerPartnerCard(), JSON.stringify(out.notes.mate));
    careerMateKickAsk(0);
    const kickText = modal();
    out.notes.kick = kickText;
    check('«выгнать» спрашивает', kickText !== null);
    check('и говорит про место', kickText && kickText.indexOf(careerSlotHeld().what) >= 0,
          kickText);
    shut();

    // ---- переезд без команды предупреждает, с командой — нет ----------------
    let moved = null;
    const realMove = careerMoveRegion;
    careerMoveRegion = function(code, country, withMates){ moved = {code:code, withMates:!!withMates}; };
    careerMoveAsk('NAC');
    check('переезд без команды спрашивает', modal() !== null, String(modal()));
    check('и до самого переезда пока не дошло', moved === null, JSON.stringify(moved));
    document.getElementById('ccAskYes').click();
    check('после согласия переезд идёт', moved && moved.code === 'NAC', JSON.stringify(moved));
    shut();
    moved = null;
    careerMoveAsk('NAC', 'us', true);
    check('переезд ВМЕСТЕ не спрашивает — место остаётся при паре',
          modal() === null && moved && moved.withMates === true, JSON.stringify(moved));
    careerMoveRegion = realMove;

    // ---- приём в пустое кресло не спрашивает --------------------------------
    // Место сгорает от ЗАМЕНЫ, а не от посадки: обычный приём остаётся одним
    // нажатием, иначе окно появлялось бы там, где терять нечего.
    seed();
    CAREER.career.major = {n:1, got:'heats', pass:'heats', ticket:true};
    check('кресло пустое', !careerPartnerCard());
    const o2 = careerDms().find(x => x.state === 'offer' && x.who && !x.who.org && !x.who.brand);
    if(o2) careerDmAcceptAsk(o2.id);
    check('в пустое кресло сажают без вопроса', modal() === null, String(modal()));
    check('и напарник сел', !!careerPartnerCard());
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsslot-'));
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
console.log('a LAN place is never given away without being asked');
fs.rmSync(dir, { recursive: true, force: true });
