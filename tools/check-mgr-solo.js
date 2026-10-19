/* Соло-кап клубом (Notion «19.10», скрины 39–40: «соло кеш кап не работает. он регает, будто бы турнир в трио проходит,
   а мои игроки там даже не участвуют»). mgrPlay брал размер из {duo, trio, squad} без solo — на соло-кап выходил пустой
   размер, и клуб играл своими тройками. В трио-год клуб на Solo Cash Cup выходит каждым игроком сам за себя.
   Запуск: node tools/check-mgr-solo.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
['fncsdraft_manager','fncsdraft_manager_active'].forEach(k=>localStorage.removeItem(k));
LANG='ru';
MGR_NEW_YEAR=2021; MGR_NEW_REGION='EU'; MGR_NEW_SIDE='real'; mgrOpenNew(2021);
mgrTake(0); MGR.view='result';
const evs=mgrEvents(), ev=evs.find(e=>e.mode==='solo');
check('трио-год', careerSquadSize()===3, careerSquadSize());
check('в календаре клуба есть соло-кап', !!ev);
if(ev){
  notes.ev=ev.name+' '+ev.day;
  MGR.skipped=(MGR.skipped||[]).concat(evs.filter(e=>e.day<ev.day || (e.day===ev.day && e!==ev && e.mode!=='solo')).map(e=>e.id+'|'+e.day));
  MGR.wfrom=ev.day; mgrAdvanceTo(ev.day);
  check('следующий вечер клуба — соло-кап', (mgrEvents()[0]||{}).mode==='solo');
  // Академия на кап выходит тоже (mgrAcadTeams, отзыв «academy players participate in competitions»): кладём троих со сцены.
  MGR.academy=(ccSceneRoster('EU')||[]).filter(c=>c && !mgrAll().some(h=>hKey(h)===hKey(c))).slice(-3).map(c=>c.handle).filter(h=>!!mgrCard(h));
  const players=MGR.teams.flatMap(t=>t.cards).length+(MGR.academy||[]).length;
  notes.acad=(MGR.academy||[]).length;
  MGR_SIM_MODE=true; skipAnimation=true; CC_SKIP_RUN=true;
  let done=false; mgrPlay().then(()=>done=true, e=>{ fails.push(String(e.stack||e)); done=true; });
  // Окно «за кого смотреть» и высадка — первым вариантом, как нажал бы человек.
  for(let i=0;i<600 && !done;i++){ const b=document.querySelector('.mgq-pick button, .landing-picker .land-zone, .cc-choice-btn'); if(b) b.click();
    const c=document.querySelector('#gameLandingConfirm'); if(c && !c.disabled) c.click(); await new Promise(r=>setTimeout(r, 300)); }
  check('вечер доигран', done);
  const row=(MGR.log||[]).find(r=>r.kind==='night' && r.day===ev.day);
  notes.rows=row && row.teams.map(t=>t.name+' #'+t.place+'/'+t.of);
  check('строки клуба — по одному игроку', row && row.teams.every(t=>String(t.name).indexOf(' & ')<0), notes.rows && notes.rows.join(' | '));
  check('вышли все игроки клуба', row && row.teams.length===players, row && (row.teams.length+' / '+players));
  check('академия в строках вечера', !notes.acad || (row && row.teams.filter(t=>String(t.id).indexOf('acad:')===0).length===notes.acad), row && row.teams.map(t=>t.id).join(','));
  const res=(MGR.results||[]).find(r=>r.day===ev.day && r.played);
  check('таблица капа — одиночки', res && res.rows.slice(0,20).every(x=>x.n.indexOf(' & ')<0), res && res.rows[0].n);
  check('наши в таблице', res && res.rows.some(x=>x.mine));
}
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'msolo-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '800000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-mgr-solo'); process.exit(res.fails.length?1:0);
