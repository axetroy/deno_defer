import { test } from "https://deno.land/x/std/testing/mod.ts";
import {
  assertEquals,
  assertThrowsAsync
} from "https://deno.land/x/std/testing/asserts.ts";
import { deferify } from "./mod.ts";

test(async function deferifyAsync() {
  const tracks: number[] = [];

  await deferify(async function({ defer }) {
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
  })();

  assertEquals(tracks, [1, 3, 5, 4, 2]);
});

test(async function deferifyAsyncIfThrowErr() {
  const tracks: number[] = [];

  await assertThrowsAsync(
    async () => {
      await deferify(async function({ defer }) {
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
      })();
    },
    Error,
    "defer error 1"
  );

  assertEquals(tracks, [1, 3, 4, 2]);
});

test(async function deferifySyncWithReturn() {
  const tracks: number[] = [];
  let error: Error | void = undefined;
  let val: any;
  const result = await deferify(async function({ defer }) {
    tracks.push(1);
    defer(async ({ error: err, returnValue }) => {
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

test(async function deferifyAsyncWhenDeferThrowError() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  await deferify(function({ defer }) {
    defer(async () => {
      stillGoingNextDefer = true;
      tracks.push(1);
    });
    tracks.push(2);
    defer(async () => {
      throw new Error("defer error 2");
    });
    tracks.push(3);
  })();

  assertEquals(tracks, [2, 3, 1]);
  assertEquals(stillGoingNextDefer, true);
});

test(async function deferifyAsyncRecoverMainError() {
  const tracks: number[] = [];
  let error: Error | void = undefined;
  await assertThrowsAsync(
    async () => {
      await deferify(async function({ defer, recover }) {
        defer(() => {
          error = recover();
        });
        defer(() => {
          tracks.push(1);
        });
        tracks.push(2);
        throw new Error("main error");
      })();
    },
    Error,
    "main error"
  );

  assertEquals(tracks, [2, 1]);
  assertEquals(error !== undefined, true);
  // @ts-ignore
  assertEquals(error ? error.message : "", "main error");
});

test(async function deferifyAsyncRecoverDeferError() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  let error: Error | void = undefined;
  await deferify(async function({ defer, recover }) {
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

test(async function deferifyAsyncInterruptDefer() {
  const tracks: number[] = [];
  let stillGoingNextDefer = false;
  deferify(async function({ defer, recover }) {
    defer(async () => {
      stillGoingNextDefer = true;
      tracks.push(1);
    });
    tracks.push(2);
    defer(async ({ interrupt }) => {
      interrupt();
    });
    tracks.push(3);
  })();

  assertEquals(tracks, [2, 3]);
  assertEquals(stillGoingNextDefer, false);
});
