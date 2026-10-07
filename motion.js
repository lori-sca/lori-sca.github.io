/* ============================================================
   motion.js — the dynamic layer for lori-sca.github.io
   Scroll reveals, cursor tilt, spring expands, count-ups,
   dark mode, sparkles, like hearts. Presentation only:
   no copy lives here. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveals ---------- */
  function reveals(scope) {
    var els = (scope || document).querySelectorAll(".reveal:not(.in)");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- cursor tilt (subtle 3D lean) ---------- */
  function tilt(scope) {
    if (reduceMotion) return;
    (scope || document).querySelectorAll(".tilt").forEach(function (card) {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg)" +
          " rotateY(" + (x * 7).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- animated expands (grid-rows spring) ----------
     Call after rendering expandable content. Wraps children once. */
  function expands(scope) {
    (scope || document).querySelectorAll(".card-detail, .stop .detail").forEach(function (d) {
      if (d.dataset.expandReady) return;
      d.dataset.expandReady = "1";
      var inner = document.createElement("div");
      inner.className = "expand-inner";
      while (d.firstChild) inner.appendChild(d.firstChild);
      d.appendChild(inner);
      d.classList.add("expandable");
    });
  }

  /* ---------- count-up numbers ---------- */
  function countUps(scope) {
    var els = (scope || document).querySelectorAll("[data-countup]");
    if (!els.length) return;
    function run(elm) {
      var target = parseFloat(elm.dataset.countup);
      var decimals = parseInt(elm.dataset.decimals || "0", 10);
      var prefix = elm.dataset.prefix || "";
      var suffix = elm.dataset.suffix || "";
      if (reduceMotion) {
        elm.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      var start = null, dur = 1100;
      function frame(t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        elm.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- dark mode ---------- */
  var MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  function paintThemeIcon() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = dark ? SUN : MOON;
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  function theme() {
    try {
      var stored = localStorage.getItem("lori-theme");
      if (stored === "dark" || stored === "light") {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch (e) {}
    paintThemeIcon();
    var btn = document.getElementById("theme-toggle");
    if (btn || !document.querySelector(".nav-inner")) return;
    var b = document.createElement("button");
    b.id = "theme-toggle";
    b.className = "theme-toggle";
    b.type = "button";
    b.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("lori-theme", next); } catch (e) {}
      paintThemeIcon();
      document.dispatchEvent(new CustomEvent("lori-theme", { detail: next }));
    });
    document.querySelector(".nav-inner").appendChild(b);
    paintThemeIcon();
  }

  /* ---------- sparkles around a hero name ---------- */
  var SPARKLE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0c.7 6.5 5.5 11.3 12 12-6.5.7-11.3 5.5-12 12-.7-6.5-5.5-11.3-12-12C6.5 11.3 11.3 6.5 12 0z"/></svg>';
  function sparkles(host) {
    if (!host || reduceMotion) return;
    setInterval(function () {
      if (document.hidden) return;
      var s = document.createElement("span");
      s.className = "sparkle";
      s.innerHTML = SPARKLE;
      var r = host.getBoundingClientRect();
      // scatter around the host's box, biased to edges
      s.style.left = (Math.random() * 110 - 5) + "%";
      s.style.top = (Math.random() * 110 - 5) + "%";
      s.style.animationDuration = (620 + Math.random() * 320) + "ms";
      host.appendChild(s);
      setTimeout(function () { s.remove(); }, 1100);
    }, 380);
  }

  /* ---------- like heart with particle bursts ---------- */
  var HEART = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.4 1-4.5 2.5C10.9 4 9.3 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/></svg>';
  function likeHeart(btn) {
    if (!btn || btn.dataset.heartBound) return;
    btn.dataset.heartBound = "1";
    var KEY = "lori-about-likes";
    var count = 0;
    try { count = parseInt(localStorage.getItem(KEY) || "0", 10) || 0; } catch (e) {}
    var GOAL = 10;
    btn.classList.add("like-heart");
    btn.innerHTML = HEART + '<span class="like-n">' + Math.min(count, GOAL) + '</span>';
    paint();
    function paint() {
      var filled = Math.min(count, GOAL) / GOAL;
      btn.style.setProperty("--fill", filled.toFixed(2));
      btn.querySelector(".like-n").textContent = Math.min(count, GOAL);
      btn.setAttribute("aria-label", "Send some love (" + Math.min(count, GOAL) + " of " + GOAL + ")");
    }
    function burst(x, y) {
      for (var i = 0; i < 8; i++) {
        var p = document.createElement("span");
        p.className = "like-particle";
        var ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
        var dist = 26 + Math.random() * 22;
        p.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
        p.style.setProperty("--dy", (Math.sin(ang) * dist).toFixed(1) + "px");
        p.style.left = x + "px";
        p.style.top = y + "px";
        btn.appendChild(p);
        (function (el) { setTimeout(function () { el.remove(); }, 700); })(p);
      }
    }
    btn.addEventListener("click", function (e) {
      count++;
      try { localStorage.setItem(KEY, String(count)); } catch (err) {}
      paint();
      var r = btn.getBoundingClientRect();
      burst(e.clientX - r.left || r.width / 2, e.clientY - r.top || r.height / 2);
      if (!reduceMotion) {
        btn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
          { duration: 280, easing: "cubic-bezier(.34,1.56,.64,1)" }
        );
      }
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    theme();
    reveals(document);
    tilt(document);
    expands(document);
    countUps(document);
    document.querySelectorAll("[data-sparkles]").forEach(sparkles);
    document.querySelectorAll("[data-like-heart]").forEach(likeHeart);
  });

  /* Public API for JSON-rendered content: call after each render. */
  window.Motion = {
    reveals: reveals,
    tilt: tilt,
    expands: expands,
    countUps: countUps,
    sparkles: sparkles,
    likeHeart: likeHeart,
    refresh: function (scope) {
      reveals(scope); tilt(scope); expands(scope); countUps(scope);
      (scope || document).querySelectorAll("[data-sparkles]").forEach(sparkles);
      (scope || document).querySelectorAll("[data-like-heart]").forEach(likeHeart);
    },
  };
})();
