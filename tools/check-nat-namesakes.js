// Один ник — не один человек, и флаг не течёт между регионами.
//
// В наборах есть полные тёзки из разных сцен: p1ng — украинец в Европе и
// другой человек в Азии; Rise — американец в NA Central и японец в Азии. Список
// Глобалов при этом хранит одну страну на ник и ни одного региона: чемпионат
// общий, в нём стоят все семь сцен вперемешку. Пока он штамповался по одному
// нику, азиатским тёзкам доставалась чужая страна — да ещё с пометкой
// «проверено», после которой кросс-заливка их уже не трогала.
//
// Его сообщения, 21 августа: «p1ng украинец почему-то в азиатском регионе, он
// на еу играет» и «rise япония… когда он американец».
//
// Проверяется правило, а не два имени: у тёзок из разных регионов флаги должны
// расходиться, а не совпадать по общему списку.
//
//   node tools/check-nat-namesakes.js
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
      // Ник -> регион -> набор флагов, которые в этом регионе на нём стоят.
      const by=new Map();
      PLAYERS_BASE.forEach(p=>{
        if(p.tier!=='cardmode') return;
        const k=String(p.handle||'').trim().toLowerCase();
        if(!k || !p.nat) return;
        let m=by.get(k); if(!m){ m=new Map(); by.set(k, m); }
        const r=p.region||'';
        let s=m.get(r); if(!s){ s=new Set(); m.set(r, s); }
        s.add(p.nat);
      });
      const twins=[...by.entries()].filter(([,m])=>m.size>1);
      out.notes.namesakes=twins.length;
      check('the file still holds people who share a handle across regions',
            twins.length>0, String(twins.length));

      /* Сколько тёзок мод разводит по флагам. Совпадение само по себе не
         ошибка — норвежец может играть и в Европе, и на ЛАНе, — но когда
         совпадают все, это признак того, что флаг ставится по нику. */
      let same=0, apart=0;
      const sameList=[];
      twins.forEach(([h,m])=>{
        const flags=new Set();
        m.forEach(s=>s.forEach(f=>flags.add(f)));
        if(flags.size===1){ same++; if(sameList.length<12) sameList.push(h); }
        else apart++;
      });
      /* Число сообщается, но не проверяется. Одинаковый флаг у тёзок сам по
         себе не ошибка: часть из них — один и тот же человек, чья карточка
         стоит в двух регионах (ЛАН, переезд), и сколько их именно — из этих
         таблиц не видно. Придумать сюда порог значило бы проверять свою
         догадку, а не данные. Проверяются те двое, на которых ошибку поймали,
         и правило, которое их развело. */
      out.notes.split={apart:apart, oneFlagForBoth:same, sample:sameList};

      // Два, на которых это поймали.
      const flagsOf=(h,r)=>{
        const s=(by.get(h)||new Map()).get(r);
        return s ? [...s] : [];
      };
      out.notes.p1ng={EU:flagsOf('p1ng','EU'), ASIA:flagsOf('p1ng','ASIA')};
      out.notes.rise={NAC:flagsOf('rise','NAC'), ASIA:flagsOf('rise','ASIA')};
      check('the European p1ng is Ukrainian',
            out.notes.p1ng.EU.length===1 && out.notes.p1ng.EU[0]==='Украина',
            JSON.stringify(out.notes.p1ng));
      check('and the Asian one is not',
            out.notes.p1ng.ASIA.indexOf('Украина')<0,
            JSON.stringify(out.notes.p1ng));
      check('the Asian Rise is Japanese',
            out.notes.rise.ASIA.length===1 && out.notes.rise.ASIA[0]==='Япония',
            JSON.stringify(out.notes.rise));
      check('and the NA Central one is not',
            out.notes.rise.NAC.indexOf('Япония')<0,
            JSON.stringify(out.notes.rise));

      /* И ручная поправка попадает туда, куда её направили. 'РЕГИОН|Ник' есть
         ровно потому, что 'Ник' на тёзках чинит одного и ломает второго. */
      const scoped=Object.keys(NAT_OVERRIDE).filter(k=>k.indexOf('|')>0);
      out.notes.scopedOverrides=scoped;
      scoped.forEach(k=>{
        const at=k.indexOf('|'), reg=k.slice(0,at), h=k.slice(at+1);
        const here=flagsOf(h.trim().toLowerCase(), reg);
        const other=[...(by.get(h.trim().toLowerCase())||new Map()).entries()]
          .filter(([r])=>r!==reg).map(([r,s])=>r+':'+[...s].join('/'));
        check('a scoped override lands in its own region only — '+k,
              here.length===1 && here[0]===NAT_OVERRIDE[k] &&
              other.every(x=>x.indexOf(NAT_OVERRIDE[k])<0),
              JSON.stringify({here:here, elsewhere:other}));
      });
    }catch(e){ out.err=String(e && e.stack || e); }
    document.getElementById('__out').textContent=
      'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
  };
  if(typeof ccMapsReady==='function') ccMapsReady(done); else done();
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'twins-'));
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
console.log('namesakes keep their own flags');
fs.rmSync(dir, { recursive: true, force: true });
