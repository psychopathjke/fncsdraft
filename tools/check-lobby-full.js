// Полные лобби (его вопрос 7.10: «посмотри лобби каждого турнира, везде все игроки в полном лобби играют?»).
// Замер перехватом на всех проверках годов: поле делилось ПОРОВНУ — 310 команд на 7 лобби по 44–45, 430 на 9 по
// 47–48, трио 2410 на 32–33 — то есть ты почти всегда играл в неполном лобби. У Epic лобби набираются до сотни.
// Правило: лобби с человеком (isYou/isRival/isMate) полное; полных лобби floor(n/max); ни одного больше max;
// никого не потеряли; хвост меньше половины лобби делится с соседним (комнаты на три команды не бывает).
//   node tools/check-lobby-full.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(String.fromCharCode(92)).join('/');
const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const BOOT = `<pre id="__out" style="display:none"></pre><script>window.addEventListener('load',()=>setTimeout(()=>{ const out={fails:[], notes:[]};
try{
  [[310,50],[430,50],[2410,33],[51,50],[99,50],[101,50],[175,50],[50,50],[49,50],[900,20],[13,20],[205,100]].forEach(([n,max])=>{
    [0, Math.floor(n/2), n-1].forEach(at=>{
      const teams=[]; for(let i=0;i<n;i++) teams.push({name:'t'+i});
      teams[at].isYou=true; if(n>3) teams[(at+n-1)%n].isRival=true;
      const ls=splitIntoLobbies(teams, max), sizes=ls.map(l=>l.length);
      const tag=n+'/'+max+' (ты #'+at+'): ['+(sizes.length>8 ? sizes.slice(0,3).join(',')+',…,'+sizes.slice(-3).join(',') : sizes.join(','))+']';
      if(at===0) out.notes.push(tag);
      const total=sizes.reduce((a,b)=>a+b,0);
      if(total!==n) out.fails.push(tag+': потеряно '+(n-total));
      if(Math.max(...sizes)>max) out.fails.push(tag+': лобби больше нормы');
      if(n>=max){
        const r=n%max, f=Math.floor(n/max), tail=r && r<Math.ceil(max/4);
        if(f>=2 || !tail) ls.filter(l=>l.some(t=>t.isYou||t.isRival)).forEach(l=>{ if(l.length!==max) out.fails.push(tag+': человек в лобби на '+l.length); });
        const full=sizes.filter(s=>s===max).length, want=f-(tail ? 1 : 0);
        if(full<want) out.fails.push(tag+': полных лобби '+full+', а можно '+want);
        if(Math.min(...sizes)<Math.min(max, Math.ceil(max/4))) out.fails.push(tag+': лобби на '+Math.min(...sizes)+' команд');
      }
    });
  });
}catch(e){ out.fails.push(String(e.stack||e)); }
document.getElementById('__out').textContent='@@B@@'+encodeURIComponent(JSON.stringify(out))+'@@E@@'; }, 500));<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lobfull-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CH, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(String.fromCharCode(92)).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
fs.rmSync(dir, { recursive: true, force: true });
const out = JSON.parse(decodeURIComponent(dom.match(/@@B@@([^@<]*)@@E@@/)[1]));
if (out.fails.length) { console.log(['FAIL'].concat(out.fails.slice(0, 15)).join(String.fromCharCode(10))); console.log(out.notes.join(String.fromCharCode(10))); process.exit(1); }
console.log('OK лобби полные' + String.fromCharCode(10) + out.notes.join(String.fromCharCode(10)));
