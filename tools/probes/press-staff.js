LANG='ru'; CC_L_CACHE={};
localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
  player:{nick:'Keegorka', age:18, source:'rookie', country:'de', countryPing:15, closeRangeEdge:0, region:'EU', ovr:84, role:'roleIGL',
    attrs:ccRookieAttrs(84,'roleIGL'), ageEdge:0, photo:null, handle:null, cardRegion:null, nat:null},
  career:{season:1, day:'2026-03-10', division:1, earnings:0, balance:0, reach:20000, form:0, grind:12, tokens:[], news:[], log:[]}, partner:null}));
careerLoad();
const o={};
const t=ccStaffThread({handle:'Dr Calm', staff:'psych', roster:false});
careerDmPush(t, 'them', 'ccDmPsyBad', ['Cup', 40, 100]);
o.ask=t.ask;
CH_TAB='social'; CH_SOCIAL='dms'; CH_DM=t.id; careerRenderHub('social');
o.btns=[...document.querySelectorAll('.dm-foot-staff button')].map(b=>b.textContent+(b.title?' ['+b.title+']':''));
const f0=CAREER.career.form, g0=CAREER.career.grind;
ccStaffReply(t.id, 'talk');
o.after={form:CAREER.career.form-f0, grind:CAREER.career.grind-g0, ask:t.ask};
o.thread=t.msgs.map(m=>m.from+': '+ccText(m));
careerDmPush(t, 'them', 'ccDmPsyBad', ['Cup', 40, 100]);
const f1=CAREER.career.form; ccStaffReply(t.id, 'talk'); o.second=CAREER.career.form-f1;
// Кинч и SMM
const k=ccStaffThread(CC_KINCH_WHO); careerDmPush(k, 'them', 'ccDmKinchVerdict', ['a','b','c',0]); o.kinchAsk=!!k.ask;
const s=ccStaffThread({handle:'Clipz', staff:'smm', roster:false}); careerDmPush(s, 'them', 'ccDmSmmGrow', [1,2]);
const r0=CAREER.career.reach; ccStaffReply(s.id, 'clip'); o.smmReach=CAREER.career.reach-r0;
o.pressUnit=ccPressReachUnit();
return o;
