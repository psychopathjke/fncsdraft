// Провалы элиты в ленте (5.10, Notion «05»: «flops de la elite»): фаворит поля (топ-3 по
// силе) внизу таблицы — пост аналитика с местом; нормальный вечер — тишина; одна команда
// не чаще раза в неделю, всего не больше CC_FLOP_WEEK за семь дней.
//
//   node tools/check-career-elite-flops.js
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
      v:1, player:{nick:'Flop', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:80, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    LANG='ru'; CC_L_CACHE={};
    const cr=CAREER.career;
    const field=()=>careerCupField(cr, [careerCard()], 50).filter(t=>!t.isYou);
    const flops=()=>(cr.news||[]).filter(e=>e.k==='ccNewsEliteFlop');
    // 1. Нормальный вечер: места по силе — поста нет.
    let f=field(); let ranked=f.slice().sort((x,y)=>(y.pow||0)-(x.pow||0));
    ccEliteFlopPost(ranked, 'Probe Cup');
    check('нормальный вечер — без поста', flops().length===0, flops().length);
    // 2. Фаворит #1 на 30-м месте — пост есть, называет команду и место.
    const fav=ranked[0]; ranked=ranked.filter(t=>t!==fav); ranked.splice(29, 0, fav);
    ccEliteFlopPost(ranked, 'Probe Cup');
    const p=flops()[0];
    const name=String(fav.name||'').replace(/<[^>]*>/g,'').trim();
    check('провал фаворита — пост', !!p && p.a[1]===name && p.a[2]===30 && p.a[4]<=CC_FLOP_FAV, JSON.stringify(p&&p.a));
    check('автор — аналитик', p && ccPostAuthor(p).name===CC_ANALYST.name, p && ccPostAuthor(p).name);
    const txt=p ? String(L().ccNewsEliteFlop.apply(null, p.a)) : '';
    check('текст называет команду и место', txt.indexOf(name)>=0 && /30/.test(txt), txt.slice(0,160));
    // 3. Та же команда второй раз за неделю — не дублируется.
    ccEliteFlopPost(ranked, 'Probe Cup 2');
    check('та же команда — не чаще раза в неделю', flops().length===1, flops().length);
    // 4. Лимит недели: ещё два разных провала — пройдёт только один (всего CC_FLOP_WEEK).
    for(let k=0;k<2;k++){
      let r=field().sort((x,y)=>(y.pow||0)-(x.pow||0)); const fv=r[0]; r=r.filter(t=>t!==fv); r.splice(40, 0, fv);
      fv.name='Probe Flop '+k; ccEliteFlopPost(r, 'Probe Cup '+(k+3));
    }
    check('лимит недели соблюдён', flops().length===CC_FLOP_WEEK, flops().length);
    // 5. Через неделю снова можно.
    cr.day=ccAddDays(cr.day, 8);
    let r=field().sort((x,y)=>(y.pow||0)-(x.pow||0)); const fv=r[0]; r=r.filter(t=>t!==fv); r.splice(30, 0, fv);
    ccEliteFlopPost(r, 'Probe Cup late');
    check('через неделю — снова пост', flops().length===CC_FLOP_WEEK+1, flops().length);
    // Замер: как часто фаворит проваливается на сыгранном поле (simulateGames, 12 игр).
    let hit=0; const N=120;
    for(let i=0;i<N;i++){ const t=field(); simulateGames(t, CAREER_CUP_GAMES, pointsForPlace, 4);
      const rk=t.slice().sort((a,b)=>b.stagePts-a.stagePts || (b.wins||0)-(a.wins||0) || b.stageElims-a.stageElims);
      if(ccEliteFlop(rk)) hit++; }
    out.steps.push('вечеров с провалом фаворита: '+hit+' из '+N+' ('+Math.round(hit/N*100)+'%)');
  }catch(e){ out.fails.push('исключение: '+String(e && e.stack || e).slice(0,300)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BE'+'GIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccflops-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
const m = dom.match(/BEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('elite flops are posted by the analyst, once per team a week, within the weekly cap');
fs.rmSync(dir, { recursive: true, force: true });
