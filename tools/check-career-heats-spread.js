// Сильные команды разложены по трём хитам, и на экране написано, который твой.
//
// Его игрок, 24 августа: «в первом хите, где играет человек, всегда все сильные
// и известные команды» — поле хитов бралось одним броском на пятьдесят, и весь
// верх Европы садился в единственную показываемую комнату. Починено змейкой
// (seedHeats на поле в три хита). 25 августа он написал то же самое ещё раз:
// «всё равно в одном хите все самые сильные команды, нету распределения».
//
// Поэтому здесь измерение, а не мнение: сколько из двадцати сильнейших команд
// поля лежит в каждом хите, на восьми разных полях. Контроль — то же поле без
// змейки: там в первой комнате их и правда все двадцать.
//
//   node tools/check-career-heats-spread.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    const TOP=20;
    const ovr=t=>t.squad.reduce((s,c)=>s+attrsFor(c).ovr,0)/t.squad.length;
    const run=(size, tag)=>{
      CAREER={player:{nick:'Ilyusha'+tag, ovr:93, ovrExact:93, region:'EU', role:'roleIGL',
          country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
        career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0, tokens:[],
          log:[], news:[], form:0, grind:0, size:size, sizes:{1:size}, seasonOver:false,
          trios:{}, seed:('h'+tag)},
        dms:[], partners:[], gear:{own:[], train:0}};
      const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
      const you=careerYouTeam(mine); you.isYou=true;
      const st=ccScaleStage(CC_MAJOR_STAGE.heats);
      const pool=careerCupField(Object.assign({}, CAREER.career, {division:1}), mine,
                                st.field*ccMajorHeats(), 'sp'+tag, false, CC_FIELD_SHARP.heats);
      const seeded=[you].concat(pool).sort((a,b)=>(b.pow||0)-(a.pow||0));
      const top=new Set(seeded.slice().sort((a,b)=>ovr(b)-ovr(a)).slice(0, TOP));
      const heats=seedHeats(seeded, ccMajorHeats());
      return {per:heats.map(h=>h.filter(t=>top.has(t)).length),
              yours:heats.findIndex(h=>h.indexOf(you)>=0)+1,
              // контроль: та же комната, взятая подряд, без змейки
              flat:seeded.slice(0, st.field).filter(t=>top.has(t)).length};
    };
    const rows=[];
    for(let i=0;i<4;i++) rows.push(run(2, 'd'+i));
    for(let i=0;i<4;i++) rows.push(run(3, 't'+i));
    out.notes.perHeat=rows.map(r=>r.per.join('/')+' (твой '+r.yours+', без змейки '+r.flat+')');
    const worst=Math.max.apply(null, rows.map(r=>Math.max.apply(null, r.per)));
    out.notes.worstHeat=worst;
    check('ни один хит не забирает больше половины сильнейших', worst<=Math.ceil(TOP/2),
          'в одной комнате '+worst+' из '+TOP);
    const yours=rows.map(r=>r.per[r.yours-1]);
    out.notes.inYours=yours;
    check('и в твоей комнате их примерно треть',
          Math.max.apply(null, yours)<=Math.ceil(TOP/2),
          'в твоей комнате до '+Math.max.apply(null, yours)+' из '+TOP);
    // Контроль: без змейки комната действительно была бы забита верхом.
    const flat=Math.min.apply(null, rows.map(r=>r.flat));
    out.notes.flatWorst=flat;
    check('контроль: без змейки верх поля садится в одну комнату', flat>=TOP-2,
          'без змейки в первой комнате всего '+flat+' из '+TOP);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccheat-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=180000', '--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('верх поля разложен по трём хитам');
fs.rmSync(dir, { recursive: true, force: true });
