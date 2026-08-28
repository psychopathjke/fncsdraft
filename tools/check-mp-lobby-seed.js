// Сид команды — от сервера, один на двоих, и его не перетирает ничьё состояние.
//
// Живой сторож 28 августа (check-mp-live-two): у двоих в одном лобби cr.seed
// «LiveA» и «LiveB» — каждый завёл свой из ника, состояния перетёрли друг
// друга, и поле вечера у двоих было разным с первой игры.
//
//   node tools/check-mp-lobby-seed.js
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
  const seed=(nick)=>{ localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:nick, age:19, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0,
        region:'EU', ovr:90, role:'roleIGL', attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-12', division:1, earnings:0, balance:0, reach:0, tokens:[], log:[], news:[], mp:{code:'SEED01', role: nick==='Alpha'?'a':'b'}},
      partners:[]})); careerLoad(); MP.connect=function(){ MP.state='live'; return Promise.resolve(); }; MP.send=function(){}; };
  try{
    // Клиент A: сид уже родился из ника (так бывает — хаб зовёт ccCareerSeed).
    seed('Alpha'); ccCareerSeed();
    check('до сервера сид — ник', CAREER.career.seed==='Alpha', CAREER.career.seed);
    MP.say({t:'state', team:{}, seed:'team-lobby1', peer:null});
    check('состояние сервера ставит сид лобби', CAREER.career.seed==='team-lobby1', CAREER.career.seed);
    // Чужое командное состояние с ленивым ником не перетирает его.
    ccApplyTeamState({seed:'Bravo', division:1});
    check('присланный ник-сид не перетирает сид лобби', CAREER.career.seed==='team-lobby1', CAREER.career.seed);
    // И поле от него: два клиента с разными никами и одним сидом лобби собирают одну комнату.
    CARD_MODE=true; squadSize=2; useLandingSet(careerBrSet());
    const fieldOf=()=>careerCupField(CAREER.career, [careerCard()], 200, null, true, 0).map(t=>t.name).join('|');
    const fA=fieldOf();
    seed('Bravo'); ccCareerSeed();
    MP.say({t:'state', team:{}, seed:'team-lobby1', peer:null});
    const fB=fieldOf();
    check('одно лобби — одно поле у разных ников', fA===fB);
    // Контроль: другой сид лобби — другое поле.
    MP.say({t:'state', team:{}, seed:'team-lobby2', peer:null});
    check('контроль: другой сид лобби — другое поле', fieldOf()!==fA);
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccseed-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('сид команды приходит от лобби, один на двоих, и его никто не перетирает');
