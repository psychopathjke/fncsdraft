// Своё био и коллабы по предложению (5.10, Notion «05», испанский игрок: «edición de
// biografía», «colaboraciones con otros influencers»).
//
// Проверяется: био чистится (длина CC_BIO_MAX, без переносов) и выводится экранированным,
// сброс возвращает авто-строку; предложение коллаба — раз в день, согласие даёт договор и
// пост, эфир «Коллаб» берёт креатора из договора, поднимает охват не больше потолка Про-Ама,
// отдаёт ему долю не больше CC_COLAB_GIVE.cap, договор гасит; повтор с тем же приносит меньше.
//
//   node tools/check-career-bio-collab.js
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
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fails:[], errs:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Bio', age:19, source:'rookie', country:'es', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-03', division:2, earnings:0, balance:1000, reach:60000,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    // ---- био ---------------------------------------------------------------------
    const evil='<img src=x onerror=alert(1)>\\nвторая строка '+'x'.repeat(400);
    const t=careerBioSet(evil);
    check('био режется по CC_BIO_MAX', t.length<=CC_BIO_MAX && cr.bio.length<=CC_BIO_MAX, t.length);
    check('без переносов строк', !/[\\n\\r]/.test(cr.bio));
    const own=ccBioOwnHTML(), line=careerBioHTML();
    check('шапка соцсети экранирует', own.indexOf('<img')<0 && own.indexOf('&lt;img')>=0, own.slice(0,80));
    check('био профиля — своё и экранированное', line.indexOf('<img')<0 && line.indexOf('&lt;img')>=0, line.slice(0,80));
    // Окно правки: поле с текущим текстом, сохранение пишет, сброс возвращает авто.
    const box=document.createElement('div'); box.id='xBioOwn'; document.body.appendChild(box);
    careerBioEdit();
    const inp=document.getElementById('xBioIn');
    check('поле правки открывается', !!inp && inp.maxLength===CC_BIO_MAX);
    inp.value='Pro de Fortnite desde España';
    careerBioCommit(false);
    check('сохранение пишет', cr.bio==='Pro de Fortnite desde España' && box.textContent.indexOf('España')>=0, cr.bio);
    careerBioEdit(); careerBioCommit(true);
    check('сброс к авто', cr.bio==null && careerBioHTML().indexOf(L().ccBioPro)>=0, careerBioHTML().slice(0,60));
    box.remove();
    out.steps.push('био: '+CC_BIO_MAX+' символов, экранируется, сброс к авто');
    // ---- коллаб --------------------------------------------------------------------
    const list=ccProAmCreators();
    const name=list[0];
    check('креаторы есть', !!name);
    CC_COLAB_ASK.lo=1; CC_COLAB_ASK.hi=1;              // согласие наверняка — проверяем последствия
    const news0=(cr.news||[]).length;
    check('согласие на предложение', careerColabAsk(name)===true && ccColabDeal() && ccColabDeal().name===name);
    check('пост о согласии', (cr.news||[]).some(n=>n.k==='ccNewsColabYes'));
    check('второй раз за день нельзя', careerColabAsk(list[1]||name)===false);
    check('коллаб эфира — из договора', ccStreamMate() && ccStreamMate().name===name);
    const panel=ccColabPanelHTML();
    check('панель коллабов называет договор', /tv-colab-deal/.test(panel), panel.slice(0,120));
    const r0=careerReach(), from1=ccColabFrom(name), give=ccColabGive();
    check('приход не выше потолка Про-Ама', from1>0 && from1<=CC_PROAM_REACH_CAP, from1);
    check('доля креатору в пределах', give>0 && give<=CC_COLAB_GIVE.cap, give);
    cr.energy=100;
    const ok=careerStreamGo('colab');
    check('эфир «Коллаб» прошёл', ok, String(ok));
    check('охват вырос не меньше прихода', careerReach()-r0>=from1, (careerReach()-r0)+' vs '+from1);
    // Долю считает сам эфир от охвата после своих минут — сверяется записанное с постом.
    const gave=(cr.colabGave||{})[hKey(name)]||0;
    check('счёт коллабов и доля записаны', ccColabTimes(name)===1 && gave>0 && gave<=CC_COLAB_GIVE.cap && Math.abs(gave-give)<=Math.max(5, give*0.05), gave+' / '+give);
    check('договор погашен', !ccColabDeal());
    const post=(cr.news||[]).filter(n=>n.k==='ccNewsStreamColab').pop();
    check('пост эфира с долей креатору', post && post.a && post.a[3]===ccNum(gave), JSON.stringify(post&&post.a));
    check('повтор с тем же приносит меньше', ccColabFrom(name)<from1, ccColabFrom(name)+' / '+from1);
    out.steps.push('коллаб с @'+ccHandle(name)+': +'+from1+' охвата, ему +'+give+', повтор +'+ccColabFrom(name));
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccbiocollab-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=90000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('own bio is clean and escaped; a pitched collab seats the creator, pays both within caps and fades on repeat');
fs.rmSync(dir, { recursive: true, force: true });
