# Decisions

Why this site is built the way it is. One entry per decision, newest last. Each entry says what was chosen, what else was on the table, and what it costs. If a decision changes, the old entry stays and a new one replaces it.

---

## 1. Plain HTML, CSS and JS, no build step

**Status:** in force since September 2026

**Context.** The site is edited by me and by several AI coding agents, often in the same week. Each one should be able to open a file, change it and push, without installing anything or learning a toolchain. GitHub Pages serves files exactly as they are in the repo.

**Options.** The first plan was a React app (Vite or Next.js) with Tailwind, kept free of platform-specific libraries so it could move between tools. The alternative was plain files served directly by GitHub Pages.

**Why plain files.** Nothing to compile means nothing to break between an edit and the live page. Any agent, or I, can fix a typo straight in the browser editor. What you read in the repo is what the browser runs.

**Trade-off.** No components, no bundling, no type checks. Some markup repeats across pages. Cache busting is done by hand with version query strings (for example `skeleton.js?v=3`).

---

## 2. Three layers: content, skeleton, design

**Status:** in force since October 2026

**Context.** I wanted to edit everything myself, Notion-style, and I knew the design would change more than once. A redesign must never cost me the ability to edit.

**Options.** Hand-coded edit forms for each page, or forms generated from one shared description of every section type.

**Decision.** Three layers with one rule each:
- **Content** lives in `data/*.json` and `fun/*.json`.
- **Skeleton** is `skeleton.js`. It lists every section type and its fields. The admin builds its forms from it and the theme draws pages from the same field names. Additive only: types and fields are added, never renamed or removed.
- **Design** is `theme.js`, `theme.css`, `shared.css` and `styles.css`. A redesign rewrites this layer and nothing else.

**Why.** A new section type gets an edit form for free. Before the real redesign, a trial look was swapped in on all five pages by changing the design layer alone, with content and forms untouched.

**Trade-off.** Field names are frozen for good, so the skeleton only grows. Sections that existed before the builder keep their original JSON paths through a `bind` map, which adds one level of indirection. Site links and Off the clock still use hand-coded forms.

---

## 3. One admin for three sites

**Status:** in force since October 2026

**Context.** The portfolio runs as three GitHub Pages sites: this one, the case studies (lorisca-analytics.github.io) and the builds (lorisca-builds.github.io).

**Options.** A separate admin per site, or one admin with a site switcher.

**Decision.** One admin at `/admin/`, with the three sites listed in `SITES` in `admin/index.html`. Both sister sites load `skeleton.js`, `theme.js`, `theme.css` and `shared.css` from this site.

**Why.** One place to edit, one set of section types, one look. A fix to the skeleton or theme reaches all three sites at once.

**Trade-off.** This site is now a dependency of the other two. A broken shared file here breaks the sister sites too, so changes to shared files get checked on all three.

---

## 4. The admin saves straight to GitHub

**Status:** in force since October 2026

**Context.** The site is static: no server, no database. I still needed a real editor with history.

**Options.** A hosted CMS or a small backend, or an editor in the browser that writes to the repo through the GitHub API.

**Decision.** The admin commits through the GitHub API with my own access key, which stays in my browser. Every save is a commit.

**Why.** No server to run or pay for. Git becomes the history: the admin's History & restore panel shows the last 30 versions of any file and rolls back in one click.

**Trade-off.** The key lives in browser storage, so it is only as safe as the device. Whether to stop keeping it between sessions is still open. Commit history fills up with small "Update ... via page builder" commits.

---

## 5. Three-way merge on save

**Status:** in force since October 2026. Tested in `admin/merge.test.js`.

**Context.** The admin is not the only writer. AI agents push changes to the same JSON files, and I sometimes have two tabs open. A save that blindly overwrites the live file would silently drop someone else's work.

**Options.** Last write wins, refusing to save whenever the file changed, or merging.

**Decision.** On save, the admin fetches the live file again and runs a three-way merge (`admin/merge.js`): the file when the tab opened, what the form holds now, and what is live. Field by field, a one-sided change wins and matching edits agree. Only a field both sides changed differently goes to a picker. Lists whose items carry an `id` merge item by item, so adding a post while an agent edits a different post is not a conflict.

**Why.** Saves stay safe without locking anyone out, and I am only asked when there is a real decision to make.

**Trade-off.** More code than a plain overwrite, and real conflicts still need a person. When both sides reorder the same list, the merge keeps one order and slots new items next to their neighbours, which is a judgment call, not a guarantee. The tests pin that behavior down so it can't drift.

---

## 6. Drafts gate automation, not me

**Status:** decided 8 October 2026

**Context.** Automated imports pull copy from repo READMEs onto the site. That copy needs a human read before it goes public. My own edits in the admin don't.

**Options.** Every change lands as a draft, or only automated changes do.

**Decision.** Anything an import or sync brings in lands with status `draft` and stays off the public pages until I flip it. My own edits in the admin go live on save.

**Why.** The draft step exists to catch copy no human has read. Making my own edits wait would add a step without adding a check.

**Trade-off.** A careless edit of mine goes live immediately. History & restore is the safety net for that.

---

## 7. A card's id is its repo name, and never changes once live

**Status:** agreed October 2026

**Context.** Cards on the case-study and builds sites are linked from the home page, from search and from the sync. If an id changes, those links break.

**Options.** Free-form ids picked per card, or the repo name.

**Decision.** A card's `id` equals its repo name and is frozen once the card is live.

**Why.** One name everywhere, so a repo, its card and every link to it can be matched without a lookup table.

**Trade-off.** A repo can't be renamed casually after launch. Three Builds cards were created before the rule and keep their older ids. Cards whose repo lives outside the org carry their repo link on the card.

---

## 8. Sync runs on demand, never on a timer

**Status:** design agreed 8 October 2026. The Work site already imports from GitHub through the admin. The full sync engine is not built yet.

**Context.** When I finish a project and push the repo, its card and the profile READMEs should update without hand edits. But I often keep refining a repo after the first push.

**Options.** A scheduled daily sync, or a sync I start myself.

**Decision.** Sync only when I start it. It lands drafts (see 6), can run again on the same repo days later, shows what changed, and leaves fields I edited by hand alone unless I say otherwise. It flags problems in the copy and never rewrites my wording.

**Why.** A timer would publish half-finished READMEs. Starting it myself keeps publishing a decision.

**Trade-off.** Nothing updates until I remember to run it.
