/* Service worker: второй заход открывается даже при мёртвой сети.
 *
 * ЗАЧЕМ. Жалобы «не могу зайти на сайт» приходят почти все из России, где
 * дорогу до Cloudflare режут на уровне провайдера. Сайт при этом живой: с
 * нашей стороны он отвечает за 0,13 с. То есть беда не в том, что страницы
 * нет, а в том, что до неё не всегда доезжают — и человеку, который вчера
 * играл, сегодня не открывается ничего.
 *
 * Здесь лечится ровно эта половина: кто пробился хотя бы раз, у того страница
 * и приложение лежат в кэше браузера и открываются без сети вовсе. Первый
 * заход воркер не ускоряет и ускорить не может — он ставится уже после него.
 *
 * ПРАВИЛА, и у каждого своя причина:
 *   документ    — сначала сеть, кэш запасным. Иначе новая сборка не доедет до
 *                 того, у кого уже стоит воркер: он вечно читал бы старую
 *                 оболочку. Сеть не ответила — отдаём последнюю, что видели.
 *   скрипты     — сначала кэш. Они запрашиваются с ?v=<хеш содержимого>
 *                 (см. tools/stamp-scripts.js и build-deploy), то есть новый
 *                 файл всегда приезжает по новому адресу, а старый можно
 *                 держать вечно и не спрашивать сеть вообще.
 *   арт и фото  — сначала кэш, и кэш общий на все сборки: адрес фотографии не
 *                 меняется от того, что мы поправили карьеру. Иначе каждая
 *                 сборка перекачивала бы 25 МБ портретов заново.
 *   maps.js     — сначала сеть: он грузится без ?v= (см. ccMapsReady), и
 *                 вечный кэш заморозил бы старые карты.
 *   чужое       — не трогаем вовсе: флаги с flagcdn и аватарки с Twitch идут
 *                 мимо воркера, у них своё кэширование и свои сбои.
 *
 * КАК ВЫКЛЮЧИТЬ, если что-то пойдёт не так: выложить на место этого файла
 * пустой воркер с `self.registration.unregister()` в install — он снимет себя
 * у всех, кто его получит. Документ идёт через сеть, поэтому вернуть сайт
 * в исходное состояние можно одной выкладкой.
 *
 * ВЕРСИЮ И СПИСОК СТАВИТ СБОРКА (tools/build-deploy.js): здесь стоят метки,
 * в собранной папке — хеш app.js и настоящие адреса. Файл в репозитории
 * специально нерабочий как воркер — его никто и не регистрирует с file://.
 */
const V = "30a37ff0";
const CORE = ["./","./zone-sim.js?v=318a3cb4","./zone-replay.js?v=bd107a55","./mp.js?v=3d67d192","./app.js?v=30a37ff0","./fonts/oswald-cyrillic-ext.woff2","./fonts/oswald-cyrillic.woff2","./fonts/oswald-latin-ext.woff2","./fonts/oswald-latin.woff2"];

const DOC = 'fncsdraft-doc-' + V;      // оболочка: одна на сборку
const APP = 'fncsdraft-app-' + V;      // скрипты с ?v=: одни на сборку
const MEDIA = 'fncsdraft-media';       // арт, фото, гербы, шрифты: общий кэш

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(APP);
    // По одному, а не addAll: одна неудача из тридцати не должна отменять
    // установку целиком — иначе воркер не встанет вовсе из-за одной картинки.
    await Promise.all(CORE.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([DOC, APP, MEDIA]);
    for (const name of await caches.keys())
      if (name.indexOf('fncsdraft-') === 0 && !keep.has(name)) await caches.delete(name);
    await self.clients.claim();
  })());
});

function isDoc(req) {
  return req.mode === 'navigate' ||
         (req.headers.get('accept') || '').indexOf('text/html') >= 0;
}
function isVersioned(url) {
  return url.search.indexOf('v=') >= 0;
}
function isMedia(url) {
  return /\.(?:jpg|jpeg|png|svg|webp|gif|ico|woff2?)$/i.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  if (isDoc(req)) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        // Кладём копию только удачного ответа: 404 или страница-заглушка
        // провайдера не должны стать тем, что мы покажем в следующий раз.
        if (res && res.ok) (await caches.open(DOC)).put(req, res.clone());
        return res;
      } catch (e) {
        const hit = await caches.match(req) || await caches.match('./');
        if (hit) return hit;
        throw e;
      }
    })());
    return;
  }

  if (isVersioned(url) || isMedia(url)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && res.ok)
        (await caches.open(isVersioned(url) ? APP : MEDIA)).put(req, res.clone());
      return res;
    })());
    return;
  }

  // Всё остальное — сначала сеть, кэш запасным (сюда попадает maps.js).
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) (await caches.open(MEDIA)).put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await caches.match(req);
      if (hit) return hit;
      throw e;
    }
  })());
});
