// Канал на твиче растёт, но не взрывается.
//
// Его страница «bags 13.09»: сводка эфира с 12 411 532 среднего онлайна,
// +14 532 891 фолловеров за вечер и $2.1 млн — «слишком много стримы онлайн,
// такого не может быть». Причина: «зрители = 6 % фолловеров» и «фолловеры =
// 18 % зрителей» были линейными, вместе — сложный процент 2–4 % в день, и за
// полтора года карьеры канал уходил в сотни миллионов.
//
// Проверяется:
//   * прирост за день эфира падает с размером канала: ~1 % на тысяче,
//     не больше 0.5 % на ста тысячах, не больше 0.05 % на трёх миллионах;
//   * онлайн канала размером с Clix — десятки тысяч, а не сотни;
//   * турнирный эфир платит фолловерами по той же доле, что и обычный день;
//   * два года ежедневных эфиров с турнирами — канал остаётся под потолком;
//   * сейв с сотнями миллионов при загрузке ставится под CC_TW_CEIL.
//
//   node tools/check-career-twitch-sat.js
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

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fail:null};
  const fail=m=>{ out.fail=m; throw new Error(m); };
  const save=(tw)=>localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Streamer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4},
      career:{season:1, day:'2026-02-05', division:1, earnings:0, balance:500, reach:2000,
              twitch:tw, tokens:[], log:[], news:[]}, partner:null}));
  try{
    skipAnimation=true;
    // Прирост за обычный день эфира по размеру канала.
    const rate={};
    for(const tw of [1000, 100000, 3000000]){
      localStorage.removeItem('fncsdraft_career'); save(tw); careerEntry();
      const cr=CAREER.career;
      if(!careerStreamGo('grind')) fail('эфир не состоялся при '+tw+' фолловерах');
      rate[tw]=(cr.twitch-tw)/tw;
    }
    if(!(rate[1000]>0.004 && rate[1000]<0.02)) fail('на тысяче фолловеров прирост за день '+(rate[1000]*100).toFixed(2)+'% — ждали около 1%');
    if(!(rate[100000]<0.005)) fail('на ста тысячах прирост за день '+(rate[100000]*100).toFixed(2)+'% — больше половины процента');
    if(!(rate[3000000]<0.0005)) fail('на трёх миллионах прирост за день '+(rate[3000000]*100).toFixed(3)+'% — больше 0.05%');
    if(!(rate[1000]>rate[100000] && rate[100000]>rate[3000000])) fail('доля прироста не падает с размером: '+JSON.stringify(rate));
    out.steps.push('прирост за день эфира: 1k → '+(rate[1000]*100).toFixed(2)+'%, 100k → '+(rate[100000]*100).toFixed(2)+'%, 3M → '+(rate[3000000]*100).toFixed(3)+'%');
    // Онлайн канала размером с Clix.
    localStorage.removeItem('fncsdraft_career'); save(3000000); careerEntry();
    const vBig=ccStreamViewersNow();
    if(!(vBig>10000 && vBig<60000)) fail('у канала на 3 млн онлайн '+vBig+' — у Clix это десятки тысяч');
    localStorage.removeItem('fncsdraft_career'); save(1000); careerEntry();
    const vSmall=ccStreamViewersNow();
    if(!(vSmall>=30 && vSmall<=400)) fail('у канала на тысячу онлайн '+vSmall);
    out.steps.push('онлайн: 1k фолловеров → '+vSmall+', 3M → '+ccNum(vBig));
    // Турнирный эфир: победа при 3 млн даёт фолловеров по насыщенной доле.
    { localStorage.removeItem('fncsdraft_career'); save(3000000); careerEntry();
      const cr=CAREER.career, day=careerToday();
      CC_TV_VIEW=ccStreamViewersNow(); CC_TV_SUM={n:0,sum:0}; CC_TV_HIST=[]; CC_TV_CHATTERS=new Set();
      CC_TV_EV={fol:0, subs:0, cash:0};
      const r=ccStreamCupAfter(day, {place:1, of:50}, null);
      if(!r) fail('турнирный эфир ничего не начислил');
      const share=r.fol/3000000;
      if(!(share<0.002)) fail('победа в эфире при 3 млн дала +'+ccNum(r.fol)+' фолловеров ('+(share*100).toFixed(2)+'%) — слишком много');
      if(!(r.fol>50)) fail('победа в эфире при 3 млн дала всего +'+r.fol);
      out.steps.push('турнирная победа при 3M: +'+ccNum(r.fol)+' фолловеров ('+(share*100).toFixed(3)+'%), онлайн '+ccNum(r.sum.avg)); }
    /* Два года: каждый день обычный эфир, через день ещё турнирный с местом
       в верхней трети, зрители за вечер ×1.8 — как в рамке при хорошей игре.
       Считается формулами страницы, а не прогоном дней: важна не игра, а
       арифметика роста. */
    { let tw=100, reach=2000, peakV=0;
      for(let d=1; d<=730; d++){
        const v=ccTwViewersOf(tw, reach);
        tw+=Math.max(1, Math.round(v*0.18*ccTwFolRate(tw)));
        reach+=180;
        if(d%2===0){ const vv=v*1.8; tw+=Math.max(1, Math.round(vv*0.25*0.7*ccTwFolRate(tw))); }
        peakV=Math.max(peakV, v);
      }
      if(!(tw<CC_TW_CEIL)) fail('два года эфиров: '+ccNum(tw)+' фолловеров — выше потолка '+ccNum(CC_TW_CEIL));
      if(!(tw>20000)) fail('два года эфиров: всего '+tw+' фолловеров — канал не растёт');
      if(!(peakV<100000)) fail('два года эфиров: онлайн дошёл до '+ccNum(peakV));
      out.steps.push('два года ежедневных эфиров: '+ccNum(tw)+' фолловеров, онлайн до '+ccNum(peakV)); }
    // Раздутый сейв — под потолок при загрузке.
    { localStorage.removeItem('fncsdraft_career'); save(200000000); careerEntry();
      const tw=CAREER.career.twitch;
      if(tw!==CC_TW_CEIL) fail('сейв на 200 млн загрузился с '+ccNum(tw)+' — потолок не сработал');
      const v=ccStreamViewersNow();
      if(!(v<100000)) fail('после потолка онлайн '+ccNum(v));
      out.steps.push('сейв на 200 млн → '+ccNum(tw)+' при загрузке, онлайн '+ccNum(v)); }
    { localStorage.removeItem('fncsdraft_career'); save(2500); careerEntry();
      if(CAREER.career.twitch!==2500) fail('здоровый сейв тронут потолком: '+CAREER.career.twitch);
      out.steps.push('здоровый сейв потолок не трогает'); }
  }catch(e){ if(!out.fail) out.fail=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEG'+'IN'+encodeURIComponent(JSON.stringify(out))+'E'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctw-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--host-resolver-rules=MAP * ~NOTFOUND',
  '--window-size=1400,900','--virtual-time-budget=120000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('канал на твиче насыщается: растёт, но не взрывается');
