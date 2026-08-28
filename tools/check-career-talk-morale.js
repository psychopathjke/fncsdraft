// Настрой напарника держится не только скримами.
//
// Его правка: «сделаю реалистичней диалог между дуо или трио и чтоб мораль
// можно было поддерживать, чтоб диалоги влияли на это не только совместные
// скримсы». До этого скрим был единственным, что поднимает настрой соседа —
// тридцать восемь энергии за вечер, — и карьера с кислым напарником могла
// только играть дальше и надеяться. Его тестер нашёл дыру изнутри: застрял на
// рунге, мораль падает, сделать нечего.
//
// Проверяется то, из-за чего разговор не кран:
//   * дешевле скрима и не даёт статов — это разговор, а не занятие;
//   * плоские +7 любому настрою — его пункт 15 со страницы «ы», 22 августа:
//     «поговорить не дает настрой»; ступени по терпению убраны, за 20 энергии
//     разговор обязан быть слышен и довольному соседу;
//   * подряд не работает: второй разговор за три дня стоит вдвое меньше —
//     это и есть весь анти-кран;
//   * говорит, о чём он был;
//   * в трио у каждого кресла свой talked — повтор режется по человеку.
//
//   node tools/check-career-talk-morale.js
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
      // ---- что это за день ------------------------------------------------
      const talk=ccActById('talk'), scrim=ccActById('scrim');
      out.notes.act={energy:talk.energy, gain:Object.keys(talk.gain||{}).length,
                     scrimEnergy:scrim.energy};
      check('a talk is a day in the store', !!talk);
      check('cheaper than a scrim', talk.energy<scrim.energy,
            talk.energy+' vs '+scrim.energy);
      check('and it teaches nothing — it is a conversation',
            Object.keys(talk.gain||{}).length===0,
            JSON.stringify(talk.gain));

      // ---- сколько он стоит -----------------------------------------------
      /* Плоские +7 — его число (пункт 15, 22 августа). Кран держит не ступень
         по настроению, а срез повтора ниже. */
      // День передаётся явно: карьеры на этом шаге ещё нет.
      const DAY='2026-03-10';
      const at=p=>careerTalkMove({patience:p}, DAY);
      out.notes.worth={unhappy:at(20), steady:at(55), happy:at(85)};
      check('a talk is worth the same seven to any mood',
            at(20)===7 && at(55)===7 && at(85)===7,
            JSON.stringify(out.notes.worth));

      // Подряд — не работает.
      const soon=careerTalkMove({patience:20, talked:'2026-03-09'}, DAY);
      const later=careerTalkMove({patience:20, talked:'2026-02-01'}, DAY);
      out.notes.repeat={fresh:at(20), yesterday:soon, longAgo:later};
      check('talking two days running is worth less', soon<at(20),
            JSON.stringify(out.notes.repeat));
      check('and after a while it is worth full again', later===at(20),
            JSON.stringify(out.notes.repeat));

      // ---- и на живой карьере ---------------------------------------------
      localStorage.clear();
      careerEntry();
      ccPickRole('roleIGL'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
      const n=document.getElementById('ccNick');
      n.value='Talker'; n.dispatchEvent(new Event('input',{bubbles:true}));
      if(typeof ccSync==='function') ccSync();
      document.getElementById('ccStart').click();
      if(!careerPartnerCard()){
        careerSeatTopUp();
        const s=careerDms().find(x=>x.state==='offer' && !x.who.org && !x.who.brand);
        if(s) careerDmAccept(s.id);
      }
      const rec=careerMateRecords()[0];
      check('somebody is in the seat to talk to', !!rec);
      if(!rec) throw new Error('no partner');

      rec.patience=30; delete rec.talked;
      const before=rec.patience, newsBefore=(CAREER.career.news||[]).length;
      const r1=careerDoAct('talk');
      out.notes.run={did:!!r1, was:before, now:rec.patience, talkedOn:rec.talked,
                     news:(CAREER.career.news||[]).length-newsBefore};
      check('the day is spent and the morale moves', !!r1 && rec.patience>before,
            JSON.stringify(out.notes.run));
      check('and the scene says what it was about',
            (CAREER.career.news||[]).length>newsBefore,
            JSON.stringify(out.notes.run));
      check('the day it happened is written down', rec.talked===careerToday(),
            String(rec.talked));

      /* Тот же день ещё раз. Второй разговор мод позволяет — энергии на него
         хватает, — но стоит он четверти: измерено 30 → 35 → 36. Именно это и
         делает разговор не краном; будь он плоским, день можно было бы разбить
         на три беседы и поднять настрой на пятнадцать. */
      const after1=rec.patience;
      careerDoAct('talk');
      out.notes.twice={after1:after1, after2:rec.patience};
      check('a second talk the same day is not worth another full one',
            rec.patience-after1 < after1-before || rec.patience===after1,
            JSON.stringify(out.notes.twice));

      // ---- трио: разговаривают с обоими -----------------------------------
      /* Свой человек у каждого кресла — это свой talked: с кем говорили
         вчера, тому четверть, а второму — полные семь. Настрой ступеней
         больше не даёт (пункт 15), различает кресла только повтор. */
      const seatFresh=careerTalkMove({patience:40}, DAY);
      const seatWorn=careerTalkMove({patience:40, talked:'2026-03-09'}, DAY);
      out.notes.trio={freshSeat:seatFresh, wornSeat:seatWorn};
      check('the seat talked to yesterday is worth less than the other',
            seatWorn<seatFresh, JSON.stringify(out.notes.trio));
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'talk-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=120000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes, null, 1));
if (out.err) { console.error(out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('morale is kept by talking, not only by scrims');
fs.rmSync(dir, { recursive: true, force: true });
