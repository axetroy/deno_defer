import { test } from "https://deno.land/std/testing/mod.ts";
import {
  assertEquals,
  assertThrowsAsync
} from "https://deno.land/std/testing/asserts.ts";
import { deferred } from "./mod.ts";

test({
  name: "[async]: Ensure execution order",
  fn: async () => {
    const tracks: number[] = [];

    const fn = deferred(async function({ defer }) {
      tracks.push(1);
      defer(async () => {
        tracks.push(2);
      });
      tracks.push(3);
      defer(async () => {
        tracks.push(4);
      });
      tracks.push(5);
      return;
    });

    const returnValue = await fn();

    assertEquals(tracks, [1, 3, 5, 4, 2]);
    assertEquals(returnValue, undefined);
  }
});

test({
  name: "[async]: Throw error in main function",
  fn: async () => {
    const tracks: number[] = [];

    const fn = deferred(async function({ defer }) {
      tracks.push(1);
      defer(() => {
        tracks.push(2);
      });
      tracks.push(3);
      defer(async () => {
        tracks.push(4);
      });
      // throw error in here
      if (typeof defer) {
        throw new Error("defer error 1");
      }
      tracks.push(5);
      return;
    });

    await assertThrowsAsync(
      async () => {
        await fn();
      },
      Error,
      "defer error 1"
    );

    assertEquals(tracks, [1, 3, 4, 2]);
  }
});

test({
  name: "[async]: With return value",
  fn: async function deferredSyncWithReturn() {
    const tracks: number[] = [];
    let error: Error | void = undefined;
    let val: any;
    const fn = await deferred(async function({ defer }) {
      tracks.push(1);
      defer(async ({ error: err, returnValue }) => {
        error = err;
        val = returnValue;
        tracks.push(2);
      });
      tracks.push(3);
      return 123;
    });

    const returnValue = await fn();

    assertEquals(returnValue, 123);
    assertEquals(tracks, [1, 3, 2]);
    assertEquals(error, undefined);
    assertEquals(val, returnValue);
  }
});

test({
  name: "[async]: Throw error in defer function",
  fn: async () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    const fn = await deferred(function({ defer }) {
      defer(async () => {
        stillGoingNextDefer = true;
        tracks.push(1);
      });
      tracks.push(2);
      defer(async () => {
        throw new Error("defer error 2");
      });
      tracks.push(3);
    });

    await fn();

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
  }
});

test({
  name: "[async]: Recover main error",
  fn: async () => {
    const tracks: number[] = [];
    let error: Error | void = undefined;

    const fn = await deferred(async function({ defer, recover }) {
      defer(() => {
        error = recover();
      });
      defer(() => {
        tracks.push(1);
      });
      tracks.push(2);
      throw new Error("main error");
    });

    await assertThrowsAsync(
      async () => {
        await fn();
      },
      Error,
      "main error"
    );

    assertEquals(tracks, [2, 1]);
    assertEquals(error !== undefined, true);
    assertEquals(error ? error.message : "", "main error");
  }
});

test({
  name: "[async]: Recover defer error",
  fn: async () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    let error: Error | void = undefined;

    const fn = deferred(async function({ defer, recover }) {
      defer(() => {
        error = recover();
      });
      defer(() => {
        stillGoingNextDefer = true;
        tracks.push(1);
      });
      tracks.push(2);
      defer(() => {
        throw new Error("defer error");
      });
      tracks.push(3);
    });

    await fn();

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
    assertEquals(error !== undefined, true);
    assertEquals(error ? error.message : "", "defer error");
  }
});

test({
  name: "[async]: Recover main and defer error",
  fn: async () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    let error: Error | void = undefined;

    const fn = deferred(async function({ defer, recover }) {
      defer(() => {
        error = recover();
      });

      defer(() => {
        stillGoingNextDefer = true;
        tracks.push(1);
      });

      tracks.push(2);

      defer(() => {
        // it should recover the main error
        throw new Error("defer error");
      });

      tracks.push(3);

      throw new Error("main error");
    });

    await assertThrowsAsync(async () => await fn(), Error, "main error");

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
    assertEquals(error !== undefined, true);
    assertEquals(error ? error.message : "", "defer error");
  }
});

test({
  name: "[async]: Interrupt defer queue",
  fn: async () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;

    const fn = deferred(async function({ defer, recover }) {
      defer(async () => {
        stillGoingNextDefer = true;
        tracks.push(1);
      });
      tracks.push(2);
      defer(async ({ interrupt }) => {
        interrupt();
      });
      tracks.push(3);
    });

    await fn();

    assertEquals(tracks, [2, 3]);
    assertEquals(stillGoingNextDefer, false);
  }
});
