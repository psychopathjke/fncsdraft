// Итог загрузочного блока карточек (между @@PRE-FROM@@ и @@PRE-TILL@@ в index.html) — данными, для сборки.
//
//   node tools/build-card-precomp.js [папка]      — пишет <папка>/cards-pre.js, печатает штамп
//   require('./build-card-precomp.js').build(ROOT, OUT) → {v, file, bytes} или null
//
// Блок сводит ники, страны, клубы и рейтинг года по всем карточкам и в Safari стоит секунды при каждом заходе.
// Здесь он прогоняется один раз в headless Chrome: до блока снимаются поля карточек, после — что блок поменял
// (в итоговом порядке ключей) и четыре глобала, которые он заполняет. Потом второй прогон уже с готовыми данными,
// и хеш всех полей всех карточек (порядок ключей как есть) и этих глобалов должен совпасть с первым. Не совпал,
// нет Chrome или что-то не ложится в JSON без потерь — null, и сборка едет без файла (страница посчитает сама).
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');

const CHROMES = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];

// Хеш состояния: каждая карточка целиком (вложенные объекты тоже), ключи в том порядке, в каком они лежат.
const GLOBALS = ['CC_HANDLE_FOLD','RATING_FLOOR','YEAR_RATING','CC_LEDGER_2026'];
const HASH_JS = `var __PRE_GLOBALS=${JSON.stringify(GLOBALS)};
function __preHash(){
  let x=2166136261, n=0;
  const H=s=>{ n+=s.length; for(let i=0;i<s.length;i++){ x^=s.charCodeAt(i); x=Math.imul(x,16777619); } };
  const cards=new WeakSet(PLAYERS_BASE);
  // Как JSON (undefined и функции выпадают), но общий объект пишется каждый раз целиком, а не помечается:
  // после данных он копия, и хеш не должен это различать. Цикл — только по цепочке предков.
  const ser=(v, top)=>{ const up=new Set();
    const go=y=>{
      if(y===null) return 'null';
      const t=typeof y;
      if(t==='number') return (!isFinite(y) || Object.is(y, -0)) ? '"num:'+(Object.is(y,-0)?'-0':String(y))+'"' : String(y);
      if(t==='string' || t==='boolean') return JSON.stringify(y);
      if(t!=='object') return undefined;
      if(y!==top && cards.has(y)) return '"[card]"';
      if(up.has(y)) return '"[cyc]"';
      up.add(y); let s;
      if(y instanceof Map) s='{"Map":'+go([...y])+'}';
      else if(y instanceof Set) s='{"Set":'+go([...y])+'}';
      else if(Array.isArray(y)) s='['+y.map(e=>{ const r=go(e); return r===undefined ? 'null' : r; }).join(',')+']';
      else { const parts=[]; for(const k of Object.keys(y)){ const r=go(y[k]); if(r!==undefined) parts.push(JSON.stringify(k)+':'+r); } s='{'+parts.join(',')+'}'; }
      up.delete(y); return s; };
    return go(v); };
  PLAYERS_BASE.forEach(p=>{ H(ser(p, p)); H('\\n'); });
  __PRE_GLOBALS.forEach(g=>{ H(g+'='+ser((0,eval)(g), null)); });
  // score у строк ledger — функция, JSON её не видит: хешируется её значение на каждом месте из map.
  Object.keys(CC_LEDGER_2026||{}).forEach(reg=>CC_LEDGER_2026[reg].forEach(src=>Object.keys(src.map).forEach(h=>H(String(src.score(src.map[h]))))));
  return (x>>>0).toString(16)+':'+n;
}`;

// До и после блока. Значение, которое JSON не вернёт тем же (undefined, NaN, -0, ссылка на карточку или общий
// объект), — отказ: молча потерять его нельзя.
const HOOK_JS = `window.__pre={shared:{}};
function __PRE(){
  __pre.n=PLAYERS_BASE.length;
  __pre.before=PLAYERS_BASE.map(p=>{ const m=new Map(); for(const k of Object.keys(p)) m.set(k, p[k]); return m; });
  __pre.chk=[]; for(let i=0;i<PLAYERS_BASE.length;i+=397){ const p=PLAYERS_BASE[i]; __pre.chk.push([i, p.handle, p.rating, String(p.cardSet)]); }
  const l=PLAYERS_BASE.length-1, p=PLAYERS_BASE[l]; __pre.chk.push([l, p.handle, p.rating, String(p.cardSet)]);
}
function __POST(){
  const bad=[]; const pats=[], patIdx=new Map(), pi=[], col={}, objs=new Set();
  const cards=new WeakSet(PLAYERS_BASE);
  const same=(a, b)=>{ if(a===null || typeof a!=='object') return Object.is(a, b);
    if(b===null || typeof b!=='object' || Array.isArray(a)!==Array.isArray(b)) return false;
    // Ключ со значением undefined JSON не везёт (parts[].nth рейтинга); такие поля читают по имени, не перебором.
    const ka=Object.keys(a).filter(k=>a[k]!==undefined), kb=Object.keys(b).filter(k=>b[k]!==undefined);
    if(ka.join('|')!==kb.join('|')) return false;
    return ka.every(k=>same(a[k], b[k])); };
  const walk=(v, where)=>{ if(v===null || typeof v!=='object') return;
    if(cards.has(v)){ bad.push('card ref in '+where); return; }
    // Общий объект (строки parts одного человека на нескольких карточках) приедет копией: значения те же, только читаются.
    if(objs.has(v)){ const f=where.split(/[#.]/)[0]; __pre.shared[f]=(__pre.shared[f]||0)+1; return; } objs.add(v);
    if(v instanceof Map || v instanceof Set || Object.getPrototypeOf(v)!==(Array.isArray(v)?Array.prototype:Object.prototype)){ bad.push('non-plain object in '+where); return; }
    for(const k of Object.keys(v)) walk(v[k], where+'.'+k); };
  if(PLAYERS_BASE.length!==__pre.n) bad.push('card count changed');
  PLAYERS_BASE.forEach((p, i)=>{
    const b=__pre.before[i]; const ks=[];
    for(const k of b.keys()) if(!(k in p)) bad.push('field removed '+k);
    for(const k of Object.keys(p)){ const v=p[k]; if(b.has(k) && b.get(k)===v) continue; ks.push(k);
      if(!same(JSON.parse(JSON.stringify(v===undefined ? '__undef' : v)), v)) bad.push('not json-safe '+k+' #'+i);
      walk(v, k+'#'+i); (col[k]=col[k]||[]).push(v); }
    const key=ks.join(','); let j=patIdx.get(key); if(j===undefined){ j=pats.length; pats.push(ks); patIdx.set(key, j); } pi.push(j);
  });
  // Ledger: score(rank) читают только на местах из map, поэтому функция едет таблицей «место → число».
  const led=v=>{ const o={}; Object.keys(v).forEach(reg=>{ o[reg]=v[reg].map(src=>{ const c={};
    for(const k of Object.keys(src)){
      if(k==='score'){ const t={}; Object.keys(src.map).forEach(h=>{ const rk=src.map[h]; t[rk]=src.score(rk); }); c[k]=t; }
      else if(typeof src[k]==='function') bad.push('ledger function '+k); else c[k]=src[k]; }
    return c; }); }); return o; };
  const g={}; __PRE_GLOBALS.forEach(n=>{ const v=n==='CC_LEDGER_2026' ? led((0,eval)(n)) : (0,eval)(n);
    if(!same(JSON.parse(JSON.stringify(v)), v)) bad.push('not json-safe global '+n); walk(v, n); g[n]=v; });
  __pre.before=null;
  __pre.out={n:__pre.n, chk:__pre.chk, pats, pi, col, g};
  __pre.bad=bad.slice(0, 20);
}`;

function findChrome() { return CHROMES.find(p => p && fs.existsSync(p)) || null; }

function runPage(chrome, html, dir) {
  const tmp = path.join(dir, 'page.html');
  fs.writeFileSync(tmp, html);
  const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
    '--virtual-time-budget=120000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')],
    { maxBuffer: 2048 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 900000 });
  const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
  if (!m) throw new Error('страница не дала вывода');
  return JSON.parse(decodeURIComponent(m[1]));
}

function build(ROOT, OUT) {
  const chrome = findChrome();
  if (!chrome) { console.log('cards-pre: нет Chrome, сборка без готовых карточек'); return null; }
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const FROM = 'if(!ccPreApply()){ /*@@PRE-FROM@@*/', TILL = '} /*@@PRE-TILL@@*/', VDEV = "var CC_PRE_V='dev'";
  const a = src.indexOf(FROM), b = src.indexOf(TILL);
  if (a < 0 || b < a || src.indexOf(VDEV) < 0 || src.indexOf(FROM, a + 1) >= 0) { console.log('cards-pre: нет меток блока, пропуск'); return null; }
  const base = '<base href="file:///' + ROOT.replace(/\\/g, '/') + '/">';
  const out = js => `<pre id="__out" style="display:none"></pre><script>(function(){let o;try{o=(${js})();}catch(e){o={err:String(e&&e.stack||e)}}
    document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(o))+'END';})();<\/script>`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cardspre-'));
  try {
    // 1. Как в разработке: блок считается, до и после снимаются.
    const page1 = base + '<script>' + HOOK_JS + HASH_JS + '<\/script>' +
      src.slice(0, a) + '__PRE();' + src.slice(a, b + TILL.length) + '__POST();' + src.slice(b + TILL.length) +
      out('function(){ return {hash:__preHash(), out:__pre.out, bad:__pre.bad, shared:__pre.shared}; }');
    const r1 = runPage(chrome, page1, dir);
    if (r1.err) throw new Error(r1.err.slice(0, 300));
    if (r1.bad.length) throw new Error('не ложится в данные: ' + r1.bad.join('; '));
    console.log('cards-pre: общих объектов (едут копией) ' + JSON.stringify(r1.shared));
    // Штамп — хеш самих данных: пока карточки те же, файл тот же и лежит в кэше между выкладками.
    const v = crypto.createHash('sha1').update(JSON.stringify(r1.out)).digest('hex').slice(0, 12);
    const data = Object.assign({ v }, r1.out);
    const body = 'window.CC_PRECOMP=JSON.parse(' + JSON.stringify(JSON.stringify(data)) + ');';
    const preFile = path.join(dir, 'cards-pre.js');
    fs.writeFileSync(preFile, body);
    // 2. С готовыми данными: блок должен быть пропущен, а итог — тем же.
    const page2 = base + '<script src="file:///' + preFile.replace(/\\/g, '/') + '"><\/script><script>' + HASH_JS + '<\/script>' +
      src.replace(VDEV, "var CC_PRE_V='" + v + "'") +
      out('function(){ return {hash:__preHash(), used:CC_PRE_USED}; }');
    const r2 = runPage(chrome, page2, dir);
    if (r2.err) throw new Error(r2.err.slice(0, 300));
    if (r2.used!=='ok') throw new Error('готовые данные не применились: ' + r2.used);
    if (r2.hash !== r1.hash) throw new Error('итог разошёлся: ' + r1.hash + ' против ' + r2.hash);
    const file = path.join(OUT, 'cards-pre.js');
    fs.writeFileSync(file, body);
    console.log('cards-pre.js: ' + body.length + ' байт, штамп ' + v + ', карточек ' + data.n + ', хеш ' + r1.hash + ' совпал');
    return { v, file, bytes: body.length, hash: r1.hash };
  } catch (e) {
    console.log('cards-pre: ' + String(e.message).slice(0, 400) + ', сборка без готовых карточек');
    return null;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
module.exports = { build };

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const r = build(ROOT, path.resolve(process.argv[2] || ROOT));
  process.exit(r ? 0 : 1);
}
