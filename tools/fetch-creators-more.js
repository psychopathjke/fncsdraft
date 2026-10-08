// Больше креаторов для Fortnite Manager (его слово 8.10: «и можно больше креаторов добавить список»).
// Кандидаты — известные Fortnite-креаторы по регионам (логин Twitch); публичный GraphQL Twitch подтверждает канал,
// даёт число фолловеров и аватарку (photos/creators/<login>.png). Кого Twitch не знает или у кого дефолтная картинка —
// отбрасываются. Печатает готовый const CC_CREATORS_MORE для index.html в tools/creators-more.txt.
//   node tools/fetch-creators-more.js
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'photos', 'creators');
const CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
const CAND = {
  EU: ['Vikkstar123','Mongraal','MrSavage','Benjyfishy','Wolfiez','elrubiusOMG','AuronPlay','Willyrex','Vegetta777','Gotaga','Michou','Inoxtag',
       'MontanaBlack88','Trymacs','Papaplatte','Rewinside','Unge','Pow3r','TheVic','Th0masHD','Kinstaar','Nayte','Tayson','Queasy','Malibuca','Veno','Pixie','Skite','Fastroki','Dukez'],
  NAC: ['Ninja','Tfue','SypherPK','NickEh30','Bugha','Clix','Myth','DrLupo','TimTheTatman','CouRageJD','Ceeday','Cizzorz','Daequan','LuluLuvely','Valkyrae','Agent00','Dakotaz','Symfuhny','Hamlinz','Zayt','Mero','Peterbot','Cooper','Reet','Khanada','Acorn','Bizzle','EpikWhale','Avery','Ajerss'],
  BR: ['Cerol','Coringa','Bak','Nobru','Fnzin','K1nG','Pullga','Tchubas','Mudaxx','Lyonz','Guim0','Lodz'],
  CIS: ['Buster','Bratishkinoff','Kiryache32','Toose','7ssk7','Putrick','Andilex','Mamanbaz'],
  ASIA: ['Muselk','Fresh','Lachlan','Crayator','BazzaGazza','Jacque','Ekon','Alex','Worthy','Peterpan','Looter','Paarthurnax']
};
const gql = body => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const req = https.request({ host: 'gql.twitch.tv', path: '/gql', method: 'POST',
    headers: { 'Client-Id': CLIENT, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, r => {
    let out = ''; r.on('data', c => out += c); r.on('end', () => { try { res(JSON.parse(out)); } catch (e) { rej(new Error(out.slice(0, 200))); } });
  }); req.on('error', rej); req.write(data); req.end();
});
const download = (url, file) => new Promise((res, rej) => https.get(url, r => {
  if (r.statusCode !== 200) { r.resume(); return rej(new Error(url + ' -> ' + r.statusCode)); }
  const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => { fs.writeFileSync(file, Buffer.concat(ch)); res(); });
}).on('error', rej));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const outMap = {};
  for (const [reg, list] of Object.entries(CAND)) {
    outMap[reg] = [];
    for (let i = 0; i < list.length; i += 20) {
      const part = list.slice(i, i + 20).map(x => x.toLowerCase());
      const q = '{ users(logins:' + JSON.stringify(part) + ') { login displayName profileImageURL(width:150) followers { totalCount } } }';
      const j = await gql({ query: q });
      for (const u of ((j.data || {}).users || [])) {
        if (!u || !u.login) continue;
        const f = (u.followers || {}).totalCount || 0;
        if (f < 20000 || !u.profileImageURL || /user-default-pictures/.test(u.profileImageURL)) continue;
        const file = u.login + '.png';
        try { if (!fs.existsSync(path.join(OUT, file))) await download(u.profileImageURL, path.join(OUT, file)); } catch (e) { continue; }
        outMap[reg].push([u.displayName || u.login, u.login, f, file]);
      }
      await new Promise(r => setTimeout(r, 400));
    }
    console.log(reg, outMap[reg].length + '/' + list.length);
  }
  const txt = 'const CC_CREATORS_MORE=' + JSON.stringify(outMap) + ';';
  fs.writeFileSync(path.join(__dirname, 'creators-more.txt'), txt);
  console.log('ok');
})();
