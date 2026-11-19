// Плитки острова с fortnite.gg для чёткой картинки карты (его вопрос 19.11: «качество можно улучшить как-то карты?»).
// Мир fortnite.gg — 256 единиц; на приближении z плитка 256 px покрывает 256/2^z единиц. Качает плитки, попадающие в
// вырез lng a..b, lat c..d, в tools/fgg/tiles/<map>/<z>/x_y.webp, с паузой между запросами. Уже скачанные не трогает.
//   node tools/fetch-fgg-tiles.js <map> <z> <lng0> <lng1> <lat0> <lat1>
//   пример: node tools/fetch-fgg-tiles.js 43 4 64 212 -68 -216
const fs=require('fs'), path=require('path'), https=require('https');
const [map, zs, a, b, c, d]=process.argv.slice(2);
const z=+zs, per=256/Math.pow(2, z);
const x0=Math.floor(+a/per), x1=Math.floor((+b-1e-9)/per), y0=Math.floor(-(+c)/per), y1=Math.floor((-(+d)-1e-9)/per);
const dir=path.join(__dirname, 'fgg', 'tiles', map, String(z)); fs.mkdirSync(dir, {recursive:true});
const get=u=>new Promise((res, rej)=>https.get(u, {headers:{'User-Agent':'Mozilla/5.0'}}, r=>{
  if(r.statusCode!==200){ r.resume(); return res(null); }
  const ch=[]; r.on('data', x=>ch.push(x)); r.on('end', ()=>res(Buffer.concat(ch))); }).on('error', rej));
const sleep=ms=>new Promise(r=>setTimeout(r, ms));
(async()=>{
  let got=0, miss=0, have=0;
  for(let y=y0; y<=y1; y++) for(let x=x0; x<=x1; x++){
    const f=path.join(dir, x+'_'+y+'.webp');
    if(fs.existsSync(f)){ have++; continue; }
    const buf=await get('https://fortnite.gg/maps/'+map+'/'+z+'/'+x+'/'+y+'.webp');
    if(buf){ fs.writeFileSync(f, buf); got++; } else miss++;
    await sleep(350);
  }
  console.log(map+' z'+z+': x '+x0+'..'+x1+', y '+y0+'..'+y1+' · скачано '+got+', уже было '+have+', нет '+miss);
})();
