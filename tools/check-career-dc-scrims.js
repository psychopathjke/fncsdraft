// Скримы в Discord карьеры хостят админы: запись на блок, чек-ин, метка на общей карте дропов, первая игра по меткам.
//   node tools/check-career-dc-scrims.js
const {execFileSync}=require('child_process'), path=require('path');
const raw=execFileSync('node', [path.join(__dirname,'probe-run.js'), path.join(__dirname,'probes','dc-scrims.js'), '400000'], {encoding:'utf8', maxBuffer:1<<26, stdio:['ignore','pipe','ignore']});
const r=JSON.parse(raw), fails=[];
const ok=(n,c,d)=>{ if(!c) fails.push(n+(d!==undefined?': '+JSON.stringify(d):'')); };
ok('без ошибок', !r.err, r.err);
ok('объявление админа', r.hasAdmin);
ok('своей кнопки скримов больше нет', r.noOldBtn);
ok('без метки играть нельзя', r.playDisabledBeforeMark);
ok('на карте стоят чужие метки', r.taken>0, r.taken);
ok('своя метка встала', r.me===1 && r.spot!=null, [r.me, r.spot]);
ok('после метки играть можно', r.playEnabled);
ok('блок сыгран', r.res && r.res.of>0, r.res);
ok('первая игра по меткам канала', r.matched===(r.res&&r.res.of), [r.matched, r.res&&r.res.of]);
ok('цена — занятие скрим', r.energySpent===40, r.energySpent);
if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
console.log('скримы от админов: запись, чек-ин, метка с остальными, '+r.matched+'/'+r.res.of+' по меткам');
