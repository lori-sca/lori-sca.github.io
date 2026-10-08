# lori-sca.github.io

Personal site. Plain HTML, CSS and JS, no build step. Everything you read on the
site lives in `data/*.json` and `fun/*.json` and is edited from `/admin/`.

## Three layers (read before changing anything)

| Layer | Files | Who changes it |
|---|---|---|
| Content | `data/*.json`, `fun/*.json` | Lori, through `/admin/` |
| Skeleton | `skeleton.js` | Only additively: new section types or fields |
| Design | `theme.js`, `theme.css`, `styles.css`, page HTML | Any redesign |

- **Skeleton is a contract.** Never rename or remove a section type or a field key in
  `skeleton.js`, and never rename or remove a JSON key. The admin's forms are generated
  from the skeleton, so breaking it breaks editing.
- **A redesign rewrites the design layer only.** It must keep reading the same field
  names. New kinds of sections are added to the skeleton as new types.
- **Pages built from sections** keep a `layout.sections` list in their JSON. Sections
  that existed before the builder are *built-in* types in `skeleton.js` whose `bind`
  points at the original keys, so those keys stay the single source of truth, and the
  page's own drawing code still draws them. `theme.js` then orders, hides and restyles
  them and draws any builder-added sections in between.
  On sections: Home, About, Writing here, and both sister sites
  (lorisca-analytics, lorisca-builds), which load `skeleton.js`, `theme.js` and
  `theme.css` from this site. Not yet: Off the clock.
- **Live preview**: any page opened as `page.html?preview=1` inside the admin draws
  from unsaved data the admin sends it (see the end of `site.js`).

## Admin

`/admin/` saves straight to GitHub with Lori's own key (kept in her browser only).

- `admin/merge.js` combines edits when someone else changed a file since it was opened.
- `admin/builder.js` is the page builder (sections, blocks, live preview).
- Every save is a commit, so History & restore in the admin can roll any file back.

The admin is a second writer: anything that edits these JSON files directly should
expect the admin to merge with it, and should not rename keys.
