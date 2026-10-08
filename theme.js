/* ============================================================
   theme.js — DESIGN LAYER. Draws each section type from skeleton.js.

   A redesign rewrites this file and theme.css (and styles.css).
   It must keep reading the same field names from skeleton.js, so
   the admin and all content keep working untouched.

   Entry point:
     Theme.renderPage(mainEl, data, { site })
       data  the page JSON (with data.layout.sections)
       site  data/site.json (for the contact buttons)
   ============================================================ */
(function (root) {
  "use strict";
  const S = root.Skeleton;

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = text;
    return e;
  }
  function has(v) {
    if (v == null) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.values(v).some(has);
    return true;
  }
  function headline(tag, v, cls) {
    const e = h(tag, cls);
    if (typeof v === "string") { e.textContent = v; return e; }
    let main = (v && v.main) || "";
    // keep a space between the two parts even if it wasn't typed
    if (main && v.accent && !/\s$/.test(main) && !/^[\s.,!?:;]/.test(v.accent)) main += " ";
    e.appendChild(document.createTextNode(main));
    if (v && v.accent) e.appendChild(h("em", "", v.accent));
    return e;
  }
  function rich(html, cls) {
    const d = h("div", "lc-rich" + (cls ? " " + cls : ""));
    d.innerHTML = S.sanitize(html || "");
    return d;
  }
  function img(src, alt) {
    const i = document.createElement("img");
    i.src = src; i.alt = alt || ""; i.loading = "lazy";
    return i;
  }
  function link(a, href) {
    const safe = S.safeHref(href);
    a.href = safe || "#";
    if (/^https?:/i.test(safe)) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  /* ---------- embeds: known services play inline, the rest become link cards ---------- */
  function embedSrc(url) {
    let u;
    try { u = new URL(url); } catch (e) { return null; }
    const host = u.hostname.replace(/^www\./, "");
    let m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/))) return { src: "https://www.youtube.com/embed/" + m[1] };
    if (host === "vimeo.com" && (m = u.pathname.match(/^\/(\d+)/))) return { src: "https://player.vimeo.com/video/" + m[1] };
    if (host === "loom.com" && (m = u.pathname.match(/^\/(?:share|embed)\/([\w-]+)/))) return { src: "https://www.loom.com/embed/" + m[1] };
    if (host === "public.tableau.com" && /^\/(app\/profile\/[^/]+\/)?viz\/|^\/views\//.test(u.pathname)) {
      const path = u.pathname.replace(/^\/app\/profile\/[^/]+\/viz\//, "/views/");
      return { src: "https://public.tableau.com" + path + "?:showVizHome=no&:embed=true", tall: true };
    }
    if (host === "docs.google.com" && (m = u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]+)/))) {
      const end = m[1] === "presentation" ? "/embed" : "/preview";
      return { src: "https://docs.google.com/" + m[1] + "/d/" + m[2] + end, tall: m[1] !== "presentation" };
    }
    if (host === "drive.google.com" && (m = u.pathname.match(/^\/file\/d\/([\w-]+)/))) return { src: "https://drive.google.com/file/d/" + m[1] + "/preview", tall: true };
    if (host === "figma.com" && /^\/(file|design|proto|board)\//.test(u.pathname)) return { src: "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(url) };
    if (host === "open.spotify.com" && (m = u.pathname.match(/^\/(track|episode|show|playlist|album)\/(\w+)/))) return { src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2], short: true };
    return null;
  }
  function embed(url, caption) {
    if (!has(url)) return null;
    const fig = h("figure", "lc-embed");
    const e = embedSrc(String(url).trim());
    if (e) {
      const box = h("div", "lc-embed-box" + (e.tall ? " tall" : "") + (e.short ? " short" : ""));
      const fr = document.createElement("iframe");
      fr.src = e.src; fr.loading = "lazy"; fr.allowFullscreen = true;
      fr.referrerPolicy = "strict-origin-when-cross-origin";
      fr.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      fr.title = caption || "Embedded content";
      box.appendChild(fr);
      fig.appendChild(box);
    } else {
      let hostName = url;
      try { hostName = new URL(url).hostname.replace(/^www\./, ""); } catch (er) {}
      const a = link(h("a", "embed-card"), url);
      a.appendChild(h("span", "", "🔗"));
      a.appendChild(h("span", "", hostName));
      fig.appendChild(a);
    }
    if (has(caption)) fig.appendChild(h("figcaption", "", caption));
    return fig;
  }

  /* ---------- shared pieces ---------- */
  function sectionHead(c) {
    if (!has(c.eyebrow) && !has(c.headline) && !has(c.side)) return null;
    const head = h("div", "section-head");
    const main = h("div", "sh-main");
    if (has(c.eyebrow)) main.appendChild(h("span", "eyebrow", c.eyebrow));
    if (has(c.headline)) main.appendChild(headline("h2", c.headline));
    head.appendChild(main);
    if (has(c.side)) head.appendChild(h("p", "sh-side", c.side));
    return head;
  }
  function buttons(list) {
    const items = (list || []).filter((b) => b && (b.label || b.href));
    if (!items.length) return null;
    const row = h("div", "cta-row lc-buttons");
    items.forEach((b, i) => {
      const a = link(h("a", "btn " + (b.primary || (b.primary == null && i === 0) ? "primary" : "ghost"), b.label || b.href), b.href);
      row.appendChild(a);
    });
    return row;
  }
  /* the picture + links any older section can carry (same markup as before) */
  function media(c) {
    const frag = document.createDocumentFragment();
    if (has(c.image)) {
      const fig = h("figure", "sec-media");
      fig.appendChild(img(c.image, c.imageAlt));
      if (has(c.imageCaption)) fig.appendChild(h("figcaption", "", c.imageCaption));
      frag.appendChild(fig);
    }
    const links = (c.links || []).filter((l) => l && (l.label || l.href));
    if (links.length) {
      const row = h("div", "sec-links");
      links.forEach((l) => {
        const a = link(h("a", "text-link", (l.label || l.href || "Link") + " →"), l.href);
        if (l.newTab) { a.target = "_blank"; a.rel = "noopener"; }
        row.appendChild(a);
      });
      frag.appendChild(row);
    }
    return frag;
  }

  /* outer frame: background, spacing, width, alignment */
  function frame(section, baseClass) {
    const bg = S.look(section, "background");
    const cls = ["lc", "lc-" + section.type, baseClass || (bg === "none" ? "section" : "band")];
    if (bg === "dark") cls.push("lc-dark");
    if (bg !== "none" && baseClass) cls.push("lc-bg-" + bg);
    cls.push("lc-sp-" + S.look(section, "spacing"));
    cls.push("lc-al-" + S.look(section, "align"));
    const el = h("section", cls.join(" "));
    el.id = section.id;
    const wrap = h("div", "wrap lc-w-" + S.look(section, "width"));
    el.appendChild(wrap);
    return { el: el, wrap: wrap };
  }

  /* ---------- one renderer per section type ---------- */
  const R = {};
  R["page-header"] = (s, c) => {
    const f = frame(s, "page-hero");
    f.wrap.appendChild(media(c));
    if (has(c.eyebrow)) f.wrap.appendChild(h("span", "eyebrow", c.eyebrow));
    f.wrap.appendChild(headline("h1", c.headline || ""));
    if (has(c.lede)) f.wrap.appendChild(h("p", "lede", c.lede));
    const b = buttons(c.buttons); if (b) f.wrap.appendChild(b);
    return f.el;
  };
  R["text"] = (s, c) => {
    const f = frame(s);
    const head = sectionHead(c); if (head) f.wrap.appendChild(head);
    if (has(c.body)) f.wrap.appendChild(rich(c.body));
    const b = buttons(c.buttons); if (b) f.wrap.appendChild(b);
    return f.el;
  };
  R["media-text"] = (s, c) => {
    const f = frame(s);
    const grid = h("div", "lc-mt" + (c.imageSide === "left" ? " lc-mt-left" : ""));
    const txt = h("div", "lc-mt-text");
    if (has(c.eyebrow)) txt.appendChild(h("span", "eyebrow", c.eyebrow));
    if (has(c.headline)) txt.appendChild(headline("h2", c.headline, "lc-h2"));
    if (has(c.body)) txt.appendChild(rich(c.body));
    const b = buttons(c.buttons); if (b) txt.appendChild(b);
    const fig = h("figure", "lc-mt-media");
    if (has(c.image)) fig.appendChild(img(c.image, c.imageAlt));
    grid.appendChild(fig); grid.appendChild(txt);
    f.wrap.appendChild(grid);
    return f.el;
  };
  R["cards"] = (s, c) => {
    const f = frame(s);
    const head = sectionHead(c); if (head) f.wrap.appendChild(head);
    const grid = h("div", "card-grid cols-" + S.look(s, "columns"));
    (c.cards || []).forEach((cd) => {
      const card = h("article", "card");
      if (has(cd.image)) { const v = h("div", "card-visual"); v.appendChild(img(cd.image, cd.imageAlt)); card.appendChild(v); }
      const body = h("div", "card-body");
      if (has(cd.title)) body.appendChild(h("h3", "card-h", cd.title));
      if (has(cd.text)) body.appendChild(rich(cd.text, "card-hook"));
      if (has(cd.href)) body.appendChild(link(h("a", "text-link", (cd.linkLabel || "Open") + " →"), cd.href));
      card.appendChild(body);
      grid.appendChild(card);
    });
    f.wrap.appendChild(grid);
    return f.el;
  };
  R["gallery"] = (s, c) => {
    const f = frame(s);
    const head = sectionHead(c); if (head) f.wrap.appendChild(head);
    const grid = h("div", "lc-gallery cols-" + S.look(s, "columns"));
    (c.images || []).filter((i) => has(i.src)).forEach((i) => {
      const fig = h("figure", "");
      fig.appendChild(img(i.src, i.alt));
      if (has(i.caption)) fig.appendChild(h("figcaption", "", i.caption));
      grid.appendChild(fig);
    });
    f.wrap.appendChild(grid);
    return f.el;
  };
  R["embed"] = (s, c) => {
    const f = frame(s);
    const head = sectionHead(c); if (head) f.wrap.appendChild(head);
    const e = embed(c.url, c.caption); if (e) f.wrap.appendChild(e);
    return f.el;
  };
  R["list"] = (s, c) => {
    const f = frame(s);
    f.wrap.appendChild(media(c));
    const box = h("div", "pipeline-index");
    box.style.marginTop = "0";
    if (has(c.heading)) box.appendChild(h("p", "pipe-head", c.heading));
    if (has(c.note)) box.appendChild(h("p", "pipe-note", c.note));
    const rows = h("div", "");
    (c.items || []).forEach((t) => {
      const row = h("div", "pipe-row");
      const title = h("span", "pipe-title");
      if (has(t.link)) title.appendChild(link(h("a", "", t.title), t.link));
      else title.textContent = t.title || "";
      row.appendChild(title);
      row.appendChild(h("span", "pipe-status", t.status || c.statusLabel || ""));
      rows.appendChild(row);
    });
    box.appendChild(rows);
    f.wrap.appendChild(box);
    return f.el;
  };
  R["contact"] = (s, c, ctx) => {
    const f = frame(s);
    const head = sectionHead(c); if (head) f.wrap.appendChild(head);
    f.wrap.appendChild(media(c));
    const row = h("div", "cta-row");
    row.id = "contact-row";
    row.style.marginTop = "0";
    const site = (ctx && ctx.site) || {};
    [["Email", site.email ? "mailto:" + site.email : ""], ["LinkedIn", site.linkedin], ["GitHub", site.github]].forEach(([label, href]) => {
      if (!href) return;
      const a = h("a", "btn ghost", label);
      a.href = href; a.target = "_blank"; a.rel = "noopener";
      row.appendChild(a);
    });
    f.wrap.appendChild(row);
    return f.el;
  };
  R["free"] = (s, c) => {
    const f = frame(s);
    const stack = h("div", "lc-blocks");
    (c.blocks || []).forEach((b) => { const n = block(b); if (n) stack.appendChild(n); });
    f.wrap.appendChild(stack);
    return f.el;
  };

  /* ---------- blocks ---------- */
  function block(b) {
    const d = b.data || {};
    switch (b.type) {
      case "text": return has(d.html) ? rich(d.html, "lc-size-" + (d.size || "M")) : null;
      case "heading": {
        if (!has(d.text)) return null;
        const tag = { large: "h2", medium: "h3", small: "h4" }[d.level || "medium"] || "h3";
        return h(tag, "lc-heading lc-heading-" + (d.level || "medium"), d.text);
      }
      case "image": {
        if (!has(d.src)) return null;
        const fig = h("figure", "lc-img lc-img-" + (d.width || "full"));
        const i = img(d.src, d.alt);
        if (has(d.href)) { const a = link(h("a", ""), d.href); a.appendChild(i); fig.appendChild(a); }
        else fig.appendChild(i);
        if (has(d.caption)) fig.appendChild(h("figcaption", "", d.caption));
        return fig;
      }
      case "embed": return embed(d.url, d.caption);
      case "buttons": return buttons(d.buttons);
      case "quote": {
        if (!has(d.text)) return null;
        const q = h("blockquote", "lc-quote");
        q.appendChild(h("p", "", d.text));
        if (has(d.cite)) q.appendChild(h("cite", "", d.cite));
        return q;
      }
      case "callout": return has(d.html) ? rich(d.html, "lc-callout") : null;
      case "file": {
        if (!has(d.url)) return null;
        const a = link(h("a", "lc-file"), d.url);
        const ext = (String(d.url).split("?")[0].match(/\.([a-z0-9]{2,5})$/i) || [, ""])[1].toUpperCase();
        a.appendChild(h("span", "lc-file-kind", ext || "LINK"));
        const t = h("span", "lc-file-text");
        t.appendChild(h("span", "lc-file-label", d.label || d.url));
        if (has(d.note)) t.appendChild(h("span", "lc-file-note", d.note));
        a.appendChild(t);
        a.appendChild(h("span", "lc-file-arrow", "→"));
        return a;
      }
      case "divider": return h("hr", "lc-divider");
      case "spacer": return h("div", "lc-spacer lc-spacer-" + (d.size || "medium"));
      default: return null;
    }
  }

  /* ---------- page ---------- */
  function renderPage(main, data, ctx) {
    const sections = ((data.layout || {}).sections || []).filter((s) => !s.hidden && R[s.type]);
    main.innerHTML = "";
    sections.forEach((s) => {
      try { main.appendChild(R[s.type](s, S.read(data, s), ctx || {})); }
      catch (e) { console.error("Section " + s.id + " couldn't draw:", e); }
    });
    if (root.Motion && root.Motion.refresh) root.Motion.refresh(main);
  }
  function menu(data) {
    return ((data.layout || {}).sections || [])
      .filter((s) => !s.hidden && s.menu)
      .map((s) => ({ label: s.menu, href: "#" + s.id }));
  }

  root.Theme = { renderPage: renderPage, menu: menu, embedSrc: embedSrc };
})(window);
