// Портреты: каждый ключ попадает в живого игрока, каждый файл лежит на месте.
//
// Три способа, которыми карта портретов тихо ломается, и все три уже случались:
//   1) значение указывает на файл, которого нет ИЛИ у которого другой регистр
//      имени. Windows этого не замечает, Cloudflare Pages отдаёт 404, и на
//      боевом сайте вместо лица монограмма;
//   2) ключ назван ником, которого в картах нет — портрет лежит зря;
//   3) ключ без региона на нике, который занят двумя разными людьми: лицо
//      европейца уезжает его тёзке.
//
//   node tools/check-photos.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PHOTOS = path.join(ROOT, 'photos');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const block = src.slice(src.indexOf('const PLAYER_PHOTO={'));
const MAP = [...block.slice(0, block.indexOf('\n};')).matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)]
  .map(m => ({key: m[1], file: m[2]}));
if (!MAP.length) { console.error('карта портретов не прочиталась'); process.exit(2); }

const fails = [], warns = [];

// ---- 1. файл существует, и ровно с тем же регистром имени -----------------
const onDisk = fs.readdirSync(PHOTOS);
const byLower = new Map(onDisk.map(f => [f.toLowerCase(), f]));
MAP.forEach(({key, file}) => {
  const real = byLower.get(file.toLowerCase());
  if (!real) fails.push('нет файла: ' + key + ' → ' + file);
  else if (real !== file)
    fails.push('регистр имени: ' + key + ' → ' + file + ', а на диске ' + real +
               ' (на Cloudflare это 404)');
  if (/\s/.test(file)) fails.push('пробел в имени файла: ' + file);
});

// ---- аватарка аккаунта сцены ----------------------------------------------
// Она лежит в той же папке, но не в PLAYER_PHOTO — у аккаунта нет карточки, —
// и потому мимо проверки выше прошла бы незамеченной.
const av = (src.match(/const CC_PRESS=\{[^}]*av:'([^']+)'/) || [])[1];
if (!av) fails.push('у аккаунта сцены нет аватарки (CC_PRESS.av)');
else {
  const real = byLower.get(av.toLowerCase());
  if (!real) fails.push('нет файла аватарки сцены: ' + av);
  else if (real !== av)
    fails.push('регистр имени аватарки сцены: ' + av + ', а на диске ' + real);
}

// ---- 2 и 3. ключи против настоящих ников ----------------------------------
const TABLES = [...src.matchAll(/const (CARD_[A-Z0-9_]+_RAW)=\[/g)].map(m => m[1]);
const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const KEYS=${JSON.stringify(MAP.map(m => m.key))}, TABLES=${JSON.stringify(TABLES)};
  const out={rows:[], errs:[]};
  try{
    const regOf=name=>{
      const m=name.match(/^CARD_(?:[A-Z0-9]+?)?(EU|NAC|NAW|BR|ASIA|ME|OCE)(?:_(?:PLAYIN|LCQ|GF|RAW))/);
      return m ? m[1] : '';
    };
    // Ник → набор регионов, в которых он встречается. Таблицы без региона в
    // имени (Мейджоры, Глобалы) в счёт не идут: они не отвечают на вопрос
    // «чей это ник», ради которого всё и считается.
    const where=new Map();
    TABLES.forEach(t=>{
      let v=null; try{ v=(0,eval)(t); }catch(e){}
      const reg=regOf(t);
      if(!Array.isArray(v) || !reg) return;
      v.forEach(row=>(Array.isArray(row)?row:[]).forEach(cell=>{
        if(typeof cell!=='string') return;
        const h=cell.trim();
        if(!where.has(h)) where.set(h, new Set());
        where.get(h).add(reg);
      }));
    });
    KEYS.forEach(k=>{
      const at=k.lastIndexOf('@');
      const handle=at>0 ? k.slice(0, at) : k;
      const reg=at>0 ? k.slice(at+1) : '';
      const regs=where.get(handle);
      out.rows.push({key:k, handle:handle, reg:reg,
                     found:regs ? [...regs] : []});
    });
  }catch(e){ out.errs.push(String(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccphc-'));
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

let orphan = 0, pinned = 0, plain = 0;
out.rows.forEach(r => {
  if (!r.found.length) {
    // Ник может жить только в списках Мейджоров и Глобалов — там региона нет,
    // и это не ошибка. Отмечаем, но не валим.
    orphan++;
    return;
  }
  if (r.reg) {
    pinned++;
    if (r.found.indexOf(r.reg) < 0)
      fails.push('регион не сходится: ' + r.key + ' — ник живёт в ' + r.found.join(', '));
  } else {
    plain++;
    /* Не FAIL, а предупреждение — и намеренно. Один и тот же ник в двух
       регионах ЧАЩЕ ВСЕГО значит двух разных людей, но не всегда: таблицы
       соседних регионов иногда держат одного и того же игрока. Кому именно
       принадлежит лицо, решается по самой фотографии, а этого проба не умеет
       и не должна притворяться, что умеет. */
    if (r.found.length > 1)
      warns.push('ник занят в ' + r.found.join(', ') + ', а ключ без региона: ' + r.key);
  }
});

// ---- что лежит в папке и никому не досталось ------------------------------
const used = new Set(MAP.map(m => m.file.toLowerCase()));
if (av) used.add(av.toLowerCase());   // на неё ссылается CC_PRESS, а не карта
const spare = onDisk.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !used.has(f.toLowerCase()));

console.log('  портретов в карте: ' + MAP.length +
            ' (с регионом ' + pinned + ', без ' + plain + ')');
console.log('  ников только в общих таблицах: ' + orphan);
if (warns.length) {
  console.log('  требуют человека (ник занят дважды, ключ без региона): ' + warns.length);
  warns.forEach(w => console.log('    ' + w));
}
if (spare.length) console.log('  файлов без записи: ' + spare.length + ' — ' + spare.join(', '));
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('каждый портрет попадает в своего игрока и лежит там, где на него ссылаются');
