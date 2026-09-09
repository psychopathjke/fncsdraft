// Вторая остановка Про-Ама — Сан-Паулу, 6 сентября 2026, Zero Build (его слово 9.09:
// «добавляй, ток в ЗБ»). Играется через интерфейс, как check-career-cup: сейв на нужный
// день, письмо от Fortnite, «поеду», кнопка «Играть», пропуск — и карточка результата.
// Проверяется то, что без прогона не видно: вечер без строек доигрывается, на карте
// стоит плашка Zero Build вместо ресов, строка журнала — шесть игр и деньги по таблице
// Сан-Паулу без бонусов за игру, прилёт — в Сан-Паулу, а не в Дюссельдорф.
//
//   node tools/check-career-proam-zb.js
//   CC_PROAM_STOP=ProAm_Dallas node tools/check-career-proam-zb.js   (Даллас — с постройками, как был)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const STOP = process.env.CC_PROAM_STOP || 'ProAm_SaoPaulo';
const HEAD = '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/"><script>window.__errs=[];' +
  "window.addEventListener('error', function(e){ window.__errs.push(String(e.message)+' @'+e.lineno); });" +
  "window.addEventListener('unhandledrejection', function(e){ var r=e.reason; window.__errs.push('rejection: '+String(r && (r.stack||r.message||r))); });" +
  '<' + '/script>';

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const STOP = ${JSON.stringify(STOP)}; const P0 = ccProAmEvent(STOP); const ZB = !!P0.zb; const DAY = P0.day;
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ const no=document.getElementById("ccAskNo"); if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); document.getElementById("ccAskModal").style.display="none"; careerPlay(); return; } } const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {steps: [], errs: null, fail: null, seen: {zb: 0, mats: 0, boxes: {}}};
  const wait = ms => new Promise(r => setTimeout(r, ms));
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v: 1,
      player: {nick: 'ProbeMan', age: 19, source: 'rookie', country: 'br', countryPing: 15, closeRangeEdge: 6,
               region: 'BR', ovr: 90, role: 'roleIGL', attrs: null, ageEdge: 4, photo: null, handle: null, cardRegion: null, nat: null},
      career: {season: 1, day: ccAddDays(DAY, -CC_PROAM_INVITE_DAYS), division: 1, earnings: 0, tokens: [], log: [],
               reach: CC_PROAM_REACH, balance: 20000, energy: 100},
      partners: [{card:{handle:'Mate', region:'BR', tier:'ranked', rating:88, _targetOvr:88, _attrs:null}, patience:60}]
    }));
    const s = JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs = ccRookieAttrs(90, 'roleIGL');
    s.partners[0].card._attrs = ccRookieAttrs(88, 'roleFRG');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
    out.steps.push('hub open: ' + document.getElementById('screen-career-hub').classList.contains('active'));

    // Письмо от Fortnite за две недели, «поеду», выбор креатора — первым из списка.
    const t = careerProAmInviteTick();
    if (!t) { out.fail = 'no invite letter for São Paulo'; throw new Error(out.fail); }
    out.steps.push('letter: ' + t.who.handle + ' · ' + t.proam);
    if (t.proam !== STOP) { out.fail = 'the letter is not for ' + STOP + ': ' + t.proam; throw new Error(out.fail); }
    careerProAmYes(t.id);
    const picks = careerProAmPickList();
    careerProAmPick(t.id, picks[0]);
    out.steps.push('creator picked: ' + picks[0] + ' of ' + picks.length);
    CAREER.career.day = DAY; careerSave(); careerRenderHub('centre');
    if (!careerProAmCan()) { out.fail = 'cannot go to ' + STOP + ': ' + ccProAmWhyLocked(); throw new Error(out.fail); }
    const how = ccProAmHowHTML();
    out.steps.push('rules mention Zero Build: ' + /Zero Build/.test(how));
    if (/Zero Build/.test(how) !== ZB) { out.fail = 'the rules of the day disagree about Zero Build'; throw new Error(out.fail); }

    const play = document.querySelector('#screen-career-hub .ch-play');
    if (!play || play.disabled) { out.fail = 'play button is not usable'; throw new Error(out.fail); }
    // Пропуск — как игрок; и попутно смотрим на карту: плашка Zero Build вместо ресов.
    // Под пропуском карта не рисуется — смотрим на модель: что зовётся в ночь без строек.
    const cnt = {farm:0, roomFarm:0, roomMats:0, spend:0, pen:0, loot:0, late:0, hg:0, zb:0};
    const w = (name, fn) => function(){ cnt[name]++; return fn.apply(this, arguments); };
    ccAskFarm = w('farm', ccAskFarm); ccRoomFarm = w('roomFarm', ccRoomFarm); ccRoomMats = w('roomMats', ccRoomMats);
    ccKitSpend = w('spend', ccKitSpend); ccMatsPenalty = w('pen', ccMatsPenalty); ccAskLoot = w('loot', ccAskLoot);
    const lm0 = ccLateMovesNow; ccLateMovesNow = function(){ const r = lm0.apply(this, arguments); cnt.late++; if (r.some(m => m.id === 'hg')) cnt.hg++; return r; };
    const skipper = setInterval(() => {
      if (typeof CC_ZB !== 'undefined' && CC_ZB) cnt.zb++;
      const b = document.getElementById('majorSkipBtn'); if (b && !b.disabled) b.click();
      if (document.querySelector('.zr-kit .zk-zb')) out.seen.zb++;
      if (document.querySelector('.zr-kit .zk-mats:not(.zk-zb)')) out.seen.mats++;
      const box = document.querySelector('.cc-choice-map, .cc-choice'); if (box) { const k = box.getAttribute('data-kind') || (box.className || '').slice(0, 40); out.seen.boxes[k] = (out.seen.boxes[k] || 0) + 1; }
    }, 20);
    play.click();
    let card = null;
    for (let i = 0; i < 24000 && !card; i++) {
      await wait(25);
      card = [...document.querySelectorAll('#majorStages .stage-card')].find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    clearInterval(skipper);
    if (!card) { out.fail = 'no result card after the Pro-Am · title '+((document.getElementById('finalsLiveTitle')||{}).textContent||'').trim().slice(0,80)+' · run '+(typeof CAREER_RUN!=='undefined' && CAREER_RUN)+' · game '+(typeof CC_MP_GAME!=='undefined'?CC_MP_GAME:'-')+' · ask '+(function(){ const am=document.getElementById('ccAskModal'); return am && am.style.display==='flex' ? String(am.textContent||'').replace(/s+/g,' ').trim().slice(0,120) : '-'; })()+' · choice '+(document.querySelector('.cc-choice-map, .cc-choice') ? String(document.querySelector('.cc-choice-map, .cc-choice').textContent||'').replace(/s+/g,' ').trim().slice(0,120) : '-')+' · stages '+document.querySelectorAll('#majorStages .stage-card').length; throw new Error(out.fail); }
    out.steps.push('result: ' + card.querySelector('h4').textContent.replace(/\\s+/g, ' ').trim());
    out.steps.push('calls: ' + JSON.stringify(cnt) + ' · zb panel ' + out.seen.zb + ' · mats panel ' + out.seen.mats);
    if (!cnt.loot) { out.fail = 'no loot stop was asked'; throw new Error(out.fail); }
    if (ZB) {
      if (!cnt.zb) { out.fail = 'CC_ZB was never on during the night'; throw new Error(out.fail); }
      if (cnt.farm || cnt.roomFarm || cnt.roomMats || cnt.spend || cnt.pen) { out.fail = 'mats logic ran in a Zero Build night'; throw new Error(out.fail); }
      if (!cnt.late || cnt.hg) { out.fail = 'late moves offered high ground in Zero Build (late ' + cnt.late + ', hg ' + cnt.hg + ')'; throw new Error(out.fail); }
    } else {
      if (cnt.zb) { out.fail = 'CC_ZB was on in a Build night'; throw new Error(out.fail); }
      if (!cnt.farm || !cnt.spend || !cnt.hg) { out.fail = 'a Build night skipped its mats logic'; throw new Error(out.fail); }
    }
    if (out.seen.mats) { out.fail = 'the map showed mats in a Zero Build night'; throw new Error(out.fail); }
    if (CC_ZB) { out.fail = 'CC_ZB stayed on after the night'; throw new Error(out.fail); }

    const cr = CAREER.career;
    const row = (cr.log || []).slice(-1)[0];
    out.steps.push('log row: ' + JSON.stringify(row));
    if (!row || row.kind !== 'proam' || row.games !== P0.games) { out.fail = 'the log row is not a ' + P0.games + '-game Pro-Am'; throw new Error(out.fail); }
    const P = P0;
    const perGame = (P.game[0] || P.game[1] || P.game[2]) ? null : 0;   // Даллас платит и за игры — там только «не меньше таблицы»
    const table = P.prize[row.place - 1] || 0;
    const prizeOk = perGame === 0 ? (row.prize === table || row.prize === Math.round(table / 2)) : row.prize >= Math.round(table / 2);
    out.steps.push('prize: ' + row.prize + ' for place ' + row.place + ' (table ' + (P.prize[row.place - 1] || 0) + ')');
    if (!prizeOk) { out.fail = 'the prize is not the table share'; throw new Error(out.fail); }
    if (!(cr.proam || {})['1|' + STOP]) { out.fail = STOP + ' is not recorded as played'; throw new Error(out.fail); }
    if (!!(cr.proam || {})[1] !== (STOP === 'ProAm_Dallas')) { out.fail = 'the old per-season key is wrong for ' + STOP; throw new Error(out.fail); }
    const arrive = (cr.news || []).find(n => n.k === 'ccPostLanArrive');
    out.steps.push('arrival post: ' + JSON.stringify(arrive && arrive.a));
    const cityRe = ZB ? /S[aã]o Paulo|Сан-Паулу|San Paolo/ : /Dallas|Даллас/;
    if (!arrive || !cityRe.test(String(arrive.a && arrive.a[0]))) { out.fail = 'the arrival post names the wrong city'; throw new Error(out.fail); }
    if (!careerProAmCan() === false) {}
    out.steps.push('can go again today: ' + careerProAmCan());
    if (careerProAmCan()) { out.fail = STOP + ' can be played twice'; throw new Error(out.fail); }
  } catch(e){ if(!out.fail) out.fail = String(e && e.stack || e); }
  out.errs = window.__errs;
  document.getElementById('__out').textContent = 'BEGIN' + encodeURIComponent(JSON.stringify(out)) + 'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsproamzb-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, HEAD + src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
if (out.errs && out.errs.length) { console.error('page errors: ' + out.errs.slice(0, 5).join(' | ')); process.exit(1); }
if (out.fail) { console.error('FAILED: ' + out.fail); process.exit(1); }
console.log(STOP === 'ProAm_Dallas' ? 'Pro-Am Dallas: the Build night plays through the interface' : 'Pro-Am São Paulo: Zero Build night plays through the interface');
fs.rmSync(dir, { recursive: true, force: true });
