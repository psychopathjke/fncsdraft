// Оболочка говорит, что приложение ещё едет.
//
// Отчёт с зеркала, 5 сентября 2026: «с телефона всё прекрасно работает», «с ПК
// бесконечная загрузка», Ctrl+F5 не помог. Оболочка рисует первый экран
// целиком, а app.js (5 МБ) у задушенного канала едет минуты — и на экране
// ничего об этом нет. Проверяется на собранной папке (tools/build-deploy.js):
//   app.js не приходит      — внизу строка «загружаем приложение», через
//                             15 с — «сеть медленная» с советом;
//   app.js отдаёт 404       — красная строка «не загрузилось» и кнопка;
//   app.js пришёл           — строки нет;
//   и при висящем flagcdn воркер всё равно регистрируется (не ждёт load).
// Папка отдаётся под /fncsdraft/, как на зеркале, чужие домены — в чёрную дыру.
//
//   node tools/check-shell-boot.js <абсолютный путь к папке деплоя>
const http=require('http'),fs=require('fs'),path=require('path'),{execFile}=require('child_process');
const DIR=process.argv[2]; const PREFIX='/fncsdraft/';
if(!DIR||!fs.existsSync(path.join(DIR,'index.html'))) { console.error('нужна папка деплоя с index.html'); process.exit(2); }
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA||'')+'/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon'};

let MODE='hold';  // hold | 404 | ok
const PROBE=`<script>(function(){function snap(){var el=document.getElementById('fdBoot');
var out={cls:el?el.className:null,text:el?el.textContent:null,btn:!!(el&&el.querySelector('button'))};
var p=document.createElement('pre');p.id='__out';p.style.display='none';p.textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';document.body.appendChild(p);}
setTimeout(snap, ${'${WAIT}'});})();</script>`;
const srv=http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);
  if(!u.startsWith(PREFIX)){res.writeHead(404);res.end();return;}
  const rel=u.slice(PREFIX.length)||'index.html';
  if(rel==='app.js'){ if(MODE==='hold') return; if(MODE==='404'){res.writeHead(404);res.end();return;} }
  const f=path.join(DIR,rel);
  fs.readFile(f,(e,b)=>{ if(e){res.writeHead(404);res.end();return;}
    let body=b;
    // Проба стоит ПЕРЕД тегом app.js: висящий <script src> останавливает разбор,
    // и всё, что после него, при зависшем приложении не исполнится никогда.
    if(rel==='index.html') body=Buffer.from(b.toString('utf8').replace('<style>#fdBoot', PROBE.replace('${WAIT}', String(WAIT))+'<style>#fdBoot'));
    res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'}); res.end(body); });
});
let WAIT=1500;
function run(mode, wait, budget){
  return new Promise(resolve=>{
    MODE=mode; WAIT=wait;
    execFile(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-insecure-localhost',
      '--host-resolver-rules=MAP flagcdn.com 10.255.255.1, MAP *.fncsdraft.com 10.255.255.1',
      // --timeout — настоящие миллисекунды: с висящим запросом виртуальное время
      // само не доходит до конца бюджета, и без него dump-dom не случается.
      '--virtual-time-budget='+budget,'--timeout='+(budget+2000),'--dump-dom','http://127.0.0.1:8767/fncsdraft/'],
      {maxBuffer:256*1024*1024,encoding:'utf8',timeout:90000},(err,dom)=>{
        // Chrome выходит с ненулевым кодом, когда запрос так и остался висеть, —
        // DOM при этом снят; читаем его, а не код выхода. Ищем закодированный
        // payload, а не «что-то между метками»: сама проба тоже лежит в DOM.
        const m=(dom||'').match(/PBEGIN((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!'()*\-._~])*)PEND/);
        resolve(m?JSON.parse(decodeURIComponent(m[1])):{err:'no probe in '+(dom||'').length+' chars of DOM'});
      });
  });
}
srv.listen(8767,'127.0.0.1',async()=>{
  const fails=[]; const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
  const a=await run('hold',1500,3000);
  console.log('  hold 1.5s → '+JSON.stringify(a));
  check('строка стоит, пока app.js не пришёл', a.cls==='on' && /Loading the app|Загружаем/.test(a.text||''), JSON.stringify(a));
  const b=await run('hold',17000,20000);
  console.log('  hold 17s  → '+JSON.stringify(b).slice(0,200));
  check('через 15 с — «сеть медленная» и совет', /slow/.test(b.cls||'') && /Slow network|медленная/.test(b.text||'') && /DNS/.test(b.text||''), JSON.stringify(b));
  // Воркер ставится только по https, живьём его здесь не проверить: смотрим, что
  // в оболочке регистрация не висит на одном load (висящая картинка с чужого
  // домена отменяла бы её навсегда).
  const shell=fs.readFileSync(path.join(DIR,'index.html'),'utf8');
  check('регистрация воркера не ждёт одного load', /addEventListener\('load', go\);\s*setTimeout\(go, 4000\)/.test(shell));
  const c=await run('404',1500,3000);
  console.log('  404       → '+JSON.stringify(c));
  check('app.js не пришёл — красная строка с кнопкой', /fail/.test(c.cls||'') && c.btn===true, JSON.stringify(c));
  const d=await run('ok',2500,6000);
  console.log('  ok        → '+JSON.stringify(d));
  check('app.js исполнился — строки нет', d.cls===null, JSON.stringify(d));
  srv.close();
  if(fails.length){ fails.forEach(f=>console.error('FAILED: '+f)); process.exit(1); }
  console.log('the shell says the app is on its way, and says when it is not');
});
