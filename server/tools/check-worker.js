// Два вебсокета проходят вечер целиком через живой wrangler dev.
//
// Машина состояний проверена без сети (check-lobby.js). Здесь проверяется
// именно переходник: что сообщения доезжают, что рассылка попадает кому надо
// и что лобби переживает переподключение.
//
//   node server/tools/check-worker.js
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = 8799;
const fails=[]; const check=(n,ok,d)=>{ if(!ok) fails.push(n+(d?': '+d:'')); };
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* Убить надо ДЕРЕВО, а не первый процесс.
   wrangler запускается через npx и через оболочку, поэтому dev.kill() гасит
   оболочку, а сам воркер остаётся жить, держит порт и не даёт проверке
   завершиться: она печатала зелёную строку и висела до внешнего таймаута. */
function killTree(p){
  if(!p || !p.pid) return;
  try{
    if(process.platform==='win32')
      require('child_process').execFileSync('taskkill', ['/pid', String(p.pid), '/T', '/F'],
                                           {stdio:'ignore'});
    else process.kill(-p.pid, 'SIGKILL');
  }catch(e){ try{ p.kill('SIGKILL'); }catch(e2){} }
}

const dev = spawn('npx', ['wrangler','dev','--port',String(PORT),'--local'],
  {cwd:ROOT, shell:true, stdio:['ignore','pipe','pipe']});
let devLog='';
dev.stdout.on('data',d=>{ devLog+=d; }); dev.stderr.on('data',d=>{ devLog+=d; });

const open = (id) => new Promise((res, rej) => {
  const ws = new WebSocket('ws://127.0.0.1:'+PORT+'/lobby/ABC123?id='+id+'&build=aaaa1111');
  ws.inbox=[];
  ws.addEventListener('message', e=>ws.inbox.push(JSON.parse(e.data)));
  ws.addEventListener('open', ()=>res(ws));
  ws.addEventListener('error', e=>rej(new Error('вебсокет не открылся: '+(e&&e.message||'')+' | хвост лога wrangler: '+devLog.slice(-400))));
});
const send=(ws,m)=>ws.send(JSON.stringify(m));
const got=(ws,t)=>ws.inbox.find(m=>m.t===t);

(async () => {
  for(let i=0;i<60 && !/Ready on/i.test(devLog);i++) await wait(500);
  check('wrangler dev поднялся', /Ready on/i.test(devLog), devLog.slice(-300));
  if(fails.length) throw new Error('сервер не поднялся');

  const A=await open('A'), B=await open('B');
  send(A,{t:'hello', build:'aaaa1111', card:{handle:'a'}});
  send(B,{t:'hello', build:'aaaa1111', card:{handle:'b'}});
  await wait(400);
  check('первому пришло состояние', !!got(A,'state'), JSON.stringify(A.inbox));
  check('второму тоже', !!got(B,'state'));
  check('карточка напарника доехала', !!got(A,'card') || (got(A,'state')||{}).peer);

  send(A,{t:'ready', day:'2026-02-02'});
  await wait(200);
  check('одного мало', !got(A,'start') && !got(B,'start'));
  send(B,{t:'ready', day:'2026-02-02'});
  await wait(300);
  check('оба готовы — старт обоим', !!got(A,'start') && !!got(B,'start'));
  check('сид у обоих один', got(A,'start') && got(B,'start') &&
        got(A,'start').seed===got(B,'start').seed,
        (got(A,'start')||{}).seed+' / '+(got(B,'start')||{}).seed);

  send(A,{t:'act', kind:'drop', payload:{zone:7}});
  await wait(200);
  const at=B.inbox.filter(m=>m.t==='act');
  check('решение доехало напарнику', at.length===1, JSON.stringify(at));
  check('и у него есть номер', at[0] && typeof at[0].n==='number');

  // Обрыв и догон.
  B.close(); await wait(200);
  send(A,{t:'act', kind:'choice', payload:{i:2}});
  await wait(200);
  const B2=await open('B');
  send(B2,{t:'hello', build:'aaaa1111', card:{handle:'b'}});
  send(B2,{t:'since', n:at[0] ? at[0].n : 0});
  await wait(400);
  check('вернувшийся догнал пропущенное',
        B2.inbox.some(m=>m.t==='act' && m.kind==='choice'), JSON.stringify(B2.inbox));

  send(A,{t:'digest', hash:'h', team:{day:'2026-02-03'}});
  send(B2,{t:'digest', hash:'h', team:{day:'2026-02-03'}});
  await wait(400);
  check('вечер закрыт обоим', !!got(A,'close') && !!got(B2,'close'));
  check('и новое состояние приехало', (got(A,'close')||{}).team &&
        got(A,'close').team.day==='2026-02-03');

  A.close(); B2.close();
})().then(()=>{
  killTree(dev);
  if(fails.length){ fails.forEach(f=>console.error('FAIL '+f)); process.exit(1); }
  console.log('переходник доносит сообщения и переживает переподключение');
  process.exit(0);
}).catch(e=>{ killTree(dev); console.error(String(e&&e.stack||e)); process.exit(1); });
