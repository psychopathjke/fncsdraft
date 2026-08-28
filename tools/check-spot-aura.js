// Аура и правда отгоняет людей от твоей точки.
//
// Его вопрос, 25 августа: «почему на локации всегда по 2 команды у игрока?» —
// и его же догадка: «чем больше аура, тем не падать должны люди». Замер
// подтвердил вопрос и опроверг механику: сосед был ровно один при ЛЮБОЙ ауре,
// включая полную. Причин было две.
//
// Первая: у ботов с 24 августа есть свои дома (ccBotHome), и свободный дом
// брался безусловно — а дом бота совпадает с домом игрока примерно в трёх
// случаях из четырёх (36 коробок, 49 команд). Сосед приходил этой дорогой,
// мимо всякого страха.
//
// Вторая: цена. Сесть вторым к кому-то стоит CONTEST_COST = 2.4, а полная аура
// при старом весе 0.55 стоила 2.4·0.55·0.5 = 0.66 — вчетверо дешевле, так что
// обходить точку было незачем. Старая развёртка (та, что дала 0.55) считала по
// сорок команд на остров, где четыре двойки и обойти легко; вечер, который
// играют, — пятьдесят команд и четырнадцать двоек.
//
// Проверяется то, что видит игрок: пустой дом при полной ауре и полный при
// нулевой. Контроль — та же комната с выключенным страхом: там дом занят
// всегда, иначе проверка мерила бы просто «на острове много места».
//
//   node tools/check-spot-aura.js
const fs=require('fs'), os=require('os'), path=require('path');
const {execFileSync}=require('child_process');
const ROOT=path.resolve(__dirname, '..');
const RUNS=+(process.argv[2]||30);
const CHROME=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p));
if(!CHROME) throw new Error('Chrome not found');

const HEAD=`<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT=`
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const RUNS=${RUNS};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Aura', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    skipAnimation=true; CC_SKIP_RUN=true;
    const cr=CAREER.career, me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const set=ACTIVE_LANDING_SET;
    // Дом на средней по жирности коробке: иначе замер поедет от лута.
    const byPts=ALL_LANDING_ZONES.map((z,i)=>({i:i, p:z.points||0})).sort((a,b)=>a.p-b.p);
    careerSpotSet(byPts[Math.floor(byPts.length/2)].i, set);

    const run=(aura, noFear, weakYou)=>{
      const list=careerSpotList(set);
      if(list && list.length) list[0].aura=aura;
      let sum=0, alone=0, shared=0, total=0;
      for(let r=0;r<RUNS;r++){
        const you=careerYouTeam([me]); you.isYou=true; you.name='you';
        // Слабый хозяин: страх гаснет по разрыву сил, и комната сильнее его
        // не боится вовсе — этим и проверяется, что дверь не заварена.
        if(weakYou) you.pow=60;
        // Соль своя на каждый вечер: без неё поле одно и то же, и «тридцать
        // прогонов» оказываются одним вечером, повторённым тридцать раз.
        const field=[you, ...careerCupField(cr, [me], ccTeams(50), 'aura'+r, false, 0)];
        careerSpotFearOn(you);
        if(noFear) CC_SPOT_FEAR_MAP=null;      // контроль: страха нет вовсе
        const g=buildBotLandingAssignment(field.filter(t=>t!==you)).zoneGroups;
        careerSpotFearOff();
        const on=(g.get(careerSpotZone(set))||[]).length;
        sum+=on; if(!on) alone++;
        g.forEach(l=>{ total+=l.length; if(l.length>1) shared+=l.length; });
      }
      return {соседей:Math.round(sum/RUNS*100)/100, одному:Math.round(alone/RUNS*100),
              делят:Math.round(shared/total*100)};
    };

    const none=run(0), full=run(CC_SPOT_AURA_MAX), ctrl=run(CC_SPOT_AURA_MAX, true);
    out.notes['аура 0']=none; out.notes['аура полная']=full; out.notes['контроль без страха']=ctrl;

    check('без ауры к тебе садятся', none.соседей>=1 && none.одному<=10,
          none.соседей+' соседей, один в '+none.одному+'% вечеров');
    check('при полной ауре точка чаще всего твоя', full.одному>=60,
          'один в '+full.одному+'% вечеров');
    /* И на полной ауре — НАГЛУХО. Его правка, 26 августа: «может ауру нужно
       больше сделать, чтоб при каком-то лимите не могли вообще люди летать».
       Раньше здесь стояла обратная проверка: хозяину давали силу 60 против
       комнаты в сотню, страх гаснет по разрыву сил — и точку занимали, какая бы
       ни была репутация. Теперь у шкалы есть конец: потолок ауры вешает на
       коробку замок (CC_SPOT_LOCK_ZONES), и разрыв сил его не открывает.
       Слабый хозяин здесь и проверяет именно это: не «страх дорогой», а
       «коробки нет в списке». */
    const weak=run(CC_SPOT_AURA_MAX, false, true);
    out.notes['полная аура, слабый хозяин']=weak;
    check('на полной ауре не садится никто, даже сильнее хозяина', weak.одному>=100,
          'один в '+weak.одному+'% вечеров');
    /* А до потолка замка нет, и это не мелочь: иначе «закрыто» начиналось бы
       раньше, чем игрок дофармил, и вся шкала превратилась бы в кнопку. На
       девятке та же слабая карьера точку не удерживает. */
    const near=run(CC_SPOT_AURA_MAX-1, false, true);
    out.notes['аура на единицу ниже, слабый хозяин']=near;
    check('на единицу ниже потолка — цена, а не замок', near.одному<=20,
          'один в '+near.одному+'% вечеров');
    check('контроль: без страха дом занят всегда', ctrl.одному<=5,
          'один в '+ctrl.одному+'% вечеров');
    /* Комната от этого не должна перекоситься: одна двойка переезжает на другую
       коробку, доля делящих откалибрована (53%) и держится в пределах пяти
       пунктов — тем же порогом, что и у check-bot-homes. */
    check('доля делящих коробку не сдвинулась', Math.abs(full.делят-none.делят)<=5,
          none.делят+'% → '+full.делят+'%');
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccaura-'));
const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp,'<base href="file:///'+ROOT.split(path.sep).join('/')+'/">'+HEAD+
  fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
 '--virtual-time-budget=900000','--dump-dom','file:///'+tmp.split(path.sep).join('/')],
 {maxBuffer:512*1024*1024,encoding:'utf8',stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});

const m=dom.match(/BEGIN([\s\S]*?)END/);
if(!m){ console.error('проба ничего не вернула'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log(s));
console.log('  '+JSON.stringify(out.notes));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
if((out.errs||[]).length) console.error('page errors: '+out.errs.join(' | '));
if(out.fails.length) process.exit(1);
console.log('аура отгоняет людей от твоей точки');
