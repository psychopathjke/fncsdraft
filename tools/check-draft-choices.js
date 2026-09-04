// Спрашивает ли драфт по ходу матча — лут после третьей зоны и лейт на восьмой.
//
// Жалоба, 31 августа: «я не могу как в карьере играть типо, добавь мид гейм и
// лейт всё как в карьере, только в драфт, когда играешь». Так и было: флаг
// opts.choices стоял на всех живых этапах драфта и не делал ничего — ветка,
// которая умеет спрашивать (playGameWithChoices), сидела под opts.lobbySize, а
// его ставит только карьера.
//
// Проба доказывает обратное измерением: считает, сколько раз матч ушёл в ветку
// с вопросами и сколько раз спросили каждый из двух вопросов. Панель отвечает
// сама — ccChoiceBox подменён на мгновенный ответ, иначе проба ждала бы живые
// пятнадцать секунд на каждый вопрос. Подменяется ТОЛЬКО ответ: сами вопросы
// задаёт настоящая игра настоящим кодом.
//
// Показ при этом НЕ пропускается (withChoices требует !skipAnimation — вопрос
// посреди игры, которую не показывают, спрашивать не о чем), поэтому забег
// идёт долго даже в виртуальном времени. Один забег, одна проверка.
//
//   node tools/check-draft-choices.js
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

const BOOTSTRAP = [
'<script>',
'(function(){',
'  var out = {withChoices: 0, plain: 0, loot: 0, late: 0, lateIds: {}, fails: [], errs: []};',
'  window.addEventListener("error", function(e){ out.errs.push(String(e.message) + " @" + e.lineno); });',
'  window.addEventListener("unhandledrejection", function(e){',
'    out.errs.push("rejection: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason));',
'  });',
'  function done(){ document.title = "PBEGIN" + encodeURIComponent(JSON.stringify(out)) + "PEND"; }',
'',
'  // Сколько матчей ушло в ветку с вопросами, а сколько посчиталось одним куском.',
'  var realWith = playGameWithChoices, realPlain = simulateGame;',
'  playGameWithChoices = function(){ out.withChoices++; return realWith.apply(null, arguments); };',
'  simulateGame = function(){ out.plain++; return realPlain.apply(null, arguments); };',
'',
'  // Ответ за игрока — мгновенный и случайный из предложенного: первая кнопка',
'  // самая осторожная, и отвечать всегда ею значит не проверить остальные.',
'  ccChoiceBox = function(title, hint, options){',
'    if (String(title) === String(L().ccLootTitle)) out.loot++;',
'    if (String(title) === String(L().ccLateTitle)) out.late++;',
'    var o = options[Math.floor(Math.random()*options.length)];',
'    if (String(title) === String(L().ccLateTitle)) out.lateIds[o.id] = (out.lateIds[o.id]||0)+1;',
'    return Promise.resolve(o);',
'  };',
'  // Плашка исхода тоже ждёт таймером — пробе она ничего не доказывает.',
'  ccChoiceResult = function(){ return Promise.resolve(); };',
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
'  window.addEventListener("load", function(){',
'    setTimeout(function(){',
'      chooseMode(2, "cards1");',
'      pickRegion("EU");',
'      setPlayMode(true);',
'      confirmRegionsAndStart();',
'      if (!draftAll()) { out.fails.push("драфт не собрался"); done(); return; }',
'      // Метку ставит кнопка «за меня»; состав на Ласт Ченсе остаётся тем же.',
'      var clicker = setInterval(function(){',
'        var a = document.getElementById("landingBarAuto"); if (a) a.click();',
'        var same = document.getElementById("lcqSame"); if (same) same.click();',
'      }, 25);',
'      startRun();',
'      // Хватает одного этапа на карте: вопрос либо задаётся, либо нет.',
'      var waited = 0;',
'      var poll = setInterval(function(){',
'        waited += 100;',
'        var enough = out.loot >= 3 && out.late >= 1;',
'        if (enough || waited > 420000) {',
'          clearInterval(poll); clearInterval(clicker);',
'          if (!out.withChoices) out.fails.push("матч ни разу не ушёл в ветку с вопросами");',
'          if (!out.loot) out.fails.push("лут середины игры не спросили ни разу");',
'          if (!out.late) out.fails.push("лейт не спросили ни разу");',
'          abandonRun();',
'          setTimeout(done, 120);',
'        }',
'      }, 100);',
'    }, 400);',
'  });',
'})();',
'</script>'
].join('\n');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-dchoice-'));
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
console.log(JSON.stringify(out, null, 1));
if (out.errs.length) out.errs.forEach(e => console.error('ERR ' + e));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('драфт спрашивает по ходу матча: лут ' + out.loot + ', лейт ' + out.late);
