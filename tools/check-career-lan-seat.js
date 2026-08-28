// A seat won is a seat you can sit in.
//
// His player, 21 August: "i placed top 8 in grands" and the Summit day was
// still locked, with the tile explaining the entry rule as though he had not
// met it; and "i placed 1st in major 2 and 1st in lcq round 3 and could not
// play" the Global Championship. Both seats are read off cr.log, so this
// plants the winning row by hand and asks the same questions the hub asks.
//
//   node tools/check-career-lan-seat.js
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
  const fresh=()=>{
    localStorage.clear();
    careerEntry();
    ccPickRole('roleFRG'); ccPickDiv(1); ccPickRegion('EU'); ccPickCountry('de');
    const n=document.getElementById('ccNick');
    n.value='Qualed'; n.dispatchEvent(new Event('input',{bubbles:true}));
    if(typeof ccSync==='function') ccSync();
    document.getElementById('ccStart').click();
    CAREER.career.balance=99999;
  };
  // Every day of the year the calendar knows about, by kind and id.
  const daysOf=(pred)=>{
    const outDays=[];
    careerYearDays().forEach((list, iso)=>{
      (list||[]).forEach(e=>{ if(pred(e)) outDays.push({iso, id:e.id, kind:e.kind}); });
    });
    return outDays.sort((a,b)=>a.iso<b.iso?-1:1);
  };
  const done=()=>{
    try{
      fresh();
      const majFinals=daysOf(e=>e.kind==='major' && /_Final$/.test(String(e.id||'')));
      const summitDays=daysOf(e=>e.kind==='summit');
      const gcDays=daysOf(e=>e.kind==='globals');
      out.notes.calendar={majorFinals:majFinals.map(d=>d.iso+' '+d.id),
                          summit:summitDays.map(d=>d.iso+' '+d.id),
                          globals:gcDays.map(d=>d.iso+' '+d.id)};

      // ---- the Summit, off a Major 1 Final -----------------------------
      const m1=majFinals.find(d=>/^Major1_/.test(d.id));
      const upper=summitDays.find(d=>/Upper$/.test(d.id));
      check('the calendar has a Major 1 Final', !!m1, JSON.stringify(majFinals));
      check('and a Summit Upper Bracket', !!upper, JSON.stringify(summitDays));
      // И сама комната Плей-Ина: настоящая, а не сжатая.
      const pi=ccScaleStage(CC_MAJOR_STAGE.playin);
      out.notes.playin={field:pi.field, cut:pi.cut, games:pi.games};
      /* Комната Плей-Ина — все, кто в дивизионе 1, и лестница за ними.

         Здесь стояло «комната равна пулу и ничего кроме»: записанных пар 174,
         и когда отсечка стала честной (сто пятьдесят во все три хита),
         проходило бы 86% комнаты — это уже не отбор. У Epic Плей-Ин открыт
         всему региону, и сто пятьдесят выходят из тысяч. Поэтому реальные
         имена сидят первыми, а комната достраивается лестницей до трёх хитовых
         полей на каждое место в хитах. Правка 25 августа, см. CC_MAJOR_STAGE. */
      const d1=careerPools().duos.length;
      const hf=ccScaleStage(CC_MAJOR_STAGE.heats).field;
      out.notes.pool={pairs:d1, entrants:careerD1Entrants()};
      check('the Play-In seats every Division 1 pair there is',
            pi.field>=careerD1Entrants(), pi.field+' vs pool '+d1);
      check('and builds the room out to three heat fields a seat',
            pi.field===hf*ccMajorHeats()*3, pi.field+' vs '+(hf*ccMajorHeats()*3));
      check('and nothing in it is generated',
            careerCupField(CAREER.career, [careerCard()], pi.field)
              .every(t=>(t.squad||[]).some(c=>c && c.tier!=='ladder')),
            'a squad of invented cards got in');
      /* А проходит ровно столько, сколько кресел за дверью — во ВСЕХ хитах.

         Проверяется тождество, а не пропорция: число, которое мод обещает на
         экране, и число мест, на которые он сажает, — одно число. Игрок
         прислал обе половины этой ошибки, каждую в свою ночь: сначала «once I
         was top 50 but didn't qual heats» (отсечка была больше комнаты), потом
         «плей ин мажора квал в хиты топ 50 вместо топ 150» (комната стала
         одной из трёх, а отсечка читала размер одной). */
      check('and exactly as many go through as the Heats have seats',
            pi.cut===hf*ccMajorHeats(),
            pi.cut+' through, '+(hf*ccMajorHeats())+' seats');
      check('which leaves the third of the room Epic lets through',
            Math.abs(pi.cut/pi.field-1/3)<0.02,
            String(Math.round(pi.cut/pi.field*1000)/10)+'%');
      // И она ужимается вместе с сезоном трио, как всё остальное.
      CAREER.career.size=3;
      const pi3=ccScaleStage(CC_MAJOR_STAGE.playin);
      out.notes.playinTrio={field:pi3.field, cut:pi3.cut};
      check('and a trio year shrinks it with everything else',
            pi3.field<pi.field && pi3.cut<pi.cut,
            JSON.stringify(out.notes.playinTrio));
      CAREER.career.size=2;
      if(m1 && upper){
        CAREER.career.log=[{season:CAREER.career.season, day:m1.iso, div:1, place:8,
                            of:50, kind:'major', stage:'final', passed:true}];
        CAREER.career.day=upper.iso;
        const ev=careerSummitOn(upper.iso);
        out.notes.summit={seat:ccSummitSeat(), ev:ev && ev.stage,
                          can:careerSummitCan(ev),
                          gaveUp:(CAREER.career.gaveUp||[]).slice(),
                          noMate:careerNoMate('summit'),
                          mates:careerMates().length};
        check('top 8 of the Major 1 Final is a direct Summit seat',
              ccSummitSeat()==='main', String(ccSummitSeat()));
        check('and the Upper Bracket may be played',
              careerSummitCan(ev)===true, JSON.stringify(out.notes.summit));
      }

      // ---- the Global Championship, off a Major 2 Final ----------------
      fresh();
      const m2=majFinals.find(d=>/^Major2_/.test(d.id));
      const gc=gcDays[0];
      check('the calendar has a Major 2 Final', !!m2, JSON.stringify(majFinals));
      check('and a Global Championship', !!gc, JSON.stringify(gcDays));
      if(m2 && gc){
        CAREER.career.log=[{season:CAREER.career.season, day:m2.iso, div:1, place:1,
                            of:50, kind:'major', stage:'final', passed:true}];
        CAREER.career.day=gc.iso;
        out.notes.globals={seat:ccGlobalsSeat(),
                           majorOn:(()=>{ const e=careerMajorOn(m2.iso); return e && (e.n+'/'+e.stage); })(),
                           can:careerGlobalsCan({n:1}),
                           gaveUp:(CAREER.career.gaveUp||[]).slice()};
        check('winning the Major 2 Final is a seat in Antwerp',
              !!ccGlobalsSeat(), JSON.stringify(out.notes.globals));
        check('and it can be played',
              careerGlobalsCan({n:1})===true, JSON.stringify(out.notes.globals));
      }

      // ---- and off the Last Chance Final -------------------------------
      fresh();
      const gclcFinal=daysOf(e=>e.kind==='gc' || e.kind==='gclc')
        .filter(d=>{ const g=careerGclcOn(d.iso); return g && g.final; })[0];
      out.notes.gclcFinalDay=gclcFinal && gclcFinal.iso;
      if(gclcFinal && gcDays[0]){
        CAREER.career.log=[{season:CAREER.career.season, day:gclcFinal.iso, div:1, place:1,
                            of:50, kind:'gclc', stage:'final', passed:true}];
        CAREER.career.day=gcDays[0].iso;
        out.notes.viaGclc={seat:ccGlobalsSeat(), can:careerGlobalsCan({n:1})};
        check('winning the Last Chance Final is a seat too',
              !!ccGlobalsSeat(), JSON.stringify(out.notes.viaGclc));
      }
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lanseat-'));
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
console.log('a seat won is a seat you can sit in');
fs.rmSync(dir, { recursive: true, force: true });
