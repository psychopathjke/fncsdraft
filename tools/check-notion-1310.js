// Notion «13.10.26»: (1) сборная Кубка наций в призовых — люди, а не строка «Польша (Darm, demus, Pixx, FRANEK)»,
// и старые сейвы разъезжаются по людям; (2) своя статистика вечера — элимы своей долей, как в катке, а не половиной
// отрядных; (3) «Игроки сайта» — одинаковые строки один раз, скрытая карьера с кнопкой «Показывать меня»;
// (4) та же таблица перечитывается при открытии, своя строка не теряется в окне 10 минут и при отказе сервера.
//   node tools/check-notion-1310.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
const ok=(c, m)=>{ if(!c) out.fails.push(m); };
try{
  // (1) сборная → люди
  const w=ccMoneyWho('Польша (Darm, demus, Pixx, FRANEK)');
  ok(w.join('|')==='Darm|demus|Pixx|FRANEK', 'сборная не режется на людей: '+w.join('|'));
  ok(ccMoneyWho('Malibuca & vic0').join('|')==='Malibuca|vic0', 'дуо режется не так');
  ok(ccMoneyWho('Peterbot').join('|')==='Peterbot', 'соло режется не так');
  CAREER={player:{nick:'me'}, career:{season:3, day:'2026-05-01', money:{named:1, rows:{
    'США (Curve, Peterbot, Ritual, Clix)':{usd:4000000, events:2, yr:{'3':4000000}, fs:{'3:S40':4000000}},
    'Peterbot':{usd:1000, events:5, yr:{'3':1000}, fs:{}} }}}};
  const m=careerMoney();
  ok(!Object.keys(m.rows).some(k=>k.indexOf('(')>=0), 'строка сборной осталась после миграции');
  ok(m.rows.Peterbot && m.rows.Peterbot.usd===1001000 && m.rows.Peterbot.events===7, 'Peterbot после миграции: '+JSON.stringify(m.rows.Peterbot));
  ok(m.rows.Clix && m.rows.Clix.yr['3']===1000000, 'Clix год: '+JSON.stringify(m.rows.Clix));
  // (2) элимы своей долей
  const pool=PLAYERS.filter(p=>p && p.handle && p.rating>=85).slice(0, 400);
  const a=pool[0], b=pool.find(p=>hKey(p)!==hKey(a));
  const mk=(sq, el, you)=>({squad:sq, isYou:!!you, mstats:{games:6, elims:el, dmgTo:el*180, dmgFrom:el*90, assists:el, timeAlive:900, inStorm:30, dist:4000, wood:500, stone:300, metal:200}});
  const t1=mk([a,b], 20, false), rest=[]; for(let i=0;i<10;i++) rest.push(mk([pool[2+i*2], pool[3+i*2]], 8+i, false));
  const ranked=[t1].concat(rest);
  ok(ccStatLeaders(ranked).length>=4, 'доска лидеров пустая');
  const met=ccStatMetrics().find(x=>x.key==='s_elims'), got=met.val(t1.mstats, t1);
  const sp=ccStatSeat(t1), share=ZoneReplay.killShare(20, sp.w, sp.seat);
  ok(got===share, 'элимы в статистике: '+got+' против доли в катке '+share);
  ok(share!==10 || Math.abs(sp.w[0]-sp.w[1])<1e-9, 'доля ровно половина при разных весах');
  out.notes.elims={team:20, face:share, weights:sp.w.map(v=>+v.toFixed(2))};
  // (3) таблица сайта
  CAREER={player:{nick:'me'}, career:{season:1, board:{id:'abcdefabcdefabcdef', off:true}}};
  CC_BOARD_DATA={total:3, rows:[{nick:'FLC sharko', region:'EU', country:'ru', seasons:19, earn:7289537, titles:3, ovr:99, div:1, best:'1/50'},
    {nick:'FLC sharko', region:'EU', country:'ru', seasons:19, earn:7289537, titles:3, ovr:99, div:1, best:'1/50'},
    {nick:'iron', region:'EU', country:'de', seasons:10, earn:100, titles:0, ovr:90, div:1, best:''}], _for:'abcdefabcdefabcdef', _at:Date.now()};
  const h=careerWorldHTML();
  ok((h.match(/FLC sharko/g)||[]).length===1, 'FLC sharko дважды');
  ok(h.indexOf(L().lbHidden)>=0 && /lb-you[^>]*>[^<]*<button[^>]*ccBoardToggle/.test(h), 'скрытая карьера без кнопки');
}catch(e){ out.fails.push(String(e.stack||e)); }
// (4) «таблица не обновляется уже как день» (0:41): перечитка, ключ только после принятой строки, повтор в окне
(async()=>{ try{
  const tick=()=>new Promise(r=>setTimeout(r, 30));
  let gets=0, posts=0, reply={ok:true};
  window.fetch=(u, o)=>{ if(o && o.method==='POST'){ posts++; return reply==='down' ? Promise.reject(new Error('down')) : Promise.resolve({ok:true, json:()=>Promise.resolve(reply)}); }
    gets++; return Promise.resolve({ok:true, json:()=>Promise.resolve({total:0, rows:[]})}); };
  MP.host='ws://board.test';
  CH_TAB='nope';
  const id='abcdefabcdefabcdef';
  CAREER={player:{nick:'me', country:'DE', ovr:70}, career:{season:2, earnings:1000, division:3, log:[], board:{id:id}}};
  CC_BOARD_DATA={total:0, rows:[{nick:'old', region:'EU', country:'de', seasons:1, earn:5, titles:0, ovr:50, div:5, best:''}], _for:id, _at:Date.now()-3600000};
  let h=careerWorldHTML(); await tick(); await tick();
  ok(/old/.test(h), 'старая таблица пропала на время перечитки');
  ok(gets===1, 'таблица часовой давности не перечитана при открытии: GET='+gets);
  gets=0; CC_BOARD_DATA={total:0, rows:[], _for:'zzzzzzzzzzzzzzzzzz', _at:Date.now()};
  h=careerWorldHTML(); await tick(); await tick();
  ok(gets===1 && h.indexOf(L().lbLoad)>=0, 'таблица чужой карьеры показана своей');
  const b=CAREER.career.board;
  b.key=null; b.sent=0; reply={ok:true, skip:'gap'};
  await ccBoardSend(false);
  ok(!b.key, 'ключ записан при ответе сервера «рано»');
  ok(CC_BOARD_T!=null, 'после «рано» нет повтора');
  b.sent=0; reply='down';
  await ccBoardSend(false);
  ok(!b.key, 'ключ записан при упавшем запросе');
  b.sent=0; reply={ok:true};
  await ccBoardSend(false);
  ok(!!b.key, 'принятая строка без ключа');
  CC_BOARD_T=null; CAREER.career.earnings=2000; const p0=posts;
  await ccBoardSend(false);
  ok(posts===p0 && CC_BOARD_T!=null, 'в 10-минутном окне строка потерялась без повтора');
  clearTimeout(CC_BOARD_T);
  out.notes.board={posts:posts};
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; })(); }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'n1310-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--user-data-dir=' + path.join(dir, 'u'), '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const mm = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!mm) { console.log('FAIL нет ответа'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(mm[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK Notion 13.10 ' + JSON.stringify(out.notes));
