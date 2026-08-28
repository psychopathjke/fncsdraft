// Выдуманный народ региона ходит с теми флагами, что в ростере.
//
// Его слово, 26 августа, снимком лобби: «почему-то много азиатов больше чем
// нужно» — с двадцать девятого места и ниже стена японских флагов.
//
// Замер объяснил: в азиатском ростере 2 627 карточек, из них с флагом 1 765, и
// среди НИХ Япония 93%. А среди всех карточек региона японцев 63% — у 862
// человек страны в данных нет. Пул флагов для выдуманных игроков выбрасывал
// безфлаговых, и Япония вырастала с 63 до 93 процентов: лобби выходило
// японским сильнее, чем сам ростер.
//
// Здесь это и стережётся: доля самого частого флага среди выдуманных не должна
// уходить далеко от его доли в ростере. Проверяется на Азии, где разрыв был в
// тридцать пунктов, и на Европе, где его нет вовсе.
//
//   node tools/check-career-nat-mix.js
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (region) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'NatMix', age:20, source:'rookie', country:region==='EU'?'de':'jp',
              countryPing:15, closeRangeEdge:0, region:region, ovr:70, role:'roleIGL',
              attrs:ccRookieAttrs(70,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:5, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
    ccWorldReset();
    skipAnimation=true; CC_SKIP_RUN=true;
    drafted=[careerCard()]; CARD_MODE=true; squadSize=2;
  };
  // Доля самого частого флага СРЕДИ ВСЕХ карточек региона — то, чему поле и
  // обязано следовать. Безфлаговые считаются как есть, а не отбрасываются.
  const rosterShare = (reg) => {
    let all=0, by={};
    PLAYERS.forEach(p=>{ if((p.region||'')!==reg) return; all++;
      const k=p.nat||'—'; by[k]=(by[k]||0)+1; });
    const top=Object.entries(by).filter(x=>x[0]!=='—').sort((a,b)=>b[1]-a[1])[0];
    return {флаг:top?top[0]:null, доля:top?top[1]/all:0, всего:all};
  };
  const fieldShare = (reg) => {
    seed(reg);
    const me=careerCard();
    const f=careerCupField(CAREER.career, [me], ccTeams(50), 'natmix', false, 0);
    let all=0, by={};
    f.forEach(t=>(t.squad||[]).forEach(c=>{ all++;
      const k=(c && c.nat) || '—'; by[k]=(by[k]||0)+1; }));
    const top=Object.entries(by).filter(x=>x[0]!=='—').sort((a,b)=>b[1]-a[1])[0];
    return {флаг:top?top[0]:null, доля:top?top[1]/all:0, всего:all,
            безфлага:(by['—']||0)/Math.max(1,all)};
  };

  try {
    const rAsia=rosterShare('ASIA'), fAsia=fieldShare('ASIA');
    out.notes.Азия={ростер:Math.round(rAsia.доля*100)+'%',
                    поле:Math.round(fAsia.доля*100)+'%',
                    безфлага:Math.round(fAsia.безфлага*100)+'%', флаг:fAsia.флаг};
    check('в Азии поле следует ростеру, а не вырастает над ним',
          fAsia.доля - rAsia.доля <= 0.12,
          'ростер ' + Math.round(rAsia.доля*100) + '%, поле ' + Math.round(fAsia.доля*100) + '%');
    check('и безфлаговые в поле есть, как они есть в ростере',
          fAsia.безфлага > 0.10, Math.round(fAsia.безфлага*100) + '%');

    const rEu=rosterShare('EU'), fEu=fieldShare('EU');
    out.notes.Европа={ростер:Math.round(rEu.доля*100)+'%',
                      поле:Math.round(fEu.доля*100)+'%'};
    check('в Европе как было, так и осталось',
          Math.abs(fEu.доля - rEu.доля) <= 0.12,
          'ростер ' + Math.round(rEu.доля*100) + '%, поле ' + Math.round(fEu.доля*100) + '%');

    // И пул флагов действительно держит пустые — иначе первая проверка
    // зелёная просто потому, что регион маленький.
    seed('ASIA');
    const pool=careerNatPool();
    const empty=pool.filter(x=>!x).length;
    out.notes.пул={всего:pool.length, пустых:empty};
    check('в пуле флагов есть пустые', empty > 0, JSON.stringify(out.notes.пул));
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'natmix-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('флаги в лобби те же, что в ростере региона');
fs.rmSync(dir, { recursive: true, force: true });
