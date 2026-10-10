/* search.js: one search box for all three sites. No build step: the index
   is built at runtime from the same JSON files the admin edits, so it never
   goes stale. Every word must match; title hits rank first.
   Loaded by header.js on first use (also works if a page loads it directly).
   Hub cards: only status "live" items are indexed, drafts and queued stay out. */
(function () {
  "use strict";
  if (window.LCSearch) return;

  var MAIN = "https://lori-sca.github.io";
  var WORK = "https://lorisca-analytics.github.io";
  var BUILDS = "https://lorisca-builds.github.io";

  var index = null;   // [{t, s, u, w}]
  var building = null;
  var seen = {};

  function strip(html) { return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
  function hl(v) { return v && typeof v === "object" ? (v.main || "") + " " + (v.accent || "") : v || ""; }
  function add(t, s, u, w) {
    t = strip(hl(t)); s = strip(hl(s));
    if (!t && !s) return;
    var k = (t + "|" + u).toLowerCase();
    if (seen[k]) return;
    seen[k] = 1;
    index.push({ t: t, s: s, u: u, w: w });
  }

  /* sections added in the admin's page builder (layout.sections[].content) */
  function layoutEntries(data, page, where) {
    ((data && data.layout || {}).sections || []).forEach(function (s) {
      if (s.hidden || !s.content) return;
      var c = s.content, url = page + "#" + s.id;
      var title = strip(hl(c.headline) || c.heading || c.eyebrow || "");
      var text = strip(c.body || c.caption || "");
      (c.cards || []).forEach(function (cd) { add(cd.title, cd.text, url, where); });
      (c.items || []).forEach(function (it) { add(it.title, title, url, where); });
      (c.blocks || []).forEach(function (b) {
        var d = b.data || {};
        if (b.type === "heading") add(d.text, title, url, where);
        else if (b.type === "text" || b.type === "callout") text = text || strip(d.html);
        else if (b.type === "file") add(d.label, d.note || "Document", url, where);
      });
      if (title || text) add(title || text.slice(0, 60), text.slice(0, 160), url, where);
    });
  }

  function get(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function buildIndex() {
    if (building) return building;
    index = [];
    var M = MAIN + "/";
    building = Promise.all([
      get(M + "data/site.json"), get(M + "data/home.json"), get(M + "data/about.json"),
      get(M + "data/writing.json"), get(M + "data/off-the-clock.json"), get(M + "fun/posts.json"), get(M + "fun/tiles.json"),
      get(WORK + "/data/hero.json"), get(WORK + "/data/lanes.json"), get(WORK + "/data/page.json"),
      get(BUILDS + "/data/hero.json"), get(BUILDS + "/data/projects.json"), get(BUILDS + "/data/page.json")
    ]).then(function (r) {
      var site = r[0], home = r[1], about = r[2], writing = r[3], oc = r[4], posts = r[5], tiles = r[6];
      var wHero = r[7], lanes = r[8], wPage = r[9], bHero = r[10], projects = r[11], bPage = r[12];

      if (site && site.name) add(site.name, site.role || "", M, "Home");

      if (home) {
        var h = home.hero || {};
        // sections hidden in the admin are left out, so no result points at something you can't see
        var shown = function (id) { return !((home.layout || {}).sections || []).some(function (x) { return x.id === id && x.hidden; }); };
        var one = function (v) { return String(v || "").replace(/\s*\n\s*/g, " ").trim(); };
        if (h.headline && shown("top")) add(one(h.headline), h.lede || "", M + "#top", "Home");
        if (h.tagline && shown("top")) add(h.principleLabel || "Principle", h.tagline, M + "#top", "Home");
        if (shown("start")) (home.startHere || []).forEach(function (c) { add(c.title, c.text, M + "#start", "Home"); });
        if (shown("stats")) (home.stats || []).forEach(function (st) { add([st.value, st.label].filter(Boolean).join(" "), st.detail, M + "#stats", "Home"); });
        if (shown("ribbon")) ((home.ribbon || {}).items || []).forEach(function (k) { add(k, "Kind of work I do", M + "#ribbon", "Home"); });
        if (shown("featured")) {
          var picked = (home.featured || []).slice(0, 3);
          (home.featuredCards || []).forEach(function (fc) {
            if (!fc || picked.indexOf(fc.id) < 0 || !fc.title) return;
            add(fc.title, [fc.summary, fc.problem, fc.move, fc.result, fc.note].filter(Boolean).join(" · "), M + "#featured", "Home");
          });
        }
        if (shown("method")) (home.method || []).forEach(function (m) { add(m.title, m.text, M + "#method", "Home"); });
        if (home.aboutTeaser && shown("about")) add("About", home.aboutTeaser, M + "#about", "Home");
        layoutEntries(home, M, "Home");
      }

      if (about) {
        var A = M + "about.html";
        if (about.hero && about.hero.greeting) add(about.hero.greeting, about.hero.lede || "", A + "#top", "About");
        var aHidden = {};
        ((about.layout || {}).sections || []).forEach(function (s) { if (s.hidden) aHidden[s.id] = true; });
        var aw = about.ways || {};
        if (!aHidden.ways) {
          if (aw.lede) add(hl((about.sections || {}).ways && about.sections.ways.headline) || "How I think and work", [aw.lead, aw.lede].filter(Boolean).join(" "), A + "#ways", "About");
          (aw.items || []).forEach(function (c) { if (c && !c.hidden) add(c.title, c.text, A + "#ways", "About"); });
        }
        if (!aHidden.thirties) (about.thirties || []).forEach(function (c) { add(c.title, c.text, A + "#thirties", "About"); });
        if (!aHidden.story) (about.chapters || []).forEach(function (c) { if (c && !c.hidden) add(c.label || "The story", c.text, A + "#story", "About"); });
        if (!aHidden.route) (about.route || []).forEach(function (st) {
          add(st.where, [st.role, st.when].concat(st.detail || []).filter(Boolean).join(" · "), A + "#route", "About");
          (st.roles || []).forEach(function (ro) { add([st.where, ro.role].filter(Boolean).join(": "), [ro.when].concat(ro.detail || []).filter(Boolean).join(" · "), A + "#route", "About"); });
        });
        var pr = about.principle;
        if (pr && typeof pr === "object") add(pr.latin, [pr.translation, pr.note].filter(Boolean).join(" "), A + "#principle", "About");
        ["principle", "method", "proudest", "holdup"].forEach(function (k) {
          if (k === "holdup" && !((about.sections || {}).story || {}).showHoldup) return;
          if (typeof about[k] === "string" && about[k]) add(k.charAt(0).toUpperCase() + k.slice(1), about[k], A + "#story", "About");
        });
        (about.toolbox || []).forEach(function (g) { add("Toolbox: " + g.group, (g.items || []).join(", "), A + "#toolbox", "About"); });
        if (typeof about.fieldnotes === "string" && about.fieldnotes) add("Field notes", about.fieldnotes, A + "#fieldnotes", "About");
        layoutEntries(about, A, "About");
      }

      if (writing) {
        var W = M + "writing.html";
        if (writing.headline) add(writing.headline, writing.lede || "", W + "#top", "Writing");
        layoutEntries(writing, W, "Writing");
      }

      var O = M + "off-the-clock.html";
      if (oc) { if (oc.title || oc.headline) add(oc.title || oc.headline, oc.lede || "", O + "#top", "Off the clock"); layoutEntries(oc, O, "Off the clock"); }
      if (posts) (posts.posts || []).forEach(function (p) {
        if (!p || p.hidden) return;
        var es = (p.entries || []).filter(function (e) { return e && !e.hidden && (e.title || e.text || (e.photos || []).length); });
        var opens = es.length || p.story || p.embed;
        add(p.title, p.text, O + (opens ? "#" + p.id : "#fun"), "Off the clock");
        es.forEach(function (e) { add(e.title || p.title, [p.title, e.date, e.text].filter(Boolean).join(" · "), O + "#" + p.id, "Off the clock"); });
      });
      if (tiles) (tiles.tiles || []).forEach(function (t) { if (t && !t.hidden) add(t.place, t.context, O + "#field", "Off the clock"); });

      var WK = WORK + "/";
      if (wHero && wHero.headline) add(wHero.headline, wHero.lede || "", WK + "#top", "Work");
      ((lanes && lanes.lanes) || []).forEach(function (l) {
        var live = (l.projects || []).filter(function (p) { return p.status === "live"; });
        if (live.length) add(l.name, l.blurb || "", WK + "#" + l.id, "Work");
        live.forEach(function (p) { add(p.title, [p.hook, p.metric, (p.tools || []).join ? (p.tools || []).join(", ") : p.tools].filter(Boolean).join(" · "), WK + "#card-" + p.id, "Work"); });
      });
      layoutEntries(wPage, WK, "Work");

      var BK = BUILDS + "/";
      if (bHero && bHero.headline) add(bHero.headline, bHero.lede || "", BK + "#top", "Builds");
      ((projects && projects.projects) || []).filter(function (p) { return p.status === "live"; }).forEach(function (p) {
        add(p.title, [p.hook, p.metric].filter(Boolean).join(" · "), BK + "#build-" + p.id, "Builds");
      });
      layoutEntries(bPage, BK, "Builds");
    });
    return building;
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q || !index) return [];
    var words = q.split(/\s+/);
    var out = [];
    index.forEach(function (e) {
      var t = e.t.toLowerCase(), s = e.s.toLowerCase(), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (t.indexOf(w) > -1) score += 2;
        else if (s.indexOf(w) > -1) score += 1;
        else { score = -1; break; }
      }
      if (score > 0) out.push({ e: e, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 10).map(function (r) { return r.e; });
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var pal = null, input = null, list = null, active = -1, lastFocus = null;

  function ensurePal() {
    if (pal) return;
    pal = document.createElement("div");
    pal.className = "search-pal";
    pal.innerHTML =
      '<div class="sp-backdrop"></div>' +
      '<div class="sp-box" role="dialog" aria-modal="true" aria-label="Search all three sites">' +
        '<input class="sp-input" type="search" placeholder="Search work, builds, about…" aria-label="Search all three sites" autocomplete="off">' +
        '<div class="sp-results" role="listbox"></div>' +
      "</div>";
    document.body.appendChild(pal);
    input = pal.querySelector(".sp-input");
    list = pal.querySelector(".sp-results");
    pal.querySelector(".sp-backdrop").addEventListener("click", close);
    input.addEventListener("input", function () { buildIndex().then(render); render(); });
    input.addEventListener("keydown", function (e) {
      var hits = list.querySelectorAll(".sp-hit");
      if (e.key === "Escape") { close(); }
      else if (e.key === "ArrowDown" && hits.length) { e.preventDefault(); mark(Math.min(active + 1, hits.length - 1)); }
      else if (e.key === "ArrowUp" && hits.length) { e.preventDefault(); mark(Math.max(active - 1, 0)); }
      else if (e.key === "Enter" && hits.length) { e.preventDefault(); (hits[active > -1 ? active : 0]).click(); }
    });
  }

  function mark(i) {
    var hits = list.querySelectorAll(".sp-hit");
    hits.forEach(function (h, n) { h.classList.toggle("active", n === i); });
    active = i;
    if (hits[i]) hits[i].scrollIntoView({ block: "nearest" });
  }

  function render() {
    active = -1;
    var q = input.value;
    if (!q.trim()) { list.innerHTML = ""; return; }
    if (!index || !index.length) { list.innerHTML = '<p class="sp-empty">Loading…</p>'; return; }
    var hits = search(q);
    if (!hits.length) { list.innerHTML = '<p class="sp-empty">Nothing found. Try another word.</p>'; return; }
    list.innerHTML = "";
    hits.forEach(function (e) {
      var a = document.createElement("a");
      a.className = "sp-hit";
      a.href = e.u;
      a.setAttribute("role", "option");
      a.innerHTML = (e.w ? '<span class="sp-where">' + esc(e.w) + "</span>" : "") +
        '<span class="sp-t">' + esc(e.t) + "</span>" +
        (e.s ? '<span class="sp-s">' + esc(e.s.slice(0, 160)) + "</span>" : "");
      a.addEventListener("click", function () { setTimeout(close, 0); });
      list.appendChild(a);
    });
  }

  function open() {
    ensurePal();
    buildIndex().then(function () { if (pal.classList.contains("open")) render(); });
    lastFocus = document.activeElement;
    pal.classList.add("open");
    document.body.classList.add("sp-lock");
    input.value = "";
    list.innerHTML = "";
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    if (!pal) return;
    pal.classList.remove("open");
    document.body.classList.remove("sp-lock");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.LCSearch = { open: open, close: close };

  /* pages without the shared header: bind their own search button */
  function bindOld() {
    var b = document.getElementById("nav-search");
    if (b && !document.querySelector(".nav-inner.lh-ready")) b.addEventListener("click", open);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindOld); else bindOld();
})();
