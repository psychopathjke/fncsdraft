// Строка гонки везёт ТЕ ЖЕ шесть чисел, что стоят в своей команде.
//
// Годовая проба на двоих (10.09, отметка drop): поле одно, сила одна, а числа
// движка у одной и той же команды разные —
//   #1 live1+sky:112:97.99.93.94:300  vs  live1+sky:112:85.87.93.93:300
// Слева команда у себя (careerYouTeam), справа — она же, собранная соперником
// из строки гонки (ccRacePackCard → ccRaceRivalTeam). Сила равна, потому что
// она едет числом; шесть чисел считаются заново с карточки, и вот они разошлись.
//
// Здесь тот же вход, что у пробы гонки: новичок-ИГЛ, напарник из ростера сцены,
// развитие напарника (dev) и подросший рейтинг — и обе стороны печатаются
// по карточкам.
//
//   node tools/check-race-line-attrs.js
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
  const six = c => { const a = c ? attrsFor(c) : null;
    return a ? [a.end, a.sur, a.aim, a.clu, 'ovr' + Math.round(a.ovr), a.roleKey || '-'].join('.') : 'нет'; };
  const teamSix = t => { const a = t && t.attrs; return a ? [a.END, a.SUR, a.AIM, a.CLU].join('.') : 'нет'; };
  try {
    CARD_MODE = true; squadSize = 2;
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Live1', age:17, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-01', division:1, earnings:48000, balance:48000, reach:30000,
              tokens:[], log:[], news:[], form:3, grind:12},
      partners:[]}));
    { const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
      s.player.attrs = ccRookieAttrs(90, 'roleIGL');
      localStorage.setItem('fncsdraft_career', JSON.stringify(s)); }
    careerEntry();
    // Напарник — как в пробе гонки: первый из ростера сцены.
    { const pool = ccSceneRoster(ccCareerRegion()).filter(c => hKey(c) !== hKey(careerCard()));
      const card = pool[0];
      if(!card) throw new Error('нет карточки напарника');
      careerMateSeat({handle: card.handle, cardRegion: card.region,
                      patience: CAREER_PATIENCE_START, since: ccAddDays(careerToday(), -CC_CHEM_DAYS)});
      out.notes.mate = card.handle; }
    // Карьера подросла, как за два месяца: рейтинг выше стартового, напарник развит.
    CAREER.player.ovr = 93; CAREER.player.ovrExact = 93.4;
    if(CAREER.partners[0]) CAREER.partners[0].dev = 3;
    careerSave();

    const me = careerCard(), mates = careerMates();
    const drafted = [me].concat(mates);
    const mine = careerYouTeam(drafted.slice());
    out.notes.own = {team: teamSix(mine), pow: mine.pow,
                     cards: mine.squad.map(c => c.handle + ' ' + six(c))};

    // Так строка уезжает соперникам (ccRaceMyLine) и так он её собирает.
    const wireCard = (typeof MP !== 'undefined' && MP.card) ? MP.card() : me;
    const line = JSON.parse(JSON.stringify({id:'zz', card: ccRacePackCard(wireCard),
      mates: mates.map(ccRacePackCard), pow: mine.pow, edge: mine.closeEdge, squad: 2, ev: 'ev1'}));
    out.notes.wireAttrs = {card: line.card && line.card._attrs ? 'есть' : 'НЕТ',
                           mate: line.mates[0] && line.mates[0]._attrs ? 'есть' : 'НЕТ'};
    const his = ccRaceRivalTeam(line);
    out.notes.his = his ? {team: teamSix(his), pow: his.pow,
                           cards: (his.squad || []).map(c => c.handle + ' ' + six(c))} : null;

    check('соперник собрал команду', !!his);
    if(his){
      check('сила та же', mine.pow === his.pow, mine.pow + ' vs ' + his.pow);
      check('ЧИСЛА ДВИЖКА ТЕ ЖЕ', teamSix(mine) === teamSix(his), teamSix(mine) + ' vs ' + teamSix(his));
      check('край ближнего боя тот же', (mine.closeEdge||0) === (his.closeEdge||0),
            (mine.closeEdge||0) + ' vs ' + (his.closeEdge||0));
    }

    /* ВТОРАЯ ПОЛОВИНА — та, из-за которой вечера и расходились. Соперник может
       УЖЕ СТОЯТЬ в моём поле: команда из пула, из записи прошлой стадии, из
       ростера. Тогда ccRaceFieldSync берёт её, переписывая силу и край из строки.
       Шесть чисел при этом оставались моими — сцена у каждого своя. */
    CAREER.career.race = {code:'ZZZZZZ', role:'a', since: careerToday()};
    CC_RACE_LOCK = true; CC_MP_ALONE = false; CC_MP_SEED = null;
    CC_RACE_PEERS = {zz: Object.assign({id:'zz', day: careerToday(), season:1, div:1}, line)};
    // Команда соперника, собранная МОЕЙ сценой: те же ники, свои шесть чисел.
    const poolCards = [Object.assign({}, me), Object.assign({}, mates[0])];
    poolCards.forEach(c => { c._attrs = ccRookieAttrs(83, 'roleFRG'); });
    const poolTeam = careerTeam(poolCards, true);
    poolTeam.name = 'pool ' + poolCards.map(c => c.handle).join(' & ');
    out.notes.pool = {team: teamSix(poolTeam), pow: poolTeam.pow};
    const R = careerRosterNowEU();
    const field = [Object.assign(careerTeam([R[20], R[21]], true), {isYou:true, mpTag:':me'}),
                   poolTeam,
                   careerTeam([R[30], R[31]], true)];
    await ccRaceFieldSync(field, {});
    const seated = field.find(t => t.isRival);
    out.notes.seated = seated ? {team: teamSix(seated), pow: seated.pow, name: String(seated.name||'').slice(0, 40)} : null;
    check('соперник сел в поле', !!seated);
    if(seated){
      check('сила соперника — из строки', seated.pow === mine.pow, seated.pow + ' vs ' + mine.pow);
      check('ЧИСЛА ДВИЖКА СОПЕРНИКА — ИЗ СТРОКИ, А НЕ ИЗ СВОЕЙ СЦЕНЫ',
            teamSix(seated) === teamSix(mine), teamSix(seated) + ' vs ' + teamSix(mine));
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccline-'));
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
console.log('строка гонки везёт те же шесть чисел, что стоят в своей команде');
