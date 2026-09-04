// Сколько решает сила внутри соло-лобби на сто.
//
// Его слово, 30 августа: «померь соло ещё» — после замера квала (78 → 25%,
// 96 → 43% в топ-100 из 4900 с одной сессии) сила почти не решала. Здесь
// меряется сама сотня, той же сеткой, что играет раннер: та же комната
// (careerSoloField, open), тот же simulateGame, очки victoryR1Points + 3 за
// килл. На каждую силу — G игр в случайных сотнях этой комнаты.
//
// Печатает: сила своей команды и её процентиль в комнате; среднее место,
// доля топ-10 / топ-25, победы, килы, средние очки за игру; и Спирмена между
// рангом силы в лобби и местом — по всем командам лобби (насколько сим
// вообще читает силу).
//
//   node tools/career-solo-lobby-probe.js [игр на силу]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const G = +(process.argv[2] || 200);
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
  const out={err:null, games:${G}, by:{}, field:{}};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'LobbyProbe', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:88, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    CARD_MODE=true; squadSize=1; useLandingSet(careerBrSet()); CC_KILL_CAP=0;
    const room=careerVictoryField(true);
    const pct=(arr, p)=>{ const a=arr.slice().sort((x,y)=>x-y); return a[Math.min(a.length-1, Math.floor(a.length*p))]; };
    const spearman=(xs, ys)=>{
      const rank=v=>{ const idx=v.map((x,i)=>[x,i]).sort((a,b)=>a[0]-b[0]); const r=new Array(v.length); idx.forEach((p,i)=>{ r[p[1]]=i+1; }); return r; };
      const rx=rank(xs), ry=rank(ys); const n=xs.length; let d2=0; for(let i=0;i<n;i++) d2+=(rx[i]-ry[i])**2;
      return 1-6*d2/(n*(n*n-1));
    };
    for(const ovr of [78, 88, 96]){
      CAREER.player.ovr=ovr;
      const me=careerCard();
      const you=careerYouTeam([me]); you.isYou=true;
      const bots=careerSoloField(cr, [me], room, true);
      if(!out.field.p50){
        const pows=bots.map(t=>t.pow||0);
        out.field={n:bots.length, p50:pct(pows,.5), p90:pct(pows,.9), p99:pct(pows,.99), max:Math.max(...pows), min:Math.min(...pows)};
      }
      const above=bots.filter(t=>(t.pow||0)>you.pow).length;
      const places=[], elims=[], pts=[], rhos=[]; let landDead=0; out.keys=out.keys||null;
      let wins=0;
      for(let g=0; g<${G}; g++){
        const sh=bots.slice();
        for(let k=sh.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); const t=sh[k]; sh[k]=sh[j]; sh[j]=t; }
        const lobby=[you, ...sh.slice(0, 99)];
        lobby.forEach(t=>{ t._elims=0; });
        const order=simulateGame(lobby);
        const place=order.indexOf(you)+1;
        places.push(place); elims.push(you._elims||0); if(you._landDead||you._droppedOut||you._diedLanding) landDead++; if(!out.keys) out.keys=Object.keys(you).filter(k=>/land|drop|dead|death|zone|cause/i.test(k));
        pts.push(victoryR1Points(place)+ccKillPts(you._elims||0, 3));
        if(place===1) wins++;
        // Сила против места по всему лобби: -1 значит «сильный садится выше».
        rhos.push(spearman(lobby.map(t=>t.pow||0), lobby.map(t=>order.indexOf(t)+1)));
      }
      const avg=a=>a.reduce((s,v)=>s+v,0)/a.length;
      out.by[ovr]={pow:Math.round(you.pow), strongerInRoom:above, pctInRoom:+((1-above/bots.length)*100).toFixed(1),
        avgPlace:+avg(places).toFixed(1), medPlace:pct(places,.5), top10:+(places.filter(p=>p<=10).length/places.length*100).toFixed(1),
        top25:+(places.filter(p=>p<=25).length/places.length*100).toFixed(1), winRate:+(wins/places.length*100).toFixed(1),
        avgElims:+avg(elims).toFixed(2), avgPts:+avg(pts).toFixed(1), rhoPowPlace:+avg(rhos).toFixed(3), landDead:+(landDead/places.length*100).toFixed(1), buckets:{'1-10':places.filter(p=>p<=10).length,'11-25':places.filter(p=>p>10&&p<=25).length,'26-50':places.filter(p=>p>25&&p<=50).length,'51-75':places.filter(p=>p>50&&p<=75).length,'76-100':places.filter(p=>p>75).length}};
    }
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsololobby-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=600000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
