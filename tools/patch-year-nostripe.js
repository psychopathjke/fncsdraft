// Полосок над годами нет вообще.
//
// Его слово: «убери вообще эти полоск». Полоса была последним остатком
// «обводки»: сначала цветом сезона, потом жёлтой, потом белой — и каждый раз
// мешала. Выбранный год теперь виден только тем, ради чего плитка и сделана:
// у него яркий арт, у остальных притушенный и вуаль плотнее.
const fs=require('fs'), path=require('path');
const F=path.join(__dirname,'..','index.html');
let s=fs.readFileSync(F,'utf8');
const NL=s.indexOf('\r\n')>=0?'\r\n':'\n';
const cut=a=>{ a=a.split('\n').join(NL); if(s.split(a).length!==2) throw new Error('не найдено: '+a.slice(0,50)); s=s.replace(a+NL, ''); };
const fix=(a,b)=>{ a=a.split('\n').join(NL); b=b.split('\n').join(NL);
  if(s.split(a).length!==2) throw new Error('не найдено: '+a.slice(0,50)); s=s.replace(a,b); };

cut('  #screen-career-create .cc-year-panel .cc-year-tile::before{content:"";position:absolute;left:0;top:0;right:0;\n' +
    '    height:3px;background:rgba(255,255,255,.22);z-index:2;}');
cut('  #screen-career-create .cc-year-panel .cc-year-tile:hover::before{background:rgba(255,255,255,.42);}');
cut('  #screen-career-create .cc-year-panel .cc-year-tile.on::before{background:#fff;height:4px;}');

// Раз метки нет, разница между выбранным и остальными должна читаться сама.
fix('  #screen-career-create .cc-year-panel .cc-year-tile:not(.on){filter:saturate(.72) brightness(.9);}',
    '  #screen-career-create .cc-year-panel .cc-year-tile:not(.on){filter:saturate(.5) brightness(.62);}');
fix('    background:linear-gradient(to top, rgba(8,44,46,.88) 38%, rgba(8,44,46,.42) 72%, rgba(8,44,46,.1));}',
    '    background:linear-gradient(to top, rgba(8,44,46,.82) 34%, rgba(8,44,46,.34) 70%, rgba(8,44,46,0));}');
fs.writeFileSync(F,s);
console.log('ок');
