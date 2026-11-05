// Вдвоём при одной роли вопросы не уходят одному: каждый вопрос берёт ровно один, и у каждого своя половина.
// При разных ролях деление прежнее. И в команде, и в паре гонки.
//   node tools/check-mp-same-role.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const kinds=Object.keys(CC_MP_WHO);
const A={handle:'alpha', _roleKey:'roleIGL'}, B={handle:'bravo', _roleKey:'roleIGL'};
const roleOf=c=>c._roleKey;
const saveRole=ccMpRoleKey, saveCard=careerCard, saveLock=ccMpLock, saveRole2=ccMpRole, saveMP=(typeof MP!=='undefined' ? MP : undefined);
ccMpRoleKey=roleOf; ccMpLock=()=>true;
const team=(me, peer, own)=>{ careerCard=()=>me; MP.peer=peer; ccMpRole=()=>own ? 'a' : 'b'; return kinds.filter(k=>ccMpMine(k)); };
const run=(ra, rb, label)=>{
  A._roleKey=ra; B._roleKey=rb;
  const a=team(A, B, true), b=team(B, A, false);
  notes[label]={a,b};
  check(label+': каждый вопрос ровно у одного', kinds.every(k=>a.includes(k)!==b.includes(k)), JSON.stringify({a,b}));
  return {a,b};
};
for(const [r,l] of [['roleIGL','два игла'],['roleFRG','два фраггера']]){
  const {a,b}=run(r, r, l);
  check(l+': выбирают оба', a.length>=3 && b.length>=3, a.length+' '+b.length);
  check(l+': первый по нику вопросы игла', a.includes('drop') && a.includes('rot') && b.includes('mid') && b.includes('late'), JSON.stringify({a,b}));
}
{ const {a,b}=run('roleIGL','roleFRG','игл и фраггер'); check('разные роли: игл своё', a.includes('drop') && !a.includes('mid') && b.includes('mid') && !b.includes('drop'), JSON.stringify({a,b})); }
{ const {a,b}=run('roleFRG','roleIGL','фраггер и игл'); check('разные роли наоборот', b.includes('drop') && a.includes('mid'), JSON.stringify({a,b})); }
// Тот же ник: решает владелец, всё равно пополам.
B.handle='alpha'; A._roleKey='roleIGL'; B._roleKey='roleIGL';
{ const a=team(A,B,true), b=team(B,A,false); check('один ник: тоже пополам', kinds.every(k=>a.includes(k)!==b.includes(k)) && a.length>=3 && b.length>=3, JSON.stringify({a,b})); }
B.handle='bravo';
// Пара в гонке: адрес 'вопрос:ник первой карточки'.
const savePair=ccRacePairOn, saveCards=ccRacePairCards;
ccRacePairOn=()=>true; ccRacePairCards=()=>[A,B];
const pair=me=>{ careerCard=()=>me; return kinds.filter(k=>ccMpMine(k+':'+hKey(A))); };
A._roleKey='roleFRG'; B._roleKey='roleFRG';
A.handle='alpha'; B.handle='bravo';
{ const a=pair(A), b=pair(B); notes.pair={a,b}; check('гонка, одна роль: у каждого ровно один', kinds.every(k=>a.includes(k)!==b.includes(k)), JSON.stringify({a,b})); check('гонка, одна роль: выбирают оба', a.length>=3 && b.length>=3, a.length+' '+b.length); }
A._roleKey='roleIGL'; B._roleKey='roleFRG';
{ const a=pair(A), b=pair(B); check('гонка, разные роли как было', a.includes('drop') && b.includes('mid') && !a.includes('mid'), JSON.stringify({a,b})); }
ccRacePairOn=savePair; ccRacePairCards=saveCards; ccMpRoleKey=saveRole; careerCard=saveCard; ccMpLock=saveLock; ccMpRole=saveRole2;
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'role-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '120000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
if(res.fails.length){ res.fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-mp-same-role');
