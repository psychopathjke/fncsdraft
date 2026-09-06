// Меню середины игры и картинки в вопросах.
//
// Его страница «картинки», 6 сентября 2026: «сверху слева аватарка моего спота,
// справа типа вся карта»; «выборы сделать: набить сёрдж, набить ресы, пойти
// файтиться… возможно смерть, шансы нужно распределить». Проверяется без
// вечера, на собранной команде и подменённом движке:
//   ccChoiceBox с side рисует квадратик точки слева и остров справа, у кнопок
//     с icon — картинка слева от названия; вариант def берётся сам под скипом;
//   меню середины: четыре хода в нужном порядке; при полных ресах сам берётся
//     «ротейтить», при пустых — рефреш (как ходит комната: баланс на месте);
//   сёрдж — плюс к своему урону, минус сила; ресы — рефреш как раньше;
//   файт по броску: победа выбивает соседа движком и даёт силу и ресы, размен
//     снимает щит и жжёт ресы, проигрыш — выбиты сами (движком, с именем соседа);
//   без соседа файт не убивает и не выбивает никого — размен;
//   строки меню на обоих языках.
//
//   node tools/check-career-mid-menu.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');

const BOOT = `
<pre id="__out" style="display:none"></pre>
<script>
(async function(){
  const out={fails:[], notes:[], err:null};
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  try{
    CAREER={player:{nick:'Menu', ovr:80}, career:{day:'2026-06-10', size:2}};
    LANG='ru'; CC_L_CACHE={};
    const T=L();
    // ---- панель: картинки заголовка и иконки кнопок --------------------------
    skipAnimation=false; CC_CHOICE_WAIT=60000;
    const host=document.createElement('div'); document.body.appendChild(host);
    useLandingSet('m2');
    const home=ALL_LANDING_ZONES[3];
    const side=ccDropSideHTML(home, 'm2');
    check('картинки высадки собраны', !!side && /cc-spot-shot-box/.test(side.left) && /cc-spot-shot-box/.test(side.right), JSON.stringify(side).slice(0,120));
    const p=ccChoiceBox('T', 'hint', [{id:'a', title:'A', icon:'<svg></svg>'}, {id:'b', title:'B', def:true}], host, side);
    await new Promise(r=>setTimeout(r, 30));
    const box=host.querySelector('.cc-choice');
    check('слева квадратик точки, справа остров', !!box && !!box.querySelector('.cc-choice-ava .cc-spot-shot') && !!box.querySelector('.cc-choice-mini .cc-spot-shot'));
    check('подсказка между ними', box.querySelector('.cc-choice-sub>span').textContent==='hint');
    check('иконка слева от названия', !!box.querySelector('.cc-choice-btn.has-ico .cc-choice-tt .cc-choice-ico svg'));
    box.querySelector('.cc-choice-btn[data-at="0"]').click();
    check('клик отвечает', (await p).id==='a');
    // def под скипом
    skipAnimation=true;
    check('под скипом берётся вариант def', (await ccChoiceBox('T','',[{id:'a',title:'A'},{id:'b',title:'B',def:true}], host)).id==='b');
    check('без def — первый', (await ccChoiceBox('T','',[{id:'a',title:'A'},{id:'b',title:'B'}], host)).id==='a');
    // ---- меню середины: состав и ход по умолчанию ------------------------------
    let seen=null; const realBox=ccChoiceBox;
    ccChoiceBox=async function(title, hint, options){ seen=options; return options.find(o=>o.id===WANT) || options.find(o=>o.def) || options[0]; };
    let WANT=null;
    const mk=(mats)=>({isYou:true, name:'ME', pow:90, _pf:90, _pc:90, _mats:mats,
                       _loot:{weapons:[{name:'Striker Pump Shotgun', rarity:'rare'}], heals:[], move:null},
                       _sq:{hp:100, shield:100, dealt:0, taken:0, alive:true}});
    /* Сёрдж в меню — только когда он включён (по замеру трёх игр финала, см.
       CC_SURGE_FARM). Кадр движка подменяется: живых больше порога — ход есть,
       меньше — хода нет. */
    const surgeGame=(players, at, line)=>({frames:()=>[{zone:5, players, surgeAt:at, surgeLine:line}], nearest:()=>null});
    let you=mk(550); WANT=null;
    await ccAskMenu(you, null);
    check('без кадра сёрджа — три хода: ротейт, ресы, файт', seen && seen.map(o=>o.id).join(',')==='stay,go,fight', seen && seen.map(o=>o.id).join(','));
    you=mk(550); you._game=surgeGame(58, 60, null); WANT=null;
    await ccAskMenu(you, null);
    check('лобби ниже порога — сёрджа в меню нет', seen.map(o=>o.id).indexOf('surge')<0, seen.map(o=>o.id).join(','));
    you=mk(550); you._game=surgeGame(76, 60, 30); WANT=null;
    await ccAskMenu(you, null);
    check('лобби выше порога — четыре хода: ротейт, сёрдж, ресы, файт', seen.map(o=>o.id).join(',')==='stay,surge,go,fight', seen.map(o=>o.id).join(','));
    check('сёрдж называет живых, порог и линию', /76/.test(seen[1].note) && /60/.test(seen[1].note) && /30/.test(seen[1].note), seen[1].note);
    check('полные ресы — сам ротейтит', seen.find(o=>o.def).id==='stay' && you._pf===90 && you._mats===550);
    check('у файта — картинка ствола из пака', /<img/.test(seen.find(o=>o.id==='fight').icon), seen.find(o=>o.id==='fight').icon.slice(0,60));
    check('у ресов — три стопки', (seen.find(o=>o.id==='go').icon.match(/<svg/g)||[]).length===3 && seen.find(o=>o.id==='go').icoCls==='wide');
    // Картинки высадки — внутри кнопок: квадратик точки у дома, остров у контеста.
    skipAnimation=false;
    const q=realBox('D', '', [{id:'home', title:'H', icon:side.left, icoCls:'pic'}, {id:'contest', title:'C', icon:side.right, icoCls:'pic pic-wide'}], host);
    await new Promise(r=>setTimeout(r, 30));
    const dbox=host.querySelector('.cc-choice');
    check('дом — квадратик точки внутри кнопки', !!dbox && !!dbox.querySelector('.cc-choice-btn[data-at="0"] .cc-choice-ico.pic .cc-spot-shot-box'));
    check('контест — остров с рамкой внутри кнопки', !!dbox && !!dbox.querySelector('.cc-choice-btn[data-at="1"] .cc-choice-ico.pic-wide .cc-spot-shot-box'));
    dbox.querySelector('.cc-choice-btn[data-at="1"]').click(); await q;
    skipAnimation=true;
    you=mk(100); WANT=null;
    const r0=Math.random; Math.random=()=>0.01;
    await ccAskMenu(you, null);
    check('пустые ресы — сам идёт за рефрешем, как комната', seen.find(o=>o.def).id==='go' && you._mats===CC_MATS_FULL, you._mats+'/'+you._pf);
    Math.random=r0;
    // ---- сёрдж ----------------------------------------------------------------
    you=mk(550); you._game=surgeGame(76, 60, 30); WANT='surge';
    await ccAskMenu(you, null);
    check('сёрдж: плюс свой урон, плюс полученный, минус сила', you._sq.dealt===CC_SURGE_FARM && you._sq.taken===CC_SURGE_TAKEN && you._pf===90-CC_SURGE_FARM_POW, you._sq.dealt+'/'+you._sq.taken+'/'+you._pf);
    // ---- файт: четыре исхода через подменённый движок ---------------------------
    // Сосед равной силы: решающие 29% делятся пополам (ccFightWinOdds).
    const foe={name:'FOE', squad:[{},{}], _pc:90};
    const log=[];
    const game={nearest:()=>foe, eliminate:(t,by)=>{ log.push((t.name)+'<'+(by.name)); return true; }};
    check('равные силы — победа и смерть поровну', Math.abs(ccFightWinOdds(mk(300), foe)-0.5)<0.001);
    check('сильнее сосед — выбить его труднее', ccFightWinOdds(mk(300), {_pc:100})<0.4 && ccFightWinOdds(mk(300), {_pc:80})>0.6);
    you=mk(300); you._game=game;
    let r=ccFightApply(you, 0.10, foe);
    check('победа: сосед выбит движком, +сила, +ресы', r==='win' && log.join()==='FOE<ME' && you._pf===90+CC_FIGHT.pow && you._mats===300+CC_FIGHT.mats, r+' '+log.join()+' '+you._pf+' '+you._mats);
    you=mk(300); you._game=game; log.length=0;
    r=ccFightApply(you, 0.20, foe);
    check('проигрыш: выбиты сами, соседом', r==='die' && log.join()==='ME<FOE' && you._pf===90-CC_FIGHT.diePow, r+' '+log.join());
    you=mk(300); you._game=game; log.length=0;
    r=ccFightApply(you, 0.35, foe);
    check('размен: щит снят, ресы сожжены, −сила, никто не выбит', r==='trade' && you._sq.shield===0 && you._sq.hp===100-CC_FIGHT.tradeHp && you._mats===300-CC_FIGHT.tradeMats && you._pf===90-CC_FIGHT.tradePow && log.length===0, r+' '+JSON.stringify(you._sq)+' '+you._mats);
    you=mk(300); you._game=game; log.length=0;
    r=ccFightApply(you, 0.60, foe);
    check('разошлись: урон в сёрдж, ресы на стройку, сила на месте, никто не выбит', r==='poke' && you._sq.dealt===CC_FIGHT.pokeDmg && you._mats===300-CC_FIGHT.pokeMats && you._pf===90 && you._sq.shield===100 && log.length===0, r+' '+JSON.stringify(you._sq)+' '+you._mats);
    you=mk(300); you._game=game; log.length=0;
    r=ccFightApply(you, 0.20, null);
    check('без соседа смерти нет — размен', r==='trade' && log.length===0, r);
    check('решающая доля стычек — как по реплеям, меньше трети; с разменом меньше единицы', CC_FIGHT.decide>0.2 && CC_FIGHT.decide<0.34 && CC_FIGHT.decide+CC_FIGHT.trade<1);
    // через меню целиком: бросок один
    you=mk(300); you._game=game; log.length=0; WANT='fight'; Math.random=()=>0.05;
    await ccAskMenu(you, null);
    check('меню: файт выигран через движок', log.join()==='FOE<ME', log.join());
    Math.random=r0;
    ccChoiceBox=realBox;
    // ---- остановки: пятая всегда, седьмая — когда есть о чём ---------------------
    const z5=CC_GAME_STOPS.find(s=>s.zone===5), z7=CC_GAME_STOPS.find(s=>s.zone===7);
    check('пятая зона спрашивает всегда', z5 && !z5.quiet);
    check('седьмая молчит при полном наборе', z7 && z7.quiet && z7.quiet(mk(550)) && !z7.quiet(mk(100)));
    // ---- словарь ---------------------------------------------------------------
    ['ru','en'].forEach(l=>{ LANG=l; CC_L_CACHE={}; const D=L();
      check(l+': строки меню', typeof D.ccMidTitle==='string' && D.ccMidSurgeNote(80,40,1).length>5 && D.ccMidFightNote(14,4,15,15,70).length>5 &&
            D.ccMidSurgeLine(76,60,-30).length>3 && D.ccMidSurgeLine(76,60,null).length>3 && D.ccMidFightPoke(70,40).length>3 &&
            D.ccMidFightWon(4,'x').length>3 && D.ccMidFightDied('x').length>3 && D.ccMidFightTraded(3).length>3); });
  }catch(e){ out.err=String(e && e.stack || e); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsmid-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);
const dom = execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
  '--virtual-time-budget=30000', '--dump-dom', 'file:///' + tmp.replace(/\\/g, '/')
], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/BEGIN([\s\S]*?)END/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
out.notes.forEach(n => console.log('  ' + n));
if (out.err) { console.error('ERROR: ' + out.err); process.exit(1); }
if (out.fails.length) { out.fails.forEach(f => console.error('FAILED: ' + f)); process.exit(1); }
console.log('the mid game is a menu with pictures, and a fight can end the game');
fs.rmSync(dir, { recursive: true, force: true });
