// Переставляет CC_BUILD в index.html на sha1 самого файла.
//
// Хеш считается по файлу, из которого ВЫРЕЗАНА строка с самой меткой — иначе
// он зависел бы от себя и не сходился никогда. Тот же приём, что у ?v= на
// скриптах, только источник здесь — сам документ.
//
//   node tools/stamp-build.js
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const FILE=path.resolve(__dirname,'..','index.html');
const RE=/^const CC_BUILD='[0-9a-f]{8}';$/m;
const src=fs.readFileSync(FILE,'utf8');
if(!RE.test(src)){ console.error('строки CC_BUILD в index.html нет'); process.exit(2); }
const bare=src.replace(RE, "const CC_BUILD='';");
const hash=crypto.createHash('sha1').update(bare).digest('hex').slice(0,8);
const out=src.replace(RE, "const CC_BUILD='"+hash+"';");
// src/ раскладывается заново из index.html (tools/parts.js): штамп идёт перед каждым деплоем, так части не отстают.
const split=()=>{ try{ require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, 'parts.js'), 'split'], {stdio:'ignore'}); }catch(e){ console.error('parts split: '+e.message); } };
if(out===src){ console.log('CC_BUILD уже '+hash); split(); process.exit(0); }
fs.writeFileSync(FILE, out);
split();
console.log('CC_BUILD -> '+hash);
