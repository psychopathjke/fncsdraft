// Соло: своя точка занята ДО раздачи ботов — и у напарника тоже.
//
// Его слово, 30 августа: «Swizzy 97 не может квальнуться в хиты». Замер
// (career-solo-qual-probe): боты садились первыми, игрок последним на метку —
// 96 гиб на дропе 4 из 10 и проходил 37%; с точкой, занятой до раздачи, — 0
// дроп-смертей и 87%. Проверяется:
//   1) одиночное соло: в момент раздачи ботов игрок уже стоит на своей метке,
//      после ответа «домой» он там и есть, и в комнате один раз;
//   2) команда: напарник с домом из карточки (soloHome) тоже сидит до раздачи,
//      и после моего ответа остаётся в комнате ровно один раз;
//   3) карточка несёт soloHome с центром коробки;
//   4) дуо-вечер (не соло) как был: игрок в раздачу не входит.
//
//   node tools/check-career-solo-home.js
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
      v:1, player:{nick:'Homer', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-01-11', division:3, earnings:0, balance:1000, reach:0,
              tokens:[], log:[], news:[], seed:'home-seed'},
      partner:null}));
    careerEntry();
    const cr=CAREER.career;
    CARD_MODE=true; squadSize=1; useLandingSet(careerBrSet()); CC_KILL_CAP=0;
    const me=careerCard();
    const mk=(card, tag, flags)=>{ const t=careerTeam([card], true); t.name=card.handle; t.mpTag=tag; Object.assign(t, flags); return t; };
    const you=mk(me, ':'+hKey(me), {isYou:true});
    const sameZ=(a,b)=>!!(a&&b&&Math.abs(a.x-b.x)<1e-6&&Math.abs(a.y-b.y)<1e-6&&Math.abs(a.w-b.w)<1e-6);
    const zoneOf=(map, z)=>{ for(const [k,l] of map.entries()) if(sameZ(k,z)) return l; return []; };
    // Метка — середина сетки.
    const at=ALL_LANDING_ZONES.length-2;   // за 36-й: индекс крупной сетки тут ничего бы не значил
    ccSoloHomeSet(at);
    const home=ccSoloHomeZone(you);
    check('своя точка стоит', !!home, String(at));
    check('и это та коробка, что выбрали', sameZ(home, ALL_LANDING_ZONES[at]), JSON.stringify(home));
    check('запись с центром', !!(careerSpotOn('solo') && careerSpotOn('solo').cx!=null));
    // Ответ всегда «домой»; раздача ботов записывает, кто уже сидел.
    ccChoiceBox=async function(){ return {id:'home'}; };
    const seen=[];
    const bb=buildBotLandingAssignment;
    buildBotLandingAssignment=function(bots, opts){
      const into=opts && opts.into;
      seen.push({n:bots.length, youIn:!!(into && [...into.values()].some(l=>l.indexOf(you)>=0)),
                 youHome:!!(into && zoneOf(into, home).indexOf(you)>=0),
                 mateIn:!!(into && [...into.values()].some(l=>l.isMate || l.some(t=>t.isMate)))});
      return bb(bots, opts);
    };
    const bots=careerSoloField(cr, [me], 100, true);
    // 1. Одиночное соло.
    let field=[you, ...bots];
    let groups=await careerLandingPick(field, you, 'solo', ['solo']);
    check('раздача ботов шла при сидящем игроке', seen.length===1 && seen[0].youIn && seen[0].youHome, JSON.stringify(seen));
    check('ботов раздали без игрока', seen[0].n===bots.length, String(seen[0].n));
    const count=t=>[...groups.values()].reduce((s,l)=>s+l.filter(x=>x===t).length, 0);
    check('после «домой» игрок дома и один раз', sameZ(you.landingZone, home) && count(you)===1, String(count(you)));
    const rivals=zoneOf(groups, home).filter(t=>t!==you).length;
    out.notes.rivalsSolo=rivals;
    check('контестят немногие', rivals<=1, String(rivals));
    // 2. Команда: напарник с домом из карточки.
    seen.length=0;
    cr.mp={code:'ABC123', role:'a'};
    const peerCard=bots[0].squad[0];
    const mz=ALL_LANDING_ZONES[Math.max(0, at-3)];
    MP.peer=Object.assign({}, peerCard, {soloHome:{i:0, cx:mz.x+mz.w/2, cy:mz.y+mz.h/2}});
    const mate=mk(peerCard, ':'+hKey(peerCard), {isMate:true});
    check('дом напарника читается из карточки', sameZ(ccSoloHomeZoneOf(mate), mz));
    field=[you, mate, ...bots.slice(1)];
    // Лобби нет — голос считается свой, без барьера.
    ccMpChoose=function(kind, mineFn){ return Promise.resolve(mineFn()).then(v=>({v:v, mine:true})); };
    groups=await careerLandingPick(field, you, 'solo', ['solo'], {tag:you.mpTag});
    check('в команде раздача шла при обоих сидящих', seen.length===1 && seen[0].youHome && seen[0].mateIn, JSON.stringify(seen));
    check('ботов раздали без людей', seen[0].n===bots.length-1, String(seen[0].n));
    check('напарник остался дома один раз', sameZ(mate.landingZone, mz) && count(mate)===1, String(count(mate)));
    check('и я дома один раз', sameZ(you.landingZone, home) && count(you)===1, String(count(you)));
    // Второй вопрос — напарнику, комната та же (pre): его снимают и сажают ответом.
    seen.length=0;
    ccChoiceBox=async function(){ return {id:'home'}; };
    ccMpChoose=function(kind, mineFn){ return Promise.resolve(mineFn()).then(v=>({v:{id:'home', at:ALL_LANDING_ZONES.findIndex(z=>sameZ(z, mz))}, mine:true})); };
    groups=await careerLandingPick(field, mate, 'solo', ['solo'], {tag:mate.mpTag, pre:groups});
    check('второй вопрос комнату не пересобирал', seen.length===0, String(seen.length));
    check('напарник после своего ответа дома один раз', sameZ(mate.landingZone, mz) && count(mate)===1, String(count(mate)));
    check('я по-прежнему дома один раз', count(you)===1, String(count(you)));
    // 3. Карточка.
    const card=MP.card();
    check('карточка несёт soloHome с центром', card && card.soloHome && typeof card.soloHome.cx==='number' && Math.abs(card.soloHome.cx-(home.x+home.w/2))<1e-6, JSON.stringify(card && card.soloHome));
    // 4. Дуо-вечер: игрок в раздачу не входит.
    seen.length=0; delete cr.mp; MP.peer=null;
    squadSize=2; useLandingSet(careerBrSet());
    const duoYou=careerYouTeam([me]); duoYou.isYou=true; delete duoYou.mpTag;
    const duoField=[duoYou, ...careerCupField(cr, [me], 50, null, true, 0)];
    ccMpChoose=function(kind, mineFn){ return Promise.resolve(mineFn()).then(v=>({v:v, mine:true})); };
    await careerLandingPick(duoField, duoYou, 'duo', ['cup']);
    check('дуо: боты раздаются без игрока, игрок не сидит заранее', seen.length===1 && !seen[0].youIn, JSON.stringify(seen));
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<` + `/script>`;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ccsolohome-')); const tmp=path.join(dir,'index.html');
fs.writeFileSync(tmp, '<base href="file:///'+ROOT.split(SL).join('/')+'/">'+fs.readFileSync(path.join(ROOT,'index.html'),'utf8')+BOOT);
const dom=execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--allow-file-access-from-files','--virtual-time-budget=120000','--dump-dom','file:///'+tmp.split(SL).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir,{recursive:true,force:true});
const m=dom.match(/PBEGIN([\s\S]*?)PEND/); if(!m){ console.error('проба не отработала'); process.exit(2); }
const out=JSON.parse(decodeURIComponent(m[1]));
if(out.err){ console.error('ERR: '+out.err); process.exit(1); }
out.fails.forEach(f=>console.log(' FAIL '+f)); if(out.fails.length) process.exit(1);
console.log('соло: своя точка занята до раздачи, у напарника тоже · '+JSON.stringify(out.notes));
