type func<T> = (context: Context) => Promise<T> | T;

interface DequeueParams {
  readonly error?: Error; // error run in the main function
  readonly returnValue?: any; // the return value of main function
}

interface DeferFuncParams extends DequeueParams {
  readonly interrupt: () => void;
}

type Recover = () => Error | void;
type DeferFunc = (params: DeferFuncParams) => Promise<void> | void;
type Defer = (fn: DeferFunc) => void;

interface Context {
  error?: Error; // !!!: DO NOT USE IT IN YOUR CODE
  readonly defer: Defer; // defer function
  readonly recover: Recover; // return all error in this context including defer function
}

export function deferred<T>(fn: func<T>) {
  type fnReturnType = ReturnType<func<T>>;

  return function(): fnReturnType {
    const defers: DeferFunc[] = [];
    const context: Context = {
      error: undefined,
      defer(fn) {
        defers.push(fn);
        return;
      },
      recover() {
        return context.error;
      }
    };

    // apply defer function
    function deferApply(fn: DeferFunc, param: DeferFuncParams) {
      try {
        const result = fn(param);
        if (result instanceof Promise) {
          return result.catch(() => Promise.resolve());
        }
        return result;
      } catch (err) {
        context.error = err;
      }
    }

    // dequeue defers in async
    // it always resolve. no reject.
    async function dequeue(param: DequeueParams) {
      while (defers.length) {
        const deferFn = defers.pop();
        if (deferFn) {
          let shouldStop = false;
          await deferApply(deferFn, {
            ...param,
            interrupt() {
              shouldStop = true;
            }
          });
          if (shouldStop) {
            break;
          }
        }
      }
    }

    // dequeue defers in sync
    // it never throws error
    function dequeueSync(param: DequeueParams) {
      while (defers.length) {
        const deferFn = defers.pop();
        if (deferFn) {
          let shouldStop = false;
          deferApply(deferFn, {
            ...param,
            interrupt() {
              shouldStop = true;
            }
          });
          if (shouldStop) {
            break;
          }
        }
      }
    }

    let result: fnReturnType;
    try {
      result = fn(context);
    } catch (err) {
      context.error = err;
      dequeueSync({ error: err, returnValue: undefined });
      throw err;
    }

    if (result instanceof Promise) {
      return result
        .then((r: T) => dequeue({ returnValue: r }).then(() => r))
        .catch((err: Error) => {
          context.error = err;
          return dequeue({ error: err, returnValue: undefined }).then(() =>
            Promise.reject(err)
          );
        });
    } else {
      dequeueSync({ returnValue: result });
      return result;
    }
  };
}
