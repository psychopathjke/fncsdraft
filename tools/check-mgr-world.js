// Весь мир менеджера — нашей симуляцией (его слова 8.10: «чтоб все капы можно было смотреть, симулировать, чтоб листать
// таблицу — наши игроки показывались, чтоб перемотка в календаре работала как симуляция в карьере игрока, чтоб все таблицы,
// хиты и т. д. зависели от нашей симуляции»; «медиа, чтоб можно было смотреть за миром — посты игроков»).
//   node tools/check-mgr-world.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(async ()=>{ const out={fails:[], notes:{}, errs:[]};
const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!=null ? ': '+d : '')); };
const ce=console.error; console.error=(...a)=>{ out.errs.push(a.map(x=>String(x && x.stack || x)).join(' ').slice(0,300)); ce.apply(console, a); };
try{
  ['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
  LANG='ru';
  MGR_NEW_YEAR=2024; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2024);
  const fi=MGR_NEW_LIST.findIndex(c=>c.name==='Team Falcons'); mgrTake(fi>=0 ? fi : 0); MGR.view='result';
  const d0=CAREER.career.day, target=ccAddDays(d0, 30);
  const wEv=mgrWorldEvents(d0, target);
  out.notes.window={d0, target, events:wEv.length, modes:[...new Set(wEv.map(e=>e.mode))]};
  // перемотка: каждый кап окна сыгран движком
  let guard=0; while(CAREER.career.day<target && guard++<10) mgrFastForward(target);
  document.querySelectorAll('.mgq-ff').forEach(x=>x.remove());
  const notDone=wEv.filter(e=>!mgrWorldDone(e) && !(MGR.log||[]).some(r=>r.day===e.day && r.name===e.name));
  check('перемотка: все капы окна сыграны', !notDone.length, notDone.map(e=>e.id+' '+e.day).slice(0,5).join(', '));
  const res=(MGR.results||[]).filter(r=>r.year===MGR.year);
  out.notes.results=res.length;
  check('таблиц не меньше, чем капов', res.length>=wEv.length, res.length+' / '+wEv.length);
  check('соло-капы тоже играются', !wEv.some(e=>e.mode==='solo') || res.some(r=>r.mode==='solo'));
  const soloRes=res.find(r=>r.mode==='solo');
  check('соло-кап — одиночки, а не пары', !soloRes || soloRes.rows.slice(0,20).every(x=>x.n.indexOf(' & ')<0), soloRes && soloRes.rows[0].n);
  check('соло-кап называется соло', !soloRes || soloRes.name.indexOf(L().calVictorySolo)===0, soloRes && soloRes.name);
  const eng=res.filter(r=>r.rows.slice(0, 10).every(x=>x.pts!=null && x.pts>0));
  check('таблицы из движка: у верха очки', eng.length===res.length, eng.length+' / '+res.length);
  check('места по возрастанию', res.every(r=>r.rows.every((x,i)=>i===0 ? x.place===1 : x.place>r.rows[i-1].place)));
  check('рейтинг клубов', mgrClubTable().length>=5 && mgrClubTable()[0].prize>0, mgrClubTable().length);
  const pp=(MGR.wfeed||[]).filter(p=>p.kind==='p');
  out.notes.posts=pp.length; out.notes.post=pp[0] && pp[0].text;
  check('медиа: посты игроков', pp.length>=wEv.length && pp.some(p=>p.photo), pp.length);
  MGR_SUB.inbox='world'; mgrRenderHub('inbox');
  check('медиа: аватарки игроков на экране', document.querySelectorAll('#mgBody .mgp-player .mgp-pl').length>=3);
  MGR_SUB.tables='events'; mgrRenderHub('tables');
  check('таблицы: прокрутка, а не 25 строк', document.querySelectorAll('#mgBody .mgw-scroll').length>=1);
  const mineRes=res.find(r=>r.rows.some(x=>x.mine));
  check('наши строки в таблицах подсвечены', !mineRes || document.querySelectorAll('#mgBody tr.mine').length>=1);
  check('кнопка «К нашим»', !mineRes || document.querySelectorAll('#mgBody .mgw-jump').length>=1);
  // Центр: плитка «Турниры мира» со «Смотреть / Симулировать»
  mgrRenderHub('centre');
  const btns=[...document.querySelectorAll('#mgBody .mfc-sched .mfc-srow button')];
  const wk=mgrWorldEvents(CAREER.career.day, ccAddDays(CAREER.career.day, 7)).filter(e=>!mgrWorldDone(e) && !mgrEvents().some(c=>c.id===e.id && c.day===e.day));
  check('Центр: расписание недели с «смотреть / симулировать»', !wk.length || (btns.some(b=>/mgrWatchWorld/.test(b.getAttribute('onclick'))) && btns.some(b=>/mgrSimWorld/.test(b.getAttribute('onclick')))), btns.length+' / '+wk.length);
  // Симулировать
  const club=new Set(mgrEvents().map(e=>e.id+'|'+e.day));
  const nxt=mgrWorldEvents(CAREER.career.day, ccYearTo()).filter(e=>!mgrWorldDone(e) && !club.has(e.id+'|'+e.day));
  if(nxt[0]){ for(let i=0;i<3 && !mgrWorldDone(nxt[0]);i++) await mgrSimWorld(nxt[0].id+'|'+nxt[0].day);   // дедлайн трансферов останавливает перемотку — второе нажатие продолжает
    check('«Симулировать» — сыгран и в таблицах', mgrWorldDone(nxt[0]) && MGR.results.some(r=>r.day===nxt[0].day && r.id===nxt[0].id), JSON.stringify({ev:nxt[0].id, day:nxt[0].day, today:CAREER.career.day, done:mgrWorldDone(nxt[0]), top:MGR.results.slice(0,3).map(r=>r.id+' '+r.day)})); }
  // Смотреть
  const nx2=mgrWorldEvents(CAREER.career.day, ccYearTo()).filter(e=>!mgrWorldDone(e) && !mgrEvents().some(c=>c.id===e.id && c.day===e.day))[0];
  if(nx2){ for(let i=0;i<3 && !mgrWorldDone(nx2);i++) await mgrWatchWorld(nx2.id+'|'+nx2.day);
    check('«Смотреть» — кап сыгран', mgrWorldDone(nx2), nx2.id);
    check('«Смотреть» — экран вечера с кнопкой назад', !!document.querySelector('#majorStages .mg-report button'));
    mgrAfterWatch(); check('после просмотра — таблицы', MGR_TAB==='tables'); }
  // матчевый день сперва доигрывает мир до своего дня
  const ce2=mgrEvents()[0];
  if(ce2){ await mgrWorldCatchUpLive(ce2.day); check('перед матчевым днём мир доигран', !mgrWorldPending(ce2.day).length); }
  // сейв: большой — сразу сжатым, читается обратно без потерь
  { const big=JSON.stringify(MGR); mgrSave(); const st=localStorage.getItem(MGR_LS_SLOT(mgrSlot()))||'';
    out.notes.save=big.length+' → '+st.length;
    check('сейв больше порога — в LZ', big.length<=MGR_SAVE_LZ_FROM || st.slice(0,3)===CC_SAVE_LZ, out.notes.save);
    check('сейв читается обратно', JSON.stringify(ccSaveParse(st))===big); }
  check('без ошибок', !out.errs.length, out.errs.slice(0,3).join(' | '));
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mworld-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=1200000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/@@B@@([^@<]*)@@E@@/);
if (!m) { console.log('FAIL нет ответа (зависло?)'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK мир менеджера ' + JSON.stringify(out.notes));
