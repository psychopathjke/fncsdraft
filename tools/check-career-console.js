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
    // ---- мобильные капы: телефон, своя сцена, своя сила ----------------------------------------------
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    if(ccConsoleNeed({id:'S41_MobileVictoryCup_BR'})!=='mobile' || ccConsoleNeed({id:'S11_WinterRoyale_Mobile'})!=='mobile') fail('mobile cups do not need a phone');
    if(ccConsoleNeed({id:'S41_PSTypicalGamer', plat:'ps'})!=='ps') fail('platform from the cup is ignored');
    const mob26=CC_CONSOLE_2026.filter(v=>v.plat==='mobile');
    if(mob26.length<20) fail('2026 mobile cups missing: '+mob26.length);
    seed('2026-06-27');
    const mobBefore=ccVictoryList().filter(v=>ccConsoleNeed(v)==='mobile').length;
    careerBuy('phone');
    if(!careerOwns('phone')) fail('phone not bought');
    const mobList=ccVictoryList().filter(v=>ccConsoleNeed(v)==='mobile');
    if(mobList.length<=mobBefore) fail('buying a phone added no mobile cups: '+mobBefore+' -> '+mobList.length);
    const pcO=CAREER.player.ovr;
    if(ccMobileOvr()!==CC_MOB_START) fail('mobile rating should start at '+CC_MOB_START+' whatever the PC rating: '+ccMobileOvr());
    const p60=ccMobileSelfPow(); CAREER.player.ovr=99; const p60b=ccMobileSelfPow(); CAREER.player.ovr=pcO;
    if(p60!==p60b) fail('mobile power depends on the PC rating: '+p60+' vs '+p60b);
    CAREER.career.mobOvr=80; if(!(ccMobileSelfPow()>p60)) fail('mobile power does not grow with the mobile rating'); delete CAREER.career.mobOvr;
    const mf=ccMobileField(100), roster=CC_MOBILE_ROSTER.EU, rnames=new Set(roster.map(x=>x[0]));
    const realN=mf.filter(t=>rnames.has(t.squad[0].handle)).length;
    if(mf.length!==100 || realN!==Math.min(100, roster.length)) fail('mobile field: '+mf.length+' teams, '+realN+' real mobile players');
    const pcSet=new Set(ccSceneRoster('EU').map(c=>hKey(c)));
    const pcIn=mf.filter(t=>pcSet.has(hKey(t.squad[0])) && !rnames.has(t.squad[0].handle)).length;
    if(pcIn) fail('PC scene in a mobile field: '+pcIn);
    out.steps.push('mobile: '+mob26.length+' cups 2026, on the calendar without a phone '+mobBefore+', with '+mobList.length+'; field 100 = '+realN+' real mobile players (e.g. '+mf[0].squad[0].handle+'); mobile rating starts at '+CC_MOB_START+' (PC '+pcO+'), power independent of PC');
    // Полный мобильный вечер.
    const mc=mobList.find(v=>v.mode==='solo' && v.day>=careerToday());
    seed(mc.day, ['phone']);
    ccVictoryPick(mc.id);
    if(careerVictoryOn(mc.day).id!==mc.id) fail('mobile cup not picked: '+careerVictoryOn(mc.day).id);
    let usedMob=false, mBase=null, mPow=null; const pcBefore=CAREER.player.ovr, wantPow=ccMobileSelfPow();
    const mfk=ccMobileField; ccMobileField=function(){ usedMob=true; return mfk.apply(this, arguments); };
    const cyt=careerYouTeam; careerYouTeam=function(){ const t=cyt.apply(this, arguments); mBase=t.pow; return t; };
    const sgl=simulateGamesLive; simulateGamesLive=function(field){ if(mPow==null){ const y=field.find(t=>t.isYou); mPow=y && y.pow; } return sgl.apply(this, arguments); };
    const iv=setInterval(()=>{ const am=document.getElementById('ccAskModal'); if(am && am.style.display==='flex'){ const n=document.getElementById('ccAskNo'); if(n) n.click(); }
      const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); const c0=document.querySelector('.cc-choice-btn'); if(c0) c0.click(); }, 20);
    document.getElementById('majorStages').innerHTML='';
    try{ careerSpotEnsure(); }catch(e){}
    await careerPlay();
    clearInterval(iv); ccMobileField=mfk; careerYouTeam=cyt; simulateGamesLive=sgl;
    if(!usedMob) fail('mobile night did not use the mobile scene');
    if(mPow!==wantPow) fail('mobile night power is not from the mobile rating: '+mPow+' want '+wantPow);
    if(CAREER.player.ovr!==pcBefore) fail('a mobile night moved the PC rating: '+pcBefore+' -> '+CAREER.player.ovr);
    const devN=Object.keys(CAREER.career.mobDev||{}).length; if(devN<10) fail('mobile scene ratings did not move: '+devN);
    if((CAREER.career.mobN||0)!==1 || CAREER.career.mobOvr==null) fail('mobile rating not moved by the night: '+JSON.stringify({n:CAREER.career.mobN, r:CAREER.career.mobOvr}));
    const lastM=(CAREER.career.log||[]).slice(-1)[0];
    CH_TAB='table'; careerRenderHub('table');
    const mobTile=[...document.querySelectorAll('#chBody .ch-tile')].find(t=>t.textContent.indexOf(L().ccMobTitle)>=0);
    if(!mobTile || !mobTile.querySelector('tr.you')) fail('no mobile rating board with the player on the boards tab');
    CH_TAB='log'; careerRenderHub('log');
    if(((document.getElementById('chBody')||{}).textContent||'').indexOf(L().ccMobShort)<0) fail('no mobile rating on the profile');
    out.steps.push('mobile night '+mc.day+' '+mc.id+': mobile scene, power '+mPow+' from mobile rating (PC team '+mBase+'), PC rating stays '+CAREER.player.ovr+', scene ratings moved '+devN+', #'+(lastM && lastM.place)+' -> mobile rating '+CAREER.career.mobOvr+'; board: '+mobTile.querySelector('.ct-note').textContent);
    // ---- магазин и языки ---------------------------------------------------------------------
    CH_TAB='shop'; try{ careerTab('shop'); }catch(e){}
    ['ru','en','fr','it','pt'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      ['ccShopps5','ccShopxbox','ccShopphone','ccShopConsoles','ccShopConsoleHint','ccShopConsoleFx','ccNeedPs','ccNeedXbox','ccNeedConsole','ccNeedPhone'].forEach(k=>{ if(!D[k] || /—/.test(D[k])) fail(l+': '+k); }); });
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
  '--allow-file-access-from-files','--virtual-time-budget=400000','--dump-dom',
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
