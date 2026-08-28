// Снимок карточки вечера в хабе карьеры: куда садимся, кто играет, кнопка.
//
// Три строки над кнопкой «играть» решают, с чем игрок входит в вечер, и
// проверять их глазами надо вместе — по отдельности каждая выглядит разумно, а
// в столбик они могут не сойтись.
//
//   node tools/shot-career-card.js
// Кладёт shot-career-card.png рядом с репозиторием.
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.SHOT_DIR || ROOT;
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<script>
(function(){
  try{
    // День с турниром, напарник на месте и дом на сезонном острове — иначе
    // карточка показывает «пропустить», и смотреть на ней нечего.
    const days=careerYearDays();
    let day=null;
    for(let d=CC_YEAR_FROM; d<=CC_YEAR_TO; d=ccAddDays(d,1))
      if((days.get(d)||[]).some(e=>e.kind==='cup')){ day=d; break; }
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    if(!careerPartnerCard()){
      careerSeatTopUp();
      const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
      if(s) careerDmAccept(s.id);
    }
    useLandingSet(careerBrSet());
    careerSpotSet(4, careerBrSet());
    careerSpotList(careerBrSet())[0].aura=6;
    careerRenderHub('centre');
    // Кадр — сама карточка, а не весь хаб: она уезжает под сгиб, и снимок
    // страницы целиком показывал бы шапку сайта.
    const card=document.querySelector('#screen-career-hub .ch-grid-main .ch-art')
            || document.querySelector('#screen-career-hub .ch-art');
    /* Карточку НЕЛЬЗЯ вынимать из хаба ради кадра: половина её вида приходит
       правилами, привязанными к #screen-career-hub (скрим над артом, крупные
       цифры, жёлтая кнопка), и вынутая карточка на снимке разъезжается — это
       был бы дефект пробы, выданный за дефект экрана. Поэтому она остаётся на
       месте, а к ней подъезжает окно. */
    // block:'start' — верхний край карточки к верху окна; ниже неё в кадр
    // попадает ровно то, что стоит на ней самой.
    if(card) card.scrollIntoView({block:'start'});
    if(!card) throw new Error('карточки нет: hub='+
      !!document.getElementById('screen-career-hub')+
      ' art='+document.querySelectorAll('.ch-art').length+
      ' play='+document.querySelectorAll('.ch-play').length);
  }catch(e){
    // Ошибку видно на снимке, а не в заголовке вкладки: headless заголовок не
    // рисует, и упавшая проба выглядела бы как «карточка не изменилась».
    document.body.insertAdjacentHTML('beforeend',
      '<pre style="position:fixed;left:0;top:0;z-index:99999;margin:0;padding:12px;'+
      'background:#300;color:#fff;font:12px monospace;white-space:pre-wrap;width:100%">'+
      String(e && e.stack || e)+'</pre>');
  }
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cccard-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const out = path.join(OUT, 'shot-career-card.png');
execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--hide-scrollbars','--window-size=440,1040',
  '--run-all-compositor-stages-before-draw','--virtual-time-budget=20000',
  '--screenshot=' + out, 'file:///' + tmp.replace(/\\/g,'/')], {stdio:'ignore'});
fs.rmSync(dir, {recursive:true, force:true});
console.log('  ' + path.relative(ROOT, out));
