// Sweeps the 2025 pack curve and reports what each setting deals in Europe and
// NA Central, next to what the two 2026 sets deal on their own curve. The target
// is "2025 reads like 2026", not a number picked by taste.
const fs=require('fs'), os=require('os'), path=require('path');
const { execFileSync } = require('child_process');
const ROOT='C:/Users/FoxOS_User/Desktop/fncsdraftmajor';
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));

const BOOT=`
<pre id="__p" style="display:none"></pre>
<script>
(function(){
  var out={};
  var TRIALS=3000;
  function measure(set, size, reg){
    CARD_SET=set; CARD_MODE=true; squadSize=size; drafted=[];
    var roster=cardRosterPlayers(set).filter(function(p){ return p.region===reg; });
    pool=roster;
    var hits=0, multi=0, allE=0, best=0;
    for(var i=0;i<TRIALS;i++){
      drafted=[];
      var pack=generatePack(), top=0, myth=0, elite=0;
      pack.forEach(function(p){ var v=attrsFor(p).ovr; top=Math.max(top,v); if(v>=95)myth++; if(v>=90)elite++; });
      if(top>=95) hits++;
      if(myth>=2) multi++;
      if(pack.length && elite===pack.length) allE++;
      best+=top;
    }
    return {one:Math.round(1000*hits/TRIALS)/10, two:Math.round(1000*multi/TRIALS)/10,
            all:Math.round(1000*allE/TRIALS)/10, best:Math.round(10*best/TRIALS)/10};
  }
  out['2026 m1'] = {EU: measure('m1',2,'EU'), NAC: measure('m1',2,'NAC')};
  out['2026 m2'] = {EU: measure('m2',2,'EU'), NAC: measure('m2',2,'NAC')};
  [[2,35],[3,40],[3,45],[4,45],[5,45]].forEach(function(c){
    PACK_WEIGHTS.t1={exp:c[0],floor:c[1]};
    PACK_WEIGHTS.t2=PACK_WEIGHTS.t1; PACK_WEIGHTS.t3=PACK_WEIGHTS.t1;
    out['2025 exp'+c[0]+' floor'+c[1]] = {EU: measure('t3',3,'EU'), NAC: measure('t3',3,'NAC')};
  });
  document.getElementById('__p').textContent='BEGINP'+encodeURIComponent(JSON.stringify(out))+'ENDP';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sweep-'));
const f=path.join(dir,'i.html');
fs.writeFileSync(f, fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
  '--virtual-time-budget=240000','--dump-dom','file:///'+f.replace(/\\/g,'/')],{maxBuffer:512*1024*1024,encoding:'utf8'});
const m=dom.match(/BEGINP((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])+)ENDP/);
if(!m){ console.error('probe did not run'); process.exit(1); }
const r=JSON.parse(decodeURIComponent(m[1]));
console.log('setting'.padEnd(22)+'  region  1+myth  2+myth  all90+  best');
Object.keys(r).forEach(k=>{
  ['EU','NAC'].forEach(reg=>{
    const v=r[k][reg];
    console.log(k.padEnd(22)+'  '+reg.padEnd(6)+'  '+(v.one+'%').padStart(6)+'  '+(v.two+'%').padStart(6)+
                '  '+(v.all+'%').padStart(6)+'  '+v.best);
  });
});
