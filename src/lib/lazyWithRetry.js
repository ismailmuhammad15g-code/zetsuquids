import React from "react";

// Lazy loader with retry for dynamic imports. Useful when dev server transiently
// fails to serve an optimized module (avoids fatal "Failed to fetch dynamically imported module" errors).
export function lazyWithRetry(factory, retries = 3, delay = 500) {
  return React.lazy(
    () =>
      new Promise((resolve, reject) => {
        const attempt = (n) => {
          factory()
            .then(resolve)
            .catch((err) => {
              if (n === 0) {
                reject(err);
              } else {
                setTimeout(() => attempt(n - 1), delay);
              }
            });
        };
        attempt(retries);
      }),
  );
}

export default lazyWithRetry;
