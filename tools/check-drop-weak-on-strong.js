// Слабые не садятся на самых сильных (тестер, Notion «fncsdraft» 7.10: «чтобы на самых сильных не падали слабые,
// а то как-то тоже не реалистично, особенно когда их убивают»). Его ответ: «сделаю, чтоб меньше падали, но оффспавн рандом».
// Замер: поле 50 дуо (как в check-drop-crowd), сила разная; считаем коробки, где команда из топ-10 по силе стоит
// с командой из нижней половины. Правило: таких встреч в среднем не больше 1 на лобби, и толпа/пустые не ломаются.
//   node tools/check-drop-weak-on-strong.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:{}};
try{
  let meets=0, lobbies=0, crowd=0, emptyPair=0;
  ['m1','f1','k1'].filter(s=>{ try{ useLandingSet(s); return ALL_LANDING_ZONES.length>0; }catch(e){ return false; } }).forEach(set=>{
    for(let seed=0; seed<12; seed++){
      useLandingSet(set);
      const rnd=careerRng(ccHashStr('weak|'+set+'|'+seed)), pool=PLAYERS.filter(p=>p && p.handle).slice(0, 2000), bots=[];
      for(let i=0;i<50;i++){ const a=pool[Math.floor(rnd()*pool.length)], b=pool[Math.floor(rnd()*pool.length)];
        bots.push({name:a.handle+' & '+b.handle, squad:[a,b].map(p=>Object.assign({}, p, {rating:p.rating||80})), pow:60+rnd()*60, closeEdge:0}); }
      const base=new Map(bots.map(t=>[t, t.pow]));
      const g=buildBotLandingAssignment(bots).zoneGroups;
      const byPow=bots.slice().sort((x,y)=>base.get(y)-base.get(x)), top=new Set(byPow.slice(0,10)), low=new Set(byPow.slice(25));
      g.forEach(list=>{ if(list.some(t=>top.has(t))) meets+=list.filter(t=>low.has(t)).length; });
      const counts=ALL_LANDING_ZONES.map(z=>(g.get(z)||[]).length), dens=Math.max(2, Math.ceil(50/ALL_LANDING_ZONES.length));
      if(Math.max(...counts)>dens) crowd++;
      if(counts.some(c=>!c) && Math.max(...counts)>=2) emptyPair++;
      lobbies++;
    } });
  out.notes={lobbies, meetsPerLobby:+(meets/lobbies).toFixed(2), crowd, emptyPair};
  if(meets/lobbies>1) out.fails.push('слабый (нижняя половина) на точке топ-10: '+(meets/lobbies).toFixed(2)+' на лобби');
  if(crowd) out.fails.push('толпа выше плотности в '+crowd+' лобби');
  if(emptyPair) out.fails.push('пустые коробки при двоих в '+emptyPair+' лобби');
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'weak-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL ' + JSON.stringify(out.notes)].concat(out.fails).join(String.fromCharCode(10))); process.exit(1); }
console.log('OK слабые на сильных ' + JSON.stringify(out.notes));
