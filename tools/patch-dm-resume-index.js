// Резюме напарника в личке — по индексу, а не перебором всех карточек.
//
// ccDmResume на каждое приглашение делало PLAYERS.filter по всему файлу
// (десятки тысяч карточек), хотя рядом уже живёт ccCardsByKey() — та же карта
// «ник → его карточки», которой чинился лаг смены региона на создании карьеры.
// Личка предлагает кресло пачками, и перебор шёл на каждого.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'..','index.html');
let s=fs.readFileSync(F,'utf8');
const A='    const mine=PLAYERS.filter(p=>hKey(p)===hk && p.placement>0);';
if(s.split(A).length!==2) throw new Error('строка перебора не найдена ровно один раз');
s=s.replace(A, '    const mine=(ccCardsByKey().get(hk)||[]).filter(p=>p.placement>0);');
fs.writeFileSync(F,s);
console.log('ок');
