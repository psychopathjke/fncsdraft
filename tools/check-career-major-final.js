// Финал Мейджора — те же люди и в тех же парах, что играли Хиты.
//
// Поле финала строилось careerCupField заново, а careerSeed сеется календарной
// НЕДЕЛЕЙ: Хиты Мейджора 2 идут 24-26 июля, финал — 1-2 августа. Разные недели,
// другой бросок, другая очередь пар — и в финал выходили те же ники, но
// перетасованные по другим командам.
//
// Его игрок, 25 августа: «баг до сих пор остался, что на крупных турнирах
// дуосы меняются в финале», и следом «из-за этого думаю, и призовые не
// учитываются».
//
// Проверяется сборка поля — ccMajorFinalRoom, — а не двенадцать игр за ней.
//
//   node tools/check-career-major-final.js
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
              closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
              attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-08-01', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  try {
    seed();
    const cr = CAREER.career;
    const me = careerCard();
    const drafted = [me];
    const you = careerYouTeam(drafted); you.isYou = true;
    const st = ccScaleStage(CC_MAJOR_STAGE.final);
    const ev = {n:2, stage:'final', label:'Major 2 · Final'};
    const lobbyCr = Object.assign({}, cr, {division:1});

    // Таблица Плей-Ина: полтораста пар настоящей сцены, в тех парах, в каких
    // они его прошли. Строка — список ников, ровно как её пишет ccMajorSeatRow.
    const roster = ccSceneRoster(ccCareerRegion());
    const cut = ccScaleStage(CC_MAJOR_STAGE.playin).cut;
    const per = careerSquadSize();
    const rows = [];
    for (let i = 0; rows.length < cut && (i + 1) * per <= roster.length; i++)
      rows.push(roster.slice(i * per, (i + 1) * per).map(c => c.handle));
    out.notes.rows = rows.length;
    check('таблица Плей-Ина набралась', rows.length > st.field, String(rows.length));
    // Своя строка стоит в ней там же, где стояла бы: посев её знает по слову.
    rows.splice(20, 0, 'you');

    // Хиты: из комнаты игрока прошла десятка, и это те, кого он видел. Берутся
    // они из СЕРЕДИНЫ таблицы — если бы поле сортировалось одной силой, этих
    // в пятидесяти сильнейших не было бы вовсе, и проверка была бы ни о чём.
    const hCut = ccScaleStage(CC_MAJOR_STAGE.heats).cut;
    const q = rows.filter(r => r !== 'you').slice(100, 100 + hCut);
    cr.majorSeed = {n:2, season:1, size:per, rows:rows,
                    through: ['you'].concat(q)};

    const field = ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, CC_FIELD_SHARP.lan);
    const keys = field.map(ccSeatKey);
    out.notes.field = field.length;
    out.notes.qual = CC_MAJOR_FIN_QUAL;
    check('финал — полное лобби', field.length === st.field, String(field.length));
    check('игрок сидит в нём первым', field[0] === you);

    // ---- то, ради чего правка -------------------------------------------
    check('прошедшие свой хит сидят в финале',
          q.every(r => keys.indexOf(ccSeatKey({squad:r.map(h => ({handle:h}))})) >= 0),
          q.filter(r => keys.indexOf(ccSeatKey({squad:r.map(h => ({handle:h}))})) < 0)
            .map(r => r.join('+')).join(', '));
    check('и сидят в тех же парах', CC_MAJOR_FIN_QUAL === q.length,
          CC_MAJOR_FIN_QUAL + ' of ' + q.length);
    // Ни одна пара финала не собрана из людей, которые в Плей-Ине играли с
    // другими: каждая строка поля обязана совпасть со строкой таблицы.
    const seedKeys = new Set(rows.filter(r => r !== 'you')
                                 .map(r => ccSeatKey({squad:r.map(h => ({handle:h}))})));
    const strangers = keys.slice(1).filter(k => !seedKeys.has(k));
    out.notes.strangers = strangers.length;
    check('каждая пара финала — пара из таблицы Плей-Ина',
          strangers.length === 0, strangers.slice(0, 5).join(', '));
    // И никто не сидит дважды — ни командой, ни человеком.
    check('одна команда — одно место', new Set(keys).size === keys.length,
          keys.length + ' seats, ' + new Set(keys).size + ' unique');
    const people = [].concat(...field.map(t => (t.squad||[]).map(c => String(c.handle||'').toLowerCase())));
    check('один человек — одно место', new Set(people).size === people.length,
          people.length + ' players, ' + new Set(people).size + ' unique');

    // ---- сейв без записи --------------------------------------------------
    // Карьера, зашедшая мимо Плей-Ина, играет как играла, а не падает.
    delete cr.majorSeed;
    const old = ccMajorFinalRoom(you, lobbyCr, drafted, ev, st, CC_FIELD_SHARP.lan);
    out.notes.oldSave = old.length;
    check('без таблицы финал всё равно полный',
          old.length === st.field, String(old.length));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmajfin-'));
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
console.log('a Major final seats the tournament it came out of');
fs.rmSync(dir, { recursive: true, force: true });
