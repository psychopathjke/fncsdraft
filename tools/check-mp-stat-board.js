// Доска лидеров вечера (Kinch) в команде — одна на двоих.
//
// Notion 21.10, двое играли командой: «кинч у всех не одинаковые статы пишет» — строка своей команды у каждого была
// подписана им самим («64 @wolfixx» против «64 @gzabor»). Проба: та же своя команда глазами двоих (состав в своём
// порядке, своё имя игрока) даёт одну и ту же доску; в одиночной карьере строка своей команды — по-прежнему ты.
//
//   node tools/check-mp-stat-board.js
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
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Wolfixx', age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:85, role:'roleIGL', attrs:ccRookieAttrs(85,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-04', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], seed:'stb'},
      partners:[]}));
    careerLoad();
    const ros=ccSceneRoster('EU').slice(0, 12);
    const A={handle:'Wolfixx', nat:'de', region:'EU', rating:85}, B={handle:'Gzabor', nat:'ru', region:'EU', rating:85};
    const ms=(k)=>({games:6, dmgTo:9000+k*500, dmgFrom:6000, assists:20+k, elims:30+k*4, timeAlive:900+k*40, inStorm:60, dist:9000+k*100, wood:900, stone:500, metal:300});
    const field=(order)=>{
      const you=careerTeam(order); you.isYou=true; you.name='You'; you.mstats=ms(9);
      const rest=[0,1,2,3,4].map(i=>{ const t=careerTeam([ros[i*2], ros[i*2+1]]); t.name=teamLabel([ros[i*2], ros[i*2+1]]); t.mstats=ms(i); return t; });
      return [you].concat(rest);
    };
    const board=(order, nick)=>{ CAREER.player.nick=nick; return JSON.stringify(ccStatLeaders(field(order))); };
    // Одиночная: строка своей команды — ты.
    const solo=ccStatLeaders(field([A, B]));
    check('в одиночной строка своей команды — ты', solo.some(r=>r[2]===ccHandle('Wolfixx')), JSON.stringify(solo.slice(0,2)));
    // Команда: два взгляда на одну команду.
    CAREER.career.mp={code:'STATB', role:'a'};
    const a=board([A, B], 'Wolfixx'), b=board([B, A], 'Gzabor');
    out.notes.row=JSON.parse(a)[0];
    check('в команде доска у двоих одна', a===b, a.slice(0,160)+' vs '+b.slice(0,160));
    check('и своя команда на ней есть', JSON.parse(a).some(r=>r[2]===ccHandle('Wolfixx') || r[2]===ccHandle('Gzabor')), a.slice(0,200));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccstb-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('доска лидеров в команде — одна на двоих '+JSON.stringify(out.notes));
