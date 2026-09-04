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
    await this.state.storage.put('lobby', {build:this.lobby.state.build,
      seed:this.lobby.state.seed, team:this.lobby.state.team, st:this.lobby.state});
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

export default {
  async fetch(req, env){
    const url=new URL(req.url);
    const m=url.pathname.match(/^\/lobby\/([A-Z0-9]{6})$/);
    if(!m) return new Response('no', {status:404});
    if(req.headers.get('Upgrade')!=='websocket')
      return new Response('websocket only', {status:426});
    const stub=env.LOBBY.get(env.LOBBY.idFromName(m[1]));
    return stub.fetch(req);
  }
};
