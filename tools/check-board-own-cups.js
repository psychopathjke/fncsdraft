// Своим турниром нельзя подняться в таблице игроков: ни на клиенте, ни на сервере.
//   node tools/check-board-own-cups.js
const fs=require('fs'),os=require('os'),path=require('path');const {execFileSync}=require('child_process');
const fails=[]; const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
// Сервер: строка старого клиента со своими турнирами.
const {normalize, OLD_CUP_PER_SEASON}=require(path.join(__dirname,'..','server','src','board.js'));
const base={id:'abcdefghijklmnop1234', nick:'test', region:'EU', country:'pl', ovr:90, div:1, titles:1, year:2026, best:'', bestEv:'', spent:0, seasons:23, earn:16265210};
const old=normalize(Object.assign({}, base, {earnAll:2361760410}), 1).row;
check('сервер режет старую строку', old && old.earnAll===base.earn+OLD_CUP_PER_SEASON*base.seasons, old && old.earnAll);
const fair=normalize(Object.assign({}, base, {earnAll:base.earn+500000}), 1).row;
check('бонус за подпись проходит', fair && fair.earnAll===base.earn+500000, fair && fair.earnAll);
const none=normalize(Object.assign({}, base), 1).row;
check('без earnAll как раньше', none && none.earnAll===base.earn, none && none.earnAll);
// Клиент: своя победа не попадает ни в одну колонку строки.
const body=String.raw`
const fails=[]; const check=(n, ok, d)=>{ if(!ok) fails.push(n+(d!=null ? ': '+d : '')); };
const card=PLAYERS_BASE.find(c=>c.cardSet==='m2' && c.region==='EU');
const saved=CAREER;
CAREER={player:{nick:'test', handle:'test', country:'pl', ovr:80}, career:{season:3, year:2026, division:1, earnings:5000000, earnSign:200000, ownCups:[], log:[
  {place:1, of:100, kind:'victory', own:true, prize:1000000, day:'2026-05-01'},
  {place:2, of:100, kind:'cup', prize:3800000, day:'2026-05-02'}]}};
let row=null, err=null; try{ row=ccBoardRow(); }catch(e){ err=String(e); }
CAREER=saved;
check('строка собирается', !!row, err);
if(row){ check('турниры без своих', row.earn===3800000, row.earn); check('все призы: турниры и подпись', row.earnAll===4000000, row.earnAll); }
return {fails, earn:row && row.earn, all:row && row.earnAll};
`;
const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'board-')),'body.js'); fs.writeFileSync(tmp, body);
const out=execFileSync(process.execPath,[path.join(__dirname,'probe-run.js'), tmp, '120000'],{encoding:'utf8',maxBuffer:1<<26,stdio:['ignore','pipe','ignore']});
const res=JSON.parse(out); if(res.err) fails.push(res.err); else res.fails.forEach(f=>fails.push(f));
if(fails.length){ fails.forEach(f=>console.log('FAIL '+f)); process.exit(1); }
console.log('OK check-board-own-cups');
