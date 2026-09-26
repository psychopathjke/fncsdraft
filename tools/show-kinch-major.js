// Как выглядят посты аналитика после МЕЙДЖОРА — на настоящем прогоне.
//
// Его просьба 27 сентября: «сделай прогон и как будет писаться после MAJOR
// кинч». Проба сажает карьеру в первый дивизион в день гранд-финала Мейджора 1,
// играет вечер через тот же интерфейс, что и игрок (кнопка «играть», скип
// анимации), и печатает то, что после этого легло в ленту: личный разбор и
// доску лидеров — текстом и построчно, как их увидит игрок.
//
//   node tools/show-kinch-major.js [регион]
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const REGION = process.argv[2] || 'EU';
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const OPEN = '<' + 'script>', CLOSE = '<' + '/' + 'script>';

const BOOT = '<pre id="__k" style="display:none"></pre>' + OPEN + `
(async function(){
  const out={steps:[], posts:[], err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)); });
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // Окна по дороге отвечает харнесс: метка точки, выбор хода, пикер высадки.
  setInterval(function(){
    const am=document.getElementById('ccAskModal');
    if(am && am.style.display==='flex'){
      const yes=document.getElementById('ccAskYes'), no=document.getElementById('ccAskNo');
      if(yes && yes.textContent===L().ccSpotGateSet){ careerSpotEnsure(); yes.click(); }
      else if(no) no.click();
    }
    document.querySelectorAll('.cc-choice-btn').forEach(b=>b.click());
    const p=document.querySelector('.landing-picker'); if(!p) return;
    const z=p.querySelectorAll('.land-zone'); if(!z.length) return;
    z[0].click();
    const c=p.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click();
  }, 25);
  try{
    // День гранд-финала Мейджора 1 — по самому календарю, а не по памяти.
    let day=null;
    for(let d=ccYearFrom(); d<=ccYearTo(); d=ccAddDays(d,1)){
      const ev=careerMajorOn(d);
      if(ev && ev.n===1 && ev.stage==='final'){ day=d; break; }
    }
    if(!day) throw new Error('в календаре нет финала Мейджора 1');
    out.steps.push('финал Мейджора 1: '+day);
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Majorman', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'${REGION}', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], major:{n:1, got:'heats', pass:'heats', ticket:true}},
      partner:null}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(96,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    // Напарник: берём первого, кто написал сам.
    const dm=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
    if(dm){ careerDmAccept(dm.id); careerRenderHub('centre'); }
    skipAnimation=true; CC_SKIP_RUN=true;
    const before=(CAREER.career.news||[]).length;
    const sk=setInterval(()=>{ const b=document.getElementById('majorSkipBtn'); if(b && !b.disabled) b.click(); }, 20);
    await runCareerMajor();
    clearInterval(sk);
    const fresh=(CAREER.career.news||[]).slice(0, Math.max(0,(CAREER.career.news||[]).length-before));
    out.steps.push('постов за вечер: '+fresh.length);
    fresh.forEach(function(n){
      if(n.k!=='ccNewsKinch' && n.k!=='ccNewsStatBoard') return;
      const who=(typeof ccPostAuthor==='function') ? ccPostAuthor(n) : null;
      out.posts.push({k:n.k, by:who?(who.name+' @'+who.handle):'—',
        text:String(L()[n.k].apply(null, n.a||[])),
        rows:(n.lead && n.lead.rows) ? n.lead.rows.map(r=>[String(L()[r[0]]||r[0]), String(r[1]), '@'+r[2]]) : null});
    });
  }catch(e){ out.err=String(e && e.message || e); }
  document.getElementById('__k').textContent='KMB'+JSON.stringify(out)+'KME';
})();
` + CLOSE;

const file = path.join(ROOT, '__kinchmajor.html');
fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + file.split(path.sep).join('/')],
  {maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
fs.unlinkSync(file);
const m = /KMB(\{[^]*?\})KME/.exec(dom);
if (!m) { console.error('проба не отчиталась'); process.exit(2); }
const o = JSON.parse(m[1]);
o.steps.forEach(s => console.log('· ' + s));
if (o.err) { console.error('ошибка: ' + o.err); process.exit(1); }
if (!o.posts.length) { console.error('аналитик не написал ничего'); process.exit(1); }
o.posts.forEach(p => {
  console.log('\n' + p.by);
  console.log('  ' + p.text);
  if (p.rows) {
    const w = Math.max.apply(null, p.rows.map(r => r[0].length));
    p.rows.forEach(r => console.log('    ' + r[0].padEnd(w + 2) + r[1].padStart(10) + '   ' + r[2]));
  }
});
if (o.errs.length) console.log('\nошибки страницы: ' + o.errs.slice(0, 3).join(' | '));
