// Очередь на метку в драфте: чем раньше квалифицировался, тем раньше ставишь.
//
// Меряет ровно то, что обещано игроку строкой пикера «ты выбираешь N-м из M»:
// на каждом этапе, где поле собрано из разных дверей, место в очереди должно
// совпасть с записанной очередью квалификации (stampQualSeats), а не с силой
// состава. До жетона очередь читала очки прошлого этапа — внутри хитов это
// работало, а в финалах поле собрано заново, очков нет, и очередь схлопывалась
// в силу: сильнейшее дуо выбирало первым всегда.
//
// Гоняет забег драфта столько раз, сколько сказано, и собирает все открытые
// пикеры. Дальше Саммита забег доходит не всегда — это удача, а не поломка,
// поэтому проверяются те этапы, до которых дошли, и печатается, какие это были.
//
//   node tools/check-drop-queue.js          — три забега Мейджора 1
//   node tools/check-drop-queue.js 6        — шесть
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

const RUNS = Number(process.argv[2] || 3);

const BOOTSTRAP = [
'<pre id="__probe" style="display:none"></pre>',
'<script>',
'(function(){',
'  var out = {picks: [], fails: [], errs: [], runs: 0};',
'  window.addEventListener("error", function(e){ out.errs.push(String(e.message) + " @" + e.lineno); });',
'  // Забег живёт внутри промиса, и брошенная в нём ошибка НЕ приходит событием',
'  // "error" — только сюда. Без этой строки сломанный забег читался как «этап',
'  // не открыл пикер», то есть проба врала о причине.',
'  window.addEventListener("unhandledrejection", function(e){',
'    out.errs.push("rejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason));',
'  });',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'  var RUNS = ' + RUNS + ';',
'',
'  /* Пикер перехватывается на входе: место в очереди считается ровно тем же',
'     выражением, что и внутри pickInitialZone (bots, прошедшие byQualOrder',
'     раньше тебя), а рядом кладётся жетон, который проставил этап. Совпасть',
'     они обязаны — в этом весь смысл жетона. */',
'  var realPicker = showFinalsLandingPicker;',
'  showFinalsLandingPicker = function(field, you, title, seat, room){',
'    try {',
'      var bots = field.filter(function(t){ return t !== you; });',
'      var ahead = bots.filter(function(t){ return byQualOrder(t, you) < 0; }).length;',
'      var stamped = field.filter(function(t){ return t.qualSeat; }).length;',
'      // Жалоба, 31 августа: «в хитах я не первый выбираю, когда я топ 1 плейин».',
'      // Значит мерить надо не только совпадение места с жетоном, но и сам жетон:',
'      // совпадает ли он с порядком по очкам ЭТАПА, из которого сюда пришли.',
'      var byPts = field.slice().sort(function(a2,b2){',
'        return (b2.stagePts||0)-(a2.stagePts||0) || (b2.wins||0)-(a2.wins||0)',
'            || (b2.stageElims||0)-(a2.stageElims||0); });',
'      var ptsRank = byPts.indexOf(you)+1;',
'      var orderOk = field.every(function(t,i2){ return t===byPts[i2]; });',
'      out.picks.push({run: out.runs, stage: title || "finals", field: field.length,',
'                      ptsRank: ptsRank, orderOk: orderOk, youPts: Math.round(you.stagePts||0),',
'                      stamped: stamped, seatShown: ahead + 1, seatStamped: you.qualSeat || 0,',
'                      pow: Math.round(you.pow || 0),',
'                      powRank: bots.filter(function(t){ return (t.pow||0) > (you.pow||0); }).length + 1});',
'    } catch (e) { out.fails.push("перехват пикера: " + String(e && e.message || e)); }',
'    /* Что досталось по итогу выбора: очки коробки и сколько народу в ней',
'       сидит. Это и есть цена места в очереди — до правки 31 августа хвост',
'       очереди рассаживался ДО твоего выбора, и первый номер не покупал',
'       ничего: весь остров успевали занять те, кто летит после тебя. */',
'    var at = out.picks.length - 1;',
'    return realPicker.apply(null, arguments).then(function(groups){',
'      try {',
'        var z = you.landingZone;',
'        var g = z && groups && groups.get(z);',
'        if (out.picks[at]) {',
'          out.picks[at].zonePts = z ? z.points : 0;',
'          out.picks[at].share = g ? g.length : 0;',
'        }',
'      } catch (e) { out.fails.push("после выбора: " + String(e && e.message || e)); }',
'      return groups;',
'    });',
'  };',
'',
'  function hushed(){ skipAnimation = true; }',
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
'  // Слабый состав нужен не для баланса, а чтобы дойти до Ласт Ченса: сильный',
'  // проходит хиты и его пикер никогда не открывается, а именно там живой матч',
'  // на карте до сих пор шёл без метки.',
'  function draftAll(weak){',
'    var guard = 0;',
'    while (document.getElementById("goBtn").disabled && guard++ < 40) {',
'      if (!roundPlayerPicked && currentCandidates.length) {',
'        var list = currentCandidates.slice().sort(function(a, b){',
'          return weak ? a.rating - b.rating : b.rating - a.rating; });',
'        pick(list[0]);',
'      }',
'      if (!roundWeaponPicked && currentWeaponOptions.length) pickWeapon(currentWeaponOptions[0]);',
'      if (!roundHealPicked && currentHealOptions.length) pickHeal(currentHealOptions[0]);',
'    }',
'    return !document.getElementById("goBtn").disabled;',
'  }',
'',
'  function playOne(weak, then){',
'    chooseMode(2, "cards1");',
'    pickRegion("EU");',
'    setPlayMode(true);   // пикер открывается в обоих, но вопросы по ходу игры нужны',
'    confirmRegionsAndStart();',
'    if (!draftAll(weak)) { out.fails.push("драфт не собрался"); return then(); }',
'    hushed();',
'    var before = out.picks.length;',
'    // Метку за пробу ставит кнопка «выбрать за меня» — она же лучший ход по',
'    // landingScore, то есть ровно то, что сделал бы человек, не глядя.',
'    var clicker = setInterval(function(){',
'      hushed();',
'      var a = document.getElementById("landingBarAuto"); if (a) a.click();',
'      var same = document.getElementById("lcqSame"); if (same) same.click();',
'    }, 25);',
'    startRun();',
'    var waited = 0;',
'    var poll = setInterval(function(){',
'      waited += 80;',
'      var over = !runInProgress() || document.getElementById("finalBanner").style.display === "block";',
'      if (over || waited > 300000) {',
'        clearInterval(poll); clearInterval(clicker);',
'        if (out.picks.length === before) out.fails.push("забег не открыл ни одного пикера");',
'        out.runs++;',
'        abandonRun();',
'        document.querySelectorAll(".landing-picker").forEach(function(el){ el.remove(); });',
'        setTimeout(then, 150);',
'      }',
'    }, 80);',
'  }',
'',
'  window.addEventListener("load", function(){',
'    setTimeout(function(){',
'      var i = 0;',
'      (function next(){',
'        if (i >= RUNS) {',
'          var stampedPicks = out.picks.filter(function(p){ return p.seatStamped; });',
'          out.stagesSeen = out.picks.map(function(p){ return p.stage; })',
'            .filter(function(v, at, all){ return all.indexOf(v) === at; });',
'          /* Очередь может только УКОРАЧИВАТЬСЯ по ходу этапа, и это не сбой:',
'             там, где победа в игре уводит дальше (хиты, Ласт Ченс), выигравшие',
'             уходят из комнаты, и стоявших впереди тебя становится меньше.',
'             Первый вопрос этапа обязан совпасть с жетоном ровно, дальше —',
'             только не больше него. Строже проверять нечего: расти очередь',
'             не может, а если бы вернулась к силе состава, она бы прыгала. */',
'          var firstOf = {};',
'          stampedPicks.forEach(function(p){',
'            var key = p.run + "|" + p.stage;',
'            if (firstOf[key] === undefined) {',
'              firstOf[key] = 1;',
'              if (p.seatShown !== p.seatStamped)',
'                out.fails.push(p.stage + ": первый вопрос этапа дал место " + p.seatShown +',
'                               ", а жетон квалификации " + p.seatStamped);',
'            } else if (p.seatShown > p.seatStamped) {',
'              out.fails.push(p.stage + ": место в очереди выросло до " + p.seatShown +',
'                             " при жетоне " + p.seatStamped);',
'            }',
'            if (p.stamped < p.field)',
'              out.fails.push(p.stage + ": жетон есть у " + p.stamped + " из " + p.field);',
'          });',
'          // Сколько раз спросили — по этапам, для отчёта. Проверять тут нечего:',
'          // метка спрашивается ОДИН раз на этап (его слово 31 августа), а под одним',
'          // заголовком «финалы» живут четыре разных этапа, так что счёт по названию',
'          // всё равно не про число вопросов.',
'          var perStage = {};',
'          out.picks.forEach(function(p){ var k = p.run + "|" + p.stage;',
'            perStage[k] = (perStage[k] || 0) + 1; });',
'          out.asksPerStage = perStage;',
'          if (!stampedPicks.length) out.fails.push("ни один этап не проставил очередь");',
'          // Очередь обязана хоть иногда расходиться с силой состава — иначе',
'          // жетон ничего не поменял и проба сторожит совпадение, а не правило.',
'          var differs = stampedPicks.filter(function(p){ return p.seatShown !== p.powRank; }).length;',
'          out.differsFromPower = differs + "/" + stampedPicks.length;',
'          if (stampedPicks.length > 2 && !differs)',
'            out.fails.push("очередь ни разу не разошлась с порядком по силе — жетон не читается");',
'          done(); return;',
'        }',
'        // Половина забегов слабым составом — за Ласт Ченсом и Вторым шансом.',
'        var weak = (i % 2) === 1;',
'        i++; playOne(weak, next);',
'      })();',
'    }, 400);',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-queue-'));
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
console.log(JSON.stringify({runs: out.runs, stagesSeen: out.stagesSeen,
  differsFromPower: out.differsFromPower, asksPerStage: out.asksPerStage,
  picks: out.picks}, null, 1));

/* Чего стоит место в очереди. Печатается, а не проверяется: на десятке выборов
   разброс больше разницы, и порог здесь врал бы чаще, чем ловил. Смотреть надо
   на две строки рядом — у первых номеров коробка дороже и соседей меньше.
   До правки 31 августа обе строки были одинаковыми: хвост очереди рассаживался
   ДО выбора игрока, и первый номер не покупал ничего. */
const avg = (list, key) => list.length
  ? +(list.reduce((s, p) => s + (p[key] || 0), 0) / list.length).toFixed(2) : null;
const early = out.picks.filter(p => p.seatShown <= 5);
const late  = out.picks.filter(p => p.seatShown >= 25);
console.log('');
console.log('цена места в очереди   очки коробки   соседей   выборов');
console.log('очередь 1-5           ', String(avg(early, 'zonePts')).padStart(12),
            String(avg(early, 'share')).padStart(9), String(early.length).padStart(9));
console.log('очередь 25+           ', String(avg(late, 'zonePts')).padStart(12),
            String(avg(late, 'share')).padStart(9), String(late.length).padStart(9));
if (out.errs.length) out.errs.forEach(e => console.error('ERR ' + e));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('очередь на метку идёт по квалификации на каждом этапе, который её проставил');
