// Сколько игр у карьеры за S43: от этого шанс Pirate Shop Token на игру. node tools/pirate-odds-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
const run = (handle, division) => {
  const BOOT = `<pre id="__out" style="display:none"></pre><script>(async function(){const out={};try{
    const card=h=>PLAYERS.filter(p=>p&&hKey(p.handle)===hKey(h)).sort((a,b)=>(attrsFor(b).ovr||0)-(attrsFor(a).ovr||0))[0];
    const me=card(${JSON.stringify(handle)});
    const mate=PLAYERS.find(p=>p&&p.handle!==me.handle&&p.region===me.region&&Math.abs((attrsFor(p).ovr||0)-(attrsFor(me).ovr||0))<2)||card('Scroll');
    localStorage.setItem('fncsdraft_career',JSON.stringify({v:1,player:{nick:me.handle,age:20,source:'card',country:'dk',countryPing:12,closeRangeEdge:0,region:'EU',ovr:Math.round(attrsFor(me).ovr),role:'roleIGL',attrs:null,ageEdge:0,photo:null,handle:me.handle,cardRegion:'EU',nat:me.nat||null},
      career:{season:1,day:'2026-10-31',division:${division},earnings:0,balance:5000,reach:0,tokens:[],log:[],news:[],size:2},partners:[{handle:mate.handle,cardRegion:'EU',dev:0,since:'2026-06-01'}]}));
    careerEntry();const d=careerFfDigest;careerFfDigest=function(){};await careerFastForward(36);careerFfDigest=d;
    const l=CAREER.career.log.filter(e=>e&&!e.who&&e.day&&ccSeasonNumOn(e.day)===43);
    out.ovr=Math.round(attrsFor(me).ovr);out.today=careerToday();out.evenings=l.length;out.games=l.reduce((s,e)=>s+(e.games||0),0);
  }catch(e){out.err=String(e&&e.stack||e).slice(0,400);}
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';})();<\/script>`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-')), tmp = path.join(dir, 'index.html');
  fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
  const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=3000000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  fs.rmSync(dir, { recursive: true, force: true });
  const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
  return m ? JSON.parse(decodeURIComponent(m[1])) : { err: 'нет вывода' };
};
[['Sky', 1], ['Scroll', 1], ['Howly', 2], ['Pixie', 3]].forEach(([h, d]) => console.log(h, d, JSON.stringify(run(h, d))));
