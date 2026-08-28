// Имя читается из того, что карьера действительно сыграла.
//
// careerRenown (26 августа, его слово про гранды и слот на LAN) добавляет к
// страху перед твоим домом две вещи: сыгранный когда-либо гранд-финал мейджора
// и слот на Global Championship В ЭТОМ сезоне. Цену репутации меряет
// tools/renown-drop-probe.js, а это — про вывод: откуда она берётся, когда
// гаснет и доходит ли до карты страха.
//
//   node tools/check-renown.js

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {steps: [], fail: null};
  const fail = m => { out.fail = m; throw new Error(m); };
  const eq = (got, want, what) => { if(got !== want) fail(what + ': ' + got + ', а ждали ' + want); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Renown', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr = CAREER.career;
    useLandingSet(careerBrSet());
    const set = ACTIVE_LANDING_SET;

    // 1. Пустая карьера — имени нет.
    eq(careerRenown(), 0, 'у пустой карьеры репутация');
    out.steps.push('пустая карьера: 0');

    // 2. Гранд-финал мейджора — навсегда.
    cr.log.push({season:cr.season, day:cr.day, kind:'major', stage:'final', place:20, of:50});
    eq(careerRenown(), CC_RENOWN_GRAND, 'после гранд-финала');
    out.steps.push('гранд-финал: ' + CC_RENOWN_GRAND);

    // 3. Слот на LAN — сверху, и только в своём сезоне.
    cr.log.push({season:cr.season, day:cr.day, kind:'summit', stage:'final', place:1, of:74});
    eq(careerRenown(), CC_RENOWN_GRAND + CC_RENOWN_LAN, 'со слотом на LAN');
    out.steps.push('плюс слот на LAN: ' + careerRenown());

    // 4. Новый сезон: слот остался в прошлом, гранд-финал — нет.
    cr.season = 2;
    eq(careerRenown(), CC_RENOWN_GRAND, 'в новом сезоне');
    out.steps.push('новый сезон: ' + CC_RENOWN_GRAND + ' — слот сгорел, гранд остался');
    cr.season = 1;

    // 5. Без метки на карте бояться нечего: репутация живёт в доме.
    const you = {pow:92, squad:[{handle:'a', rating:80}, {handle:'b', rating:80}]};
    careerSpotFearOn(you);
    if(CC_SPOT_FEAR_MAP) fail('карта страха построена, хотя дома на острове нет');
    careerSpotFearOff();
    out.steps.push('без метки карты страха нет');

    // 6. С меткой и НУЛЕВОЙ аурой имя всё равно доходит до карты страха —
    //    раньше эта ветка отсекалась по aura>0.
    const byPts = ALL_LANDING_ZONES.map((z,i)=>({i:i, p:z.points||0})).sort((a,b)=>a.p-b.p);
    careerSpotSet(byPts[Math.floor(byPts.length/2)].i, set);
    if(careerSpotAura(set) !== 0) fail('свежий дом уже с аурой');
    careerSpotFearOn(you);
    if(!CC_SPOT_FEAR_MAP) fail('дом есть, имя есть, а карты страха нет');
    const home = careerSpotZone(set);
    eq(CC_SPOT_FEAR_MAP.get(home), CC_RENOWN_GRAND + CC_RENOWN_LAN, 'страх на голом доме');
    careerSpotFearOff();
    out.steps.push('дом с нулевой аурой боятся на ' + (CC_RENOWN_GRAND + CC_RENOWN_LAN));

    // 7. Аура и имя складываются, но не выше потолка.
    careerSpotList(set)[0].aura = 6;
    careerSpotFearOn(you);
    eq(CC_SPOT_FEAR_MAP.get(home), CC_SPOT_AURA_MAX, 'аура 6 плюс имя 7');
    // ...и замок именем не вешается: закрывает коробку только своя аура,
    // дошедшая до потолка (26 августа, см. CC_SPOT_LOCK_ZONES).
    if(CC_SPOT_LOCK_ZONES) fail('имя закрыло коробку, хотя своей ауры всего 6');
    careerSpotFearOff();
    out.steps.push('6 + 7 упирается в потолок ' + CC_SPOT_AURA_MAX + ', но замка не вешает');

    // 7б. А своя аура на потолке — вешает, и без всякого имени.
    cr.log.length = 0;
    careerSpotList(set)[0].aura = CC_SPOT_AURA_MAX;
    careerSpotFearOn(you);
    if(!CC_SPOT_LOCK_ZONES || !CC_SPOT_LOCK_ZONES.has(home))
      fail('полная своя аура коробку не закрыла');
    careerSpotFearOff();
    out.steps.push('полная своя аура закрывает коробку');
    careerSpotList(set)[0].aura = 6;
    cr.log.push({season:cr.season, day:cr.day, kind:'major', stage:'final', place:20, of:50});
    cr.log.push({season:cr.season, day:cr.day, kind:'summit', stage:'final', place:1, of:74});

    // 8. И контроль: без имени страх — ровно аура, ни очком больше.
    cr.log.length = 0;
    careerSpotFearOn(you);
    eq(CC_SPOT_FEAR_MAP.get(home), 6, 'страх без имени');
    careerSpotFearOff();
    out.steps.push('без имени страх равен ауре: 6');
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'renown-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);

const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')],
  { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ok  ' + s));
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log('репутация читается из результатов и доходит до дома');
fs.rmSync(dir, { recursive: true, force: true });
