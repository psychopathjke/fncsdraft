// Вкладка стримов: виды эфира, их цена и что они делают.
//
// Главное правило здесь — «ранкед» это ровно вчерашняя кнопка дня: множители
// в единицу, чтобы старая калибровка стрима осталась в силе. Остальные виды
// расходятся от неё, и каждый чем-то платит.
//
//   node tools/check-career-streams.js
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
    const fresh = () => { CAREER = {player:{nick:'Streamer', ovr:80, region:'EU', role:'roleIGL',
      country:'de', age:19, attrs:ccRookieAttrs(80,'roleIGL')},
      career:{season:1, day:'2026-03-02', division:3, balance:0, earnings:0, reach:50000,
              twitch:8000, energy:100, did:{}, log:[], news:[], school:'out'},
      partners:[{card:{handle:'Mate', region:'EU', tier:'ranked', rating:80, _targetOvr:80,
                     _attrs:ccRookieAttrs(80,'roleFRG')}, patience:60}],
      gear:{own:[], train:0, reach:0}, sponsor:null, org:null, coach:null}; };
    careerRenderHub = function(){};
    careerSave = function(){};

    // ---- виды эфира ---------------------------------------------------------
    fresh();
    out.notes.kinds = CC_STREAM_KINDS.map(k => k.id);
    check('there are four kinds of stream', CC_STREAM_KINDS.length === 4,
          JSON.stringify(out.notes.kinds));
    const grind = ccStreamKind('grind');
    check('"ranked" is yesterday\\'s button, multipliers of one',
          grind.energy === 30 && grind.reach === 1 && grind.cash === 1 && grind.subs === 1,
          JSON.stringify(grind));
    check('an unknown kind falls back to it', ccStreamKind('nope').id === 'grind');
    const chat = ccStreamKind('chat'), long = ccStreamKind('long'), colab = ccStreamKind('colab');
    check('just chatting pays more and grows less', chat.cash > 1 && chat.reach < 1);
    check('the marathon costs a longer day', long.energy > grind.energy);
    check('and it burns you', long.grind > 0);
    check('the collab is the one with a partner', colab.mate === true && !chat.mate && !long.mate);

    // ---- эфир тратит день и энергию ----------------------------------------
    fresh();
    const e0 = careerEnergy();
    check('a stream runs', careerStreamGo('grind') === true);
    check('and spends its energy', careerEnergy() === e0 - 30, String(careerEnergy()));
    check('the day is marked as used', careerDayDone() === true);
    /* День эфиром НЕ закрывается: правило мода — сколько сессий оплатит
       энергия (careerDayClosed смотрит только на отдых и события дня).
       Поэтому второй эфир возможен, пока есть чем платить, и невозможен,
       когда энергия кончилась. */
    check('a second stream is possible while energy lasts', careerStreamGo('grind') === true);
    CAREER.career.energy = 10;
    check('and impossible when it runs out', careerStreamGo('grind') === false);
    fresh();
    CAREER.career.energy = 40;
    check('no energy, no marathon', careerStreamGo('long') === false);
    check('and the day is still free', careerDayDone() === false);

    // ---- марафон дороже и грузит -------------------------------------------
    fresh();
    const g0 = CAREER.career.grind || 0, en0 = careerEnergy();
    check('the marathon runs', careerStreamGo('long') === true);
    check('it costs its own energy', careerEnergy() === en0 - long.energy, String(careerEnergy()));
    // Перегруз растёт и от самой сессии, поэтому сверяем «не меньше».
    check('and adds burnout', (CAREER.career.grind || 0) >= g0 + long.grind,
          String(CAREER.career.grind));

    // ---- множители видны в числах вечера -----------------------------------
    const run = kind => { fresh(); careerStreamGo(kind);
      const l = CAREER.career.streamLast;
      return {reach: CAREER.career.reach - 50000, tw: CAREER.career.twitch - 8000,
              cash: CAREER.career.balance, line: l && l.a}; };
    const rg = run('grind'), rc = run('chat'), rl = run('long');
    out.notes.runs = {grind: rg, chat: rc, long: rl};
    check('every stream reports its night', !!rg.line && rg.line.length >= 5,
          JSON.stringify(rg.line || null));
    check('ranked grows the audience', rg.reach > 0 && rg.tw > 0, JSON.stringify(rg));
    check('chatting grows it less', rc.reach < rg.reach, JSON.stringify({chat: rc.reach, grind: rg.reach}));
    check('and pays more', rc.cash > rg.cash, JSON.stringify({chat: rc.cash, grind: rg.cash}));
    check('the marathon does more of everything',
          rl.reach > rg.reach && rl.cash >= rg.cash, JSON.stringify({long: rl, grind: rg}));

    // ---- коллаб приводит чужих зрителей -------------------------------------
    fresh();
    const mate = ccStreamMate();
    out.notes.mate = mate && {name: mate.name, f: mate.tw ? mate.tw[1] : 0};
    check('there is somebody to stream with today', !!mate && !!mate.name);
    check('and they come from the real creator pool',
          ccProAmCreators().indexOf(mate.name) >= 0, mate && mate.name);
    check('the same day offers the same partner', ccStreamMate().name === mate.name);
    CAREER.career.day = ccAddDays(CAREER.career.day, 1);
    check('tomorrow it can be somebody else', typeof ccStreamMate().name === 'string');
    // Прибавка охвата от коллаба — только когда у напарника есть аудитория.
    fresh();
    const before = careerReach();
    careerStreamGo('colab');
    const m2 = ccStreamMate();
    const extra = (m2 && ccProAmFollowers(m2.name)) ? ccProAmReachFrom(m2.name) : 0;
    check('a collab with a known channel brings their viewers',
          careerReach() - before >= extra, JSON.stringify({got: careerReach() - before, extra: extra}));

    // ---- витрина ------------------------------------------------------------
    fresh();
    const live = careerLiveNow(12);
    out.notes.live = live.slice(0, 4).map(s => s.name + ':' + s.v);
    check('the front page is full', live.length === 12, String(live.length));
    check('it shows creators and the scene both',
          live.some(s => s.creator) && live.some(s => !s.creator),
          JSON.stringify(live.map(s => (s.creator ? 'c' : 'p')).join('')));
    check('nobody streams to nobody', live.every(s => s.v > 0));
    check('the biggest channels are not absurd', live.every(s => s.v < 400000),
          JSON.stringify(out.notes.live));
    check('the same day draws the same front page',
          careerLiveNow(12).map(s => s.name + s.v).join() === live.map(s => s.name + s.v).join());

    // ---- сам экран ----------------------------------------------------------
    const html = careerStreamsHTML();
    /* Экран — страница канала Twitch с его скрина: слева отслеживаемые,
       в центре плеер с кнопками эфира, справа чат. */
    check('the tab is a channel page', html.indexOf('tv-wrap') >= 0 &&
          html.indexOf('tv-side') >= 0 && html.indexOf('tv-player') >= 0 &&
          html.indexOf('tv-chat') >= 0);
    check('the sidebar lists followed channels and offline ones',
          html.indexOf(String(L().ccStreamFollowed)) >= 0 &&
          html.indexOf(String(L().ccStreamOffline)) >= 0);
    check('the channel row carries the Twitch buttons',
          html.indexOf(String(L().ccStreamSub)) >= 0 && html.indexOf(String(L().ccStreamGift)) >= 0 &&
          html.indexOf(String(L().ccStreamBits)) >= 0);
    check('the chat has a pinned line and a box',
          html.indexOf('tv-pin') >= 0 && html.indexOf(String(L().ccStreamSay)) >= 0);
    /* Чат — живые люди мода и одинаковый за один день. */
    const chatRows = careerStreamChat(10);
    out.notes.chatRows = chatRows.slice(0, 3).map(m => m.who + ': ' + m.text);
    check('the chatRows is not empty', chatRows.length === 10, JSON.stringify(out.notes.chatRows));
    check('every line has somebody and something to say',
          chatRows.every(m => m.who && m.text && m.at && m.c));
    check('the same day writes the same chatRows',
          careerStreamChat(10).map(m => m.who + m.text).join() === chatRows.map(m => m.who + m.text).join());
    check('a name always gets the same colour',
          ccChatColor('Malibuca') === ccChatColor('Malibuca') &&
          ccChatColor('Malibuca') !== ccChatColor('zzzz'));
    /* ---- Партнёрская программа --------------------------------------------
       Его правка 4 сентября: галочку надо ЗАСЛУЖИТЬ. Пороги — опубликованные
       требования Twitch за 30 дней, и проба стережёт именно их. */
    fresh();
    check('a new channel has no badge at all', ccTwStatus() === 'none');
    check('and the page does not draw a tick',
          careerStreamsHTML().indexOf('tv-tick') < 0);
    check('it shows the path as bars',
          careerStreamsHTML().indexOf('tv-path') >= 0 &&
          careerStreamsHTML().indexOf('tw-bar') >= 0);
    /* Полоска и выдача статуса читают ОДНУ таблицу целей: иначе экран обещает
       одно, а программа считает другое. */
    check('the bars name followers, days, hours and viewers',
          ccTwGoals('aff').length === 4 && ccTwGoals('part').length === 3 &&
          ccTwGoals('aff').every(g => g.k && g.b > 0));
    const feed = (days, viewers) => {
      fresh();
      const rows = [];
      for (let i = 1; i <= days; i++)
        rows.push({d: ccAddDays(careerToday(), -i), v: viewers, h: 4});
      CAREER.career.streamLog = rows;
      return careerTwTick();
    };
    check('four quiet days make an affiliate', feed(4, 5) === 'aff', ccTwStatus());
    check('an affiliate wears a label, not a tick',
          careerStreamsHTML().indexOf('tv-aff') >= 0 &&
          careerStreamsHTML().indexOf('tv-tick') < 0);
    check('but not without followers',
          (function(){ feed(4, 5); CAREER.career.twitch = 0; CAREER.career.twTier = 'none';
                       return ccTwEarned() === 'none'; })());
    check('twelve nights with a crowd make a partner', feed(12, 120) === 'part', ccTwStatus());
    check('and the tick appears', careerStreamsHTML().indexOf('tv-tick') >= 0);
    check('an empty room never makes a partner', feed(12, 20) !== 'part', ccTwStatus());
    check('and neither does a single huge night', feed(3, 5000) !== 'part', ccTwStatus());
    /* Заслуженное не отбирают: у Twitch статус тоже не снимают за тихий месяц. */
    feed(12, 120);
    CAREER.career.streamLog = [];
    check('a quiet month does not take it back', ccTwStatus() === 'part');
    /* Действующие требования Twitch: компаньона упростили в июне 2026
       (блог «Monetization for All»), партнёрка прежняя. */
    check('the thresholds are the published ones',
          CC_TW_AFF.fol === 25 && CC_TW_AFF.days === 4 && CC_TW_AFF.hours === 4 &&
          CC_TW_AFF.avg === 3 &&
          CC_TW_PART.days === 12 && CC_TW_PART.hours === 25 && CC_TW_PART.avg === 75);
    // Эфир записывается сам — иначе программа стоит на пустом журнале.
    fresh();
    careerStreamGo('grind');
    out.notes.log = CAREER.career.streamLog;
    check('a night writes itself into the month',
          (CAREER.career.streamLog || []).length === 1 &&
          CAREER.career.streamLog[0].d === careerToday() &&
          CAREER.career.streamLog[0].v > 0 && CAREER.career.streamLog[0].h === 4,
          JSON.stringify(out.notes.log));
    /* Его скрин с красной рамкой: плашка LIVE уехала в угол, потому что правило
       .tv-live было объявлено дважды. Одно — и только одно. */
    const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('');
    const liveRules = (css.match(/\\.tv-live\\{/g) || []).length;
    check('the LIVE badge has exactly one rule', liveRules === 1, String(liveRules));
    check('and it sits under the avatar, not in a corner',
          /\\.tv-live\\{[^}]*bottom:/.test(css) && !/\\.tv-live\\{[^}]*top:/.test(css));
    fresh();
    check('every kind has a button and words',
          CC_STREAM_KINDS.every(k => L()['ccStream_' + k.id] && L()['ccStream_' + k.id + 'Note'] &&
            html.indexOf("careerStreamGo('" + k.id + "')") >= 0));
    check('and it says what the day costs', html.indexOf(String(L().ccStreamCost(30))) >= 0);
    // Закрывает день отдых или событие дня, а не эфир — см. ccDayShuts.
    CAREER.career.did[careerToday()] = ['rest'];
    check('a closed day says so instead of offering buttons',
          careerStreamsHTML().indexOf(String(L().ccStreamDayGone)) >= 0);
  } catch (e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstream-'));
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
console.log('streams: four kinds, day and energy, multipliers, collab, front page, tab');
