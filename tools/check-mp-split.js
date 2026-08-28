// Что принадлежит команде, а что человеку — и ничего между.
//
// Командная карьера стоит на локстепе: двое считают вечер сами, а по сети летят
// решения. Это работает ровно до тех пор, пока личное (деньги, форма, энергия,
// контракт, инбокс) в расчёт не течёт, а командное (день, сезон, дивизион,
// журнал, книга роста, память третьих, посев мейджора) у обоих одинаковое.
//
// Здесь проверяется сама граница: что уезжает в снимок, что остаётся дома, что
// переписывается приходом чужого состояния и что при этом мир сбрасывается.
// Сходимость расчёта после этой границы стережёт tools/check-lockstep.js.
//
//   node tools/check-mp-split.js
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
    seed('EU', 2);
    const cr = CAREER.career;
    cr.balance = 48000; cr.earnings = 12000; cr.form = 3; cr.grind = 2;
    cr.log = [{season:1, day:'2026-02-02', place:4, kind:'cup'}];
    /* Книга роста лежит в CAREER.dev, а не в CAREER.career.dev — и раньше
       эта проверка писала cr.dev, то есть стерегла поле, которого в игре
       нет. Снимок молча пропускал книгу, у двоих росли разные сцены, а
       проверка была зелёной. Его отчёт: «180 дней промотал, мой игрок вырос,
       напарник упал». Пишем туда, куда пишет игра. */
    CAREER.dev = {scroll:6};
    CAREER.coach = {id:'kha0rz', from:'2026-07-01', until:'2026-08-01'};
    cr.trios = {'a+b':'c'};
    cr.majorSeed = {n:1, season:1, size:2, rows:['you']};
    cr.tokens = ['t1']; cr.sizes = {1:2};

    const t = ccTeamState();
    out.notes.team = Object.keys(t).sort();
    // Командное — только то, что названо, и ничего сверх. chemSince — день,
    // с которого у команды идёт стаж дуо (28 августа, см. careerChemDays).
    check('состав командных полей ровно такой, как в спеке',
          out.notes.team.join(',') ===
          ['beefs','chemSince','coach','d1','day','dev','diff','division','duoSplits','duoStreak',
           'events','ewc','gcSeed','gclc','globals','lft','log','major','majorSeed',
           'mates','mp','rc','region','rel','relSeed','reload','season','seasonOver',
           'seasonTurn','seed','sizes','solo','splits','spots','summit','summitSeed',
           'table','tokens','trios','wf'].join(','),
          out.notes.team.join(','));
    check('журнал команды уехал', Array.isArray(t.log) && t.log.length === 1);
    check('книга роста уехала', t.dev && t.dev.scroll === 6, JSON.stringify(t.dev));
    check('коуч уехал — он общий', t.coach && t.coach.id === 'kha0rz', JSON.stringify(t.coach));
    /* Память сцены о чужих парах: серия провалов, кто развёлся, кто ищет
       третьего. Копится из результата вечера и живёт в CAREER, а не в
       CAREER.career — ровно там же, где пряталась книга роста. */
    CAREER.duoStreak = {'a+b':3}; CAREER.splits = {'c+d':'2026-05-01'};
    CAREER.lft = {'e+f':'2026-05-02'};
    const t3 = ccTeamState();
    ['duoStreak','splits','lft'].forEach(k =>
      check('память сцены ' + k + ' уехала в команду', t3[k] !== undefined, String(t3[k])));
    /* И обратная сторона того же списка. CC_TEAM_TOP — новый (28 августа), а
       на верхнем уровне CAREER живёт почти вся личная жизнь: менеджер, клуб,
       квартира, девайсы, спонсор, инбокс, предложения. Его слово, 27 августа:
       «менедежеры свои и тд». Один лишний ключ в списке — и напарник получает
       чужой контракт вместе с книгой роста. */
    CAREER.agent={name:'кто-то'}; CAREER.org={name:'клуб'};
    CAREER.flat={id:'кв'}; CAREER.gear={own:['мышь']};
    CAREER.sponsor={id:'бренд'}; CAREER.dms=[{id:'письмо'}];
    CAREER.offers=[{id:'офер'}]; CAREER.pitch={until:'2026-09-01'};
    const t4 = ccTeamState();
    ['agent','org','flat','gear','sponsor','dms','offers','pitch'].forEach(k =>
      check('личное верхнего уровня ' + k + ' не уезжает в команду',
            t4[k] === undefined, JSON.stringify(t4[k])));
    /* Сложность считается настройкой человека, а умножает рост сцены
       (careerDevelopNow -> careerGrowField): двое на разной сложности за год
       вырастят разных людей. Поэтому она командная. */
    cr.diff = 'hard';
    check('сложность командная — иначе двое растят разные сцены',
          ccTeamState().diff === 'hard', String(ccTeamState().diff));
    // Состояние мира, добавленное 27 августа: посевы и разводы дуо.
    cr.duoSplits = {'a+b':1}; cr.relSeed = {next:'heat'}; cr.summitSeed = {season:1};
    cr.gcSeed = {season:1};
    ['duoSplits','relSeed','summitSeed','gcSeed'].forEach(k =>
      check('состояние мира ' + k + ' уехало в команду',
            ccTeamState()[k] !== undefined, String(ccTeamState()[k])));
    check('память третьих уехала', t.trios && t.trios['a+b'] === 'c');
    // Личное — не уехало.
    /* Личное — по его списку, 27 августа: «баланс у каждого свой ирнинг у
       каждого свой, менедежеры свои и тд», «сошиал у каждого свой». */
    cr.reach = 9000; cr.twitch = {on:true}; cr.orgCut = 500;
    const t2 = ccTeamState();
    ['balance','earnings','form','grind','reach','twitch','orgCut'].forEach(k =>
      check('личное поле ' + k + ' не в командном состоянии', t2[k] === undefined, String(t2[k])));
    /* И доска ПР отдельно, потому что вопрос про неё стоял прямо: вечер
       считают ОБА браузера, и каждый зовёт careerPrAdd. Если бы доска была
       командной, вечер записался бы на неё дважды. Она личная — у каждого
       свой экземпляр, и метка «это ты» стоит на своём нике. */
    cr.pr = {rows:{me:{v:[[90, 1]], n:1, you:true}}};
    check('доска ПР личная — иначе вечер записался бы дважды',
          ccTeamState().pr === undefined, JSON.stringify(ccTeamState().pr));

    // Снимок не связан с живым сейвом: правка снимка не двигает карьеру.
    t.day = '2099-01-01';
    check('снимок отвязан от карьеры', CAREER.career.day !== '2099-01-01', CAREER.career.day);

    // Приход чужого состояния переписывает командное и НЕ трогает личное.
    ccApplyTeamState({day:'2026-05-05', season:2, division:3, tokens:[], seasonOver:false,
                      sizes:{1:2,2:3}, dev:{}, trios:{}, log:[], majorSeed:null,
                      seed:'team-XYZ', mp:{code:'ABC123', role:'b'}});
    check('день пришёл от сервера', CAREER.career.day === '2026-05-05', CAREER.career.day);
    ccApplyTeamState({dev:{scroll:9}, coach:{id:'Xplot'}});
    check('книга роста пришла в CAREER.dev, а не в career',
          CAREER.dev && CAREER.dev.scroll === 9, JSON.stringify(CAREER.dev));
    check('коуч пришёл от напарника', CAREER.coach && CAREER.coach.id === 'Xplot',
          JSON.stringify(CAREER.coach));
    check('дивизион тоже', CAREER.career.division === 3, String(CAREER.career.division));
    check('деньги остались свои', CAREER.career.balance === 48000, String(CAREER.career.balance));
    check('форма осталась своя', CAREER.career.form === 3, String(CAREER.career.form));
    check('мир сброшен приходом состояния', CC_POOLS === null && CC_YEAR_DAYS === null);
    check('карьера стала командной', ccMpOn() === true, String(ccMpOn()));

    // Одиночная карьера ничего не заметила: сейв как был.
    delete CAREER.career.mp;
    careerSave(); careerLoad();
    check('одиночный сейв пишется и читается целиком',
          CAREER.career.balance === 48000 && CAREER.career.day === '2026-05-05',
          CAREER.career.balance + ' / ' + CAREER.career.day);
    check('и она снова одиночная', ccMpOn() === false);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpsplit-'));
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
console.log('командное уходит наверх, личное остаётся дома');
fs.rmSync(dir, { recursive: true, force: true });
