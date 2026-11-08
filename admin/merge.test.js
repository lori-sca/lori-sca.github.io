// Tests for admin/merge.js. Run from the repo root with: node --test
// Zero dependencies: node's built-in test runner and assert only.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { merge3, diff, stable, same, clone } = require("./merge.js");

const post = (id, title, extra) => Object.assign({ id: id, title: title }, extra);

test.describe("merge3: plain fields", () => {
  test.it("keeps my edit when only I changed a field", () => {
    const r = merge3({ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 1, b: 1 });
    assert.deepEqual(r.value, { a: 2, b: 1 });
    assert.equal(r.conflicts.length, 0);
  });

  test.it("keeps their edit when only the other writer changed a field", () => {
    const r = merge3({ a: 1, b: 1 }, { a: 1, b: 1 }, { a: 1, b: 9 });
    assert.deepEqual(r.value, { a: 1, b: 9 });
    assert.equal(r.conflicts.length, 0);
  });

  test.it("combines edits to different fields of the same file", () => {
    const r = merge3({ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 1, b: 3 });
    assert.deepEqual(r.value, { a: 2, b: 3 });
    assert.equal(r.conflicts.length, 0);
  });

  test.it("treats the same edit on both sides as agreement, not a conflict", () => {
    const r = merge3({ hero: { title: "Old" } }, { hero: { title: "New" } }, { hero: { title: "New" } });
    assert.deepEqual(r.value, { hero: { title: "New" } });
    assert.equal(r.conflicts.length, 0);
  });

  test.it("keeps keys the form never touched (keys with no admin input survive a save)", () => {
    const base = { title: "T", chart: { kind: "bar" } };
    const r = merge3(base, { title: "T2", chart: { kind: "bar" } }, base);
    assert.deepEqual(r.value, { title: "T2", chart: { kind: "bar" } });
  });
});

test.describe("merge3: conflicts", () => {
  const base = { hero: { title: "Old", sub: "s" } };
  const mine = { hero: { title: "Mine", sub: "s" } };
  const theirs = { hero: { title: "Theirs", sub: "s" } };

  test.it("reports a conflict when both sides change the same field differently", () => {
    const r = merge3(base, mine, theirs);
    assert.equal(r.conflicts.length, 1);
    const c = r.conflicts[0];
    assert.equal(c.path, "/hero/title");
    assert.equal(c.label, "hero › title");
    assert.equal(c.base, "Old");
    assert.equal(c.mine, "Mine");
    assert.equal(c.theirs, "Theirs");
  });

  test.it("defaults an unresolved conflict to my value", () => {
    assert.equal(merge3(base, mine, theirs).value.hero.title, "Mine");
  });

  test.it("applies the picker's choice for a conflicting path", () => {
    const r = merge3(base, mine, theirs, { "/hero/title": "theirs" });
    assert.equal(r.value.hero.title, "Theirs");
    assert.equal(r.value.hero.sub, "s");
  });

  test.it("treats my delete against their edit as a conflict", () => {
    const r = merge3({ a: 1, b: 1 }, { a: 1 }, { a: 1, b: 2 });
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].path, "/b");
    assert.equal("b" in r.value, false, "unresolved delete-vs-edit keeps my delete");
  });

  test.it("labels a conflict on a whole primitive file as (whole file)", () => {
    const r = merge3("a", "b", "c");
    assert.equal(r.conflicts[0].label, "(whole file)");
  });

  test.it("treats a list without ids as one value", () => {
    const r = merge3({ tags: ["a"] }, { tags: ["a", "b"] }, { tags: ["a", "c"] });
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].path, "/tags");
  });
});

test.describe("merge3: lists keyed by id (posts, tiles, case studies, lanes)", () => {
  const base = [post("p1", "One"), post("p2", "Two")];

  test.it("adding an item here while the other side edits a different item is not a conflict", () => {
    const mine = base.concat([post("p3", "Three")]);
    const theirs = [post("p1", "One"), post("p2", "Two, edited")];
    const r = merge3({ posts: base }, { posts: mine }, { posts: theirs });
    assert.equal(r.conflicts.length, 0);
    assert.deepEqual(r.value.posts.map((p) => p.id), ["p1", "p2", "p3"]);
    assert.equal(r.value.posts[1].title, "Two, edited");
  });

  test.it("merges edits to different fields of the same item", () => {
    const mine = [post("p1", "One, mine"), post("p2", "Two")];
    const theirs = [post("p1", "One", { photo: "x.jpg" }), post("p2", "Two")];
    const r = merge3(base, mine, theirs);
    assert.equal(r.conflicts.length, 0);
    assert.deepEqual(r.value[0], post("p1", "One, mine", { photo: "x.jpg" }));
  });

  test.it("honours a delete on one side when the other side left the item alone", () => {
    const r = merge3(base, [post("p2", "Two")], base);
    assert.deepEqual(r.value.map((p) => p.id), ["p2"]);
    assert.equal(r.conflicts.length, 0);
  });

  test.it("names the item in the conflict label by my version's title", () => {
    const r = merge3(base, [post("p1", "A"), post("p2", "Two")], [post("p1", "B"), post("p2", "Two")]);
    assert.equal(r.conflicts.length, 1);
    assert.equal(r.conflicts[0].path, "[id=p1]/title");
    assert.equal(r.conflicts[0].label, "A › title");
  });

  test.it("keeps my new order when I reordered, and still adds their new item", () => {
    const b = [post("a", "A"), post("b", "B"), post("c", "C")];
    const mine = [post("c", "C"), post("b", "B"), post("a", "A")];
    const theirs = b.concat([post("d", "D")]);
    const r = merge3(b, mine, theirs);
    assert.deepEqual(r.value.map((p) => p.id), ["c", "d", "b", "a"]);
  });

  test.it("keeps their order when they reordered, and slots my new item after its neighbour", () => {
    const b = [post("a", "A"), post("b", "B"), post("c", "C")];
    const theirs = [post("c", "C"), post("b", "B"), post("a", "A")];
    const mine = b.concat([post("d", "D")]);
    const r = merge3(b, mine, theirs);
    assert.deepEqual(r.value.map((p) => p.id), ["c", "d", "b", "a"]);
  });
});

test.describe("key order and copies", () => {
  test.it("never counts key order as a change", () => {
    assert.equal(stable({ a: 1, b: { x: 1, y: 2 } }), stable({ b: { y: 2, x: 1 }, a: 1 }));
    assert.ok(same({ a: 1, b: 2 }, { b: 2, a: 1 }));
    const r = merge3({ a: 1, b: 2 }, { b: 2, a: 1 }, { a: 1, b: 5 });
    assert.deepEqual(r.value, { a: 1, b: 5 });
    assert.equal(r.conflicts.length, 0);
  });

  test.it("returns a copy, so editing the result never changes the inputs", () => {
    const mine = { hero: { title: "T" } };
    const r = merge3({}, mine, {});
    r.value.hero.title = "changed";
    assert.equal(mine.hero.title, "T");
    assert.equal(clone(undefined), undefined);
  });
});

test.describe("diff: what the history panel shows", () => {
  test.it("lists added, removed and changed fields with readable labels", () => {
    const d = diff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
    assert.deepEqual(d, [
      { label: "b", kind: "changed", from: 2, to: 3 },
      { label: "c", kind: "added", from: undefined, to: 4 },
    ]);
  });

  test.it("follows items by id and reports a reorder once", () => {
    const x = [post("p1", "One"), post("p2", "Two")];
    const y = [post("p2", "Two"), post("p1", "One")];
    assert.deepEqual(diff(x, y), [{ label: " (order)", kind: "changed", from: "", to: "" }]);
    const removed = diff(x, [post("p1", "One")]);
    assert.equal(removed.length, 1);
    assert.equal(removed[0].kind, "removed");
    assert.equal(removed[0].label, "Two");
  });

  test.it("returns nothing for identical files", () => {
    assert.deepEqual(diff({ a: [1, 2] }, { a: [1, 2] }), []);
  });
});
