// Режим «весь год»: играет круг за кругом одним драфтом и рассказывает, что
// получилось. Это не про баланс — это про то, что цепочка вообще держится:
// набор карточек переключается, состав переезжает на карточки нового круга,
// мост между кругами ждёт нажатия, сводка года считает все круги, а место на
// LAN, выигранное своим Саммитом, доживает до Антверпена.
//
// Гоняется в режиме «Симуляция» — том, что стоит по умолчанию. Метку он тоже
// спрашивает, и перед каждой игрой: за пробу её ставит кнопка «выбрать за
// меня», она же лучший ход по landingScore. Карточку выбора состава перед
// Ласт Ченсом проба тоже нажимает — без ответа круг стоит на месте.
//
//   node tools/check-year-run.js            — все три круга
//   node tools/check-year-run.js year2025   — только один
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable');

const WHICH = JSON.stringify(process.argv[2] || null);

const BOOTSTRAP = [
'<pre id="__probe" style="display:none"></pre>',
'<script>',
'(function(){',
'  var out = {runs: [], fails: [], errs: []};',
'  window.addEventListener("error", function(e){ out.errs.push(String(e.message) + " @" + e.lineno); });',
'  // Забег живёт внутри промиса: ошибка из него приходит сюда, а не событием',
'  // "error". Без этой строки сломанный круг читался бы как «год не доиграл».',
'  window.addEventListener("unhandledrejection", function(e){',
'    out.errs.push("rejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason));',
'  });',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'  var ONLY = ' + WHICH + ';',
'  var TILES = [',
'    {key: "year",       size: 2, region: "EU"},',
'    {key: "year2025",   size: 3, region: "EU"},',
'    {key: "yearReload", size: 2, region: "EU"},',
'    {key: "year2024",   size: 2, region: "EU"}',
'  ].filter(function(t){ return ONLY ? t.key === ONLY : true; });',
'',
'  // Показ выключен целиком: sleep резолвится сразу (см. ccShowOff), реплей',
'  // закрывается сам. Иначе год — это полчаса кадров.',
'  function hushed(){ skipAnimation = true; }',
'',
'  function pickRegion(region){',
'    [].slice.call(document.querySelectorAll("#preRegionChecks .rf-btn")).forEach(function(b){',
'      b.classList.toggle("active", b.dataset.region === region);',
'    });',
'    [].slice.call(document.querySelectorAll("#homeRegionChecks .rf-btn")).forEach(function(b){',
'      b.classList.toggle("active", b.dataset.region === region);',
'    });',
'    [].slice.call(document.querySelectorAll("#eraChecks .rf-btn")).forEach(function(b, i){',
'      b.classList.toggle("active", b.dataset.year === "all" || i === 0);',
'    });',
'  }',
'',
'  function draftAll(){',
'    var guard = 0;',
'    while (document.getElementById("goBtn").disabled && guard++ < 40) {',
'      if (!roundPlayerPicked && currentCandidates.length) pick(currentCandidates[0]);',
'      if (!roundWeaponPicked && currentWeaponOptions.length) pickWeapon(currentWeaponOptions[0]);',
'      if (!roundHealPicked && currentHealOptions.length) pickHeal(currentHealOptions[0]);',
'    }',
'    return !document.getElementById("goBtn").disabled;',
'  }',
'',
'  // Мост между кругами и пикер высадки ждут нажатия — проба и есть тот, кто',
'  // нажимает. Пикер открывается в обоих режимах (метку ставят и смотрящие),',
'  // поэтому без этой кнопки год встал бы на первой же высадке.',
'  function bridgeWatcher(rec){',
'    return setInterval(function(){',
'      hushed();',
'      var b = document.getElementById("yearNextBtn");',
'      if (b) { rec.bridges++; b.click(); }',
'      var a = document.getElementById("landingBarAuto");',
'      if (a) { rec.drops = (rec.drops||0) + 1; a.click(); }',
'      // Ласт Ченс сначала спрашивает про состав — без ответа круг стоит.',
'      var same = document.getElementById("lcqSame");',
'      if (same) { rec.lcq = (rec.lcq||0) + 1; same.click(); }',
'    }, 30);',
'  }',
'',
'  function playOne(tile, then){',
'    var rec = {key: tile.key, chain: (YEAR_CHAINS[tile.key] || []).slice(),',
'               bridges: 0, legs: null, seat: null, endSet: null, squad: null, cards: []};',
'    out.runs.push(rec);',
'    try {',
'      chooseMode(tile.size, tile.key);',
'      if (!pendingYear) { out.fails.push(tile.key + ": плитка не завела год"); return then(); }',
'      pickRegion(tile.region);',
'      setPlayMode(false);',
'      confirmRegionsAndStart();',
'      if (!YEAR_KEY) { out.fails.push(tile.key + ": YEAR_KEY не выставлен"); return then(); }',
'      if (!draftAll()) { out.fails.push(tile.key + ": драфт не собрался"); return then(); }',
'      rec.squad = drafted.map(function(p){ return p.handle + " " + p.rating + " [" + p.cardSet + "]"; });',
'      hushed();',
'      var timer = bridgeWatcher(rec);',
'      var setWatch = setInterval(function(){',
'        if (rec.cards[rec.cards.length-1] !== CARD_SET) rec.cards.push(CARD_SET);',
'      }, 30);',
'      startRun();',
'      var waited = 0;',
'      var poll = setInterval(function(){',
'        waited += 60;',
'        var finished = YEAR_LEGS.length === rec.chain.length;',
'        if (finished || waited > 600000) {',
'          clearInterval(poll); clearInterval(timer); clearInterval(setWatch);',
'          rec.legs = YEAR_LEGS.map(function(l){',
'            return {title: l.title, stages: l.places.length,',
'                    last: l.places.length ? l.places[l.places.length-1] : null,',
'                    paid: l.earnings.reduce(function(s,e){ return s+e.amount; }, 0)};',
'          });',
'          rec.seat = YEAR_SEAT;',
'          rec.endSet = CARD_SET;',
'          rec.endSquad = drafted.map(function(p){ return p.handle + " " + p.rating + " [" + p.cardSet + "]"; });',
'          if (!finished) out.fails.push(tile.key + ": год не доиграл — кругов " + YEAR_LEGS.length);',
'          if (rec.bridges < rec.chain.length - 1)',
'            out.fails.push(tile.key + ": мостов между кругами " + rec.bridges + ", ждали " + (rec.chain.length-1));',
'          if (rec.cards.join(",") !== rec.chain.join(","))',
'            out.fails.push(tile.key + ": наборы шли " + rec.cards.join(",") + ", а должны " + rec.chain.join(","));',
'          setTimeout(function(){',
'            rec.yearCard = !!document.querySelector("#yearBridge .stage-card");',
'            if (!rec.yearCard) out.fails.push(tile.key + ": итоговой карточки года нет");',
'            abandonRun();',
'            setTimeout(then, 150);',
'          }, 200);',
'        }',
'      }, 60);',
'    } catch (e) {',
'      out.fails.push(tile.key + ": " + String(e && e.message || e));',
'      then();',
'    }',
'  }',
'',
'',
'  /* Место на LAN, выигранное своим Саммитом.',
'',
'     Дождаться его случайным забегом нельзя — топ-15 Дюссельдорфа выпадает',
'     редко, — поэтому спрашивается напрямую: держит ли состав место, когда',
'     год говорит, что держит, и не держит ли, когда год молчит. */',
'  function seatCheck(){',
'    var was = YEAR_SEAT, wasSet = CARD_SET, wasKey = YEAR_KEY;',
'    var me = {isYou: true, squad: [{handle: "нектоизниоткуда"}, {handle: "ивторойтакойже"}]};',
'    CARD_SET = "m2"; YEAR_KEY = "year";',
'    YEAR_SEAT = false;',
'    var without = holdsLanSeat(me);',
'    YEAR_SEAT = true;',
'    var with_ = holdsLanSeat(me);',
'    CARD_SET = "m1";',
'    var wrongLeg = holdsLanSeat(me);',
'    CARD_SET = "m2"; YEAR_KEY = null;',
'    var noYear = holdsLanSeat(me);',
'    YEAR_SEAT = was; CARD_SET = wasSet; YEAR_KEY = wasKey;',
'    out.seatCheck = {without: without, with: with_, wrongLeg: wrongLeg, noYear: noYear};',
'    if (without) out.fails.push("место на LAN есть у состава, который его не выигрывал");',
'    if (!with_) out.fails.push("место, выигранное Саммитом года, не доехало до Антверпена");',
'    if (wrongLeg) out.fails.push("место Саммита засчиталось на круге Мейджора 1");',
'    if (noYear) out.fails.push("флаг года всплыл в забеге, который не год");',
'  }',
'',
'  /* Пикер обязан открыться и в «играть самому» тоже. Год выше гоняется в',
'     режиме «смотреть», где пикер теперь ТОЖЕ открывается (метку ставят оба —',
'     его правка 31 августа), и его там нажимает bridgeWatcher; эта проверка',
'     сторожит второй режим, чтобы зелёная проба не означала «карта не',
'     открылась ни у кого». */',
'  function pickerCheck(then){',
'    chooseMode(2, "cards1");',
'    pickRegion("EU");',
'    setPlayMode(true);',
'    confirmRegionsAndStart();',
'    if (!draftAll()) { out.fails.push("пикер: драфт не собрался"); return then(); }',
'    hushed();',
'    startRun();',
'    var waited = 0;',
'    var poll = setInterval(function(){',
'      waited += 60;',
'      hushed();',
'      var open = !!document.querySelector(".landing-picker");',
'      if (open || waited > 120000) {',
'        clearInterval(poll);',
'        out.picker = open;',
'        if (!open) out.fails.push("пикер высадки не открылся");',
'        abandonRun();',
'        document.querySelectorAll(".landing-picker").forEach(function(el){ el.remove(); });',
'        setTimeout(then, 150);',
'      }',
'    }, 60);',
'  }',
'',
'  window.addEventListener("load", function(){',
'    setTimeout(function(){',
'      seatCheck();',
'      var i = 0;',
'      (function next(){',
'        if (i >= TILES.length) { pickerCheck(done); return; }',
'        playOne(TILES[i++], next);',
'      })();',
'    }, 400);',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-year-'));
process.on('exit', () => { try { fs.rmSync(dir, {recursive: true, force: true}); } catch (e) {} });
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOTSTRAP + '</body>'));
['maps.js', 'zone-sim.js', 'zone-replay.js', 'mp.js'].forEach(f => {
  try { fs.copyFileSync(path.join(ROOT, f), path.join(dir, f)); } catch (e) {}
});
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--allow-file-access-from-files', '--window-size=1280,900',
    '--virtual-time-budget=900000', '--dump-dom',
    'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
} finally {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify({runs: out.runs, seatCheck: out.seatCheck, picker: out.picker}, null, 1));
if (out.errs.length) out.errs.forEach(e => console.error('ERR ' + e));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('год играется целиком: круги идут по порядку, состав переезжает, сводка на месте');
