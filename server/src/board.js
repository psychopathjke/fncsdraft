/* Общая таблица карьер: кто сколько заработал.
 *
 * Идея с сайта, 2.10: «что ещё добавить» — таблица, где своя карьера стоит среди
 * чужих. Карьера живёт в браузере игрока, сервер её не считает и проверить не
 * может: строку присылает сам клиент. Поэтому здесь не античит, а санитария —
 * ник без разметки и длиной с ник, числа в границах, которые карьера вообще
 * способна набрать, одна строка на карьеру и не чаще раза в минуту. Подделать
 * строку всё равно можно, и таблица об этом честно пишет у себя под шапкой.
 *
 * Хранение — не здесь: этот файл получает строки и отдаёт решения, как lobby.js,
 * и проверяется без сети (server/tools/check-board.js). */

const REGIONS=['EU','NAC','NAW','BR','ASIA','ME','OCE'];
const MAX_EARN_PER_SEASON=6000000;   // больше одного сезона карьера не платит: GC + мейджоры + капы с запасом
const MIN_GAP_MS=60000;              // одна строка в минуту на карьеру
const TOP=100;

function cleanNick(s){
  return String(s==null ? '' : s)
    .replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 24);
}
function int(v, lo, hi){
  const n=Math.round(Number(v));
  if(!Number.isFinite(n) || n<lo || n>hi) return null;
  return n;
}

/* Строка от клиента -> строка таблицы, или причина отказа. */
function normalize(e, now){
  if(!e || typeof e!=='object') return {err:'shape'};
  const id=String(e.id||'');
  if(!/^[a-z0-9-]{16,40}$/.test(id)) return {err:'id'};
  const nick=cleanNick(e.nick);
  if(!nick) return {err:'nick'};
  const region=REGIONS.indexOf(e.region)>=0 ? e.region : null;
  if(!region) return {err:'region'};
  const country=/^[a-z]{2}$/.test(String(e.country||'')) ? e.country : '';
  const seasons=int(e.seasons, 1, 60);
  if(seasons==null) return {err:'seasons'};
  const earn=int(e.earn, 0, MAX_EARN_PER_SEASON*seasons);
  if(earn==null) return {err:'earn'};
  const ovr=int(e.ovr, 1, 120);
  const div=int(e.div, 1, 5);
  const titles=int(e.titles||0, 0, 500);
  const year=int(e.year, 2019, 2040);
  if(ovr==null || div==null || titles==null || year==null) return {err:'num'};
  // Лучший результат — «1/150» или пусто.
  const bm=/^(\d{1,5})\/(\d{1,6})$/.exec(String(e.best||''));
  const best=(bm && +bm[1]>=1 && +bm[1]<=+bm[2]) ? bm[1]+'/'+bm[2] : '';
  const bestEv=cleanNick(e.bestEv).slice(0, 40);
  return {row:{id, nick, region, country, seasons, earn, ovr, div, titles, year, best, bestEv, at:now}};
}

function createBoard(){
  return {
    /* prev — уже лежащая строка этой карьеры (или null). Возвращает
       {row} для записи, {skip:'gap'} если рано, {err} если строка плохая. */
    accept(e, prev, now){
      const n=normalize(e, now);
      if(n.err) return n;
      if(prev && now-(prev.at||0) < MIN_GAP_MS) return {skip:'gap'};
      return n;
    },
    /* Отдача: верх по заработку, регион по желанию; место своей карьеры
       считается отдельно (rankOf), потому что в сотню она может не попасть. */
    top(rows, region){
      return rows.filter(r=>!region || r.region===region)
        .sort((a,b)=>b.earn-a.earn || a.at-b.at).slice(0, TOP);
    },
    rankOf(rows, id, region){
      const me=rows.find(r=>r.id===id);
      if(!me || (region && me.region!==region)) return null;
      const above=rows.filter(r=>(!region || r.region===region) &&
        (r.earn>me.earn || (r.earn===me.earn && r.at<me.at))).length;
      return {rank:above+1, row:me};
    }
  };
}

module.exports={ createBoard, normalize, cleanNick, REGIONS, MIN_GAP_MS, TOP };
