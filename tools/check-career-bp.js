// Батл пасс: опыт из журнала, испытания недели, дорожка из наград сезона, покупка пропуска и уровня, награды в шкафчике.
// Карьера карточкой (Sky), 50 дней перемотки от начала S39. Потом вкладка «bp» и покупки.
//
//   node tools/check-career-bp.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
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
(async function(){
  const out={errs:null, fail:[], info:{}};
  const bad=m=>out.fail.push(m);
  try{
    const card=h=>PLAYERS.filter(p=>p && hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card('Sky'), mate=card('Scroll');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:me.handle, age:20, source:'card', country:'dk', countryPing:12, closeRangeEdge:0,
              region:'EU', ovr:Math.round(attrsFor(me).ovr), role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:me.handle, cardRegion:'EU', nat:me.nat||null},
      career:{season:1, day:'2025-12-04', division:1, earnings:0, balance:5000, reach:0, tokens:[], log:[], news:[], size:2},
      partners:[{handle:mate.handle, cardRegion:'EU', dev:0, since:'2025-06-01'}]}));
    careerEntry();
    const realDigest=careerFfDigest; careerFfDigest=function(){};
    await careerFastForward(50);
    careerFfDigest=realDigest;
    careerSave();
    await new Promise(r=>ccFnShopLoad(r));
    ccBpCheck();
    const b=CAREER.bp, keys=Object.keys((b&&b.p)||{});
    out.info.passes=keys; out.info.today=careerToday();
    if(!keys.length) bad('нет ни одного пасса после 50 дней');
    const p=ccBpCur();
    if(!p) bad('нет пасса текущего сезона');
    else {
      out.info.n=p.n; out.info.xp=p.xp; out.info.lvl=ccBpLevel(p); out.info.lvlXp=ccBpLvlXp(p); out.info.wd=Object.keys(p.wd).length;
      if(p.n!==39) bad('сезон 2025-12..2026-01 должен быть S39, а он S'+p.n);
      if(!(p.xp>5000)) bad('опыта мало: '+p.xp);
      if(!(ccBpLevel(p)>1)) bad('уровень не растёт');
      // Опыт равен сумме вечеров сезона и испытаний — ничего не посчитано дважды.
      const sum=CAREER.career.log.filter(e=>e && !e.who && e.day>=p.from && e.day<=p.to).reduce((s,e)=>s+ccBpXpOf(e),0)+Object.keys(p.wd).length*CC_BP_CH_XP;
      if(sum!==p.xp) bad('опыт '+p.xp+' не равен сумме вечеров и испытаний '+sum);
      // Повторная проверка ничего не добавляет.
      const x0=p.xp; ccBpCheck(); careerSave(); if(p.xp!==x0) bad('повторный ccBpCheck добавил опыт');
      const tr=ccBpTrack(p.n);
      const main=x=>x && x.id && !x.small, items=tr.slice(1).reduce((s,l)=>s+(main(l.f)?1:0)+(main(l.p)?1:0),0);
      const empty=tr.slice(1).reduce((s,l)=>s+(l.f?0:1)+(l.p?0:1),0); out.info.empty=empty;
      const vbP=tr.slice(1).reduce((s,l)=>s+(l.p&&l.p.vb||0),0), vbF=tr.slice(1).reduce((s,l)=>s+(l.f&&l.f.vb||0),0);
      out.info.items=items; out.info.vbP=vbP; out.info.vbF=vbF;
      const want=ccBpItems(p.n).filter(x=>!x.small).length; if(items!==want) bad('на дорожке '+items+' основных предметов из '+want);
      if(vbP!==1500 || vbF!==300) bad('V-Bucks на дорожке '+vbP+'/'+vbF+' вместо 1500/300');
      if(!(tr[1].p && tr[1].p.t==='o') || !(tr[CC_BP_LVLS].p && tr[CC_BP_LVLS].p.t==='o')) bad('скинов нет на 1-м и последнем уровне');
      // Бесплатные награды до уровня уже в шкафчике.
      const lvl=ccBpLevel(p), own=CAREER.fnOwn||{};
      for(let L=1; L<=lvl; L++){ const r=tr[L].f; if(r && r.id && !own[r.id]) bad('бесплатная награда уровня '+L+' не в шкафчике'); }
      for(let L=1; L<=lvl; L++){ const r=tr[L].p; if(r && r.id && own[r.id] && own[r.id].bp) bad('платная награда уровня '+L+' выдана без пропуска'); }
      // Покупка пропуска: −950, платные до уровня — в шкафчике.
      ccAsk=function(t, go){ go(); };
      CAREER.vb=2000; const vb0=CAREER.vb; let vbGot=0;
      for(let L=(p.gp||0)+1; L<=lvl; L++) if(tr[L].p && tr[L].p.vb) vbGot+=tr[L].p.vb;
      ccBpBuy();
      if(!p.prem) bad('пропуск не куплен');
      if(CAREER.vb!==vb0-CC_BP_PRICE+vbGot) bad('V-Bucks после покупки '+CAREER.vb+', ждали '+(vb0-CC_BP_PRICE+vbGot));
      for(let L=1; L<=lvl; L++){ const r=tr[L].p; if(r && r.id && !own[r.id]) bad('платная награда уровня '+L+' не выдана после покупки'); }
      const lv0=ccBpLevel(p); CAREER.vb=500; ccBpBuyLvl();
      if(ccBpLevel(p)!==Math.min(CC_BP_LVLS, lv0+1)) bad('купленный уровень не прибавился: '+lv0+' -> '+ccBpLevel(p));
      // Вкладка рисуется: 10 уровней, испытания недели.
      careerTab('bp');
      const body=document.getElementById('chBody');
      out.info.cols=body.querySelectorAll('.cc-bp-col').length; out.info.ch=body.querySelectorAll('.cc-bp-ch').length;
      if(out.info.cols!==10) bad('на странице дорожки '+out.info.cols+' уровней');
      if(out.info.ch!==3) bad('испытаний недели '+out.info.ch);
      if(/undefined|NaN/.test(body.innerHTML)) bad('в разметке пасса undefined/NaN');
      // Сохранение переживает перезагрузку.
      careerSave(); const saved=JSON.parse(localStorage.getItem('fncsdraft_career')||'{}');
      if(!(saved.bp && saved.bp.p && saved.bp.p[Object.keys(b.p).pop()])) bad('пасс не попал в сейв');
    }
  }catch(e){ out.fail.push('исключение: '+String((e&&(e.stack||e.message))||e).slice(0,500)); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bpchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + HEAD + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=3000000','--dump-dom', 'file:///' + tmp.replace(/\\/g,'/')],
  {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('FAIL: проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.info));
if (out.errs && out.errs.length) console.log('ошибки страницы: ' + out.errs.slice(0, 3).join(' | '));
if (out.fail.length) { out.fail.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK battle pass');
