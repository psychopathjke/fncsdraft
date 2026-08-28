// Почему выдуманные не попадают в книгу роста — по шагам, а не на глаз.
//
// Запрет `if(c.tier==='ladder') return` в careerGrowField сняли — и в книге
// всё равно оказался ноль выдуманных. Здесь разбирается, где именно они
// теряются: есть ли они в поле вообще, каким tier помечены, и что делает с
// ними сам careerGrowField, если позвать его руками.
//
//   node tools/ladder-grow-diag.js [дивизион]

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const DIV = +(process.argv[2] || 4);
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={err:null, notes:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Diag', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:70, role:'roleIGL',
        attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:${DIV}, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world'},
      partners:[]}));
    careerLoad();
    const cr=CAREER.career, me=careerCard();
    const you=careerYouTeam([me]); you.isYou=true;
    const field=[you, ...careerCupField(cr, [me], careerCupSize(${DIV}), null)];
    out.notes.командВПоле=field.length;

    const cards=[];
    field.forEach(t=>(t.squad||[]).forEach(c=>{ if(c) cards.push(c); }));
    const tiers={};
    cards.forEach(c=>{ const t=String(c.tier||'—'); tiers[t]=(tiers[t]||0)+1; });
    out.notes.людейВПоле=cards.length;
    out.notes.поTier=tiers;
    out.notes.безНика=cards.filter(c=>!c.handle).length;
    const ovrOf=c=>{ const a=attrsFor(c)||{}; return (c._ovr!=null?c._ovr:a.ovr)||0; };
    out.notes.сНулевымОвр=cards.filter(c=>!(ovrOf(c)>0)).length;

    // Очки, чтобы вечер был настоящим, и зовём книгу руками.
    field.forEach((t,i)=>{ t.stagePts=1000-i; t.wins=0; t.stageElims=0; });
    CAREER.dev=CAREER.dev||{};
    const before=Object.keys(CAREER.dev).length;
    const moved=careerGrowField(field, you);
    const after=Object.keys(CAREER.dev);
    const real=new Set(); PLAYERS.forEach(p=>{ if(p.handle) real.add(hKey(p)); });
    out.notes.careerGrowFieldВернул=moved;
    out.notes.былоВКниге=before;
    out.notes.сталоВКниге=after.length;
    out.notes.изНихВыдуманных=after.filter(k=>!real.has(k)).length;
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'laddiag-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
