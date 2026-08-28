// Кому принадлежит ник — по всем карточным таблицам сразу.
//
// Портрет кладётся в PLAYER_PHOTO по нику, а ник в этом файле бывает занят
// дважды: 137 таких. Голый ключ отдаёт лицо европейца его тёзке из другого
// региона, поэтому перед добавлением надо знать, сколько людей носит ник и из
// каких они регионов и стран.
//
//   node tools/photo-handle-probe.js Bugha YUMA "916 GON"
//   node tools/photo-handle-probe.js --new     все ники из photos/ без записи
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let want = process.argv.slice(2);
if (!want.length || want[0] === '--new') {
  // Что лежит в папке, но ещё не названо в карте портретов.
  const block = src.slice(src.indexOf('const PLAYER_PHOTO={'));
  const files = new Set([...block.slice(0, block.indexOf('\n};')).matchAll(/:\s*"([^"]+)"/g)]
    .map(m => m[1].toLowerCase()));
  want = fs.readdirSync(path.join(ROOT, 'photos'))
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !files.has(f.toLowerCase()))
    .map(f => f.replace(/\.[^.]+$/, ''));
}

// Имена таблиц берутся из исходника, а не с window: они объявлены через const,
// а const в глобальной области ЛЕКСИЧЕСКАЯ — на window такие имена не висят, и
// Object.keys(window) их не видит. Значение достаётся по имени через eval.
const TABLES = [...src.matchAll(/const (CARD_[A-Z0-9_]+_RAW)=\[/g)].map(m => m[1]);

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const WANT=${JSON.stringify(want)}, TABLES=${JSON.stringify(TABLES)};
  const out={rows:[], errs:[], tables:0};
  try{
    // Регион называет имя переменной (CARD_T1NAC_GF_RAW → NAC): в самих строках
    // его нет, там только ранг, очки и ники.
    const regOf=name=>{
      const m=name.match(/^CARD_(?:[A-Z0-9]+?)?(EU|NAC|NAW|BR|ASIA|ME|OCE)(?:_(?:PLAYIN|LCQ|GF|RAW))/);
      return m ? m[1] : '';
    };
    const data=[];
    TABLES.forEach(t=>{
      let v=null;
      try{ v=(0,eval)(t); }catch(e){}
      if(Array.isArray(v)) data.push({name:t, reg:regOf(t), rows:v});
    });
    out.tables=data.length;
    WANT.forEach(h=>{
      const key=String(h).trim().toLowerCase();
      const hits=new Map();
      data.forEach(t=>{
        t.rows.forEach(row=>{
          (Array.isArray(row)?row:[]).forEach(cell=>{
            if(typeof cell!=='string') return;
            const hand=cell.trim();
            if(hand.toLowerCase()!==key) return;
            const k=t.reg||'?';
            if(!hits.has(k)) hits.set(k, {reg:t.reg, n:0, exact:hand, where:t.name});
            hits.get(k).n++;
          });
        });
      });
      out.rows.push({want:h, hits:[...hits.values()]});
    });
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccph-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.replace(/\\/g,'/') + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox',
  '--allow-file-access-from-files','--virtual-time-budget=30000','--dump-dom',
  'file:///' + tmp.replace(/\\/g,'/')], {maxBuffer:512*1024*1024, encoding:'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive:true, force:true});
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('проба не дала вывода'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.errs.length) console.error(out.errs.join('\n'));
out.rows.forEach(r => {
  if (!r.hits.length) { console.log(r.want.padEnd(14) + ' — в картах не найден'); return; }
  console.log(r.want.padEnd(14) + ' ' + r.hits
    .map(h => (h.reg||'?') + (h.country ? '/' + h.country : '') + ' ×' + h.n +
              (h.exact !== r.want ? ' («' + h.exact + '»)' : ''))
    .join('   '));
});
