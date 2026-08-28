// Клуб, о котором попросил игрок, доходит до почты.
//
// Его правка, 25 августа: «именно спросить, клуб который хочет игрок, например
// спирит, чтоб выбор был». Просьба «обойди клубы» была про всех сразу и ничем
// не отличалась от ожидания; адресная — это решение, и решение обязано что-то
// менять.
//
// Проверяется цепочка целиком: список клубов, до которых менеджер дотягивается
// (careerPitchClubs), ответ клуба в диалоге (careerAgentPitch), и — главное —
// что названный клуб СТОИТ в тройке предложений (careerOrgOffers), а не просто
// лежит в списке кандидатов. Тройка тянется броском, и первая версия правки
// клуб в кандидаты клала, а до окна он не доезжал: 0 из 8.
//
// Контроль — тот же клуб без просьбы. Без него проверка мерила бы не просьбу, а
// то, что клуб и так популярен.
//
// И отказ: клуб заметно выше уровня игрока отвечает вежливым «нет», а просьба
// закрывается — иначе адресная просьба была бы способом подписать кого угодно.
//
//   node tools/check-career-pitch.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const HEAD = `<script>
window.__errs=[];
window.addEventListener('error', e=>window.__errs.push(String(e.message)+' @'+e.lineno));
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={steps:[], fails:[], notes:{}, errs:null, fail:null};
  const check=(n, ok, d)=>{ out.steps.push((ok?'  ok  ':' FAIL ')+n+(d?': '+d:''));
                            if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const TRIES=8;
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Pitch', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:90, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-03-02', division:1, earnings:0, balance:5000, reach:40000,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    /* Менеджер — это условие просьбы: без него careerAgentPitch не делает
       ничего, и проба, забывшая его нанять, «проверяла» бы тишину.

       Письмо пишется ДО найма: careerAgentDm молчит, когда менеджер уже есть,
       а без ветки переписки некуда класть ни просьбу, ни доклад о
       переговорах — и шаг 4 проверял бы пустоту. */
    const th=careerAgentDm();
    const a=CC_AGENTS.find(x=>x.name===(th && th.who && th.who.handle)) || CC_AGENTS[0];
    const terms=ccAgentTermsOf(a);
    CAREER.agent={name:a.name, at:a.at||null, photo:a.photo||null,
                  cut:terms.cut, reach:terms.reach, wage:terms.wage,
                  since:careerToday()};
    if(th) th.state='agentOn';

    const clubs=careerPitchClubs();
    out.notes.clubs=clubs.map(c=>c.name+'/'+c.tier);
    check('менеджеру есть кому написать', clubs.length>0);
    const dm=(th && th.id) || null;

    // ---- 1. клуб в пределах охвата: согласие и место в окне ---------------
    const near=clubs[clubs.length-1];                 // самый близкий по уровню
    careerAgentPitch(dm, near.name);
    out.notes.pitch=CAREER.pitch || null;
    check('просьба записана', !!(CAREER.pitch && CAREER.pitch.club===near.name),
          JSON.stringify(CAREER.pitch));
    let hits=0;
    for(let i=0;i<TRIES;i++){
      CAREER.career.orgRecent=null;
      if(careerOrgOffers().some(o=>o.name===near.name)) hits++;
    }
    out.notes.asked=near.name+': '+hits+'/'+TRIES;
    check('названный клуб стоит в предложениях каждый раз', hits===TRIES,
          hits+' из '+TRIES);

    // ---- 2. контроль: без просьбы он приходит далеко не всегда ------------
    CAREER.pitch=null;
    let ctrl=0;
    for(let i=0;i<TRIES;i++){
      CAREER.career.orgRecent=null;
      if(careerOrgOffers().some(o=>o.name===near.name)) ctrl++;
    }
    out.notes.control=ctrl+'/'+TRIES;
    check('контроль: без просьбы — не всегда', ctrl<hits, ctrl+' из '+TRIES);

    /* ---- 3. клуб не по уровню отказывает, и просьба закрывается ----------
       Чипсы такой клуб и не покажут — careerPitchClubs фильтрует по охвату, —
       поэтому уровень игрока здесь опускается: проверяется сама защита, а не
       список. Иначе шаг мерил бы согласие и назывался бы отказом. */
    CAREER.pitch=null;
    CAREER.player.ovr=70; CAREER.player.ovrExact=70;
    const far=careerOrgPool().slice().sort((x,y)=>y.tier-x.tier)[0];
    out.notes.far=far.name+'/'+far.tier+' против 70';
    careerAgentPitch(dm, far.name);
    check('клуб заметно выше уровня отказывает', !careerPitchOn(),
          JSON.stringify(CAREER.pitch));
    check('и такой клуб в списке не предлагается',
          !careerPitchClubs().some(c=>c.name===far.name));

    /* ---- 4. меню, а не ряд фишек, и доклад о переговорах ----------------
       Его правка, 25 августа: «а менеджера как попросить, чтоб оргу нашёл —
       добавь в менюшке, типа какую игрок хочет» и «что переговоры провёл».
       Проверяется то, что видно: одна кнопка в подвале переписки, за ней
       список клубов строками, и в переписке после просьбы стоит строка о
       проведённых переговорах — ДО ответа клуба. */
    CAREER.pitch=null;
    CAREER.player.ovr=90; CAREER.player.ovrExact=90;
    careerRenderHub('social');
    careerDmOpen(th && th.id);
    const btn=document.querySelector('.dm-pitch-open');
    check('в переписке одна кнопка, а не ряд фишек',
          !!btn && !document.querySelector('.dm-pitch-club'),
          btn ? btn.textContent.trim() : 'кнопки нет');
    ccClubPickOpen(th && th.id);
    const modal=document.getElementById('clubPickModal');
    const rows=modal ? modal.querySelectorAll('.cc-buy').length : 0;
    out.notes.menu=rows+' строк';
    check('меню показывает клубы строками', rows===careerPitchClubs().length,
          rows+' против '+careerPitchClubs().length);
    ccClubPickClose();
    check('и закрывается', modal && modal.style.display==='none');

    const target=careerPitchClubs().slice(-1)[0];
    careerAgentPitch(th && th.id, target.name);
    const keys=(th ? th.msgs||[] : []).map(m=>m.k||'');
    out.notes.msgs=keys.slice(-4);
    const iTalk=keys.lastIndexOf('dmPitchTalked');
    const iEnd=Math.max(keys.lastIndexOf('dmPitchYes'), keys.lastIndexOf('dmPitchNo'));
    check('менеджер докладывает, что переговоры провёл', iTalk>=0, keys.join(','));
    check('и говорит это раньше, чем отвечает клуб', iTalk>=0 && iEnd>iTalk,
          iTalk+' против '+iEnd);
  }catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccpitch-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.split(path.sep).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба ничего не вернула'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log(s));
console.log('  ' + JSON.stringify(out.notes));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
if ((out.errs || []).length) console.error('page errors: ' + out.errs.join(' | '));
if (out.fails.length) process.exit(1);
console.log('клуб, о котором попросили, доходит до почты');
