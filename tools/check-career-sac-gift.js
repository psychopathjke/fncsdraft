/* Код автора и подарки из Item Shop (его выбор 20.10).
   1) Чужой код: 5% покупок V-Bucks идут креатору (счётчик), смена/снятие кода.
   2) Свой код: заперт до 1000 подписчиков; с ними 1-го числа приходит выплата и пост.
   3) Подарок: V-Bucks списаны, у напарника +терпение, «спасибо» в личку, второй раз тот же предмет ему же — нельзя.
   Запуск: node tools/check-career-sac-gift.js */
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const body=String.raw`
const fails=[], notes={};
const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
await new Promise(res=>ccFnShopLoad(res));
const pl={nick:'Gifter', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:ccRookieAttrs(88,'roleIGL'), ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null};
const mate={card:{handle:'Queasy', region:'EU', rating:90, _ovr:90, nat:'de', tier:'ladder', event:'ladder'}, patience:50, since:'2026-01-01', dev:0};
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1, player:pl,
  career:{season:1, size:2, year:2026, year0:2026, day:'2026-03-20', division:1, earnings:0, balance:100, reach:500, tokens:[], log:[], news:[], seed:'sg'},
  partners:[mate], vb:20000}));
careerLoad();
const list=ccFnShopDay(careerToday())||[];
check('витрина дня есть', list.length>3, list.length);
const cs=ccSacCreators(); notes.creators=cs.length+' · '+(cs[0]||{}).name;
check('креаторы для кода есть', cs.length>=10, cs.length);
ccSacSet(cs[0].name);
const it=list[0], price=ccFnPrice(it);
ccFnBuy(it.i);
check('покупка прошла', !!ccFnOwn()[it.id]);
check('без благодарностей в ленте', !(CAREER.career.news||[]).some(n=>n.k==='ccNewsSacThanks'));
check('5% — креатору', CAREER.sac.vb===Math.round(price*0.05), CAREER.sac.vb+' / '+price);
// свой код
check('свой код заперт до 1000', !ccSacOwnOn());
CAREER.career.reach=200000;
check('свой код открыт с 1000', ccSacOwnOn());
let balA=CAREER.career.balance; careerAdvanceTo('2026-03-31'); careerAdvanceTo('2026-04-02');
check('без созданного кода — без выплат', CAREER.career.balance===balA, balA+' → '+CAREER.career.balance);
careerRenderHub('items'); check('кнопка «создать код»', !!document.querySelector('#chBody .cc-sac-mk button'));
ccSacCreate(); notes.code=ccSacOwnCode();
check('код создан по нику', ccSacOwnCode()==='GIFTER', ccSacOwnCode());
const bal0=CAREER.career.balance;
careerAdvanceTo('2026-05-02');
notes.paid=Math.round((CAREER.career.balance-bal0)*100)/100;
check('1-го числа выплата за код', CAREER.career.balance>bal0 && (CAREER.career.news||[]).some(n=>n.k==='ccNewsSacPaid'), notes.paid);
// подарок
const today=ccFnShopDay(careerToday())||[];
const g=today.find(x=>!ccFnOwn()[x.id]); const vb0=CAREER.vb, pat0=careerMateRecords()[0].patience;
ccFnGift(g.i, 'Queasy');
check('V-Bucks списаны за подарок', CAREER.vb===vb0-ccFnPrice(g), vb0+' → '+CAREER.vb);
check('у напарника выросло терпение', careerMateRecords()[0].patience===Math.min(100, pat0+8), pat0+' → '+careerMateRecords()[0].patience);
const t=careerMateThread(); const last=t && t.msgs[t.msgs.length-1];
check('спасибо в личку', last && last.k.indexOf('dmGiftThanks')===0, last && last.k);
const vb1=CAREER.vb; ccFnGift(g.i, 'Queasy');
check('тот же подарок второй раз — нет', CAREER.vb===vb1);
check('подарок не лёг себе в шкафчик', !ccFnOwn()[g.id]);
// экран
careerRenderHub('items');
check('в магазине плитка кода автора', !!document.querySelector('#chBody .cc-sac'));
check('в магазине кнопка подарка', !!document.querySelector('#chBody .cc-fn-gift'));
return {fails, notes};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'csg-')),'body.js'); fs.writeFileSync(tmp, body);
const res=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '300000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']}));
if(res.err){ console.log('FAIL', res.err); process.exit(1); }
console.log('  '+JSON.stringify(res.notes));
res.fails.forEach(f=>console.log('FAIL '+f));
console.log(res.fails.length ? 'FAIL '+res.fails.length : 'OK check-career-sac-gift'); process.exit(res.fails.length?1:0);
