// Переговоры с будущим тиммейтом (его слово 7.10: «а переговоры с потенциальным тимейтом как», без раздела призовых).
// Правила: аргументы после отказа — только правдивые («играли вместе» есть только при общем вечере в журнале,
// «земляки» — только при одной стране, «свой клуб» — только в основе клуба, «буткемп» — только при $1000 и
// списывает их); когда не хватило немного — условие вместо отказа (одна роль → «пересядь», иначе — пробный кап);
// пробный кап по первому вечеру вместе: хорошо — остаётся, плохо — уходит.
//   node tools/check-career-mate-talks.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const seed=(ovr, country, extra)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Talk', age:18, source:'rookie', country:country||'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:ovr, role:'roleIGL',
              attrs:ccRookieAttrs(ovr,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, extra||{}), partner:null, partners:[]}));
    careerLoad(); };
  seed(84);
  const pool=careerDuoSearchPool(true).filter(w=>w && w.handle && !(careerDmMateOf(w) && careerDuoBeatsYou(w)));
  out.notes.pool=pool.length;
  const marg=w=>{ CAREER.dmBoost=0; return careerDmMargin(w); };
  const near=pool.filter(w=>{ const m=marg(w); return m<0 && m>=-CC_DM_COND; });
  const far=pool.filter(w=>marg(w)<-CC_DM_COND-1 && marg(w)>-50);
  const roleOf=w=>((w.card ? attrsFor(w.card) : attrsFor(w))||{}).roleKey;
  const nearOther=near.find(w=>roleOf(w)!==ccRoleNow()), nearSame=near.find(w=>roleOf(w)===ccRoleNow());
  out.notes.near=near.length; out.notes.far=far.length;
  check('в поиске есть те, кому не хватило немного', near.length>0);

  // ---- условие «пробный кап» и сам пробный кап
  if(nearOther){
    careerDmWrite(nearOther.handle);
    let t=careerDmFind(nearOther.handle);
    check('немного не хватило — условие, а не отказ', t && t.state==='cond' && t.cond==='trial', t && (t.state+'/'+t.cond));
    careerDmCond(t.id, true);
    check('согласился на пробу — можно брать', t.state==='offer' && t.trial===true, t.state);
    careerDmAccept(t.id);
    const inSquad=()=>careerMates().some(m=>m && hKey(m)===hKey(nearOther.handle));
    check('взял на пробу — он в составе', inSquad());
    const d0=CAREER.career.day; careerDmDays(d0, ccAddDays(d0,1));   // отметка дня начала пробы
    CAREER.career.day=ccAddDays(d0, 2);
    CAREER.career.log.push({season:1, day:CAREER.career.day, kind:'cup', place:640, of:700, passed:false, mate:nearOther.handle});
    careerDmDays(CAREER.career.day, ccAddDays(CAREER.career.day, 1));
    out.notes.trialBad={state:t.state, last:(t.msgs[t.msgs.length-1]||{}).k, inSquad:inSquad()};
    check('плохой пробный кап — ушёл', !inSquad() && t.msgs.some(m=>m.k==='dmTrialGo'), JSON.stringify(out.notes.trialBad));
  } else out.fails.push('нет кандидата с другой ролью рядом с порогом');

  // ---- условие «пересядь»
  seed(84);
  if(nearSame){
    careerDmWrite(nearSame.handle);
    const t=careerDmFind(nearSame.handle);
    check('та же роль — условие «пересядь»', t && t.state==='cond' && t.cond==='role', t && (t.state+'/'+t.cond));
    const was=ccRoleNow(); careerDmCond(t.id, true);
    check('пересел — роль сменилась и он согласен', ccRoleNow()!==was && t.state==='offer', ccRoleNow()+' / '+t.state);
  } else out.notes.noSameRole=true;

  // ---- аргументы: только правдивые
  seed(70);
  const far70=careerDuoSearchPool(true).filter(w=>w && w.handle && !(careerDmMateOf(w) && careerDuoBeatsYou(w)) && marg(w)<-CC_DM_COND-1 && marg(w)>-50);
  out.notes.far70=far70.length;
  const target=far70[0];
  if(target){
    seed(70, 'zz', {balance:0});
    careerDmWrite(target.handle);
    let t=careerDmFind(target.handle);
    const a0=careerDmArgs(t);
    out.notes.argsBare=a0;
    check('без общих вечеров, страны, клуба и денег — этих аргументов нет', !a0.some(a=>['history','nat','club','camp'].indexOf(a)>=0), a0.join(','));
    const code=ccDuoNatCode(target);
    seed(70, code||'de', {balance:5000, log:[{season:1, day:'2026-01-20', kind:'cup', place:5, of:700, passed:true, mate:target.handle}]});
    CAREER.org={name:'Probe Club', salary:3000, academy:false, tier:80, since:1};
    careerDmWrite(target.handle);
    t=careerDmFind(target.handle);
    const a1=careerDmArgs(t);
    out.notes.argsFull=a1;
    check('общий вечер — «играли вместе»', a1.indexOf('history')>=0, a1.join(','));
    if(code) check('одна страна — «земляки»', a1.indexOf('nat')>=0, a1.join(','));
    check('в основе клуба — «зову в свой клуб»', a1.indexOf('club')>=0, a1.join(','));
    check('есть $1000 — «буткемп»', a1.indexOf('camp')>=0, a1.join(','));
    const b0=CAREER.career.balance; careerDmArgue(t.id, 'camp');
    check('буткемп списывает $1000', CAREER.career.balance===b0-CC_ARG_CAMP, b0+' -> '+CAREER.career.balance);
  } else out.fails.push('нет кандидата далеко от порога');
  // ---- без спама (его слово 7.10: «просто так можно бесконечно спамить и роли»)
  seed(70);
  const r0=ccRoleNow(); careerRoleSwap(); const r1=ccRoleNow(); careerRoleSwap(); const r2=ccRoleNow();
  out.notes.roleSpam={r0, r1, r2, cool:ccRoleCooldown()};
  check('роль сменилась один раз, вторая смена подряд — нет', r1!==r0 && r2===r1 && ccRoleCooldown()>0, JSON.stringify(out.notes.roleSpam));
  const names=careerDuoSearchPool(true).filter(w=>w && w.handle).slice(0, 6).map(w=>w.handle);
  names.forEach(h=>careerDmWrite(h));
  const asked=names.filter(h=>{ const t=careerDmFind(h); return t && t.msgs.some(m=>m.from==='you'); }).length;
  out.notes.asked=asked;
  check('в день — не больше '+CC_DM_ASKS_DAY+' предложений в дуо', asked===CC_DM_ASKS_DAY, String(asked));
  CAREER.career.day=ccAddDays(CAREER.career.day, 1);
  check('назавтра снова можно', ccDmAsksLeft()===CC_DM_ASKS_DAY, String(ccDmAsksLeft()));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mtalk-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK переговоры с тиммейтом ' + JSON.stringify(out.notes));
