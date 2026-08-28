// Nobody real in the divisions below, one press to stop watching, and an inbox
// that can reach above you.
//
// Three rules that arrived off one screenshot of a Division 5 lobby.
//
// The lobby had names in it the player recognised — Firen, Nemo, Misha — and
// they were not real people: the ladder builds a handle out of two syllables
// and some of what it built was somebody's actual name, while the real ones
// were Division 1 cards. From outside that reads as exactly one thing, real
// players in Division 5, and it is the one thing the ladder is not.
//
//   node tools/check-career-ladder-names.js
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..').split(path.sep).join('/');
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
  const out = {fails: [], notes: {}, err: null};
  const check = (n, ok, d) => { if(!ok) out.fails.push(n + (d ? ': ' + d : '')); };
  const seed = (day, div, ovr) => {
    localStorage.setItem('fncsdraft_career', JSON.stringify({
      v:1,
      player:{nick:'Probe', age:17, source:'rookie', country:'de', countryPing:15,
              closeRangeEdge:0, region:'EU', ovr:ovr||54, role:'roleIGL',
              attrs:ccRookieAttrs(ovr||54,'roleIGL'), ageEdge:0, photo:null,
              handle:null, cardRegion:null, nat:null},
      career:{season:1, day:day, division:div, earnings:0, balance:0, reach:0,
              tokens:[], log:[], news:[], dms:[]},
      partner:null
    }));
    careerLoad();
    (()=>{ if(careerPartnerCard()) return; careerSeatTopUp(); const s=careerDms().find(x=>x.state==='offer'&&!x.who.org&&!x.who.brand); if(s) careerDmAccept(s.id); })();
    return [careerCard(), careerPartnerCard()];
  };
  try {
    const days = careerYearDays();
    let cupDay = null;
    for (let d = CC_YEAR_FROM; d <= CC_YEAR_TO && !cupDay; d = ccAddDays(d, 1))
      if ((days.get(d)||[]).some(e => e.kind === 'cup')) cupDay = d;

    // ---- the ladder cannot wear somebody's name --------------------------
    const real = new Set();
    careerRosterEU().forEach(p => real.add(String(p.handle||'').toLowerCase()));
    out.notes.rosterNames = real.size;
    const clash = {};
    [5,4,3,2].forEach(div => {
      const mine = seed(cupDay, div);
      const f = careerCupField(CAREER.career, mine, careerCupSize(div));
      const hits = [];
      f.forEach(t => (t.squad||[]).forEach(p => {
        if (p.tier === 'ladder' && real.has(String(p.handle).toLowerCase()))
          hits.push(p.handle);
      }));
      clash['div'+div] = {teams: f.length, wearingARealName: hits.length,
                          sample: hits.slice(0, 3)};
    });
    out.notes.clash = clash;
    Object.keys(clash).forEach(k =>
      check('nobody generated in ' + k + ' wears a real name',
            clash[k].wearingARealName === 0, JSON.stringify(clash[k])));

    // And the divisions below hold no real cards at all, which was already so.
    const mine5 = seed(cupDay, 5);
    const f5 = careerCupField(CAREER.career, mine5, careerCupSize(5));
    const cards5 = f5.reduce((n,t) => n + (t.squad||[])
      .filter(p => p.tier === 'cardmode').length, 0);
    out.notes.div5RealCards = cards5;
    check('Division 5 seats no real cards', cards5 === 0, String(cards5));

    /* Division 1 is the other half of the same rule: all real, none generated.

       His words, 17 August: Division 1 is all the name players we have. It was
       the Major Play-In's recorded pairs and nothing else - 152 duos - while the
       year holds 728 recorded European pairs across the other Major, the Reload
       circuit and the qualifiers. It is every one of them at Division 1's band
       now, 206 duos, and every pair in it is still a pair that really played.

       Counted by what is generated rather than by what carries the 'cardmode'
       tag: a real player whose card came out of a qualifier is tagged
       'qualifier', and the rule was never about the tag, it is that nobody here
       is invented. */
    const mine1 = seed(cupDay, 1);
    const f1 = careerCupField(CAREER.career, mine1, careerCupSize(1));
    const people1 = f1.reduce((n,t) => n + (t.squad||[]).length, 0);
    const made1 = f1.reduce((n,t) => n + (t.squad||[])
      .filter(p => p.tier === 'ladder').length, 0);
    out.notes.div1 = {people: people1, generated: made1,
                      poolDuos: careerPools().duos.length};
    check('Division 1 seats nobody generated', made1 === 0, made1 + ' of ' + people1);
    /* И это состав дивизиона, а не срез по рейтингу: Плей-Ин, Ласт Ченс и
       финалы недели дивизиона 1. Пары из опенов Reload отсюда ушли — опен не
       квалифицирует в дивизион. */
    check('and it is everybody who qualified into the division',
          people1 > 300, String(people1));

    // ---- and the top of an open belongs to the real names ------------------
    // An open takes the whole ladder, so it is the one room where invented
    // players and the real scene stand in the same standings. The ladder used to
    // be drawn a flat fifth per division, which put a couple of hundred made-up
    // duos at Division 1's own band; they finished top ten and the screen read
    // "who are these and why are they at the top".
    const mineO = seed(cupDay, 4);
    const fO = careerCupField(CAREER.career, mineO, 2100, null, true);
    const men = [];
    fO.forEach(t => (t.squad||[]).forEach(p => men.push(p)));
    const gen = men.filter(p => p.tier === 'ladder');
    const realIn = men.filter(p => p.tier === 'cardmode');
    const ovrOf = p => attrsFor(p).ovr;
    const bestGen = gen.reduce((b,p) => Math.max(b, ovrOf(p)), 0);
    out.notes.open = {teams: fO.length, people: men.length,
                      real: realIn.length, generated: gen.length, bestGenerated: bestGen};
    check('an open seats the whole real snapshot', realIn.length >= 290, String(realIn.length));
    check('and nothing generated stands at Division 1 rating',
          bestGen < CC_DIV_RATING[1], bestGen + ' vs ' + CC_DIV_RATING[1]);
    // The shape of the room: Division 5 is half of the ladder and Division 2 a
    // fourteenth of it, off CC_CUP_ENTRANTS, not a flat fifth each.
    const atBand = d => gen.filter(p => Math.abs(ovrOf(p) - CC_DIV_RATING[d]) <= 2).length;
    const share = d => atBand(d) / Math.max(1, gen.length);
    out.notes.openShape = {d2: +share(2).toFixed(3), d5: +share(5).toFixed(3)};
    check('the ladder in an open is shaped like the ladder', share(5) > share(2) * 3,
          JSON.stringify(out.notes.openShape));
    // The one that answers the screenshot: sort the room by rating and the top of
    // it is the people the scene is made of.
    const top = men.slice().sort((a,b) => ovrOf(b) - ovrOf(a)).slice(0, 40);
    const genInTop = top.filter(p => p.tier === 'ladder');
    out.notes.openTop40Generated = genInTop.length;
    check('the strongest forty in an open are all real',
          genInTop.length === 0, genInTop.slice(0,3).map(p => p.handle).join(', '));

    // ---- one press stops the watching for the whole event ----------------
    CAREER_RUN = true;
    CC_SKIP_RUN = false;
    ensureSkipButton();
    const btn = document.getElementById('majorSkipBtn');
    btn.onclick();
    out.notes.skip = {pressed: skipAnimation, sticky: CC_SKIP_RUN,
                      label: btn.textContent};
    check('pressing skip in a career run sticks', CC_SKIP_RUN === true);
    beginAnimatedStage();
    check('so the next stage of the same event does not animate again',
          skipAnimation === true);
    // A draft run keeps the old behaviour on purpose: skip a slow Play-In and
    // still watch the Finals.
    CAREER_RUN = false; CC_SKIP_RUN = false;
    removeSkipButton(); ensureSkipButton();
    document.getElementById('majorSkipBtn').onclick();
    check('a draft run still skips one stage at a time', CC_SKIP_RUN === false);
    beginAnimatedStage();
    check('and animates the next one', skipAnimation === false);
    removeSkipButton();

    // ---- the confirm bar is the button, at the bottom of the window ------
    const host = document.createElement('div');
    host.innerHTML = '<button id="gameLandingConfirm" disabled></button>';
    document.body.appendChild(host);
    ensureLandingPrompt(host);
    const bar = document.getElementById('landingPromptBtn');
    out.notes.bar = !!bar && bar.className;
    check('a pick puts a confirm bar on the screen', !!bar);
    check('and it starts disabled, because nothing is chosen yet',
          bar.querySelector('#landingBarGo').disabled === true);
    landingPromptReady('a free zone');
    check('choosing a zone arms it',
          bar.querySelector('#landingBarGo').disabled === false);
    let clicked = 0;
    host.querySelector('#gameLandingConfirm').disabled = false;
    host.querySelector('#gameLandingConfirm').onclick = () => clicked++;
    bar.querySelector('#landingBarGo').click();
    check('and pressing the bar is pressing the confirm', clicked === 1, String(clicked));
    removeLandingPrompt(); host.remove();
    check('and it is gone once the pick is made', !document.getElementById('landingPromptBtn'));

    // ---- somebody above you can write first ------------------------------
    // The inbox used to ask only people who would have said yes, so it could
    // never offer anything the player could not already get by writing first.
    const mine = seed(cupDay, 3, 70);
    const pool = careerDmPool();
    const higher = pool.filter(w => w.ovr > CAREER.player.ovr && !careerDmWouldAccept(w));
    out.notes.higher = {inPool: higher.length,
                        sample: higher.slice(0, 2).map(w => w.handle + ' ' + w.ovr)};
    check('there are people above you who would refuse a cold message',
          higher.length > 0, String(higher.length));
    // Win a lobby and see whether one of them turns up over a run of nights.
    let wrote = null;
    for (let d = 1; d <= 20 && !wrote; d++) {
      seed(cupDay, 3, 70);
      CAREER.career.day = ccAddDays(cupDay, d);
      careerDmInbound(1, 150, true, 3);
      const t = careerDms().find(x =>
        (x.msgs||[]).some(m => String(m.k||'').indexOf('dmReachUp') === 0));
      if (t) wrote = {who: t.who.handle, ovr: t.who.ovr, state: t.state};
    }
    out.notes.reachUp = wrote;
    check('winning brings somebody above you into the inbox', !!wrote,
          'twenty winning nights and nobody wrote');
    check('and their message is an offer, not a conversation to be refused',
          !!wrote && wrote.state === 'offer', wrote && wrote.state);
    check('they really are above the player',
          !!wrote && wrote.ovr > 70, wrote && String(wrote.ovr));
    // An ordinary mid-table night brings nobody down from above.
    seed(cupDay, 3, 70);
    careerDmInbound(90, 150, false, 3);
    const quiet = careerDms().some(x =>
      (x.msgs||[]).some(m => String(m.k||'').indexOf('dmReachUp') === 0));
    check('a mid-table night brings nobody', quiet === false);
  } catch(e) { out.err = String(e && e.stack || e); }
  document.getElementById('__out').textContent =
    'PB' + 'EGIN' + encodeURIComponent(JSON.stringify(out)) + 'PE' + 'ND';
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fncsname-'));
const tmp = path.join(dir, 'index.html');
fs.writeFileSync(tmp, '<base href="file:///' + ROOT + '/">' + src + BOOT);
const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--virtual-time-budget=600000', '--dump-dom',
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8' });
const m = dom.match(/PBEGIN([\s\S]*?)PEND/);
if (!m) { console.error('probe did not run; copy at ' + tmp); process.exit(2); }
const out = JSON.parse(decodeURIComponent(m[1]));
if (out.err) { console.error(out.err); process.exit(1); }
console.log(JSON.stringify(out.notes, null, 1));
if (out.fails.length) { out.fails.forEach(f => console.error('FAIL ' + f)); process.exit(1); }
console.log('the ladder wears its own names, one press stops the watching, and the inbox reaches up');
fs.rmSync(dir, { recursive: true, force: true });
