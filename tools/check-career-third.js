// Третья сторона в концовке — ход через движок, по замеру.
//
// Его слово 6 сентября 2026: «делай дальше». Ход снят 1 сентября как выдуманный
// (+16/−8 на 35%), возвращён с числами из реплеев финала Major 2 EU — см.
// CC_THIRD в index.html. Проверяется:
//   * ход стоит в CC_LATE_MOVES с картинкой и подписью из трёх исходов;
//   * кил — сосед выбит движком, +сила, +ресы; смерть — выбиты сами; остальное
//     — урон в сёрдж, сила на месте; без соседа смерти и кила нет;
//   * комната этот ход не ходит (ccRoomLate берёт только ходы без real);
//   * доли по замеру: кил меньше половины, кил+смерть меньше единицы;
//   * строки на месте во всех пяти языках.
//
//   node tools/check-career-third.js
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
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Third', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:500, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    // ---- ход в меню --------------------------------------------------------
    const m=CC_LATE_MOVES.find(x=>x.id==='third');
    if(!m || !m.real) fail('the third-party move is not in the late menu as a real one');
    if(!(CC_THIRD.kill<0.5 && CC_THIRD.kill+CC_THIRD.die<1 && CC_THIRD.die>0)) fail('the odds are off the replays: '+JSON.stringify(CC_THIRD));
    if(!CC_CHOICE_ICON[CC_LATE_ICON.third]) fail('the third-party move has no picture');
    const note=ccLateNote(m);
    if(!(typeof note==='string' && note.indexOf(String(Math.round(CC_THIRD.kill*100)))>=0 && note.indexOf(String(Math.round(CC_THIRD.die*100)))>=0))
      fail('the note does not carry the measured odds: '+note);
    out.steps.push('the late menu carries «third-party» with '+Math.round(CC_THIRD.kill*100)+'/'+Math.round(CC_THIRD.die*100)+' and a picture');
    // ---- исходы через подменённый движок -------------------------------------
    const foe={name:'FOE', squad:[{},{}], _pc:90};
    const log=[];
    const game={nearest:()=>foe, eliminate:(t,by)=>{ log.push(t.name+'<'+by.name); return true; }};
    const mk=()=>({isYou:true, name:'ME', pow:90, _pf:90, _pc:90, _mats:300, _game:game, _sq:{hp:100, shield:100, dealt:0, taken:0, alive:true}});
    let you=mk(); let r=ccThirdApply(you, 0.10, foe);
    if(!(r==='win' && log.join()==='FOE<ME' && you._pf===90+CC_THIRD.pow && you._mats===300+CC_FIGHT.mats)) fail('kill: '+r+' '+log.join()+' '+you._pf+' '+you._mats);
    you=mk(); log.length=0; r=ccThirdApply(you, CC_THIRD.kill+0.01, foe);
    if(!(r==='die' && log.join()==='ME<FOE')) fail('death: '+r+' '+log.join());
    you=mk(); log.length=0; r=ccThirdApply(you, 0.95, foe);
    if(!(r==='none' && log.length===0 && you._sq.dealt===CC_THIRD.dmg && you._pf===90)) fail('nothing: '+r+' '+JSON.stringify(you._sq)+' '+you._pf);
    you=mk(); log.length=0; r=ccThirdApply(you, 0.10, null);
    if(!(r==='none' && log.length===0)) fail('without a neighbour there is no kill: '+r);
    out.steps.push('kill takes the neighbour through the engine, death takes us, the rest is surge damage');
    // ---- комната не ходит третьей стороной ------------------------------------
    const roomMoves=CC_LATE_MOVES.filter(x=>x.pow>0 && !x.real).map(x=>x.id);
    if(roomMoves.indexOf('third')>=0) fail('the room can third-party by a power roll');
    out.steps.push('the room plays '+roomMoves.join(', ')+' — no third-party roll');
    // ---- через меню целиком ---------------------------------------------------
    const realBox=ccChoiceBox; ccChoiceBox=async function(title, hint, options){ return options.find(o=>o.id==='third'); };
    const r0=Math.random; Math.random=()=>0.05;
    you=mk(); log.length=0; await ccAskLate(you, null);
    Math.random=r0; ccChoiceBox=realBox;
    if(log.join()!=='FOE<ME') fail('through the menu the kill did not land: '+log.join());
    out.steps.push('through the menu: the neighbour goes down by the engine');
    // ---- словарь ---------------------------------------------------------------
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      if(!(typeof D.ccLateThird==='string' && D.ccLateThirdNote(33,17,6).length>5 && D.ccLateThirdWon(6,'x').length>3 && D.ccLateThirdLost('x').length>3 && D.ccLateThirdNone(70).length>3))
        fail(l+': third-party strings are missing'); });
    out.steps.push('five languages carry the three outcomes');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccthird-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('the endgame can third-party a fight, at the odds the replays give');
