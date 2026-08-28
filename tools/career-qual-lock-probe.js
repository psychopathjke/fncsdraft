// Квал запирает напарника — его правило, 23 августа: «сделай так, чтобы
// тимейт не мог тебя дропнуть если у вас есть квал куда-то, только ты можешь».
// И его скрин того же дня: стык сезонов рвал квалифицированное дуо веткой
// 'behind' («Спасибо @X за сезон») — и Глобалы становились неиграбельными.
//
// Проба держит место на Глобалах (cr.gclc.through) и проверяет все двери,
// через которые дуо рвётся БЕЗ руки игрока:
//  - careerDuoHolds на стыке сезонов ('behind', 'unhappy', бросок 'moved');
//  - careerApplyMorale после плохого вечера (терпение на нуле);
// и контроль: без квала те же ситуации рвут дуо как раньше.
// Смена напарника рукой игрока не трогалась — она отдаёт место
// (careerSlotGiveUp), это его же правило от 17 августа.
//
//   node tools/career-qual-lock-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeQual', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-05', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    CAREER.player.ovrExact=90;

    // Два напарника: заметно слабее (разрыв больше ступени — ветка 'behind'
    // скрина) и близкий по силе (в пределах CAREER_DM_REACH — иначе он
    // «loyal», уходить ему некуда и 'unhappy' не срабатывает вовсе).
    const pool=careerPools().players.filter(c=>c && c.handle);
    const mateB=pool.find(c=>{ const o=(attrsFor(c)||{}).ovr||0; return o>=76 && o<=80; })||pool[0];
    const mateU=pool.find(c=>{ const o=(attrsFor(c)||{}).ovr||0; return o>=88 && o<=90; })||pool[0];
    const mateRec=(mate,pat)=>{ CAREER.partner=mate.handle;
                                CAREER.partners=[{handle:mate.handle, patience:pat}]; };

    // --- Квал есть: место на Глобалах через Ласт Ченс ------------------------
    cr.gclc={through:true};
    out.seat=(careerSlotHeld()||{}).key;

    mateRec(mateB, 60);
    out.behindHeld=careerDuoHolds();          // ждём hold:true (было 'behind')
    mateRec(mateU, 5);
    out.unhappyHeld=careerDuoHolds();         // ждём hold:true (было 'unhappy')
    const m1=careerApplyMorale(90, 100, false); // дно таблицы при терпении 5
    out.moraleHeld={left:m1 && m1.left};      // ждём left:false (было true)

    mateRec(mateB, 60);
    const newsBefore=(cr.news||[]).length;
    const turn=careerSeasonTurn({id:'S90', from:'2026-09-01'});
    out.turnHeld={split:turn && turn.split,   // ждём split:false
      byeTweet:(cr.news||[]).slice(newsBefore).some(e=>e.k==='ccNewsDuoBehind')};

    // --- Контроль: квала нет — всё рвётся как раньше -------------------------
    delete cr.gclc; cr.gaveUp=[];
    out.ctrlSeat=careerSlotHeld();
    mateRec(mateB, 60);
    out.ctrlBehind=careerDuoHolds();          // ждём why:'behind'
    mateRec(mateU, 5);
    out.ctrlUnhappy=careerDuoHolds();         // ждём why:'unhappy'
    const m2=careerApplyMorale(90, 100, false);
    out.ctrlMorale={left:m2 && m2.left};      // ждём left:true
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccqual-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=240000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
const ok = !out.fail && (out.errs||[]).length===0 &&
  out.seat==='gc' &&
  out.behindHeld && out.behindHeld.hold===true &&
  out.unhappyHeld && out.unhappyHeld.hold===true &&
  out.moraleHeld.left===false &&
  out.turnHeld.split===false && out.turnHeld.byeTweet===false &&
  out.ctrlBehind && out.ctrlBehind.why==='behind' &&
  out.ctrlUnhappy && out.ctrlUnhappy.why==='unhappy' &&
  out.ctrlMorale.left===true;
console.log(ok ? 'OK' : 'FAIL');
process.exit(ok ? 0 : 1);
