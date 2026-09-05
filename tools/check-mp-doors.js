// Дверь в командную карьеру — в полосе карьеры на главной (.cstrip, с 4
// сентября 2026; до этого была на карточке карьеры), ровно настолько, насколько
// её открывает CC_MP_OPEN. С 27 августа 2026 флаг снят: кнопок игрок не видит,
// и проверка идёт той же дорогой мимо сторожа (см. openDoor), чтобы путь до
// лобби не остался без сторожа, пока дверь закрыта.
//
// Его отчёт, 26 августа: «нажимаю играть вдвоём — ниче не грузит», и следом:
// «как то не понятно, что это мультиплеер, мб отдельную кнопку в главном
// меню… рядом с карьерой… или прям на карьере».
//
// Обе жалобы про одно место. Двери стояли внизу экрана СОЗДАНИЯ карьеры, где
// их никто не искал, и молчали, пока форма не заполнена: careerMpStart выходил
// по проверке готовности и не говорил ни слова. Теперь они на карточке карьеры
// в меню, а между нажатием и лобби живёт намерение (CC_MP_NEW), которое
// переживает экран создания и срабатывает в конце.
//
// Проверяется весь путь: кнопки на месте и подписаны, нажатие ведёт в
// создание, на экране создания сказано, что именно заводится, и по «начать
// карьеру» карьера уходит в лобби — с той ролью, которую выбрали.
//
//   node tools/check-mp-doors.js
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
  /* Ждём загрузку: подписи кнопок и показ строки ставит setLang, а он
     зовётся на load. Без ожидания проба читала пустые кнопки и скрытую
     строку — то есть мерила момент, которого игрок не видит. */
  if(document.readyState!=='complete')
    await new Promise(r=>window.addEventListener('load', r));
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const el = id => document.getElementById(id);
  const screenNow = () => (document.querySelector('.screen.active')||{}).id;
  /* Открыть дверь так, как её открывает игрок, — а если дверь закрыта
     (CC_MP_OPEN=false, снята 27 августа по его слову «убрать дуо кнопки»),
     пройти ту же дорогу мимо сторожа на кнопке. Иначе проверка меряла бы
     только флаг и перестала бы стеречь сам путь до лобби. */
  /* Двери переехали из подвала карточки карьеры в полосу под героем
     (.cstrip) — его слово 4 сентября: «тогда можно это убрать». Нумерация та
     же, что была у ряда на карточке: 0 — «вдвоём», 1 — «войти по коду». */
  const doorId = n => (n === 0 ? 'cstripDuo' : n === 1 ? 'cstripCode' : 'cstripRace');
  const openDoor = n => {
    if(CC_MP_OPEN){
      el(doorId(n)).click();
      /* С 29 августа код вводится в своей модалке (ccCodeOpen), а не в
         prompt(): при открытой двери проверка красила «войти по коду», ждя
         prompt. Стаб prompt остаётся источником кода, модалка проходится
         как игроком: вбить, подтвердить — или закрыть, если кода нет. */
      if(n === 1){
        const c = window.prompt();
        if(!(c && /^[A-Za-z0-9]{6}$/.test(c.trim()))){ ccCodeClose(); return; }
        el('ccCodeInput').value = c.trim(); ccCodeTyped(); el('ccCodeYes').click();
      }
      return;
    }
    if(n === 0){ CC_MP_NEW = {role:'a'}; ccMpStartNew(); return; }
    const c = window.prompt();
    if(!(c && /^[A-Za-z0-9]{6}$/.test(c.trim()))) return;
    CC_MP_NEW = {role:'b', code:c.trim().toUpperCase()};
    ccMpStartNew();
  };
  const fill = () => {
    el('ccNick').value='Probe'; ccSync();
    el('ccAge').value='19'; ccAgeInput(); ccAgeClamp();
    if(typeof ccPickCountry==='function') ccPickCountry('de');
    else { CC.country='de'; CC.region='EU'; ccSync(); }
  };
  try {
    localStorage.clear();
    // ---- 1. кнопки есть, видны и подписаны -------------------------------
    const strip0 = document.querySelector('.cstrip');
    /* Меряем ВИДИМОСТЬ, а не атрибут. hidden=true при .mode-mp{display:flex}
       не прячет ничего: браузерное [hidden]{display:none} слабее класса. Так
       27 августа 2026 кнопки уехали на прод «убранными», проверка была зелёной,
       а он написал «он есть до сих пор». Лечится правилом [hidden] в стилях,
       стережётся этой строкой. */
    const shown = e => !!(e && e.offsetParent !== null);
    check('полоса карьеры есть на главной', !!strip0);
    check('и командные двери в ней ходят за флагом',
          !!el('cstripDuo') && shown(el('cstripDuo')) === CC_MP_OPEN,
          'hidden=' + (el('cstripDuo') && el('cstripDuo').hidden) + ', видна=' +
          shown(el('cstripDuo')) + ', открыто=' + CC_MP_OPEN);
    check('а на карточке карьеры дверей больше нет', !el('modeMpRow'));
    out.notes.открыто = CC_MP_OPEN;
    /* Третья дверь — в герое главной (heroDuo), его слово 30 августа: «на
       кнопки карьеры должен быть ещё дуо мод». Тот же флаг, та же мерка
       видимости, та же подпись про игру вдвоём. */
    /* 5 сентября дверей «вдвоём» и «по коду» в герое больше нет — его скрин
       («будто одно и то же два раза»): они повторяли полосу карьеры ниже.
       У героя две двери — карьера и драфт; командные — в полосе. */
    check('в герое нет двери «вдвоём»', !el('heroDuo'));
    check('и нет строки «войти по коду»', !el('heroCode'));
    const heroBtns = [...document.querySelectorAll('.hero-cta .hero-btn')];
    check('у героя две двери: карьера и драфт', heroBtns.length === 2, String(heroBtns.length));
    check('первая — одиночная карьера', heroBtns[0] && heroBtns[0].textContent.trim() === L().heroCareer,
          JSON.stringify(heroBtns[0] && heroBtns[0].textContent.trim()));

    /* ПОЛОСА КАРЬЕРЫ под героем — его правка 4 сентября: «не видно кнопок
       карьеры сразу… может на главном прямоугольник добавить», и следом
       «тогда можно это убрать» про ряд на карточке. Четыре двери в одной
       строке: одиночная открыта всегда, три командные — общим флагом. */
    const strip = strip0;
    // Одиночной двери в полосе больше нет (5 сентября) — она в герое над ней.
    check('в полосе нет одиночной двери', !(strip && strip.querySelector('.cstrip-btn-go')));
    ['cstripDuo', 'cstripRace', 'cstripCode'].forEach(id => {
      const b = el(id);
      check('дверь ' + id + ' есть', !!b);
      check('и её видимость совпадает с флагом двери', b && shown(b) === CC_MP_OPEN,
            'hidden=' + (b && b.hidden) + ', видна=' + shown(b) + ', открыто=' + CC_MP_OPEN);
      check('и она подписана', b && b.textContent.trim().length > 2,
            JSON.stringify(b && b.textContent.trim()));
    });
    out.notes.полоса = strip
      ? [...strip.querySelectorAll('button')].map(b => b.textContent.trim()) : null;
    const btns = ['cstripDuo','cstripCode','cstripRace'].map(el).filter(Boolean);
    out.notes.кнопки = btns.map(b => b.textContent.trim());
    /* Дверей четыре с 4 сентября: к командной карьере добавилась ГОНКА
       (каждый играет свою, лобби сравнивает). Порядок важен — первыми стоят
       двери команды, за ними гонки, и подписи проверяются ниже поимённо. */
    check('командных дверей три: вдвоём, код, гонка', btns.length === 3, String(btns.length));
    check('и все подписаны', btns.every(b => b.textContent.trim().length > 2),
          JSON.stringify(out.notes.кнопки));
    check('подписи — про игру вдвоём',
          btns[0].textContent.trim() === L().heroDuo &&
          btns[1].textContent.trim() === L().ccMpEnter, JSON.stringify(out.notes.кнопки));
    check('и про гонку карьер',
          btns[2].textContent.trim() === L().ccRaceMake, JSON.stringify(out.notes.кнопки));

    // Дверь закрыта — кнопки должны быть немы, а не просто спрятаны.
    if(!CC_MP_OPEN){
      btns.forEach(b => b.click());
      await wait(150);
      check('закрытая дверь ничего не заводит',
            screenNow() === 'screen-mode' && CC_MP_NEW === null,
            screenNow() + ', намерение=' + JSON.stringify(CC_MP_NEW));
    }

    /* Намерение «вдвоём» не липнет к следующей карьере. Его слово 29 августа:
       «а соло карьеру можно запустить? то везде этот код». */
    CC_MP_NEW={role:'b', code:'ABC123'};
    ccMpNoteDraw();
    check('метку «вдвоём» можно снять крестиком',
          !!document.querySelector('#ccMpNote .cc-mp-note-x'));
    ccMpNewCancel();
    check('после крестика намерения нет', CC_MP_NEW === null, JSON.stringify(CC_MP_NEW));
    CC_MP_NEW={role:'a'};
    careerEntry();
    await wait(150);
    check('одиночная дверь снимает намерение', CC_MP_NEW === null, JSON.stringify(CC_MP_NEW));
    show('screen-mode');

    // ---- 2. нажатие ведёт в создание, а не в одиночную карьеру -----------
    openDoor(0);
    await wait(200);
    check('«играть вдвоём» ведёт на экран создания',
          screenNow() === 'screen-career-create', screenNow());
    check('намерение записано', !!CC_MP_NEW && CC_MP_NEW.role === 'a',
          JSON.stringify(CC_MP_NEW));
    const note = el('ccMpNote');
    out.notes.строка = note ? note.textContent.trim().slice(0, 90) : null;
    check('и на экране сказано, что заводится команда',
          note && !note.hidden && note.textContent.indexOf(L().ccMpNewNote) >= 0,
          out.notes.строка);

    // ---- 3. обычный старт уводит карьеру в лобби -------------------------
    fill();
    let asked = null;
    MP.connect = function(code, id){ asked = code; MP.state = 'live'; return Promise.resolve(); };
    el('ccStart').click();
    await wait(500);
    check('карьера завелась', screenNow() === 'screen-career-hub', screenNow());
    check('и ушла в лобби', ccMpOn() === true, JSON.stringify(CAREER.career.mp));
    check('роль — владелец', (CAREER.career.mp||{}).role === 'a');
    check('подключились по своему коду', asked === CAREER.career.mp.code, String(asked));
    check('намерение потрачено', CC_MP_NEW === null, JSON.stringify(CC_MP_NEW));
    out.notes.код = CAREER.career.mp.code;

    // ---- 4. вход по коду — та же дорога, другая роль ---------------------
    localStorage.clear();
    show('screen-mode');
    window.prompt = function(){ return 'abc123'; };
    openDoor(1);
    await wait(200);
    check('«войти по коду» тоже ведёт в создание',
          screenNow() === 'screen-career-create', screenNow());
    check('код запомнен', CC_MP_NEW && CC_MP_NEW.code === 'ABC123' && CC_MP_NEW.role === 'b',
          JSON.stringify(CC_MP_NEW));
    check('и строка называет лобби',
          el('ccMpNote').textContent.indexOf('ABC123') >= 0,
          el('ccMpNote').textContent.trim().slice(0, 90));
    fill();
    asked = null;
    el('ccStart').click();
    await wait(500);
    check('вошли вторым', (CAREER.career.mp||{}).role === 'b', JSON.stringify(CAREER.career.mp));
    check('и именно в то лобби', asked === 'ABC123', String(asked));

    // ---- 5. отмена ввода кода ничего не заводит --------------------------
    localStorage.clear();
    show('screen-mode');
    CC_MP_NEW = null;
    window.prompt = function(){ return null; };
    openDoor(1);
    await wait(150);
    check('отменил ввод — остались в меню', screenNow() === 'screen-mode', screenNow());
    check('и намерения нет', CC_MP_NEW === null, JSON.stringify(CC_MP_NEW));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpdoors-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log(out.notes.открыто
  ? 'двери карьеры стоят в полосе на главной и доводят до лобби'
  : 'дверь вдвоём закрыта и нема, дорога до лобби цела');
fs.rmSync(dir, { recursive: true, force: true });
