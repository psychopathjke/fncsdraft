// Из каких регионов состоит поле ЛАНа — по регионам, а не на глаз.
//
// Жалоба его игрока, 26 августа: «if you qual summit in major 1 oce there is
// like 15 oce teams and 0 eu teams in all of summit», и следом «same with
// globals». Здесь это считается: карьера заводится в разных регионах, поле
// Саммита и Глобалов строится, и печатается разбивка по регионам карточек.
//
//   node tools/probe-lan-regions.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {rows: [], err: null};
  const seed = (region) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'LanProbe', age:20, source:'rookie', country:region==='EU'?'de':'au',
              countryPing:15, closeRangeEdge:0, region:region, ovr:95, role:'roleIGL',
              attrs:ccRookieAttrs(95,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-05-20', division:1, earnings:0, balance:0,
              reach:9000, tokens:[], log:[], news:[]},
      partners:[]
    }));
    careerLoad();
  };
  const regionsOf = (field) => {
    const by={};
    field.forEach(t=>(t.squad||[]).forEach(c=>{
      const r=(c && (c.region || (typeof regionForNatOrUnknown==='function'
                                  ? regionForNatOrUnknown(c.nat) : null))) || '?';
      by[r]=(by[r]||0)+1;
    }));
    return by;
  };
  try {
    for(const reg of ['EU','OCE','NAC']){
      seed(reg);
      skipAnimation=true; CC_SKIP_RUN=true;
      const me=careerCard();
      drafted=[me]; CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
      const you=careerYouTeam([me]); you.isYou=true; you.name='you';
      const sum=careerSummitField('upper', you, [me]);
      const glob=careerGlobalsField(you, [me], 'summit');
      out.rows.push({регион:reg,
                     саммит:{команд:sum.length, по_регионам:regionsOf(sum)},
                     глобалы:{команд:glob.length, по_регионам:regionsOf(glob)}});
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lanreg-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала, копия: ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
out.rows.forEach(r => {
  console.log('  карьера ' + r.регион);
  console.log('    саммит  ' + r.саммит.команд + ' команд: ' + JSON.stringify(r.саммит.по_регионам));
  console.log('    глобалы ' + r.глобалы.команд + ' команд: ' + JSON.stringify(r.глобалы.по_регионам));
});
fs.rmSync(dir, { recursive: true, force: true });
