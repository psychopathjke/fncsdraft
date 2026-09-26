// Годы отмечаются ОДНИМ цветом, а не каждый своим.
//
// Его слово: «все равно мне не нравится выделение разным цветом где обводка
// годов». Полоса сверху плитки красилась цветом сезона — 2026 бирюзовая, 2025
// сиреневая, 2024 жёлтая, — и три разных цвета в ряд читались как три разных
// состояния, хотя состояние у них одно: какой год выбран. Цвет теперь один,
// жёлтый primary сайта, и он значит ровно «этот»; невыбранные несут тонкую
// белую полосу. Переменная --yr больше не нужна ни в CSS, ни в разметке.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'..','index.html');
let s=fs.readFileSync(F,'utf8');
const NL=s.indexOf('\r\n')>=0?'\r\n':'\n';
const nl=t=>t.split('\n').join(NL);
const fix=(a,b)=>{ a=nl(a); b=nl(b);
  if(s.split(a).length!==2) throw new Error('не найдено ровно один раз: '+a.slice(0,60));
  s=s.replace(a,b); };

fix('    height:3px;background:var(--yr,#00b090);opacity:.75;z-index:2;}',
    '    height:3px;background:rgba(255,255,255,.22);z-index:2;}');
fix('  #screen-career-create .cc-year-panel .cc-year-tile:hover::before{opacity:1;}',
    '  #screen-career-create .cc-year-panel .cc-year-tile:hover::before{background:rgba(255,255,255,.42);}');
fix('  #screen-career-create .cc-year-panel .cc-year-tile.on::before{opacity:1;height:4px;}',
    '  #screen-career-create .cc-year-panel .cc-year-tile.on::before{background:var(--primary,#ffd400);height:4px;}');
fix('style="--yr:${look.c};--yr-art:url(${look.art})"', 'style="--yr-art:url(${look.art})"');
fix("    const YEAR_LOOK={2026:{c:'#00b090', lan:'Antwerp',    art:'art/fncs-2026.jpg'},\n" +
    "                     2025:{c:'#b14bf4', lan:'Lyon',       art:'art/mode-major1-2025.jpg'},\n" +
    "                     2024:{c:'#ffdd00', lan:'Fort Worth', art:'art/fncs-2024.jpg'}};",
    "    const YEAR_LOOK={2026:{lan:'Antwerp',    art:'art/fncs-2026.jpg'},\n" +
    "                     2025:{lan:'Lyon',       art:'art/mode-major1-2025.jpg'},\n" +
    "                     2024:{lan:'Fort Worth', art:'art/fncs-2024.jpg'}};");
fix("      const look=YEAR_LOOK[y]||{c:'#00b090', lan:''};", "      const look=YEAR_LOOK[y]||{lan:''};");
fix('     --yr-art, цвет сезона — --yr, обе с самой кнопки. */',
    '     --yr-art с самой кнопки. Цвет полосы ОДИН на все годы — жёлтый primary\n' +
    '     сайта, и он значит «этот выбран»: своим цветом у каждого года три\n' +
    '     плитки читались как три разных состояния (его слово 27.09). */');
fs.writeFileSync(F,s);
console.log('ок');
