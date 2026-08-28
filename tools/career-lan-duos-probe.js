// Кого карьера видит на ЛАНе. Его вопрос, 28 августа: «че с триосами, я
// почему-то на лане не видел ская скрола, свизи пикси и еще много ников,
// почему сильных трио я не вижу» — со снимком, где в таблице стоят
// «Peterbot & Pollo & Enough» и «Sky & Firen & Pixx».
//
// Проба берёт пары, которыми живёт сцена карьеры (careerPools().duos —
// те же, что играют кубки, Мейджоры и опены), и смотрит, сколько верхних из
// них доезжает до комнат Саммита и Глобалов ЦЕЛОЙ ПАРОЙ.
//
//   node tools/career-lan-duos-probe.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const SIZE = process.env.CC_SIZE || '3';
const HEAD = `<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(String(e.message) + ' @' + e.lineno); });
<\/script>`;

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out = {errs:null, fail:null};
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'ProbeLan', age:19, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:6, region:'EU', ovr:96, role:'roleIGL', attrs:null, ageEdge:4,
        photo:null, handle:null, cardRegion:null, nat:null},
      career:{season:${SIZE === '3' ? 2 : 1}, size:${SIZE}, day:'2026-05-20', division:1,
              earnings:0, balance:0, reach:0, tokens:[], log:[], news:[]},
      partner:null}));
    careerEntry();
    CARD_MODE=true; squadSize=${SIZE};
    const cr=CAREER.career;
    out.squad=careerSquadSize();

    const me=careerCard() || {handle:'ProbeLan', region:'EU', rating:96, tier:'cardmode'};
    const drafted=[me];
    const you=careerYouTeam(drafted); you.isYou=true;

    // Пары сцены, сверху по силе — те самые «сильные трио», которых он ищет.
    const pool=careerPools().duos.slice()
      .sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a));
    const pairKey=cards=>cards.map(c=>hKey(c)).sort().join('+');
    const top=pool.slice(0, 20).map(d=>({key:pairKey(d.cards),
      name:d.cards.map(c=>c.handle).join(' & '), ovr:ccDuoOvr(d)}));
    out.scenePairsTop=top.map(t=>t.name+' ('+t.ovr+')');

    // Пары внутри комнаты: любые двое из состава, чтобы трио не мешало.
    const pairsIn=field=>{
      const s=new Set();
      (field||[]).forEach(t=>{
        const c=(t.squad||[]).filter(x=>x && x.handle);
        for(let i=0;i<c.length;i++) for(let j=i+1;j<c.length;j++)
          s.add([hKey(c[i]), hKey(c[j])].sort().join('+'));
      });
      return s;
    };
    const hits=(field)=>{ const s=pairsIn(field);
      return top.filter(t=>s.has(t.key)).map(t=>t.name); };

    /* Где в очереди стоит первая пара сцены. Ядрами садятся первые N пар
       очереди, остальные разбираются на третьих — значит вопрос «почему
       Scroll & Sky не приехали парой» это вопрос об их месте в очереди. */
    (function(){
      const seats=18;
      const rnd=careerRng(careerSeed(cr, 'queueprobe'));
      const q=careerRealDuos(new Set(), rnd, 1, seats, CC_FIELD_SHARP.lan);
      const first=top[0];
      const at=q.findIndex(d=>pairKey(d.cards)===first.key);
      out.queue={pair:first.name, at:at, of:q.length, seats:seats,
                 head:q.slice(0,6).map(d=>d.cards.map(c=>c.handle).join(' & ')+' ('+ccDuoOvr(d)+')')};
    })();
    /* Как выглядят готовые тройки: состав с рейтингом каждого и разрыв между
       парой и третьим — на его вопрос «какие теперь трио строятся». */
    const show=(field,n)=>(field||[]).slice()
      .sort((a,b)=>(b.pow||0)-(a.pow||0)).slice(0,n)
      .map(t=>{
        const c=(t.squad||[]).filter(x=>x && x.handle);
        const r=c.map(x=>Math.round(attrsFor(x).ovr));
        const real=c.filter(x=>x.tier!=='ladder').length;
        return c.map((x,i)=>x.handle+' '+r[i]).join(' · ') +
               (real<c.length ? '  [выдуман '+(c.length-real)+']' : '');
      });
    const cupField=careerCupField(cr, drafted, careerCupSize(1), null, false, 0);
    out.cup={of:cupField.length, topPairsSeated:hits(cupField).length,
             seen:hits(cupField).slice(0,5)};

    const sumField=careerSummitField('upper', you, drafted);
    out.summit={of:sumField.length, topPairsSeated:hits(sumField).length,
                seen:hits(sumField).slice(0,5),
                sample:sumField.slice(0,6).map(t=>(t.squad||[]).map(c=>c.handle).join(' & '))};

    // Где именно сидят двое из первой пары сцены — вместе или порознь.
    const whereIs=(field,h)=>{
      const t=(field||[]).find(x=>(x.squad||[]).some(c=>c && hKey(c)===h));
      return t ? (t.squad||[]).map(c=>c.handle).join(' & ') : null;
    };
    // Тот ли это человек: у сцены 137 ников заняты дважды, и «Scroll» в чужой
    // команде вполне может быть другим Scroll'ом.
    const cardsNamed=(field,h)=>{
      const list=[];
      (field||[]).forEach(t=>(t.squad||[]).forEach(c=>{
        if(c && hKey(c)===h) list.push({r:Math.round(attrsFor(c).ovr), reg:c.region||null,
                                        tier:c.tier||null, ev:c.event||null});
      }));
      return list;
    };
    out.cupTrios=show(cupField,12);
    out.cup.scrollCards=cardsNamed(cupField,"scroll");
    out.cup.skyCards=cardsNamed(cupField,'sky');
    out.cup.topPairPresent=pairsIn(cupField).has(top[0].key);
    // Что запомнила карьера и где пара стояла в очереди этого самого вызова.
    out.cup.memo={malibuca:(cr.trios||{})['malibuca+vic0'],
                  shxrk:(cr.trios||{})['shxrk+t3eny'],
                  keys:Object.keys(cr.trios||{}).length};
    (function(){
      const rnd2=careerRng(careerSeed(cr, null));
      const q2=careerRealDuos(new Set(), rnd2, 1, careerCupSize(1), 0);
      out.cup.pairAt=q2.findIndex(d=>pairKey(d.cards)===top[0].key);
      out.cup.queueLen=q2.length;
      out.cup.cores=careerCupSize(1);
    })();
    out.summitTrios=show(sumField,12);
    out.summit.scroll=whereIs(sumField,"scroll");
    out.summit.sky=whereIs(sumField,'sky');
    out.cup.scroll=whereIs(cupField,'scroll');
    out.cup.sky=whereIs(cupField,'sky');
    /* И как это едет дальше: три верхние пары проводят плохой сезон
       (CAREER.lft — четыре провальных вечера подряд), год кончается, рынок
       сводит освободившихся заново. Его правило, 28 августа: «пусть могут дуо
       распасться и собраться в хороший триос». */
    const gcField=careerGlobalsField(you, drafted, 'summit');
    (function(){
      CAREER.lft={};
      top.slice(0,3).forEach(t=>{ CAREER.lft[t.key]='2026-06-01'; });
      // Два стыка: годы чередуются, и трио-год — следующий чётный. Трансферы
      // верхних пар (careerTrioRaids) идут только в него.
      careerNewSeason();
      careerNewSeason();
      squadSize=careerSquadSize();
      const next=careerCupField(cr, drafted, careerCupSize(1), null, false, 0);
      out.nextSeasonTrios=show(next,12);
      out.nextSeasonPairs=careerPools().duos.slice()
        .sort((a,b)=>ccDuoOvr(b)-ccDuoOvr(a)).slice(0,8)
        .map(d=>d.cards.map(c=>c.handle).join(' & ')+' ('+ccDuoOvr(d)+')');
    })();
    out.globals={of:gcField.length, topPairsSeated:hits(gcField).length,
                 seen:hits(gcField).slice(0,5),
                 sample:gcField.slice(0,6).map(t=>(t.squad||[]).map(c=>c.handle).join(' & '))};
  } catch(e){ out.fail=String(e && e.stack || e); }
  out.errs=window.__errs;
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cclan-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(String.fromCharCode(92)).join('/') + '/">' + HEAD +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=300000','--dump-dom',
  'file:///' + tmp.split(String.fromCharCode(92)).join('/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});

const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('the probe produced no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out, null, 2));
if (out.fail) process.exit(1);
