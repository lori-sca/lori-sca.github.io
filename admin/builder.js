/* ============================================================
   admin/builder.js — the page builder.

   Every form here is generated from ../skeleton.js. Nothing in this
   file knows what a page looks like: it only knows section types and
   their fields. That is what keeps editing stable through redesigns.

   Uses globals from admin/index.html: lab, status, h2card, loadData,
   saveData, uploadPhoto, currentSite, SITES.
   ============================================================ */
(function () {
  "use strict";
  const SK = window.Skeleton;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function btn(text, cls, onClick, title) {
    const b = el("button", cls || "ed-link", text);
    b.type = "button";
    if (title) b.title = title;
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  /* show site-relative pictures correctly from inside /admin/ */
  function srcFor(u) {
    u = String(u || "");
    if (!u || /^(https?:|data:|blob:)/.test(u)) return u;
    if (currentSite.id === "main") return "../" + u.replace(/^\//, "");
    return currentSite.home.replace(/\/$/, "") + "/" + u.replace(/^\//, "");
  }

  /* ---------------- live preview (one shared panel) ---------------- */
  const Preview = {
    on: false, frame: null, url: null, payload: null, timer: null,
    attach(url, payloadFn) { this.url = url; this.payload = payloadFn; if (this.on) this.load(); },
    toggle() { this.on ? this.close() : this.open(); },
    open() {
      if (!this.url) return;
      this.on = true;
      document.body.classList.add("ed-preview-on");
      let pane = document.getElementById("ed-preview");
      if (!pane) {
        pane = el("aside", "");
        pane.id = "ed-preview";
        const bar = el("div", "ed-preview-bar");
        bar.appendChild(el("span", "", "Live preview · shows unsaved edits · nothing is public until you save"));
        bar.appendChild(btn("Close", "ed-link", () => this.close()));
        pane.appendChild(bar);
        this.frame = document.createElement("iframe");
        this.frame.title = "Live preview";
        pane.appendChild(this.frame);
        document.body.appendChild(pane);
        this.frame.addEventListener("load", () => this.send());
      }
      pane.hidden = false;
      this.load();
      document.querySelectorAll("[data-preview-toggle]").forEach((b) => { b.textContent = "Hide live preview"; });
    },
    load() { if (this.frame) this.frame.src = this.url + (this.url.indexOf("?") < 0 ? "?" : "&") + "preview=1"; },
    close() {
      this.on = false;
      document.body.classList.remove("ed-preview-on");
      const pane = document.getElementById("ed-preview");
      if (pane) pane.hidden = true;
      document.querySelectorAll("[data-preview-toggle]").forEach((b) => { b.textContent = "Show live preview"; });
    },
    changed() {
      if (!this.on) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.send(), 700);
    },
    origin() { try { return new URL(this.url, location.href).origin; } catch (e) { return location.origin; } },
    async send() {
      if (!this.on || !this.frame || !this.payload) return;
      try {
        const p = await this.payload();
        this.frame.contentWindow.postMessage({ type: "lc-preview", files: clone(p.files) }, this.origin());
      } catch (e) { /* preview is best effort */ }
    },
  };
  window.BuilderPreview = Preview;
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "lc-preview-ready" && (e.origin === location.origin || e.origin === Preview.origin())) Preview.send();
  });

  /* ---------------- formatted-text editor ---------------- */
  function richEditor(host, value, onChange) {
    const wrap = el("div", "ed-rich-wrap");
    const bar = el("div", "ed-rich-bar");
    const area = el("div", "ed-rich");
    area.contentEditable = "true";
    area.innerHTML = SK.sanitize(value || "");
    const emit = () => onChange(SK.sanitize(area.innerHTML));
    const cmd = (c, v) => { area.focus(); document.execCommand(c, false, v); emit(); };
    [
      ["B", "Bold", () => cmd("bold"), "b"],
      ["I", "Italic", () => cmd("italic"), "i"],
      ["Link", "Add or change a link on the selected words", () => {
        const url = prompt("Link address (https://…). Leave empty to remove the link.");
        if (url === null) return;
        if (url.trim() === "") cmd("unlink"); else cmd("createLink", url.trim());
      }],
      ["H", "Sub-heading", () => cmd("formatBlock", "h3")],
      ["• List", "Bullet list", () => cmd("insertUnorderedList")],
      ["1. List", "Numbered list", () => cmd("insertOrderedList")],
      ["“ Quote", "Quote", () => cmd("formatBlock", "blockquote")],
      ["¶", "Back to a normal paragraph", () => cmd("formatBlock", "p")],
      ["Clear", "Remove bold, italic and links from the selection", () => { cmd("removeFormat"); cmd("unlink"); }],
    ].forEach(([label, title, fn, tag]) => {
      const b = btn(label, "ed-rich-btn", null, title);
      if (tag) b.style.fontWeight = tag === "b" ? "800" : "500";
      if (tag === "i") b.style.fontStyle = "italic";
      b.addEventListener("mousedown", (e) => { e.preventDefault(); fn(); });
      bar.appendChild(b);
    });
    area.addEventListener("focus", () => { try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {} });
    area.addEventListener("input", emit);
    area.addEventListener("paste", (e) => {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");
      const safe = html ? SK.sanitize(html)
        : text.split(/\n{2,}/).map((p) => "<p>" + p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>") + "</p>").join("");
      document.execCommand("insertHTML", false, safe);
      emit();
    });
    wrap.appendChild(bar);
    wrap.appendChild(area);
    host.appendChild(wrap);
  }

  /* ---------------- picture field ---------------- */
  function imageField(host, value, onChange, tag) {
    const box = el("div", "ed-img-field");
    const pv = el("img", "ed-photo-preview");
    const setPv = (v) => { if (v) { pv.src = srcFor(v); pv.hidden = false; } else { pv.hidden = true; pv.removeAttribute("src"); } };
    setPv(value);
    const url = el("input", "ed-input");
    url.placeholder = "Paste a picture link, or upload below";
    url.value = value || "";
    url.addEventListener("input", () => { onChange(url.value.trim()); setPv(url.value.trim()); });
    const row = el("div", "ed-img-row");
    const fi = el("input", "");
    fi.type = "file"; fi.accept = "image/*";
    fi.addEventListener("change", async () => {
      const file = fi.files[0];
      if (!file) return;
      try {
        status("Uploading picture…");
        const safe = file.name.replace(/[^a-zA-Z0-9.\-]/g, "-").replace(/\.[^.]+$/, "");
        const path = "assets/sections/" + (tag || "pic") + "-" + Date.now() + "-" + safe + ".jpg";
        await uploadPhoto(path, file, "Add picture via page builder");
        url.value = path; onChange(path); setPv(path);
        status("Picture uploaded. Save the page to use it.");
        url.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (e) { status(e.message, false); }
      fi.value = "";
    });
    row.appendChild(fi);
    row.appendChild(btn("Remove picture", "ed-link danger", () => { url.value = ""; onChange(""); setPv(""); url.dispatchEvent(new Event("change", { bubbles: true })); }));
    box.appendChild(pv);
    box.appendChild(url);
    box.appendChild(row);
    host.appendChild(box);
  }

  /* ---------------- sortable list (drag handle + arrows) ---------------- */
  function sortable(host, items, opts) {
    const wrap = el("div", "ed-sortable");
    host.appendChild(wrap);
    let dragFrom = null;
    function render() {
      wrap.innerHTML = "";
      items.forEach((item, idx) => {
        const row = el("div", "ed-sort-item");
        const head = el("div", "ed-sort-head");
        const handle = el("span", "ed-handle", "⋮⋮");
        handle.title = "Drag to move";
        handle.addEventListener("mousedown", () => {
          row.draggable = true;
          document.addEventListener("mouseup", () => { row.draggable = false; }, { once: true });
        });
        row.addEventListener("dragstart", (e) => {
          if (e.target !== row) return; // a nested list is being dragged, not this row
          e.stopPropagation();
          dragFrom = idx; row.classList.add("dragging"); e.dataTransfer.effectAllowed = "move";
          try { e.dataTransfer.setData("text/plain", String(idx)); } catch (er) {}
        });
        row.addEventListener("dragend", () => { dragFrom = null; row.draggable = false; row.classList.remove("dragging"); wrap.querySelectorAll(".drop-before,.drop-after").forEach((x) => x.classList.remove("drop-before", "drop-after")); });
        row.addEventListener("dragover", (e) => {
          if (dragFrom == null) return;
          e.preventDefault();
          const r = row.getBoundingClientRect();
          const after = e.clientY > r.top + r.height / 2;
          row.classList.toggle("drop-after", after);
          row.classList.toggle("drop-before", !after);
        });
        row.addEventListener("dragleave", () => row.classList.remove("drop-before", "drop-after"));
        row.addEventListener("drop", (e) => {
          if (dragFrom == null) return;
          e.preventDefault();
          e.stopPropagation();
          const r = row.getBoundingClientRect();
          let to = e.clientY > r.top + r.height / 2 ? idx + 1 : idx;
          const [moved] = items.splice(dragFrom, 1);
          if (dragFrom < to) to--;
          items.splice(to, 0, moved);
          dragFrom = null;
          render(); opts.onChange();
        });
        head.appendChild(handle);
        const title = el("button", "ed-sort-title");
        title.type = "button";
        const t = opts.title(item, idx);
        title.appendChild(el("span", "ed-sort-kind", t.kind || ""));
        title.appendChild(el("span", "ed-sort-sum", t.summary || ""));
        (t.badges || []).forEach((bd) => title.appendChild(el("span", "ed-badge", bd)));
        head.appendChild(title);
        const tools = el("div", "ed-sort-tools");
        const up = btn("↑", "ed-link", () => { items.splice(idx - 1, 0, items.splice(idx, 1)[0]); render(); opts.onChange(); }, "Move up");
        up.disabled = idx === 0;
        const down = btn("↓", "ed-link", () => { items.splice(idx + 1, 0, items.splice(idx, 1)[0]); render(); opts.onChange(); }, "Move down");
        down.disabled = idx === items.length - 1;
        tools.appendChild(up); tools.appendChild(down);
        (opts.tools ? opts.tools(item, idx, render) : []).forEach((x) => tools.appendChild(x));
        if (!opts.canDelete || opts.canDelete(item)) {
          tools.appendChild(btn("Delete", "ed-link danger", () => {
            if (opts.confirmDelete && !confirm(opts.confirmDelete(item))) return;
            items.splice(idx, 1); render(); opts.onChange();
          }));
        }
        head.appendChild(tools);
        row.appendChild(head);
        const body = el("div", "ed-sort-body");
        const isOpen = opts.isOpen ? opts.isOpen(item) : false;
        body.hidden = !isOpen;
        row.classList.toggle("open", isOpen);
        let built = false;
        const build = () => { if (!built) { built = true; opts.body(body, item, idx); } };
        if (isOpen) build();
        title.addEventListener("click", () => {
          build();
          body.hidden = !body.hidden;
          row.classList.toggle("open", !body.hidden);
          if (opts.setOpen) opts.setOpen(item, !body.hidden);
        });
        row.appendChild(body);
        wrap.appendChild(row);
      });
      if (opts.after) opts.after(wrap, render);
    }
    render();
    return render;
  }

  /* ---------------- a set of fields, with collapsible groups ---------------- */
  function renderFields(host, fields, get, set, ctx) {
    const groups = {};
    fields.forEach((f) => {
      let h = host;
      if (f.group) {
        if (!groups[f.group]) {
          const g = el("details", "ed-group");
          g.appendChild(el("summary", "", f.group));
          host.appendChild(g);
          groups[f.group] = g;
        }
        h = groups[f.group];
      }
      fieldEditor(h, f, () => get(f.key), (v) => set(f.key, v), ctx);
    });
  }

  /* ---------------- one field, any kind ---------------- */
  function fieldEditor(host, f, get, set, ctx) {
    const v = get();
    if (f.kind === "toggle") {
      const row = el("label", "ed-check");
      const cb = el("input", "");
      cb.type = "checkbox"; cb.checked = !!v;
      cb.addEventListener("change", () => set(cb.checked));
      row.appendChild(cb);
      row.appendChild(document.createTextNode(f.label));
      host.appendChild(row);
      return;
    }
    host.appendChild(lab(f.label));
    if (f.kind === "text" || f.kind === "url") {
      const i = el("input", "ed-input");
      if (f.kind === "url") i.placeholder = "https://… or a page link like about.html#contact";
      i.value = v == null ? "" : v;
      i.addEventListener("input", () => set(i.value));
      host.appendChild(i);
    } else if (f.kind === "textarea") {
      const t = el("textarea", "ed-textarea");
      t.value = v == null ? "" : v;
      t.addEventListener("input", () => set(t.value));
      host.appendChild(t);
    } else if (f.kind === "select") {
      const s = el("select", "ed-select");
      (f.options || []).forEach((o) => { const op = el("option", "", o === "" ? "(none)" : o); op.value = o; s.appendChild(op); });
      s.value = v == null || v === "" ? (f.default || f.options[0]) : v;
      s.addEventListener("change", () => set(s.value));
      host.appendChild(s);
    } else if (f.kind === "headline") {
      const isObj = v && typeof v === "object";
      const row = el("div", "ed-row");
      const a = el("input", "ed-input"); a.placeholder = "Main words";
      const b = el("input", "ed-input"); b.placeholder = "Accent words (optional, colored)";
      a.value = isObj ? v.main || "" : v || "";
      b.value = isObj ? v.accent || "" : "";
      const upd = () => {
        if (!b.value && !(v && typeof v === "object")) set(a.value);
        else set({ main: a.value, accent: b.value });
      };
      a.addEventListener("input", upd); b.addEventListener("input", upd);
      row.appendChild(a); row.appendChild(b);
      host.appendChild(row);
    } else if (f.kind === "number") {
      const i = el("input", "ed-input");
      i.type = "number"; i.step = "any";
      i.value = v == null ? "" : v;
      i.addEventListener("input", () => { const n = parseFloat(i.value); set(i.value === "" || isNaN(n) ? "" : n); });
      host.appendChild(i);
    } else if (f.kind === "lines") {
      const t = el("textarea", "ed-textarea");
      t.placeholder = "One per line";
      t.value = Array.isArray(v) ? v.join("\n") : v || "";
      t.addEventListener("input", () => set(t.value.split("\n").map((x) => x.trim()).filter(Boolean)));
      host.appendChild(t);
    } else if (f.kind === "group") {
      const box = el("div", "ed-subgroup");
      const obj = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      let attached = obj === v;
      renderFields(box, f.fields, (k) => obj[k], (k, nv) => { obj[k] = nv; if (!attached) { attached = true; set(obj); } ctx.changed(); }, ctx);
      host.appendChild(box);
    } else if (f.kind === "checklist") {
      const opts = (ctx.sources && ctx.sources[f.source]) || [];
      const picked = Array.isArray(v) ? v : [];
      if (!opts.length) host.appendChild(el("p", "ed-hint", "Nothing to pick from yet."));
      opts.forEach((o) => {
        const row = el("label", "ed-check");
        const cb = el("input", "");
        cb.type = "checkbox"; cb.checked = picked.indexOf(o.id) >= 0;
        cb.addEventListener("change", () => {
          const i = picked.indexOf(o.id);
          if (cb.checked && i < 0) picked.push(o.id);
          if (!cb.checked && i >= 0) picked.splice(i, 1);
          set(picked);
        });
        row.appendChild(cb);
        row.appendChild(document.createTextNode(o.title));
        host.appendChild(row);
      });
    } else if (f.kind === "rich") {
      richEditor(host, v, set);
    } else if (f.kind === "image") {
      imageField(host, v, set, ctx.tag);
    } else if (f.kind === "list") {
      // an empty list is only written into the page once something is added
      let attached = Array.isArray(v);
      const items = attached ? v : [];
      const touched = () => { if (!attached) { attached = true; set(items); } ctx.changed(); };
      const blank = () => { const o = {}; f.fields.forEach((x) => { o[x.key] = x.kind === "toggle" ? false : x.kind === "list" ? [] : ""; }); return o; };
      const openSet = new WeakSet();
      sortable(host, items, {
        onChange: touched,
        title: (it, i) => ({ kind: "#" + (i + 1), summary: SK.plain(it.title || it.name || it.label || it.city || it.group || it.when || it.caption || it.alt || it.k || it.src || "") || "(empty)",
          badges: it.status && it.status !== "live" ? [it.status] : [] }),
        isOpen: (it) => openSet.has(it) || items.length <= 3,
        setOpen: (it, o) => { if (o) openSet.add(it); else openSet.delete(it); },
        body: (box, it) => renderFields(box, f.fields, (k) => it[k], (k, nv) => { it[k] = nv; ctx.changed(); }, ctx),
        tools: (it, i, render) => [btn("Copy", "ed-link", () => { const c = clone(it); items.splice(i + 1, 0, c); openSet.add(c); render(); touched(); }, "Duplicate")],
        after: (wrap, render) => {
          wrap.appendChild(btn("+ Add " + (f.item || "item"), "btn ghost ed-add", () => { const n = blank(); items.push(n); openSet.add(n); render(); touched(); }));
        },
      });
    } else if (f.kind === "blocks") {
      blocksEditor(host, v, set, ctx);
    }
  }

  /* ---------------- free blocks (Notion-like stack) ---------------- */
  function blocksEditor(host, value, set, ctx) {
    let attached = Array.isArray(value);
    const blocks = attached ? value : [];
    const touched = () => { if (!attached) { attached = true; set(blocks); } ctx.changed(); };
    const openSet = new WeakSet();
    function newBlock(type) {
      const def = SK.BLOCKS[type];
      const data = {};
      def.fields.forEach((f) => { data[f.key] = f.kind === "list" ? [] : f.default || ""; });
      return { id: SK.newId("b"), type: type, data: data };
    }
    function picker(onPick) {
      const p = el("div", "ed-picker");
      Object.keys(SK.BLOCKS).forEach((k) => p.appendChild(btn(SK.BLOCKS[k].label, "ed-chip", () => onPick(k))));
      return p;
    }
    sortable(host, blocks, {
      onChange: touched,
      title: (b) => {
        const d = b.data || {};
        const sum = SK.plain(d.html || d.text || d.caption || d.label || d.url || d.src || "");
        return { kind: (SK.BLOCKS[b.type] || {}).label || b.type, summary: sum.slice(0, 70) };
      },
      isOpen: (b) => openSet.has(b),
      setOpen: (b, o) => { if (o) openSet.add(b); else openSet.delete(b); },
      body: (box, b) => {
        b.data = b.data || {};
        const def = SK.BLOCKS[b.type];
        if (!def) { box.appendChild(el("p", "ed-hint", "Unknown block type: " + b.type)); return; }
        if (!def.fields.length) box.appendChild(el("p", "ed-hint", "Nothing to set for this block."));
        def.fields.forEach((f) => fieldEditor(box, f, () => b.data[f.key], (nv) => { b.data[f.key] = nv; ctx.changed(); }, ctx));
        if (b.type === "embed") box.appendChild(el("p", "ed-hint", "Plays inline: YouTube, Vimeo, Loom, Tableau Public, Google Docs/Slides/Sheets/Drive, Figma, Spotify. Anything else shows as a link card."));
      },
      tools: (b, i, render) => [
        btn("Copy", "ed-link", () => { const c = clone(b); c.id = SK.newId("b"); blocks.splice(i + 1, 0, c); render(); touched(); }, "Duplicate"),
      ],
      after: (wrap, render) => {
        const add = el("div", "ed-add-block");
        add.appendChild(el("span", "ed-label", "Add a block"));
        add.appendChild(picker((type) => { const n = newBlock(type); blocks.push(n); openSet.add(n); render(); touched(); }));
        wrap.appendChild(add);
      },
    });
  }

  /* ---------------- the page builder ---------------- */
  /* opts:
       label, view (page URL for preview), tag (upload name prefix)
       path: "data/x.json"                 one file, or
       files: { alias: "data/x.json", … }  several files seen as one object
       layoutIn: alias that holds layout + meta (with `files`)
       sources: { name: [{id, title}] }    options for checklist fields
       validate(data) -> error text or ""                                   */
  async function pageBuilder(panel, opts) {
    const files = opts.files || { "": opts.path };
    const entries = {};
    for (const alias of Object.keys(files)) entries[alias] = await loadData(files[alias]);
    let d;
    if (files[""]) d = entries[""].data;
    else { d = {}; Object.keys(entries).forEach((a) => { d[a] = entries[a].data; }); }
    const host = opts.layoutIn ? d[opts.layoutIn] : d;
    host.layout = host.layout || { sections: [] };
    host.layout.sections = host.layout.sections || [];
    const sections = host.layout.sections;
    const openSet = new Set();
    const changed = () => Preview.changed();
    panel.addEventListener("input", changed);
    panel.addEventListener("change", changed);

    Preview.attach(opts.view, async () => {
      const out = {};
      Object.keys(files).forEach((a) => { out[files[a]] = entries[a].data; });
      return { files: out };
    });

    // --- page card
    const pc = h2card(opts.label, "Build the page from sections. Click a section to edit it, drag ⋮⋮ to move it. Changes go live when you save.", opts.view);
    panel.appendChild(pc);
    const pbar = el("div", "ed-actions");
    pbar.style.marginTop = ".4rem";
    const pvBtn = btn(Preview.on ? "Hide live preview" : "Show live preview", "btn ghost", () => Preview.toggle());
    pvBtn.setAttribute("data-preview-toggle", "");
    pbar.appendChild(pvBtn);
    pc.appendChild(pbar);
    if (host.meta || opts.meta !== false) {
      const det = el("details", "ed-group");
      det.appendChild(el("summary", "", "Page title and description (for search engines and link previews)"));
      const metaGet = (k) => (host.meta || {})[k];
      const metaSet = (k, v) => { host.meta = host.meta || {}; host.meta[k] = v; };
      fieldEditor(det, { key: "title", label: "Browser tab title", kind: "text" }, () => metaGet("title"), (v) => metaSet("title", v));
      fieldEditor(det, { key: "description", label: "Description", kind: "textarea" }, () => metaGet("description"), (v) => metaSet("description", v));
      pc.appendChild(det);
    }

    // --- sections
    const sc = h2card("Sections", "Top to bottom, as they appear on the page. Built-in sections can be moved, hidden and restyled, but not deleted, so nothing that reads them breaks.");
    panel.appendChild(sc);
    const typeOf = (s) => SK.TYPES[s.type] || {};
    const typeLabel = (s) => typeOf(s).label || s.type;
    const fixed = (s) => !!(s.bind || typeOf(s).native);
    const summary = (s) => {
      const c = SK.read(d, s);
      const hl = c.headline && typeof c.headline === "object" ? (c.headline.main || "") + (c.headline.accent || "") : c.headline;
      if (s.type === "free") {
        const first = (c.blocks || []).map((b) => SK.plain((b.data || {}).html || (b.data || {}).text || "")).find(Boolean);
        return (first || (c.blocks || []).length + " blocks").slice(0, 80);
      }
      return SK.plain(hl || c.heading || c.eyebrow || c.greeting || c.latin || c.url || "").slice(0, 80);
    };
    let renderSections;
    function sectionBody(box, s) {
      const t = SK.TYPES[s.type];
      if (!t) { box.appendChild(el("p", "ed-hint", "This section type isn't in the skeleton yet: " + s.type)); return; }
      box.appendChild(el("p", "ed-hint", t.about));
      const ctx = { changed: changed, tag: (opts.tag || "page") + "-" + s.id, sources: opts.sources || {} };
      renderFields(box, t.fields, (k) => SK.get(d, s, k), (k, v) => { SK.set(d, s, k, v); changed(); }, ctx);
      // look
      const lk = el("details", "ed-group");
      lk.appendChild(el("summary", "", "Look and placement"));
      s.style = s.style || {};
      if ((t.looks || []).length) {
        const row = el("div", "ed-row ed-row-auto");
        t.looks.forEach((k) => {
          const c = el("div", "");
          const def = SK.STYLE[k];
          const dflt = SK.lookDefault(s, k);
          fieldEditor(c, { key: k, label: def.label, kind: "select", options: def.options, default: dflt },
            () => s.style[k], (v) => { if (v === dflt) delete s.style[k]; else s.style[k] = v; changed(); }, ctx);
          row.appendChild(c);
        });
        lk.appendChild(row);
      }
      fieldEditor(lk, { key: "menu", label: "Label in the page's top menu (blank = not listed)", kind: "text" }, () => s.menu, (v) => { s.menu = v; changed(); }, ctx);
      if (!fixed(s)) {
        lk.appendChild(lab("Link name for this section (page.html#…)"));
        const idIn = el("input", "ed-input");
        idIn.value = s.id;
        idIn.addEventListener("change", () => {
          const v = idIn.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
          const taken = sections.some((x) => x !== s && (x.id === v || typeOf(x).anchor === v));
          if (!v || taken) { idIn.value = s.id; status("That link name is empty or already used on this page.", false); return; }
          openSet.delete(s.id); s.id = v; openSet.add(v); idIn.value = v; changed();
        });
        lk.appendChild(idIn);
      }
      box.appendChild(lk);
    }
    function addSection(type, at) {
      const t = SK.TYPES[type];
      const content = {};
      t.fields.forEach((f) => { content[f.key] = f.kind === "list" || f.kind === "blocks" ? [] : f.default || ""; });
      let id = type;
      let n = 2;
      while (sections.some((x) => x.id === id || typeOf(x).anchor === id)) id = type + "-" + n++;
      const s = { id: id, type: type, menu: "", hidden: false, style: {}, content: content };
      sections.splice(at == null ? sections.length : at, 0, s);
      openSet.add(id);
      renderSections();
      changed();
      status("Added a " + t.label + " section. Fill it in, then save.");
    }
    function typePicker(at) {
      const box = el("div", "ed-type-picker");
      Object.keys(SK.TYPES).forEach((k) => {
        const t = SK.TYPES[k];
        if (t.native) return;
        if (t.single && sections.some((s) => s.type === k)) return;
        const b = btn("", "ed-type", () => addSection(k, at));
        b.appendChild(el("b", "", t.label));
        b.appendChild(el("span", "", t.about));
        box.appendChild(b);
      });
      return box;
    }
    renderSections = sortable(sc, sections, {
      onChange: changed,
      title: (s) => ({
        kind: typeLabel(s),
        summary: summary(s),
        badges: [].concat(s.hidden ? ["hidden"] : [], fixed(s) ? ["built-in"] : []),
      }),
      isOpen: (s) => openSet.has(s.id),
      setOpen: (s, o) => { if (o) openSet.add(s.id); else openSet.delete(s.id); },
      body: sectionBody,
      canDelete: (s) => !fixed(s),
      confirmDelete: (s) => "Delete the “" + typeLabel(s) + "” section? You can get it back from History & restore after saving.",
      tools: (s, i, render) => {
        const out = [btn(s.hidden ? "Show" : "Hide", "ed-link", () => { s.hidden = !s.hidden; render(); changed(); })];
        if (!fixed(s)) out.push(btn("Copy", "ed-link", () => {
          const c = clone(s);
          let id = s.id + "-copy", n = 2;
          while (sections.some((x) => x.id === id)) id = s.id + "-copy-" + n++;
          c.id = id; c.menu = "";
          (SK.get(d, c, "blocks") || []).forEach((b) => { b.id = SK.newId("b"); });
          sections.splice(i + 1, 0, c); openSet.add(id); render(); changed();
        }, "Duplicate this section"));
        return out;
      },
      after: (wrap) => {
        const add = el("div", "ed-add-section");
        const open = btn("+ Add a section", "btn ghost", () => { pick.hidden = !pick.hidden; });
        const pick = typePicker();
        pick.hidden = true;
        add.appendChild(open);
        add.appendChild(pick);
        wrap.appendChild(add);
      },
    });

    // --- save: every file of this page that changed, one commit each
    saveBar(panel, async () => {
      try {
        const problem = opts.validate ? opts.validate(d) : "";
        if (problem) { status(problem, false); return; }
        // keep an existing "subnav" key in step with the section menu labels
        if (Array.isArray(host.subnav)) host.subnav = sections.filter((s) => !s.hidden && s.menu).map((s) => ({ label: s.menu, href: "#" + (typeOf(s).anchor || s.id) }));
        const todo = Object.keys(entries).filter((a) => isDirty(entries[a]));
        if (!todo.length) { status("Nothing has changed since the last save."); return; }
        for (const a of todo) {
          status("Saving " + files[a] + "…");
          await saveData(files[a], entries[a].data, "Update " + opts.label.toLowerCase() + " via page builder");
        }
        status("Saved — live in about a minute.");
      } catch (e) { status(e.message, false); }
    }, "Save " + opts.label.toLowerCase());
  }

  window.pageBuilder = pageBuilder;
})();
