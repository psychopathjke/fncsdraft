const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

/* Notion 12.10: «в дуо свизи квалится с ванякеком на глобалы, а играет их всё равно с пикси… чтобы они реально
   сплитались». Глобалы 2026 в карьере без записи Саммита садили места Саммита настоящим списком 2026-го
   (GC_SUMMIT_DUOS), не глядя на сцену. Сторож: сезоны 1–3, поле Глобалов, каждая команда, оба человека которой
   стоят в парах сцены (careerPools), должна быть ИХ парой. Плюс то же для Парижа (ccRcField). */
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  try {
    const seed = (season, day) => {
      localStorage.setItem('fncsdraft_career', JSON.stringify({
        v:1,
        player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
                closeRangeEdge:0, region:'EU', ovr:92, role:'roleIGL',
                attrs:ccRookieAttrs(92,'roleIGL'), ageEdge:0, photo:null,
                handle:null, cardRegion:null, nat:null},
        career:{season:season, day:day, division:1, earnings:0, balance:0,
                reach:10000, tokens:[], log:[]},
        partner:null
      }));
      careerLoad();
      if(!careerPartnerCard()){ careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer'&&!x.who.org&&!x.who.brand); if(s) careerDmAccept(s.id); }
    };
    const sceneMate = () => {
      const m = new Map();
      (careerPools().duos||[]).forEach(d => { const cs=(d.cards||[]).filter(Boolean); if(cs.length!==2) return;
        m.set(hKey(cs[0]), hKey(cs[1])); m.set(hKey(cs[1]), hKey(cs[0])); });
      return m;
    };
    const wrong = (teams, m) => {
      const bad = [];
      teams.forEach(t => { const sq=(t.squad||[]).filter(Boolean); if(sq.length!==2) return;
        const a=hKey(sq[0]), b=hKey(sq[1]);
        if(m.has(a) && m.has(b) && m.get(a)!==b) bad.push(sq.map(c=>c.handle).join('+')+' (сцена: '+sq[0].handle+'+'+m.get(a)+')'); });
      return bad;
    };
    for (const season of [1, 2, 3]) {
      seed(season, '2026-09-26');
      const mine = [careerCard(), careerPartnerCard()];
      const me = careerYouTeam(mine); me.isYou = true;
      const m = sceneMate();
      const gc = careerGlobalsField(me, mine, 'summit');
      const bad = wrong(gc, m);
      out.notes['s'+season+' globals'] = {teams: gc.length, scenePairs: m.size/2, wrong: bad.length, sample: bad.slice(0,3)};
      check('season '+season+': Globals pairs are the scene pairs', bad.length === 0, bad.slice(0,3).join('; '));
      const rc = ccRcField(CAREER.career, CAREER.career, mine, 'final', 20);
      const badRc = wrong(rc, m);
      out.notes['s'+season+' paris'] = {teams: rc.length, wrong: badRc.length};
      check('season '+season+': Paris pairs are the scene pairs', badRc.length === 0, badRc.slice(0,3).join('; '));
    }
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncslanpairs-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + (process.env.CC_NOFIX ? src.replace('duo=ccLanSceneDuo(duo);', '') : src) + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=900000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('LAN pairs are the career scene pairs');
fs.rmSync(dir, { recursive: true, force: true });
