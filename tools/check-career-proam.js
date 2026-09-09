// Pro-Am Creator Series, Даллас 12 июля 2026 — числа Epic'овы, допуск наш.
//
// Проверяется ровно то, что можно проверить без прогона вечера: календарь,
// формат, лестница очков, призовые (таблица + бонусы за игры = ровно $50 000),
// напарник-креатор и правило приглашения. Плюс трансферы сцены: новые пары
// объявляются, месячный «кто вырос и кто просел» приходит раз в месяц.
//
//   node tools/check-career-proam.js
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
    const fresh = () => { CAREER = {player:{nick:'Probe', ovr:88, region:'EU', role:'roleIGL',
      country:'de', age:19, attrs:ccRookieAttrs(88,'roleIGL')},
      career:{season:1, day:'2026-07-12', division:1, balance:0, earnings:0, reach:0,
              energy:CC_ENERGY_DAY, did:{}, log:[], news:[], school:'out'},
      partners:[{card:{handle:'Mate', region:'EU', tier:'ranked', rating:88, _targetOvr:88,
                     _attrs:ccRookieAttrs(88,'roleFRG')}, patience:60}],
      gear:{own:[], train:0}, sponsor:null, org:null, coach:null}; };
    careerRenderHub = function(){};
    careerSave = function(){};

    // ---- календарь ---------------------------------------------------------
    fresh();
    const day = '2026-07-12';
    const ev = careerProAmOn(day);
    out.notes.day = day;
    check('the Pro-Am is on the calendar on 12 July', !!ev && ev.kind === 'proam',
          JSON.stringify(ev));
    check('and nowhere in June', (function(){
      for (let d = '2026-06-01'; d <= '2026-06-30'; d = ccAddDays(d, 1))
        if ((careerYearDays().get(d) || []).some(e => e.kind === 'proam')) return false;
      return true; })());
    check('exactly one Pro-Am in the year', (function(){
      let n = 0;
      for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
        n += (careerYearDays().get(d) || []).filter(e => e.kind === 'proam').length;
      out.notes.proamDays = n; return n === 1; })(), String(out.notes.proamDays));
    check('it is a playable kind', CC_PLAYABLE.indexOf('proam') >= 0);
    check('and the day names it', !!(L().ccYearNames && L().ccYearNames.ProAm_Dallas));

    // ---- формат и очки (Liquipedia, сверено обратным счётом) ----------------
    check('seven games, twenty teams', CC_PROAM_GAMES === 7 && CC_PROAM_TEAMS === 20);
    check('three points per elimination', CC_PROAM_KILL === 3);
    const ladder = [60,50,45,40,35,30,27,24,21,18,15,12,9,6,3];
    check('the placement ladder is Epic\\'s own',
          ladder.every((v, i) => proAmPoints(i + 1) === v) && proAmPoints(16) === 0,
          JSON.stringify([1,2,3,15,16,20].map(p => proAmPoints(p))));
    check('the ladder only falls', (function(){
      for (let p = 2; p <= 15; p++) if (proAmPoints(p) > proAmPoints(p - 1)) return false;
      return true; })());

    // ---- призовые: таблица + бонусы = ровно пятьдесят тысяч -----------------
    const table = CC_PROAM_PRIZE.reduce((a, b) => a + b, 0);
    const games = CC_PROAM_GAME.reduce((a, b) => a + b, 0) * CC_PROAM_GAMES;
    out.notes.prize = {table: table, perGame: games, total: table + games};
    check('the prize table is twenty places', CC_PROAM_PRIZE.length === 20);
    check('the table pays $38,100', table === 38100, String(table));
    check('the per-game bonuses pay $11,900', games === 11900, String(games));
    check('and the pot closes at exactly $50,000', table + games === 50000, String(table + games));
    check('first place is $10,000', CC_PROAM_PRIZE[0] === 10000);
    check('the prize table never rises', (function(){
      for (let i = 1; i < CC_PROAM_PRIZE.length; i++)
        if (CC_PROAM_PRIZE[i] > CC_PROAM_PRIZE[i - 1]) return false;
      return true; })());

    /* ---- приглашение: письмо, ответ, выбор пары ----------------------------
       Его правка 4 сентября: известность приводит ПИСЬМО, а не автобус до
       Далласа. Поехать можно только по принятому приглашению, а напарника
       выбирает сам игрок. */
    fresh(); CAREER.career.reach = 0; CAREER.dms = [];
    check('an unknown player is not invited', careerProAmInviteTick() === null);
    check('and cannot go', careerProAmCan() === false);
    check('and is told why', String(ccProAmWhyLocked()).length > 0 &&
          ccProAmWhyLocked() !== L().ccProAmPlayed);
    // Письмо приходит заранее, а не в день турнира.
    fresh(); CAREER.dms = [];
    CAREER.career.reach = CC_PROAM_REACH;
    CAREER.career.day = ccAddDays('2026-07-12', -CC_PROAM_INVITE_DAYS - 1);
    check('nobody writes a month out', careerProAmInviteTick() === null);
    CAREER.career.day = ccAddDays('2026-07-12', -CC_PROAM_INVITE_DAYS);
    const inviteT = careerProAmInviteTick();
    out.notes.invite = inviteT && {who: inviteT.who.handle, msgs: inviteT.msgs.map(m => m.k)};
    check('fame brings a letter', !!inviteT && inviteT.proam === true,
          JSON.stringify(out.notes.invite));
    check('from the club hosting it', !!inviteT && inviteT.who.handle === CC_PROAM_HOST);
    check('and it is unread', !!inviteT && inviteT.unread === true);
    check('one letter, not one a day', careerProAmInviteTick() === null);
    // Пока не ответил — не едешь.
    CAREER.career.day = '2026-07-12';
    check('an unanswered invite is not a ticket', careerProAmCan() === false);
    check('and the screen says so', ccProAmWhyLocked() === L().ccProAmUnanswered);
    // Отказ держится до конца сезона.
    check('you can turn it down', careerProAmNo(inviteT.id) === true);
    check('and then you do not go', careerProAmCan() === false);
    check('and that is what it says', ccProAmWhyLocked() === L().ccProAmTurnedDown);
    check('a declined invite cannot be un-declined', careerProAmYes(inviteT.id) === false);
    // Согласие открывает турнир и выбор пары.
    fresh(); CAREER.dms = [];
    CAREER.career.reach = CC_PROAM_REACH;
    CAREER.career.day = ccAddDays('2026-07-12', -CC_PROAM_INVITE_DAYS);
    const t2 = careerProAmInviteTick();
    check('saying yes gets you in', careerProAmYes(t2.id) === true);
    CAREER.career.day = '2026-07-12';
    check('and now you can go', careerProAmCan() === true);
    const picks = careerProAmPickList();
    out.notes.picks = picks;
    check('every creator is on offer', picks.length === ccProAmCreators().length && picks.length > 20,
          JSON.stringify(picks));
    check('each of them is a real creator',
          picks.every(n => ccProAmCreators().indexOf(n) >= 0));
    check('the list does not change on a redraw',
          careerProAmPickList().join() === picks.join());
    // Свой регион первым, внутри региона — по аудитории.
    check('own region comes first', (function(){
      const mine = CC_PROAM_CREATORS_BY_REGION[ccCareerRegion()] || [];
      return mine.length === 0 || mine.some(n => hKey(n) === hKey(picks[0])); })(), picks[0]);
    check('the letter comes from Fortnite itself', CC_PROAM_HOST === 'Fortnite' && t2.who.epic === true);
    check('a name off the list is refused', careerProAmPick(t2.id, 'Nobody') === false);
    check('and one on it is taken', careerProAmPick(t2.id, picks[2]) === true);
    check('the chosen creator is who you play with',
          ccProAmMate().handle === picks[2], ccProAmMate().handle);
    check('and the field does not seat him twice', (function(){
      const mate = ccProAmMate();
      const rivals = ccProAmField(CAREER.career, [careerCard(), mate], mate);
      return rivals.every(t => t.squad.every(c => hKey(c.handle) !== hKey(mate.handle))); })());
    // Согласился и никого не выбрал — пара всё равно есть.
    fresh(); CAREER.dms = [];
    CAREER.career.reach = CC_PROAM_REACH;
    CAREER.career.day = ccAddDays('2026-07-12', -CC_PROAM_INVITE_DAYS);
    careerProAmYes(careerProAmInviteTick().id);
    CAREER.career.day = '2026-07-12';
    check('no pick still leaves you a partner', !!ccProAmMate().handle);
    CAREER.career.proam = {1: '2026-07-12'};
    check('but only once a season', careerProAmCan() === false);
    check('and that reason is named too', ccProAmWhyLocked() === L().ccProAmPlayed);
    CAREER.career.day = '2026-07-13'; CAREER.career.proam = {};
    check('and only on its own day', careerProAmCan() === false);

    // ---- напарник-креатор ---------------------------------------------------
    fresh();
    const m1 = ccProAmMate(), m2 = ccProAmMate();
    out.notes.mate = {who: m1.handle, ovr: m1._ovr};
    check('the partner is a real creator from the published field',
          ccProAmCreators().indexOf(m1.handle) >= 0, m1.handle);
    check('a creator is weaker than a pro', m1._ovr <= CC_PROAM_CREATOR_HI && m1._ovr >= CC_PROAM_CREATOR_LO, String(m1._ovr));
    check('the draw is seeded, not random', m1.handle === m2.handle && m1._ovr === m2._ovr);
    CAREER.career.season = 2;
    const m3 = ccProAmMate();
    check('a new season brings a new creator', m3.handle !== m1.handle || m3._ovr !== m1._ovr);
    check('the creator is marked as one', m1.creator === true);

    // ---- половина поля — контент-мейкеры (его слово 4 сентября) -----------
    fresh();
    /* Креаторы — по региону карьеры: у Европы своё поле (её остановки у Epic
       нет, поле собрано из настоящих европейских составов), у NAC Даллас, у
       Бразилии Сан-Паулу. И у каждого региона их ровно двадцать — по одному
       на команду. */
    /* Пул — СО ВСЕХ РЕГИОНОВ (его правка 4 сентября), свои впереди. Проверяем
       не «двадцать на регион», а то, что важно: список длиннее одного лобби,
       без повторов, начинается со своих и содержит чужих. */
    const creatorPool = ccProAmCreators();
    out.notes.creatorPool = {n: creatorPool.length, head: creatorPool.slice(0, 3), region: ccCareerRegion()};
    check('the creatorPool fills a lobby and then some', creatorPool.length >= CC_PROAM_TEAMS,
          JSON.stringify(out.notes.creatorPool));
    check('nobody is in the creatorPool twice',
          new Set(creatorPool.map(n => hKey(n))).size === creatorPool.length);
    check('your own region comes first',
          creatorPool.slice(0, CC_PROAM_CREATORS_EU.length).every(n =>
            CC_PROAM_CREATORS_EU.some(x => hKey(x) === hKey(n))), JSON.stringify(creatorPool.slice(0,3)));
    check('and the rest of the world is in there too',
          creatorPool.some(n => CC_PROAM_CREATORS_NAC.some(x => hKey(x) === hKey(n))) &&
          creatorPool.some(n => CC_PROAM_CREATORS_BR.some(x => hKey(x) === hKey(n))));
    check('every bucket is free of repeats',
          Object.keys(CC_PROAM_CREATORS_BY_REGION).every(r => {
            const l = CC_PROAM_CREATORS_BY_REGION[r].map(n => hKey(n));
            return new Set(l).size === l.length; }));
    check('the creator card wears the Exotic rarity',
          shownRarity({creator:true}) === 'exotic' && !!RARITY_COLOR.exotic &&
          !!L().ccRarityexotic, RARITY_COLOR.exotic);
    check('and its rating is his number', CC_PROAM_CREATOR_OVR === 67);

    /* Твич креаторов: ник и фолловеры сняты с самого Twitch. Проверяем не
       числа (они меняются), а устройство: таблица большая, у карточки есть
       канал и аудитория, и вечер рядом с большим креатором приносит больше
       подписчиков, чем рядом с маленьким, но не больше потолка. */
    check('the Twitch table covers most of the pool',
          Object.keys(CC_PROAM_TWITCH).length >= CC_PROAM_TEAMS * 2,
          String(Object.keys(CC_PROAM_TWITCH).length));
    /* Порог в пять тысяч был костылём против тёзок; 4 сентября его заменило
       прямое опознание канала (поиск Twitch + сверка по описанию, языку и
       последнему эфиру), поэтому опознанный человек стоит с любым числом. */
    check('every entry is a login and a follower count',
          Object.keys(CC_PROAM_TWITCH).every(k => {
            const v = CC_PROAM_TWITCH[k];
            return Array.isArray(v) && typeof v[0] === 'string' && v[0].length > 1 && v[1] > 0; }));
    check('a creator card carries the channel', (function(){
      const c = ccProAmCreatorCard('Jynxzi');
      return c.tw === 'jynxzi' && c.followers > 1000000; })());
    check('a name with no verified channel carries none', (function(){
      const c = ccProAmCreatorCard('Mawkzy');
      return c.tw === null && c.followers === 0; })());
    check('a bigger creator brings more of an audience',
          ccProAmReachFrom('Jynxzi') > ccProAmReachFrom('Crackly') &&
          ccProAmReachFrom('Crackly') > 0);
    check('and the audience is capped',
          ccProAmReachFrom('Jynxzi') === CC_PROAM_REACH_CAP);
    check('no channel, no audience', ccProAmReachFrom('Mawkzy') === 0);
    check('the night says who you sat with', !!L().ccProAmMateLine &&
          String(L().ccProAmMateLine('x', '1')).indexOf('x') >= 0);
    const mineMate = ccProAmMate();
    const rivals = ccProAmField(CAREER.career, [careerCard(), mineMate], mineMate);
    out.notes.field = {teams: rivals.length, squads: rivals.slice(0,3).map(t=>t.squad.map(c=>c.handle))};
    check('nineteen rival teams are built', rivals.length === CC_PROAM_TEAMS - 1,
          JSON.stringify(out.notes.field));
    check('every rival team is a pro and a creator', rivals.every(t =>
      t.squad.length === 2 && t.squad.filter(c => c.creator).length === 1),
      JSON.stringify(out.notes.field.squads));
    check('a creator is the weaker half', rivals.every(t => {
      const cr8 = t.squad.find(c => c.creator), pro = t.squad.find(c => !c.creator);
      return (cr8._ovr || 0) <= (pro._ovr != null ? pro._ovr : (attrsFor(pro)||{}).ovr || 99); }));
    check('your own creator is not in another team', !rivals.some(t =>
      t.squad.some(c => c.creator && hKey(c.handle) === hKey(mineMate.handle))), mineMate.handle);
    check('no creator sits in two teams at once', (function(){
      const seen = new Set();
      return rivals.every(t => { const c = t.squad.find(x => x.creator);
        if (!c || seen.has(hKey(c.handle))) return false; seen.add(hKey(c.handle)); return true; }); })());
    check('and no pro plays twice', (function(){
      const seen = new Set();
      return rivals.every(t => { const p = t.squad.find(x => !x.creator);
        if (!p || seen.has(hKey(p))) return false; seen.add(hKey(p)); return true; }); })());

    // ---- трансферы сцены ----------------------------------------------------
    fresh();
    check('the first sweep only takes a snapshot', careerSceneMovesTick() === 0);
    check('and the snapshot is kept', !!CAREER.career.pairs &&
          Object.keys(CAREER.career.pairs).length > 0);
    // Развели одну пару руками — на следующей сверке должна выйти новость.
    const keys = Object.keys(CAREER.career.pairs);
    const a = keys[0], b = CAREER.career.pairs[a].split('+')[0];
    const c = keys.find(k => k !== a && k !== b && CAREER.career.pairs[k] !== a);
    CAREER.career.pairs[a] = c; CAREER.career.pairs[c] = a;
    const posted = careerSceneMovesTick();
    out.notes.moves = posted;
    check('a changed pair is announced', posted > 0, String(posted));
    check('not more than two a day', posted <= CC_MOVE_POSTS_DAY);
    check('the transfer post has an author', CC_POST_BY.ccNewsSceneDuo === 'by');
    check('nothing is announced twice', careerSceneMovesTick() === 0);

    // ---- кто вырос и кто просел --------------------------------------------
    fresh();
    CAREER.dev = {};
    check('no development, no monthly line', careerSceneRiseTick() === false);
    const pool = careerRosterNowEU().slice(0, 4);
    CAREER.dev[hKey(pool[0])] = 6;
    CAREER.dev[hKey(pool[1])] = -5;
    check('the month names a riser and a faller', careerSceneRiseTick() === true);
    const news = CAREER.career.news || [];
    check('and both lines are posted',
          news.some(n => n.k === 'ccNewsSceneRise') && news.some(n => n.k === 'ccNewsSceneFall'),
          JSON.stringify(news.map(n => n.k)));
    check('once a month, not once a day', careerSceneRiseTick() === false);
    CAREER.career.day = ccAddDays(CAREER.career.day, 31);
    check('and again next month', careerSceneRiseTick() === true);
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccproam-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('FAILED: ' + out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('Pro-Am Dallas: calendar, format, Epic ladder, $50,000 pot, creator partner, fame gate; scene transfers and the monthly riser');
