// Карьера ЗА контент-мейкера: третья вкладка на экране создания.
//
// Его правка 4 сентября: «добавь рядом ещё контент-мейкеры, чтоб могли выбрать
// за них играть». Правило здесь одно: креатор — это живой человек, а не третий
// вид новичка. Значит имя его, рейтинг общий для всех креаторов, статы не
// дарятся, а аудитория переезжает настоящая, снятая с Twitch.
//
//   node tools/check-career-creator.js
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
    localStorage.removeItem('fncsdraft_career');
    openCareerCreate();

    // ---- вкладка ------------------------------------------------------------
    check('the screen offers a third way in', !!document.getElementById('ccTabCreator'));
    ccSetMode('creator');
    check('and it is the one selected',
          document.getElementById('ccTabCreator').classList.contains('on') &&
          !document.getElementById('ccTabRookie').classList.contains('on'));
    const cards = document.getElementById('ccCards');
    check('the list is drawn', cards.style.display !== 'none' &&
          cards.innerHTML.indexOf('cc-card-cre') >= 0);
    check('everybody in it is a real creator', ccProAmCreators().length > 50);
    /* Аудитория — то, чем креаторы отличаются друг от друга, поэтому она стоит
       на карточке вместо клуба. */
    check('the list shows what they are famous for',
          cards.innerHTML.indexOf(String(L().ccCreatorFollowers(ccNum(ccProAmFollowers('Ibai'))))) >= 0);
    check('and says so where no channel is confirmed',
          cards.innerHTML.indexOf(String(L().ccCreatorNoTw)) >= 0);

    // ---- выбор --------------------------------------------------------------
    check('a name off the list is refused', (function(){
      ccPickCreator('Nobody At All'); return !CC.creator; })());
    ccPickCreator('Ibai');
    check('picking one takes his name', CC.creator === 'Ibai' &&
          document.getElementById('ccNick').value === 'Ibai');
    check('and you cannot rename him', document.getElementById('ccNick').disabled === true);
    /* Регион — тот, где он правда играет: пул сгруппирован по сценам, СНГ сводится
       к Европе, потому что отдельного региона СНГ в Фортнайте нет. */
    check('the career runs in his own region', CC.region === 'EU', CC.region);
    check('a japanese creator brings Asia with him', (function(){
      ccPickCreator('Nephrite'); const r = CC.region; ccPickCreator('Ibai'); return r === 'ASIA'; })());
    check('and a CIS one plays in Europe', ccCreatorRegion('Evelone') === 'EU');
    check('the start button is live without a country', (function(){
      ccSync(); return document.getElementById('ccStart').disabled === false; })());
    check('the preview is his card', (function(){
      const c = ccCreatorCard('Ibai');
      return c.rating === CC_PROAM_CREATOR_OVR && c.creator === true; })());
    check('and it wears the creator rarity', shownRarity(ccCreatorCard('Ibai')) === 'exotic');
    // Статы на этом экране раздают только построенному игроку.
    check('nobody hands a real person free stats',
          document.getElementById('ccSpField').style.display === 'none');

    // ---- сама карьера -------------------------------------------------------
    ccPickCreator('Ibai');
    ccStart();
    const pl = CAREER.player, cr = CAREER.career;
    out.notes.start = {nick: pl.nick, ovr: pl.ovr, reach: cr.reach, twitch: cr.twitch,
                       region: pl.region, source: pl.source};
    check('the career is his', pl.nick === 'Ibai' && pl.source === 'creator' && pl.creator === true,
          JSON.stringify(out.notes.start));
    check('every creator plays at the same rating', pl.ovr === CC_PROAM_CREATOR_OVR, String(pl.ovr));
    check('no country edge and no age edge', pl.closeRangeEdge === 0 && pl.ageEdge === 0);
    /* Подписчики переезжают НАСТОЯЩИЕ — это снятое с Twitch число, а известность
       в сцене считается той же долей, которой мод меряет чужую аудиторию. */
    check('his Twitch following comes with him',
          cr.twitch === ccProAmFollowers('Ibai') && cr.twitch > 1000000, String(cr.twitch));
    check('and the scene knows him accordingly',
          cr.reach === Math.round(ccProAmFollowers('Ibai') * CC_PROAM_REACH_SHARE) && cr.reach > 0,
          String(cr.reach));
    check('a big channel starts better known than a division 1 rookie',
          cr.reach > CC_REACH_D1, String(cr.reach));
    check('the hub draws his card as exotic', shownRarity(careerCard()) === 'exotic');
    /* И РИСУЕТ ЕЁ ЭТИМ ЦВЕТОМ. Его отчёт 4 сентября — «у карточки цвет не
       exotic»: shownRarity говорил exotic, а CARD_SKIN такого ключа не знал,
       и futCardHTML падал на common, то есть на серую карточку. Проверять
       редкость мало — надо проверять краску. */
    check('CARD_SKIN knows the rarity it is asked for', !!CARD_SKIN.exotic,
          Object.keys(CARD_SKIN).join(','));
    check('and the card is painted with it', (function(){
      const html = futCardHTML(careerCard(), {wide: true});
      return html.toLowerCase().indexOf('70c7f8') >= 0; })(),
      'no #70C7F8 anywhere on the card');
    check('the word on it is the exotic one',
          futCardHTML(careerCard(), {wide: true}).indexOf(L().ccRarityexotic.toUpperCase()) >= 0);
    /* Маленький канал — маленькая известность: приглашение на Про-Ам ещё надо
       заслужить, слава на Twitch его не заменяет. */
    localStorage.removeItem('fncsdraft_career');
    openCareerCreate(); ccSetMode('creator'); ccPickCreator('Shinck'); ccStart();
    out.notes.small = {reach: CAREER.career.reach, twitch: CAREER.career.twitch};
    check('a small channel starts small', CAREER.career.reach < CC_PROAM_REACH,
          JSON.stringify(out.notes.small));
    check('but his followers are his own',
          CAREER.career.twitch === ccProAmFollowers('Shinck'));
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccre-'));
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
console.log('creator career: the tab, the list, his name, his rating, his audience');
