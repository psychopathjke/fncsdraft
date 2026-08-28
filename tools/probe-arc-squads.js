// Do the squads in the history tables match each other, and the lobbies played?
//   node tools/probe-arc-squads.js
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'
].find(p=>p&&fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={notes:{}, err:null};
  try{
    CAREER={player:{nick:'Ilyusha', ovr:93, ovrExact:93, region:'EU', role:'roleIGL',
        country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:1, day:'2026-08-20', division:1, earnings:0, balance:0, tokens:[],
        log:[], news:[], form:0, grind:0, size:2, sizes:{1:2}, seasonOver:false, trios:{}},
      dms:[], partners:[], gear:{own:[], train:0}};
    const mateMap=rows=>{ const m=new Map();
      rows.forEach(r=>{ const h=String(r.name).split(/\s*&\s*/).map(s=>s.trim().toLowerCase());
        h.forEach(x=>m.set(x, h.slice().sort().join('+'))); });
      return m; };
    const cmp=(a,b)=>{ let seen=0, same=0, ex=[];
      b.forEach((v,k)=>{ const o=a.get(k); if(!o) return; seen++;
        if(o===v) same++; else if(ex.length<6) ex.push(k+': '+o+' | '+v); });
      return {seen:seen, same:same, share:seen?Math.round(same/seen*100)+'%':'-', examples:ex}; };
    const t1=careerArchiveFinal(1,'m|1|EU'), t2=careerArchiveFinal(1,'g|summit'),
          t3=careerArchiveFinal(1,'m|2|EU');
    out.notes.tables={m1:t1?t1.rows.length:null, summit:t2?t2.rows.length:null, m2:t3?t3.rows.length:null};
    if(t1&&t3) out.notes.major1_vs_major2=cmp(mateMap(t1.rows), mateMap(t3.rows));
    if(t1&&t2) out.notes.major1_vs_summit=cmp(mateMap(t1.rows), mateMap(t2.rows.filter(r=>r.reg==='EU')));
    // and against the room the career actually played
    const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
    CAREER.career.day='2026-08-01';
    const live=careerCupField(Object.assign({}, CAREER.career, {division:1}), mine,
                              ccTeams(50), null, false, CC_FIELD_SHARP.final);
    const lm=new Map();
    live.forEach(t=>{ const h=t.squad.map(c=>String(c.handle||'').toLowerCase());
      h.forEach(x=>lm.set(x, h.slice().sort().join('+'))); });
    if(t3) out.notes.live_vs_major2=cmp(lm, mateMap(t3.rows));
    // trio season: the room is played first, then the history is opened
    CAREER.career.size=3; CAREER.career.sizes={1:3}; CAREER.career.trios={};
    CH_ARC_TBL={};
    const me3=careerCard(), mine3=[me3].concat(careerMates().filter(Boolean));
    // the season's own rooms, in the order a career plays them
    CAREER.career.day='2026-04-25';
    careerCupField(Object.assign({}, CAREER.career, {division:1}), mine3,
                   ccTeams(50), null, false, CC_FIELD_SHARP.final);
    CAREER.career.day='2026-08-01';
    const live3=careerCupField(Object.assign({}, CAREER.career, {division:1}), mine3,
                               ccTeams(50), null, false, CC_FIELD_SHARP.final);
    const lm3=new Map();
    live3.forEach(t=>{ const h=t.squad.map(c=>String(c.handle||'').toLowerCase());
      h.forEach(x=>lm3.set(x, h.slice().sort().join('+'))); });
    const s1=careerArchiveFinal(1,'m|1|EU'), s2=careerArchiveFinal(1,'m|2|EU'),
          s3=careerArchiveFinal(1,'g|summit');
    out.notes.trioSummitTable=s3?{rows:s3.rows.length}:null;
    if(s1&&s2) out.notes.trio_major1_vs_major2=cmp(mateMap(s1.rows), mateMap(s2.rows));
    if(s2) out.notes.trio_live_vs_major2=cmp(lm3, mateMap(s2.rows));
    if(s3) out.notes.trio_live_vs_summit=cmp(lm3, mateMap(s3.rows.filter(r=>r.reg==='EU')));
    const memo=CAREER.career.trios||{};
    out.notes.memo={size:Object.keys(memo).length,
      charyyKami:memo['charyy+kami']||memo['kami+charyy']||null,
      sample:Object.keys(memo).slice(0,5).map(k=>k+' -> '+memo[k])};
    // is one table at least stable when built twice?
    CH_ARC_TBL={};
    const again=careerArchiveFinal(1,'m|2|EU');
    out.notes.rebuildSame=again?cmp(mateMap(s2.rows), mateMap(again.rows)).share:null;

  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccarcsq-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, src+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=180000','--dump-dom',
  'file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:512*1024*1024,encoding:'utf8'});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/);
if(!m){ console.error('probe did not run; copy at '+tmp); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes,null,1));
fs.rmSync(dir,{recursive:true,force:true});
