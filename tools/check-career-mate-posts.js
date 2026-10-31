// Посты живого напарника в командной карьере (Notion 31.10, французская пара: «on voit les tweets automatiques du mate,
// on ne peut pas y répondre, et ceux qu'il fait à la main, on ne les voit pas» + профиль «Tu n'as encore rien publié»).
// Проверка: свой пост сразу шлёт карточку; ответ под постом напарника хранится у себя и едет в карточке;
// напарник вписывает его под свой пост один раз; профиль напарника показывает его посты, пустой — не «ты».
//
//   node tools/check-career-mate-posts.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'fr', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Wkeyz', age:20, source:'rookie', country:'fr', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90, 'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:2026, year0:2026, day:'2026-03-10', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'matep'},
      partner:{card:card('Vinz',88), patience:60, since:'2026-01-01', dev:0}, partners:[{card:card('Vinz',88), patience:60, since:'2026-01-01', dev:0}]}));
    careerEntry();
    // Живой напарник: командный режим и карточка с проводом.
    let sent=0;
    const peer=Object.assign(card('Vinz', 88), {reMate:[]});
    let peerPosts=[{id:'n7', day:'2026-03-09', k:null, text:'mate hand post', kind:'flat', likes:0, rts:0, res:[]}];
    window.ccMpOn=()=>true;
    Object.defineProperty(MP, 'peer', {configurable:true, get:()=>peer});
    Object.defineProperty(MP, 'peerPosts', {configurable:true, get:()=>peerPosts});
    MP.sendCard=()=>{ sent++; };

    // 1) Свой пост от руки — карточка уходит сразу, пост в проводе.
    careerRenderHub('social');
    const box=document.getElementById('ccPostBox');
    check('поле поста есть', !!box);
    if(box){ box.value='hello from me'; careerPostWrite(); }
    check('свой пост сразу шлёт карточку', sent>=1, String(sent));
    const wire=ccMatePostsWire()||[];
    check('пост от руки в проводе', wire.some(x=>x.text==='hello from me'), JSON.stringify(wire).slice(0,200));
    const myPost=(CAREER.career.news||[]).find(x=>x.text==='hello from me');

    // 2) Пост напарника в ленте и в его профиле; пустой профиль — не «ты».
    check('пост напарника в ленте', /mate hand post/.test(careerFeedHTML()));
    const who=careerWhoHTML('Vinz');
    check('профиль напарника: его пост', /mate hand post/.test(who), who.slice(-300));
    const empty=careerWhoHTML('Nobody Here');
    check('пустой чужой профиль — не «ты ещё ничего»', empty.indexOf(L().xNoPosts)<0 && empty.indexOf(L().xNoPostsWho)>=0);

    // 3) Ответ под постом напарника: хранится у себя, виден под постом, едет в карточке.
    const s0=sent;
    const ta=document.createElement('textarea'); ta.id='ccReplyBoxmate:n7'; ta.value='gg mate'; document.body.appendChild(ta);
    careerReplyWrite('mate:n7');
    check('ответ записан', (CAREER.career.mateRe||[]).length===1, JSON.stringify(CAREER.career.mateRe));
    check('ответ шлёт карточку', sent>s0);
    const mp=ccMatePosts().find(x=>x.id==='mate:n7');
    check('ответ виден под постом напарника', mp && (mp.res||[]).some(r=>r.t==='gg mate' && !r.by), JSON.stringify(mp && mp.res));
    check('ответ в проводе', ccMateReWire().some(r=>r.id==='n7' && r.t==='gg mate'));
    // Он вписал мой ответ и прислал обратно — не задваивается.
    peerPosts=[Object.assign({}, peerPosts[0], {res:[{t:'gg mate', day:'2026-03-10', by:'Wkeyz', k:'x'}, {t:'merci', day:'2026-03-10'}]})];
    const mp2=ccMatePosts().find(x=>x.id==='mate:n7');
    check('мой ответ не задваивается', mp2 && mp2.res.filter(r=>r.t==='gg mate').length===1, JSON.stringify(mp2 && mp2.res));
    check('его ответ под своим постом — его ником', mp2 && mp2.res.some(r=>r.t==='merci' && r.by==='Vinz'));

    // 4) Его ответ под моим постом — вписывается один раз, рисуется его ником.
    peer.reMate=[{id:myPost && myPost.id, t:'nice one', day:'2026-03-10', k:'vinz:1'}];
    check('его ответ вписан', ccMateReMerge()===true && (myPost.res||[]).some(r=>r.t==='nice one' && r.by==='Vinz'));
    ccMateReMerge();
    check('второй приход не задваивает', (myPost.res||[]).filter(r=>r.t==='nice one').length===1);
    check('его ответ его ником', /@vinz/i.test(ccPostComments(myPost, ccPostAuthor(myPost), null)));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccmateposts-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 600000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-mate-posts');
