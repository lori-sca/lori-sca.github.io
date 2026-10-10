/* header.js: the one shared header for all three sites.
   Loaded by every page on lori-sca.github.io, lorisca-analytics.github.io
   and lorisca-builds.github.io, right after the <nav class="nav"> markup.

   - Links, name and role line come from the main site's data/site.json
     (edited in the admin: Main site > Site links). Until that loads, the
     page's own fallback links are used, so the header never shows empty.
   - Light/dark: stored choice per site, otherwise the device setting.
     A choice is carried to the other two sites through links, then
     removed from the address by the head script.
   - Search opens search.js (loaded on first use). Press / to open.     */
(function () {
  "use strict";
  var MAIN = "https://lori-sca.github.io";
  var SITES = [MAIN, "https://lorisca-analytics.github.io", "https://lorisca-builds.github.io"];
  var KEY = "lori-theme";
  var VER = "3";
  var root = document.documentElement;

  /* ---------------- theme ---------------- */
  function stored() { try { var s = localStorage.getItem(KEY); return s === "dark" || s === "light" ? s : null; } catch (e) { return null; } }
  function deviceDark() { return !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); }
  function setTheme(t, save) {
    root.setAttribute("data-theme", t);
    if (save) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    var b = document.getElementById("lh-theme");
    if (b) b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    document.dispatchEvent(new CustomEvent("lori-theme", { detail: t }));
  }
  if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", stored() || (deviceDark() ? "dark" : "light"));
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var follow = function () { if (!stored()) setTheme(mq.matches ? "dark" : "light", false); };
    if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
  }
  /* carry a manual choice to the other two sites */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    var t = stored();
    if (!a || !t) return;
    try {
      var u = new URL(a.getAttribute("href"), location.href);
      if (u.origin === location.origin || SITES.indexOf(u.origin) < 0) return;
      u.searchParams.set("theme", t);
      a.href = u.toString();
    } catch (err) {}
  }, true);

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function abs(href) { try { return new URL(href, MAIN + "/").toString(); } catch (e) { return href; } }
  function norm(u) {
    try { var x = new URL(u, location.href); return x.origin + x.pathname.replace(/index\.html$/, "").replace(/\/$/, ""); } catch (e) { return u; }
  }
  function isCurrent(href) {
    try {
      var x = new URL(href, MAIN + "/");
      if (norm(x.toString()) === norm(location.href)) return true;
      /* a hub's home link counts for every page of that hub */
      return x.origin === location.origin && x.origin !== MAIN && (x.pathname === "/" || x.pathname === "/index.html");
    } catch (e) { return false; }
  }

  var ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
    sun: '<svg class="lh-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="lh-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>'
  };

  /* fallback data read from the page's own static header */
  function fromPage(inner) {
    var d = { name: "", role: "", nav: [] };
    var n = inner.querySelector(".wm-name, .lh-brand b"); if (n) d.name = n.textContent.trim();
    var r = inner.querySelector(".wm-role, .lh-brand span"); if (r) d.role = r.textContent.trim();
    inner.querySelectorAll(".nav-links a, .lh-links a:not(.lh-cta-m)").forEach(function (a) {
      d.nav.push({ label: a.textContent.trim(), href: a.getAttribute("href") });
    });
    return d;
  }

  var nav = document.querySelector(".nav");
  var inner = nav && nav.querySelector(".nav-inner");
  if (!inner) return;
  var fallback = fromPage(inner);

  function contactHref() {
    if (document.getElementById("contact")) return "#contact";
    var f = document.querySelector("footer");
    if (f) { if (!f.id) f.id = "contact"; return "#" + f.id; }
    return MAIN + "/about.html#contact";
  }

  function draw(site) {
    site = site || {};
    var name = site.headerName || fallback.name || site.name || "Lorisca Cessia";
    var role = site.role || fallback.role || "";
    var links = (site.nav && site.nav.length ? site.nav : fallback.nav).filter(function (l) { return l && l.label && l.href && !l.hidden; });
    var cta = site.cta || {};
    var ctaLabel = cta.label || "Get in touch";
    var ctaHref = cta.href ? abs(cta.href) : contactHref();
    if (cta.hidden) ctaLabel = "";

    var h = '<a class="lh-brand" href="' + MAIN + '/"><b>' + esc(name) + "</b>" + (role ? "<span>" + esc(role) + "</span>" : "") + "</a>";
    h += '<div class="lh-links" id="lh-links">';
    links.forEach(function (l) {
      var href = abs(l.href);
      var ext = l.newTab ? ' target="_blank" rel="noopener"' : "";
      h += '<a href="' + esc(href) + '"' + ext + (isCurrent(href) ? ' aria-current="page"' : "") + ">" + esc(l.label) + "</a>";
    });
    if (ctaLabel) h += '<a class="lh-cta-m" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + "</a>";
    h += "</div>";
    h += '<button class="lh-icon lh-search" id="nav-search" type="button" aria-label="Search all three sites (press /)" title="Search (/)">' + ICON.search + "</button>";
    h += '<button class="lh-icon lh-theme" id="lh-theme" type="button" aria-label="Switch light or dark mode">' + ICON.sun + ICON.moon + "</button>";
    h += '<button class="lh-icon lh-menu" id="lh-menu" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="lh-links">' + ICON.menu + "</button>";
    if (ctaLabel) h += '<a class="lh-cta" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + "</a>";

    inner.className = "nav-inner lh lh-ready";
    inner.innerHTML = h;
    wire();
    fit();
  }

  /* ---------------- fit: keep the links in the bar whenever they fit ----------------
     Tries, in order: everything; no role line; no role line and no button;
     then moves the links into the menu button.                              */
  var LEVELS = ["", "lh-fit-1", "lh-fit-2", "lh-menu-mode"];
  function needed() {
    var cs = getComputedStyle(inner);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var w = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), n = 0;
    Array.prototype.forEach.call(inner.children, function (c) {
      var s = getComputedStyle(c);
      if (s.display === "none" || s.position === "absolute") return;
      n++;
      if (c.classList.contains("lh-brand")) {
        var parts = Array.prototype.filter.call(c.children, function (x) { return getComputedStyle(x).display !== "none"; });
        w += Math.max.apply(null, parts.map(function (x) { return x.scrollWidth; }).concat([0]));
      } else w += c.scrollWidth;
    });
    return w + gap * Math.max(n - 1, 0) + 24; /* 24px breathing room */
  }
  function fit() {
    if (!inner.classList.contains("lh-ready")) return;
    var avail = inner.clientWidth;
    for (var i = 0; i < LEVELS.length; i++) {
      LEVELS.forEach(function (c) { if (c) inner.classList.remove(c); });
      if (LEVELS[i]) inner.classList.add(LEVELS[i]);
      if (i === LEVELS.length - 1 || needed() <= avail) break;
    }
    if (!inner.classList.contains("lh-menu-mode")) nav.classList.remove("lh-open");
  }
  var fitTimer = null;
  function refit() { clearTimeout(fitTimer); fitTimer = setTimeout(fit, 60); }
  if (window.ResizeObserver) new ResizeObserver(refit).observe(nav); else window.addEventListener("resize", refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  function wire() {
    var tb = document.getElementById("lh-theme");
    tb.setAttribute("aria-label", root.getAttribute("data-theme") === "dark" ? "Switch to light mode" : "Switch to dark mode");
    tb.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true); });
    var mb = document.getElementById("lh-menu");
    mb.addEventListener("click", function () {
      var open = !nav.classList.contains("lh-open");
      nav.classList.toggle("lh-open", open);
      mb.setAttribute("aria-expanded", open ? "true" : "false");
      mb.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.getElementById("lh-links").addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("lh-open"); mb.setAttribute("aria-expanded", "false"); }
    });
    document.getElementById("nav-search").addEventListener("click", openSearch);
  }

  /* ---------------- search ---------------- */
  var searchLoading = null;
  function openSearch() {
    if (window.LCSearch) { window.LCSearch.open(); return; }
    if (!searchLoading) {
      searchLoading = new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = MAIN + "/search.js?v=" + VER;
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    searchLoading.then(function () { if (window.LCSearch) window.LCSearch.open(); }).catch(function () { searchLoading = null; });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("lh-open")) { nav.classList.remove("lh-open"); return; }
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault(); openSearch();
  });

  /* ---------------- draw: fallback now, live data when it arrives ---------------- */
  draw(null);
  var preview = (typeof window.lcPreviewData === "function" && location.origin === MAIN) ? window.lcPreviewData("data/site.json") : null;
  if (preview) { draw(preview); return; }
  fetch(MAIN + "/data/site.json", { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (site) { if (site) draw(site); })
    .catch(function () {});
})();
