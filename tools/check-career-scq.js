// ВТОРОЙ ШАНС САММИТА 2026 (Notion 20.10, игрок: «a cup to qual for globals if you didn't in grands of Major 1,
// only those who didn't qual and were div 1 could play, and who qualified from the second chance go to the lower
// of summit»). Epic / Liquipedia: 28.04 открытый день дивизиона 1 без места на Саммите, 29.04 финал 50 дуо × 6 игр,
// квоты регионов (EU 8) в нижнюю сетку.
//
// Проверяется: дни в календаре; кто допущен (Д1 без основной сетки — да, топ-20 финала Мейджора и Д2 — нет);
// открытый день играется через хаб и пишет запись; финал играется, платит по таблице Liquipedia и сажает в нижнюю
// сетку только прошедших; прошедшие финала стоят в своей квоте нижней сетки.
//
//   node tools/check-career-scq.js
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
  setInterval(function(){
    const am=document.getElementById("ccAskModal"); if(am && am.style.display==="flex"){ if(document.getElementById("ccAskYes") && document.getElementById("ccAskYes").textContent===L().ccSpotGateSet){ careerSpotEnsure(); am.style.display="none"; careerPlay(); return; } }
    const c0=document.querySelector(".cc-choice-btn"); if(c0){ c0.click(); return; }
    const p=document.querySelector(".landing-picker"); if(!p) return;
    const z=p.querySelectorAll(".land-zone"); if(!z.length) return;
    z[0].click();
    const c=p.querySelector("#gameLandingConfirm"); if(c && !c.disabled) c.click();
  }, 20);
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const seat = () => { if(careerPartnerCard()) return; careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer'&&!x.who.org&&!x.who.brand); if(s){ careerDmAccept(s.id); careerRenderHub('centre'); } };
  const seed = (majorPlace, day, extra) => {
    const log = majorPlace ? [{season:1, day:'2026-04-26', div:1, place:majorPlace, of:50, kind:'major', stage:'final', passed:true, prize:0}] : [];
    localStorage.setItem('fncsdraft_career', JSON.stringify({ v:1,
      player:{nick:'Probe', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:97, role:'roleIGL',
              attrs:ccRookieAttrs(97,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:Object.assign({season:1, day:day, division:1, earnings:0, balance:0, reach:10000, tokens:[], log:log}, extra||{}),
      partner:null }));
    careerLoad();
  };
  const playNight = async (what) => {
    careerEntry(); seat();
    const next = careerNext();
    out.notes[what+'Next'] = next && (next.type+' / '+next.label);
    check(what+': хаб предлагает Второй шанс', next && next.type==='summit' && /SCQ/.test(String(next.id||'')), out.notes[what+'Next']);
    check(what+': и его можно играть', next && careerCanPlay(next)===true);
    const before = (CAREER.career.log||[]).length;
    document.querySelector('#screen-career-hub .ch-play').click();
    let card = null;
    for (let i = 0; i < 2400 && !card; i++) {
      await wait(25); skipAnimation = true;
      card = [...document.querySelectorAll('#majorStages .stage-card')].find(c => c.querySelector('button[onclick*="careerBackToHub"]'));
    }
    if (!card) throw new Error(what+': карточка итога не пришла');
    const save = JSON.parse(localStorage.getItem('fncsdraft_career')).career;
    return {save, row:(save.log||[]).slice(-1)[0], added:(save.log||[]).length-before};
  };
  try {
    const days = careerYearDays(); const found = {};
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO; d = ccAddDays(d, 1))
      (days.get(d)||[]).filter(e => e.kind === 'summit').forEach(e => { found[e.id] = d; });
    out.notes.days = found;
    check('открытый день 28 апреля', found.Summit_SCQPlay === '2026-04-28', found.Summit_SCQPlay);
    check('финал 29 апреля', found.Summit_SCQ === '2026-04-29', found.Summit_SCQ);

    // ---- кто допущен ----
    seed(30, '2026-04-28');
    check('Д1 с 30-м местом финала Мейджора — допущен', careerSummitCan(careerSummitOn('2026-04-28')) === true);
    seed(null, '2026-04-28');
    check('Д1 без финала Мейджора — тоже', careerSummitCan(careerSummitOn('2026-04-28')) === true);
    seed(5, '2026-04-28');
    check('топ-20 финала (уже на Саммите) — нет', careerSummitCan(careerSummitOn('2026-04-28')) === false);
    seed(30, '2026-04-28', {division:2});
    check('Д2 — нет', careerSummitCan(careerSummitOn('2026-04-28')) === false);
    seed(24, '2026-04-28');
    check('24-е место финала больше НЕ даёт нижнюю сетку само', ccSummitSeat() === null, String(ccSummitSeat()));
    check('финал Второго шанса закрыт до открытого дня', careerSummitCan(careerSummitOn('2026-04-29')) === false);

    // ---- открытый день ----
    seed(30, '2026-04-28');
    const a = await playNight('открытый день');
    out.notes.playRow = a.row && {kind:a.row.kind, stage:a.row.stage, place:a.row.place, of:a.row.of, games:a.row.games};
    check('пишет строку журнала', a.row && a.row.kind==='scq' && a.row.stage==='playin', JSON.stringify(out.notes.playRow));
    check('комната около 150, 10 игр', a.row && a.row.of>=145 && a.row.of<=150 && a.row.games===10, JSON.stringify(out.notes.playRow));
    check('день прошёл', a.save.day > '2026-04-28', a.save.day);
    check('запись Второго шанса', a.save.scq && a.save.scq.season===1 && (a.save.scq.play==='pass' || a.save.scq.play==='out'), JSON.stringify(a.save.scq&&{play:a.save.scq.play,place:a.save.scq.place}));
    if (a.save.scq && a.save.scq.play==='pass') check('прошедший видит финал', careerSummitCan(careerSummitOn('2026-04-29')) === true);
    else check('не прошедший финал не видит', careerSummitCan(careerSummitOn('2026-04-29')) === false);

    // ---- финал (проход открытого дня ставится руками, если бросок не пустил) ----
    seed(30, '2026-04-29', {scq:{season:1, play:'pass', pass:null, place:3, through:null}});
    const b = await playNight('финал');
    out.notes.finalRow = b.row && {kind:b.row.kind, stage:b.row.stage, place:b.row.place, of:b.row.of, games:b.row.games, prize:b.row.prize};
    check('строка финала', b.row && b.row.kind==='scq' && b.row.stage==='final', JSON.stringify(out.notes.finalRow));
    check('50 дуо, 6 игр', b.row && b.row.of===50 && b.row.games===6, JSON.stringify(out.notes.finalRow));
    const place = b.row && b.row.place;
    check('приз по таблице Liquipedia (EU)', b.row && b.row.prize===Math.round((scqPrize(place)||0)/2), (b.row&&b.row.prize)+' vs '+scqPrize(place));
    check('в Европе первые восемь — на Саммит', b.save.scq && b.save.scq.pass===(place<=8), JSON.stringify({place, pass:b.save.scq&&b.save.scq.pass}));
    check('место на Саммите следует итогу', ccSummitSeat() === (place<=8 ? 'scq' : null), String(ccSummitSeat()));
    check('запись финала несёт квоту', b.save.scq && Array.isArray(b.save.scq.rows) && b.save.scq.rows.length>=8, b.save.scq && String((b.save.scq.rows||[]).length));
    const top = ((b.save.scq && b.save.scq.rows)||[]).slice(0, 8).filter(r=>r!=='you');
    out.notes.board = careerMoneyRows('year').slice(0,5).map(r=>r.name+':'+r.usd);

    // ---- прошедшие сидят в нижней сетке ----
    CAREER.career.scq.pass = true; CAREER.career.day='2026-05-30';
    const me=careerCard(), mate=careerPartnerCard();
    const you=careerYouTeam([me, mate]); you.isYou=true; you.name='you';
    const lower=careerSummitField('lower', you, [me, mate]);
    const keys=new Set(lower.map(t=>(t.squad||[]).map(c=>c&&hKey(c)).sort().join('+')));
    const hit=top.map(ccStageTeamFrom).filter(Boolean).filter(t=>keys.has((t.squad||[]).map(c=>c&&hKey(c)).sort().join('+'))).length;
    out.notes.lowerHit = hit+'/'+top.length;
    check('прошедшие финал стоят в нижней сетке', hit >= top.length-1, out.notes.lowerHit);
    check('и мы в ней', lower.indexOf(you) >= 0);

    // ---- старый сейв, перешагнувший 29.04 без турнира: по-старому ----
    seed(24, '2026-05-30');
    check('сейв без Второго шанса после 29.04 сидит по-старому', ccSummitSeat() === 'scq', String(ccSummitSeat()));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent = 'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scq-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=1800000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('Второй шанс: два дня, допуск, финал с квотой и призами, прошедшие в нижней сетке');
fs.rmSync(dir, { recursive: true, force: true });
