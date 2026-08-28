// What the region roster knows about who played with whom.
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={notes:{}, err:null};
  try{
    CAREER={player:{nick:'Ilyusha', ovr:93, ovrExact:93, region:'EU', role:'roleIGL',
        country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:1, day:'2026-08-01', division:1, earnings:0, balance:0, tokens:[],
        log:[], news:[], form:0, grind:0, size:2, sizes:{1:2}, seasonOver:false, trios:{}},
      dms:[], partners:[], gear:{own:[], train:0}};
    ['EU','NAC','ASIA'].forEach(function(reg){
      const r=ccArcRoster(reg);
      const byKey=new Map(); r.forEach(c=>byKey.set(hKey(c), c));
      let withP=0, mutual=0, inReg=0;
      r.forEach(c=>{ if(!c.partner) return; withP++;
        const m=byKey.get(hKey(c.partner)); if(!m) return; inReg++;
        if(m.partner && hKey(m.partner)===hKey(c)) mutual++; });
      out.notes['roster_'+reg]={cards:r.length, withPartner:withP, partnerInRoster:inReg, mutual:mutual};
    });
    // and how the career's own pool pairs the same people
    const pool=careerPools();
    out.notes.pool={duos:pool.duos.length, players:(pool.players||[]).length};
    const eu=ccArcRoster('EU'); const byKey=new Map(); eu.forEach(c=>byKey.set(hKey(c), c));
    let same=0, diff=0, ex=[];
    pool.duos.slice(0,60).forEach(d=>{
      const a=d.cards[0], b=d.cards[1];
      const ra=byKey.get(hKey(a));
      if(ra && ra.partner && hKey(ra.partner)===hKey(b)) same++;
      else { diff++; if(ex.length<6) ex.push(a.handle+'+'+b.handle+' roster says '+((ra&&ra.partner&&ra.partner.handle)||'-')); }
    });
    out.notes.poolVsRoster={same:same, diff:diff, examples:ex};
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccpair-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, src+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///'+tmp.split(String.fromCharCode(92)).join('/')],{maxBuffer:512*1024*1024,encoding:'utf8'});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/);
if(!m){ console.error('probe did not run; copy at '+tmp); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes,null,1));
fs.rmSync(dir,{recursive:true,force:true});
