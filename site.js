/* site.js — renders content.js into the pages. No copy lives here. */

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/* Mounts an editor-added picture + links for a section.
   Renders nothing when both are empty. Safe to call on re-render. */
function mountSectionMedia(sectionId, sec) {
  const section = document.getElementById(sectionId);
  if (!section || !sec) return;
  section.querySelectorAll(".sec-media, .sec-links").forEach((e) => e.remove());
  const image = (sec.image || "").trim();
  const links = (sec.links || []).filter((l) => l && (l.label || l.href));
  if (!image && !links.length) return;
  const frag = document.createDocumentFragment();
  if (image) {
    const fig = document.createElement("figure");
    fig.className = "sec-media";
    const img = document.createElement("img");
    img.src = image;
    img.alt = sec.imageAlt || "";
    img.loading = "lazy";
    fig.appendChild(img);
    if (sec.imageCaption) {
      const cap = document.createElement("figcaption");
      cap.textContent = sec.imageCaption;
      fig.appendChild(cap);
    }
    frag.appendChild(fig);
  }
  if (links.length) {
    const row = document.createElement("div");
    row.className = "sec-links";
    links.forEach((l) => {
      const a = document.createElement("a");
      a.className = "text-link";
      a.href = l.href || "#";
      a.textContent = (l.label || l.href || "Link") + " \u2192";
      if (l.newTab || /^https?:/.test(a.href)) { a.target = "_blank"; a.rel = "noopener"; }
      row.appendChild(a);
    });
    frag.appendChild(row);
  }
  const head = section.querySelector(".section-head");
  if (head) head.after(frag);
  else {
    const wrap = section.querySelector(".wrap");
    if (wrap) wrap.prepend(frag);
    else section.prepend(frag);
  }
}

/* ---------- data-driven copy helpers ---------- */
function setText(id, v) {
  const e = document.getElementById(id);
  if (e && v != null) e.textContent = v;
}
/* A headline may be a plain string or {main, accent} — the accent renders in <em>. */
function setHeadline(elm, h) {
  if (!elm || h == null) return;
  elm.innerHTML = "";
  if (typeof h === "string") { elm.textContent = h; return; }
  elm.appendChild(document.createTextNode(h.main || ""));
  if (h.accent) {
    const em = document.createElement("em");
    em.textContent = h.accent;
    elm.appendChild(em);
  }
}
function setMeta(meta) {
  if (!meta) return;
  if (meta.title) document.title = meta.title;
  const md = document.querySelector('meta[name="description"]');
  if (md && meta.description) md.setAttribute("content", meta.description);
}
function renderSubnav(items) {
  const sn = document.querySelector(".subnav-inner");
  if (!sn || !items || !items.length) return;
  sn.innerHTML = "";
  items.forEach((s) => {
    const a = document.createElement("a");
    a.href = s.href;
    a.textContent = s.label;
    sn.appendChild(a);
  });
}

function linkRow(links) {
  const row = el("div", "card-links");
  links.forEach((l) => {
    const a = el("a", "", esc(l.label));
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    row.appendChild(a);
  });
  return row;
}

function cardNode(p) {
  const card = el("article", "card");
  card.id = "card-" + p.id;

  const vis = el("div", "card-visual");
  const img = document.createElement("img");
  img.src = p.visual;
  img.alt = p.visualAlt || p.title;
  img.loading = "lazy";
  vis.appendChild(img);
  card.appendChild(vis);

  const body = el("div", "card-body");
  body.appendChild(el("span", "badge", p.status === "live" ? "Live" : "Building"));
  body.appendChild(el("h3", "card-h", esc(p.title)));
  body.appendChild(el("p", "card-hook", esc(p.hook)));
  body.appendChild(el("p", "card-metric", esc(p.metric)));
  body.appendChild(linkRow(p.links));
  card.appendChild(body);

  const toggle = el("button", "card-toggle", "Showcase ＋");
  toggle.setAttribute("aria-expanded", "false");
  toggle.addEventListener("click", () => {
    const open = card.classList.toggle("open");
    toggle.textContent = open ? "Showcase －" : "Showcase ＋";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  card.appendChild(toggle);

  const detail = el("div", "card-detail");
  if (p.diagram) {
    const d = document.createElement("img");
    d.className = "diagram";
    d.src = p.diagram;
    d.alt = p.diagramAlt || (p.title + " diagram");
    d.loading = "lazy";
    detail.appendChild(d);
  }
  const rows = [
    ["Problem", p.body.problem],
    ["Approach", p.body.approach],
    ["Hers", p.body.hers],
    ["Result", p.body.result],
    ["Lesson", p.body.lesson],
  ];
  rows.forEach(([k, v]) => {
    const r = el("div", "detail-row");
    r.appendChild(el("span", "k", k));
    r.appendChild(el("span", "v", esc(v)));
    detail.appendChild(r);
  });
  detail.appendChild(linkRow(p.links));
  card.appendChild(detail);

  return card;
}

function renderCards(containerId, projects, cols) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const live = projects.filter((p) => p.status === "live");
  if (!live.length) {
    c.innerHTML = "";
    return;
  }
  c.classList.add("card-grid", cols || "cols-2");
  live.forEach((p) => c.appendChild(cardNode(p)));
}

function renderRoute(containerId, stops) {
  const c = document.getElementById(containerId);
  if (!c || !stops) return;
  const wrap = el("div", "route");
  stops.forEach((s) => {
    const stop = el("div", "stop" + (s.now ? " now" : ""));
    const btn = document.createElement("button");
    btn.innerHTML =
      '<span class="when">' + esc(s.when) + "</span>" +
      '<div class="where">' + esc(s.where) + "</div>" +
      '<div class="role">' + esc(s.role) + "</div>" +
      '<span class="stop-toggle" aria-hidden="true"><span class="st-plus">+</span><span class="st-word">details</span></span>';
    const det = el("div", "detail");
    const ul = document.createElement("ul");
    s.detail.forEach((d) => ul.appendChild(el("li", "", esc(d))));
    det.appendChild(ul);
    btn.appendChild(det);
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const open = stop.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      const w = btn.querySelector(".st-word");
      if (w) w.textContent = open ? "less" : "details";
    });
    stop.appendChild(btn);
    wrap.appendChild(stop);
  });
  c.appendChild(wrap);
}

/* Nav active state */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("active");
  });
  // footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});

/* ---------- data-driven pages: shared helpers ---------- */

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error("missing " + path);
  return r.json();
}

function prettyDate(iso) {
  const d = new Date(String(iso) + "T12:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* Embed block: YouTube plays inline, anything else becomes a link card. */
function embedNode(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) {
    const wrap = el("div", "embed-video");
    const fr = document.createElement("iframe");
    fr.src = "https://www.youtube.com/embed/" + m[1];
    fr.loading = "lazy";
    fr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    fr.allowFullscreen = true;
    wrap.appendChild(fr);
    return wrap;
  }
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch (e) {}
  const a = el("a", "embed-card");
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  const ic = el("span", "", "🔗");
  const tx = el("span", "", esc(host));
  a.appendChild(ic); a.appendChild(tx);
  return a;
}

function renderContactRow(site) {
  const cr = document.getElementById("contact-row");
  if (!cr || !site) return;
  cr.innerHTML = "";
  [
    { label: "Email", href: "mailto:" + site.email },
    { label: "LinkedIn", href: site.linkedin },
    { label: "GitHub", href: site.github },
  ].forEach((c) => {
    const a = el("a", "btn ghost", esc(c.label));
    a.href = c.href; a.target = "_blank"; a.rel = "noopener";
    cr.appendChild(a);
  });
}

/* Fills nav wordmark, footer, and contact buttons from data/site.json.
   Static HTML stays as the no-JS fallback; this overwrites with live data. */
function applySiteChrome(site) {
  if (!site) return;
  document.querySelectorAll(".wm-name").forEach((e) => { e.textContent = site.name; });
  document.querySelectorAll(".wm-role").forEach((e) => { e.textContent = site.role; });
  const nl = document.querySelector(".nav-links");
  if (nl && site.nav && site.nav.length) {
    nl.innerHTML = "";
    site.nav.forEach((n) => {
      const a = el("a", "", esc(n.label));
      a.href = n.href;
      if (n.key) a.dataset.nav = n.key;
      nl.appendChild(a);
    });
  }
  const fl = document.querySelector(".foot-links");
  if (fl) {
    fl.innerHTML = "";
    [
      [site.name, "https://lori-sca.github.io", false],
      ["Analytics Work", "https://lorisca-analytics.github.io", false],
      ["Builds", "https://lorisca-builds.github.io", false],
      ["About", "https://lori-sca.github.io/about.html", false],
      ["Email", "mailto:" + site.email, false],
      ["LinkedIn", site.linkedin, true],
      ["GitHub", site.github, true],
    ].forEach(([label, href, ext]) => {
      const a = el("a", "", esc(label));
      a.href = href;
      if (ext) { a.target = "_blank"; a.rel = "noopener"; }
      fl.appendChild(a);
    });
  }
  const fine = document.querySelector(".site-footer .fine");
  if (fine) fine.innerHTML = "&copy; " + new Date().getFullYear() + " " + esc(site.name);
  const em = document.getElementById("nc-email");
  if (em) em.href = "mailto:" + site.email;
  const li = document.getElementById("nc-linkedin");
  if (li) li.href = site.linkedin;
  const gh = document.getElementById("nc-github");
  if (gh) gh.href = site.github;
  renderContactRow(site);
}
