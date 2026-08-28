// Ссора за локацию: как заводится, что даёт и как гаснет.
//
// Его правка, 24 августа: «бифы в твиттере и за локации, ауру фармить».
// Проверяется вся цепочка, потому что каждое звено в ней может тихо не
// сработать и биф останется украшением:
//   1) одна встреча — ещё не ссора, вторая на СВОЕЙ точке — уже биф, и он
//      приходит в ленту постом соперника, а не твоим;
//   2) чужая коробка ссоры не заводит: биф — за локацию;
//   3) пока биф жив, соперника тянет именно на твой дом (landingScore);
//   4) вечер, в котором вы сошлись, стоит вдвое — и в плюс, и в минус;
//   5) ответить — громко и ссора живёт; промолчать — гаснет;
//   6) месяц тишины гасит сам.
//
//   node tools/check-career-beef.js
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
  const out={steps:[], errs:null, fail:null};
  const fail=m=>{ if(!out.fail) out.fail=m; throw new Error(m); };
  /* useLandingSet пересобирает ALL_LANDING_ZONES новыми объектами, поэтому дом
     и чужая коробка берутся ЗАНОВО после каждого посева: сравнение зон идёт по
     тождеству, и старый объект после пересборки не равен ничему. */
  let home=null, away=null;
  const seed=()=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Beefer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    useLandingSet(careerBrSet());
    careerSpotSet(4, careerBrSet());
    home=careerSpotZone(careerBrSet());
    away=ALL_LANDING_ZONES.find(z=>z!==home);
  };
  // Один вечер на карте, разыгранный руками: кто где сел и кто кого вынес.
  // Настоящий движок здесь не нужен — creditLandingFights читает ровно эти
  // три поля, и проба говорит с ним на его языке.
  const night=(zone, rivalCard, youWin)=>{
    const you={isYou:true, name:'you', squad:[{handle:'Beefer'}], landingZone:zone};
    const foe={name:'foe', squad:[rivalCard], landingZone:zone};
    if(youWin){ foe._droppedOut=true; foe._deathCause='you'; }
    else { you._droppedOut=true; you._deathCause='foe'; }
    creditLandingFights([you, foe]);
    return you;
  };
  try{
    seed();
    const foeCard=careerRosterNowEU()[0];
    if(!home || !away || !foeCard) fail('нечем играть: дом, чужая коробка или соперник не нашлись');

    // ---- 1. первая встреча — ещё не ссора --------------------------------
    night(home, foeCard, true);
    let b=careerBeefOf(foeCard.handle);
    if(!b) fail('первая встреча вообще не записалась');
    if(b.hot) fail('биф завёлся с одной встречи');
    if((CAREER.career.news||[]).some(n=>n.beef)) fail('пост ссоры вышел раньше самой ссоры');
    out.steps.push('одна встреча — ещё не ссора');

    // ---- 2. вторая на своей точке — биф и его пост -----------------------
    night(home, foeCard, true);
    b=careerBeefOf(foeCard.handle);
    if(!b.hot) fail('вторая встреча дома не завела биф');
    const post=(CAREER.career.news||[]).find(n=>n.beef);
    if(!post) fail('биф есть, а поста нет');
    if(!post.by || String(post.by.handle||'').toLowerCase()!==ccHandle(foeCard.handle))
      fail('пост ссоры написан не соперником: '+JSON.stringify(post.by));
    const html=ccPostHTML(post);
    if(html.indexOf('x-beef-hit')<0) fail('под постом ссоры нет кнопки ответа');
    out.steps.push('вторая встреча дома — биф, и пост пишет он: @'+post.by.handle);

    // ---- 3. чужая коробка ссоры не заводит -------------------------------
    seed();
    const other=careerRosterNowEU()[1];
    night(away, other, true);
    night(away, other, true);
    if((careerBeefOf(other.handle)||{}).hot) fail('биф завёлся на чужой коробке');
    out.steps.push('на чужой коробке ссора не заводится');

    // ---- 4. пока биф жив, его тянет на твой дом --------------------------
    seed();
    night(home, foeCard, true); night(home, foeCard, true);
    const foeTeam={pow:100, squad:[foeCard]};
    const calm={pow:100, squad:[careerRosterNowEU()[5]]};
    // Шум в landingScore случайный, поэтому сравниваются средние.
    const avg=(team, zone)=>{ let s=0; for(let i=0;i<400;i++) s+=landingScore(team, zone, []); return s/400; };
    careerSpotFearOn({pow:100});
    if(!CC_BEEF_SET) fail('набор ссор не выставился: живых '+careerBeefHot().length+
      ', всего '+JSON.stringify(careerBeefs())+', сегодня '+careerToday());
    if(!CC_BEEF_ZONES || !CC_BEEF_ZONES.has(home)) fail('дом не попал в набор зон ссоры');
    if(!CC_BEEF_SET.has(hKey(foeCard))) fail('соперника нет в наборе: '+[...CC_BEEF_SET].join(','));
    const pullFoe=avg(foeTeam, home)-avg(foeTeam, away);
    const pullCalm=avg(calm, home)-avg(calm, away);
    careerSpotFearOff();
    if(!(pullFoe-pullCalm > CC_BEEF_PULL*0.5))
      fail('биф не тянет соперника на дом: '+pullFoe.toFixed(2)+' против '+pullCalm.toFixed(2));
    out.steps.push('соперника по бифу тянет на дом сильнее на '+
      (pullFoe-pullCalm).toFixed(1)+' очка карты');

    // ---- 5. вечер против него стоит вдвое --------------------------------
    seed();
    const plain=careerSpotNight(6, 1, careerBrSet(), 0, false);
    seed();
    const hot=careerSpotNight(6, 1, careerBrSet(), 0, true);
    if(!(hot===plain*CC_BEEF_AURA)) fail('аура за вечер с бифом не удвоилась: '+plain+' → '+hot);
    /* И проигранный вечер тоже удваивается: ссора — ставка в обе стороны,
       иначе она была бы бесплатной. Ауру надо поднять заранее — с нуля минус
       упирается в пол, и проверка стала бы пустой. */
    seed();
    careerSpotList(careerBrSet())[0].aura=5;
    const badPlain=careerSpotNight(1, 6, careerBrSet(), 0, false);
    seed();
    careerSpotList(careerBrSet())[0].aura=5;
    const badHot=careerSpotNight(1, 6, careerBrSet(), 0, true);
    if(badPlain===0) fail('проверка минуса пустая: аура упёрлась в пол');
    if(badHot!==badPlain*CC_BEEF_AURA)
      fail('минус за ссору не удвоился: '+badPlain+' → '+badHot);
    out.steps.push('вечер с бифом: аура '+plain+' → '+hot+', минус '+badPlain+' → '+badHot);

    // ---- 6. ответить или промолчать --------------------------------------
    seed();
    night(home, foeCard, true); night(home, foeCard, true);
    const p2=(CAREER.career.news||[]).find(n=>n.beef);
    const reachWas=CAREER.career.reach||0;
    careerBeefAnswer(p2.id, 'hit');
    if(!(CAREER.career.reach>reachWas)) fail('ответ не принёс подписчиков');
    if(!careerBeefOf(foeCard.handle).hot) fail('после ответа ссора погасла');
    if(!(CAREER.career.news||[]).some(n=>n.k && String(n.k).indexOf('ccBeefHit')>=0))
      fail('твоего ответа нет в ленте');
    if(ccPostHTML((CAREER.career.news||[]).find(n=>n.beef)).indexOf('x-beef-hit')>=0)
      fail('кнопки остались после ответа');

    seed();
    night(home, foeCard, true); night(home, foeCard, true);
    const p3=(CAREER.career.news||[]).find(n=>n.beef);
    careerBeefAnswer(p3.id, 'quiet');
    if(careerBeefOf(foeCard.handle).hot) fail('молчание не погасило ссору');
    out.steps.push('ответить — громко и ссора жива; промолчать — гаснет');

    // ---- 7. и месяц тишины гасит сам --------------------------------------
    seed();
    night(home, foeCard, true); night(home, foeCard, true);
    if(!careerBeefHot().length) fail('свежая ссора не считается живой');
    careerBeefOf(foeCard.handle).last=ccAddDays(careerToday(), -(CC_BEEF_COOL+5));
    if(careerBeefHot().length) fail('ссора месячной давности всё ещё живая');
    out.steps.push('месяц без встреч — и ссора гаснет сама');
  }catch(e){ if(!out.fail) out.fail=String(e && e.message || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccbeef-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s=>console.log('  '+s));
if((out.errs||[]).length) console.error('ОШИБКИ: '+out.errs.join(' | '));
if(out.fail){ console.error('FAILED: '+out.fail); process.exit(1); }
console.log('ссора за локацию заводится картой, кормит ауру и гаснет сама');
