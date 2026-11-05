// Отбор FNCS Solos без финала даёт карточку S42: своя строка, без места финала и планки чемпиона.
//   node tools/check-solos-rest.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[];
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const s42=PLAYERS_BASE.filter(c=>c.cardSet==='s42');
const fin=s42.filter(c=>!c._s42Rest), rest=s42.filter(c=>c._s42Rest);
check('отбор есть', rest.length>300, rest.length);
check('финалистов столько же', fin.length>=650 && fin.length<=700, fin.length);
check('у отбора нет финала', rest.every(c=>!c.realGf && !c.gfEvent && c.real.stage==='P'));
const dup=new Set(fin.map(c=>c.region+'|'+c.handle.toLowerCase()));
check('финалист не лежит дважды', rest.every(c=>!dup.has(c.region+'|'+c.handle.toLowerCase())));
const j=rest.find(c=>c.handle==='Jerok3k' && c.region==='BR');
check('Jerok3k: карточка называет хит и место', !!j && /Heat 1/.test(j.event) && j.placement===87, j && j.event+' '+j.placement);
check('Jerok3k: хит 87', !!j && j._ratingParts && j._ratingParts.parts.some(p=>p.label==='heat' && p.rank===87));
check('Jerok3k: рейтинг сезона выше карточки Major 2', !!j && j.rating>=60, j && j.rating);
for(const reg of ['EU','NAC','NAW','BR','ASIA','ME','OCE']){
  const f=fin.filter(c=>c.region===reg).map(c=>c.rating), r=rest.filter(c=>c.region===reg).map(c=>c.rating);
  check(reg+': лучший в регионе финалист', Math.max(...f)>Math.max(...r), Math.max(...f)+' '+Math.max(...r));
}
return {fails, rest:rest.length, jerok:j && j.rating};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'rest-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '150000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-solos-rest: '+res.rest+' карточек отбора, Jerok3k '+res.jerok);
