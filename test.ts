import { runIfMain } from "https://deno.land/std/testing/mod.ts";

import "./sync_test.ts";
import "./async_test.ts";

runIfMain(import.meta);
