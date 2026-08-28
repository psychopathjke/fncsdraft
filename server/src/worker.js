/* Переходник: вебсокет -> Durable Object -> lobby.js.
 *
 * Здесь не принимается ни одного решения. Всё, что этот файл делает, —
 * достаёт лобби по коду, отдаёт сообщение машине и рассылает то, что она
 * вернула. Логика живёт в lobby.js и проверяется без сети.
 */
import { createLobby } from './lobby.js';

export class Lobby {
  // Тридцать дней тишины — и лобби убирается. См. touch/alarm ниже.
  static TTL = 30*86400000;
  constructor(state, env){
    this.state=state; this.env=env;
    this.socks=new Map();               // clientId -> WebSocket
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
  fanout(id, sends){
    for(const s of sends){
      const raw=JSON.stringify(s.msg);
      if(s.to==='self'){ this.socks.get(id)?.send(raw); continue; }
      for(const [cid, sock] of this.socks){
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
       Здесь socks ещё не содержит текущего клиента — он добавляется ниже,
       после рукопожатия, — так что пустота означает именно «он первый». */
    if(!this.lobby.state.build || this.socks.size===0) this.lobby.state.build=build;
    const pair=new WebSocketPair();
    const [client, server]=Object.values(pair);
    server.accept();
    this.socks.set(id, server);
    server.addEventListener('message', async ev=>{
      let m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; }
      let sends=[];
      if(m.t==='hello')       sends=this.lobby.join(id, m);
      else if(m.t==='card')   sends=this.lobby.card(id, m.card);
      else if(m.t==='team')   sends=this.lobby.team(id, m.team);
      else if(m.t==='ready')  sends=this.lobby.ready(id, m.day);
      else if(m.t==='act')    sends=this.lobby.act(id, m.kind, m.payload);
      else if(m.t==='digest') sends=this.lobby.digest(id, m.hash, m.team);
      else if(m.t==='since')  { for(const e of this.lobby.since(id, m.n)) server.send(JSON.stringify(e)); }
      else if(m.t==='part')   sends=this.lobby.part(id);
      this.fanout(id, sends);
      await this.touch();
    });
    server.addEventListener('close', ()=>{ this.socks.delete(id); });
    return new Response(null, {status:101, webSocket:client});
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
