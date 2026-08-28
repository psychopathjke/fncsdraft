// A career rates people by their year, on the draft's own formula.
//
// A person has one card per set they played — Sky has eleven — and each is scored
// off its own event's placement curve. The pool kept whichever read highest, then
// the mean of the best three, and now the thing the draft card has printed all
// along: a weighted average over every stage of the year, stretched so the region
// tops out where the draft tops out.
//
// The weights are the ledger's own, and they carry his rule of 21 August —
// "division cups should give less than Major finals and LAN finals" — as numbers:
// LAN 3.0, Grand Final 2.0, heat 0.9, division week 0.6, Play-In 0.5, Last Chance
// 0.4. The rounds that only decide who gets through are worth less than the round
// that decides the title.
//
// What must not happen: the career's own view of a card leaking into the app.
// attrsFor shifts the six numbers towards _targetOvr inside the object it is
// handed, and a shallow copy shares that object with the real card.
//
//   node tools/check-career-season-rating.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set CHROME to chrome.exe');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d!==undefined?': '+d:'')); };
  const done=()=>{
    try{
      // ---- the rule itself ----------------------------------------------
      const season=ccSeasonOvr();
      /* Одна строка на событие: финалист Мейджора лежит в файле дважды —
         карточкой гранд-финала и переписанной квалификационной, — и обе
         описывают один вечер. Схлопывается тем же ключом, что и в ccSeasonOvr. */
      /* Ключ сезона — «регион|ник», а не ник: в наборах 137 ников заняты
         дважды, и без региона год европейца складывался с годом его
         азиатского тёзки. См. ccSeasonKey. */
      const handleOf=k=>String(k).slice(String(k).indexOf('|')+1);
      const cardsOf=k=>{
        const seen=new Map();
        PLAYERS_BASE.forEach(c=>{
          if(ccCardYear(c)!==CC_NOW_YEAR || ccSeasonKey(c)!==k) return;
          const o=(attrsFor(c)||{}).ovr;
          if(!(o>0)) return;
          const ev=String((c.gfEvent||c.event)||'');
          if(!(seen.get(ev)>=o)) seen.set(ev, o);
        });
        return [...seen.values()];
      };
      /* Тот же счёт, что и в моде: взвешенная сумма по всем событиям года,
         делённая на сумму весов, и растяжка региона под его потолок. Ровно то,
         что карточка драфта печатает двумя последними строками. */
      /* Тот же счёт, что и в моде, и из того же источника: этапы года берутся
         из ledger драфта (CC_LEDGER_2026), Reload — с карточек, потому что в
         ledger его нет. Считать по карточкам, как раньше, больше нельзя: ledger
         знает девять недель кубка и хиты обоих Мейджоров, а карточек по ним
         построено вчетверо меньше. */
      const here=new Set();
      PLAYERS_BASE.forEach(c=>{ if(c.tier==='cardmode')
        here.add((c.region||'')+'|'+String(c.handle||'').toLowerCase()); });
      const weighedOf=k=>{
        const reg=String(k).slice(0, String(k).indexOf('|'));
        const h=String(k).slice(String(k).indexOf('|')+1);
        const seen=new Map();
        (CC_LEDGER_2026[reg]||[]).forEach(src=>{
          const r=src.map[h];
          if(!(r>0) || !here.has(k)) return;
          const ev=src.set+'|'+src.label+(src.nth!=null ? '|'+src.nth : '');
          const sc=src.score(r);
          const cur=seen.get(ev);
          if(!cur || cur.score<sc) seen.set(ev, {score:sc, weight:src.weight});
        });
        PLAYERS_BASE.forEach(c=>{
          if(ccCardYear(c)!==CC_NOW_YEAR || ccSeasonKey(c)!==k) return;
          if(!/^r[1-4]$/.test(String(c.cardSet||''))) return;
          const o=(c._eventOvr!=null ? c._eventOvr : (attrsFor(c)||{}).ovr);
          if(!(o>0)) return;
          const ev=String((c.gfEvent||c.event)||'');
          const cur=seen.get(ev);
          const q=ccStageWeight(ev);
          if(!cur || cur.score<o) seen.set(ev, {score:o, weight:q});
        });
        let sum=0, w=0;
        seen.forEach(row=>{ sum+=row.score*row.weight; w+=row.weight; });
        return w>0 ? sum/w : null;
      };
      check('the year has been read at all', season.size>500, String(season.size));

      // ---- веса: чем позже раунд, тем он дороже -------------------------
      /* Его правило, 21 августа: «див капы меньше должны давать, чем финалы
         мажора и финалы ланов». В моде оно записано весами, и это те же числа,
         по которым карточку считает драфт. */
      const W={
        lan:  ccStageWeight('FNCS 2026 Major 1 Summit — Grand Finals'),
        gf:   ccStageWeight('FNCS 2026 Major 1 — Grand Finals (Europe)'),
        heat: ccStageWeight('FNCS 2026 Major 1 Summit — Group Stage'),
        cup:  ccStageWeight('FNCS 2026 Division 1 — Week 1 Finals (Europe)'),
        pi:   ccStageWeight('FNCS 2026 Major 1 — Play-In Stage (Europe)'),
        lcq:  ccStageWeight('FNCS 2026 Major 1 — Last Chance Qualifier (Europe)')
      };
      out.notes.weights=W;
      check('a LAN final outweighs a Major final', W.lan>W.gf, JSON.stringify(W));
      check('a Major final outweighs a division week', W.gf>W.cup, JSON.stringify(W));
      check('a division week outweighs a Play-In', W.cup>W.pi, JSON.stringify(W));
      /* Кубок и хит стоят вровень — его правка 21 августа опустила хит с 0.9
         до 0.6. Проверяется то, что осталось правилом: оба стоят под грандом и
         над Плей-Ином, то есть одна ночь в комнате на пятьдесят команд весит
         одинаково, чем бы она ни называлась. */
      check('a heat and a division week weigh the same', W.cup===W.heat, JSON.stringify(W));
      check('and both stand under a Major final', W.heat<W.gf, JSON.stringify(W));
      check('the Last Chance is the cheapest round of the Major',
            W.lcq<W.pi, JSON.stringify(W));

      // Somebody with a season behind them.
      const isEu=k=>String(k).slice(0, String(k).indexOf('|'))==='EU';
      let many=null, mostCards=0;
      season.forEach((v,k)=>{ if(!isEu(k)) return;
        const n=cardsOf(k).length;
        if(n>mostCards){ mostCards=n; many=k; } });
      const rows=cardsOf(many);
      out.notes.busiest={who:many, events:rows.length, weighed:Math.round(weighedOf(many)*10)/10,
                         rating:season.get(many), max:Math.max.apply(null,rows)};
      /* Рейтинг — это взвешенное среднее, растянутое под потолок региона.
         Растяжка общая на весь регион, поэтому проверяется не число, а
         отношение: у всех оно одно. */
      const hiRaw=(()=>{ let m=0; season.forEach((v,k)=>{ if(!isEu(k)) return;
        const r=weighedOf(k); if(r!=null && r>m) m=r; }); return m; })();
      const scale=REGION_TOP.EU/hiRaw;
      out.notes.stretch={topRaw:Math.round(hiRaw*10)/10, ceiling:REGION_TOP.EU,
                         scale:Math.round(scale*1000)/1000};
      check('a busy year is its weighted average, stretched to the region',
            Math.abs(season.get(many)-Math.round(weighedOf(many)*scale))<=1,
            JSON.stringify(out.notes.busiest));
      check('and the region tops out where the draft tops out',
            Math.abs(Math.round(hiRaw*scale)-REGION_TOP.EU)<=1,
            JSON.stringify(out.notes.stretch));

      /* И лишний слабый турнир почти ничего не стоит — то, ради чего раньше
         стояло окно из трёх. Веса решают это иначе: событие с малым весом
         почти не двигает среднее, и играть больше по-прежнему не вредно. */
      const opens='Reload Elite Series 1 — Opens (Europe)';
      const withOne=(()=>{
        const base=weighedOf(many), q=ccStageWeight(opens);
        const w=(()=>{ let t=0; const seen=new Set();
          PLAYERS_BASE.forEach(c=>{ if(ccCardYear(c)!==CC_NOW_YEAR || ccSeasonKey(c)!==many) return;
            const ev=String((c.gfEvent||c.event)||''); if(seen.has(ev)) return;
            seen.add(ev); t+=ccStageWeight(ev); });
          return t; })();
        return (base*w + 46*q)/(w+q);
      })();
      out.notes.extraGame={was:Math.round(weighedOf(many)*10)/10,
                           withAnOpen:Math.round(withOne*10)/10};
      check('a bad open barely moves a strong year',
            weighedOf(many)-withOne < 2, JSON.stringify(out.notes.extraGame));

      // Nobody reaches the ceiling on one result.
      let top=0; season.forEach(v=>{ if(v>top) top=v; });
      out.notes.topRating=top;
      check('and nobody is above the region ceiling', top<=REGION_TOP.EU,
            String(top));

      // ---- the career reads it -------------------------------------------
      localStorage.clear();
      careerEntry();
      ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Reader'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();

      const pool=ccEuCards();
      const mine=pool.find(c=>c._k===hKey({handle:handleOf(many)}));
      out.notes.inPool={ovr:mine && mine._ovr, target:mine && mine._targetOvr};
      check('the pool card carries the season rating',
            mine && mine._ovr===season.get(many), JSON.stringify(out.notes.inPool));
      check('and its attributes are moved onto it',
            mine && Math.abs(attrsFor(mine).ovr-season.get(many))<=1,
            String(mine && attrsFor(mine).ovr));

      /* And the shape survives the move: the six are shifted together, so a
         player measured as an aim player is still one. */
      /* Против той карточки, с которой копия и снята, — а не против лучшей
         карточки этого человека: у разных событий свои измеренные статы, и
         форма у них разная по делу, а не из-за сдвига. */
      const src_=PLAYERS.filter(x=>ccSeasonKey(x)===many)[0];
      const before=attrsFor(src_), after=attrsFor(mine);
      const order=a=>ATTR_KEYS.slice().sort((x,y)=>a[y]-a[x]).join(',');
      out.notes.shape={before:order(before), after:order(after)};
      check('the card keeps its shape', order(before)===order(after),
            JSON.stringify(out.notes.shape));

      // ---- and the app outside the career is untouched --------------------
      const live=PLAYERS.filter(p=>ccSeasonKey(p)===many)[0];
      out.notes.appCard={ovr:attrsFor(live).ovr, season:season.get(many)};
      check('the real card is not rewritten by the career',
            attrsFor(live).ovr!==season.get(many),
            JSON.stringify(out.notes.appCard));
      check('and it still reads its own event',
            attrsFor(live).ovr===(attrsFor(live)||{}).ovr && attrsFor(live).ovr>0,
            String(attrsFor(live).ovr));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seasonovr-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('a career rates people by their year');
fs.rmSync(dir, { recursive: true, force: true });
