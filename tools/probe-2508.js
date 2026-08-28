// Three measurements for the 25.08 reports:
//   1) how the strength spreads over the three Heats
//   2) the third seat's rating beside the strongest recorded pairs
//   3) squads across the stages of the Summit
//   node tools/probe-2508.js
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
    const mk=(size, day, ovr)=>{ CAREER={player:{nick:'Ilyusha', ovr:ovr||93, ovrExact:ovr||93,
        region:'EU', role:'roleIGL', country:'ru', age:20, attrs:ccRookieAttrs(ovr||93,'roleIGL')},
      career:{season:1, day:day, division:1, earnings:0, balance:0, tokens:[],
        log:[], news:[], form:0, grind:0, size:size, sizes:{1:size}, seasonOver:false, trios:{}},
      dms:[], partners:[], gear:{own:[], train:0}}; };
    const ovrOf=c=>Math.round(attrsFor(c).ovr);
    const teamOvr=t=>Math.round(t.squad.reduce((s,c)=>s+attrsFor(c).ovr,0)/t.squad.length);
    const real=c=>!(c && c.tier==='ladder');

    // ---- 1. the heats -----------------------------------------------------
    [2,3].forEach(function(sz){
      mk(sz,'2026-07-24');
      const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
      const cr=Object.assign({}, CAREER.career, {division:1});
      const you=careerYouTeam(mine); you.isYou=true;
      const st=ccScaleStage(CC_MAJOR_STAGE.heats);
      const pool=careerCupField(cr, mine, st.field*ccMajorHeats(), null, false, CC_FIELD_SHARP.heats);
      const seeded=[you].concat(pool).sort((a,b)=>(b.pow||0)-(a.pow||0));
      const heats=seedHeats(seeded, ccMajorHeats());
      const byOvr=seeded.slice().sort((a,b)=>teamOvr(b)-teamOvr(a));
      const top20=new Set(byOvr.slice(0,20));
      out.notes['heats_size'+sz]={
        powDefined:seeded.filter(t=>t.pow!=null).length+'/'+seeded.length,
        sizes:heats.map(h=>h.length),
        meanOvr:heats.map(h=>Math.round(h.reduce((s,t)=>s+teamOvr(t),0)/h.length*10)/10),
        top20per:heats.map(h=>h.filter(t=>top20.has(t)).length),
        realPer:heats.map(h=>h.filter(t=>t.squad.every(real)).length),
        yourHeat:heats.findIndex(h=>h.indexOf(you)>=0)+1,
        top5names:byOvr.slice(0,5).map(t=>String(t.name).replace(/<[^>]*>/g,'')+' '+teamOvr(t)+
          ' heat'+(heats.findIndex(h=>h.indexOf(t)>=0)+1))};
    });

    // ---- 2. the third seat ------------------------------------------------
    mk(3,'2026-08-01');
    (function(){
      const me=careerCard(), mine=[me].concat(careerMates().filter(Boolean));
      const cr=Object.assign({}, CAREER.career, {division:1});
      const rows=[];
      [['final', ccTeams(50), CC_FIELD_SHARP.final],
       ['heats', ccTeams(50)*3, CC_FIELD_SHARP.heats],
       ['cup', ccCupField(1), 0]].forEach(function(cfg){
        CAREER.career.trios={};
        const f=careerCupField(cr, mine, cfg[1], cfg[0], false, cfg[2]);
        const teams=f.map(t=>{ const o=t.squad.map(ovrOf).slice().sort((a,b)=>b-a);
          return {name:String(t.name).replace(/<[^>]*>/g,''), ovrs:t.squad.map(ovrOf),
            core:Math.round((o[0]+o[1])/2), low:o[o.length-1], real:t.squad.every(real)}; });
        teams.sort((a,b)=>b.core-a.core);
        const top=teams.slice(0,12);
        rows.push({stage:cfg[0], teams:f.length,
          worstGapTop12:Math.max.apply(null, top.map(t=>t.core-t.low)),
          top8:top.slice(0,8).map(t=>t.name+' ['+t.ovrs.join('/')+'] gap '+(t.core-t.low)),
          gapMean:Math.round(teams.reduce((s,t)=>s+(t.core-t.low),0)/teams.length*10)/10,
          under80WithStrongCore:teams.filter(t=>t.core>=88 && t.low<80).length});
      });
      out.notes.third=rows;
    })();

    // ---- 3. the Summit, stage by stage ------------------------------------
    [2,3].forEach(function(sz){
      mk(sz,'2026-05-29');
      const me=careerCard(), mates=careerMates().filter(Boolean);
      const drafted=[me].concat(mates);
      const you=careerYouTeam(drafted); you.isYou=true;
      const grab=(stage, day)=>{ CAREER.career.day=day;
        return careerSummitField(stage, you, drafted); };
      const squads=f=>{ const m=new Map();
        f.forEach(t=>{ const h=t.squad.map(c=>String(c.handle||'').toLowerCase());
          h.forEach(x=>m.set(x, h.slice().sort().join('+'))); });
        return m; };
      const up=squads(grab('upper','2026-05-29')), lo=squads(grab('lower','2026-05-30')),
            fi=squads(grab('final','2026-05-31'));
      let seen=0, same=0, ex=[];
      fi.forEach((v,k)=>{ const b=up.get(k)||lo.get(k); if(!b) return; seen++;
        if(v===b) same++; else if(ex.length<6) ex.push(k+': '+b+' -> '+v); });
      out.notes['summit_size'+sz]={playersInBoth:seen, sameSquad:same,
        share:seen?Math.round(same/seen*100)+'%':'-', examples:ex};
    });
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc2508-'));
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
