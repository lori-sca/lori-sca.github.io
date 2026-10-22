/* counter.js: visitor counting for all three sites (GoatCounter).
   Loaded by the last line of header.js, so every public page on
   lori-sca.github.io, lorisca-analytics.github.io and lorisca-builds.github.io
   is counted. The admin does not load header.js, so it is never counted.

   - Stats are private, at https://lorisca.goatcounter.com (log in to see them).
   - Each page is recorded with its site name in front, e.g.
     "lorisca-analytics.github.io/" or "lori-sca.github.io/about.html",
     so the three sites stay apart in one dashboard.
   - Admin live previews (?preview=1) and pages shown inside a frame are skipped.
   - The counter loads in the background. If it fails or is blocked, the page
     is not affected.

   To switch counting off: delete the loader line at the end of header.js. */
(function () {
  try {
    if (window.__lcCounter) return;
    window.__lcCounter = true;
    if (/[?&]preview=/.test(location.search)) return;
    if (window.top !== window.self) return;

    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = function (p) { return location.host + p; };

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://lorisca.goatcounter.com/count");
    document.head.appendChild(s);
  } catch (e) {}
})();
