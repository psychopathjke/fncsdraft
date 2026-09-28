// Главная и тренировка по образцу EA FC: плитки «Цели» и «Развитие», полоса недели,
// карты Creative с оценкой D…A+, Арена с Hype до 2023-го (допуск на кэш-капы с
// Champion League), своя карта в Creative с выплатами.
//
//   node tools/check-career-train-fc.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={steps:[], fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const card=(h, o)=>({handle:h, region:'EU', rating:o, _ovr:o, nat:'de', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
  const seed=(year, day, ovr, size)=>{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Trainman', age:20, source:'rookie', country:'de', countryPing:15, closeRangeEdge:6,
        region:'EU', ovr:ovr, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:size, year:year, year0:year, day:day, division:1, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], seed:'trfc'},
      partner:{card:card('M1',70), patience:60, since:day, dev:0},
      partners:[{card:card('M1',70), patience:60, since:day, dev:0}, {card:card('M2',70), patience:60, since:day, dev:0}]}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career'));
    s.player.attrs=ccRookieAttrs(ovr, 'roleIGL');
    localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerEntry();
  };
  const freeDay=(from)=>{ let d=from; for(let i=0;i<60;i++){ if(!(careerYearDays().get(d)||[]).length) return d; d=ccAddDays(d,1); } return from; };
  try{
    // ---- Очки Арены по таблице вики.
    check('соло, победа, 3 убийства, див. 1: 185+45', ccArenaMatchPts(1,0,1,3)===230, String(ccArenaMatchPts(1,0,1,3)));
    check('дуо, победа, 2 убийства, див. 8: 175+10−60', ccArenaMatchPts(2,7,1,2)===125, String(ccArenaMatchPts(2,7,1,2)));
    check('трио, 12-е место, див. 5: только топ-15, минус 30', ccArenaMatchPts(3,4,12,0)===-20, String(ccArenaMatchPts(3,4,12,0)));

    // ---- 2021: Арена вместо ранкеда, кэш-капы — с Champion League.
    seed(2021, '2021-03-01', 64, 3);
    CAREER.career.day=freeDay('2021-03-02'); careerSave();
    check('год 2021', ccCalYear()===2021, String(ccCalYear()));
    const h0=ccArenaHype();
    check('посев Hype от рейтинга: 64 → 5850', h0===5850, String(h0));
    check('5850 — Contender, див. 7 (старая таблица)', ccArenaDiv()===6, ccArenaName());
    const cup=ccVictoryList().find(v=>!v.invite && !v.lan && v.day>=careerToday());
    check('в 2021-м есть открытый кэш-кап', !!cup);
    if(cup){
      check('кэш-кап закрыт без Champion League', ccLifeWhy(cup.day, 'victory')==='lfWhyArena' || !careerVictoryOn(cup.day),
            String(ccLifeWhy(cup.day, 'victory')));
      ccLife().hype=6000;
      check('с 6000 Hype — Champion, кап открыт', ccArenaDiv()===7 && ccLifeWhy(cup.day, 'victory')!=='lfWhyArena');
      ccLife().hype=5850;
    }
    check('карточка ранкеда в 2021-м зовётся Арена', ccActName('trSur')==='Arena');
    const e0=careerEnergy();
    const ok=careerDoAct('trSur');
    check('вечер на Арене сыгран', !!ok && careerEnergy()<e0);
    check('Hype сдвинулся', ccLife().hype!==5850, String(ccLife().hype));
    check('новость про Арену', (CAREER.career.news||[]).some(n=>n.k==='lfNewsArena'));
    out.steps.push('Арена: 5850 → '+ccLife().hype+' ('+ccArenaName()+')');

    // ---- Оценка занятия.
    careerDoAct('trBox');
    const gr=(ccLife().gr||{})[careerToday()]||[];
    check('оценка записана', gr.some(r=>r.id==='trBox' && CC_GRADES.some(g=>g[0]===r.g)), JSON.stringify(gr));
    check('последняя оценка видна карточке', !!ccDrillLast('trBox'));
    // Средний множитель у свежего игрока ≈ 1 — темп карьеры не меняется.
    const lf=ccLife(); const keep=lf.gr; let sum=0, n=0;
    const cr=CAREER.career; const g0=cr.grind; cr.grind=0;
    for(let i=0;i<400;i++){ const save=cr.day; cr.day=ccAddDays('2021-01-01', i); sum+=ccDrillGrade('trAim').mult; n++; cr.day=save; }
    cr.grind=g0; lf.gr=keep;
    check('средний множитель оценки 0.95–1.08', sum/n>0.95 && sum/n<1.08, (sum/n).toFixed(3));
    out.notes.gradeMean=(sum/n).toFixed(3);

    // ---- Своя карта.
    for(let i=0;i<5;i++) ccMapWork();
    const m=ccMap();
    check('карта вышла после пяти вечеров', m && m.pub && /^\\d{4}-\\d{4}-\\d{4}$/.test(m.code), JSON.stringify(m));
    const b0=CAREER.career.balance||0;
    const paid=ccMapPay(1);
    check('карта платит за месяц', paid>0 && CAREER.career.balance===b0+paid, String(paid));
    out.steps.push('карта: '+(m&&m.name)+' · '+(m&&m.code)+' · $'+paid);

    // ---- Экраны.
    careerRenderHub('centre');
    const body=document.getElementById('chBody');
    check('на главной плитка «Цели»', !!body.querySelector('.hg-tile'));
    check('на главной плитка «Развитие» с Ареной', !!body.querySelector('.hd-tile') && body.innerHTML.indexOf('Hype')>=0);
    check('профиля соцсети на главной больше нет', !body.querySelector('.ch-tile-me'));
    careerRenderHub('log');
    check('ник и фото меняются во вкладке «Профиль»', !!document.querySelector('#chBody .ch-tile-me'));
    careerRenderHub('train');
    check('полоса недели: семь дней', document.querySelectorAll('#chBody .tw-day').length===7);
    check('в полосе сегодня видны сделанные занятия', !!document.querySelector('#chBody .tw-day.now .tw-did i'));
    check('карты Creative в тренировке', document.querySelector('#chBody').innerHTML.indexOf('Clix Box Fights')>=0);

    // ---- Обложка новости — сезона, в котором она вышла (или своего турнира).
    check('пост марта 2019 — ключевой арт 2019-го', ccNewsArtOf({k:'ccNewsKinch', day:'2019-03-02', a:[]}).src==='art/fncs-2019.jpg',
          ccNewsArtOf({k:'ccNewsKinch', day:'2019-03-02', a:[]}).src);
    check('март 2021 — постер C2S5 (f15)', ccSeasonArtOn('2021-03-01')==='art/cups/f15.jpg', ccSeasonArtOn('2021-03-01'));
    check('2026-й — без сезонного постера, по виду', ccSeasonArtOn('2026-03-01')==='');
    check('у поста со своим турниром — его постер', ccNewsArtOf({k:'ccNewsKinch', day:'2021-03-01', evArt:'art/cups/f16.jpg', a:[]}).src==='art/cups/f16.jpg');
    const cupDay=[...careerYearDays().keys()].find(d=>ccEventArtOwn((careerYearDays().get(d)||[])[0]));
    if(cupDay){ CAREER.career.day=cupDay; careerNews('flat', 'ccNewsKinch', ['x',1,2,'1.0',1,'0.5','1','1',1]);
      check('пост в день турнира несёт его постер', CAREER.career.news[0].evArt===ccEventArtOwn(careerYearDays().get(cupDay)[0]), CAREER.career.news[0].evArt); }

    // ---- 2026: ранкед, Арены нет.
    seed(2026, '2026-02-18', 70, 2);
    CAREER.career.day=freeDay('2026-02-18'); careerSave();
    careerDoAct('trSur');
    check('в 2026-м тренировка — ранкед, Hype не трогается', ccLife().hype==null && ccLife().rp!=null);
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cctrfc-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 600000 }).toString();
fs.rmSync(dir, { recursive: true, force: true });
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.steps.forEach(s => console.log('  ' + s));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-train-fc');
