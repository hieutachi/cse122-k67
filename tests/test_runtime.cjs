'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/app.js'), 'utf8');

function context(pathname = '/cse122-k67/index.html', values = {}, blocked = false) {
  const store = new Map(Object.entries(values));
  const label = {textContent: ''};
  const link = {href: '', classList: {remove() {}}, querySelector: () => label};
  const ctx = {
    URL, location: {pathname},
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage disabled'); return store.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage disabled'); store.set(key, value); }
    },
    document: {
      addEventListener() {},
      querySelector(selector) { return selector.startsWith('script') ? {src: 'https://example.test/cse122-k67/assets/js/app.js?v=1'} : {textContent: 'Tên bài học'}; },
      querySelectorAll() { return [link]; }
    }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  return {ctx, store, link, label};
}

test('shuffle preserves option identity and correct answer for every question', () => {
  const quiz = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/quiz.json'), 'utf8'));
  const {ctx} = context();
  for (const item of Object.values(quiz.chapters).flat()) {
    for (const random of [() => 0, () => .4, () => .999]) {
      const options = ctx.quizOptions(item, random);
      assert.deepEqual(Array.from(options, o => o.text).sort(), [...item.opts].sort());
      assert.equal(options.filter(o => o.correct).length, 1);
      assert.equal(options.find(o => o.correct).text, item.opts[item.a]);
    }
  }
});

test('new resume state wins over stale legacy state on all index pages', () => {
  for (const page of ['index.html', 'ebook/index.html', 'baidoc/index.html']) {
    const saved = {path: 'baidoc/09-javascript-basics-objects-json.html', title: 'Objects & JSON'};
    const {ctx, link, store} = context('/cse122-k67/' + page, {
      'cse122-resume-v1': JSON.stringify(saved), 'cse122-last': 'chuong-1', 'cse122-last-lesson': 'index'
    });
    ctx.initLastLesson();
    assert.equal(link.href, 'https://example.test/cse122-k67/' + saved.path);
    assert.deepEqual(JSON.parse(store.get('cse122-resume-v1')), saved);
  }
});

test('actual lesson/chapter updates resume, list never overwrites it', () => {
  for (const file of ['baidoc/09-javascript-basics-objects-json.html', 'ebook/chuong-4.html']) {
    const {ctx, store} = context('/cse122-k67/' + file);
    ctx.initLastLesson();
    assert.equal(JSON.parse(store.get('cse122-resume-v1')).path, file);
  }
});

test('migrates legacy chapter and lesson but not index or malicious paths', () => {
  for (const bad of ['index', '../secret', 'https://evil.test', null]) {
    const {ctx, link} = context('/cse122-k67/baidoc/index.html', {'cse122-last-lesson': bad, 'cse122-last': 'chuong-4'});
    ctx.initLastLesson();
    assert.equal(link.href, 'https://example.test/cse122-k67/ebook/chuong-4.html');
  }
  const {ctx, link} = context(undefined, {'cse122-last-lesson': '09-javascript-basics-objects-json'});
  ctx.initLastLesson();
  assert.match(link.href, /baidoc\/09-javascript-basics-objects-json.html$/);
});

test('corrupt or disabled storage does not break initialization or erase progress', () => {
  for (const blocked of [true, false]) {
    const {ctx} = context(undefined, {'cse122-resume-v1': '{', 'cse122-done': '{}'}, blocked);
    assert.doesNotThrow(() => ctx.initLastLesson());
    assert.equal(ctx.readDoneLessons().length, 0);
  }
  const {ctx} = context(undefined, {'cse122-done': '["a.html","a.html",42,"b.html"]'});
  assert.deepEqual(Array.from(ctx.readDoneLessons()), ['a.html', 'b.html']);
});