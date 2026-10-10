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
     blocks    free-form stack of BLOCKS (the Notion-like part)
     number    a number (saved as a number)
     lines     a list of short texts, one per line
     group     a small set of `fields` kept together in one object
     checklist pick several ids from a `source` the admin provides       */

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

  /* ---------- built-in sections ----------
     Parts of existing pages that keep their own drawing code (maps,
     count-ups, case-study cards). The builder can move, hide, restyle
     and edit them; `bind` points every field at the key the page has
     always read, so nothing is renamed. `anchor` is the element id the
     page already has. Not offered in "Add a section".               */
  const F = (key, label, kind, extra) => Object.assign({ key: key, label: label, kind: kind }, extra || {});
  const HEAD = [F("eyebrow", "Eyebrow", "text"), F("headline", "Headline", "headline"), F("side", "Side note", "textarea")];
  const HEAD_NOSIDE = [F("eyebrow", "Eyebrow", "text"), F("headline", "Headline", "headline")];
  function headBind(prefix, side) {
    const b = { eyebrow: prefix + ".eyebrow", headline: prefix + ".headline" };
    if (side) b.side = prefix + ".side";
    ["image", "imageAlt", "imageCaption", "links"].forEach((k) => { b[k] = prefix + "." + k; });
    return b;
  }
  function mediaBind(prefix) {
    const b = {};
    ["image", "imageAlt", "imageCaption", "links"].forEach((k) => { b[k] = prefix + "." + k; });
    return b;
  }
  const PROJECT = [
    F("title", "Title", "text"),
    F("id", "Card id (used in links; don't change once live)", "text"),
    F("status", "Status", "select", { options: ["live", "draft", "building"], default: "building" }),
    F("hook", "Hook (the 10-second version)", "textarea"),
    F("metric", "Metric line", "text"),
    F("group", "Where it's from", "select", { options: ["", "work", "mba"], default: "" }),
    F("year", "Year", "text"),
    F("visual", "Cover picture", "image", { group: "Pictures" }),
    F("visualAlt", "Cover picture description", "text", { group: "Pictures" }),
    F("diagram", "Diagram", "image", { group: "Pictures" }),
    F("diagramAlt", "Diagram description", "text", { group: "Pictures" }),
    F("images", "Gallery (replaces cover + diagram when filled)", "list", { group: "Pictures", item: "picture", fields: [F("src", "Picture", "image"), F("alt", "Description", "text")] }),
    F("links", "Links", "list", { group: "Links and files", item: "link", fields: [F("label", "Label", "text"), F("url", "Link", "url"),
      F("kind", "Kind", "select", { options: ["github", "demo", "article", "deck", "sheet", "drive", "other"], default: "other" })] }),
    F("files", "Files", "list", { group: "Links and files", item: "file", fields: [F("title", "Title", "text"), F("src", "Link", "url"), F("public", "Show on the site", "toggle")] }),
    F("context", "Context", "textarea", { group: "Story" }),
    F("body", "Story", "group", { group: "Story", fields: [F("problem", "Problem", "textarea"), F("approach", "Approach", "textarea"),
      F("hers", "My call", "textarea"), F("result", "Result", "textarea"), F("lesson", "Lesson", "textarea")] }),
    F("calls", "Thinking process (one step per line)", "lines", { group: "Story" }),
    F("outcome", "Outcome", "textarea", { group: "Story" }),
    F("setting", "Setting", "text", { group: "Story" }),
    F("csr", "Context tiles", "list", { group: "Story", item: "tile", fields: [F("n", "No.", "text"), F("k", "Key", "text"), F("v", "Value", "textarea")] }),
    F("tools", "Tools (one per line)", "lines", { group: "Card labels" }),
    F("stat", "Big number", "group", { group: "Card labels", fields: [F("num", "Number", "number"), F("prefix", "Before the number", "text"),
      F("suffix", "After the number", "text"), F("decimals", "Decimals", "number"), F("label", "Label", "text")] }),
    F("badge", "Badge (overrides Live/Draft)", "text", { group: "Card labels" }),
    F("hint", "Hint line", "text", { group: "Card labels" }),
    F("btnLabel", "Button label", "text", { group: "Card labels" }),
    F("reviewNotes", "Review notes (hidden when live)", "group", { group: "Review notes", fields: [F("notes", "Notes to self", "lines"), F("missing", "Still missing", "lines")] }),
  ];
  const ORG_HERO = [
    F("eyebrow", "Eyebrow", "text"), F("headline", "Headline", "text"), F("lede", "Intro", "textarea"),
    F("ctas", "Buttons", "list", { item: "button", fields: [F("label", "Label", "text"), F("href", "Link", "url"),
      F("orgGithub", "Link to the GitHub org (ignores the link above)", "toggle"), F("newTab", "Open in a new tab", "toggle")] }),
    F("backLabel", "Menu link back to the main site: label", "text", { group: "Menu" }),
    F("backHref", "Menu link back to the main site: link", "url", { group: "Menu" }),
  ].concat(MEDIA);
  const ORG_HERO_BIND = Object.assign({ eyebrow: "hero.eyebrow", headline: "hero.headline", lede: "hero.lede", ctas: "page.heroCtas",
    backLabel: "page.backLink.label", backHref: "page.backLink.href" }, mediaBind("hero"));

  const NATIVE = {
    /* ---- main site: Home ---- */
    "home-hero": { label: "Home hero", anchor: "top", about: "The big opening block with your photo background and buttons.",
      fields: [F("eyebrow", "Eyebrow", "text"), F("subtitle", "Subtitle", "text"), F("headline", "Headline", "textarea"), F("lede", "Intro", "textarea"),
        F("tagline", "Tagline", "text"), F("background", "Background photo", "image"),
        F("ctas", "Buttons", "list", { item: "button", fields: [F("label", "Label", "text"), F("href", "Link", "url")] })].concat(MEDIA),
      bind: Object.assign({ eyebrow: "hero.eyebrow", subtitle: "hero.subtitle", headline: "hero.headline", lede: "hero.lede",
        tagline: "hero.tagline", background: "hero.background", ctas: "hero.ctas" }, mediaBind("hero")) },
    "home-start": { label: "Start here", anchor: "start", about: "The three cards under the hero.",
      fields: HEAD.concat([F("cards", "Cards", "list", { item: "card", fields: [F("title", "Title", "text"), F("text", "Text", "textarea"), F("embed", "Embed link (optional)", "url")] })], MEDIA),
      bind: Object.assign(headBind("sections.start", true), { cards: "startHere" }),
      looks: ["background", "spacing"], styleDefaults: { background: "tint" } },
    "home-featured": { label: "Featured work", anchor: "featured", about: "Project cards picked from your work.",
      fields: HEAD.concat([F("featured", "Projects shown (up to 3)", "checklist", { source: "projects" })], MEDIA),
      bind: Object.assign(headBind("sections.featured", true), { featured: "featured" }),
      looks: ["background", "spacing"] },
    "home-about": { label: "About teaser", anchor: "about", about: "A short line pointing to the About page.",
      fields: HEAD_NOSIDE.concat([F("teaser", "Teaser", "textarea"), F("teaserEmbed", "Embed link (optional)", "url")], MEDIA),
      bind: Object.assign(headBind("sections.about"), { teaser: "aboutTeaser", teaserEmbed: "aboutTeaserEmbed" }),
      looks: ["background", "spacing"], styleDefaults: { background: "tint" } },
    "home-contact": { label: "Contact", anchor: "contact", about: "Heading plus email, LinkedIn and GitHub buttons (links come from Site links).",
      fields: HEAD.concat(MEDIA), bind: headBind("sections.contact", true), looks: ["background", "spacing"] },

    /* ---- main site: About ---- */
    "about-hero": { label: "About hero", anchor: "top", about: "Greeting, intro and tagline. The portrait comes from Site links.",
      fields: [F("eyebrow", "Eyebrow", "text"), F("greeting", "Greeting", "textarea"), F("lede", "Intro", "textarea"), F("tagline", "Tagline", "text")].concat(MEDIA),
      bind: Object.assign({ eyebrow: "hero.eyebrow", greeting: "hero.greeting", lede: "hero.lede", tagline: "hero.tagline" }, mediaBind("hero")) },
    "about-thirties": { label: "30-second version", anchor: "thirties", about: "The three quick cards.",
      fields: HEAD_NOSIDE.concat([F("cards", "Cards", "list", { item: "card", fields: [F("title", "Title", "text"), F("text", "Text", "textarea")] })], MEDIA),
      bind: Object.assign(headBind("sections.thirties"), { cards: "thirties" }), looks: ["background", "spacing"] },
    "about-story": { label: "Story", anchor: "story", about: "The longer version, plus the two side cards.",
      fields: HEAD_NOSIDE.concat([
        F("chapters", "Chapters", "list", { item: "chapter", fields: [F("label", "Label", "text"), F("text", "Text", "textarea"), F("embed", "Embed link (optional)", "url")] }),
        F("holdup", "“Hold up” card", "textarea"), F("proudestTitle", "Proudest card: title", "text"), F("proudestText", "Proudest card: text", "textarea")], MEDIA),
      bind: Object.assign(headBind("sections.story"), { chapters: "chapters", holdup: "holdup", proudestTitle: "proudest.title", proudestText: "proudest.text" }),
      looks: ["background", "spacing"], styleDefaults: { background: "tint" } },
    "about-selected": { label: "Selected work", anchor: "selected", about: "The 10-second cards with count-up numbers.",
      fields: HEAD.concat([
        F("cards", "Cards", "list", { item: "card", fields: [F("tag", "Tag", "text"), F("num", "Number", "number"), F("prefix", "Before the number", "text"),
          F("suffix", "After the number", "text"), F("decimals", "Decimals", "number"), F("label", "Number label", "text"), F("title", "Title", "text"),
          F("outcome", "Outcome", "textarea"), F("url", "Link", "url")] }),
        F("deepDive", "Card link label", "text"), F("seeAll", "“See all” link label", "text")], MEDIA),
      bind: Object.assign(headBind("sections.selected", true), { cards: "selected", deepDive: "labels.deepDive", seeAll: "labels.seeAllCases" }),
      looks: ["background", "spacing"] },
    "about-route": { label: "The route", anchor: "route", about: "Journey map and work history stops.",
      fields: HEAD.concat([
        F("stops", "Work history, newest first", "list", { item: "stop", fields: [F("when", "When", "text"), F("where", "Where", "text"), F("role", "Role", "text"),
          F("detail", "Details (one per line)", "lines"), F("now", "This is the current stop", "toggle")] }),
        F("journey", "Map pins, in travel order", "list", { item: "pin", fields: [F("city", "City", "text"), F("note", "Note", "text"),
          F("lat", "Latitude", "number"), F("lng", "Longitude", "number"), F("skip", "Leave this pin off the map", "toggle")] }),
        F("mapText", "Sentence under the map ({miles} = visitor's distance)", "textarea"),
        F("mapTextNoLocation", "Sentence when the visitor's location is unknown", "textarea"),
        F("mapTextNearby", "Sentence when the visitor is nearby (under 30 miles)", "textarea"),
        F("mapAvatar", "Picture on your current city (last pin)", "image"),
        F("mapAvatarAlt", "Picture description", "text")], MEDIA),
      bind: Object.assign(headBind("sections.route", true), { stops: "route", journey: "journey",
        mapText: "journeyMap.text", mapTextNoLocation: "journeyMap.textNoLocation", mapTextNearby: "journeyMap.textNearby", mapAvatar: "journeyMap.avatar", mapAvatarAlt: "journeyMap.avatarAlt" }), looks: ["background", "spacing"] },
    "about-toolbox": { label: "Toolbox", anchor: "toolbox", about: "Tool groups and their items.",
      fields: HEAD.concat([F("groups", "Groups", "list", { item: "group", fields: [F("group", "Group", "text"), F("items", "Items (one per line)", "lines")] })], MEDIA),
      bind: Object.assign(headBind("sections.toolbox", true), { groups: "toolbox" }),
      looks: ["background", "spacing"], styleDefaults: { background: "tint" } },
    "about-principle": { label: "Principle and field notes", anchor: "principle", about: "The Latin line, field notes, and the Off the clock teaser.",
      fields: [F("latin", "Latin", "text"), F("translation", "Translation", "text"), F("note", "Note", "textarea"), F("fieldnotes", "Field notes", "textarea"),
        F("octTitle", "Off the clock teaser: title", "text"), F("octText", "Off the clock teaser: text", "textarea"), F("octButton", "Off the clock teaser: button", "text")],
      bind: { latin: "principle.latin", translation: "principle.translation", note: "principle.note", fieldnotes: "fieldnotes",
        octTitle: "offclockTeaser.title", octText: "offclockTeaser.text", octButton: "offclockTeaser.button" },
      looks: ["background", "spacing"] },
    "about-contact": { label: "Contact", anchor: "contact", about: "Heading plus email, LinkedIn and GitHub buttons (links come from Site links).",
      fields: HEAD.concat(MEDIA), bind: headBind("sections.contact", true),
      looks: ["background", "spacing"], styleDefaults: { background: "tint" } },

    /* ---- Analytics site (files: hero, lanes, page) ---- */
    "analytics-hero": { label: "Header", anchor: "top", about: "Title block. The live / drafted / queued counts update by themselves.",
      fields: ORG_HERO, bind: ORG_HERO_BIND },
    "analytics-lanes": { label: "Lanes and case studies", anchor: "lanes", about: "Each lane is a block of case-study cards plus its pipeline list. Charts on a card are edited in the repo.",
      fields: [F("laneEyebrow", "Word before each lane number", "text"), F("allLabel", "Label of the “All” filter", "text"),
        F("lanes", "Lanes", "list", { item: "lane", fields: [F("name", "Lane name", "text"), F("id", "Lane link name (#…)", "text"),
          F("blurb", "Intro", "textarea"), F("embed", "Embed link (optional)", "url"),
          F("projects", "Case studies", "list", { item: "case study", fields: PROJECT }),
          F("pipeline", "In the pipeline", "list", { item: "title", fields: [F("title", "Title", "text"), F("link", "Link (optional)", "url"), F("status", "Status tag", "text")] }),
        ].concat(MEDIA) })],
      bind: { laneEyebrow: "page.laneEyebrow", allLabel: "page.subnavTop", lanes: "lanes.lanes" } },

    /* ---- Builds site (files: hero, projects, page) ---- */
    "builds-hero": { label: "Header", anchor: "top", about: "Title block plus the “What lives here” card.",
      fields: ORG_HERO.concat([F("nowTitle", "Side card title", "text", { group: "Side card" }),
        F("nowRows", "Side card rows", "list", { group: "Side card", item: "row", fields: [F("k", "Label", "text"), F("v", "Text", "text")] })]),
      bind: Object.assign({ nowTitle: "page.nowCard.title", nowRows: "page.nowCard.rows" }, ORG_HERO_BIND) },
    "builds-list": { label: "Builds", anchor: "builds", about: "One card per tool. Only cards set to live are shown.",
      fields: [F("projects", "Builds", "list", { item: "build", fields: PROJECT }),
        F("protoLabel", "Prototyping label", "text"), F("prototyping", "Prototyping line", "textarea")],
      bind: { projects: "projects.projects", protoLabel: "page.prototypingLabel", prototyping: "projects.prototyping" } },
  };
  Object.keys(NATIVE).forEach((k) => { NATIVE[k].native = true; NATIVE[k].single = true; NATIVE[k].looks = NATIVE[k].looks || []; TYPES[k] = NATIVE[k]; });

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
  function bindOf(section) {
    if (section.bind) return section.bind;
    const t = TYPES[section.type];
    return t && t.bind ? t.bind : null;
  }
  function get(data, section, key) {
    const b = bindOf(section);
    if (b && b[key]) return getPath(data, b[key]);
    return (section.content || {})[key];
  }
  function set(data, section, key, value) {
    const b = bindOf(section);
    if (b && b[key]) { setPath(data, b[key], value); return; }
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
  function lookDefault(section, key) {
    const t = TYPES[section.type] || {};
    return (t.styleDefaults && t.styleDefaults[key]) || (STYLE[key] || {}).default;
  }
  function look(section, key) {
    const s = section.style || {};
    return s[key] != null && s[key] !== "" ? s[key] : lookDefault(section, key);
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

  const api = { TYPES, BLOCKS, STYLE, getPath, setPath, get, set, read, look, lookDefault, bindOf, newId, sanitize, safeHref, plain };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Skeleton = api;
})(typeof window !== "undefined" ? window : this);
