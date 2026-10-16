// Драфт дня: что сервер принимает. Без сети — только daily.js.
//   node server/tools/check-daily.js
const { normalize, dayOf } = require('../src/daily.js');
const fails=[];
const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const NOW=Date.parse('2026-10-17T12:00:00Z');
const OK={id:'abcdef0123456789abcd', day:'2026-10-17', nick:'Probe', score:412, place:3, field:100, team:['Peterbot','Pollo'], country:'rs'};
let r=normalize(OK, NOW);
check('нормальная строка', r.row && r.row.score===412 && r.row.team==='Peterbot,Pollo', JSON.stringify(r));
check('вчерашний день можно', !!normalize(Object.assign({}, OK, {day:'2026-10-16'}), NOW).row);
check('позавчера нельзя', normalize(Object.assign({}, OK, {day:'2026-10-15'}), NOW).err==='day');
check('завтра нельзя', normalize(Object.assign({}, OK, {day:'2026-10-18'}), NOW).err==='day');
check('место больше лобби — отказ', normalize(Object.assign({}, OK, {place:101}), NOW).err==='num');
check('разметка в нике', normalize(Object.assign({}, OK, {nick:'<b>x'}), NOW).row.nick==='bx');
check('плохой id', normalize(Object.assign({}, OK, {id:'x'}), NOW).err==='id');
check('dayOf', dayOf(NOW)==='2026-10-17');
if(fails.length){ console.log('КРАСНОЕ:\n '+fails.join('\n ')); process.exit(1); }
console.log('daily: всё зелёное');
