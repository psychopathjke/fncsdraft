// Одна команда — одна строка в таблице Истории.
//
// Его снимок, 26 августа: в таблице турнира «Malibuca & vic0» стоит первой
// строкой с подписью «это ты» и второй строкой — та же пара ещё раз. Игрок
// назвался ником из ростера, напарник у него настоящий, и вычисленный чемпион
// сезона сошёлся с его же составом: список skip держал обоих, но действовал
// только на выдуманные пары, а чемпион садился мимо него.
//
// Здесь стережётся то, что видно глазами: ни одно имя не встречается в таблице
// дважды, и своя строка в ней ровно одна.
//
//   node tools/check-career-arc-nodupe.js [папка сборки]
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
  /* Ровно его случай: ник игрока — имя из ростера, напарник тоже из ростера, и
     оба стоят в одной записанной паре, то есть вычисленный чемпион сезона
     вполне может оказаться этим же составом. */
  const seed = (nick, mate, log) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:nick, age:20, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:96, role:'roleIGL',
              attrs:ccRookieAttrs(96,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-09-30', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], news:[], log:log},
      partners:[{handle:mate, cardRegion:'EU', dev:0, since:'2026-01-12'}]
    }));
    careerLoad();
    skipAnimation=true; CC_SKIP_RUN=true;
  };
  const row=(o)=>Object.assign({season:1, div:1, of:50, passed:true, ovr:96,
    games:8, wins:2, elims:58, avg:4, prize:250000}, o);
  const dupes=(t)=>{
    const seen={}, bad=[];
    (t.rows||[]).forEach(r=>{ const k=String(r.name||'').toLowerCase();
      if(seen[k]) bad.push(r.name); else seen[k]=1; });
    return bad;
  };
  try {
    // Пара из ростера: возьмём записанную европейскую пару целиком.
    const pair=ccArcPairs('EU').pairs[0].cards;
    const nick=pair[0].handle, mate=pair[1].handle;
    out.notes.состав={ник:nick, напарник:mate};
    // Игрок ВЫИГРАЛ свой Мейджор этой же парой.
    seed(nick, mate, [row({day:'2026-05-10', place:1, pts:516,
                           kind:'major', stage:'final', mate:mate})]);
    const a=careerArchiveSeason(1);
    const t=careerArchiveFinal(1, 'm|1|'+a.home);
    const bad=dupes(t);
    const mineRows=(t.rows||[]).filter(r=>r.you).length;
    out.notes.мейджор={строк:t.rows.length, повторов:bad.length,
                       первый:t.rows[0].name, своихСтрок:mineRows,
                       примеры:bad.slice(0,3)};
    check('в таблице нет одинаковых команд', bad.length===0, bad.slice(0,3).join(' | '));
    check('своя строка в таблице одна', mineRows===1, String(mineRows));
    check('и она первая, раз турнир выигран',
          (t.rows[0]||{}).you===true, t.rows[0].name);

    // То же для ЛАНа, где комната собирается из семи регионов.
    seed(nick, mate, [row({day:'2026-05-31', place:1, pts:500,
                           kind:'summit', stage:'final', mate:mate})]);
    const b=careerArchiveSeason(1);
    const bt=careerArchiveFinal(1, 'g|summit');
    const bbad=dupes(bt);
    out.notes.саммит={строк:bt.rows.length, повторов:bbad.length,
                      первый:bt.rows[0].name,
                      своихСтрок:(bt.rows||[]).filter(r=>r.you).length};
    check('в таблице ЛАНа тоже нет одинаковых команд', bbad.length===0,
          bbad.slice(0,3).join(' | '));

    /* А теперь сама развилка, без надежды на бросок.

       Двоение случается, когда ВЫЧИСЛЕННЫЙ чемпион сезона сошёлся с составом
       игрока: своя строка вставляется отдельно, а он садится мимо списка skip.
       Бросок сцены выбирает чемпиона из десятка верхних пар, поэтому в живом
       прогоне это выпадает не каждый раз — здесь тот же вызов делается руками. */
    const mineCards=pair.slice();
    const skipSet=new Set(mineCards.map(c=>hKey(c)));
    const seats=ccArcField('EU', 2, 10, careerRng(12345), mineCards, skipSet, 1);
    const seated=seats.filter(s=>(s.cards||[]).some(c=>skipSet.has(hKey(c))));
    out.notes.развилка={мест:seats.length, своихСоставов:seated.length,
                        чемпионСел:seats.some(s=>s.champ)};
    check('вычисленный чемпион не садится, если это состав игрока',
          seated.length===0,
          seated.map(s=>s.cards.map(c=>c.handle).join(' & ')).join(' | '));
    check('и комната при этом всё равно набирается',
          seats.length>=9, String(seats.length));
    // Обратная сторона: ЧУЖОЙ чемпион садиться обязан.
    const other=ccArcPairs('EU').pairs[5].cards;
    const seats2=ccArcField('EU', 2, 10, careerRng(12345), other, skipSet, 1);
    out.notes.чужойЧемпион={сел:seats2.some(s=>s.champ)};
    check('контроль: чужой чемпион садится', seats2.some(s=>s.champ),
          JSON.stringify(out.notes.чужойЧемпион));

    /* Контроль: чужой чемпион из таблицы НЕ пропадает — иначе проверка
       зелёная просто потому, что первую строку перестали сажать вовсе. */
    seed('SomebodyElse', mate, [row({day:'2026-05-10', place:9, pts:300,
                                     kind:'major', stage:'final', mate:mate})]);
    const c=careerArchiveSeason(1);
    const ct=careerArchiveFinal(1, 'm|1|'+c.home);
    out.notes.контроль={первый:ct.rows[0].name, своё:(ct.rows.find(r=>r.you)||{}).p,
                        строк:ct.rows.length, повторов:dupes(ct).length};
    check('контроль: не выигранный турнир по-прежнему имеет чемпиона',
          !!ct.rows[0].name && !ct.rows[0].you, ct.rows[0].name);
    check('контроль: и в нём тоже нет повторов', dupes(ct).length===0,
          dupes(ct).slice(0,3).join(' | '));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcdupe-'));
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
console.log('в таблице Истории каждая команда стоит один раз');
fs.rmSync(dir, { recursive: true, force: true });
