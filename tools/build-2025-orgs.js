// Reads player -> club out of a saved Liquipedia page and prints the literal
// index.html wants. Liquipedia renders the club a player was on at that event
// next to their name, so the pairing is per event rather than "whatever they
// play for now" — which is exactly the thing being fixed.
//
//   node tools/build-2025-orgs.js "~/Desktop/GLOBAL 2025/Fortnite Champion Series 2025 - Global Championship - Liquipedia Fortnite Wiki.html"
const fs = require('fs');
const out = {};
process.argv.slice(2).forEach(f => {
  const src = fs.readFileSync(f, 'utf8');
  // One <div class="block-player ..."> per player, holding the name and, when
  // they had one, the club's template part.
  const blocks = src.split(/<div class="block-player/).slice(1);
  blocks.forEach(b => {
    const stop = b.indexOf('<div class="block-player');
    const body = stop >= 0 ? b.slice(0, stop) : b;
    const nm = body.match(/<span class="name"[^>]*>([\s\S]*?)<\/span>/);
    if (!nm) return;
    const nick = nm[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    const club = (body.match(/data-highlighting-class="([^"]+)"/) || [])[1];
    if (!nick || !club || out[nick]) return;
    out[nick] = club;
  });
});
const keys = Object.keys(out).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1);
console.error('players with a club:', keys.length,
              '· distinct clubs:', new Set(Object.values(out)).size);
console.log('const ORG_2025={' + keys.map(k => JSON.stringify(k) + ':' + JSON.stringify(out[k])).join(',') + '};');
