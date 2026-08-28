// Do the squads in a Major stay the same squads from one stage to the next?
//   node tools/probe-major-squads.js
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
    const mk=(size)=>{ CAREER={player:{nick:'Ilyusha', ovr:93, ovrExact:93, region:'EU',
        role:'roleIGL', country:'ru', age:20, attrs:ccRookieAttrs(93,'roleIGL')},
      career:{season:1, day:'2026-07-24', division:1, earnings:0, balance:0, tokens:[],
        log:[], news:[], form:0, grind:0, size:size, sizes:{1:size}, seasonOver:false, trios:{}},
      dms:[], partners:[], gear:{own:[], train:0}}; };
    const mates=(t)=>t.squad.map(c=>String(c.handle||'').toLowerCase());
    // pairs of team-mates in a field, as a set of "a|b"
    const pairsOf=(teams)=>{ const s=new Map();
      teams.forEach(t=>{ const h=mates(t);
        for(let i=0;i<h.length;i++) for(let j=i+1;j<h.length;j++){
          const k=[h[i],h[j]].sort().join('|'); s.set(k,(s.get(k)||0)+1); } });
      return s; };
    const who=(teams)=>{ const m=new Map(); teams.forEach(t=>mates(t).forEach(h=>m.set(h,mates(t)))); return m; };
    const field=(day, size, sharp)=>{
      CAREER.career.day=day;
      const cr=Object.assign({}, CAREER.career, {division:1});
      const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
      return careerCupField(cr, mine, size, null, false, sharp);
    };
    [2,3].forEach(function(sz){
      mk(sz);
      // Major 2: heats 24-26 July (three heats of 50), final 1 August (50)
      const heats=field('2026-07-24', ccTeams(50)*3, CC_FIELD_SHARP.heats);
      const fin  =field('2026-08-01', ccTeams(50),   CC_FIELD_SHARP.final);
      const ph=pairsOf(heats), pf=pairsOf(fin);
      const wh=who(heats);
      let both=0, kept=0, broken=[];
      pf.forEach((_v,k)=>{ if(ph.has(k)) kept++; });
      // for every player in the final who also played the heats: same mates?
      const wf=who(fin); let seen=0, same=0;
      wf.forEach((m,h)=>{ const old=wh.get(h); if(!old) return; seen++;
        const a=m.filter(x=>x!==h).sort().join('+'), b=old.filter(x=>x!==h).sort().join('+');
        if(a===b) same++; else if(broken.length<8) broken.push(h+': heats '+b+' -> final '+a); });
      out.notes['size'+sz]={heatTeams:heats.length, finalTeams:fin.length,
        finalPairs:pf.size, pairsAlsoInHeats:kept,
        playersInBoth:seen, sameSquad:same,
        share:seen?Math.round(same/seen*100)+'%':'-', examples:broken};
    });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsq-'));
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
