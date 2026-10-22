// Журнал ошибок игроков (22.10). Баги приходили скриншотами — Notion, Telegram, X, — и половина «не воспроизвелась»:
// не было ни сборки, ни дня карьеры, ни режима. Теперь клиент сам присылает короткую запись о поломке, красной строке
// онлайна и несохранившемся сейве. Ни IP, ни id браузера здесь нет — только то, что ниже.
const KINDS = ['err', 'rej', 'split', 'save'];
const KEEP = 500;
const cut = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);

function normalize(e, now) {
  if (!e || typeof e !== 'object') return { err: 'json' };
  const kind = KINDS.indexOf(e.kind) >= 0 ? e.kind : null;
  if (!kind) return { err: 'kind' };
  const msg = cut(e.msg, 300);
  if (!msg) return { err: 'msg' };
  const build = /^[0-9a-f]{6,12}$/.test(String(e.build || '')) ? String(e.build) : '-';
  return { row: {
    kind, msg, build,
    src: cut(e.src, 200),
    ctx: cut(e.ctx, 400),
    ua: cut(e.ua, 80),
    at: now,
  } };
}
// Одна и та же поломка у сотни людей — одна строка со счётчиком, а не сотня.
function keyOf(r) { return r.kind + '|' + r.build + '|' + r.msg + '|' + r.src; }

module.exports = { normalize, keyOf, KINDS, KEEP };
