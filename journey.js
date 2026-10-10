/* ============================================================
   journey.js — the About page journey map.

   Reads from data/about.json:
     journey[]            pins in travel order { city, note, lat, lng, skip }
                          skip: true = kept in the data and admin, left
                          out of the map (e.g. a return visit)
     journeyMap.avatar    picture shown on the last stop (where I am now)
     journeyMap.avatarAlt its description
     journeyMap.text      sentence under the map; {miles} is replaced with
                          the visitor's distance
     journeyMap.textNoLocation  same sentence for when the visitor's
                          location can't be found
     journeyMap.textNearby      sentence for visitors within ~30 miles
                          of the last stop (no arc, no number)

   What it does: a globe (dark or light, following the site theme)
   that flies through the stops when it first scrolls into view, lands on the avatar, then draws a dotted
   arc to the visitor's approximate location (from their IP address).
   Reduced-motion visitors get the finished map with no flight.
   Plain JS, no build step. Needs mapbox-gl.js loaded first.
   ============================================================ */
(function (root) {
  "use strict";

  var STYLES = {
    dark: "mapbox://styles/mapbox/dark-v11",
    light: "mapbox://styles/mapbox/light-v11",
  };
  var SPACE = { dark: "#1e2d42", light: "#eef2f6" };
  var ROUTE_COLOR = "#8fa9c9";
  var ARC_FALLBACK = "#3f5fd0";
  // the arc to the visitor uses the site's accent color, in either theme
  function arcColor() {
    try { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || ARC_FALLBACK; } catch (e) { return ARC_FALLBACK; }
  }
  var NEARBY_MILES = 30;

  function theme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function reducedMotion() {
    return root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---------- geometry ---------- */
  var R_MILES = 3958.8;
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function miles(a, b) {
    var dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  // points along the great circle (the path a plane flies), longitudes kept continuous
  function arc(a, b, n) {
    var la1 = rad(a[1]), lo1 = rad(a[0]), la2 = rad(b[1]), lo2 = rad(b[0]);
    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((la2 - la1) / 2), 2) +
      Math.cos(la1) * Math.cos(la2) * Math.pow(Math.sin((lo2 - lo1) / 2), 2)));
    if (d < 1e-6) return [a.slice(), b.slice()];
    var out = [];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      var x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
      var y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
      var z = A * Math.sin(la1) + B * Math.sin(la2);
      out.push([deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
    }
    for (var j = 1; j < out.length; j++) {
      while (out[j][0] - out[j - 1][0] > 180) out[j][0] -= 360;
      while (out[j][0] - out[j - 1][0] < -180) out[j][0] += 360;
    }
    return out;
  }
  function line(coords) {
    return { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
  }

  /* ---------- visitor location (approximate, from IP) ---------- */
  function lookupVisitor() {
    try {
      var c = sessionStorage.getItem("lori-visitor-geo");
      if (c) return Promise.resolve(JSON.parse(c));
    } catch (e) {}
    function get(url, pick) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (j) {
        var p = pick(j);
        if (!isFinite(p.lat) || !isFinite(p.lng)) throw new Error("no coords");
        return p;
      });
    }
    return get("https://ipapi.co/json/", function (j) {
      return { lat: +j.latitude, lng: +j.longitude, city: j.city || "" };
    }).catch(function () {
      return get("https://get.geojs.io/v1/ip/geo.json", function (j) {
        return { lat: +j.latitude, lng: +j.longitude, city: j.city || "" };
      });
    }).then(function (p) {
      try { sessionStorage.setItem("lori-visitor-geo", JSON.stringify(p)); } catch (e) {}
      return p;
    }).catch(function () { return null; });
  }

  /* ---------- caption ---------- */
  function escapeHTML(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function setCaption(el, cfg, dist) {
    if (dist == null) {
      el.textContent = cfg.textNoLocation || "";
      return null;
    }
    var parts = String(cfg.text || "").split("{miles}");
    el.innerHTML = escapeHTML(parts[0]) +
      (parts.length > 1 ? '<span class="journey-miles"><span class="n">0</span> miles</span>' + escapeHTML(parts.slice(1).join("{miles}")) : "");
    return el.querySelector(".journey-miles .n");
  }
  function countTo(el, target, ms) {
    if (!el) return;
    var fmt = function (v) { return Math.round(v).toLocaleString("en-US"); };
    if (reducedMotion()) { el.textContent = fmt(target); return; }
    var t0 = performance.now();
    (function step(t) {
      var f = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - f, 3);
      el.textContent = fmt(target * e);
      if (f < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- the map ---------- */
  function init(about, opts) {
    opts = opts || {};
    var box = document.getElementById("journey-map");
    if (!box) return;
    var stops = (about.journey || []).filter(function (s) {
      return !s.skip && isFinite(+s.lat) && isFinite(+s.lng);
    });
    if (!stops.length || typeof mapboxgl === "undefined") { box.style.display = "none"; return; }
    var cfg = about.journeyMap || {};

    var caption = document.getElementById("journey-caption");
    if (!caption) {
      caption = document.createElement("p");
      caption.id = "journey-caption";
      caption.className = "journey-caption";
      caption.setAttribute("aria-live", "polite");
      var legendEl = document.getElementById("journey-legend");
      box.insertBefore(caption, legendEl || null);
    }
    caption.textContent = cfg.textNoLocation || "";

    var visitorP = lookupVisitor();
    var tokenP = opts.token ? Promise.resolve(opts.token) :
      fetch("assets/mapbox-token.txt").then(function (r) {
        if (!r.ok) throw new Error("no token"); return r.text();
      });

    tokenP.then(function (tok) {
      mapboxgl.accessToken = String(tok).trim();
      var pts = stops.map(function (s) { return [+s.lng, +s.lat]; });
      var home = pts[pts.length - 1];
      var routeFull = [];
      for (var i = 1; i < pts.length; i++) {
        var seg = arc(pts[i - 1], pts[i], 64);
        if (routeFull.length) {
          // keep longitudes continuous across segments
          var last = routeFull[routeFull.length - 1][0];
          var shift = Math.round((last - seg[0][0]) / 360) * 360;
          seg = seg.map(function (p) { return [p[0] + shift, p[1]]; });
          seg.shift();
        }
        routeFull = routeFull.concat(seg);
      }
      var segEnds = [0];
      for (var k = 1; k < pts.length; k++) segEnds.push(k * 64);

      var map = new mapboxgl.Map({
        container: "journey-canvas",
        style: STYLES[theme()],
        projection: "globe",
        center: [40, 20],
        zoom: 0.9,
        cooperativeGestures: true,
        attributionControl: true,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      var state = { routeTo: 0, visitor: null, arcProgress: 0 };

      function quietStyle() {
        var layers = (map.getStyle() && map.getStyle().layers) || [];
        layers.forEach(function (l) {
          var id = l.id;
          var hide = l.type === "symbol" ||
            /road|bridge|tunnel|ferry|aeroway|building|transit|admin-1|hillshade|landuse|poi/.test(id);
          if (hide) { try { map.setLayoutProperty(id, "visibility", "none"); } catch (e) {} }
        });
        try {
          map.setFog({
            color: SPACE[theme()], "high-color": SPACE[theme()],
            "space-color": SPACE[theme()], "star-intensity": 0, "horizon-blend": 0.04,
          });
        } catch (e) {}
      }
      function addLayers() {
        quietStyle();
        if (!map.getSource("journey")) {
          map.addSource("journey", { type: "geojson", data: line(routeFull.slice(0, Math.max(2, state.routeTo + 1))) });
          map.addLayer({ id: "journey-line", type: "line", source: "journey",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": ROUTE_COLOR, "line-width": 2.5, "line-opacity": state.routeTo ? 0.9 : 0 } });
        }
        if (!map.getSource("visitor-arc")) {
          map.addSource("visitor-arc", { type: "geojson", data: line([home, home]) });
          map.addLayer({ id: "visitor-arc", type: "line", source: "visitor-arc",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": arcColor(), "line-width": 3.5, "line-dasharray": [0, 2] } });
        }
        drawRoute(state.routeTo);
        drawArc(state.arcProgress);
      }
      function drawRoute(n) {
        state.routeTo = n;
        var src = map.getSource("journey");
        if (!src) return;
        src.setData(line(routeFull.slice(0, Math.max(2, n + 1))));
        map.setPaintProperty("journey-line", "line-opacity", n ? 0.9 : 0);
      }
      var arcPts = null;
      function drawArc(f) {
        state.arcProgress = f;
        var src = map.getSource("visitor-arc");
        if (!src || !arcPts) return;
        var n = Math.max(2, Math.round(arcPts.length * f));
        src.setData(line(arcPts.slice(0, n)));
      }
      function animate(ms, fn) {
        return new Promise(function (res) {
          if (reducedMotion()) { fn(1); return res(); }
          var t0 = performance.now();
          (function step(t) {
            var f = Math.min(1, (t - t0) / ms);
            fn(f);
            if (f < 1) requestAnimationFrame(step); else res();
          })(t0);
        });
      }
      function fly(o) {
        return new Promise(function (res) {
          if (reducedMotion()) { map.jumpTo(o); return res(); }
          map.once("moveend", res);
          map.flyTo(Object.assign({ essential: false, curve: 1.4 }, o));
        });
      }

      // pins
      var markers = stops.map(function (s, idx) {
        var isHome = idx === stops.length - 1;
        var el = document.createElement("div");
        if (isHome && cfg.avatar) {
          el.className = "map-avatar";
          var img = document.createElement("img");
          img.src = cfg.avatar;
          img.alt = cfg.avatarAlt || "";
          el.appendChild(img);
        } else {
          el.className = "map-pin";
        }
        el.setAttribute("aria-label", s.city + (s.note ? ", " + s.note : ""));
        var pop = new mapboxgl.Popup({ offset: isHome && cfg.avatar ? 40 : 14, closeButton: false })
          .setHTML("<strong>" + escapeHTML(s.city) + "</strong>" + (s.note ? "<br>" + escapeHTML(s.note) : ""));
        var m = new mapboxgl.Marker({ element: el, anchor: isHome && cfg.avatar ? "bottom" : "center" })
          .setLngLat([+s.lng, +s.lat]).setPopup(pop);
        return m;
      });
      function showMarker(i) {
        markers[i].addTo(map);
        markers[i].getElement().classList.add("pop-in");
      }

      // legend
      var lg = document.getElementById("journey-legend");
      if (lg) {
        lg.innerHTML = "";
        stops.forEach(function (s, idx) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "journey-stop";
          var dot = document.createElement("i");
          b.appendChild(dot);
          b.appendChild(document.createTextNode(s.city));
          b.addEventListener("click", function () {
            if (!markers[idx]._map) markers[idx].addTo(map);
            map.flyTo({ center: [+s.lng, +s.lat], zoom: 4, duration: 900 });
            markers[idx].togglePopup();
          });
          lg.appendChild(b);
        });
      }

      // visitor
      var visitorMarker = null;
      function landVisitor(v) {
        if (!v) { caption.textContent = cfg.textNoLocation || ""; return Promise.resolve(); }
        var vp = [v.lng, v.lat];
        var d = miles(home, vp);
        if (d < NEARBY_MILES) {
          caption.textContent = cfg.textNearby || cfg.textNoLocation || "";
          return Promise.resolve();
        }
        arcPts = arc(vp, home, 96);
        var el = document.createElement("div");
        el.className = "map-visitor";
        el.setAttribute("aria-label", "You, approximately" + (v.city ? " (" + v.city + ")" : ""));
        visitorMarker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(vp).addTo(map);
        var n = setCaption(caption, cfg, d < 1 ? 0 : d);
        // frame both ends
        var lngs = arcPts.map(function (p) { return p[0]; }), lats = arcPts.map(function (p) { return p[1]; });
        var bounds = [[Math.min.apply(null, lngs), Math.min.apply(null, lats)], [Math.max.apply(null, lngs), Math.max.apply(null, lats)]];
        var cam = null;
        try { cam = map.cameraForBounds(bounds, { padding: { top: 90, bottom: 50, left: 60, right: 60 } }); } catch (e) {}
        if (!cam || !isFinite(cam.zoom)) {
          cam = { center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
            zoom: Math.max(0.8, Math.min(5, 4.5 - Math.log2(Math.max(1, d) / 150))) };
        }
        cam.zoom = Math.min(cam.zoom, 5);
        return fly({ center: cam.center, zoom: cam.zoom, duration: 1800 }).then(function () {
          countTo(n, d, 1400);
          return animate(1400, function (f) { drawArc(f); });
        });
      }

      // the sequence
      var played = false;
      function play() {
        if (played) return;
        played = true;
        var chain = Promise.resolve();
        stops.forEach(function (s, idx) {
          chain = chain.then(function () {
            var from = segEnds[Math.max(0, idx - 1)], to = segEnds[idx];
            var routeAnim = idx === 0 ? Promise.resolve() :
              animate(1300, function (f) { drawRoute(Math.round(from + (to - from) * f)); });
            var camAnim = fly({ center: [+s.lng, +s.lat], zoom: idx === 0 ? 3 : 2.6, duration: 1300 });
            return Promise.all([routeAnim, camAnim]).then(function () { showMarker(idx); });
          }).then(function () {
            return new Promise(function (r) { setTimeout(r, reducedMotion() ? 0 : 250); });
          });
        });
        chain.then(function () { return visitorP; }).then(landVisitor);
      }

      map.on("style.load", addLayers);
      map.on("load", function () {
        if (reducedMotion() || !("IntersectionObserver" in root)) { play(); return; }
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); play(); } });
        }, { threshold: 0.45 });
        io.observe(box);
      });

      document.addEventListener("lori-theme", function () {
        map.setStyle(STYLES[theme()]);
      });

      root.__journeyMap = map;
    }).catch(function () { box.style.display = "none"; });
  }

  root.Journey = { init: init, _miles: miles, _arc: arc };
})(window);
