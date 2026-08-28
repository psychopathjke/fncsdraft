// В финал Саммита едут те, кто прошёл, а не те, кого посеяли.
//
// Его вопрос, 26 августа: «как собираются финалы, почему люди из хитов и апера
// и ловера, кто квал, не играет финалы». Обе поздние комнаты Саммита строились
// careerSummitField ЗАНОВО, посевом по силе: верхняя сетка играла в пятницу,
// отсечка честно считалась, а в воскресенье финал брал первую половину того же
// посева — вылетевшие оставались, прошедшие исчезали.
//
// Здесь стережётся то, что видит игрок: кого показали прошедшим накануне, тот
// и сидит в зале. Плюс два контроля — что запись вообще на что-то влияет и что
// старый сейв без записи по-прежнему собирает комнату.
//
//   node tools/check-career-summit-carry.js [папка сборки]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = (process.argv[2] || path.resolve(__dirname, '..')).replace(/\\/g, '/');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = () => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Carry', age:19, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:93, role:'roleIGL',
              attrs:ccRookieAttrs(93,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-29', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
    const me=careerCard();
    drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const you=Object.assign(careerYouTeam([me]), {isYou:true, name:'you'});
    return you;
  };
  const names=f=>f.map(t=>(t.squad||[]).map(c=>c&&c.handle).sort().join('&'));
  try {
    const you=seed();
    // Верхняя сетка — комната пятницы, какой её видит игрок.
    const upper=careerSummitField('upper', you, [careerCard()]);
    out.notes.верх={команд:upper.length};
    const cut=ccScaleStage(CC_SUMMIT_STAGE.upper).cut;
    // Кто прошёл, а кто вылетел — берём прямо из этой комнаты по отсечке.
    const passed=upper.filter(t=>t!==you).slice(0, cut);
    const fell=upper.filter(t=>t!==you).slice(cut);
    CAREER.career.summitSeed={season:1, size:2,
      upper:passed.map(ccStageSeatRow), fell:fell.map(ccStageSeatRow)};
    // Нижняя сетка: вылетевшие из верхней обязаны в ней быть.
    const low=careerSummitField('lower', you, [careerCard()]);
    const lowN=new Set(names(low));
    const fellN=names(fell);
    const missFell=fellN.filter(n=>!lowN.has(n));
    out.notes.низ={команд:low.length, вылетевших:fellN.length,
                   нетВКомнате:missFell.length};
    check('вылетевшие из верхней сетки играют нижнюю',
          missFell.length===0, missFell.slice(0,3).join(' | '));
    // И прошедшие верхнюю в нижней НЕ сидят — они уже в финале.
    const passN=new Set(names(passed));
    const wrong=names(low).filter(n=>passN.has(n));
    out.notes.низПрошедших=wrong.length;
    check('прошедшие верхнюю в нижней не играют', wrong.length===0,
          wrong.slice(0,3).join(' | '));

    // Финал: прошедшие обеих сеток.
    /* Тем же правилом, каким комнату считает сам турнир: победа в игре — билет,
       остальные места по очкам. Шесть побед за шесть игр — столько же, сколько
       игр в стадии, поэтому 19 по очкам плюс 6 победителей дают ровно 25. */
    const lcut=ccScaleStage(CC_SUMMIT_STAGE.lower).cut;
    const lowTeams=low.filter(t=>t!==you);
    lowTeams.forEach((t,i)=>{ t.stagePts=1000-i; if(i>=30 && i<36) t.gotVR=true; });
    const q=heatQualifiers(lowTeams, lcut, true);
    /* Одно из двадцати пяти мест нижней сетки — своё: игрок её отыграл и прошёл.
       Настоящая запись так и выглядит — строка 'you' среди прошедших, — поэтому
       чужих в списке двадцать четыре, а не двадцать пять. Иначе в зал из
       пятидесяти набивается пятьдесят одна команда и одна честно вылетает. */
    const passedLow=lowTeams.filter(t=>q.has(t));
    const lowPass=passedLow.slice(0, lcut-1);
    out.notes.нижняяОтсечка={отсечка:lcut, прошло:passedLow.length,
                             своёМесто:1, чужих:lowPass.length};
    CAREER.career.summitSeed.lower=['you'].concat(lowPass.map(ccStageSeatRow));
    CAREER.career.summitSeed.out=lowTeams.filter(t=>!lowPass.includes(t))
                                         .map(ccStageSeatRow);
    const fin=careerSummitField('final', you, [careerCard()]);
    const finN=new Set(names(fin));
    const missUp=names(passed).filter(n=>!finN.has(n));
    const missLow=names(lowPass).filter(n=>!finN.has(n));
    out.notes.финал={команд:fin.length, изВерхней:names(passed).length,
                     изНижней:names(lowPass).length,
                     нетИзВерхней:missUp.length, нетИзНижней:missLow.length};
    check('прошедшие верхнюю сетку играют финал', missUp.length===0,
          missUp.slice(0,3).join(' | '));
    check('прошедшие нижнюю сетку играют финал', missLow.length===0,
          missLow.slice(0,3).join(' | '));
    // Вылетевшие из нижней в финал не попадают.
    const lowOut=names(lowTeams.filter(t=>!lowPass.includes(t)));
    const ghosts=lowOut.filter(n=>finN.has(n));
    out.notes.призраки=ghosts.length;
    check('вылетевшие из нижней в финале не сидят', ghosts.length===0,
          ghosts.slice(0,3).join(' | '));
    // И зал при этом полный: запрет вылетевшим не должен обрезать финал.
    const full=ccScaleStage(CC_SUMMIT_STAGE.final).field;
    check('в финале полный зал', fin.length===full, fin.length+' из '+full);

    /* Контроль: без записи финал собирается как раньше — и он ДРУГОЙ. Иначе
       всё выше зелёное просто потому, что посев и так совпадал. */
    const withSeed=names(fin).join('|');
    delete CAREER.career.summitSeed;
    const plain=careerSummitField('final', you, [careerCard()]);
    out.notes.контроль={безЗаписи:plain.length,
                        совпалоСЗаписью:names(plain).join('|')===withSeed};
    check('контроль: без записи комната собирается', plain.length>1,
          String(plain.length));
    check('контроль: с записью финал не тот же, что посевом',
          names(plain).join('|')!==withSeed, 'совпал до команды');
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sumcarry-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('в поздние комнаты Саммита едут те, кто их выиграл');
fs.rmSync(dir, { recursive: true, force: true });
