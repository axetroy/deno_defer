[![Build Status](https://travis-ci.com/axetroy/deno-deferred.svg?branch=master)](https://travis-ci.com/axetroy/deno-deferred)

### Implement Golang's defer in Deno

### Use Scenes

- Destroy resource.

- Auto Commit or Rollback in Transaction.

- Defer job to do.

### Usage

use in `deno`

```typescript
import { deferred } from "https://github.com/axetroy/deno-defer/raw/master/mod.ts";

const fn = deferred(async ({ defer, recover }) => {
  console.log("do first job");

  defer(async () => {
    console.log("1");
  });

  console.log("do second job");

  defer(async () => {
    console.log("2");
  });

  console.log("do third job");

  defer(async () => {
    console.log("3");
  });

  console.log("job done.");
});

fn.then(() => {
  console.log("exit");
}).catch(err => {
  console.error(err);
});

// do first job
// do second job
// do third job
// job done.
// 3
// 2
// 1
// exit
```

## License

The [MIT License](https://github.com/axetroy/deno-defer/blob/master/LICENSE)
