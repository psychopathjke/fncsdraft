// Рейтинг коуча и его зарплата (его «вот и сделай зп и рейтинг их», 8.10): результаты выше аудитории, цена от рейтинга.
//   node tools/check-career-coach-rating.js


const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
try{
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:{nick:'P', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:82, role:'roleIGL', attrs:ccRookieAttrs(82,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null}, career:{season:1, day:'2026-03-10', division:1, earnings:0, balance:0, reach:500, tokens:[], log:[], news:[]}, partner:null, partners:[]}));
  careerLoad();
  const by=at=>CC_COACHES.find(c=>c.at===at);
  out.notes.top=CC_COACHES.slice().sort((x,y)=>y.rating-x.rating).slice(0,5).map(c=>c.name+' '+c.rating+' $'+c.cost);
  check('у каждого коуча рейтинг 60–95', CC_COACHES.every(c=>c.rating>=60 && c.rating<=95), CC_COACHES.map(c=>c.rating).join(','));
  check('с результатами выше всех без них', Math.min(...CC_COACHES.filter(c=>CC_COACH_RES[c.at]).map(c=>c.rating))>Math.max(...CC_COACHES.filter(c=>!CC_COACH_RES[c.at]).map(c=>c.rating)));
  check('выше рейтинг — дороже и сильнее', by('RazZzero0oFN').cost>by('CoachNassimm').cost && by('RazZzero0oFN').train>by('CoachNassimm').train);
  check('цена в прежних пределах', CC_COACHES.every(c=>c.cost>=CC_COACH_LOW.cost && c.cost<=CC_COACH_TOP.cost));
  check('порядок списка — по рейтингу', ccByHand(CC_COACHES).every((c,i,a)=>!i || a[i-1].rating>=c.rating), ccByHand(CC_COACHES).map(c=>c.rating).join(','));
  // Менеджеры, SMM, маркетинг (его «может и с другими так сделать»): клиенты выше аудитории, условия от рейтинга.
  for(const L0 of [CC_AGENTS, CC_SMM, CC_MARKETING]){ const res=L0.filter(x=>CC_STAFF_RES[x.at]), no=L0.filter(x=>!CC_STAFF_RES[x.at]);
    if(res.length && no.length) check('с клиентами выше без них', Math.min(...res.map(ccStaffRating))>Math.max(...no.map(ccStaffRating)), L0.map(x=>x.at+':'+ccStaffRating(x)).join(' '));
    check('порядок окна по рейтингу', ccByHand(L0).every((x,i,a)=>!i || ccStaffRating(a[i-1])>=ccStaffRating(x))); }
  check('менеджер выше — условия лучше', ccAgentTermsOf(ccByHand(CC_AGENTS)[0]).reach>=ccAgentTermsOf(ccByHand(CC_AGENTS).slice(-1)[0]).reach && ccSmmTermsOf(ccByHand(CC_SMM)[0]).boost>ccSmmTermsOf(ccByHand(CC_SMM).slice(-1)[0]).boost);
  check('не из списка — обычные условия', ccRankPull(CC_AGENTS, {at:'nobody_here'})===null);
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coachrate-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK рейтинг коучей ' + JSON.stringify(out.notes));
