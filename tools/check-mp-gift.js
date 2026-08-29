// Подарок напарнику из магазина: даритель платит, вещь едет по проводу, настрой растёт у обоих.
//
// Его слово, 29 августа: «в магазине можно было в подарок купить что-то тимейту —
// купить для себя и рядом кнопка в подарок; и настрой может поднимать».
//
//   node tools/check-mp-gift.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Nexty', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-03', division:1, earnings:0, balance:50000, reach:0, tokens:[], log:[], news:[], seed:'gf'},
      partners:[]}));
    careerLoad();
    MP.connect=function(){ MP.state='live'; return Promise.resolve(); };
    const sent=[];
    MP.send=function(m){ if(m && m.t==='act'){ sent.push(m); MP.say({t:'act', kind:m.kind, by:ccMpId(), n:sent.length, payload:Object.assign({}, m.payload||{})}); } };
    await ccMpEnter({code:'GIFT01', role:'a'});
    MP.peer={handle:'zzz', nat:'ru', region:'EU', rating:90, _targetOvr:90, _attrs:null, _roleKey:'roleFRG', gear:[]};
    CAREER.career.chemSince=careerToday();
    const item=CC_SHOP.find(x=>!x.days && x.cost<=20000 && x.slot);
    check('есть вещь для подарка', !!item);
    const html=careerShopHTML();
    check('в магазине кнопка «в подарок»', html.indexOf("careerGift('"+item.id+"')")>=0);
    const mood0=careerPatience(), bal0=CAREER.career.balance;
    // 1. Подарок: платим, шлём, запись в команде, настрой вырос.
    check('подарок ушёл', careerGift(item.id)===true);
    check('деньги списаны', CAREER.career.balance===bal0-item.cost, CAREER.career.balance+' / '+(bal0-item.cost));
    check('по проводу — gift', sent.some(m=>m.kind==='gift' && m.payload.item===item.id));
    check('запись в командном состоянии', Array.isArray(CAREER.career.gifts) && CAREER.career.gifts.length===1 && CAREER.career.gifts[0].item===item.id);
    check('gifts — ключ команды', CC_TEAM_KEYS.indexOf('gifts')>=0);
    check('настрой вырос', careerPatience()>mood0, mood0+' -> '+careerPatience());
    check('себе вещь не легла', !careerOwns(item.id));
    check('напарнику она теперь есть', ccPeerOwns(item.id));
    check('второй раз тот же подарок не уходит', careerGift(item.id)===false);
    check('в магазине теперь «у напарника есть»', careerShopHTML().indexOf(L().ccGiftHas)>=0);
    // 2. Подарок от напарника: вещь ложится на стол без оплаты.
    const other=CC_SHOP.find(x=>!x.days && x.slot && x.id!==item.id && x.slot!==item.slot);
    const bal1=CAREER.career.balance;
    MP.say({t:'act', kind:'gift', by:'peer', n:9, payload:{by:'peer', item:other.id, day:careerToday()}});
    check('подарок напарника лёг на стол', careerOwns(other.id));
    check('и бесплатно', CAREER.career.balance===bal1);
    // 3. Настрой от подарка тает за месяц.
    const gm=ccGiftMood();
    check('прибавка от подарка есть', gm>0, String(gm));
    CAREER.career.day=ccAddDays(careerToday(), 31);
    check('через месяц прибавка от подарка ушла', ccGiftMood()===0, String(ccGiftMood()));
    // 4. Одиночная: кнопки подарка нет.
    delete CAREER.career.mp;
    check('в одиночной кнопки нет', careerShopHTML().indexOf('careerGift(')<0);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccgift-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('подарок напарнику: платит даритель, вещь едет по проводу, настрой растёт у обоих и тает за месяц');
