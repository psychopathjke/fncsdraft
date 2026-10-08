// Аналитик и психолог (его слова 8.10): рейтинг, цена от рейтинга, эффекты — сила на вечер и мягче провал формы.
//   node tools/check-career-analyst-psych.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'P', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:82, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null}, career:{season:1, day:'2026-03-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, partner:null, partners:[]}));
  careerLoad();
  CAREER.career.balance=20000; careerSave();
  const an=ccStaff2List('analyst'), ps=ccStaff2List('psych');
  out.notes.an=an.map(p=>p.name+' '+ccStaff2Rating('analyst',p)+' $'+ccStaff2Cost('analyst',p));
  out.notes.ps=ps.map(p=>p.name+' '+ccStaff2Rating('psych',p)+' $'+ccStaff2Cost('psych',p));
  check('официальная работа FNCS — выше неофициальной при близкой аудитории', ccStaff2Rating('analyst', CC_ANALYSTS.find(p=>p.id==='kinch'))>ccStaff2Rating('analyst', CC_ANALYSTS.find(p=>p.id==='reisshub')));
  check('список по рейтингу', an.every((p,i,a)=>!i || ccStaff2Rating('analyst',a[i-1])>=ccStaff2Rating('analyst',p)));
  check('дороже — у кого рейтинг выше', ccStaff2Cost('analyst', an[0])>ccStaff2Cost('analyst', an[an.length-1]) && ccStaff2Cost('psych', ps[0])>ccStaff2Cost('psych', ps[ps.length-1]));
  check('без аналитика сила не меняется', ccAnalystPow()===0 && ccPsychSoft()===0);
  const b0=CAREER.career.balance; careerHireStaff2('analyst', an[0].id);
  check('нанял аналитика — деньги списаны', CAREER.career.balance===b0-ccStaff2Cost('analyst', an[0]) && ccStaff2('analyst') && ccStaff2('analyst').id===an[0].id);
  check('аналитик даёт +1…+3 к силе', ccAnalystPow()>=1 && ccAnalystPow()<=3, String(ccAnalystPow()));
  careerHireStaff2('psych', 'stellberg');
  CAREER.career.form=0; careerFormAdd(70, 70);
  out.notes.form=CAREER.career.form;
  check('психолог смягчает провал формы', CAREER.career.form>-1 && CAREER.career.form<0, String(CAREER.career.form));
  careerFormAdd(1, 70); check('и не трогает рост', Math.abs(CAREER.career.form-(out.notes.form+1))<1e-9, String(CAREER.career.form));
  const t1=careerStaff2TileHTML('analyst'), t2=careerStaff2TileHTML('psych');
  check('кнопка смены — не «Сменить СММ»', t1.indexOf(L().ccSmmChange)<0 && t1.indexOf(L().ccStaffChange)>=0);
  check('плитки показывают рейтинг и эффект', t1.indexOf(String(ccStaff2('analyst').rating))>=0 && t1.indexOf(L().ccAnalyst)>=0 && t2.indexOf('Mia Stellberg')>=0);
  ccStaff2PickOpen('analyst'); const rows=document.querySelectorAll('#staff2PickBody .cc-buy').length; ccStaff2PickClose();
  check('окно выбора — все аналитики', rows===CC_ANALYSTS.length, String(rows));
  check('Youenn нет', !CC_PSYCHS.some(p=>/youenn/i.test(p.name)));
  const dj=CC_COACHES.find(c=>c.id==='destiny'); check('DestinysJesus в коучах с рейтингом', dj && dj.rating>=60, dj && String(dj.rating));
  // Штаб: шесть карточек, нанятые — с рейтингом и эффектом, пустые — «Нанять»; коуч больше не на «Карьере».
  const cards=ccStaffCards(); out.notes.staff=cards.map(c=>c.role+(c.name?':'+c.r:''));
  check('штаб — шесть ролей', cards.length===6, String(cards.length));
  const ph=careerStaffPanelHTML(); check('штаб: нанятые с рейтингом, пустые — нанять', ph.indexOf('cc-staff-rt')>=0 && ph.indexOf(L().ccStaffHire)>=0 && ph.indexOf(ccStaff2('analyst').name)>=0);
  check('вкладка «Клуб» — со штабом', careerClubTabHTML().indexOf('cc-staff-wrap')>=0);
  check('коуч ушёл с «Карьеры»', careerMeHTML().indexOf('ch-tile-coach')<0);
  CAREER.career.day=ccAddDays(CAREER.career.day, 31); check('месяц прошёл — аналитик ушёл', ccStaff2('analyst')===null && ccAnalystPow()===0);
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anpsy-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK аналитик и психолог ' + JSON.stringify(out.notes));
