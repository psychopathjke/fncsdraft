// Третий в трио-команде — и со стороны второго в лобби тоже.
//
// Его слово, 30 августа: «не могу взять игрока в трио, бота из списка».
// Две причины, обе здесь:
//   1) 'mp' ездит в командном состоянии, и роль напарника перетирала свою —
//      после первого обмена владелец читался «вторым» и терял список;
//   2) список «кому написать» и посадка были открыты только роли 'a', хотя
//      третий садится на два «да» — предложить его может любой из двоих.
// Проверяется: чужое состояние роль не трогает (код — да); у второго в лобби
// список открывается; его предложение уходит по проводу; на согласие
// напарника третий садится у него и едет полем mates.
//
//   node tools/check-mp-third-b.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const CHROME = [process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(function(){
  const out={fails:[], notes:{}, err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const sent=[];
  try{
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1, player:{nick:'Second', age:20, source:'rookie', country:'de', countryPing:15,
        closeRangeEdge:0, region:'EU', ovr:90, role:'roleIGL',
        attrs:ccRookieAttrs(90,'roleIGL'), ageEdge:0, photo:null,
        handle:null, cardRegion:null, nat:null},
      career:{season:1, day:'2026-02-02', division:1, earnings:0, balance:0,
              reach:0, tokens:[], log:[], news:[], seed:'fixed-world',
              size:3, sizes:{1:3}, mp:{code:'ABC123', role:'b'}},
      partners:[]}));
    careerLoad();
    MP.peer={handle:'howly', nat:'ru', region:'EU', rating:91,
             _targetOvr:91, _attrs:null, _roleKey:'roleFRG'};
    MP.send=function(m){ sent.push(m); };
    ccMpThirdWire();
    const cr=CAREER.career;
    // 1. Чужое состояние роль не трогает.
    ccApplyTeamState({mp:{code:'ABC123', role:'a'}, day:cr.day});
    check('роль осталась своей', cr.mp.role==='b', cr.mp.role);
    check('код на месте', cr.mp.code==='ABC123', cr.mp.code);
    ccApplyTeamState({mp:{code:'ZZZ999', role:'a'}});
    check('код из чужого состояния применяется', cr.mp.code==='ZZZ999', cr.mp.code);
    cr.mp.code='ABC123';
    // 2. Список «кому написать» открыт второму.
    ccDuoFindOpen();
    const fm=document.getElementById('duoFindModal');
    check('список открылся', fm && fm.style.display==='flex', fm && fm.style.display);
    ccDuoFindClose();
    // 3. Написать боту из списка и взять его.
    const w=careerDmPool().find(x=>x && x.role!=='roleIGL') || careerDuoSearchPool(true).find(x=>x && x.role!=='roleIGL');
    check('в списке есть кому написать', !!w);
    careerDmWrite(w.handle);
    const t=careerDmFind(w.handle);
    check('ветка завелась', !!t);
    t.state='offer'; t.pending=null;
    careerDmPush(t, 'them', 'dmAsk');
    careerDmAcceptAsk(t.id);
    const am=document.getElementById('ccAskModal');
    if(am && am.style.display==='flex') ccAskGo(true);
    const third=sent.filter(m=>m.t==='act' && m.kind==='third')[0];
    check('предложение второго ушло напарнику', !!third && third.payload.by===ccMpId(), JSON.stringify(third||null));
    check('посадки до ответа нет', (cr.mates||[]).length===0);
    // Напарник согласился.
    MP.say({t:'act', kind:'third-ok', by:'other', n:7, payload:{id:t.id, ok:true, to:ccMpId()}});
    check('третий сел у второго', (cr.mates||[]).length===1, JSON.stringify(cr.mates));
    check('состав — напарник и третий', careerMates().length===2, JSON.stringify(careerMates().map(m=>m&&m.handle)));
    check('ветка закрыта посадкой', t.state==='partner', t.state);
    check('третий едет полем mates', Array.isArray(ccTeamState().mates) && ccTeamState().mates.length===1);
    // 4. Второе кресло взятого в трио не открывается.
    ccDuoFindOpen();
    check('второго взятого в трио нет', !(fm && fm.style.display==='flex'));
    // 5. Прямой вызов без рукопожатия по-прежнему никого не сажает.
    cr.mates=[]; t.state='offer';
    careerDmAccept(t.id);
    check('без двух «да» посадки нет', (cr.mates||[]).length===0);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent=
    'PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpthirdb-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' +
  fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], {maxBuffer: 512*1024*1024, encoding: 'utf8', stdio:['ignore','pipe','ignore']});
fs.rmSync(dir, {recursive: true, force: true});
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('проба не отработала'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error('ERR: ' + out.err); process.exit(1); }
out.fails.forEach(f => console.log(' FAIL ' + f)); if (out.fails.length) process.exit(1);
console.log('третий в трио: роль своя, список и посадка открыты обоим, садится на два «да»');
