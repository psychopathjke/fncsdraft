// Сторож зеркала: сборка должна жить под ПОДПАПКОЙ, как её отдаёт
// https://psychopathjke.github.io/fncsdraft/ — а не в корне, как на fncsdraft.com.
//
// Зачем зеркало: 3-5 сентября 2026 игроки из России (ПК, Яндекс Браузер, без
// VPN и с VPN, инкогнито тоже) видели белую вкладку «fncsdraft». Снаружи сайт
// открывался со всех узлов check-host, включая Москву и Петербург, ECH и HTTP/3
// уже были выключены — то есть режет дорогу к Cloudflare конкретный провайдер,
// и со стороны сайта это не чинится. GitHub Pages ходит мимо Cloudflare.
//
// Что проверяется: локальный http-сервер отдаёт папку под /fncsdraft/, headless
// Chrome грузит страницу, включает карту и считает 404 (и на сервере, и в
// браузере), ошибки JS, число карт. Любой абсолютный путь вида "/photos/..."
// здесь станет 404 — на корневом домене его не видно, на зеркале он ломает сайт.
//
// Запуск: node tools/check-mirror-subpath.js <абсолютный путь к папке деплоя>
// Ловушка, из-за которой первая версия висла: сервер и Chrome жили в одном
// процессе, а execFileSync блокировал цикл событий — сервер молчал, Chrome ждал.
const http=require('http'),fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const DIR=process.argv[2]; const PREFIX='/fncsdraft/';
const BOOT=`<pre id="__out" style="display:none"></pre><script>(function(){const bad=[],errs=[];
window.addEventListener('error',function(e){const t=e.target;if(t&&(t.tagName==='IMG'||t.tagName==='SCRIPT'||t.tagName==='LINK'))bad.push(t.src||t.href||'');else errs.push(String(e.message)+' @'+e.lineno);},true);
setTimeout(function(){try{if(typeof useLandingSet==='function')useLandingSet('m2');}catch(e){errs.push(String(e));}
setTimeout(function(){const txt=(document.body.innerText||'').replace(/\s+/g,' ').trim();
document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify({bad:[...new Set(bad)].slice(0,40),errs:[...new Set(errs)].slice(0,40),
maps:(typeof ZONE_SETS!=='undefined')?Object.keys(ZONE_SETS).length:-1,zones:(typeof ALL_LANDING_ZONES!=='undefined')?ALL_LANDING_ZONES.length:-1,
text:txt.length,sw:!!navigator.serviceWorker,href:location.href}))+'END';},400);},900);})();</script>`;
const asked=new Set(), missing=[];
const srv=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);
  if(!u.startsWith(PREFIX)){res.writeHead(404);res.end();missing.push('OUTSIDE '+u);return;}
  let rel=u.slice(PREFIX.length)||'index.html'; if(rel.endsWith('/'))rel+='index.html';
  asked.add(rel); const f=path.join(DIR,rel);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){missing.push(rel);res.writeHead(404);res.end();return;}
  let body=fs.readFileSync(f); const ext=path.extname(f);
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.ico':'image/x-icon'}[ext]||'application/octet-stream';
  if(rel==='index.html')body=Buffer.from(body.toString('utf8')+BOOT);
  res.writeHead(200,{'Content-Type':mime});res.end(body);
});
srv.listen(0,'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+srv.address().port+PREFIX;
  const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',(process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
  // execFileSync блокировал цикл событий — сервер не отвечал Chrome, и проба висла. Асинхронно:
  execFile(CHROME,["--headless=new","--disable-gpu","--no-sandbox","--virtual-time-budget=60000","--dump-dom",url],{maxBuffer:512*1024*1024,encoding:"utf8",timeout:120000},(err,dom)=>{
  if(err)console.error("chrome failed",err.message); dom=dom||"";
  srv.close();
  const m=dom.match(/BEGIN([\s\S]*?)END/); if(!m){console.log('страница не поднялась');process.exit(2);}
  const out=JSON.parse(decodeURIComponent(m[1]));
  console.log('url:',out.href); console.log('запрошено файлов:',asked.size,'| нет на сервере:',missing.length,missing.slice(0,15));
  console.log('404 в браузере:',out.bad); console.log('ошибки:',out.errs);
  console.log('карт:',out.maps,'коробок:',out.zones,'видимого текста:',out.text,'sw api:',out.sw);
  process.exit((missing.length||out.bad.length||out.errs.length||out.maps<5)?1:0);
  });
});
