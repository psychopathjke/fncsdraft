// Секрет места в лобби: место, занятое с секретом, без него не открывается; клиент без секрета работает как раньше.
// Нужен живой wrangler dev (по умолчанию ws://127.0.0.1:8787, иначе CC_HOST).
//   node server/tools/check-seat-key.js
const HOST = process.env.CC_HOST || 'ws://127.0.0.1:8787';
const code = 'K' + Math.random().toString(36).slice(2, 7).toUpperCase();
const fails = [];
const check = (n, ok, d) => { if (!ok) fails.push(n + (d ? ': ' + d : '')); };

// open | refused: успешное открытие сокета или отказ сервера.
function tryOpen(id, k) {
  return new Promise(res => {
    const url = HOST + '/lobby/' + code + '?id=' + encodeURIComponent(id) + '&build=test' + (k ? '&k=' + k : '');
    let ws; try { ws = new WebSocket(url); } catch (e) { return res({ st: 'refused' }); }
    const t = setTimeout(() => { try { ws.close(); } catch (e) {} res({ st: 'timeout' }); }, 8000);
    ws.onopen = () => { clearTimeout(t); res({ st: 'open', ws }); };
    ws.onerror = () => { clearTimeout(t); res({ st: 'refused' }); };
  });
}
const K1 = 'abcdefghijklmnop1234', K2 = 'zzzzzzzzzzzzzzzz9999';
(async () => {
  const a = await tryOpen('ownerA', K1);
  check('владелец с секретом входит', a.st === 'open', a.st);
  const b = await tryOpen('ownerA', '');
  check('тот же id без секрета не входит', b.st === 'refused', b.st);
  const c = await tryOpen('ownerA', K2);
  check('тот же id с чужим секретом не входит', c.st === 'refused', c.st);
  const d = await tryOpen('ownerA', K1);
  check('владелец переподключается своим секретом', d.st === 'open', d.st);
  const e = await tryOpen('oldB', '');
  const f = await tryOpen('oldB', '');
  check('старый клиент без секрета входит и переподключается', e.st === 'open' && f.st === 'open', e.st + '/' + f.st);
  [a, d, e, f].forEach(x => { try { x.ws && x.ws.close(); } catch (err) {} });
  // Выход после того, как сокеты закрылись: ранний process.exit роняет node на Windows (libuv).
  if (fails.length) fails.forEach(x => console.log(' FAIL ' + x));
  else console.log('секрет места: чужой с тем же id не входит, владелец и старые клиенты входят');
  setTimeout(() => process.exit(fails.length ? 1 : 0), 1500);
})();
