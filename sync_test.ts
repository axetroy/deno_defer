import { test } from "https://deno.land/std/testing/mod.ts";
import {
  assertEquals,
  assertThrows
} from "https://deno.land/std/testing/asserts.ts";
import { deferred } from "./mod.ts";

test({
  name: "[sync]: Ensure execution order",
  fn: () => {
    const tracks: number[] = [];

    const fn = deferred(function({ defer }) {
      tracks.push(1);
      defer(() => {
        tracks.push(2);
      });
      tracks.push(3);
      defer(() => {
        tracks.push(4);
      });
      tracks.push(5);
      return;
    });

    fn();

    assertEquals(tracks, [1, 3, 5, 4, 2]);
  }
});

test({
  name: "[sync]: Throw error in main function",
  fn: () => {
    const tracks: number[] = [];

    const fn = deferred(function({ defer }) {
      tracks.push(1);
      defer(() => {
        tracks.push(2);
      });
      tracks.push(3);
      defer(() => {
        tracks.push(4);
      });
      // throw error in here
      if (typeof defer) {
        throw new Error("defer error");
      }
      tracks.push(5);
      return;
    });

    assertThrows(fn, Error, "defer error");

    assertEquals(tracks, [1, 3, 4, 2]);
  }
});

test({
  name: "[sync]: With return value",
  fn: () => {
    const tracks: number[] = [];
    let error: Error | void = undefined;
    let val: any;

    const fn = deferred(function({ defer }) {
      tracks.push(1);
      defer(({ error: err, returnValue }) => {
        error = err;
        val = returnValue;
        tracks.push(2);
      });
      tracks.push(3);
      return 123;
    });

    const returnValue = fn();

    assertEquals(returnValue, 123);
    assertEquals(tracks, [1, 3, 2]);
    assertEquals(error, undefined);
    assertEquals(val, returnValue);
  }
});

test({
  name: "[sync]: Throw error in defer function",
  fn: () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;

    const fn = deferred(function({ defer }) {
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

    fn();

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
  }
});

test({
  name: "[sync]: Recover main error",
  fn: () => {
    const tracks: number[] = [];
    let error: Error | void = undefined;
    assertThrows(
      deferred(function({ defer, recover }) {
        defer(() => {
          error = recover();
        });
        defer(() => {
          tracks.push(1);
        });
        tracks.push(2);
        throw new Error("main error");
      }),
      Error,
      "main error"
    );

    assertEquals(tracks, [2, 1]);
    assertEquals(error !== undefined, true);
    // @ts-ignore
    assertEquals(error ? error.message : "", "main error");
  }
});

test({
  name: "[sync]: Recover defer error",
  fn: () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    let error: Error | void = undefined;

    const fn = deferred(function({ defer, recover }) {
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

    fn();

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
    assertEquals(error !== undefined, true);
    // @ts-ignore
    assertEquals(error ? error.message : "", "defer error");
  }
});

test({
  name: "[sync]: Recover main and defer error",
  fn: () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    let error: Error | void = undefined;

    const fn = deferred(function({ defer, recover }) {
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

    assertThrows(() => fn(), Error, "main error");

    assertEquals(tracks, [2, 3, 1]);
    assertEquals(stillGoingNextDefer, true);
    assertEquals(error !== undefined, true);
    assertEquals(error ? error.message : "", "defer error");
  }
});

test({
  name: "[sync]: Interrupt defer queue",
  fn: () => {
    const tracks: number[] = [];
    let stillGoingNextDefer = false;
    deferred(function({ defer, recover }) {
      defer(() => {
        stillGoingNextDefer = true;
        tracks.push(1);
      });
      tracks.push(2);
      defer(({ interrupt }) => {
        interrupt();
      });
      tracks.push(3);
    })();

    assertEquals(tracks, [2, 3]);
    assertEquals(stillGoingNextDefer, false);
  }
});
