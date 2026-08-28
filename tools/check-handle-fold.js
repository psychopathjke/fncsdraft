/* Один человек — одно написание, и ни одним больше.

   Кап 4 Reload снят с источника, который поднимает регистр и срезает хвосты:
   «ozbozǃ» становится «OZBOZ», «killsh0t.» — «KILLSH0T», «vic0» — «VICO».
   Человек от этого разваливался надвое, и половина с одной слабой карточкой
   тянула рейтинг напарника вниз: vic0 читался 94, а Malibuca — его же дуо с
   теми же результатами во всех восемнадцати событиях — 93.

   Сведение обязано делать ровно две вещи, и вторая важнее первой:

     свести написания одного человека;
     НЕ свести разных людей с похожими никами.

   Второе тут не теоретическое. В файле есть Cr1nge и Cringe: оба европейцы,
   оба играют весь год, но первый всегда с Twi, второй с Volko, и в плей-ине
   Мейджора 1 они стоят на 24-м и 120-м местах. Нормализация, которая смотрит
   только на буквы, их бы склеила. То же с K1nG и KING в Бразилии — один играет
   с fazer, другой с Teuzz и señor seeyun.

   node tools/check-handle-fold.js
*/
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) { console.error('Chrome не найден'); process.exit(2); }

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fold:[], err:null};
  const done=()=>{
    try{
      out.fold=(CC_HANDLE_FOLD||[]).map(f=>({from:f.from, to:f.to}));
      // Живёт ли тот, в кого свели, вне капа 4.
      const elsewhere=new Set(), all=new Set();
      PLAYERS_BASE.forEach(p=>{
        const set=String(p.cardSet||''); if(!set) return;
        const k=String(p.region||'')+'|'+String(p.handle||'').toLowerCase();
        all.add(k);
        if(set!=='r4') elsewhere.add(k);
      });
      out.fold.forEach(f=>{
        const reg=f.from.split('|')[0];
        f.targetLives=elsewhere.has(reg+'|'+f.to.toLowerCase());
        f.sourceGone=!all.has(f.from.toLowerCase().replace(reg.toLowerCase(),reg));
      });
      // Задвоений быть не должно: один человек — одна карточка на вечер.
      const seen=new Map(); out.dupes=[];
      PLAYERS_BASE.forEach(p=>{
        if(!String(p.cardSet||'')) return;
        const k=String(p.region||'')+'|'+String(p.handle||'').toLowerCase()+
                '|'+p.event+'|'+p.placement;
        if(seen.has(k)) out.dupes.push(k); else seen.set(k,1);
      });
      // Кто с кем стоит — по этому и отличаются разные люди с похожими никами.
      const mates=h=>{
        const set=new Set();
        PLAYERS_BASE.forEach(c=>{
          if(String(c.handle||'')!==h) return;
          if(!String(c.cardSet||'')) return;
          PLAYERS_BASE.forEach(x=>{
            if(String(x.event||'')!==String(c.event||'')) return;
            if(String(x.region||'')!==String(c.region||'')) return;
            if(x.placement!==c.placement) return;
            if(String(x.handle||'')===h) return;
            set.add(String(x.handle||''));
          });
        });
        return [...set];
      };
      const cards=h=>PLAYERS_BASE.filter(c=>String(c.handle||'')===h &&
                                            String(c.cardSet||'')).length;
      out.split={};
      ['Cr1nge','Cringe','K1nG','KING'].forEach(h=>{
        out.split[h]={n:cards(h), mates:mates(h)};
      });
      // И пара, из-за которой всё началось.
      const season=ccSeasonOvr();
      const evsOf=h=>{
        const s=new Set();
        PLAYERS_BASE.forEach(c=>{ if(String(c.handle||'')===h && String(c.cardSet||''))
          s.add(String(c.event||'')); });
        return [...s].sort();
      };
      out.duo={vic0:{ovr:season.get('EU|vic0'), evs:evsOf('vic0')},
               Malibuca:{ovr:season.get('EU|malibuca'), evs:evsOf('Malibuca')}};
      out.vico=cards('VICO');
    }catch(e){ out.err=String(e&&e.stack||e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(ROOT + '/index.html', 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fold-'));
const tmp = dir + '/index.html';
const fwd = s => s.split(String.fromCharCode(92)).join('/');
fs.writeFileSync(tmp, '<base href="file:///' + fwd(ROOT) + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=300000', '--dump-dom',
  'file:///' + fwd(tmp)], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const mm = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!mm) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(mm[1]));
if (out.err) { console.error(out.err); process.exit(1); }

let bad = 0;
const check = (ok, what) => { if (!ok) { bad++; console.error('  БАГ  ' + what); }
                             else console.log('  ok   ' + what); };

console.log('сведено написаний: ' + out.fold.length);
out.fold.forEach(f => console.log('   ' + f.from.padEnd(24) + '→  ' + f.to));
console.log('');

check(out.fold.length > 0, 'сведение вообще что-то нашло');
check(out.fold.every(f => f.targetLives),
      'каждый, в кого свели, встречается в году вне капа 4');
check(out.dupes.length === 0,
      'сведение не задвоило ни одной карточки' +
      (out.dupes.length ? ' (' + out.dupes.slice(0, 3).join(', ') + ')' : ''));

// Разные люди остались разными. Это главная защита, а не мелочь.
const S = out.split;
const overlap = (a, b) => a.mates.some(m => b.mates.indexOf(m) >= 0);
check(S.Cr1nge.n > 0 && S.Cringe.n > 0, 'Cr1nge и Cringe оба на месте');
check(!overlap(S.Cr1nge, S.Cringe),
      'Cr1nge и Cringe не склеены — напарники не пересекаются');
check(S.K1nG.n > 0 && S.KING.n > 0, 'K1nG и KING оба на месте');
check(!overlap(S.K1nG, S.KING),
      'K1nG и KING не склеены — напарники не пересекаются');

// И то, с чего всё началось: дуо с одинаковыми результатами читается одинаково.
const D = out.duo;
check(out.vico === 0, 'написания VICO больше нет');
check(JSON.stringify(D.vic0.evs) === JSON.stringify(D.Malibuca.evs),
      'у vic0 и Malibuca один и тот же набор событий (' + D.vic0.evs.length + ')');
check(D.vic0.ovr === D.Malibuca.ovr,
      'и один и тот же рейтинг: ' + D.vic0.ovr + ' / ' + D.Malibuca.ovr);

if (bad) { console.error('\nне сходится: ' + bad); process.exit(1); }
console.log('\nсведение делает ровно то, что должно');
fs.rmSync(dir, { recursive: true, force: true });
