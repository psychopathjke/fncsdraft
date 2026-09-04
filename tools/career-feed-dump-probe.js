// Что на самом деле лежит в ленте карьеры после двух месяцев в Дивизионе 1:
// автор, ключ, текст, счётчики и комментарии под каждым постом. Проба, не
// проверка — печатает, чтобы прочитать глазами.
//
//   node tools/career-feed-dump-probe.js [days] [div]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DAYS = +(process.argv[2] || 60);
const DIV = +(process.argv[3] || 1);
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
  const out={errs:null, err:null, posts:[], from:null, to:null, played:0};
  try{
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup'||e.kind==='final')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Feedy', age:18, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:${DIV===1?90:70}, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:${DIV}, earnings:0, balance:1000, reach:3000,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
    }
    let caught=null;
    const realDigest=careerFfDigest;
    careerFfDigest=function(ff){ caught=ff; };
    out.from=careerToday();
    await careerFastForward(${DAYS});
    careerFfDigest=realDigest;
    out.to=careerToday();
    out.played=(caught && caught.played && caught.played.length)||0;
    const strip=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();
    (CAREER.career.news||[]).forEach(function(n){
      const who=ccPostAuthor(n);
      const st=ccPostStats(n, who);
      const co=ccPostComments(n, who, st);
      const rows=[];
      const re=/<div class="x-co-r([^"]*)"><b>(.*?)<\\/b><span>([^<]*)<\\/span>/g;
      let m; while((m=re.exec(co))) rows.push((m[1].trim()?'['+m[1].trim()+'] ':'')+m[2].replace(/<[^>]+>/g,'✓')+': '+m[3]);
      out.posts.push({day:n.day, kind:n.kind, k:n.k||'(text)', by:(who.you?'YOU ':'')+who.name+(who.verified?' ✓':''),
        text:strip(ccText(n)), likes:st.likes, replies:st.replies, views:st.views,
        tbl:!!(n.tbl&&n.tbl.rows&&n.tbl.rows.length), q:!!n.q, card:!!n.card, co:rows});
    });
  }catch(e){ out.err=String((e&&(e.stack||e.message))||e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'feeddump-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=900000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log('дни: ' + out.from + ' → ' + out.to + ', турниров: ' + out.played + ', постов: ' + out.posts.length);
if ((out.errs||[]).length) console.log('ошибки страницы: ' + out.errs.join(' | '));
if (out.err) { console.error('ВСТАЛА: ' + out.err); process.exit(1); }
out.posts.forEach(p => {
  console.log('\n[' + p.day + '] ' + p.by + '  (' + p.k + ', ' + p.kind + ')' +
    (p.tbl ? ' [tbl]' : '') + (p.q ? ' [quote]' : '') + (p.card ? ' [card]' : ''));
  console.log('   ' + p.text);
  console.log('   ♥ ' + p.likes + '  ↩ ' + p.replies + '  👁 ' + p.views);
  p.co.forEach(c => console.log('      ↳ ' + c));
});
