// Сборная под руководством менеджера (его слово 7.10: «в карьере менеджера … сборные могут предлагать менеджером,
// чтоб собрать сборную перед nation капом»). Правило: за MGR_NAT_OFFER_DAYS до Кубка наций во входящих письмо
// федерации; согласился — выбираешь MGR_NAT_SIZE игроков этой страны со всей сцены; в день кубка — место, гонорар
// клубу, письмо; недобор федерация добирает сама; отказ — сборная без тебя.
//   node tools/check-mgr-natjob.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const start=()=>{ localStorage.removeItem('fncsdraft_manager'); MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024); mgrTake(0); };
  // ---- согласился и собрал сам
  start();
  const nd=mgrNationsDay(), od=ccAddDays(nd, -MGR_NAT_OFFER_DAYS), nat=mgrNatOfClub();
  out.notes.days={offer:od, cup:nd, nat};
  check('у клуба есть страна', !!nat);
  mgrAdvanceTo(od);
  const m=(MGR.inbox||[]).find(x=>x.kind==='natjob');
  check('за '+MGR_NAT_OFFER_DAYS+' дней до кубка — письмо федерации', !!m, JSON.stringify((MGR.inbox||[]).slice(0,3).map(x=>x.kind)));
  if(m){
    mgrInboxDo(m.id, true);
    const j=mgrNatJob();
    check('согласился — работа твоя', j && j.state==='yes');
    const sheet=document.getElementById('mgSheet');
    check('открылось окно выбора с карточками', sheet && !sheet.hidden && sheet.querySelectorAll('.mgf-person').length>=MGR_NAT_SIZE, sheet && sheet.querySelectorAll('.mgf-person').length);
    const pool=mgrNatPool(j.nat); out.notes.pool=pool.length;
    check('в выборе только игроки этой страны', pool.every(c=>c.nat===j.nat));
    pool.slice(0, MGR_NAT_SIZE+1).forEach(c=>mgrNatPick(c.handle));
    check('больше '+MGR_NAT_SIZE+' не взять', j.squad.length===MGR_NAT_SIZE, String(j.squad.length));
    const cash0=MGR.club.cash;
    mgrAdvanceTo(nd);
    out.notes.res=j.res;
    check('в день кубка — результат', j.res && j.res.place>=1 && j.res.place<=j.res.of, JSON.stringify(j.res));
    check('гонорар клубу', j.res && MGR.club.cash>=cash0+j.res.fee && j.res.fee>0, cash0+' -> '+MGR.club.cash);
    check('письмо о результате', (MGR.inbox||[]).some(x=>x.id==='njr'+MGR.year));
    check('свой состав — без добора федерации', !j.squad.some(x=>x.fed));
  }
  // ---- согласился, но взял одного: добор
  start();
  mgrAdvanceTo(ccAddDays(mgrNationsDay(), -MGR_NAT_OFFER_DAYS));
  let m2=(MGR.inbox||[]).find(x=>x.kind==='natjob');
  if(m2){ mgrInboxDo(m2.id, true); const j=mgrNatJob(); mgrNatPick(mgrNatPool(j.nat)[3].handle); mgrAdvanceTo(mgrNationsDay());
    check('недобор — федерация добрала до '+MGR_NAT_SIZE, j.squad.length===MGR_NAT_SIZE && j.squad.filter(x=>x.fed).length===MGR_NAT_SIZE-1, JSON.stringify(j.squad.map(x=>x.fed?1:0))); }
  // ---- отказался
  start();
  mgrAdvanceTo(ccAddDays(mgrNationsDay(), -MGR_NAT_OFFER_DAYS));
  const m3=(MGR.inbox||[]).find(x=>x.kind==='natjob');
  if(m3){ mgrInboxDo(m3.id, false); mgrAdvanceTo(mgrNationsDay());
    check('отказался — сборная играет без тебя', mgrNatJob().state==='no' && !mgrNatJob().res); }
  // ---- раз в сезон
  check('одно письмо за сезон', (MGR.inbox||[]).filter(x=>x.kind==='natjob').length===1);
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'natjob-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK сборная менеджера ' + JSON.stringify(out.notes));
