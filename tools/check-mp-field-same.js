// Двое из РАЗНЫХ регионов видят одно и то же поле.
//
// Его снимки, 26 августа, подписаны «разные команды»: один и тот же гранд-финал
// Саммита, а таблицы у двоих разные — у одного вся комната NA Central, у
// другого Океания, Европа и NA Central вперемешку. Это не разные результаты,
// это разные ПОЛЯ: два клиента собрали турнир из разных пулов.
//
// Причина известна и починена: регион читался из личной половины сейва
// (CAREER.player.region), а пул лобби строится по региону. Здесь это
// стережётся с той стороны, с которой видно игроку: одно и то же командное
// состояние, два разных личных региона — состав поля обязан совпасть до ника.
//
//   node tools/check-mp-field-same.js
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
  /* Личное у двоих разное — ник, страна, регион, деньги, — а командное одно и
     то же, как его прислал бы сервер. */
  const asPlayer = (nick, country, region) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:nick, age:19, source:'rookie', country:country, countryPing:15,
              closeRangeEdge:0, region:region, ovr:93, role:'roleIGL',
              attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-20', division:1, earnings:0,
              balance:nick==='Alpha'?48000:0, reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    // Одно и то же командное состояние на обоих клиентах.
    ccApplyTeamState({seed:'team-XYZ', day:'2026-05-20', season:1, division:1,
                      tokens:[], seasonOver:false, sizes:{}, dev:{}, trios:{},
                      log:[], majorSeed:null, spots:{}, mates:[],
                      region:'EU', mp:{code:'ABC123', role:nick==='Alpha'?'a':'b'}});
    skipAnimation=true; CC_SKIP_RUN=true;
    drafted=[careerCard()]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
  };
  /* Состав, а не подпись: внутри СВОЕЙ команды каждый видит себя первым, и это
     единственная разница между двумя клиентами. На расчёт она не влияет —
     сила, статы, синергия и роли у [A,B] и [B,A] совпадают до числа (замерено),
     — а хеш вечера считается по местам и очкам, а не по именам. Поэтому ники
     внутри команды сортируются. */
  const names = (field) => field.map(t=>(t.squad||[]).map(c=>c&&c.handle)
    .sort((x,y)=>String(x).toLowerCase()<String(y).toLowerCase()?-1:1).join('&')).join('|');
  try {
    /* Команда у обоих ОДНА: своя карточка плюс карточка напарника по проводу.
       Собрать двух одиночек и сравнить их поля было бы нечестно — у одиночек
       разная сила своей команды, а значит и сортировка поля разная. */
    asPlayer('Alpha', 'de', 'EU');
    const cardA=careerCard(), wireA=MP.card();
    asPlayer('Bravo', 'au', 'OCE');
    const cardB=careerCard(), wireB=MP.card();

    asPlayer('Alpha', 'de', 'EU');
    check('регион команды один и тот же', ccCareerRegion()==='EU', ccCareerRegion());
    const squadA=[cardA, wireB];
    const youA=Object.assign(careerYouTeam(squadA), {isYou:true, name:'you'});
    const cupA=names(careerCupField(CAREER.career, squadA, ccTeams(50), 'same', false, 0));
    const sumA=names(careerSummitField('final', youA, squadA));

    // Соло-хиты: сотня одна на двоих — те же боты у обоих, напарник в ней участником.
    const soloA=names(careerSoloField(Object.assign({}, CAREER.career, {division:1}), [cardA, wireB], CC_SOLO_FIELD-2, false));
    const qualA=names(careerSoloField(CAREER.career, [cardA, wireB], careerVictoryField(true)-1, true));

    asPlayer('Bravo', 'au', 'OCE');
    const soloB=names(careerSoloField(Object.assign({}, CAREER.career, {division:1}), [cardB, wireA], CC_SOLO_FIELD-2, false));
    const qualB=names(careerSoloField(CAREER.career, [cardB, wireA], careerVictoryField(true)-1, true));
    out.notes.квал={совпало:qualA===qualB, размер:qualA.split('|').length, первые:qualA.split('|').slice(0,3), уВторого:qualB.split('|').slice(0,3)};
    // Красная строка называет первую разошедшуюся строку поля. См. ccMpFieldDiff.
    check('разница поля называет строку', ccMpFieldDiff('a:1|b:2|c:3','a:1|b:4|c:3')===' · diff 1 of 3: #2 b:2 vs b:4', ccMpFieldDiff('a:1|b:2|c:3','a:1|b:4|c:3'));
    check('одинаковые поля — пусто', ccMpFieldDiff('a:1|b:2','a:1|b:2')==='');
    check('открытый квал соло у двоих один и тот же', qualA===qualB, qualA.split('|').slice(0,3).join(' | ')+'  ПРОТИВ  '+qualB.split('|').slice(0,3).join(' | '));
    out.notes.соло={первые:soloA.split('|').slice(0,3), совпало:soloA===soloB, размер:soloA.split('|').length};
    check('сотня соло-хитов у двоих одна и та же', soloA===soloB,
          soloA.split('|').slice(0,3).join(' | ') + '  ПРОТИВ  ' + soloB.split('|').slice(0,3).join(' | '));
    check('и в ней нет ни меня, ни напарника — они стоят отдельно', soloA.indexOf(cardA.handle)<0 && soloA.indexOf(cardB.handle)<0);
    check('и у второго тоже, хотя сам он из Океании',
          ccCareerRegion()==='EU' && CAREER.player.region==='OCE',
          ccCareerRegion() + ' / ' + CAREER.player.region);
    const squadB=[cardB, wireA];
    const youB=Object.assign(careerYouTeam(squadB), {isYou:true, name:'you'});
    check('сила команды у обоих одна', youA.pow===youB.pow, youA.pow + ' / ' + youB.pow);
    const me2=cardB;
    const cupB=names(careerCupField(CAREER.career, squadB, ccTeams(50), 'same', false, 0));
    const sumB=names(careerSummitField('final', youB, squadB));

    // Один и тот же клиент, два раза подряд — оно вообще воспроизводимо?
    const sumA2=names(careerSummitField('final', youB, squadB));
    out.notes.дважды_у_одного=(sumA2===sumB);
    const a=sumA.split('|'), b=sumB.split('|');
    let at=-1; for(let i=0;i<Math.max(a.length,b.length);i++) if(a[i]!==b[i]){ at=i; break; }
    out.notes.перваяРазница={место:at+1, уПервого:a[at], уВторого:b[at], длины:[a.length,b.length]};
    out.notes.кубок={первые:cupA.split('|').slice(0,3), совпало:cupA===cupB};
    out.notes.саммит={первые:sumA.split('|').slice(0,3), совпало:sumA===sumB};
    check('комната кубка у двоих одна и та же', cupA===cupB,
          cupA.split('|').slice(0,3).join(' | ') + '  ПРОТИВ  ' +
          cupB.split('|').slice(0,3).join(' | '));
    check('и поле Саммита тоже', sumA===sumB,
          sumA.split('|').slice(0,3).join(' | ') + '  ПРОТИВ  ' +
          sumB.split('|').slice(0,3).join(' | '));

    /* Комната открытого квала Reload не зависит от устройства, пока карьера
       командная. Его скрин 29 августа: «field …n2100h68 vs …n900h68» — ноутбук
       собрал 2100 дуо, телефон 900, и это два разных турнира с первой игры. */
    CC_SMALL_DEVICE=false; const roomBig=ccOpenRoom();
    CC_SMALL_DEVICE=true;  const roomSmall=ccOpenRoom();
    out.notes.комната={команда:[roomBig, roomSmall]};
    check('комната Reload в команде одна на ноутбуке и телефоне', roomBig===roomSmall,
          roomBig + ' / ' + roomSmall);
    // Контроль: одиночная карьера по-прежнему выбирает комнату по устройству.
    const mpWas=CAREER.career.mp; delete CAREER.career.mp;
    CC_SMALL_DEVICE=false; const soloBig=ccOpenRoom();
    CC_SMALL_DEVICE=true;  const soloSmall=ccOpenRoom();
    CAREER.career.mp=mpWas; CC_SMALL_DEVICE=null;
    out.notes.комната.одиночная=[soloBig, soloSmall];
    check('контроль: в одиночной комната по устройству разная', soloBig>soloSmall,
          soloBig + ' / ' + soloSmall);

    /* Контроль: без командного региона поля обязаны РАЗЪЕХАТЬСЯ. Иначе первая
       половина проверки зелёная просто потому, что регион в поле не участвует. */
    delete CAREER.career.region;
    ccWorldReset();
    const cupNoTeam=names(careerCupField(CAREER.career, [me2], ccTeams(50), 'same', false, 0));
    check('контроль: без командного региона поле другое', cupNoTeam!==cupA,
          cupNoTeam.split('|').slice(0,2).join(' | '));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fieldsame-'));
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
console.log('двое из разных регионов играют один и тот же турнир');
fs.rmSync(dir, { recursive: true, force: true });
