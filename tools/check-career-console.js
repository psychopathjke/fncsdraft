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
    const alts=ccVictoryAlts('2024-01-14'), ps=alts.find(v=>/PlaystationCup/i.test(v.id));
    if(!ps) fail('no PlayStation Cup among the cups of 14.01.2024: '+alts.map(v=>v.id).join(','));
    if(ccConsoleOk(ps)) fail('PlayStation Cup open without a console');
    ccVictoryPick(ps.id);
    // Нет ПК-капа в этот день — кап дня и есть PlayStation Cup: тогда закрыт сам вечер.
    if(careerVictoryOn('2024-01-14').id===ps.id && careerCanPlayKindOn('2024-01-14', 'victory')) fail('PlayStation Cup night playable without a console');
    out.steps.push('cups that day: '+alts.map(v=>v.id).join(', '));
    careerRenderHub('centre');
    const btn=[...document.querySelectorAll('#screen-career-hub .cc-valt')].find(b=>(b.getAttribute('onclick')||'').indexOf(ps.id)>=0);
    if(btn && !btn.disabled) fail('PlayStation Cup button is not greyed');
    if(careerVictoryOn('2024-01-14').id===ps.id){ const tx=(document.getElementById('screen-career-hub')||{}).textContent||'';
      if(tx.indexOf(L().ccNeedPs)<0) fail('the day panel does not say a PlayStation is needed'); }
    out.steps.push('without a console: PlayStation Cup greyed'+(btn ? ' ('+btn.textContent+')' : ' (not on the hub)'));
    // ---- купить консоль в магазине --------------------------------------------------------
    careerBuy('ps5');
    if(!careerOwns('ps5')) fail('PlayStation 5 not bought');
    if(!ccConsoleOk(ps)) fail('PlayStation Cup still closed with a PlayStation');
    ccVictoryPick(ps.id);
    if(careerVictoryOn('2024-01-14').id!==ps.id) fail('PlayStation Cup not picked after buying');
    if(!careerCanPlayKindOn('2024-01-14', 'victory')) fail('the PlayStation Cup night cannot be played with a PlayStation');
    out.steps.push('bought PS5 for $'+CC_SHOP.find(x=>x.id==='ps5').cost+': PlayStation Cup picked and playable');
    // ---- Xbox Cup: одна в день, без Xbox вечер закрыт --------------------------------------------
    seed('2019-07-21', ['ps5']);
    const xb=careerVictoryOn('2019-07-21');
    if(xb && /Xbox/i.test(xb.id)){
      if(careerCanPlayKindOn('2019-07-21', 'victory')) fail('Xbox Cup playable with only a PlayStation');
      out.steps.push('Xbox Cup alone that day: closed with a PlayStation only');
    } else out.steps.push('19.07.2019: day cup is '+(xb && xb.id));
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
