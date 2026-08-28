// CC_BUILD не отстал от index.html.
//
// Отставшая метка страшнее отсутствующей: два клиента с разным кодом решат,
// что они одной версии, и разойдутся в середине вечера — ровно то, что
// проверка версий и должна была предотвратить.
//
//   node tools/check-mp-build.js
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const FILE=path.resolve(__dirname,'..','index.html');
const RE=/^const CC_BUILD='([0-9a-f]{8})';$/m;
const src=fs.readFileSync(FILE,'utf8');
const m=src.match(RE);
if(!m){ console.error('FAIL в index.html нет строки CC_BUILD'); process.exit(1); }
const bare=src.replace(RE, "const CC_BUILD='';");
const want=crypto.createHash('sha1').update(bare).digest('hex').slice(0,8);
if(m[1]!==want){
  console.error('FAIL метка сборки отстала: в файле '+m[1]+', посчиталось '+want);
  console.error('     починка: node tools/stamp-build.js');
  process.exit(1);
}
console.log('метка сборки совпадает с файлом: '+want);
