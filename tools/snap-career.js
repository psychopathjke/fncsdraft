// Screenshots a career screen as a player sees it, with a career already in
// progress so the hub has something to draw.
//
// The page is copied to a temp directory to have a probe appended, which breaks
// every relative path in it — art/, photos/, logos/. A <base> pointing back at
// the project fixes that, and without it the covers, the event panel and the
// card art all come out black, which looks exactly like a styling bug and is
// not one.
//
// Run: node tools/snap-career.js [out.png] [centre|calendar|card|log|create] [YYYY-MM]
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(os.tmpdir(), 'career.png');
const TAB = process.argv[3] || 'centre';
const MONTH = process.argv[4] || '';
const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('Chrome not found — set the CHROME environment variable to chrome.exe');

const BOOT = `
<script>
(function(){
  var tab = ${JSON.stringify(TAB)}, month = ${JSON.stringify(MONTH)};
  if (tab === 'create') {
    localStorage.removeItem('fncsdraft_career');
    openCareerCreate();
    ccPickCountry('rs');
    document.getElementById('ccNick').value = 'Keegorka';
    ccSync();
    return;
  }
  localStorage.setItem('fncsdraft_career', JSON.stringify({v:1,
    player:{nick:'Keegorka',age:16,source:'rookie',country:'rs',countryPing:26,closeRangeEdge:6,
            region:'EU',ovr:57,ovrExact:57.4,potential:86,role:'roleIGL',
            attrs:null,ageEdge:4,photo:null,handle:null,cardRegion:null,nat:null},
    career:{season:1,day:'2026-02-16',division:4,earnings:0,tokens:[],log:[
      {season:1,week:1,div:5,place:11,of:150,pts:604,passed:true,ovr:55,
       games:11,wins:1,elims:47,avg:14.2,mate:'Krymo',prize:0},
      {season:1,week:2,div:4,place:63,of:150,pts:388,passed:false,ovr:56,
       games:11,wins:0,elims:31,avg:22.7,mate:'Rimo',prize:0},
      {season:1,week:3,div:4,place:3,of:150,pts:702,passed:true,ovr:57,
       games:11,wins:2,elims:58,avg:9.4,mate:'Rimo',prize:0}],
      // Keys and their numbers, the way a career actually writes them. Seeded as
      // finished sentences it read as a feed where every post came from one
      // account, because the author is derived from the key and there was none —
      // which is a screenshot that lies about the screen.
      news:[
        {season:1,day:'2026-02-10',kind:'bad',k:'ccNewsPartnerCross',a:['Rimo']},
        {season:1,day:'2026-02-10',kind:'flat',k:'ccNewsWinner',a:['Solvar & Glofer52']},
        {season:1,day:'2026-02-10',kind:'good',k:'ccNewsRating',a:[56,57]},
        {season:1,day:'2026-02-09',kind:'flat',k:'ccNewsResult',a:[63,150,4,388]},
        {season:1,day:'2026-02-03',kind:'good',k:'ccNewsPromoted',a:[4]}]},
    partner:{card:{handle:'Rimo',nat:'Germany',region:'EU',org:null,tier:'ladder',
      event:'ladder',date:'\\u2014',placement:null,
      rating:59,_targetOvr:59,_attrs:null}, patience:38}}));
  var s = JSON.parse(localStorage.getItem('fncsdraft_career'));
  // Club state, so the three faces of the contract tile can each be looked at:
  // free agent, offers on the table, signed.
  var club = ${JSON.stringify(process.argv[5] || '')};
  if (club) {
    s.player.ovr = 79; s.player.ovrExact = 79.2; s.career.division = 2;
    s.player.attrs = null;
  }
  s.player.attrs = s.player.attrs || ccRookieAttrs(s.player.ovr,'roleIGL');
  s.partner.card._attrs = ccRookieAttrs(59,'roleFRG');
  localStorage.setItem('fncsdraft_career', JSON.stringify(s));
  careerEntry();
  if (club === 'offers') { CAREER.offers = careerOrgOffers(); careerSave(); careerRenderHub('centre'); }
  if (club === 'signed') { CAREER.offers = careerOrgOffers(); careerSign(0); CAREER.org.paid = 1200; careerSave(); careerRenderHub('centre'); }
  if (club === 'dm') { careerDmInbound(3,150,true,3); var w=careerDmPool()[1]; if(w) careerDmWrite(w.handle); }
  if (tab !== 'centre') careerTab(tab);
  if (month) {
    var p = month.split('-');
    CH_MONTH = {y: +p[0], m: +p[1] - 1};
    careerRenderHub('calendar');
  }
})();
<\/script>`;

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapcareer-'));
const tmp = path.join(dir, 'index.html');
const BASE = '<base href="file:///' + ROOT.split(path.sep).join('/') + '/">';
fs.writeFileSync(tmp, BASE + src + BOOT);

// A shot is cropped to the window, so anything below the fold is simply absent
// — which reads as "the panel is not there" rather than "the panel is further
// down". SNAP_H raises the window when what is being looked at is the bottom of
// a screen.
const SNAP_H = Number(process.env.SNAP_H) || 1250;
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--allow-file-access-from-files', '--virtual-time-budget=20000',
  '--window-size=1440,' + SNAP_H, '--screenshot=' + OUT,
  'file:///' + tmp.replace(/\\/g, '/')], { maxBuffer: 512 * 1024 * 1024, encoding: 'utf8', stdio: 'pipe' });
console.log('wrote ' + OUT);
fs.rmSync(dir, { recursive: true, force: true });
