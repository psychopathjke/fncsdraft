// Plays a recorded zone timeline over the Major's map. Knows nothing about the
// simulation: it is handed frames and draws them.
(function(root){
  'use strict';

  function el(tag, cls, css){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(css) e.style.cssText = css;
    return e;
  }

  var ZOOM_MAX = 8;

  // Wheel to zoom on the point under the cursor, drag to pan, double-click to
  // put it back. The pan is clamped so the edge of the island can never be
  // dragged into the middle of the frame — at any zoom the box stays full of
  // map, which is what stops a zoomed replay from getting lost.
  function addZoom(wrap, stage){
    var scale = 1, tx = 0, ty = 0, dragging = false, lastX = 0, lastY = 0, moved = false;

    function apply(){
      stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      wrap.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
    }
    function clampPan(){
      var w = wrap.clientWidth, h = wrap.clientHeight;
      tx = Math.min(0, Math.max(w - w * scale, tx));
      ty = Math.min(0, Math.max(h - h * scale, ty));
    }
    function zoomAt(px, py, factor){
      var next = Math.min(ZOOM_MAX, Math.max(1, scale * factor));
      if(next === scale) return;
      // Hold whatever is under the pointer still while the rest grows past it.
      tx = px - (px - tx) * (next / scale);
      ty = py - (py - ty) * (next / scale);
      scale = next;
      if(scale === 1){ tx = 0; ty = 0; }
      clampPan(); apply();
    }

    wrap.addEventListener('wheel', function(e){
      e.preventDefault();
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016));
    }, {passive:false});

    wrap.addEventListener('pointerdown', function(e){
      if(scale === 1) return;
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
      apply();
    });
    wrap.addEventListener('pointermove', function(e){
      if(!dragging) return;
      tx += e.clientX - lastX; ty += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved = true;
      clampPan(); apply();
    });
    function release(e){
      if(!dragging) return;
      dragging = false;
      if(e.pointerId != null && wrap.hasPointerCapture(e.pointerId)) wrap.releasePointerCapture(e.pointerId);
      apply();
    }
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);

    wrap.addEventListener('dblclick', function(e){
      e.preventDefault();
      if(scale > 1){ scale = 1; tx = 0; ty = 0; apply(); return; }
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, 3);
    });
    // A single click at rest is a zoom in, the way a map behaves; a click that
    // ended a drag is not.
    wrap.addEventListener('click', function(e){
      if(moved || e.detail > 1) return;
      if(scale > 1) return;
      var r = wrap.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, 2.2);
    });

    apply();
  }

  function mount(container, mapSrc, aspectCss, aspect, opts){
    opts = opts || {};
    var wrap = el('div', 'zone-replay',
      'position:relative;width:100%;max-width:520px;margin:8px auto 0;aspect-ratio:' + aspectCss + ';' +
      'border-radius:10px;overflow:hidden;border:1px solid var(--lb-line);');

    // The map and the drawing on it move together, so they share one transform
    // and the header, the roster and the kill feed sit outside it — those are
    // read, not inspected, and they should not slide off when the map does.
    var stage = el('div', null,
      'position:absolute;inset:0;transform-origin:0 0;will-change:transform;');
    wrap.appendChild(stage);

    var img = el('img', null,
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(.85) brightness(.7);');
    img.src = mapSrc;
    stage.appendChild(img);

    // The viewBox is the map's own shape, not a square, so the frames' world
    // units map to the screen with one scale on both axes. A square viewBox
    // stretched into a rectangular box turns every circle into an ellipse and
    // shears anything rotated — which markers are.
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var vbH = 100 * (aspect || 1);
    svg.setAttribute('viewBox', '0 0 100 ' + vbH.toFixed(3));
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.dataset.vbh = vbH;
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    stage.appendChild(svg);

    var head = el('div', null,
      'position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;' +
      'align-items:center;padding:5px 7px;font-size:11px;font-weight:800;color:#fff;' +
      'letter-spacing:.04em;background:linear-gradient(180deg,rgba(0,0,0,.72),rgba(0,0,0,0));');
    wrap.appendChild(head);

    // The roster of who is left, beside the map rather than on it. Nine names
    // printed over a zone-9 circle land on top of each other and read as a
    // smudge — the endgame is exactly when the circle is smallest and the
    // labels are most wanted, so they cannot live on the map. A colour swatch
    // ties each line back to its dot.
    var side = el('div', null,
      'position:absolute;right:6px;top:26px;display:none;flex-direction:column;gap:2px;' +
      'font-size:9.5px;font-weight:700;line-height:1.25;color:#eef2fb;text-shadow:0 1px 2px #000;' +
      'pointer-events:none;max-width:44%;text-align:right;');
    wrap.appendChild(side);

    var feed = el('div', null,
      'position:absolute;left:7px;bottom:6px;display:flex;flex-direction:column;' +
      'align-items:flex-start;gap:3px;pointer-events:none;');
    wrap.appendChild(feed);

    // Zooming in on the map, for when the circle is a coin and nine squads are
    // standing in it. Off unless the caller asks: taking the wheel away from a
    // page whose replay is one card among many is worse than not zooming.
    if(opts.zoom) addZoom(wrap, stage);

    container.appendChild(wrap);
    return {wrap:wrap, svg:svg, head:head, side:side, feed:feed, lines:[]};
  }

  // Stroke widths are in screen pixels — non-scaling-stroke makes them so — and
  // they were being given user units. 0.45 of a pixel is not a line, which is
  // why the safe zone was all but invisible however big the circle was.
  function circle(cx, cy, r, stroke, widthPx, dash, fill){
    var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('fill', fill || 'none');
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', widthPx);
    c.setAttribute('vector-effect', 'non-scaling-stroke');
    if(dash) c.setAttribute('stroke-dasharray', dash);
    return c;
  }

  // The rectangle with the safe circle punched out of it, by the even-odd rule.
  // One path, so there is no mask to keep in step and nothing to clip.
  function outsideCircle(vbW, vbH, cx, cy, r){
    return 'M0 0 H' + vbW + ' V' + vbH + ' H0 Z ' +
           'M' + (cx - r) + ' ' + cy +
           ' a' + r + ' ' + r + ' 0 1 0 ' + (r*2) + ' 0' +
           ' a' + r + ' ' + r + ' 0 1 0 ' + (-r*2) + ' 0 Z';
  }

  // The storm, as the game draws it: everything outside the safe circle washed
  // purple, everything inside left alone — and a magenta rim burning along the
  // edge, fading outward.
  //
  // The rim is the whole point. The real map has no line on the safe zone; what
  // marks it is the wall itself, glowing on the storm side. Without it this
  // rendering had a hard flat step from island to purple that read as a fill
  // boundary rather than as something you die in, which is why every attempt to
  // make the edge visible ended up drawing a ring on top of it instead.
  //
  // It is a radial gradient rather than a blur filter or a stack of strokes.
  // A filter is recomputed every frame over a full-page SVG; stacked strokes
  // were the first attempt and they failed for a better reason — a stroke is
  // measured in screen pixels, so the band stayed the same handful of pixels
  // wide however big the circle was, and the alphas piled up into exactly the
  // hard pink ring this is meant to replace. The gradient is measured in the
  // map's own units, so the glow is proportional to the circle: wide and soft
  // around the first one, tight around the last.
  var seq = 0;
  function stormFill(vbW, vbH, cx, cy, r){
    var d = outsideCircle(vbW, vbH, cx, cy, r);
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill-rule', 'evenodd');
    p.setAttribute('fill', 'rgba(150,54,214,.44)');
    g.appendChild(p);

    // How far the burn reaches past the wall, in map units. Proportional, with
    // a floor so the endgame circles keep an edge at all and a ceiling so the
    // opening one does not wash half the island.
    var gw = Math.max(0.55, Math.min(r * 0.09, 2.4));
    var R = r + gw, inner = r / R;
    var id = 'zr-rim-' + (++seq);

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    grad.setAttribute('id', id);
    grad.setAttribute('gradientUnits', 'objectBoundingBox');
    [[0, 'rgba(255,86,214,0)'],
     [inner * 0.995, 'rgba(255,86,214,0)'],
     [inner, 'rgba(255,150,240,.6)'],
     [inner + (1 - inner) * 0.35, 'rgba(255,86,214,.3)'],
     [1, 'rgba(214,60,200,0)']].forEach(function(s){
      var st = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      st.setAttribute('offset', s[0]);
      st.setAttribute('stop-color', s[1]);
      grad.appendChild(st);
    });
    defs.appendChild(grad);
    g.appendChild(defs);

    var rim = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    rim.setAttribute('cx', cx); rim.setAttribute('cy', cy); rim.setAttribute('r', R);
    rim.setAttribute('fill', 'url(#' + id + ')');
    g.appendChild(rim);
    return g;
  }

  function pad2(n){ return (n < 10 ? '0' : '') + n; }

  // The feed is built as markup so a name can carry its squad's colour, so
  // anything interpolated into it has to be escaped on the way in.
  function esc(t){ return String(t == null ? '' : t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Team names carry markup in the app — a flag image sits inside them — and an
  // SVG text node escapes rather than renders it, so the tag would be printed
  // out literally. Everything drawn here goes through this first.
  function plain(name){ return String(name == null ? '' : name).replace(/<[^>]+>/g, '').trim(); }

  // A stable colour per squad, by the golden angle. Neighbouring indices land
  // far apart on the wheel, so fifty squads on one island stay distinguishable
  // and — the point of this — the same squad is the same colour all match, which
  // is what lets you follow one across the rotations.
  function hueFor(i){ return (i * 137.508) % 360; }
  function colourFor(i){ return 'hsl(' + hueFor(i).toFixed(0) + ' 85% 62%)'; }

  // Ink that can actually be read on a given pill. The first version hard-coded
  // near-black, which is right for the generated colours — they are all 62%
  // lightness — and wrong for yours, because yours is the theme accent and in
  // All FNCS that is a dark blue. Black on dark blue is not a label.
  //
  // var(--accent) has to be resolved before it can be measured, so the accent is
  // read off the document once and cached.
  var accentCache = null;
  function resolve(colour){
    if(colour.indexOf('var(') !== 0) return colour;
    if(accentCache == null){
      accentCache = (getComputedStyle(document.documentElement)
        .getPropertyValue('--accent') || '#3f62ca').trim();
    }
    return accentCache;
  }
  function luminance(colour){
    var c = resolve(colour);
    var m = c.match(/^#([0-9a-f]{6})$/i);
    if(m){
      var n = parseInt(m[1], 16);
      return (0.2126*((n>>16)&255) + 0.7152*((n>>8)&255) + 0.0722*(n&255)) / 255;
    }
    var h = c.match(/hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
    if(h) return Number(h[3]) / 100;      // lightness is close enough to rank these
    return 0.5;
  }
  function inkOn(colour){ return luminance(colour) > 0.55 ? '#0b0e18' : '#ffffff'; }

  // Above this many squads alive, names are dropped and only the markers are
  // drawn. Fifty labels on one island is not a map, it is a wall of text — and
  // the endgame, where you actually want to know who is left, is exactly where
  // there is room for them.
  var LABEL_BELOW = 12;

  // The squad marker: the arrowhead the real map uses, pointing the way the
  // squad is travelling. A heading is worth more than a dot here — the whole
  // subject is rotations, and an arrow says who is already moving to the next
  // circle and who is still sitting on their ground.
  //
  // Drawn nose-right in local units and rotated into place, with a concave back
  // so it reads as a chevron rather than a wedge at the size these end up.
  var MARKER = 'M 1.9 0 L -1.2 -1.25 L -0.55 0 L -1.2 1.25 Z';

  function marker(x, y, angle, fill, isYou){
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', MARKER);
    p.setAttribute('fill', fill);
    p.setAttribute('stroke', isYou ? '#ffffff' : 'rgba(8,10,18,.9)');
    p.setAttribute('stroke-width', isYou ? 0.5 : 0.42);
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('transform',
      'translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ') ' +
      'rotate(' + angle.toFixed(1) + ') ' +
      'scale(' + (isYou ? 1.35 : 1) + ')');
    return p;
  }

  // --- kill feed, built the way the game's own feed is: a pill for each side
  // with a badge between them. A name is far easier to find in a coloured pill
  // than in a run of text, and the pill carries the same colour as that squad's
  // marker, so a line in the feed and an arrow on the map are the same object.
  var BADGE = {
    kill:  {bg:'#ec1e79', svg:'<circle cx="7" cy="7" r="3.1" fill="none" stroke="#fff" stroke-width="1.8"/>' +
                              '<path d="M7 0.7v2.4M7 10.9V13.3M0.7 7h2.4M10.9 7h2.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'},
    // A bolt for surge, a droplet for the storm. The two were the same glyph in
    // two colours, and a bolt reads as electricity — which is the surge, not the
    // wall you walked into.
    storm: {bg:'#6b58d6', svg:'<path d="M7 1.2c3.1 3.9 4 5.9 4 7.3a4 4 0 0 1-8 0c0-1.4.9-3.4 4-7.3z" fill="#fff"/>'},
    surge: {bg:'#e8a020', svg:'<path d="M7.6 1.4 3.2 8h3l-.8 4.6L11 6H8z" fill="#fff"/>'}
  };

  function badge(kind){
    var b = BADGE[kind] || BADGE.kill;
    return '<span style="display:inline-flex;align-items:center;justify-content:center;' +
      'width:18px;height:18px;border-radius:6px;flex:none;background:' + b.bg + ';' +
      'box-shadow:0 1px 3px rgba(0,0,0,.55);">' +
      '<svg viewBox="0 0 14 14" width="13" height="13">' + b.svg + '</svg></span>';
  }

  function pill(name, colour, isYou){
    return '<span style="display:inline-block;padding:2px 7px;border-radius:4px;' +
      'background:' + colour + ';color:' + inkOn(colour) + ';font-size:10.5px;font-weight:800;' +
      'white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;' +
      'box-shadow:0 1px 3px rgba(0,0,0,.5)' + (isYou ? ',0 0 0 1.5px #fff' : '') + ';">' +
      esc(name) + '</span>';
  }

  function feedRow(inner){
    return '<div style="display:flex;align-items:center;gap:5px;">' + inner + '</div>';
  }

  // The counters the real overlay carries: players left, then squads left.
  function counter(iconSvg, now, total){
    return '<span style="display:inline-flex;align-items:center;gap:3px;' +
      'background:rgba(8,12,24,.62);border-radius:5px;padding:1px 6px 1px 4px;">' +
      '<svg viewBox="0 0 12 12" width="9" height="9" style="flex:none;">' + iconSvg + '</svg>' +
      '<b style="font-size:11px;">' + now + '</b>' +
      '<span style="font-size:9px;opacity:.62;">/' + total + '</span></span>';
  }
  var ICON_PLAYER = '<circle cx="6" cy="3.3" r="2.1" fill="#8fd0ff"/>' +
                    '<path d="M1.6 11c0-2.6 2-4.2 4.4-4.2S10.4 8.4 10.4 11z" fill="#8fd0ff"/>';
  var ICON_SQUAD  = '<circle cx="3.6" cy="3.4" r="1.9" fill="#7de3a8"/>' +
                    '<circle cx="8.6" cy="3.9" r="1.6" fill="#7de3a8" opacity=".75"/>' +
                    '<path d="M0.4 10.6c0-2.3 1.5-3.7 3.3-3.7s3.3 1.4 3.3 3.7z" fill="#7de3a8"/>' +
                    '<path d="M7.2 10.6c0-1.9 1-3 2.3-3s2.1 1.1 2.1 3z" fill="#7de3a8" opacity=".75"/>';

  // Turns "cause:victim" strings into feed rows and appends them to the
  // handle's running feed. Shared by draw(), which reads events off a frame as
  // it plays, and note(), which is handed events that were never part of a
  // frame at all — one code path so a pre-game death and an in-game one render
  // identically.
  function pushEvents(handle, events, roster){
    if(!events || !events.length) return;
    roster = roster || [];
    var indexOfName = {};
    for(var n=0;n<roster.length;n++) indexOfName[plain(roster[n].name)] = n;
    var pillFor = function(name){
      var idx = indexOfName[name];
      if(idx == null) return pill(name, '#c9d2e6', false);
      return pill(name, roster[idx].you ? 'var(--accent)' : colourFor(idx), roster[idx].you);
    };
    for(var e=0;e<events.length;e++){
      // Strip the markup before splitting, not after. A team name carries a flag
      // image, so the raw name holds `<img src="https://…">` — and that `https:`
      // is the first colon in the string. Splitting first cut the killer's name
      // in half and printed the wreckage: the feed read `<img src="https` beside
      // `//flagcdn.com/w40/fr…` instead of two squads. Tags out first, and the
      // only colon left is the one this format put there.
      // Each half is trimmed on its own: the tag sat between the name and the
      // colon, so removing it leaves a space that would miss the roster lookup
      // and cost the squad its colour.
      var raw = plain(events[e]);
      var cut = raw.indexOf(':');
      var cause = plain(raw.slice(0, cut)), victim = plain(raw.slice(cut + 1));
      var row = (cause === 'storm' || cause === 'surge')
        ? badge(cause) + pillFor(victim)
        : pillFor(cause) + badge('kill') + pillFor(victim);
      handle.lines.push(feedRow(row));
    }
    while(handle.lines.length > 4) handle.lines.shift();
    handle.feed.innerHTML = handle.lines.join('');
  }

  function label(x, y, text, fill){
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y - 1.6);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '2.4');
    t.setAttribute('font-weight', '800');
    t.setAttribute('paint-order', 'stroke');
    t.setAttribute('stroke', 'rgba(0,0,0,.85)');
    t.setAttribute('stroke-width', '0.9');
    t.setAttribute('stroke-linejoin', 'round');
    t.setAttribute('fill', fill);
    t.textContent = text;
    return t;
  }

  function draw(handle, frame, labels, roster){
    roster = roster || [];
    handle.svg.innerHTML = '';
    var vbH = Number(handle.svg.dataset.vbh) || 100;

    // Storm first, so the circles and everybody's markers sit on top of it.
    handle.svg.appendChild(stormFill(100, vbH,
      frame.circle.cx, frame.circle.cy, frame.circle.radius));
    // One ring on the map, and it is the circle you have to run to.
    //
    // The zone you are standing in does not get a line, because it does not
    // need one: the storm wash above already ends exactly on it, and an edge
    // between purple and island reads as a wall on its own. Everything drawn on
    // top of that was decoration — first a six-pixel pink rim, then a white
    // line, then a dashed one — and each of them was louder than the squads,
    // which are what the map is for.
    //
    // The dark line under the white is not a second ring. It is the shadow that
    // keeps a hairline legible against both sides of itself: the island is
    // pale, the storm is purple, and a white thread crossing both needs
    // something to sit on.
    if(frame.next){
      handle.svg.appendChild(circle(frame.next.cx, frame.next.cy, frame.next.radius,
        'rgba(12,8,26,.45)', 3.4));
      handle.svg.appendChild(circle(frame.next.cx, frame.next.cy, frame.next.radius,
        'rgba(255,255,255,.96)', 1.6));
    }

    var named = frame.alive <= LABEL_BELOW;
    for(var i=0;i<frame.dots.length;i++){
      var d = frame.dots[i];
      if(!d.alive) continue;
      var who = roster[i] || {};
      handle.svg.appendChild(marker(d.x, d.y, d.a || 0,
        who.you ? 'var(--accent)' : colourFor(i), who.you));
      // Only yours is named on the map. Following your own squad across a
      // rotation is the reason to watch this, and one label never collides.
      if(who.you){
        var name = plain(who.name);
        if(name) handle.svg.appendChild(label(d.x, d.y, name, '#ffffff'));
      }
    }

    // Everyone else gets the side list, once the field is small enough to fit.
    if(handle.side){
      if(!named){ handle.side.style.display = 'none'; handle.side.innerHTML = ''; }
      else {
        var rows = [];
        for(var k=0;k<frame.dots.length;k++){
          if(!frame.dots[k].alive) continue;
          var r = roster[k] || {};
          var nm = plain(r.name);
          if(!nm) continue;
          var col = r.you ? 'var(--accent)' : colourFor(k);
          rows.push('<div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;">' +
            (r.you
              ? '<span style="padding:0 5px;border-radius:3px;background:var(--accent);' +
                'color:' + inkOn('var(--accent)') + ';box-shadow:0 0 0 1px rgba(255,255,255,.65);">' +
                esc(nm) + '</span>'
              : '<span>' + esc(nm) + '</span>') +
            '<span style="width:0;height:0;flex:none;border-style:solid;' +
              'border-width:4px 0 4px 7px;border-color:transparent transparent transparent ' + col +
              ';filter:drop-shadow(0 0 1px rgba(0,0,0,.9));"></span></div>');
        }
        handle.side.innerHTML = rows.join('');
        handle.side.style.display = 'flex';
      }
    }

    var secs = frame.secondsLeft;
    var totS = roster.totalSquads || frame.dots.length;
    var totP = roster.totalPlayers || totS;
    handle.head.innerHTML =
      '<span style="display:flex;align-items:center;gap:7px;">' +
        '<span>' + esc(labels.zone) + ' ' + frame.zone + '</span>' +
        '<span style="opacity:.8;font-variant-numeric:tabular-nums;">' +
          Math.floor(secs/60) + ':' + pad2(secs % 60) + '</span></span>' +
      '<span style="display:flex;align-items:center;gap:5px;">' +
        counter(ICON_PLAYER, (frame.players != null ? frame.players : frame.alive), totP) +
        counter(ICON_SQUAD, frame.alive, totS) + '</span>';

    pushEvents(handle, frame.events, roster);
  }

  // A frame that was never recorded, made from the two either side of it.
  //
  // The engine keeps every eighth tick, and a tick is two seconds, so recorded
  // frames are sixteen game-seconds apart — far enough that a squad crosses
  // several times its own size between them and the replay reads as a slideshow
  // of jumps. Nothing is missing from the recording; what is missing is the
  // drawing in between, and that costs nothing to work out.
  //
  // Everything that has a position is carried across: the storm, the circle it
  // is closing to, and every marker with its heading. They have to move
  // together — interpolating the markers alone would slide them over a storm
  // edge that was still jumping, which reads worse than the jumps did.
  function lerp(a, b, k){ return a + (b - a) * k; }

  function lerpCircle(a, b, k){
    if(!a || !b) return a || b || null;
    return {cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), radius: lerp(a.radius, b.radius, k)};
  }

  function between(a, b, k, keepEvents){
    if(!b || k <= 0) return keepEvents ? a : shallowNoEvents(a);
    var dots = [];
    for(var i=0;i<a.dots.length;i++){
      var d = a.dots[i], e = b.dots[i] || d;
      // A squad that dies between the two frames stays where it fell rather than
      // gliding to wherever its corpse's coordinates happen to be.
      var moving = d.alive && e.alive;
      var turn = ((((e.a || 0) - (d.a || 0)) % 360) + 540) % 360 - 180;
      dots.push({
        x: moving ? lerp(d.x, e.x, k) : d.x,
        y: moving ? lerp(d.y, e.y, k) : d.y,
        alive: d.alive,
        a: (d.a || 0) + turn * k,
        // Not interpolated. A kill is a whole number that happened at a moment,
        // and a place is a fact; sliding either one between frames would put a
        // squad on two and a half eliminations and half of eighth place.
        e: d.e || 0,
        p: d.p || 0
      });
    }
    return {
      zone: a.zone,
      // The clock only runs down inside a phase; across a phase boundary it
      // resets upward, and sliding it there would run the timer backwards.
      secondsLeft: b.secondsLeft <= a.secondsLeft
        ? Math.round(lerp(a.secondsLeft, b.secondsLeft, k)) : a.secondsLeft,
      alive: a.alive,
      players: a.players,
      circle: lerpCircle(a.circle, b.circle, k),
      next: lerpCircle(a.next, b.next, k),
      dots: dots,
      // The kill feed is a list of things that happened, not a thing with a
      // position: it is printed once, on the frame that recorded it.
      events: keepEvents ? a.events : null
    };
  }

  function shallowNoEvents(f){
    var out = {}, key;
    for(key in f) if(Object.prototype.hasOwnProperty.call(f, key)) out[key] = f[key];
    out.events = null;
    return out;
  }

  // Drawing more often than this buys nothing anybody can see and costs a full
  // rebuild of the layer each time.
  var MIN_DRAW_MS = 28;

  function play(handle, timeline, opts){
    opts = opts || {};
    var frameMs = opts.frameMs || 90;
    // Starting the feed over used to happen right here, unconditionally. That
    // breaks the moment a caller wants this game's feed to open on something
    // that never came from a frame — the landing fights, pushed via note()
    // before this is ever called — since an unconditional clear would wipe
    // them out before the first frame even drew. So clearing the feed is the
    // caller's job now, via clearFeed(), done before anything is noted for
    // the game about to play.
    if(handle.side){ handle.side.innerHTML = ''; handle.side.style.display = 'none'; }

    var smooth = opts.smooth !== false &&
                 timeline.length > 1 &&
                 frameMs >= MIN_DRAW_MS * 1.5 &&
                 !(typeof matchMedia === 'function' &&
                   matchMedia('(prefers-reduced-motion: reduce)').matches);

    return new Promise(function(resolve){
      function show(frame){
        draw(handle, frame, opts.labels, opts.roster);
        // The observer is caller code and runs inside the timer callback that
        // owns this promise: a throw here would take the scheduler with it, and
        // the promise would neither resolve nor reject — a tournament waiting on
        // it would wait for ever. Drawing first also means a broken observer
        // costs its own updates and not the map.
        if(opts.onFrame){ try { opts.onFrame(frame); } catch(err){ } }
      }

      function finish(){
        if(timeline.length) show(timeline[timeline.length-1]);
        resolve();
      }

      if(!smooth){
        var i = 0;
        (function next(){
          if(i >= timeline.length || (opts.isSkipped && opts.isSkipped())){ finish(); return; }
          show(timeline[i++]);
          setTimeout(next, frameMs);
        })();
        return;
      }

      // Driven by a timer against a clock rather than by animation frames.
      // Animation frames stop dead in a hidden tab, and this promise is what a
      // tournament waits on before it plays the next game — a run left in a
      // background tab would never come back. A timer is throttled there
      // instead of frozen, so the replay finishes slowly and the run goes on,
      // which is the behaviour the page has always had.
      var started = null, shown = -1, lastDraw = -1e9;
      var clock = (typeof performance !== 'undefined' && performance.now)
        ? function(){ return performance.now(); } : function(){ return Date.now(); };

      (function step(){
        if(opts.isSkipped && opts.isSkipped()){ finish(); return; }
        var now = clock();
        if(started === null) started = now;
        var at = (now - started) / frameMs;
        var i = Math.floor(at);
        if(i >= timeline.length - 1){ finish(); return; }
        var fresh = i !== shown;
        if(fresh || now - lastDraw >= MIN_DRAW_MS){
          shown = i; lastDraw = now;
          show(between(timeline[i], timeline[i+1], at - i, fresh));
        }
        setTimeout(step, MIN_DRAW_MS / 2);
      })();
    });
  }

  function unmount(handle){
    if(handle && handle.wrap && handle.wrap.parentNode) handle.wrap.parentNode.removeChild(handle.wrap);
  }

  // One frame, drawn where it is. Unlike play() this leaves the kill feed
  // alone, so a caller driving its own clock can put a frame on the screen
  // without wiping the list of who has just died — which is what a caller that
  // reached for play() one frame at a time was doing to itself.
  function show(handle, frame, opts){
    opts = opts || {};
    draw(handle, frame, opts.labels, opts.roster);
  }

  // Start the feed over: for a scrub, where the frames about to arrive are not
  // the ones that filled it.
  function clearFeed(handle){
    handle.lines.length = 0;
    handle.feed.innerHTML = '';
  }

  // Push feed rows that never came from a frame — the landing fights the
  // engine resolves before the timeline starts. Call this after clearFeed()
  // and before play(): play() no longer starts the feed over on its own, so
  // whatever is noted here is still there when the first frame draws.
  function note(handle, events, roster){
    pushEvents(handle, events, roster);
  }

  root.ZoneReplay = {mount:mount, play:play, unmount:unmount,
                     between:between, show:show, clearFeed:clearFeed, note:note};
})(typeof globalThis !== 'undefined' ? globalThis : this);
