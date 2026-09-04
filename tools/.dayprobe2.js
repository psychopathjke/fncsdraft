const fs=require('fs'),os=require('os'),path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname,'..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
 (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
const BOOT=`
<pre id="__o" style="display:none"></pre>
<script>
(function(){
  var o={};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
      player:{nick:'Lockstep',age:20,source:'rookie',country:'de',countryPing:15,
        closeRangeEdge:6,region:'EU',ovr:45,role:'roleIGL',attrs:null,ageEdge:4,
        photo:null,handle:null,cardRegion:null,nat:null},
      career:{season:1,day:'2026-02-02',division:1,earnings:0,balance:0,reach:0,
        tokens:[],log:[],news:[]},partner:null}));
    var s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(45,'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    o.before=careerDms().map(function(d){return d.state+'/'+(d.who&&(d.who.handle||d.who.name))+'/'+(d.who&&d.who.org?'org':'')+(d.who&&d.who.brand?'brand':'');});
    if(!careerPartnerCard() && typeof careerSeatTopUp==='function') careerSeatTopUp();
    o.after=careerDms().map(function(d){return d.state+'/'+(d.who&&(d.who.handle||d.who.name))+'/'+(d.who&&d.who.org?'org':'')+(d.who&&d.who.brand?'brand':'');});
    var dm=careerDms().find(function(x){return x.state==='offer'&&!x.who.org&&!x.who.brand;});
    if(dm){ careerDmAccept(dm.id); careerRenderHub('centre'); }
    o.mate=(careerPartnerCard()||{}).handle||null;
    o.size=typeof careerSquadSize==='function'?careerSquadSize():null;
  }catch(e){ o.err=String(e&&e.stack||e); }
  document.getElementById('__o').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(o))+'PE'+'ND';
})();
<\u002fscript>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dp2-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT.split(path.sep).join('/')+'/">'+
  fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox',
 '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
 'file:///'+tmp.split(path.sep).join('/')],{maxBuffer:512*1024*1024,encoding:'utf8',stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/);
console.log(m?JSON.stringify(JSON.parse(decodeURIComponent(m[1])),null,1):'нет вывода');
