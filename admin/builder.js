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
      this.timer = setTimeout(() => this.send(), 250);
    },
    async send() {
      if (!this.on || !this.frame || !this.payload) return;
      try {
        const p = await this.payload();
        this.frame.contentWindow.postMessage(Object.assign({ type: "lc-preview" }, clone(p)), location.origin);
      } catch (e) { /* preview is best effort */ }
    },
  };
  window.BuilderPreview = Preview;
  window.addEventListener("message", (e) => {
    if (e.origin === location.origin && e.data && e.data.type === "lc-preview-ready") Preview.send();
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
      (f.options || []).forEach((o) => { const op = el("option", "", o); op.value = o; s.appendChild(op); });
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
        title: (it, i) => ({ kind: "#" + (i + 1), summary: SK.plain(it.title || it.label || it.caption || it.alt || it.src || "") || "(empty)" }),
        isOpen: (it) => openSet.has(it) || items.length <= 3,
        setOpen: (it, o) => { if (o) openSet.add(it); else openSet.delete(it); },
        body: (box, it) => f.fields.forEach((sf) => fieldEditor(box, sf, () => it[sf.key], (nv) => { it[sf.key] = nv; ctx.changed(); }, ctx)),
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
  async function pageBuilder(panel, opts) {
    const entry = await loadData(opts.path);
    const d = entry.data;
    const siteEntry = currentSite.id === "main" ? await loadData("data/site.json") : null;
    d.layout = d.layout || { sections: [] };
    d.layout.sections = d.layout.sections || [];
    const sections = d.layout.sections;
    const openSet = new Set();
    const changed = () => Preview.changed();
    panel.addEventListener("input", changed);
    panel.addEventListener("change", changed);

    Preview.attach(opts.view, async () => ({ data: d, site: siteEntry ? siteEntry.data : {} }));

    // --- page card
    const pc = h2card(opts.label, "Build the page from sections. Click a section to edit it, drag ⋮⋮ to move it. Changes go live when you save.", opts.view);
    panel.appendChild(pc);
    const pbar = el("div", "ed-actions");
    pbar.style.marginTop = ".4rem";
    const pvBtn = btn(Preview.on ? "Hide live preview" : "Show live preview", "btn ghost", () => Preview.toggle());
    pvBtn.setAttribute("data-preview-toggle", "");
    pbar.appendChild(pvBtn);
    pc.appendChild(pbar);
    const meta = d.meta = d.meta || {};
    const det = el("details", "ed-group");
    det.appendChild(el("summary", "", "Page title and description (for search engines and link previews)"));
    fieldEditor(det, { key: "title", label: "Browser tab title", kind: "text" }, () => meta.title, (v) => { meta.title = v; });
    fieldEditor(det, { key: "description", label: "Description", kind: "textarea" }, () => meta.description, (v) => { meta.description = v; });
    pc.appendChild(det);

    // --- sections
    const sc = h2card("Sections", "Top to bottom, as they appear on the page. Sections that were part of the original page can be hidden but not deleted, so nothing else that reads them breaks.");
    panel.appendChild(sc);
    const typeLabel = (s) => (SK.TYPES[s.type] || {}).label || s.type;
    const summary = (s) => {
      const c = SK.read(d, s);
      const hl = c.headline && typeof c.headline === "object" ? (c.headline.main || "") + (c.headline.accent || "") : c.headline;
      if (s.type === "free") {
        const first = (c.blocks || []).map((b) => SK.plain((b.data || {}).html || (b.data || {}).text || "")).find(Boolean);
        return (first || (c.blocks || []).length + " blocks").slice(0, 80);
      }
      return SK.plain(hl || c.heading || c.eyebrow || c.url || "").slice(0, 80);
    };
    let renderSections;
    function sectionBody(box, s) {
      const t = SK.TYPES[s.type];
      if (!t) { box.appendChild(el("p", "ed-hint", "This section type isn't in the skeleton yet: " + s.type)); return; }
      box.appendChild(el("p", "ed-hint", t.about));
      const ctx = { changed: changed, tag: (opts.tag || "page") + "-" + s.id };
      const groups = {};
      t.fields.forEach((f) => {
        let host = box;
        if (f.group) {
          if (!groups[f.group]) {
            const g = el("details", "ed-group");
            g.appendChild(el("summary", "", f.group));
            box.appendChild(g);
            groups[f.group] = g;
          }
          host = groups[f.group];
        }
        fieldEditor(host, f, () => SK.get(d, s, f.key), (v) => { SK.set(d, s, f.key, v); changed(); }, ctx);
      });
      // look
      const lk = el("details", "ed-group");
      lk.appendChild(el("summary", "", "Look and placement"));
      s.style = s.style || {};
      const row = el("div", "ed-row ed-row-auto");
      (t.looks || []).forEach((k) => {
        const c = el("div", "");
        const def = SK.STYLE[k];
        fieldEditor(c, { key: k, label: def.label, kind: "select", options: def.options, default: def.default },
          () => s.style[k], (v) => { if (v === def.default) delete s.style[k]; else s.style[k] = v; changed(); }, ctx);
        row.appendChild(c);
      });
      lk.appendChild(row);
      fieldEditor(lk, { key: "menu", label: "Label in the page's top menu (blank = not listed)", kind: "text" }, () => s.menu, (v) => { s.menu = v; changed(); }, ctx);
      if (!s.bind) {
        lk.appendChild(lab("Link name for this section (page.html#…)"));
        const idIn = el("input", "ed-input");
        idIn.value = s.id;
        idIn.addEventListener("change", () => {
          const v = idIn.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
          if (!v || sections.some((x) => x !== s && x.id === v)) { idIn.value = s.id; status("That link name is empty or already used on this page.", false); return; }
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
      while (sections.some((x) => x.id === id)) id = type + "-" + n++;
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
        badges: [].concat(s.hidden ? ["hidden"] : [], s.bind ? ["original"] : []),
      }),
      isOpen: (s) => openSet.has(s.id),
      setOpen: (s, o) => { if (o) openSet.add(s.id); else openSet.delete(s.id); },
      body: sectionBody,
      canDelete: (s) => !s.bind,
      confirmDelete: (s) => "Delete the “" + typeLabel(s) + "” section? You can get it back from History & restore after saving.",
      tools: (s, i, render) => {
        const out = [btn(s.hidden ? "Show" : "Hide", "ed-link", () => { s.hidden = !s.hidden; render(); changed(); })];
        if (!s.bind) out.push(btn("Copy", "ed-link", () => {
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

    // --- save
    saveBar(panel, async () => {
      try {
        status("Saving…");
        // keep the old "subnav" key in step with the section menu labels
        d.subnav = sections.filter((s) => !s.hidden && s.menu).map((s) => ({ label: s.menu, href: "#" + s.id }));
        await saveData(opts.path, d, "Update " + opts.label.toLowerCase() + " via page builder");
        status("Saved — live in about a minute.");
      } catch (e) { status(e.message, false); }
    }, "Save " + opts.label.toLowerCase());
  }

  window.pageBuilder = pageBuilder;
})();
