// ПИНГ В ФАЙТАХ (15.11): те же игры, ходы «лучший по ситуации», меняется только ccPingFightMs: выкл, 7, 25, 49, 72 мс.
//   node tools/career-ping-fight-probe.js [игр]
// (сделано из career-sit-probe.js) Окна по ситуации на настоящих играх: playGameWithChoices целиком (фарм, середина, сёрдж, хилки, комната — кодом игры),
// окна подменены стратегией: «по умолчанию», «лучший по ситуации», «худший». Печатает место, побед %, топ-10 %, элимы,
// долю лучшего хода по окну и срез ситуаций на 4-й и 8-й зонах.
//   node tools/career-sit-probe.js [игр]          INDEX=<файл> — другая версия (там только «по умолчанию»)
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const GAMES = +(process.argv[2] || 600);
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
window.addEventListener('load', function(){ setTimeout(async function(){
  const N=${GAMES};
  const out={rows:[], errs:[], share:{rot:{}, late:{}, stance:{}}, s4:[], s8:[]};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Probe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:92, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:1000, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    squadSize=2; CARD_MODE=true; useLandingSet(careerBrSet());
    skipAnimation=true;
    const me=careerCard();
    const NEW=typeof ccSitValue==='function';
    let you=null, strat='default';
    const rank=(kind, ids, sit)=>ids.filter(id=>ccSitAvail(kind, id, sit) && id!=='third').sort((x,y)=>ccSitValue(kind, y, sit)-ccSitValue(kind, x, sit));
    ccChoiceBox=async function(title, hint, opts, map, side, kind){
      const k=String(kind||'').replace(/:.*$/, ''), def=opts.find(o=>o && o.def)||opts[0];
      if(!NEW || (k!=='rot' && k!=='late')) return def;
      const sit=ccSitOf(you);
      if(strat==='default'){ (k==='rot' ? out.s4 : out.s8).push(sit); return def; }
      const ids=opts.map(o=>o.id);
      const r=rank(k==='rot' ? 'rot' : 'end', ids, sit), id=strat==='best' ? r[0] : r[r.length-1];
      if(k==='late'){
        const st=rank('stance', CC_SIT_STANCE_IDS, sit), s=strat==='best' ? st[0] : st[st.length-1];
        if(strat==='best'){ out.share.late[id]=(out.share.late[id]||0)+1; out.share.stance[s]=(out.share.stance[s]||0)+1; }
        return {id:id+'|'+s};
      }
      if(strat==='best') out.share.rot[id]=(out.share.rot[id]||0)+1;
      return opts.find(o=>o.id===id)||def;
    };
    const run=async (st)=>{
      strat=st; let places=0, wins=0, top10=0, elims=0;
      for(let g=0; g<N; g++){
        you=careerYouTeam([me]); you.isYou=true; you.name='you';
        const field=[you, ...careerCupField(CAREER.career, [me], ccTeams(50), null, false, 0)];
        buildBotLandingAssignment(field.filter(t=>!t.isYou));
        you.landingZone=ALL_LANDING_ZONES[g % ALL_LANDING_ZONES.length];
        const order=await playGameWithChoices(field, null, null);
        const at=order.indexOf(you)+1;
        places+=at; if(at===1) wins++; if(at<=10) top10++; elims+=(you._gElims||you._elims||0);
      }
      return {what:st, place:+(places/N).toFixed(2), wins:+(wins/N*100).toFixed(1), top10:+(top10/N*100).toFixed(1), elims:+(elims/N).toFixed(2)};
    };
    const realMs=ccPingFightMs, U=CC_PING_FIGHT_UP, D=CC_PING_FIGHT_DOWN, H=CC_PING_HG;
    for(const ms of [null, 7, 25, 49, 72]){
      if(ms==null){ CC_PING_FIGHT_UP=0; CC_PING_FIGHT_DOWN=0; CC_PING_HG=0; } else { CC_PING_FIGHT_UP=U; CC_PING_FIGHT_DOWN=D; CC_PING_HG=H; }
      ccPingFightMs=function(t){ return (t && (t.isYou||t.isMate)) ? ms : null; };
      const r=await run('best'); r.what=ms==null ? 'off' : ms+'ms'; out.rows.push(r);
    }
    ccPingFightMs=realMs;
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccsit-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' +
  fs.readFileSync(process.env.INDEX || path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files',
    '--user-data-dir=' + path.join(dir, 'prof'), '--virtual-time-budget=3000000','--dump-dom','file:///' + tmp.replace(/\\/g,'/')],
    {maxBuffer:1<<30, encoding:'utf8', stdio:['ignore','pipe','ignore']});
} finally { try { fs.rmSync(dir, {recursive:true, force:true}); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs.length) console.error(out.errs.join('\n'));
console.log('стратегия      ср. место   побед %   топ-10 %   элимы');
out.rows.forEach(r => console.log(r.what.padEnd(12), String(r.place).padStart(10), String(r.wins).padStart(9), String(r.top10).padStart(10), String(r.elims).padStart(7)));
if (out.rows.length > 1) console.log('лучший ход:', JSON.stringify(out.share));
const q=(arr,k)=>{ const v=arr.map(o=>typeof o[k]==='boolean' ? (o[k]?1:0) : o[k]).filter(x=>x!=null).sort((a,b)=>a-b);
  if(!v.length) return k+':-'; const at=f=>v[Math.min(v.length-1, Math.floor(f*v.length))];
  return k+' '+[0.1,0.5,0.9].map(f=>+(+at(f)).toFixed(2)).join('/')+' ~'+(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2); };
['s4','s8'].forEach(z=>{ const a=(out[z]||[]).map(o=>Object.assign({d:o.dist/Math.max(1,o.rNext)}, o)); if(!a.length) return;
  console.log(z+' n='+a.length+': '+['d','inside','away','edge','mats','heals','move','ar','nearBy','place','alive'].map(k=>q(a,k)).join(' | ')); });
