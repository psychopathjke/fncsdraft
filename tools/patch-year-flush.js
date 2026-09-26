// Три плитки года — во всю ширину панели.
//
// Его слово: «все равно не ровно». И правда: у сетки стояло max-width 620px,
// а панель шире — ряд обрывался, не доходя до её правого края, и не совпадал
// ни с подписью под ним, ни с кромкой самой панели. Ширину задаёт панель.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'..','index.html');
let s=fs.readFileSync(F,'utf8');
const a='  .cc-year-panel .cc-chips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;max-width:620px;}   /* три года в ряд: 2026 / 2025 / 2024 */';
if(s.split(a).length!==2) throw new Error('сетка годов не найдена');
s=s.replace(a, '  .cc-year-panel .cc-chips{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}   /* три года в ряд во всю ширину панели */');
fs.writeFileSync(F,s);
console.log('ок');
