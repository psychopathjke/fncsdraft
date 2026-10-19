/* Ники, которые таблица дня не принимает (19.10, его слово: «в таблице дня n-word и оскорбления можешь не
 * пускать такие никнеймы»). Ник приводится к одному виду: строчные, похожие кириллические буквы в латиницу,
 * цифры-подмены (1→i, 3→e, 0→o, 4→a, 5→s, 7→t, @→a, $→s), повторы букв дальше двух срезаны («niiigga» → «niigga»).
 * Три списка: однозначное — где угодно в нике; двусмысленное («niga» в «shinigami», «rape» в «scrape») — только с
 * начала слова; короткое («spic», «coon», «kys») — только словом целиком. Замер на никах сцены — tools/check-daily.js. */

const LEET={'1':'i','!':'i','|':'i','3':'e','0':'o','4':'a','@':'a','5':'s','$':'s','7':'t'};
// Кириллица, похожая на латиницу: «nіgga» с украинской і, «niggа» с русской а.
const HOMO={'а':'a','в':'b','е':'e','ё':'e','к':'k','м':'m','о':'o','р':'p','с':'c','т':'t','у':'y','х':'x','і':'i','ї':'i','ј':'j'};

// Где угодно (буквы подряд, без пробелов и знаков).
const ANY=['nigg','nlgg','niqq','nibba','fagg','tranny','retard','hitler','killyourself','kilyourself','kysnow','whore',
  'fuck','motherf','bitch','hurensohn','encule','maricon','pedophil',
  // Русский мат латиницей (19.10, его «pidoras pidr тоже не должно быть»).
  'pidaras','pidoras','pizd','blyat','blyad','nahui','nahuy','nahuj','gandon','gondon','mudak','zaebal','uebok','ueban','shlyuh','shluh',
  // Польский мат (в таблице дня 19.10: «jebac remika»).
  'jebac','jebany','jebana','kurwa','kurva','pierdol','spierdal','chuj'];
// С начала слова (слово сжато: повторы букв в одну).
const START=['pidor','pidar','pidr','eblan','niga','niger','nigah','niguh','nigr','fagot','kike','rape','nazi','pedo','slut','negre','chinga','trany','cunt'];
// Словом целиком.
const WORD=['gei','gey','gay','gayy','chmo','huy','xuy','huj','xyu','hyu','suka','suki','pidr','pidrila','pedik','ebat','ebal','eban','fag','fags','spic','spics','coon','coons','chink','gook','kys','nig','nigs','puta','puto','pute','paki','wetback','dyke','tard'];
// Слова, которые начинаются как запрещённые, но обычные.
const OK=['nigeria','nigel'];
// Русские — по кириллице (ё → е), где угодно.
const CYR=['пидор','пидар','пидр','хуй','хуе','хуя','пизд','ебан','ебал','ебат','еблан','уеба','уебо','уебк',
  'сука','суки','шлюх','чурк','жидяр','жидов','нигер','нигг','негр','даун','дебил','мудак','гандон','гондон'];

function latin(s){ let out=''; for(const ch of s) out+=HOMO[ch]||LEET[ch]||ch; return out; }
const squash=s=>s.replace(/(.)\1+/g, '$1');

function badNick(nick){
  // Диакритику снимаем только для латиницы: у кириллицы «й» разложилась бы в «и» с бревисом.
  const raw=String(nick==null ? '' : nick).toLowerCase();
  if(!raw.trim()) return false;
  if(/14\s*88/.test(raw)) return true;
  const cyr=raw.replace(/ё/g, 'е').replace(/[^а-яй]/g, '');
  if(CYR.some(w=>cyr.indexOf(w)>=0)) return true;
  const lat=latin(raw.normalize('NFKD').replace(/[̀-ͯ]/g, ''));
  const dbl=lat.replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
  if(ANY.some(w=>dbl.indexOf(w)>=0)) return true;
  for(const t of lat.split(/[^a-z]+/).filter(Boolean)){
    const sq=squash(t);
    if(WORD.indexOf(t)>=0 || WORD.indexOf(sq)>=0) return true;
    if(OK.some(w=>sq.indexOf(w)===0)) continue;
    if(START.some(w=>sq.indexOf(w)===0)) return true;
  }
  return false;
}

module.exports={ badNick };
