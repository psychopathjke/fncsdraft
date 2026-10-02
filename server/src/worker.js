/* Переходник: вебсокет -> Durable Object -> lobby.js.
 *
 * Здесь не принимается ни одного решения. Всё, что этот файл делает, —
 * достаёт лобби по коду, отдаёт сообщение машине и рассылает то, что она
 * вернула. Логика живёт в lobby.js и проверяется без сети.
 *
 * СОКЕТЫ СПЯТ (WebSocket Hibernation API). 29 августа 2026 лобби легло на
 * весь день с «Exceeded allowed duration in Durable Objects free tier»:
 * каждое подключение держало объект в памяти, а бесплатный тариф считает
 * именно время жизни объекта — открытая вкладка с лобби тратила его
 * круглые сутки, и двух вкладок хватало, чтобы к вечеру квота кончилась и
 * ни одна команда не могла даже завестись. С гибернацией объект спит между
 * сообщениями, а сокеты держит платформа: спящее лобби не стоит ничего.
 *
 * Отсюда два правила. Память объекта между сообщениями НЕ переживает сон —
 * поэтому состояние лобби читается из storage на каждом пробуждении
 * (boot) и пишется после каждого сообщения (touch -> keep), а список
 * сокетов не хранится вовсе: его отдаёт платформа (getWebSockets), а кто
 * есть кто, лежит в attachment самого сокета. */
import { createLobby } from './lobby.js';
import { createBoard, REGIONS, TOP } from './board.js';

export class Lobby {
  // Тридцать дней тишины — и лобби убирается. См. touch/alarm ниже.
  static TTL = 30*86400000;
  constructor(state, env){
    this.state=state; this.env=env;
    this.lobby=null;
  }
  async boot(){
    if(this.lobby) return;
    const saved=await this.state.storage.get('lobby');
    this.lobby=createLobby(saved||{});
    if(saved && saved.st) Object.assign(this.lobby.state, saved.st);
  }
  async keep(){
    // Лобби переживает выгрузку DO: состояние команды нельзя терять.
    const st=this.lobby.state;
    let rec={build:st.build, seed:st.seed, team:st.team, st:st};
    /* На значение хранилища 128 КиБ, и лента вечера в комнате на шестерых способна
       к нему подойти (см. FEED_MAX в lobby.js). Не влезло — сохраняем без ленты:
       команда, сид и вечер важнее догона, а без записи не пережил бы никто. */
    try{
      if(JSON.stringify(rec).length > 100*1024)
        rec={build:st.build, seed:st.seed, team:st.team, st:Object.assign({}, st, {feed:[]})};
    }catch(e){}
    await this.state.storage.put('lobby', rec);
  }
  /* Брошенное лобби убирается само.

     Месяц никто не заходил — это не пауза, а брошенная команда. Будильник
     Durable Object переставляется на каждом сообщении, поэтому живое лобби до
     него не доживает никогда, а мёртвое просыпается один раз и стирает себя.
     Срок проверяется не здесь, а в lobby.js подставными часами
     (server/tools/check-lobby.js): сюда настоящие часы и приходят. */
  async touch(){
    this.lobby.touch(Date.now());
    await this.state.storage.setAlarm(Date.now()+Lobby.TTL);
    await this.keep();
  }
  async alarm(){
    await this.boot();
    if(this.lobby.stale(Date.now(), Lobby.TTL)){
      await this.state.storage.deleteAll();
      return;
    }
    await this.state.storage.setAlarm(Date.now()+Lobby.TTL);
  }
  /* Кто сейчас на связи: id -> сокет.

     Один id — один живой сокет, последний по времени. Вкладка, которая
     переподключилась раньше, чем закрылся старый сокет (перезагрузка,
     повторный вход в карьеру), оставляет его висеть: раньше новый просто
     затирал старый в карте, и старый молчал до самой смерти. Здесь то же
     самое: старый помечается мёртвым в своём attachment (см. fetch) и в
     список не попадает. Закрывать его нельзя — клиент на закрытие отвечает
     переподключением, и два сокета гонялись бы друг за другом без конца. */
  socks(){
    const m=new Map();
    for(const ws of this.state.getWebSockets()){
      let a=null; try{ a=ws.deserializeAttachment(); }catch(e){}
      if(a && a.id && !a.dead) m.set(a.id, ws);
    }
    return m;
  }
  fanout(id, sends){
    const socks=this.socks();
    for(const s of sends){
      const raw=JSON.stringify(s.msg);
      if(s.to==='self'){ try{ socks.get(id)?.send(raw); }catch(e){} continue; }
      for(const [cid, sock] of socks){
        if(s.to==='peer' && cid===id) continue;
        try{ sock.send(raw); }catch(e){}
      }
    }
  }
  async fetch(req){
    await this.boot();
    const url=new URL(req.url);
    const id=url.searchParams.get('id')||'';
    const build=url.searchParams.get('build')||'';
    /* Версия лобби переставляется, когда в лобби НИКОГО НЕТ.

       Проверка версий нужна ровно для одного: два клиента в одном вечере
       обязаны считать одинаково, значит и код у них обязан быть один. Она это
       и делает — но версия запоминалась НАВСЕГДА, с первого вошедшего, и
       переживала выкладку. После неё оба обновляли страницу, получали новый
       код, и лобби говорило обоим «у вас разные версии»: устарела не страница,
       а его собственная память. Его отчёт, 28 августа: «пишет, когда я с двух
       устройств обновил страницу, пытаюсь зайти на созданную карьеру но не
       могу» — то есть команда оказывалась запертой насмерть, и виноват был
       сторож, а не игроки.

       Поэтому версию ставит первый вошедший в ПУСТОЕ лобби. Гарантия при этом
       целая: пришедший вторым сверяется с ним и с чужой сборкой не проходит.
       Текущий клиент ещё не принят — он принимается ниже, — так что пустота
       означает именно «он первый». */
    if(!this.lobby.state.build || this.socks().size===0) this.lobby.state.build=build;
    // Прежний сокет этого же id — мёртв: см. socks.
    for(const old of this.state.getWebSockets(id)){
      try{ old.serializeAttachment({id:id, dead:true}); }catch(e){}
    }
    const pair=new WebSocketPair();
    const [client, server]=Object.values(pair);
    server.serializeAttachment({id:id});
    this.state.acceptWebSocket(server, [id]);
    return new Response(null, {status:101, webSocket:client});
  }
  async webSocketMessage(ws, data){
    await this.boot();
    let a=null; try{ a=ws.deserializeAttachment(); }catch(e){}
    if(!a || !a.id || a.dead) return;
    const id=a.id;
    let m=null; try{ m=JSON.parse(data); }catch(e){ return; }
    let sends=[];
    if(m.t==='hello')       sends=this.lobby.join(id, m);
    else if(m.t==='card')   sends=this.lobby.card(id, m.card);
    else if(m.t==='team')   sends=this.lobby.team(id, m.team);
    else if(m.t==='ready')  sends=this.lobby.ready(id, m.day, m.kind);
    else if(m.t==='act')    sends=this.lobby.act(id, m.kind, m.payload);
    else if(m.t==='digest') sends=this.lobby.digest(id, m.hash, m.team);
    else if(m.t==='since')  { for(const e of this.lobby.since(id, m.n)) { try{ ws.send(JSON.stringify(e)); }catch(err){} } }
    else if(m.t==='part')   sends=this.lobby.part(id);
    this.fanout(id, sends);
    await this.touch();
  }
  async webSocketClose(ws, code, reason, wasClean){
    try{ ws.close(1000, 'closing'); }catch(e){}
  }
  async webSocketError(ws, err){
    try{ ws.close(1011, 'error'); }catch(e){}
  }
}

/* Общая таблица карьер — один объект на весь сайт, строки в его SQLite.
 *
 * id карьеры — секрет клиента: по нему строка обновляется и удаляется, поэтому
 * наружу он не уходит никогда. Свою строку клиент узнаёт, передав id в ?me=,
 * и получает в ответ только флаг и место. Решения о строке — в board.js. */
export class Board {
  constructor(state, env){
    this.state=state; this.env=env; this.board=createBoard();
    this.sql=state.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS rows(
      id TEXT PRIMARY KEY, nick TEXT, region TEXT, country TEXT, seasons INTEGER, earn INTEGER,
      ovr INTEGER, div INTEGER, titles INTEGER, year INTEGER, best TEXT, bestEv TEXT, at INTEGER)`);
    this.sql.exec('CREATE INDEX IF NOT EXISTS rows_earn ON rows(earn DESC)');
  }
  one(id){ return this.sql.exec('SELECT * FROM rows WHERE id=?', id).toArray()[0]||null; }
  async fetch(req){
    const url=new URL(req.url);
    if(req.method==='POST'){
      let e=null; try{ e=await req.json(); }catch(err){ return json({err:'json'}, 400); }
      if(e && e.del){
        if(/^[a-z0-9-]{16,40}$/.test(String(e.id||''))) this.sql.exec('DELETE FROM rows WHERE id=?', String(e.id));
        return json({ok:true});
      }
      const now=Date.now();
      const r=this.board.accept(e, this.one(String((e&&e.id)||'')), now);
      if(r.err) return json({err:r.err}, 400);
      if(r.skip) return json({ok:true, skip:r.skip});
      const w=r.row;
      this.sql.exec(`INSERT OR REPLACE INTO rows(id,nick,region,country,seasons,earn,ovr,div,titles,year,best,bestEv,at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, w.id, w.nick, w.region, w.country, w.seasons, w.earn,
        w.ovr, w.div, w.titles, w.year, w.best, w.bestEv, w.at);
      return json({ok:true});
    }
    const region=REGIONS.indexOf(url.searchParams.get('region'))>=0 ? url.searchParams.get('region') : null;
    const me=String(url.searchParams.get('me')||'');
    const where=region ? ' WHERE region=?' : '';
    const args=region ? [region] : [];
    const rows=this.sql.exec('SELECT * FROM rows'+where+' ORDER BY earn DESC, at ASC LIMIT '+TOP, ...args).toArray();
    const total=this.sql.exec('SELECT COUNT(*) AS n FROM rows'+where, ...args).toArray()[0].n;
    let you=null;
    const mine=/^[a-z0-9-]{16,40}$/.test(me) ? this.one(me) : null;
    if(mine && (!region || mine.region===region)){
      const above=this.sql.exec('SELECT COUNT(*) AS n FROM rows WHERE (earn>? OR (earn=? AND at<?))'+(region?' AND region=?':''),
        mine.earn, mine.earn, mine.at, ...args).toArray()[0].n;
      you={rank:above+1, row:strip(mine)};
    }
    return json({total, rows:rows.map(r=>Object.assign(strip(r), r.id===me ? {you:true} : {})), you});
  }
}
function strip(r){ const o=Object.assign({}, r); delete o.id; return o; }
const CORS={'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers':'Content-Type'};
function json(o, status){
  return new Response(JSON.stringify(o), {status:status||200,
    headers:Object.assign({'Content-Type':'application/json', 'Cache-Control':'no-store'}, CORS)});
}

export default {
  async fetch(req, env){
    const url=new URL(req.url);
    if(url.pathname==='/board'){
      if(req.method==='OPTIONS') return new Response(null, {status:204, headers:CORS});
      if(req.method!=='GET' && req.method!=='POST') return new Response('no', {status:405, headers:CORS});
      // Тело не больше пары килобайт: строка карьеры столько и весит.
      if(req.method==='POST' && Number(req.headers.get('Content-Length')||0) > 4096) return json({err:'size'}, 413);
      const stub=env.BOARD.get(env.BOARD.idFromName('global'));
      return stub.fetch(req);
    }
    const m=url.pathname.match(/^\/lobby\/([A-Z0-9]{6})$/);
    if(!m) return new Response('no', {status:404});
    if(req.headers.get('Upgrade')!=='websocket')
      return new Response('websocket only', {status:426});
    const stub=env.LOBBY.get(env.LOBBY.idFromName(m[1]));
    return stub.fetch(req);
  }
};
