// Боты в конце сессии играют по таблице (ccStakesSet): разметка групп по черте, только боты, своя агрессия возвращается.
//   node tools/check-career-stakes.js
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const body = `
const fails=[], check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!==undefined?': '+JSON.stringify(d):'')); };
// Поле 20 команд, 10 игр, черта 5. Очки: ровная лесенка по 30 за игру у лидера.
const mk=(i, pts)=>({name:'T'+i, pts, _seekMul:i===3 ? 1.4 : undefined});
const field=[]; for(let i=0;i<20;i++) field.push(mk(i, Math.round(9*30*(1-i/25))));
field[0].pts=9*30+200;            // лидер с огромным отрывом
field[19].pts=0;                  // безнадёжный
const you={name:'You', isYou:true, pts:50, _seekMul:2}; field.push(you);
// До последних двух игр — никого не трогает.
ccStakesSet(field, 'pts', 5, 10, 5);
check('рано: без разметки', field.every(t=>!t._stake));
check('рано: черта игрока не тронута', field[3]._seekMul===1.4, field[3]._seekMul);
ccStakesSet(field, 'pts', 9, 10, 5);   // последняя игра
const k=t=>t._stake;
check('лидер сидит', k(field[0])==='safe', k(field[0]));
check('безнадёжный играет на килы', k(field[19])==='lost', k(field[19]));
check('свой отряд не трогается', you._stake==null && you._seekMul===2, you);
check('кто-то у черты', field.some(t=>k(t)==='edge'));
check('лидер реже ищет драку', field[0]._seekMul<1);
check('безнадёжный чаще', field[19]._seekMul>1);
check('черта игрока умножается, а не затирается', field[3]._seekBase===1.4, field[3]._seekBase);
ccStakesClear(field);
check('после сессии агрессия своя', field[0]._seekMul===1 && field[3]._seekMul===1.4 && field[19]._seekMul===1, [field[0]._seekMul, field[3]._seekMul, field[19]._seekMul]);
// Без черты (финал): нижняя половина — на килы.
field.forEach(t=>{ t._stake=null; });
ccStakesSet(field, 'pts', 11, 12, 0);
check('финал: нижняя половина на килы', k(field[18])==='lost', k(field[18]));
check('финал: лидер с отрывом сидит', k(field[0])==='safe', k(field[0]));
ccStakesClear(field);
return {fails};
`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stakes-'));
const bf = path.join(dir, 'body.js'); fs.writeFileSync(bf, body);
const out = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'probe-run.js'), bf, '120000'], {encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore']}));
fs.rmSync(dir, {recursive: true, force: true});
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('боты в конце сессии играют по таблице: разметка, только боты, агрессия возвращается');
