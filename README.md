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
  console.log("1. create database connection...");

  defer(async () => {
    console.log("5. destroy database connection!");
  });

  console.log("2. insert test data...");

  defer(async () => {
    console.log("6. remove test data!");
  });

  console.log("3. report to remote server...");

  defer(async () => {
    console.log("7. close remote connection!");
  });

  console.log("4. job done.");
});

fn.then(() => {
  console.log("exit");
}).catch(err => {
  console.error(err);
});

// 1. create database connection...
// 2. insert test data...
// 3. report to remote server...
// 4. job done.
// 5. close remote connection!
// 6. remove test data!
// 7. destroy database connection!
// exit
```

## License

The [MIT License](https://github.com/axetroy/deno-defer/blob/master/LICENSE)
