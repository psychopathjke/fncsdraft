// История: у разных сезонов — разные итоги, у настоящего года — настоящие.
//
// Тестер, 5 октября (Notion «05»): «баганная таблица победителей турниров — на Америке одни и
// те же победители и итоги ФНКС в каждом новом сезоне». Пары чужого региона в Истории брались
// из всех лет сразу и кэшировались на регион, без сезона, — каждый сезон садил одну и ту же
// очередь сильнейших пар. Правила:
//   1. Карьера 2024-го, сезон 1 (люди 2024-го): Мейджоры Америки и Европы — настоящие
//      Гранд-финалы (_T[f1..f3][reg].G): чемпион и первая строка таблицы — первая строка доски.
//   2. Карьера 2022-го, дожившая до 2025-го: таблицы Мейджоров Америки в 2023 и 2024 годах
//      собраны из РАЗНЫХ команд (верх десяти по всем Мейджорам пересекается меньше чем наполовину).
//   3. Финал своего Мейджора, сыгранный миром без игрока (cr.arcWorld), — в Истории тем, кем сыгран.
//
//   node tools/check-career-arc-seasons.js          (INDEX=путь — прогнать другой index.html)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const INDEX = process.env.INDEX || path.join(ROOT, 'index.html');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const SL = String.fromCharCode(92);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:{}, err:null, errs:[]};
  window.addEventListener('error', e=>{ out.errs.push(String(e.message)+' @'+e.lineno); });
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const boot=(reg, y0, S)=>{
    const card=(h, o)=>({handle:h, region:reg, rating:o, _ovr:o, nat:'us', tier:'ladder', event:'ladder', placement:null, rarity:'common', partner:null});
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ArcSeasons', age:20, source:'rookie', country:'us', countryPing:15, closeRangeEdge:6,
        region:reg, ovr:80, role:'roleIGL', attrs:null, ageEdge:4, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, size:2, year:y0, year0:y0, day:y0+'-09-08', seasonOver:true, division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'arcs'},
      partner:{card:card('M1',80), patience:60, since:'2018-11-01', dev:0},
      partners:[{card:card('M1',80), patience:60, since:'2018-11-01', dev:0}], dev:{}}));
    const s=JSON.parse(localStorage.getItem('fncsdraft_career')); s.player.attrs=ccRookieAttrs(80,'roleIGL'); localStorage.setItem('fncsdraft_career', JSON.stringify(s));
    careerLoad(); careerMigrateSize();
    for(let k=1;k<S;k++){ CAREER.career.seasonOver=true; careerNewSeason(); }
    CAREER.career.seasonOver=true; CH_ARC_TBL={};
  };
  const key=s=>String(s||'').toLowerCase().split(' & ').map(x=>x.trim()).sort().join('|');
  try{
    // 1. Настоящий 2024-й.
    boot('NAC', 2024, 1);
    const a=careerArchiveSeason(1);
    ['NAC','EU'].forEach(reg=>{
      a.regional.forEach(ev=>{
        const set='f'+ev.n, b=_T[set] && _T[set][reg] && _T[set][reg].G;
        if(!b) { check('нет доски '+set+' '+reg, false); return; }
        const top=b.slice().sort((p,q)=>p.rank-q.rank)[0].duo.join(' & ');
        const w=ev.perReg[reg].name, t=careerArchiveFinal(1, 'm|'+ev.n+'|'+reg);
        out.notes[reg+' M'+ev.n]=w;
        check(reg+' Мейджор '+ev.n+': чемпион настоящий', key(w)===key(top), w+' vs '+top);
        check(reg+' Мейджор '+ev.n+': таблица настоящая', t && t.rows.length>=40 && key(t.rows[0].name)===key(top) && t.rows[0].pts===b.slice().sort((p,q)=>p.rank-q.rank)[0].pts,
          t ? t.rows.length+' / '+t.rows[0].name+' '+t.rows[0].pts : 'нет таблицы');
      });
    });
    const champs=new Set(a.regional.map(ev=>key(ev.perReg.NAC.name)));
    check('Америка 2024: не один чемпион на три Мейджора', champs.size>=2, [...champs].join(', '));
    // 3. Мир сыграл свой финал без игрока — История называет его.
    CAREER.career.arcWorld={'1|major1':{day:'2024-02-25', won:[{h:'Clix', r:'NAC'},{h:'Higgs', r:'NAC'}],
      top:[{n:'Clix & Higgs', p:901, w:2, e:30, r:'NAC'},{n:'Reet & Cooper', p:800, w:1, e:20, r:'NAC'}]}};
    CH_ARC_TBL={};
    const aw=careerArchiveSeason(1), w1=aw.regional.find(ev=>ev.n===1).perReg.NAC;
    const t1=careerArchiveFinal(1, 'm|1|NAC');
    check('финал мира — чемпион', key(w1.name)===key('Clix & Higgs'), w1.name);
    check('финал мира — таблица', t1 && t1.rows[0].pts===901 && key(t1.rows[1].name)===key('Reet & Cooper'), t1 && t1.rows.slice(0,2).map(r=>r.name+' '+r.pts).join(' ; '));
    check('чужой регион — всё ещё настоящий', key(aw.regional.find(ev=>ev.n===1).perReg.EU.name)===key(out.notes['EU M1']));
    // 2. Свой мир: 2023 и 2024 годы — разные сцены.
    boot('NAC', 2022, 4);
    const teamsOf=sn=>{ const s=new Set(); careerArchiveSeason(sn).regional.forEach(ev=>{
      const t=careerArchiveFinal(sn, 'm|'+ev.n+'|NAC'); (t ? t.rows.slice(0,10) : []).forEach(r=>s.add(key(r.name))); }); return s; };
    const s2=teamsOf(2), s3=teamsOf(3);
    const both=[...s2].filter(x=>s3.has(x)).length, jac=both/(s2.size+s3.size-both);
    out.notes.overlap={y2023:s2.size, y2024:s3.size, both:both, jaccard:+jac.toFixed(2)};
    check('2023 и 2024 в своём мире — разные команды наверху', jac<0.5, JSON.stringify(out.notes.overlap));
    check('без ошибок JS', out.errs.length===0, out.errs.slice(0,3).join(' | '));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcseas-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(SL).join('/') + '/">' + fs.readFileSync(INDEX, 'utf8') + BOOT);
const html = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + tmp.split(SL).join('/')], { maxBuffer: 1 << 28, timeout: 900000, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = /PBEGIN(.*?)PEND/.exec(html);
if (!m) { console.log('FAIL: no result'); process.exit(1); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs && out.errs.length) out.errs.slice(0, 5).forEach(e => console.log('JSERR ' + e.slice(0, 400)));
if (out.err) { console.log('ERR ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK check-career-arc-seasons');
