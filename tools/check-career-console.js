// Консольные капы: PlayStation Cup только с PlayStation, Xbox Cup с Xbox, Console-капы с любой консолью; консоль
// покупается в магазине.
//   node tools/check-career-console.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found, set CHROME to chrome.exe');

const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('rejection: ' + String(e.reason && e.reason.message || e.reason)); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {steps: [], errs: null, fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  try{
    // ---- кто чего требует -------------------------------------------------------------
    const need=id=>ccConsoleNeed({id});
    if(need('S28_PlaystationCupDecember')!=='ps' || need('S37_PlayStationCup')!=='ps') fail('PlayStation Cup does not need a PlayStation');
    if(need('XboxCup_Solo1')!=='xbox') fail('Xbox Cup does not need an Xbox');
    if(need('S28_ConsoleCashCups')!=='any' || need('S11_PlatformCup_Console')!=='any') fail('console cups do not need a console');
    if(need('S40_SoloVictoryCup')!==null) fail('a PC cup needs a console');
    out.steps.push('PlayStation Cup needs PS, Xbox Cup needs Xbox, Console cups any, PC cups none');
    // ---- день с PlayStation Cup ----------------------------------------------------------
    const seed=(day, own)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Consoler', age:17, source:'rookie', country:'de', countryPing:7,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4},
      career:{year:+day.slice(0,4), season:1, day, division:4, earnings:0, balance:5000, reach:0, tokens:[], log:[], news:[], life:{rp:500}},
      gear:{own:own||[]}, partner:null})); careerEntry(); };
    seed('2024-01-14');
    // Без консоли день, где только PlayStation Cup, в календарь не идёт (был бы закрытым вечером).
    if(ccVictoryAlts('2024-01-14').some(v=>/PlaystationCup/i.test(v.id))) fail('PlayStation-only day listed without a console');
    out.steps.push('without a console: 14.01.2024 (PlayStation Cup only) is not on the calendar');
    // ---- купить консоль в магазине --------------------------------------------------------
    careerBuy('ps5');
    if(!careerOwns('ps5')) fail('PlayStation 5 not bought');
    const ps=ccVictoryAlts('2024-01-14').find(v=>/PlaystationCup/i.test(v.id));
    if(!ps) fail('PlayStation Cup did not appear after buying a PlayStation');
    if(careerVictoryOn('2024-01-14').id!==ps.id) fail('PlayStation Cup is not the cup of the day: '+careerVictoryOn('2024-01-14').id);
    if(!careerCanPlayKindOn('2024-01-14', 'victory')) fail('the PlayStation Cup night cannot be played with a PlayStation');
    if(!(careerYearDays().get('2024-01-14')||[]).some(e=>e.kind==='victory')) fail('the calendar did not pick the PlayStation Cup day up');
    out.steps.push('bought PS5 for $'+CC_SHOP.find(x=>x.id==='ps5').cost+': PlayStation Cup on the calendar and playable');
    // ---- 2026: консольные капы Epic ----------------------------------------------------------------
    seed('2026-01-10');
    const c26=CC_CONSOLE_2026.length, ids26=[...new Set(CC_CONSOLE_2026.map(v=>v.id))];
    if(c26<30 || !ids26.some(x=>/PlayStationCup/.test(x)) || !ids26.some(x=>/ConsoleVCC/.test(x))) fail('2026 console cups missing: '+c26);
    const before=ccVictoryList().filter(v=>ccConsoleNeed(v)).length;
    careerBuy('ps5');
    const inList=ccVictoryList().filter(v=>ccConsoleNeed(v));
    if(inList.length<=before) fail('buying a PlayStation added no console cups: '+before+' -> '+inList.length);
    const ps26=inList.find(v=>/PlayStationCup/.test(v.id));
    if(!ps26) fail('no 2026 PlayStation Cup on the calendar with a PlayStation');
    if(!(ps26.payT && ps26.payT.EU && ps26.payT.EU.length)) fail('PlayStation Cup 2026 has no payouts');
    const day26=[before, inList.length, ps26.day+' '+ps26.id];
    const vcc=inList.find(v=>/ConsoleVictoryCup|ConsoleVCC/.test(v.id));
    if(!vcc || ccVicPerWin(vcc)!==100 || !vcc.zb) fail('Console Victory Cup 2026: '+JSON.stringify(vcc && {id:vcc.id, zb:vcc.zb})+' · listed '+inList.map(v=>v.day+' '+v.id).join(', '));
    out.steps.push('2026: '+c26+' console cups ('+ids26.length+' kinds); on the calendar without a console '+day26[0]+', with a PlayStation '+day26[1]+'; e.g. '+day26[2]+'; '+vcc.day+' '+vcc.id+' $100 a win, ZB · days '+inList.map(v=>v.day.slice(5)).join(' '));
    // ---- магазин и языки ---------------------------------------------------------------------
    CH_TAB='shop'; try{ careerTab('shop'); }catch(e){}
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      ['ccShopps5','ccShopxbox','ccShopConsoles','ccShopConsoleHint','ccShopConsoleFx','ccNeedPs','ccNeedXbox','ccNeedConsole'].forEach(k=>{ if(!D[k] || /—/.test(D[k])) fail(l+': '+k); }); });
    out.steps.push('five languages');
  } catch(e){ if(!out.fail) out.fail = String(e && e.message || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEG'+'IN' + encodeURIComponent(JSON.stringify(out)) + 'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccons-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if ((out.errs||[]).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs||[]).length) process.exit(1);
console.log('OK console cups need a console from the shop');
