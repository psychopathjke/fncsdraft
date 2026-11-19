// Где на карте fortnite.gg лежит наша старая картинка острова: вырез lng/lat, под который потом собирается чёткая
// картинка (build-fgg-map-art.js) без сдвига клеток высадки. Сравнение по маске «суша/вода»: сначала рамка суши,
// потом перебор размера и сдвига вокруг неё. Нужен мир на z3 (fetch-fgg-tiles.js <map> 3 0 256 0 -256).
//   node tools/find-fgg-crop.js <map> <art.jpg>
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const [map, art]=process.argv.slice(2);
const dir=path.join(__dirname, 'fgg', 'tiles', map, '3'), tiles=[];
for(let y=0;y<8;y++) for(let x=0;x<8;x++){ const f=path.join(dir, x+'_'+y+'.webp'); if(fs.existsSync(f)) tiles.push({x, y, src:'data:image/webp;base64,'+fs.readFileSync(f).toString('base64')}); }
const buf=fs.readFileSync(path.resolve(art)), mime=buf[0]===0x89 ? 'image/png' : 'image/jpeg';
const ART='data:'+mime+';base64,'+buf.toString('base64');
const html=`<pre id="o"></pre><script>
const T=${JSON.stringify(tiles)}, ART=${JSON.stringify(ART)};
const load=src=>new Promise(r=>{ const im=new Image(); im.onload=()=>r(im); im.onerror=()=>r(null); im.src=src; });
const water=(r,g,b)=>b>r+25 && b>80 && g>r;
(async()=>{
  // Мир 1024 px (4 px на единицу), маска суши.
  const WN=1024, wc=document.createElement('canvas'); wc.width=WN; wc.height=WN; const wg=wc.getContext('2d');
  wg.fillStyle='#2a9cb8'; wg.fillRect(0,0,WN,WN);
  for(const t of T){ const im=await load(t.src); if(im) wg.drawImage(im, t.x*128, t.y*128, 128, 128); }
  const wd=wg.getImageData(0,0,WN,WN).data, wm=new Uint8Array(WN*WN);
  for(let i=0;i<WN*WN;i++) wm[i]=water(wd[i*4],wd[i*4+1],wd[i*4+2]) ? 0 : 1;
  // Старая картинка: маска шириной 160.
  const im=await load(ART); const AW=160, AH=Math.round(160*im.naturalHeight/im.naturalWidth);
  const ac=document.createElement('canvas'); ac.width=AW; ac.height=AH; const ag=ac.getContext('2d'); ag.drawImage(im,0,0,AW,AH);
  const ad=ag.getImageData(0,0,AW,AH).data, am=new Uint8Array(AW*AH);
  for(let i=0;i<AW*AH;i++) am[i]=water(ad[i*4],ad[i*4+1],ad[i*4+2]) ? 0 : 1;
  // Рамки суши (без мелочи по краям: доля суши в строке/столбце > 1%).
  const bbox=(m,W,H)=>{ let x0=W,x1=0,y0=H,y1=0;
    for(let x=0;x<W;x++){ let s=0; for(let y=0;y<H;y++) s+=m[y*W+x]; if(s>H*0.01){ x0=Math.min(x0,x); x1=Math.max(x1,x); } }
    for(let y=0;y<H;y++){ let s=0; for(let x=0;x<W;x++) s+=m[y*W+x]; if(s>W*0.01){ y0=Math.min(y0,y); y1=Math.max(y1,y); } }
    return {x0,x1,y0,y1}; };
  const ba=bbox(am,AW,AH), bw=bbox(wm,WN,WN);
  // Оценка: единиц на пиксель старой маски, по ширине рамки.
  const upp=((bw.x1-bw.x0)/4)/(ba.x1-ba.x0);
  let size=upp*AW, lng0=bw.x0/4-ba.x0*upp, lat0=-(bw.y0/4-ba.y0*upp);
  const err=(L0,A0,S)=>{ let e=0; const sh=S*AH/AW;
    for(let j=0;j<AH;j+=2) for(let i=0;i<AW;i+=2){ const lng=L0+(i+0.5)/AW*S, lat=-(-A0+(j+0.5)/AH*sh);
      const wx=Math.floor(lng*4), wy=Math.floor(-lat*4); const v=(wx<0||wy<0||wx>=WN||wy>=WN) ? 0 : wm[wy*WN+wx];
      if(v!==am[j*AW+i]) e++; }
    return e/((AW/2)*(AH/2)); };
  let best={e:err(lng0,lat0,size), lng0, lat0, size};
  for(const step of [2, 0.5, 0.125]){
    const c=best;
    for(let ds=-6;ds<=6;ds++) for(let dx=-6;dx<=6;dx++) for(let dy=-6;dy<=6;dy++){
      const S=c.size+ds*step, L0=c.lng0+dx*step, A0=c.lat0+dy*step, e=err(L0,A0,S);
      if(e<best.e) best={e, lng0:L0, lat0:A0, size:S}; } }
  const r={err:+best.e.toFixed(4), lng0:+best.lng0.toFixed(2), lng1:+(best.lng0+best.size).toFixed(2), lat0:+best.lat0.toFixed(2), lat1:+(best.lat0-best.size*AH/AW).toFixed(2), first:{size, lng0, lat0}};
  document.getElementById('o').textContent='RB'+JSON.stringify(r)+'RE';
})();
</script>`;
const tmpd=fs.mkdtempSync(path.join(os.tmpdir(), 'fgc-')), tmp=path.join(tmpd, 'p.html'); fs.writeFileSync(tmp, html);
const dom=execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--virtual-time-budget=120000', '--dump-dom',
  'file:///'+tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:1<<30}).toString();
const m=dom.match(/RB(.*?)RE/); if(!m) throw new Error('сопоставление не вернуло ответ');
console.log(map+' ~ '+art+': '+m[1]);
