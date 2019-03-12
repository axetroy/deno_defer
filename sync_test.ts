import { test } from "https://deno.land/x/std/testing/mod.ts";
import {
  assertEquals,
  assertThrows
} from "https://deno.land/x/std/testing/asserts.ts";
import { deferify } from "./mod.ts";

test(function deferifySync() {
  const tracks: number[] = [];

  deferify(function({ defer }) {
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
  })();

  assertEquals(tracks, [1, 3, 5, 4, 2]);
});

test(function deferifySyncIfThrowErr() {
  const tracks: number[] = [];

  assertThrows(
    deferify(function({ defer }) {
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
    }),
    Error,
    "defer error"
  );

  assertEquals(tracks, [1, 3, 4, 2]);
});

test(function deferifySyncWithReturn() {
  const tracks: number[] = [];
  let error: Error | void = undefined;
  let val: any;
  const result = deferify(function({ defer }) {
    tracks.push(1);
    defer(({ error: err, returnValue }) => {
      error = err;
      val = returnValue;
      tracks.push(2);
    });
    tracks.push(3);
    return 123;
  })();

  assertEquals(result, 123);
  assertEquals(tracks, [1, 3, 2]);
  assertEquals(error, undefined);
  assertEquals(val, result);
});

test(function deferifySyncWhenDeferThrowError() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  deferify(function({ defer }) {
    defer(() => {
      stillGoingNextDefer = true;
      tracks.push(1);
    });
    tracks.push(2);
    defer(() => {
      throw new Error("defer error");
    });
    tracks.push(3);
  })();

  assertEquals(tracks, [2, 3, 1]);
  assertEquals(stillGoingNextDefer, true);
});

test(function deferifySyncRecoverMainError() {
  const tracks: number[] = [];
  let error: Error | void = undefined;
  assertThrows(
    deferify(function({ defer, recover }) {
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
});

test(function deferifySyncRecoverDeferError() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  let error: Error | void = undefined;
  deferify(function({ defer, recover }) {
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
  })();

  assertEquals(tracks, [2, 3, 1]);
  assertEquals(stillGoingNextDefer, true);
  assertEquals(error !== undefined, true);
  // @ts-ignore
  assertEquals(error ? error.message : "", "defer error");
});

test(function deferifySyncInterruptDefer() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  deferify(function({ defer, recover }) {
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
});
