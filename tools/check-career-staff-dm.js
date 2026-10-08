// Штаб в личке (его слово 8.10: «весь штаб у игрока ещё должен быть в закрепе и писать по теме»).
// Нанятые коуч/психолог/SMM — в «Закреплено» после тиммейта, здороваются один раз, пишут по поводу; уволенный уходит из закрепа.
//   node tools/check-career-staff-dm.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  const card={handle:'PinMate', region:'EU', rating:80, _ovr:80, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null};
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Pin', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:80, role:'roleIGL', attrs:ccRookieAttrs(80,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
    career:{season:1, day:'2026-02-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]},
    partner:{card:card, patience:40, since:'2026-01-01', dev:0}, partners:[{card:card, patience:40, since:'2026-01-01', dev:0}]}));
  careerLoad();
  const until='2026-12-31', co=CC_COACHES[0], ps=CC_PSYCHS[0], sm=CC_SMM[0];
  CAREER.coach={id:co.id, until, months:1};
  CAREER.psych=Object.assign({}, ps, {until, months:1, rating:90});
  CAREER.smm={id:sm.id, name:sm.name, at:sm.at, until, months:1};
  const names=['PinMate', co.name, ps.name, sm.name];
  const order=html=>{ const d=document.createElement('div'); d.innerHTML=html; const side=d.querySelector('.dm-side'); if(!side) return null;
    return [...side.querySelectorAll('.dm-side-h, .dm-line')].map(e=>e.classList.contains('dm-side-h') ? '#'+(e.classList.contains('dm-side-pin') ? 'PIN' : e.textContent.trim())
      : (names.find(n=>e.textContent.indexOf(n)>=0)||'?')); };
  CH_DMKIND=null;
  const all=order(careerSocialHTML()); out.notes.all=all;
  check('штаб в закрепе: тиммейт, коуч, психолог, SMM', all && all.slice(0,5).join('|')==='#PIN|PinMate|'+co.name+'|'+ps.name+'|'+sm.name, all && all.join(' | '));
  const th=k=>careerDms().find(t=>t.who && t.who.staff===k);
  check('каждый поздоровался по своей теме', ['coach','psych','smm'].every(k=>th(k) && th(k).msgs.length===1 && th(k).msgs[0].k==='dmStHi_'+k), ['coach','psych','smm'].map(k=>th(k) && th(k).msgs.map(m=>m.k)).join(';'));
  careerSocialHTML();
  check('приветствие не повторяется', th('coach').msgs.length===1);
  // плохой вечер: коуч разбирает, психолог поддерживает
  const cr=CAREER.career; cr.log=cr.log||[];
  cr.log.push({season:1, day:cr.day, div:1, place:80, of:100, passed:false, games:6, avg:42.5, elims:3});
  ccStaffDmTick(ccAddDays(cr.day, 1));
  const lk=k=>{ const t=th(k); return t.msgs[t.msgs.length-1]; };
  out.notes.coach=ccText(lk('coach')); out.notes.psych=ccText(lk('psych'));
  check('коуч разобрал вечер', lk('coach').k==='dmStCoachNight' && /80/.test(ccText(lk('coach'))), out.notes.coach);
  check('психолог написал после провала', lk('psych').k==='dmStPsBad', lk('psych').k);
  check('SMM молчит до недели', lk('smm').k==='dmStHi_smm', lk('smm').k);
  cr.reach=4500; ccStaffDmTick(ccAddDays(cr.day, 8));
  out.notes.smm=ccText(lk('smm'));
  check('через неделю SMM прислал подписчиков', lk('smm').k==='dmStSmmWeek', lk('smm').k);
  check('коуч не повторяет разбор того же вечера', lk('coach').k==='dmStCoachWeek' || th('coach').msgs.filter(m=>m.k==='dmStCoachNight').length===1);
  // уволенный уходит из закрепа
  CAREER.psych=null;
  const after=order(careerSocialHTML()); out.notes.after=after;
  const pinEnd=after.findIndex((x,i)=>i>0 && x[0]==='#');
  check('уволенный психолог не в закрепе', after.slice(0,pinEnd).indexOf(ps.name)<0, after.join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stdm-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK штаб в личке ' + JSON.stringify(out.notes));
