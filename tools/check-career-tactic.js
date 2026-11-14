// Тактика файта (ccAskTactic: пушить/бокс/отойти, лут и ресы двигают шанс) и третья сторона в середине (ccThirdPair).
//   node tools/check-career-tactic.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found');
const BOOT = `<pre id="__out" style="display:none"></pre><script>
window.addEventListener("load", function(){ setTimeout(async function(){
  const out={fails:[], errs:[], notes:{}}; window.addEventListener('error', e=>out.errs.push(String(e.message)));
  const check=(n, ok, d)=>{ if(!ok) out.fails.push(n+(d?': '+d:'')); };
  const tick=()=>new Promise(r=>setTimeout(r, 30));
  try{
    ACTIVE_LANDING_SET='s42'; CAREER_RUN=CAREER_RUN||{}; skipAnimation=false;
    let gone=[];
    const W=(cls, rar)=>({name:cls+' '+rar, icon:cls, rarity:rar});
    const H=n=>({name:'Shield Potion', rarity:'rare', n:n||3});
    const mk=(mine, theirs)=>{
      const you={name:'You', pow:90, _pf:90, _mats:900, _loot:Object.assign({weapons:[], heals:[], move:null}, mine||{})};
      const me={team:you, alive:true, x:20, y:20, shield:100, hp:100, dealt:0, taken:0};
      const foe={name:'Foe', pow:90, _pf:90, _mats:400, _loot:Object.assign({weapons:[], heals:[], move:null}, theirs||{})};
      const fs={team:foe, alive:true, x:24, y:20};
      // Пара дерётся рядом: A и B в 3 единицах друг от друга, в 15 от нас.
      const A={team:{name:'Alpha', pow:90, _pf:90}, alive:true, x:30, y:30}, B={team:{name:'Bravo', pow:90, _pf:90}, alive:true, x:32, y:31};
      const squads=[me, fs, A, B];
      you._sq=me;
      you._game={squads, frames:()=>[{circle:{cx:55, cy:55, radius:30}}], aliveCount:()=>4, nearest:()=>foe,
        eliminate:(a,b)=>{ gone.push((a.name||'?')+'>'+(b.name||'?')); squads.forEach(q=>{ if(q.team===a) q.alive=false; }); return true; }};
      return {you, foe, A, B}; };
    // 1. Пушить: дробовик epic против common даёт +2 ступени... epic 4, common 1 = 3 ступени.
    let w=mk({weapons:[W('shotgun','epic')]}, {weapons:[W('shotgun','common')]});
    let t=ccTacOf('push', w.you, w.foe);
    check('пушить: поправка за дробовик', Math.abs(t.dp-Math.min(CC_TAC_CAP, 3*CC_TAC_SG))<1e-9, String(t.dp));
    w=mk({weapons:[]}, {weapons:[W('shotgun','legendary')]});
    check('пушить без дробовика против легендарки: минус', ccTacOf('push', w.you, w.foe).dp<0);
    // 2. Бокс: ресы 900 против 400, хилок 2 против 0 -> плюс; списывает ресы.
    w=mk({heals:[H(), H(2)]}, {});
    t=ccTacOf('box', w.you, w.foe);
    check('бокс: поправка за ресы и хилки', t.dp>0 && t.dp<=CC_TAC_CAP, String(t.dp));
    const m0=w.you._mats; ccFightApply(w.you, 0.99, w.foe, null, t);
    check('бокс стоит ресов', w.you._mats===m0-CC_TAC_BOX_MATS-CC_FIGHT.pokeMats, String(w.you._mats));
    // 3. Отойти: бросок, который у пуша решает (0.2 < decide 0.29), у отхода уже не решает.
    gone=[]; w=mk(); const outBack=ccFightApply(w.you, 0.2, w.foe, null, ccTacOf('back', w.you, w.foe));
    check('отойти: стычка не решилась', outBack!=='win' && outBack!=='die' && !gone.length, outBack);
    gone=[]; w=mk(); const outPush=ccFightApply(w.you, 0.2, w.foe, null, ccTacOf('push', w.you, w.foe));
    check('пушить: тот же бросок решает', outPush==='win' || outPush==='die', outPush);
    // Без тактики числа как раньше.
    gone=[]; w=mk(); check('без тактики как было', ccFightApply(w.you, 0.1, w.foe)==='win');
    // 4. Вопрос тактики: три кнопки, бокс прячется без ресов, под пропуском вопроса нет.
    const host=document.createElement('div'); document.body.appendChild(host);
    w=mk({weapons:[W('shotgun','rare')]}, {weapons:[W('shotgun','common')]});
    let p=ccAskTactic(w.you, {map:host}, w.foe, CC_FIGHT); await tick();
    let bs=[...host.querySelectorAll('[data-at]')];
    check('тактика: три кнопки', bs.length===3, String(bs.length));
    check('тактика: первой пушить', bs[0] && bs[0].textContent.indexOf(L().tcPush)>=0);
    bs.find(b=>b.textContent.indexOf(L().tcBack)>=0).click();
    t=await p; check('выбор дошёл', t && t.id==='back', JSON.stringify(t));
    w.you._mats=100; p=ccAskTactic(w.you, {map:host}, w.foe, CC_FIGHT); await tick();
    bs=[...host.querySelectorAll('[data-at]')];
    check('без ресов бокса нет', bs.length===2, String(bs.length)); bs[0].click(); await p;
    skipAnimation=true; t=await ccAskTactic(w.you, {map:host}, w.foe, CC_FIGHT); skipAnimation=false;
    check('под пропуском тактики нет', t===null);
    // 5. Третья сторона: пара находится, исходы через движок.
    w=mk(); const pr=ccThirdPair(w.you);
    check('пара найдена', pr && [pr.a.team.name, pr.b.team.name].sort().join()==='Alpha,Bravo', pr && pr.a.team.name);
    const seq=v=>{ let i=0; return ()=>v[Math.min(i++, v.length-1)]; };
    // Их файт не решился (0.9), мы выбили цель (0.01) и второго (0.1).
    gone=[]; let res=ccThirdPairApply(w.you, pr, seq([0.9, 0.01, 0.1]));
    check('третьить: выбили обоих', res.out==='win' && res.both && gone.length===2, JSON.stringify(res)+' '+gone);
    // Их файт решился (0.1), A победил (0.1), мы выбиты (0.4 после kill<0.4<kill+die).
    w=mk(); const pr2=ccThirdPair(w.you); gone=[];
    const o2=ccThirdOdds(w.you, pr2.a.team);
    res=ccThirdPairApply(w.you, pr2, seq([0.1, 0.1, o2.kill+o2.die/2]));
    check('их файт кончился сам, потом выбиты мы', res.self && res.out==='die' && gone.length===2, JSON.stringify(res)+' '+gone);
    check('строка исхода собирается', typeof L().tpGot(res)==='string' && L().tpGot(res).length>5);
    // В меню середины третьить есть, когда рядом дерутся.
    w=mk(); p=ccAskMenu(w.you, {map:host}); await tick();
    bs=[...host.querySelectorAll('[data-at]')];
    check('в середине есть третьить', bs.some(b=>b.textContent.indexOf('Alpha')>=0 && b.textContent.indexOf('Bravo')>=0), bs.map(b=>b.textContent.slice(0,30)).join('|'));
    bs[0].click(); for(let i=0;i<10 && host.querySelector('button'); i++){ host.querySelector('button').click(); await tick(); } await p;
    ['ru','en','fr','it','pt'].forEach(lg=>['tcTitle','tcPush','tcBox','tcBack','tcNone','tcOdds','tcPushNote','tcBoxNote','tcBackNote','tpTitle','tpNote','tpGot','rpGo'].forEach(k=>check(lg+' '+k, I18N[lg][k]!=null)));
    // Без длинных тире в новых строках.
    ['ru','en'].forEach(lg=>{ const s=[I18N[lg].tcOdds(1,2,3), I18N[lg].tcBoxNote(1,2,3,4,5), I18N[lg].tpNote(1,2,3,4,5), I18N[lg].tcBackNote].join(' '); check(lg+' без длинного тире', s.indexOf('—')<0); });
  }catch(e){ out.fails.push('ERR '+(e && e.stack || e)); }
  document.getElementById('__out').textContent='BEGIN'+encodeURIComponent(JSON.stringify(out))+'END';
}, 800); });<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctac-')), tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">' + fs.readFileSync(process.env.INDEX || path.join(ROOT, 'index.html'), 'utf8').replace('</body>', BOOT + '</body>'));
let dom;
try {
  dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--user-data-dir=' + path.join(dir, 'prof'),
    '--virtual-time-budget=60000', '--dump-dom', 'file:///' + tmp.split(path.sep).join('/')], { maxBuffer: 1 << 30, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
const m = dom.match(/BEGIN([\w%\-.!~*'()]*)END/);
if (!m) { console.error('no output'); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
console.log(JSON.stringify(out.notes));
if (out.errs.length) out.fails.push('ошибки страницы: ' + out.errs.join(' | '));
if (out.fails.length) { out.fails.forEach(f => console.log('FAIL ' + f)); process.exit(1); }
console.log('OK тактика файта и третья сторона в середине');
