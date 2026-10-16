// Драфт дня (16.10): у всех одни паки, попытка одна, итог ложится в fd_daily.
//
// Проверяется в одной вкладке: два захода в драфт дня с разным числом «посторонних» бросков между ними и с
// рероллом — паки совпадают; обычный драфт после этого — не драфт дня; потом турнир дня целиком, до итога.
//
//   node tools/check-daily-draft.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `<script>
(function(){
  var out={fails:[], errs:[], packs:[]};
  window.addEventListener("error", function(e){ out.errs.push(String(e.message)+" @"+e.lineno); });
  window.addEventListener("unhandledrejection", function(e){ out.errs.push("rej: "+String((e.reason&&(e.reason.stack||e.reason.message))||e.reason)); });
  function done(){ document.title="PBEGIN"+encodeURIComponent(JSON.stringify(out))+"PEND"; }
  function snap(){ return [currentCandidates.map(hKey).join(","), currentWeaponOptions.map(function(w){return w.name||w.id||JSON.stringify(w).slice(0,30);}).join(","),
    currentHealOptions.map(function(w){return w.name||w.id||JSON.stringify(w).slice(0,30);}).join(",")].join(" | "); }
  function draftAll(log){
    var guard=0;
    while(document.getElementById("goBtn").disabled && guard++<40){
      if(log) log.push(snap());
      if(!roundPlayerPicked && currentCandidates.length) pick(currentCandidates[0]);
      if(!roundWeaponPicked && currentWeaponOptions.length) pickWeapon(currentWeaponOptions[0]);
      if(!roundHealPicked && currentHealOptions.length) pickHeal(currentHealOptions[0]);
    }
    return !document.getElementById("goBtn").disabled;
  }
  window.addEventListener("load", function(){ setTimeout(function(){
    out.stage="start"; done();
    try{ localStorage.removeItem("fd_daily"); }catch(e){}
    // Первый заход.
    dailyStart();
    if(!DAILY) out.fails.push("dailyStart не включил драфт дня");
    if(!document.getElementById("dailyBar")) out.fails.push("нет полосы драфта дня над паками");
    var a=[]; a.push(snap()); rerollAll(); a.push(snap());
    // Второй заход: тот же день, другие броски между заходами.
    for(var i=0;i<777;i++) Math.random();
    dailyStart();
    var b=[]; b.push(snap()); rerollAll(); b.push(snap());
    if(a.join("\\n")!==b.join("\\n")) out.fails.push("паки дня разошлись между заходами:\\n"+a.join("\\n")+"\\n---\\n"+b.join("\\n"));
    out.packs=a;
    // Обычный драфт — уже не драфт дня.
    chooseMode(2);
    if(DAILY) out.fails.push("обычный драфт остался драфтом дня");
    // Турнир дня целиком.
    dailyStart();
    if(!draftAll()){ out.fails.push("драфт дня не собрался"); done(); return; }
    var clicker=setInterval(function(){ var x=document.getElementById("landingBarAuto"); if(x) x.click(); skipAnimation=true; }, 25);
    out.stage="run"; done(); out.beat=0; setInterval(function(){ out.beat++; out.t=Date.now(); done(); }, 1000);
    var nat=Math.random;
    startRun();
    if(Math.random===nat) out.fails.push("симуляция дня не сеется");
    if(!dailyToday()) out.fails.push("попытка не сгорела на «Выйти на турнир»");
    var waited=0, poll=setInterval(function(){
      waited+=200;
      var r=dailyToday(); out.waited=waited; out.scr=(document.querySelector(".screen.active")||{}).id; done();
      if((r && r.score!=null) || waited>600000){
        clearInterval(poll); clearInterval(clicker);
        if(!r || r.score==null) out.fails.push("итог дня не записан");
        else out.result=r;
        if(Math.random!==nat) out.fails.push("Math.random не вернули после турнира");
        var box=document.getElementById("dailyResult");
        if(!box || box.hidden) out.fails.push("нет блока итога дня на экране результатов");
        if(r && dailyShareText(r).indexOf("fncsdraft.com")<0) out.fails.push("текст для «Поделиться» без адреса");
        // Повторный вход в тот же день — окно таблицы, а не новый драфт.
        show("screen-home"); dailyStart();
        if(DAILY) out.fails.push("второй раз за день пустило в драфт");
        homeDailyDraw();
        var hd=document.getElementById("homeDaily");
        if(!hd || hd.hidden || hd.innerHTML.indexOf("#"+r.place)<0) out.fails.push("на главной нет своего итога дня");
        done();
      }
    }, 200);
  }, 500); });
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-daily-'));
const tmp = path.join(dir, 'probe.html');
fs.writeFileSync(tmp, src.replace('</body>', BOOT + '</body>'));
['maps.js', 'zone-sim.js', 'zone-replay.js', 'mp.js'].forEach(f => { try { fs.copyFileSync(path.join(ROOT, f), path.join(dir, f)); } catch (e) {} });
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--window-size=1280,900', '--virtual-time-budget=900000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')],
    { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/<title>PBEGIN([^<]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.errs.forEach(e => console.error('ERR ' + e));
console.log('паки дня:\n ' + out.packs.join('\n '));
if (out.result) console.log('итог: #' + out.result.place + '/' + out.result.field + ', ' + out.result.score + ' очк., ' + (out.result.team || []).join(' + '));
console.log('stage', out.stage, out.waited, out.scr, 'beat', out.beat);
if (!out.result) out.fails.push('турнир дня не доигран за время пробы');
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('драфт дня: паки одни, попытка одна, итог записан');
