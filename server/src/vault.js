/* Облачные сохранения (16.10, его «1» из «что ещё глобального»: карьера живёт только в браузере — почистил данные или
 * сменил телефон, и её нет; жалобы «обновил браузер — прогресс пропал» уже были).
 *
 * Без аккаунтов: код-ключ из 16 знаков (A–Z без путаных, 2–9 — около 80 бит), его выдаёт сам браузер. Один код — один
 * Durable Object (idFromName), в его SQLite — сейвы по ключу localStorage, кусками (значение строки в SQLite DO не больше
 * 2 МБ). Сервер ничего не знает об игре: хранит строку, отдаёт строку. Решения о форме запроса — здесь, без сети,
 * проверка — server/tools/check-vault.js. */

const CODE_RE=/^[A-HJ-NP-Z2-9]{16}$/;
// + fncsdraft_profile (30.10): ник и аватар вкладки «Профиль».
const KEY_RE=/^(fncsdraft_(career|manager)(_s\d{1,2})?|fncsdraft_profile)$/;
const MAX_ONE=6*1024*1024;      // одна запись (сжатая, base64)
const MAX_ALL=40*1024*1024;     // всё на один код
const MAX_KEYS=24;              // 10 карьер + 10 менеджеров + запас
const PART=1000*1000;

function checkReq(b){
  if(!b || typeof b!=='object') return {err:'shape'};
  if(!CODE_RE.test(String(b.code||''))) return {err:'code'};
  const op=String(b.op||'');
  if(['put','get','list','del'].indexOf(op)<0) return {err:'op'};
  if(op==='list') return {op, code:b.code};
  const key=String(b.key||'');
  if(!KEY_RE.test(key)) return {err:'key'};
  if(op!=='put') return {op, code:b.code, key};
  const data=b.data;
  if(typeof data!=='string' || !data.length) return {err:'data'};
  if(data.length>MAX_ONE) return {err:'size'};
  const info=JSON.stringify(b.info&&typeof b.info==='object' ? b.info : {}).slice(0, 400);
  const at=Math.round(Number(b.at)||0);
  return {op, code:b.code, key, data, info, at};
}
function parts(data){
  const out=[];
  for(let i=0; i<data.length; i+=PART) out.push(data.slice(i, i+PART));
  return out;
}

export { CODE_RE, KEY_RE, MAX_ONE, MAX_ALL, MAX_KEYS, PART, checkReq, parts };
