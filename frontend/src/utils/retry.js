export async function retryWhenNeeded(method, maxRetries = 3, delay = 5000) {
  try {
    return await method();
  } catch (e) {
    if (maxRetries <= 1 || !e.retry) {
      throw e;
    }
    return new Promise((resolve, reject) => {
      window.setTimeout(
        async () => {
          try {
            resolve(await retryWhenNeeded(method, maxRetries - 1, delay));
          } catch (e) {
            reject(e);
          }
        }, delay
      );
    });
  }
}

export function NeedsToRetry() {
  const error = new Error('Needs to retry');
  error.retry = true;
  return error;
}
