// Pirate Shop Token: падает только в S43 и один раз, Math.random не тратит, 14 дней магазин за V-Bucks бесплатно, пасс и паки платные.
//   node tools/check-career-pirate.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fail:[], info:{}, errs:[]};
  window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const bad=m=>out.fail.push(m);
  try{
    const card=h=>PLAYERS.filter(p=>p && hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card('Sky'), mate=card('Scroll');
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:me.handle, age:20, source:'card', country:'dk', countryPing:12, closeRangeEdge:0,
              region:'EU', ovr:Math.round(attrsFor(me).ovr), role:'roleIGL', attrs:null, ageEdge:0,
              photo:null, handle:me.handle, cardRegion:'EU', nat:me.nat||null},
      career:{season:1, day:'2026-11-10', division:1, earnings:0, balance:5000, reach:0, tokens:[], log:[], news:[], size:2},
      partners:[{handle:mate.handle, cardRegion:'EU', dev:0, since:'2025-06-01'}]}));
    careerEntry();
    await new Promise(r=>ccFnShopLoad(r));
    ccAsk=function(t, go){ go(); };

    // Частота: 100 игр сезона дают примерно 1 карьеру из 3.
    let hit=0; const N=4000;
    for(let t=0; t<N; t++){ for(let g=0; g<100; g++) if(ccPirateRoll('team'+t, '2026-11-10', 1, g)){ hit++; break; } }
    out.info.rate=hit/N;
    if(hit/N<0.27 || hit/N>0.40) bad('за 100 игр находят '+(hit/N)+', ждали около 0.33');

    // Не тратит общий генератор и повторяется для того же состава.
    const realRandom=Math.random; let drawn=0; Math.random=function(){ drawn++; return realRandom(); };
    const a=ccPirateRoll('x', '2026-11-10', 1, 3), b=ccPirateRoll('x', '2026-11-10', 1, 3);
    CAREER.career.log.push({day:'2026-11-09', games:5, place:40}); ccPirateCheck();
    Math.random=realRandom;
    if(drawn) bad('проверка потратила Math.random: '+drawn);
    if(a!==b) bad('бросок не повторяется');
    if(ccPirate().seen!==CAREER.career.log.length) bad('журнал не дочитан');
    CAREER.career.log.length=0; CAREER.pirate={seen:0};

    // Падает только в S43 и один раз; один ключ у обоих в паре.
    const realRoll=ccPirateRoll; ccPirateRoll=function(){ return true; };
    CAREER.career.log.push({day:'2026-10-20', games:9, place:1}); ccPirateCheck();
    if(CAREER.pirate.found) bad('токен выпал вне S43');
    CAREER.career.log.push({day:'2026-11-05', games:0, place:1}); ccPirateCheck();
    if(CAREER.pirate.found) bad('токен выпал без игр');
    CAREER.career.log.push({who:'bot', day:'2026-11-06', games:9, place:1}); ccPirateCheck();
    if(CAREER.pirate.found) bad('токен выпал по чужой строке журнала');
    CAREER.career.log.push({day:'2026-11-07', games:3, place:1}); ccPirateCheck();
    if(CAREER.pirate.found!=='2026-11-07') bad('токен не выпал в S43: '+CAREER.pirate.found);
    if(!CAREER.pirate.news) bad('нет сообщения о находке');
    CAREER.career.log.push({day:'2026-11-08', games:3, place:1}); ccPirateCheck();
    if(CAREER.pirate.found!=='2026-11-07') bad('токен выпал второй раз');
    ccPirateRoll=realRoll;
    const t1=ccPirateTeam(), pl0=CAREER.player.handle, m0=CAREER.partners[0].handle;
    CAREER.player.handle=m0; CAREER.partners[0].handle=pl0;
    if(ccPirateTeam()!==t1) bad('у напарника другой ключ команды');
    CAREER.player.handle=pl0; CAREER.partners[0].handle=m0;

    // До включения цены обычные, после включения 0.
    const shop=ccFnShopDay(careerToday())||[]; out.info.shop=shop.length;
    if(!shop.length) bad('пустая витрина');
    const it=shop[0], full=ccFnPrice(it);
    if(ccFnCost(it)!==full) bad('бесплатно ещё до включения');
    careerTab('items');
    let body=document.getElementById('chBody');
    if(!body.querySelector('.cc-pirate-btn')) bad('нет кнопки включения в магазине');
    ccPirateUse();
    out.info.left=ccPirateLeft();
    if(ccPirateLeft()!==14) bad('дней после включения '+ccPirateLeft());
    if(ccFnCost(it)!==0) bad('не бесплатно после включения');
    if(ccFnPrice(it)!==full) bad('обычная цена изменилась');

    // Покупка за 0: V-Bucks не тратятся, даже если их нет.
    CAREER.vb=0; ccFnBuy(it.i);
    if(!ccFnOwn()[it.id]) bad('предмет не куплен бесплатно');
    if(CAREER.vb!==0) bad('V-Bucks изменились: '+CAREER.vb);
    const plan=ccFnBuyAllPlan();
    if(plan.vbNeed!==0 || plan.usd!==0) bad('купить всё стоит '+plan.vbNeed+' и $'+plan.usd);
    ccFnBuyAll();
    if(shop.some(x=>!ccFnOwn()[x.id])) bad('купить всё не забрало витрину');
    if(CAREER.vb!==0) bad('V-Bucks после всего: '+CAREER.vb);

    // Пасс не входит.
    const bp=ccBpCur(); ccBpBuy();
    if(bp && bp.prem) bad('батл пасс куплен без V-Bucks');

    careerTab('items');
    body=document.getElementById('chBody');
    if(/undefined|NaN/.test(body.innerHTML)) bad('в разметке магазина undefined/NaN');
    if(!body.querySelector('.cc-pirate-on')) bad('нет счётчика дней');

    // Сохранение и конец срока: подвинули дату включения на 14 дней назад.
    careerSave();
    const saved=JSON.parse(localStorage.getItem('fncsdraft_career')||'{}');
    if(!(saved.pirate && saved.pirate.on)) bad('токен не попал в сейв');
    CAREER.pirate.on=ccAddDays(careerToday(), -14);
    if(ccPirateOn()) bad('действует дольше 14 дней');
    if(ccFnCost(it)!==full) bad('цена не вернулась после срока');
    careerTab('items');
    if(document.getElementById('chBody').querySelector('.cc-pirate')) bad('плитка осталась после срока');
    ccPirateUse();
    if(CAREER.pirate.on!==ccAddDays(careerToday(), -14)) bad('включили второй раз');
  }catch(e){ out.fail.push('исключение: '+String((e&&(e.stack||e.message))||e).slice(0,500)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pirchk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=3000000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('FAIL: проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.info));
if (out.errs.length) console.log('ошибки страницы: ' + out.errs.slice(0, 3).join(' | '));
if (out.fail.length) { out.fail.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK pirate token');
