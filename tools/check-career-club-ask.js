/* «Позвать в клуб» — через менеджера, а не в один клик (его слово 19.10).
   1) Кнопка пишет в личку: менеджеру (или клубу, если менеджера нет), он отвечает «поговорю»; клуб напарника не меняется сразу.
   2) Пока идут переговоры, вторая просьба не уходит, на карточке — «договаривается».
   3) В день итога: сильный напарник подписан (r.org, пост, письмо), слабому — отказ письмом и пауза CC_CLUB_ASK_COOL.
   Запуск: node tools/check-career-club-ask.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const pl={nick:'Asker', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const run=(mateOvr, withAgent)=>{
  const mate={card:{handle:'Queasy', region:'EU', rating:mateOvr, _ovr:mateOvr, nat:'de', tier:'ladder', event:'ladder'}, patience:60, since:'2026-01-01', dev:0};
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
    career:{season:1, size:2, year:2026, year0:2026, day:'2026-03-02', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'ca'},
    partners:[mate], org:{name:'Team Vitality', tier:90, salary:3000}}));
  careerLoad();
  if(withAgent && typeof CC_AGENTS!=='undefined' && CC_AGENTS[0]) CAREER.agent={name:CC_AGENTS[0].name, cut:0.1, reach:2};
  const r=careerMateRecords()[0];
  ccOrgBringMate('Queasy', careerSquadSize());
  const a=(CAREER.clubAsks||[])[0];
  const t=withAgent ? ccAgentThreadOf(CAREER.agent.name) : careerDmFind('Team Vitality');
  const msgs=t ? t.msgs.map(m=>m.from+':'+m.k) : [];
  const out={asked:!!a, due:a && a.due, msgs, orgNow:r.org||null};
  ccOrgBringMate('Queasy', careerSquadSize());
  out.asks=(CAREER.clubAsks||[]).length;
  careerAdvanceTo(ccAddDays(a ? a.due : careerToday(), -1)); out.orgBefore=r.org||null;
  careerAdvanceTo(a ? a.due : careerToday());
  out.orgAfter=careerMateRecords()[0].org||null;
  out.last=t ? t.msgs[t.msgs.length-1].k : null;
  out.lastText=t ? (()=>{ const m=t.msgs[t.msgs.length-1]; const f=L()[m.k]; return typeof f==='function' ? f.apply(null, m.a) : f; })() : null;
  out.left=(CAREER.clubAsks||[]).length;
  out.cool=ccClubAskNoUntil('Queasy', 'Team Vitality');
  return out;
};
const good=run(95, true); notes.good=good;
check('просьба записана', good.asked);
check('в личке: я пишу менеджеру, он отвечает', good.msgs.length===2 && /^me:dmClubAskMe/.test(good.msgs[0]) && /^them:dmClubAskOk/.test(good.msgs[1]), good.msgs.join(' '));
check('клуб сразу не меняется', !good.orgNow, good.orgNow);
check('второй клик не шлёт вторую просьбу', good.asks===1, good.asks);
check('до дня итога — без клуба', !good.orgBefore, good.orgBefore);
check('в день итога сильного взяли', good.orgAfter==='Team Vitality', good.orgAfter);
check('итог — письмом менеджера', /^dmClubAskYes/.test(good.last||''), good.last);
check('просьба закрыта', good.left===0, good.left);
const weak=run(70, false); notes.weak=weak;
check('без менеджера — пишу клубу', /^me:dmClubAskMeOrg/.test(weak.msgs[0]||'') && /^them:dmClubAskOrgOk/.test(weak.msgs[1]||''), weak.msgs.join(' '));
check('слабого не взяли', !weak.orgAfter, weak.orgAfter);
check('отказ письмом клуба', /^dmClubAskOrgNo/.test(weak.last||''), weak.last);
check('пауза после отказа', !!weak.cool, weak.cool);
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cask-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-club-ask'); process.exit(res.fails.length?1:0);
