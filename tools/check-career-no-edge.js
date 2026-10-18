/* Прибавка за пинг и возраст выключается на экране создания (Notion «18.10», тестер: «хочу, чтобы у меня было
   столько рейтинга, сколько я сам сделал, а не +10 ещё»).
   С прибавкой: новичок 16 лет из Германии в EU — +6 пинг, +4 возраст. Без неё: в сейве и на карточке 0 и 0,
   рейтинг — ровно собранный, переезд ничего не даёт, день рождения прибавку не возвращает.
   Запуск: node tools/check-career-no-edge.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
for(const off of [false, true]){
  localStorage.clear(); CAREER=null;
  careerEntry(); ccPickRole('roleFRG'); ccPickRegion('EU'); ccPickCountry('de');
  const n=document.getElementById('ccNick'); n.value='Edge'+(off?'Off':'On'); n.dispatchEvent(new Event('input',{bubbles:true}));
  document.getElementById('ccAge').value='16';
  ccPickEdge(off); ccSync();
  const field=document.getElementById('ccEdgeField').style.display;
  document.getElementById('ccStart').click();
  const pl=CAREER.player, c=careerCard();
  const shown=Math.round(attrsFor(c).ovr+(c._pingEdge||0)+(c._ageEdge||0));
  const r={field, noEdge:!!pl.noEdge, save:[pl.closeRangeEdge, pl.ageEdge], card:[c._pingEdge, c._ageEdge], ovr:pl.ovr, shown,
    move:ccMoveGain('fr')};
  // Год прошёл — возраст +1, прибавка за возраст пересчитывается заново.
  pl.age=(pl.age||16)+1; pl.ageEdge=ccEdgeOff(pl) ? 0 : ccAgeEdge(pl.age);
  r.ageAfter=pl.ageEdge;
  notes[off?'off':'on']=r;
  check((off?'без':'с')+' прибавкой: выбор виден у своего игрока', field==='', field);
  if(off){
    check('без прибавки: в сейве 0 и 0', pl.noEdge===true && pl.closeRangeEdge===0 && pl.ageEdge===0, JSON.stringify(r));
    check('без прибавки: на карточке 0 и 0', !c._pingEdge && !c._ageEdge, JSON.stringify(r.card));
    check('без прибавки: рейтинг ровно собранный', shown===Math.round(attrsFor(c).ovr), shown+' / '+attrsFor(c).ovr);
    check('без прибавки: переезд ничего не даёт', r.move===0, String(r.move));
  } else {
    check('с прибавкой: пинг и возраст на карточке', c._pingEdge>0 && c._ageEdge>0, JSON.stringify(r.card));
  }
}
check('разница — и есть прибавка', notes.on.shown-notes.off.shown===Math.round(notes.on.card[0]+notes.on.card[1]), notes.on.shown+' vs '+notes.off.shown);
// Взятой карточке выбора нет.
localStorage.clear(); CAREER=null; careerEntry(); CC.mode='card'; ccRenderChips();
check('у взятой карточки выбора нет', document.getElementById('ccEdgeField').style.display==='none', document.getElementById('ccEdgeField').style.display);
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cne-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '600000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-no-edge'); process.exit(res.fails.length?1:0);
