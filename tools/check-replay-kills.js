// Шапка карты: место, свои киллы этой игры, живые. Его игрок 10.09: «kills you get in that game».
const fs=require('fs'), os=require('os'), path=require('path');
const { execFileSync }=require('child_process');
const ROOT=path.resolve(__dirname, '..');
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',(process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p && fs.existsSync(p));
const FIELD=fs.readFileSync(path.join(__dirname,'check-replay-pace.js'),'utf8')
  .match(/const FIELD = `([\s\S]*?)`;/)[1];
const PAGE=`<!doctype html><meta charset="utf-8">
<body style="margin:0;background:#0b0e18">
<style>:root{--accent:#3f62ca;--lb-line:#2a3350}</style>
<div id="box" style="width:900px"></div><pre id="out"></pre>
<script src="zone-sim.js"><\/script>
<script src="zone-replay.js"><\/script>
<script>
${FIELD}
(function(){
  var out={};
  try{
    var game=record(17);
    var handle=ZoneReplay.mount(document.getElementById('box'), '', '1100 / 970', 970/1100);
    var opts={labels:{zone:'ZONE'}, roster:game.roster};
    var me=-1; for(var i=0;i<game.roster.length;i++) if(game.roster[i] && game.roster[i].you) me=i;
    var f=null;
    for(var k=0;k<game.timeline.length;k++){
      var fr=game.timeline[k];
      if(me>=0 && fr.dots[me] && fr.dots[me].alive && (fr.dots[me].e||0)>0){ f=fr; break; }
    }
    if(!f) f=game.timeline[Math.floor(game.timeline.length/2)];
    if(me>=0 && f.dots[me]) f.dots[me].e=Math.max(3, f.dots[me].e||0);
    ZoneReplay.show(handle, f, opts);
    out.head=handle.head.textContent.replace(/\\s+/g,' ').trim();
    out.chip=handle.head.innerHTML.indexOf('data-kills=') >= 0;
    out.kills=me>=0 && f.dots[me] ? f.dots[me].e : null;
    out.html=handle.head.innerHTML.replace(/\\s+/g,' ').slice(0, 400);
    /* И СВОИ КИЛЛЫ ОТДЕЛЬНО ОТ КОМАНДНЫХ — идея его подписчика 11.09. Веса кладёт на
       роастер ccRosterYouSplit; здесь они ставятся руками, чтобы проверить саму раскладку. */
    game.roster.youKills={seat:0, w:[80, 40]};
    if(me>=0 && f.dots[me]) f.dots[me].e=6;
    ZoneReplay.show(handle, f, opts);
    var mm=handle.head.innerHTML.match(/data-kills="([0-9]+)" data-you="([0-9]+)"/);
    out.pair=mm ? {team:+mm[1], you:+mm[2]} : null;
    game.roster.youKills={seat:1, w:[80, 40]};
    ZoneReplay.show(handle, f, opts);
    var m2=handle.head.innerHTML.match(/data-you="([0-9]+)"/);
    out.mate=m2 ? +m2[1] : null;
    game.roster.youKills={seat:0, w:[80, 40]};
    var seq=[];
    for(var t=0;t<=8;t++){ if(me>=0 && f.dots[me]) f.dots[me].e=t; ZoneReplay.show(handle, f, opts);
      var mt=handle.head.innerHTML.match(/data-you="([0-9]+)"/); seq.push(mt ? +mt[1] : -1); }
    out.seq=seq;
  }catch(e){ out.err=String(e && e.stack || e).slice(0,300); }
  document.getElementById('out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kills-'));
fs.writeFileSync(path.join(dir,'i.html'), PAGE);
for(const f of ['zone-sim.js','zone-replay.js']) fs.copyFileSync(path.join(ROOT,f), path.join(dir,f));
const url='file:///'+path.join(dir,'i.html').split(path.sep).join('/');
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=30000','--dump-dom', url],
  {maxBuffer:128*1024*1024, encoding:'utf8'});
const m=dom.match(/BEGIN([^<]*)END/);
if(!m){ console.error('no probe'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('FAILED: ' + out.err); process.exit(1); }
console.log('  шапка: ' + out.head);
if(!out.chip) { console.error('FAILED: в шапке нет счётчика своих киллов'); process.exit(1); }
if(!(out.kills>0) || out.head.indexOf('#')<0) { console.error('FAILED: киллы или место не нарисованы: ' + JSON.stringify(out.kills)); process.exit(1); }
console.log('  свои/командные: ' + JSON.stringify(out.pair) + ', второе кресло ' + out.mate + ', рост ' + (out.seq||[]).join(','));
if(!out.pair || !(out.pair.you>0) || out.pair.team!==6) { console.error('FAILED: пара «свои/командные» не нарисована: ' + JSON.stringify(out.pair)); process.exit(1); }
if(out.pair.you + out.mate !== out.pair.team) { console.error('FAILED: доли не складываются в счёт отряда: ' + out.pair.you + '+' + out.mate + ' vs ' + out.pair.team); process.exit(1); }
if(!(out.pair.you > out.mate)) { console.error('FAILED: более меткий взял не больше: ' + out.pair.you + ' vs ' + out.mate); process.exit(1); }
for(let i=1;i<(out.seq||[]).length;i++) if(out.seq[i] < out.seq[i-1]) { console.error('FAILED: свой счёт упал на росте отрядного: ' + out.seq.join(',')); process.exit(1); }
console.log('the map head shows your kills in this game, beside your place');
fs.rmSync(dir, {recursive:true, force:true});
