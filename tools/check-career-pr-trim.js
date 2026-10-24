/* PR в длинной карьере (Notion «24.10.26», 2035: «самому себе PR не зачисляются или очень слабо, а тиммейты на первом
   месте по PR и в некст главе ты не можешь им предложить играть»).
   1) Строка, набравшая 200 результатов, берёт новый вечер: хвост режется по цене сегодня, а не по сырому рейтингу.
   2) Бывший тиммейт (cr.exMates) зовётся без порога PR; чужой с порогом выше твоего PR — нет.
   Запуск: node tools/check-career-pr-trim.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const pl={nick:'Trm', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:10, size:2, year:2026, year0:2026, day:'2026-05-01', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'tr'},
  partners:[]})); careerLoad();
const cr=CAREER.career, now=ccAbsDay(cr.season, careerToday());
// Двести сильных вечеров позапрошлого года: затухание их уже обнулило (старше 540 дней).
const t=careerPrTally();
t.rows.Trm={v:Array.from({length:CC_PR_KEEP}, (_, i)=>[5000, now-600-i]), n:CC_PR_KEEP, you:true};
const before=careerPrOf(t.rows.Trm);
t.rows.Trm.v.push([800, now]); ccPrRowTrim(t.rows.Trm);
const after=careerPrOf(t.rows.Trm);
notes.before=before; notes.after=after;
check('свежий вечер не выпал из полной строки', after>=800 && t.rows.Trm.v.length===CC_PR_KEEP, before+' → '+after);
// Свежие сильнее старых: из полной строки уходит самый дешёвый сегодня.
t.rows.X={v:Array.from({length:CC_PR_KEEP}, (_, i)=>[1000, now-10]), n:CC_PR_KEEP};
t.rows.X.v.push([3000, now-700]); ccPrRowTrim(t.rows.X);
check('обнулённый старый уходит первым', !t.rows.X.v.some(e=>e[1]===now-700));
// Объявления.
const ad={day:careerToday(), div:1, handle:'Queasy', want:'roleFRG', pr:10*1000*1000};
check('чужой с высоким порогом не проходит', !ccAdFits(ad));
cr.exMates={}; cr.exMates[hKey({handle:'Queasy'})]='2026-01-10';
check('бывший тиммейт проходит без порога', ccAdFits(ad));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'cpt-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log(JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('  FAIL '+f));
console.log(res.fails.length ? res.fails.length+' failing' : 'ok');
process.exit(res.fails.length ? 1 : 0);
