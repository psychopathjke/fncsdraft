// Облачные сохранения: разбор запроса и нарезка на куски (src/vault.js) — без сети.
//   node server/tools/check-vault.js
import { checkReq, parts, PART, MAX_ONE } from '../src/vault.js';
let fails=0;
const ok=(name, cond, d)=>{ if(!cond){ fails++; console.log('FAIL '+name+(d ? ': '+d : '')); } };
const code='K7QM2XPA9RTDWH4C';
ok('list с хорошим кодом', checkReq({code, op:'list'}).op==='list');
ok('код с путаными буквами (O, I, 0, 1) — нет', checkReq({code:'K7QM2XPA9RTDWH4O', op:'list'}).err==='code');
ok('короткий код — нет', checkReq({code:'K7QM', op:'list'}).err==='code');
ok('неизвестная операция — нет', checkReq({code, op:'drop'}).err==='op');
ok('ключ карьеры — да', checkReq({code, op:'get', key:'fncsdraft_career'}).key==='fncsdraft_career');
ok('ключ слота 10 — да', checkReq({code, op:'get', key:'fncsdraft_career_s10'}).key==='fncsdraft_career_s10');
ok('ключ менеджера — да', checkReq({code, op:'get', key:'fncsdraft_manager_s3'}).key==='fncsdraft_manager_s3');
ok('чужой ключ — нет', checkReq({code, op:'get', key:'fncsdraft_lang'}).err==='key');
ok('put без данных — нет', checkReq({code, op:'put', key:'fncsdraft_career', data:''}).err==='data');
ok('put больше лимита — нет', checkReq({code, op:'put', key:'fncsdraft_career', data:'x'.repeat(MAX_ONE+1)}).err==='size');
const p=checkReq({code, op:'put', key:'fncsdraft_career', data:'abc', info:{nick:'psychopath'}, at:5});
ok('put — подпись и время', p.op==='put' && JSON.parse(p.info).nick==='psychopath' && p.at===5, JSON.stringify(p));
const big='y'.repeat(PART*2+7);
const ps=parts(big);
ok('нарезка: три куска и склейка без потерь', ps.length===3 && ps.join('')===big, String(ps.length));
console.log(fails ? fails+' failed' : 'OK check-vault');
process.exit(fails ? 1 : 0);
