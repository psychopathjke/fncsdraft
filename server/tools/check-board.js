// Таблица карьер: что сервер принимает, что выбрасывает, как считает место.
//
// Ни сети, ни Chrome — только board.js. Живой путь через воркер — в
// check-board-live.js (wrangler dev).
//
//   node server/tools/check-board.js
const { createBoard, normalize, MIN_GAP_MS } = require('../src/board.js');
const fails=[];
const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const B=createBoard();
const OK={id:'abcdef0123456789abcd', nick:'Probe', region:'EU', country:'de', seasons:1,
          earn:12500, ovr:88, div:2, titles:1, year:2026, best:'3/150', bestEv:'Duo Cup'};

let r=B.accept(OK, null, 1000);
check('нормальная строка принимается', r.row && r.row.nick==='Probe' && r.row.earn===12500, JSON.stringify(r));
check('и метка времени сервера', r.row && r.row.at===1000);
check('разметка из ника вырезается', normalize(Object.assign({}, OK, {nick:'<img src=x onerror=alert(1)>'}), 0).row.nick.indexOf('<')<0);
check('ник режется до 24', normalize(Object.assign({}, OK, {nick:'x'.repeat(80)}), 0).row.nick.length===24);
check('пустой ник — отказ', normalize(Object.assign({}, OK, {nick:'   '}), 0).err==='nick');
check('плохой id — отказ', normalize(Object.assign({}, OK, {id:'../../etc'}), 0).err==='id');
check('чужой регион — отказ', normalize(Object.assign({}, OK, {region:'MARS'}), 0).err==='region');
check('заработок больше, чем бывает за сезоны, — отказ',
      normalize(Object.assign({}, OK, {earn:7000000, seasons:1}), 0).err==='earn');
check('а за два сезона — можно', !!normalize(Object.assign({}, OK, {earn:7000000, seasons:2}), 0).row);
check('отрицательный заработок — отказ', normalize(Object.assign({}, OK, {earn:-5}), 0).err==='earn');
check('кривой лучший результат обнуляется', normalize(Object.assign({}, OK, {best:'9/3'}), 0).row.best==='');
check('страна не из двух букв — пустая', normalize(Object.assign({}, OK, {country:'<b>'}), 0).row.country==='');

const prev=r.row;
check('повтор раньше минуты пропускается', B.accept(OK, prev, 1000+MIN_GAP_MS-1).skip==='gap');
check('через минуту — принимается', !!B.accept(OK, prev, 1000+MIN_GAP_MS).row);

const rows=[
  {id:'a'.repeat(16), region:'EU',  earn:500, at:1},
  {id:'b'.repeat(16), region:'NAC', earn:900, at:2},
  {id:'c'.repeat(16), region:'EU',  earn:900, at:3},
  {id:'d'.repeat(16), region:'EU',  earn:100, at:4}];
const top=B.top(rows, null);
check('верх по заработку, при равенстве — кто раньше', top.map(x=>x.id[0]).join('')==='bcad', top.map(x=>x.id[0]).join(''));
check('фильтр региона', B.top(rows, 'EU').map(x=>x.id[0]).join('')==='cad');
check('место своей карьеры', B.rankOf(rows, 'a'.repeat(16), null).rank===3);
check('место в регионе', B.rankOf(rows, 'a'.repeat(16), 'EU').rank===2);
check('чужой регион — места нет', B.rankOf(rows, 'a'.repeat(16), 'NAC')===null);

if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
console.log('таблица карьер: санитария, частота и места — как задумано');
