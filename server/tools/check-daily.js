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
check('сила состава', normalize(Object.assign({}, OK, {power:91}), NOW).row.p100===9100);
check('точная сила с синергией', (r=>r.p100===10025 && r.syn===7)(normalize(Object.assign({}, OK, {power:100.25, syn:7}), NOW).row));
check('сила без поля — 0', r.row.p100===0);
check('порядок: сила важнее очков', require('../src/daily.js').better({p100:9025, score:10, at:1}, {p100:9000, score:900, at:0})<0);
check('сила вне границ — 0', normalize(Object.assign({}, OK, {power:500}), NOW).row.p100===0);
// 19.10: n-word и оскорбления — строка в таблице остаётся, ник «user» и восемь цифр (как у Fortnite после бана);
// обычные ники с похожими кусками — как есть.
for(const n of ['факукси','jebac remika','Atom gei','Gei','kurwa','pidoras','pidr','PIDR228','P1DORAS','nigga','N1GG4','n.i.g.g.e.r','nіgga','faggot','KYS','kill yourself','retard','пидорас','Хуй','hitler1488','spic','coon','fuck you']){
  const row=normalize(Object.assign({}, OK, {nick:n}), NOW).row;
  check('плохой ник «'+n+'» — user и цифры', row && /^user\d{8}$/.test(row.nick), row && row.nick);
}
check('у разных браузеров — разные цифры', normalize(Object.assign({}, OK, {nick:'pidr'}), NOW).row.nick!==normalize(Object.assign({}, OK, {nick:'pidr', id:'zzzzzz0123456789abcd'}), NOW).row.nick);
for(const n of ['факультет','Spidr','rapidraga','louieblanc','Raccoon','Spicy','Knight','Grape','Speedo','Nigel','Shinigami','Hannibal','Scunthorpe','книга','Конь','Cocoon','Ninja','Bugha','Peterbot'])
  check('обычный ник «'+n+'» проходит', !!normalize(Object.assign({}, OK, {nick:n}), NOW).row);
if(fails.length){ console.log('КРАСНОЕ:\n '+fails.join('\n ')); process.exit(1); }
console.log('daily: всё зелёное');
