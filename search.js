/* search.js — site search palette. No build step: the index is built at
   runtime from the same data/*.json files the admin edits, so it never
   goes stale. Plain substring matching, title hits rank first. */

(function () {
  "use strict";

  var index = null;   // [{t, s, u}]
  var built = false;

  function add(t, s, u) {
    if (t || s) index.push({ t: String(t || ""), s: String(s || ""), u: u });
  }

  /* sections added in the admin's page builder (layout.sections[].content) */
  function strip(html) { return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
  function hl(v) { return v && typeof v === "object" ? (v.main || "") + " " + (v.accent || "") : v || ""; }
  function layoutEntries(data, page) {
    ((data.layout || {}).sections || []).forEach(function (s) {
      if (s.hidden || !s.content) return;
      var c = s.content, url = page + "#" + s.id;
      var title = strip(hl(c.headline) || c.heading || c.eyebrow || "");
      var text = strip(c.body || c.caption || "");
      (c.cards || []).forEach(function (cd) { add(cd.title, strip(cd.text), url); });
      (c.items || []).forEach(function (it) { add(it.title, title, url); });
      (c.blocks || []).forEach(function (b) {
        var d = b.data || {};
        if (b.type === "heading") add(d.text, title, url);
        else if (b.type === "text" || b.type === "callout") text = text || strip(d.html);
        else if (b.type === "file") add(d.label, d.note || "Document", url);
      });
      if (title || text) add(title || text.slice(0, 60), text.slice(0, 160), url);
    });
  }

  async function get(path) {
    try {
      var r = await fetch(path);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  async function buildIndex() {
    if (built) return;
    built = true;
    index = [];

    var site = await get("data/site.json");
    if (site && site.name) add(site.name + " — " + (site.role || ""), "Home", "index.html#top");

    var home = await get("data/home.json");
    if (home) {
      var h = home.hero || {};
      if (h.headline) add(h.headline, h.lede || "", "index.html#top");
      (home.startHere || []).forEach(function (c) { add(c.title, c.text, "index.html#start"); });
      if (home.aboutTeaser) add("About — teaser", home.aboutTeaser, "index.html#about");
      var byId = {};
      if (typeof PROJECTS !== "undefined") {
        ["analytics", "builds"].forEach(function (cat) {
          (PROJECTS[cat] || []).forEach(function (p) { byId[p.id] = p; });
        });
      }
      (home.featured || []).forEach(function (id) {
        var p = byId[id];
        if (p) add(p.title, p.hook, "index.html#featured");
      });
    }

    var about = await get("data/about.json");
    if (about) {
      if (about.hero && about.hero.greeting) add(about.hero.greeting, about.hero.lede || "", "about.html#top");
      (about.thirties || []).forEach(function (c) { add(c.title, c.text, "about.html#thirties"); });
      (about.chapters || []).forEach(function (c) { add(c.label, c.text, "about.html#story"); });
      ["principle", "method", "proudest", "holdup"].forEach(function (k) {
        if (typeof about[k] === "string" && about[k]) add(k.charAt(0).toUpperCase() + k.slice(1), about[k], "about.html#story");
      });
      (about.toolbox || []).forEach(function (g) {
        add("Toolbox — " + g.group, (g.items || []).join(", "), "about.html#toolbox");
      });
      if (typeof about.fieldnotes === "string" && about.fieldnotes) add("Field notes", about.fieldnotes, "about.html#fieldnotes");
    }

    var writing = await get("data/writing.json");
    if (writing) {
      if (writing.headline) add(writing.headline, writing.lede || "", "writing.html#top");
      (writing.pipeline || []).forEach(function (p) { add(p.title, "In the pipeline", "writing.html#pipeline"); });
      layoutEntries(writing, "writing.html");
    }

    var posts = await get("fun/posts.json");
    if (posts) (posts.posts || []).forEach(function (p) { add(p.title, p.text, "off-the-clock.html#fun"); });

    var tiles = await get("fun/tiles.json");
    if (tiles) (tiles.tiles || []).forEach(function (t) { add(t.place, t.context, "off-the-clock.html#field"); });
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q || !index) return [];
    var words = q.split(/\s+/);
    var out = [];
    index.forEach(function (e) {
      var t = e.t.toLowerCase(), s = e.s.toLowerCase(), score = 0;
      words.forEach(function (w) {
        if (t.indexOf(w) > -1) score += 2;
        else if (s.indexOf(w) > -1) score += 1;
        else score = -99;
      });
      if (score > 0) out.push({ e: e, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, 8).map(function (r) { return r.e; });
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  var pal = null, input = null, list = null;

  function ensurePal() {
    if (pal) return;
    pal = document.createElement("div");
    pal.className = "search-pal";
    pal.innerHTML =
      '<div class="sp-backdrop"></div>' +
      '<div class="sp-box" role="dialog" aria-label="Search this site">' +
        '<input class="sp-input" type="search" placeholder="Search the site…" aria-label="Search the site">' +
        '<div class="sp-results"></div>' +
      "</div>";
    document.body.appendChild(pal);
    input = pal.querySelector(".sp-input");
    list = pal.querySelector(".sp-results");
    pal.querySelector(".sp-backdrop").addEventListener("click", close);
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pal.classList.contains("open")) close(); });
  }

  function render() {
    var hits = search(input.value);
    if (!input.value.trim()) { list.innerHTML = ""; return; }
    if (!hits.length) { list.innerHTML = '<p class="sp-empty">Nothing found — try another word.</p>'; return; }
    list.innerHTML = "";
    hits.forEach(function (e) {
      var a = document.createElement("a");
      a.className = "sp-hit";
      a.href = e.u;
      a.innerHTML = '<span class="sp-t">' + esc(e.t) + "</span>" +
        (e.s ? '<span class="sp-s">' + esc(e.s.slice(0, 140)) + "</span>" : "");
      list.appendChild(a);
    });
  }

  function open() {
    ensurePal();
    buildIndex();
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
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("nav-search");
    if (btn) btn.addEventListener("click", open);
  });
})();
