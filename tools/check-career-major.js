// The Major, stage by stage, through the real interface.
//
// Measured off Tracker's FNCS Major 2 Europe pages:
//   Play-In  Division 1 only ("Reach FNCS Division 1 to unlock this event"),
//            22 matches, a kill worth 2.
//   Heats    5 matches, a kill worth 3, top 10 of a group — and a Victory Royale
//            is worth 944, which is Epic writing "instantly qualified" as a
//            number, so a heat win scores 1,000.
//   LCQ      open to all five divisions, so the room is the whole ladder and not
//            the Play-In's 150: eleven matches to a top fifty, then four matches
//            in the Last Chance Lobby where only a win takes a ticket.
//   Finals   50 duos, 12 matches, a kill worth 4, and Epic's European payout —
//            $120,000 for first, which the app already holds as PRIZE_TABLES.EU.
//
//   node tools/check-career-major.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

// Регион по умолчанию европейский — три хита. CC_REGION=OCE прогоняет тот же
// самый Мейджор в регионе с двумя хитами: сетка там своя, и раннер обязан
// доехать до конца на ней тоже. См. ccMajorHeat.
const REGION = process.env.CC_REGION || 'EU';
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  // A final asks the player where to land. A harness is the player: answer it
  // the moment a picker appears, always the first zone, so the run is the same
  // every time. Without this a probe waits forever on a click nobody makes.
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(no && no.textContent===L().ccSpotGatePlay){ no.click(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  // The seat is the player's to fill now: somebody free wrote, and the button
  // under their message seats them. Same door a player goes through.
  const ccProbeSeat = () => {
    if (careerPartnerCard()) return;
    const s = careerDms().find(x => x.state === 'offer' && !x.who.org && !x.who.brand);
    if (s) { careerDmAccept(s.id); careerRenderHub('centre'); }
  };
  const out = {steps: [], errs: null, fail: null};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fail = m => { out.fail = m; throw new Error(m); };
  const seed = (div, day, major) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Majorman', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'${REGION}', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], major:major}, partner:null}));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(96, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry(); ccProbeSeat();
  };
  // Самое большое число в колонке побед карточки этапа — то есть сколько
  // победных игр записано лучшему составу комнаты.
  const maxWins = (card) => {
    const ths = [...card.querySelectorAll('thead th')].map(t => t.textContent.trim());
    const at = ths.indexOf(L().winsWord);
    if (at < 0) return null;
    let worst = 0;
    [...card.querySelectorAll('tbody tr')].forEach(tr => {
      const td = tr.children[at]; if (!td) return;
      const n = parseInt(td.textContent, 10);
      if (n > worst) worst = n;
    });
    return worst;
  };
  const playThrough = async (what, peek) => {
    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play) fail(what + ': no button at all');
    if ((play.getAttribute('onclick')||'').indexOf('careerPlay') < 0)
      fail(what + ': the button skips instead of playing');
    const sk = setInterval(() => {
      const b = document.getElementById('majorSkipBtn');
      if (b && !b.disabled) b.click();
    }, 20);
    play.click();
    let card = null;
    for (let i = 0; i < 12000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')]
        .find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(sk);
    if (!card) fail(what + ': no result card came back');
    const head = card.querySelector('h4').textContent.replace(/\\s+/g,' ').trim();
    // Карточки живут до возврата в хаб — кому нужны таблицы, смотрит здесь.
    if (peek) peek();
    card.querySelector('button[onclick*="careerBackToHub"]').click();
    return head;
  };
  const save = () => JSON.parse(localStorage.getItem('fncsdraft_career')).career;
  const dayOf = (n, want) => {
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d,1)) {
      const ev = careerMajorOn(d);
      if (ev && ev.n === n && ev.stage === want) return d;
    }
    return null;
  };

  try{
    // ---- the numbers, against the event pages ---------------------------
    const S = CC_MAJOR_STAGE;
    if (S.playin.games !== 22 || S.playin.kill !== 2) fail('the Play-In is 22 matches at 2 a kill');
    if (S.heats.games !== 5  || S.heats.kill !== 3)  fail('the Heats are 5 matches at 3 a kill');
    // Отсечка хита зависит от региона, а региона здесь ещё нет — карьера не
    // сидирована, и ccCareerRegion честно отвечает «EU». Проверка стоит ниже,
    // сразу после первого seed. См. «сетка этого региона».
    // His screenshot, 17 August: the qualifier is eleven matches in a room the
    // whole ladder may enter, and the four matches are the lobby after it.
    if (S.lcq.games !== 11) fail('the Last Chance qualifier is eleven matches');
    if (S.lcq.cut !== CAREER_CUP_CUT) fail('fifty come through it');
    if (CC_MAJOR_LC_LOBBY_GAMES !== 4) fail('the Last Chance Lobby is four matches');
    if (S.lcq.field !== careerLadderEntrants())
      fail('the Last Chance seats the whole ladder, got ' + S.lcq.field +
           ' against ' + careerLadderEntrants());
    if (S.lcq.field <= S.playin.field)
      fail('a room every division may enter cannot be the Play-In\\u2019s size');
    if (S.final.games !== 12 || S.final.kill !== 4) fail('the Final is 12 matches at 4 a kill');
    if (majorPoints(1) !== 65 || majorPoints(25) !== 2 || majorPoints(26) !== 0)
      fail('the FNCS ladder pays 65 for a win and 2 at twenty-fifth');
    if (majorHeatPoints(1) !== 1000) fail('a heat win is 944 + 56 = 1000, got ' + majorHeatPoints(1));
    if (majorHeatPoints(2) !== majorPoints(2)) fail('only the win differs in the Heats');
    out.steps.push('stages: 22/2, 5/3 top 10, lobby of 4, final 12/4 — heat win 1000, everything else 65');
    // Кошелёк финала — европейский, и спрашивать его надо только в Европе:
    // у каждого региона своя таблица (PRIZE_TABLES), и в Океании эти числа
    // другие по делу, а не по ошибке.
    if (ccCareerRegion() === 'EU') {
      if (majorPrize(1) !== 120000 || majorPrize(50) !== 1000 || majorPrize(51) !== 0)
        fail('the Final pays $120,000 first and $1,000 at fiftieth');
      out.steps.push('final payout: $120,000 first, $1,000 fiftieth, nothing after');
    }

    // ---- who may enter what ---------------------------------------------
    const d = {playin:dayOf(1,'playin'), heats:dayOf(1,'heats'), lcq:dayOf(1,'lcq'), final:dayOf(1,'final')};
    if (!d.playin || !d.heats || !d.lcq || !d.final) fail('Major 1 is missing a stage: ' + JSON.stringify(d));
    out.steps.push('Major 1: play-in ' + d.playin + ', heats ' + d.heats + ', lcq ' + d.lcq + ', final ' + d.final);

    // Asked of the Major rule itself rather than of the day's headline: 6 April
    // is also a divisional cup Monday, so a Division 3 player's Play button is
    // legitimately live that day — for the cup, not for the Major.
    const can = (div, day, major) => { seed(div, day, major); return careerMajorCan(careerMajorOn(day)); };
    if (can(3, d.playin)) fail('a Division 3 player was let into the Major Play-In');
    if (!can(1, d.playin)) fail('Division 1 cannot enter its own Play-In');
    out.steps.push('play-in: Division 1 only');
    if (!can(4, d.lcq))
      fail('the Last Chance is open to all five divisions and a Division 4 player was refused');
    /* But not to somebody who is already through this Major.

       His rule, 17 August: come out of the Play-In into the Heats and you do not
       play this Major's Last Chance, because you have a place. There are two
       things called a last chance here - the one open to everybody, qualified or
       not, is the Global Championship's, where first pays 40,000 and a duo with a
       seat still turns up because their seat rolling down costs them nothing.
       This is a Major's own back door, and it exists to fill the Final. */
    if (can(1, d.lcq, {n:1, got:'heats', pass:'heats', ticket:true}))
      fail('a duo already in the Major Final was offered the same Major Last Chance');
    if (!can(1, d.lcq, {n:1, got:'heats', pass:null, ticket:false}))
      fail('a duo the Heats knocked out was refused the Last Chance');
    if (can(1, d.lcq, {n:1, got:'lcq', pass:'lcq', ticket:true}))
      fail('the Last Chance was offered twice');
    // And the panel says which of the two it is, rather than telling somebody who
    // has just earned a seat that seats have to be earned.
    seed(1, d.lcq, {n:1, got:'heats', pass:'heats', ticket:true});
    if (ccMajWhyLocked() !== L().ccMajHaveTicket)
      fail('a ticket-holder is told the Major has to be earned: ' + ccMajWhyLocked());
    seed(1, d.lcq, undefined);
    out.steps.push('last chance: open to Division 4, shut to a ticket');
    if (can(1, d.heats)) fail('the Heats opened to somebody who never played the Play-In');
    // Cleared, not merely played: a Play-In finished outside the cut is not a
    // place in the Heats, and got records the last stage played rather than the
    // last one passed. His Division 4 career was told it held a Major slot
    // because it had entered the Last Chance and lost.
    if (!can(1, d.heats, {n:1, got:'playin', pass:'playin', ticket:false}))
      fail('coming through the Play-In did not open the Heats');
    if (can(1, d.heats, {n:1, got:'playin', pass:null, ticket:false}))
      fail('playing the Play-In and going out opened the Heats');
    if (can(1, d.final, {n:1, got:'heats', pass:null, ticket:false})) fail('the Final opened to a team with no ticket');
    if (!can(1, d.final, {n:1, got:'heats', pass:'heats', ticket:true})) fail('a ticket did not open the Final');
    out.steps.push('heats need the play-in, the final needs a ticket');
    if (can(1, d.heats, {n:1, got:'heats', pass:'heats', ticket:true})) fail('a stage already played was offered again');
    if (can(1, d.heats, {n:2, got:'playin', pass:'playin', ticket:true})) fail('Major 2 progress opened Major 1\\'s heats');
    out.steps.push('a stage is played once, and the chain is per Major');

    // ---- сетка этого региона ---------------------------------------------
    /* Отсечка хита — не число, а число ЭТОГО региона.

       В карьере стояла десятка, и её поймал его игрок 26 августа: «in duos its
       top 15 not top 10 and trios was top 10 not 7». Но и пятнадцать — не
       константа: три хита по пятнадцать гоняют только Европа и NA Central,
       остальные пять регионов гоняют два по двадцать три. Спрашивается это у
       majorFormat, то есть у режима драфта: один турнир — одна сетка, где бы её
       ни считали. Регион в регион перебирает check-career-heat-cut.js; здесь
       нужен сам факт, что карьера читает СВОЙ регион, а не европейский.

       Стоит после seed: до него карьеры нет, ccCareerRegion отвечает «EU», и
       сравнение вышло бы само с собой. */
    seed(1, d.playin, undefined);
    squadSize = 2;
    const FMT = majorFormat(ccCareerRegion(), 'm2');
    if (ccCareerRegion() !== '${REGION}')
      fail('the career loaded in ' + ccCareerRegion() + ', not ${REGION}');
    if (ccMajorHeats() !== FMT.heats.length)
      fail('the region runs ' + FMT.heats.length + ' heats, the career ' + ccMajorHeats());
    if (ccScaleStage(CC_MAJOR_STAGE.heats).cut !== FMT.heats[0].cut)
      fail('the heat cut is the draft\\u2019s: ' +
           ccScaleStage(CC_MAJOR_STAGE.heats).cut + ' vs ' + FMT.heats[0].cut);
    if (ccScaleStage(CC_MAJOR_STAGE.playin).cut !== FMT.playInCut)
      fail('the play-in cut is the draft\\u2019s: ' +
           ccScaleStage(CC_MAJOR_STAGE.playin).cut + ' vs ' + FMT.playInCut);
    out.steps.push('${REGION}: ' + ccMajorHeats() + ' heats, top ' +
                   ccScaleStage(CC_MAJOR_STAGE.heats).cut + ', play-in cuts to ' +
                   ccScaleStage(CC_MAJOR_STAGE.playin).cut);

    // ---- play the Play-In ------------------------------------------------
    out.steps.push('play-in: ' + await playThrough('the Play-In'));
    const s1 = save();
    const r1 = (s1.log||[]).slice(-1)[0];
    if (!r1 || r1.kind !== 'major' || r1.stage !== 'playin') fail('the Play-In wrote no row');
    if (r1.games !== 22) fail('the Play-In logged ' + r1.games + ' games');
    if (!s1.major || s1.major.got !== 'playin') fail('the Play-In recorded no progress');
    out.steps.push('logged #' + r1.place + ' of ' + r1.of + ', ' + r1.games + ' games' +
                   (r1.passed ? ', through to the Heats' : ', out'));

    // ---- the Last Chance, from Division 4 --------------------------------
    seed(4, d.lcq, undefined);
    /* И в нём нет тех, у кого место в финале уже есть.

       Его слово, 28 августа: «можно сделать, чтобы ласт ченс не могли играть
       те, кто уже квальнулся в финалы». Игроку это правило поставлено с
       17 августа (careerMajorCan), а комната собиралась открытым полем и
       сажала прошедших хиты наравне со всеми. Кто прошёл — лежит в
       majorSeed.through, из этого же списка собирается зал финала.
       См. ccMajorSeatedHandles. */
    (function(){
      const cr = CAREER.career;
      cr.majorSeed = {n:1, season:cr.season, size:careerSquadSize(),
                      through:[['Sky','Scroll'], ['Malibuca','vic0'], ['Shxrk','t3eny']]};
      const gone = ccMajorSeatedHandles(careerMajorOn(d.lcq));
      if (gone.length !== 6) fail('the seated list read ' + gone.length + ' handles, not 6');
      const seats = f => { const s = new Set();
        f.forEach(t => (t.squad||[]).forEach(c => s.add(hKey(c)))); return s; };
      // Контроль: без списка они в комнате есть — иначе проверка ничего не мерит.
      const loose = seats(careerCupField(cr, [], 400, 'lcqctl', true, 0));
      if (!gone.some(h => loose.has(hKey(h))))
        fail('control: nobody already through turned up in an open room anyway');
      const shut = seats(careerCupField(cr, [].concat(gone), 400, 'lcqctl', true, 0));
      const back = gone.filter(h => shut.has(hKey(h)));
      if (back.length) fail('already in the Final and seated in the Last Chance: ' + back.join(', '));
      out.steps.push('last chance room: the six already through stay out, and the control puts them back');
      delete cr.majorSeed;
    })();
    /* А в лобби Ласт Ченса победа — это билет, и второй раз её не берут.

       Его слово, 28 августа: «кто катку в ласт ченс выиграл не мог играть
       дальше, потому что у них по 2 победы, хотя в игре такого быть не может».
       Тот же stopOnWin, что стоит на хитах. */
    let lobbyWins = null;
    out.steps.push('last chance: ' + await playThrough('the Last Chance', () => {
      const lob = [...document.querySelectorAll('#majorStages .stage-card')]
        .filter(c => (c.querySelector('h4')||{textContent:''}).textContent.indexOf(L().ccMajLobby) >= 0)
        .pop();
      if (lob) lobbyWins = maxWins(lob);
    }));
    if (lobbyWins !== null && lobbyWins > 1)
      fail('the Last Chance Lobby let a duo win ' + lobbyWins + ' matches for one ticket');
    out.steps.push('lobby: ' + (lobbyWins === null
      ? 'not reached from Division 4 this run' : 'nobody above one win (' + lobbyWins + ')'));
    /* Из Дивизиона 4 в полусотню попадают не каждый прогон, а правило проверять
       надо всегда — поэтому та же комната гоняется напрямую, с правилом и без.
       Десять игр вместо четырёх взяты у контроля: без правила две победы на
       один состав должны выпасть наверняка, иначе проверка меряет удачу. */
    {
      const runRoom = async (stop, games) => {
        const room = careerCupField(CAREER.career, [], 50, 'lobbyrule', true, 0);
        skipAnimation = true; CC_SKIP_RUN = true;
        resetRunRecord();
        await simulateGamesLive(room, games, victoryR2Points, 0, 'stage', 0, null, null,
          {lobbySize: ccTeams(50), stageName: 'lobby rule', mapReplay: true, stopOnWin: stop});
        return room.reduce((w, t) => Math.max(w, t.wins || 0), 0);
      };
      const on = await runRoom(true, 10), off = await runRoom(false, 10);
      if (on > 1) fail('a win is the ticket, and stopOnWin still left a duo with ' + on + ' of them');
      if (off < 2) fail('control: nobody won twice even with the rule off — the check measures nothing');
      out.steps.push('lobby rule: with it, one win at most; without it, ' + off + ' to the same room');
    }
    const s2 = save();
    const r2 = (s2.log||[]).slice(-1)[0];
    if (r2.stage !== 'lcq') fail('the Last Chance wrote the wrong row');
    // And it pays nothing, which is right: the last chances that pay are the
    // Global Championship's and the Major 1 Second Chance, both named over
    // GCLC_PRIZES_BY_REGION. A Major's own back door is a qualifier.
    if (r2.prize) fail('the Major Last Chance paid ' + r2.prize);
    if (r2.passed !== !!(s2.major && s2.major.ticket))
      fail('the ticket and the row disagree about whether it was won');
    out.steps.push('division 4 in the lobby: ' + (s2.major && s2.major.ticket
      ? 'won a match — ticket to the Major Finals' : 'no win, no ticket') +
      ' (' + r2.wins + ' wins)');

    // ---- and the Final ---------------------------------------------------
    seed(1, d.final, {n:1, got:'heats', pass:'heats', ticket:true});
    out.steps.push('final: ' + await playThrough('the Major Final'));
    const s3 = save();
    const r3 = (s3.log||[]).slice(-1)[0];
    if (r3.stage !== 'final') fail('the Final wrote the wrong row');
    if (r3.of !== 50) fail('the Final seated ' + r3.of + ' duos, should be 50');
    if (r3.games !== 12) fail('the Final ran ' + r3.games + ' games');
    // Epic pays a team and a duo is two people, so a career takes half.
    if (r3.prize !== Math.round(majorPrize(r3.place)/2))
      fail('#' + r3.place + ' was paid ' + r3.prize + ', half the table says ' + Math.round(majorPrize(r3.place)/2));
    if ((s3.earnings||0) !== r3.prize) fail('the Major prize did not reach earnings');
    out.steps.push('final #' + r3.place + ' of 50 — $' + r3.prize.toLocaleString('en-US') +
                   ', earnings $' + (s3.earnings||0).toLocaleString('en-US'));
    const feed = [...document.querySelectorAll('#chBody .x-post-in p')].map(b=>b.textContent.trim());
    if (!feed.length) fail('the feed is empty after a Major Final');
    out.steps.push('feed: ' + feed.slice(0,2).join(' / '));
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmajor-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=420000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the Major plays, and its Last Chance is shut to a duo already through');
