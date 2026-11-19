// Механики турниров (19.11): нок с поднятием, сифон по эпохе, маршрут автобуса решает, кто сел первым.
//   node tools/check-tourney-mechanics.js
'use strict';

const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ZoneSim = require('../zone-sim.js');
const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const fails = [];
const check = (n, ok, d) => { if (!ok) fails.push(n + (d ? ': ' + d : '')); };

// --- движок ---------------------------------------------------------------
const sf = d => JSON.stringify(ZoneSim.phasesFor(d, 2).siphon);
check('2019: 50 сразу, в щит', sf('2019-06-01') === JSON.stringify({hp:50, sh:true, hot:0}), sf('2019-06-01'));
check('2022: 50 сразу', sf('2022-11-01') === JSON.stringify({hp:50, sh:true, hot:0}));
check('с 22.05.2023 нет', sf('2023-05-22') === 'null' && sf('2024-09-23') === 'null');
check('пробы: 15.10.2024 — 75 за время без щита', ZoneSim.phasesFor('2024-10-16', 2).siphon.hot === 7);
check('пробы: 29.10.2024 — 25+25', ZoneSim.phasesFor('2024-11-10', 2).siphon.split === 25);
check('2026: 75 за 5 с без щита', sf('2026-02-02') === JSON.stringify({hp:75, sh:false, hot:5}), sf('2026-02-02'));
check('Reload без сифона', !ZoneSim.RELOAD_PHASES.siphon);

const src = fs.readFileSync(path.join(__dirname, 'zone-sim-test.js'), 'utf8');
const LAND = eval(src.match(/const LAND = (\[[\s\S]*?\n\];)/)[1].replace(/;$/, ''));
function field(n){
  const T = [];
  for (let i = 0; i < n; i++) {
    const q = 1 - i / (n - 1), a = 25 + q * 70;
    T.push({name: 'F' + i, pow: 83 + q * 21, squad: [{handle: 'A' + i}, {handle: 'B' + i}], attrs: {END: a, SUR: a, AIM: a, CLU: a}});
  }
  return T;
}
function play(day, games){
  let rev = 0, hp = 0, hpN = 0;
  for (let g = 0; g < games; g++) {
    const rng = ZoneSim.createRng(7 + g), T = field(50);
    const picks = T.map(() => LAND[Math.floor(rng() * LAND.length)]);
    const res = ZoneSim.simulateZoneGame(T, {
      rng, land: LAND, aspect: 970 / 1100, record: true, phases: ZoneSim.phasesFor(day, 2),
      startOf: t => { const p = picks[T.indexOf(t)]; return {x: p.x + p.w / 2, y: p.y + p.h / 2}; },
      duel: (a, b) => { const wa = Math.pow(a.pow, 7), wb = Math.pow(b.pow, 7); return rng() * (wa + wb) < wa ? a : b; }
    });
    res.timeline.forEach(f => {
      (f.events || []).forEach(e => { if (e.indexOf('revive:') === 0) rev++; });
      (f.squads || f.dots || []).forEach(d => { if (d && d.mh) d.mh.forEach(v => { if (v > 0) { hp += v; hpN++; } }); });
    });
  }
  return {rev: rev / games, hp: hpN ? hp / hpN : 0};
}
const now = play('2026-02-02', 60), none = play('2023-08-01', 60);
check('поднятые есть в ленте', now.rev > 1, now.rev.toFixed(2));
check('сифон держит здоровье выше', !none.hp || !now.hp || now.hp > none.hp, now.hp.toFixed(1) + ' против ' + none.hp.toFixed(1));

// --- приложение -------------------------------------------------------------
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
  try{
    // Маршрут одинаков на одну игру и разный у разных игр.
    const r1=ccBusRoute(0), r1b=ccBusRoute(0), r2=ccBusRoute(1);
    check('маршрут повторяется', JSON.stringify(r1)===JSON.stringify(r1b));
    check('у игр разные маршруты', JSON.stringify(r1)!==JSON.stringify(r2));
    // Линия лута (ccBus) — тот же маршрут.
    CC_BUS_G=0; CC_BUS=null;
    const b=ccBus();
    check('линия лута = маршрут пролёта', b && Math.abs(b.dx-r1.dx)<1e-9 && Math.abs(b.dy-r1.dy)<1e-9 && Math.abs(b.px-r1.cx)<1e-9, JSON.stringify(b));
    // Под маршрутом садятся раньше, чем вдали от него.
    const mid={x:(r1.ax+r1.bx)/2, y:(r1.ay+r1.by)/2}, far={x:mid.x-r1.dy*30, y:mid.y+r1.dx*30};
    const tNear=ccBusLand(mid.x, mid.y, r1, 1), tFar=ccBusLand(far.x, far.y, r1, 1);
    out.notes.land={near:+tNear.toFixed(1), far:+tFar.toFixed(1)};
    check('дальняя точка садится позже', tFar>tNear+10, tNear+' / '+tFar);
    // Стычка на высадке: при равной силе севший раньше выигрывает чаще.
    const A={_pc:90, _land:0}, B={_pc:90, _land:20}, A2={_pc:90, _land:null}, B2={_pc:90, _land:null};
    let w=0, w0=0; const N=6000;
    for(let i=0;i<N;i++){ if(resolveDropDuel(A, B)===A) w++; if(resolveDropDuel(A2, B2)===A2) w0++; }
    out.notes.drop={first:+(w/N).toFixed(3), none:+(w0/N).toFixed(3)};
    check('севший раньше выигрывает ~60%', w/N>0.56 && w/N<0.64, w/N);
    check('без автобуса — поровну', w0/N>0.46 && w0/N<0.54, w0/N);
    // Строки.
    ['ru','en','fr','it','pt'].forEach(l=>{ const T=I18N[l]; check('строки '+l, T && typeof T.busEarly==='function' && typeof T.busLate==='function' && T.tpSiphon); });
    // Третья сторона в эпоху сифона: прийти на готовое труднее.
    CC_GAME_PHASES={siphon:{hp:75, sh:false, hot:5}};
    check('сила сифона по эпохе', ccSiphonTp({hp:50, sh:true, hot:0})<ccSiphonTp({hp:25, sh:true, hot:0}) && ccSiphonTp(null)===1);
    const team=n=>({name:n, pow:90, _pc:90, _pf:90, squad:[{handle:n}], attrs:{AIM:80,CLU:80,END:80,SUR:80}});
    const you=team('Y'), killed=[];
    you._game={eliminate:(l,w)=>killed.push(l.name)};
    const seq=[0, 0.99, 0.99, 0.99]; let si=0;
    const res=ccThirdPairApply(you, {a:{team:team('P')}, b:{team:team('Q')}}, ()=>seq[Math.min(si++, seq.length-1)]);
    check('сифон помечен на третьей стороне', res.siphon===true, JSON.stringify(res));
    CC_GAME_PHASES={siphon:null}; si=0;
    const res2=ccThirdPairApply(you, {a:{team:team('P')}, b:{team:team('Q')}}, ()=>seq[Math.min(si++, seq.length-1)]);
    check('без сифона — без пометки', !res2.siphon);
  }catch(e){ out.err=String(e&&e.stack||e); }
  document.getElementById('__out').textContent='PB'+'EGIN'+encodeURIComponent(JSON.stringify(out))+'PE'+'ND';
})();
<\/script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tourney-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\w%\-.!~*'()]*)PEND/);
if (!m) { console.error('проба не отработала; копия в ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) fails.push(out.err);
out.fails.forEach(f => fails.push(f));
console.log(JSON.stringify({engine: {now, none}, app: out.notes}));
fs.rmSync(dir, { recursive: true, force: true });
if (fails.length) { fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('нок с поднятием, сифон по эпохе и автобус работают');
