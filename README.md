### Implement Golang's defer in Deno

[![Greenkeeper badge](https://badges.greenkeeper.io/axetroy/deferify.svg)](https://greenkeeper.io/)

### Usage

use in `deno`

```typescript
import { deferify } from "https://github.com/axetroy/deferify/raw/master/mod.ts";

const fn = deferify(async ({ defer, recover }) => {
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

The [MIT License](https://github.com/axetroy/deferify/blob/master/LICENSE)
