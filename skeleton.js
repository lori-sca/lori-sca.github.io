/* ============================================================
   skeleton.js — THE CONTRACT between content, editor and design.

   Three layers:
     1. Content   data/*.json         your words, pictures, links
     2. Skeleton  this file           which section types exist and
                                      which fields each one has
     3. Design    theme.js + theme.css how each section type looks

   The admin builds its editing forms from this file. The theme
   draws pages from the same field names. A redesign rewrites
   layer 3 only. Rules for this file:
     - never rename or remove a section type or a field key
     - add new types and fields freely (additive only)
     - no colors, fonts or markup here: that belongs to the theme

   A page that uses the builder keeps a "layout" key in its JSON:
     layout.sections = [ { id, type, hidden, menu, style, content, bind } ]
       id      anchor on the page (#id), also the merge key
       type    one of TYPES below
       hidden  true = kept but not shown
       menu    label in the page's sub-menu ("" = not listed)
       style   look options from STYLE (the theme decides what they mean)
       content the section's fields, for sections added in the builder
       bind    { field: "path.in.json" } for sections that existed before
               the builder: their fields stay where they always were,
               so nothing else that reads those keys breaks.

   Plain JS, no build step. Loaded by the site pages, the admin, and
   the two sister sites (from https://lori-sca.github.io/skeleton.js).
   ============================================================ */
(function (root) {
  "use strict";

  /* ---------- field kinds ----------
     text      one line              textarea  plain paragraph
     rich      formatted text (bold, italic, links, lists, sub-headings)
     headline  string, or {main, accent} where accent gets the accent color
     image     path or URL to a picture (upload or paste)
     url       a link
     select    one of `options`
     toggle    true / false
     list      repeating group of `fields`
     blocks    free-form stack of BLOCKS (the Notion-like part)          */

  const MEDIA = [
    { key: "image", label: "Picture", kind: "image", group: "Picture & links" },
    { key: "imageAlt", label: "Picture description (for screen readers)", kind: "text", group: "Picture & links" },
    { key: "imageCaption", label: "Caption", kind: "text", group: "Picture & links" },
    { key: "links", label: "Links", kind: "list", group: "Picture & links", item: "link", fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "href", label: "Link", kind: "url" },
      { key: "newTab", label: "Open in a new tab", kind: "toggle" },
    ] },
  ];
  const BUTTONS = { key: "buttons", label: "Buttons", kind: "list", item: "button", fields: [
    { key: "label", label: "Label", kind: "text" },
    { key: "href", label: "Link", kind: "url" },
    { key: "primary", label: "Filled (main) button", kind: "toggle" },
  ] };

  /* ---------- section types (the skeleton) ---------- */
  const TYPES = {
    "page-header": {
      label: "Page header",
      about: "The title block at the top of a page.",
      fields: [
        { key: "eyebrow", label: "Eyebrow (small line above)", kind: "text" },
        { key: "headline", label: "Headline", kind: "headline" },
        { key: "lede", label: "Intro", kind: "textarea" },
        BUTTONS,
      ].concat(MEDIA),
      looks: ["width", "background", "spacing", "align"],
    },
    "text": {
      label: "Text",
      about: "A heading and formatted text, with an optional side note.",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Heading", kind: "headline" },
        { key: "side", label: "Side note", kind: "textarea" },
        { key: "body", label: "Text", kind: "rich" },
        BUTTONS,
      ],
      looks: ["width", "background", "spacing", "align"],
    },
    "media-text": {
      label: "Picture + text",
      about: "A picture next to text. Pick which side the picture sits on.",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Heading", kind: "headline" },
        { key: "body", label: "Text", kind: "rich" },
        { key: "image", label: "Picture", kind: "image" },
        { key: "imageAlt", label: "Picture description", kind: "text" },
        { key: "imageSide", label: "Picture side", kind: "select", options: ["left", "right"], default: "right" },
        BUTTONS,
      ],
      looks: ["width", "background", "spacing"],
    },
    "cards": {
      label: "Card grid",
      about: "Two to four cards side by side. Each card can have a picture and a link.",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Heading", kind: "headline" },
        { key: "side", label: "Side note", kind: "textarea" },
        { key: "cards", label: "Cards", kind: "list", item: "card", fields: [
          { key: "image", label: "Picture (optional)", kind: "image" },
          { key: "imageAlt", label: "Picture description", kind: "text" },
          { key: "title", label: "Title", kind: "text" },
          { key: "text", label: "Text", kind: "rich" },
          { key: "href", label: "Link (optional)", kind: "url" },
          { key: "linkLabel", label: "Link label", kind: "text" },
        ] },
      ],
      looks: ["width", "background", "spacing", "columns"],
    },
    "gallery": {
      label: "Picture gallery",
      about: "A grid of pictures with captions.",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Heading", kind: "headline" },
        { key: "images", label: "Pictures", kind: "list", item: "picture", fields: [
          { key: "src", label: "Picture", kind: "image" },
          { key: "alt", label: "Picture description", kind: "text" },
          { key: "caption", label: "Caption", kind: "text" },
        ] },
      ],
      looks: ["width", "background", "spacing", "columns"],
    },
    "embed": {
      label: "Embed",
      about: "YouTube, Vimeo, Loom, Tableau Public, Google Docs/Slides/Sheets/Drive, Figma or Spotify. Anything else shows as a link card.",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Heading", kind: "headline" },
        { key: "url", label: "Link to embed", kind: "url" },
        { key: "caption", label: "Caption", kind: "text" },
      ],
      looks: ["width", "background", "spacing"],
    },
    "list": {
      label: "Titled list",
      about: "A list of titles with a status tag, like the writing pipeline.",
      fields: [
        { key: "heading", label: "Heading", kind: "text" },
        { key: "note", label: "Note under the heading", kind: "textarea" },
        { key: "statusLabel", label: "Default status tag", kind: "text" },
        { key: "items", label: "Items", kind: "list", item: "item", fields: [
          { key: "title", label: "Title", kind: "text" },
          { key: "link", label: "Link (optional)", kind: "url" },
          { key: "status", label: "Status tag (blank = default)", kind: "text" },
        ] },
      ].concat(MEDIA),
      looks: ["width", "background", "spacing"],
    },
    "contact": {
      label: "Contact band",
      about: "Heading plus your email, LinkedIn and GitHub buttons (those links come from Site links).",
      fields: [
        { key: "eyebrow", label: "Eyebrow", kind: "text" },
        { key: "headline", label: "Headline", kind: "headline" },
      ].concat(MEDIA),
      looks: ["width", "background", "spacing", "align"],
      single: true,
    },
    "free": {
      label: "Free blocks",
      about: "Stack anything: text, pictures, embeds, quotes, buttons, files, dividers. The most flexible section.",
      fields: [
        { key: "blocks", label: "Blocks", kind: "blocks" },
      ],
      looks: ["width", "background", "spacing", "align"],
    },
  };

  /* ---------- blocks (inside a "Free blocks" section) ---------- */
  const BLOCKS = {
    text:    { label: "Text", fields: [
      { key: "html", label: "Text", kind: "rich" },
      { key: "size", label: "Text size", kind: "select", options: ["S", "M", "L"], default: "M" } ] },
    heading: { label: "Heading", fields: [
      { key: "text", label: "Heading", kind: "text" },
      { key: "level", label: "Size", kind: "select", options: ["large", "medium", "small"], default: "medium" } ] },
    image:   { label: "Picture", fields: [
      { key: "src", label: "Picture", kind: "image" },
      { key: "alt", label: "Picture description", kind: "text" },
      { key: "caption", label: "Caption", kind: "text" },
      { key: "width", label: "Width", kind: "select", options: ["small", "medium", "full"], default: "full" },
      { key: "href", label: "Link when clicked (optional)", kind: "url" } ] },
    embed:   { label: "Embed", fields: [
      { key: "url", label: "Link to embed", kind: "url" },
      { key: "caption", label: "Caption", kind: "text" } ] },
    buttons: { label: "Buttons", fields: [ BUTTONS ] },
    quote:   { label: "Quote", fields: [
      { key: "text", label: "Quote", kind: "textarea" },
      { key: "cite", label: "Who said it (optional)", kind: "text" } ] },
    callout: { label: "Callout", fields: [
      { key: "html", label: "Text", kind: "rich" } ] },
    file:    { label: "File / document", fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "url", label: "Link to the file (PDF, deck, Drive…)", kind: "url" },
      { key: "note", label: "Short note (optional)", kind: "text" } ] },
    divider: { label: "Divider", fields: [] },
    spacer:  { label: "Space", fields: [
      { key: "size", label: "Height", kind: "select", options: ["small", "medium", "large"], default: "medium" } ] },
  };

  /* ---------- look options (names only; the theme gives them meaning) ---------- */
  const STYLE = {
    width:      { label: "Width", options: ["narrow", "normal", "wide", "full"], default: "normal" },
    background: { label: "Background", options: ["none", "tint", "dark"], default: "none" },
    spacing:    { label: "Spacing above and below", options: ["compact", "normal", "roomy"], default: "normal" },
    align:      { label: "Alignment", options: ["left", "center"], default: "left" },
    columns:    { label: "Columns", options: ["2", "3", "4"], default: "3" },
  };

  /* ---------- helpers shared by admin and theme ---------- */
  function getPath(obj, path) {
    return String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const ks = String(path).split(".");
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] == null || typeof o[ks[i]] !== "object") o[ks[i]] = {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = value;
  }
  /* read / write one field of a section, honouring `bind` */
  function get(data, section, key) {
    if (section.bind && section.bind[key]) return getPath(data, section.bind[key]);
    return (section.content || {})[key];
  }
  function set(data, section, key, value) {
    if (section.bind && section.bind[key]) { setPath(data, section.bind[key], value); return; }
    section.content = section.content || {};
    section.content[key] = value;
  }
  /* all fields of a section as one plain object (what the theme draws from) */
  function read(data, section) {
    const t = TYPES[section.type];
    const out = {};
    if (!t) return Object.assign({}, section.content || {});
    t.fields.forEach((f) => { out[f.key] = get(data, section, f.key); });
    return out;
  }
  function look(section, key) {
    const s = section.style || {};
    return s[key] != null && s[key] !== "" ? s[key] : (STYLE[key] || {}).default;
  }
  function newId(prefix) {
    return (prefix || "s") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------- formatted text: one safe subset, used everywhere ----------
     Anything outside this list is unwrapped (its text kept, tag dropped).
     Links only to http(s), mailto, tel, #anchors and site-relative paths. */
  const ALLOWED = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, A: 1, UL: 1, OL: 1, LI: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, CODE: 1 };
  const RENAME = { DIV: "P", H1: "H3", H2: "H3", H5: "H4", H6: "H4" };
  function safeHref(h) {
    h = String(h || "").trim();
    if (/^(https?:|mailto:|tel:|#)/i.test(h)) return h;
    if (/^[a-z0-9_\-./?=&%]+$/i.test(h) && !/^[a-z]+:/i.test(h)) return h;
    return "";
  }
  function sanitize(html) {
    if (typeof DOMParser === "undefined") return String(html || "");
    const doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    (function clean(node) {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) { n.remove(); return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE|SVG|MATH|FORM|INPUT|BUTTON|TEXTAREA|SELECT|META|LINK)$/.test(n.tagName)) { n.remove(); return; }
        clean(n);
        let tag = RENAME[n.tagName] || n.tagName;
        if (!ALLOWED[tag]) { n.replaceWith(...Array.from(n.childNodes)); return; }
        let el = n;
        if (tag !== n.tagName) {
          el = doc.createElement(tag);
          el.append(...Array.from(n.childNodes));
          n.replaceWith(el);
        }
        const href = tag === "A" ? safeHref(n.getAttribute("href")) : "";
        Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
        if (tag === "A") {
          if (!href) { el.replaceWith(...Array.from(el.childNodes)); return; }
          el.setAttribute("href", href);
          if (/^https?:/i.test(href)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
        }
      });
    })(doc.body);
    // loose words at the top level (e.g. the first line typed) go into a paragraph
    const BLOCK = { P: 1, UL: 1, OL: 1, H3: 1, H4: 1, BLOCKQUOTE: 1 };
    let run = null;
    Array.from(doc.body.childNodes).forEach((n) => {
      if (n.nodeType === 1 && BLOCK[n.tagName]) { run = null; return; }
      if (!run) {
        if (n.nodeType === 3 && !n.textContent.trim()) { n.remove(); return; }
        run = doc.createElement("p");
        n.replaceWith(run);
      }
      run.appendChild(n);
    });
    return doc.body.innerHTML.replace(/<p>(\s|<br>)*<\/p>/g, "").trim();
  }
  function plain(html) {
    if (typeof DOMParser === "undefined") return String(html || "").replace(/<[^>]+>/g, " ");
    return new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html").body.textContent.trim();
  }

  const api = { TYPES, BLOCKS, STYLE, getPath, setPath, get, set, read, look, newId, sanitize, safeHref, plain };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Skeleton = api;
})(typeof window !== "undefined" ? window : this);
