/* ============================================================
   admin/merge.js — keeps two writers from overwriting each other.

   The admin is not the only thing that writes to these JSON files
   (Muse and Claude push too). When you hit Save, the editor fetches
   the live file again. If it changed since you opened the tab, this
   file does a three-way merge:

     base   = the file as it was when you opened the tab
     mine   = what the form holds now
     theirs = the file as it is live right now

   Rules, field by field:
     - only you changed it        -> keep yours
     - only the other side did    -> keep theirs
     - you both made the same edit -> fine
     - you both changed it differently -> conflict, you pick

   Lists whose items all carry an "id" (posts, tiles, case studies,
   lanes) merge item by item, so adding a post here while Muse edits
   a different post is not a conflict.

   Plain JS, no build step. Works in the browser (window.Merge)
   and in node (module.exports) so it can be tested on its own.
   ============================================================ */
(function (root) {
  "use strict";

  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  /* JSON.stringify with sorted keys, so key order never counts as a change. */
  function stable(v) {
    if (v === undefined) return "undefined";
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (isObj(v)) {
      return "{" + Object.keys(v).sort().filter((k) => v[k] !== undefined)
        .map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
    }
    return JSON.stringify(v);
  }
  function same(a, b) { return stable(a) === stable(b); }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  function hasIds(arr) {
    if (!Array.isArray(arr)) return false;
    const seen = {};
    for (const it of arr) {
      if (!isObj(it) || it.id == null || it.id === "") return false;
      const k = String(it.id);
      if (seen[k]) return false;
      seen[k] = true;
    }
    return true;
  }
  function idKeyed(b, m, t) {
    const lists = [b || [], m, t];
    if (!lists.every(Array.isArray)) return false;
    if (!lists.every(hasIds)) return false;
    return lists.some((l) => l.length > 0);
  }
  function itemName(it) {
    if (!isObj(it)) return "";
    return String(it.title || it.place || it.name || it.label || it.id);
  }

  /* merge3(base, mine, theirs, choices?)
     choices: { [path]: "mine" | "theirs" } from the conflict picker.
     Returns { value, conflicts: [{ path, label, base, mine, theirs }] }. */
  function merge3(base, mine, theirs, choices) {
    const conflicts = [];
    const value = walk(base, mine, theirs, "", [], choices || {}, conflicts);
    return { value: value, conflicts: conflicts };
  }

  function walk(b, m, t, path, label, choices, conflicts) {
    if (same(m, t)) return clone(m);
    if (same(m, b)) return clone(t);
    if (same(t, b)) return clone(m);

    if (isObj(m) && isObj(t) && (b === undefined || isObj(b))) {
      const bb = b || {};
      const out = {};
      const keys = [];
      Object.keys(m).concat(Object.keys(t)).forEach((k) => { if (keys.indexOf(k) < 0) keys.push(k); });
      keys.forEach((k) => {
        const v = walk(bb[k], m[k], t[k], path + "/" + k, label.concat(k), choices, conflicts);
        if (v !== undefined) out[k] = v;
      });
      return out;
    }

    if (idKeyed(b, m, t)) return mergeById(b || [], m, t, path, label, choices, conflicts);

    /* true conflict */
    const choice = choices[path];
    conflicts.push({ path: path, label: label.join(" › ") || "(whole file)", base: clone(b), mine: clone(m), theirs: clone(t) });
    return clone(choice === "theirs" ? t : m);
  }

  function mergeById(b, m, t, path, label, choices, conflicts) {
    const map = (arr) => { const o = {}; arr.forEach((it) => { o[String(it.id)] = it; }); return o; };
    const B = map(b), M = map(m), T = map(t);
    const ids = (arr) => arr.map((it) => String(it.id));
    const mineReordered = !same(ids(m).filter((id) => B[id]), ids(b).filter((id) => M[id]));
    const primary = mineReordered ? ids(m) : ids(t);
    const other = mineReordered ? ids(t) : ids(m);

    const result = {};
    const all = [];
    ids(b).concat(ids(m), ids(t)).forEach((id) => { if (all.indexOf(id) < 0) all.push(id); });
    all.forEach((id) => {
      const nm = itemName(M[id] || T[id] || B[id]);
      const v = walk(B[id], M[id], T[id], path + "[id=" + id + "]", label.concat(nm), choices, conflicts);
      if (v !== undefined) result[id] = v;
    });

    const order = primary.filter((id) => result[id] !== undefined);
    other.forEach((id, i) => {
      if (result[id] === undefined || order.indexOf(id) >= 0) return;
      let at = -1;
      for (let j = i - 1; j >= 0; j--) { at = order.indexOf(other[j]); if (at >= 0) break; }
      order.splice(at + 1, 0, id);
    });
    Object.keys(result).forEach((id) => { if (order.indexOf(id) < 0) order.push(id); });
    return order.map((id) => result[id]);
  }

  /* diff(a, b): flat list of what differs, for the history panel.
     Each entry: { label, kind: "added" | "removed" | "changed", from, to } */
  function diff(a, b) {
    const out = [];
    (function go(x, y, label) {
      if (same(x, y)) return;
      if (isObj(x) && isObj(y)) {
        const keys = [];
        Object.keys(x).concat(Object.keys(y)).forEach((k) => { if (keys.indexOf(k) < 0) keys.push(k); });
        keys.forEach((k) => go(x[k], y[k], label.concat(k)));
        return;
      }
      if (hasIds(x) && hasIds(y)) {
        const X = {}, Y = {};
        x.forEach((it) => { X[String(it.id)] = it; });
        y.forEach((it) => { Y[String(it.id)] = it; });
        const all = [];
        x.concat(y).forEach((it) => { const id = String(it.id); if (all.indexOf(id) < 0) all.push(id); });
        all.forEach((id) => go(X[id], Y[id], label.concat(itemName(Y[id] || X[id]))));
        const ox = x.map((it) => String(it.id)).filter((id) => Y[id]);
        const oy = y.map((it) => String(it.id)).filter((id) => X[id]);
        if (!same(ox, oy)) out.push({ label: label.join(" › ") + " (order)", kind: "changed", from: "", to: "" });
        return;
      }
      const kind = x === undefined ? "added" : y === undefined ? "removed" : "changed";
      out.push({ label: label.join(" › ") || "(whole file)", kind: kind, from: x, to: y });
    })(a, b, []);
    return out;
  }

  const api = { merge3: merge3, diff: diff, stable: stable, same: same, clone: clone };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Merge = api;
})(typeof window !== "undefined" ? window : this);
