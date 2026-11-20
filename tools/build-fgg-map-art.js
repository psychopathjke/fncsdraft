// Картинка острова из плиток fortnite.gg (tools/fetch-fgg-tiles.js) в высоком разрешении: тот же вырез lng/lat, что и у
// старой картинки, поэтому клетки высадки (ZONE_SETS, в процентах) остаются на местах. Склейка — canvas в headless Chrome.
//   node tools/build-fgg-map-art.js <map> <z> <lng0> <lng1> <lat0> <lat1> <out.jpg> [quality=0.86]
//   пример: node tools/build-fgg-map-art.js 43 4 64 212 -68 -216 art/map-s43.jpg
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [map, zs, a, b, c, d, out, q, ref]=process.argv.slice(2);
// ref — старая картинка того же выреза (без тумана): если задана, подложкой служит она, растянутая до нового размера.
const z=+zs, per=256/Math.pow(2, z), pxu=256/per;              // пикселей на единицу
const lng0=+a, lng1=+b, lat0=+c, lat1=+d;
const x0=Math.floor(lng0/per), x1=Math.floor((lng1-1e-9)/per), y0=Math.floor(-lat0/per), y1=Math.floor((-lat1-1e-9)/per);
const dir=path.join(__dirname, 'fgg', 'tiles', map, String(z));
const tiles=[];
for(let y=y0; y<=y1; y++) for(let x=x0; x<=x1; x++){
  const f=path.join(dir, x+'_'+y+'.webp');
  if(!fs.existsSync(f)) throw new Error('нет плитки '+f+' — сначала fetch-fgg-tiles.js');
  tiles.push({x, y, src:'data:image/webp;base64,'+fs.readFileSync(f).toString('base64')});
}
// Подложка — тот же вырез на приближении z-1 (если плитки скачаны): у края карты fortnite.gg плитки крупного приближения
// бывают затемнены туманом, такие пропускаются, и под ними видна подложка.
const zb=z-1, perB=256/Math.pow(2, zb), bx0=Math.floor(lng0/perB), bx1=Math.floor((lng1-1e-9)/perB), by0=Math.floor(-lat0/perB), by1=Math.floor((-lat1-1e-9)/perB);
const bdir=path.join(__dirname, 'fgg', 'tiles', map, String(zb)), base=[];
for(let y=by0; y<=by1; y++) for(let x=bx0; x<=bx1; x++){ const bf=path.join(bdir, x+'_'+y+'.webp');
  if(fs.existsSync(bf)) base.push({x, y, src:'data:image/webp;base64,'+fs.readFileSync(bf).toString('base64')}); }
const W=Math.round((lng1-lng0)*pxu), H=Math.round((lat0-lat1)*pxu);
const refSrc=ref ? 'data:image/jpeg;base64,'+fs.readFileSync(path.resolve(ref)).toString('base64') : null;
const offX=Math.round(lng0*pxu-x0*256), offY=Math.round(-lat0*pxu-y0*256);
const html=`<pre id="o"></pre><script>
const T=${JSON.stringify(tiles)}, B=${JSON.stringify(base)}, REF=${JSON.stringify(refSrc)};
const c=document.createElement('canvas'); c.width=${W}; c.height=${H}; const g=c.getContext('2d');
const load=src=>new Promise(r=>{ const im=new Image(); im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; });
const lum=(ctx,x,y,w,h)=>{ const d=ctx.getImageData(Math.max(0,x),Math.max(0,y),Math.max(1,w),Math.max(1,h)).data; let s=0; for(let i=0;i<d.length;i+=16) s+=d[i]+d[i+1]+d[i+2]; return s/(d.length/16); };
(async()=>{
  /* Края плиток fortnite.gg полупрозрачные: в JPEG прозрачное становится чёрным, отсюда «туман» по краю. Поэтому слои:
     цвет воды, подложка (старая картинка того же выреза или z-1), плитки z поверх. */
  g.fillStyle='#2a9cb8'; g.fillRect(0, 0, ${W}, ${H});
  let refOk=false;
  if(REF){ const im=await load(REF); if(im){ refOk=true; g.drawImage(im, 0, 0, ${W}, ${H}); } }
  if(!refOk) for(const t of B){ const im=await load(t.src); if(!im) continue;
    g.drawImage(im, (t.x*512)-${Math.round(lng0*pxu)}, (t.y*512)-${Math.round(-lat0*pxu)}, 512, 512); }
  for(const t of T){ const im=await load(t.src); if(!im) continue; g.drawImage(im, (t.x-${x0})*256-${offX}, (t.y-${y0})*256-${offY}); }
  document.title='ref '+refOk+' base '+B.length;
  done();
})();
function done(){ document.getElementById('o').textContent='JB'+c.toDataURL('image/jpeg', ${+(q||0.86)}).split(',')[1]+'JE'; }
</script>`;
const tmpd=fs.mkdtempSync(path.join(os.tmpdir(), 'fgg-'));
const tmp=path.join(tmpd, 'p.html'); fs.writeFileSync(tmp, html);
const dom=execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--virtual-time-budget=60000', '--dump-dom',
  'file:///'+tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:1<<30}).toString();
const tt=dom.match(/<title>([^<]*)<\/title>/); if(tt) console.log('итог склейки: '+tt[1]);
const m=dom.match(/JB([A-Za-z0-9+/=]+)JE/); if(!m) throw new Error('склейка не вернула картинку');
fs.writeFileSync(path.resolve(out), Buffer.from(m[1], 'base64'));
console.log(out+': '+W+'x'+H+', '+Math.round(fs.statSync(path.resolve(out)).size/1024)+' КБ, плиток '+tiles.length+', подложка '+base.length);
