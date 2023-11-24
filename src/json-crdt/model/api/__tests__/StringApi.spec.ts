import {Model} from '../../Model';

test('can edit a simple string', () => {
  const doc = Model.withLogicalClock();
  const api = doc.api;
  api.root([0, '123', 2]);
  const str = api.str([1]);
  str.ins(0, '0');
  str.ins(4, '-xxxx');
  str.ins(9, '-yyyyyyyy');
  str.del(9, 1);
  expect(str.view()).toEqual('0123-xxxxyyyyyyyy');
  expect(doc.view()).toEqual([0, '0123-xxxxyyyyyyyy', 2]);
});

test('can delete across two chunks', () => {
  const doc = Model.withLogicalClock();
  const api = doc.api;
  api.root('');
  const str = api.str([]);
  str.ins(0, 'aaa');
  str.ins(0, 'bbb');
  str.ins(0, 'ccc');
  str.del(1, 7);
  expect(str.view()).toEqual('ca');
});

describe('events', () => {
  test('can subscribe to "view" events', async () => {
    const doc = Model.withLogicalClock();
    const api = doc.api;
    api.root('');
    const str = api.str([]);
    let cnt = 0;
    const onView = () => cnt++;
    str.ins(0, 'aaa');
    expect(cnt).toEqual(0);
    str.events.on('view', onView);
    str.ins(0, 'bbb');
    await Promise.resolve();
    expect(cnt).toEqual(1);
    str.ins(0, 'ccc');
    await Promise.resolve();
    expect(cnt).toEqual(2);
    str.events.off('view', onView);
    str.del(1, 7);
    expect(cnt).toEqual(2);
  });

  test('batches consecutive updates into one "view" event dispatch', async () => {
    const doc = Model.withLogicalClock();
    const api = doc.api;
    api.root('');
    const str = api.str([]);
    let cnt = 0;
    const onChange = () => cnt++;
    str.ins(0, 'aaa');
    expect(cnt).toEqual(0);
    str.events.on('view', onChange);
    str.ins(0, 'bbb');
    str.ins(0, 'ccc');
    str.del(1, 7);
    await Promise.resolve();
    expect(cnt).toEqual(1);
  });

  describe('.changes', () => {
    test('can listen to events', async () => {
      const doc = Model.withLogicalClock();
      const api = doc.api;
      api.root('');
      const str = api.str([]);
      let cnt = 0;
      const onView = () => cnt++;
      str.ins(0, 'aaa');
      expect(cnt).toEqual(0);
      const unsubscribe = str.events.changes.listen(onView);
      str.ins(0, 'bbb');
      await Promise.resolve();
      expect(cnt).toEqual(1);
      str.ins(0, 'ccc');
      await Promise.resolve();
      expect(cnt).toEqual(2);
      unsubscribe();
      str.del(1, 7);
      expect(cnt).toEqual(2);
    });
  });

  describe('SyncStore', () => {
    test('can listen to events', async () => {
      const doc = Model.withLogicalClock();
      const api = doc.api;
      api.root('');
      const str = api.str([]);
      let cnt = 0;
      const onView = () => cnt++;
      str.ins(0, 'aaa');
      expect(cnt).toEqual(0);
      expect(str.events.getSnapshot()).toEqual('aaa');
      const unsubscribe = str.events.subscribe(onView);
      str.ins(0, 'bbb');
      await Promise.resolve();
      expect(str.events.getSnapshot()).toEqual('bbbaaa');
      expect(cnt).toEqual(1);
      str.ins(0, 'ccc');
      await Promise.resolve();
      expect(str.events.getSnapshot()).toEqual('cccbbbaaa');
      expect(cnt).toEqual(2);
      unsubscribe();
      str.del(1, 7);
      expect(cnt).toEqual(2);
    });
  });
});


