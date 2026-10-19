/* Драфт дня (16.10, его «3» из «что добавить, чтобы привлечь игроков»): у всех в один день одни и те же
 * карточки, одна попытка, таблица дня. Как и таблица карьер, сервер игру не считает — строку присылает
 * клиент, здесь только санитария: день — сегодня или вчера по UTC (кто доигрывал за полночь), ник без
 * разметки, числа в границах, одна строка на браузер в день, повтор не перезаписывает первую попытку.
 * Решения — здесь, без сети; проверка — server/tools/check-daily.js. */

const { cleanNick } = require('./board.js');
const { badNick } = require('./nick-filter.js');

const DAY_RE=/^\d{4}-\d{2}-\d{2}$/;
const TOP=100;

function dayOf(ms){ return new Date(ms).toISOString().slice(0, 10); }
function int(v, lo, hi){
  const n=Math.round(Number(v));
  if(!Number.isFinite(n) || n<lo || n>hi) return null;
  return n;
}

function normalize(e, now){
  if(!e || typeof e!=='object') return {err:'shape'};
  const id=String(e.id||'');
  if(!/^[a-z0-9-]{16,40}$/.test(id)) return {err:'id'};
  const day=String(e.day||'');
  if(!DAY_RE.test(day) || (day!==dayOf(now) && day!==dayOf(now-864e5))) return {err:'day'};
  const nick=cleanNick(e.nick);
  if(!nick) return {err:'nick'};
  // N-word и оскорбления в таблицу дня не встают (19.10, его слово). См. nick-filter.js.
  if(badNick(nick)) return {err:'nickbad'};
  const score=int(e.score, 0, 100000);
  const place=int(e.place, 1, 1000);
  const field=int(e.field, 1, 1000);
  if(score==null || place==null || field==null || place>field) return {err:'num'};
  const team=(Array.isArray(e.team) ? e.team : []).slice(0, 4).map(h=>cleanNick(h).slice(0, 24)).filter(Boolean).join(',');
  const country=/^[a-z]{2}$/.test(String(e.country||'')) ? e.country : '';
  // Сила состава (16.10): средний рейтинг карточек до сотых + синергия (до +12) — «точная сила». Хранится в сотых
  // (p100), чтобы порядок был без ничьих; syn — сколько из неё синергия, для подписи. Нет — 0.
  const p100=int(Math.round(Number(e.power)*100), 0, 15000)||0;
  const syn=int(e.syn, 0, 12)||0;
  return {row:{day, id, nick, country, score, place, field, team, power:Math.floor(p100/100), p100, syn, at:now}};
}

/* Порядок таблицы дня (16.10, его слово «только сила»): сила состава, потом очки, потом кто раньше сыграл. */
function better(a, b){ return (b.p100||0)-(a.p100||0) || b.score-a.score || a.at-b.at; }

module.exports={ normalize, better, dayOf, DAY_RE, TOP, badNick };
