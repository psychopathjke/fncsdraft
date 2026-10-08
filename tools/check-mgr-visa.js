// Визы на ЛАН в менеджере (его слово 9.10: «делай, только травмы не надо»).
//   node tools/check-mgr-visa.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(async ()=>{ const out={fails:[], notes:{}, errs:[]};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const ce=console.error; console.error=(...a)=>{ out.errs.push(a.map(x=>String(x && x.stack || x)).join(' ').slice(0,300)); ce.apply(console, a); };
try{
  ['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
  LANG='ru';
  MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024);
  const fi=MGR_NEW_LIST.findIndex(c=>c.name==='Team Falcons'); mgrTake(fi>=0 ? fi : 0); MGR.view='result';
  const t=MGR.teams[0], h=t.cards[0], card=mgrCard(h);
  mgrNatCode=x=>hKey(x)===hKey(h) ? 'ru' : 'fr';          // паспорт, которому нужны обе визы; остальные — французы
  MGR.club.cash=10000;
  const today=CAREER.career.day, lan=ccAddDays(today, 30);
  const ev={kind:'car', ck:'globals', cid:'Globals', id:'car:Globals', day:lan, name:'Глобалы', teams:[t.id], mode:'duo'};
  const host=mgrLanHost(ev); out.notes.host=host;
  check('Глобалы 2024 — в США', host && host.nat==='us', JSON.stringify(host));
  check('россиянину в США — 40.38 % отказов (Госдеп FY2025)', mgrVisaRate(h, 'us')===40.38, mgrVisaRate(h, 'us'));
  check('россиянину в Шенген — 7.5 %', mgrVisaRate(h, 'sch')===7.5, mgrVisaRate(h, 'sch'));
  check('французу виза не нужна', mgrVisaRate(t.cards[1], 'us')==null && mgrVisaRate(t.cards[1], 'sch')==null);
  check('онлайн-кап — не ЛАН', !mgrLanHost({kind:'car', ck:'cup', cid:'Cup1', day:lan}));
  // без визы состав не летит
  const before=mgrCarTeams(ev);
  check('без визы состав пропускает ЛАН', before.length===0, before.length);
  check('письмо «пропускает»', (MGR.inbox||[]).some(m=>String(m.id).indexOf('visam|')===0));
  // письмо о визе за 30 дней до ЛАНа
  const orig=mgrCarEvents; mgrCarEvents=()=>[Object.assign({}, ev)];
  MGR.inbox=[]; mgrVisaTick();
  const ask=(MGR.inbox||[]).find(m=>m.ev==='visa');
  out.notes.ask=ask && ask.text;
  check('письмо о визе пришло', !!ask && ask.kind==='event' && ask.zone==='us', JSON.stringify(MGR.inbox.slice(0,2)));
  check('одно письмо, без дублей', (mgrVisaTick(), MGR.inbox.filter(m=>m.ev==='visa').length===1));
  const cash0=MGR.club.cash; mgrInboxDo(ask.id, true);
  check('сбор $185 списан', cash0-MGR.club.cash===185, cash0-MGR.club.cash);
  const v=MGR.visa[ask.key]; out.notes.visa=v;
  check('заявка ждёт 14 дней', v && v.st==='wait' && ccDaysBetween(today, v.ready)===14, JSON.stringify(v));
  v.rate=0; CAREER.career.day=v.ready; mgrVisaTick();
  check('виза одобрена в срок', MGR.visa[ask.key].st==='ok', MGR.visa[ask.key].st);
  check('письмо об одобрении', MGR.inbox.some(m=>String(m.id).indexOf('visar|')===0));
  check('с визой состав летит', mgrCarTeams(ev).length===1);
  // отказ: другая зона, 100 % отказов
  const ev2=Object.assign({}, ev, {ck:'summit', cid:'Summit', id:'car:Summit', name:'Саммит'});
  const host2=mgrLanHost(ev2); out.notes.host2=host2;
  if(host2 && mgrVisaZone(host2.nat)==='sch'){
    mgrCarEvents=()=>[Object.assign({}, ev2, {day:ccAddDays(CAREER.career.day, 5)})];
    mgrVisaTick(); const a2=MGR.inbox.find(m=>m.ev==='visa' && m.zone==='sch' && !m.done);
    check('шенгенское письмо', !!a2, JSON.stringify({vs:MGR.visa, ib:MGR.inbox.slice(0,4).map(m=>[m.id,m.ev,m.zone,m.done]), ppl:mgrEvPeople(t.id), rate:mgrVisaRate(h,'sch'), key:mgrVisaKey('sch',h), tsw:!!MGR.tswap}));
    if(a2){ a2.rate=100; mgrInboxDo(a2.id, true); const v2=MGR.visa[a2.key];
      check('мало дней до ЛАНа — решение накануне', ccDaysBetween(CAREER.career.day, v2.ready)===4, JSON.stringify(v2));
      CAREER.career.day=v2.ready; mgrVisaTick();
      check('отказ при 100 %', MGR.visa[a2.key].st==='no');
      check('после отказа состав не летит', mgrCarTeams(ev2).length===0); }
  }
  mgrCarEvents=orig;
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvisa-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 900000 });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK визы на ЛАН ' + JSON.stringify(out.notes));
