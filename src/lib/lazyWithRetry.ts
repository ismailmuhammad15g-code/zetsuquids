import React from "react";

// Lazy loader with retry for dynamic imports. Useful when dev server transiently
// fails to serve an optimized module (avoids fatal "Failed to fetch dynamically imported module" errors).
export function lazyWithRetry(
    factory: () => Promise<{ default: React.ComponentType<unknown> }>,
    retries: number = 3,
    delay: number = 500
): React.LazyExoticComponent<React.ComponentType<unknown>> {
    return React.lazy(
        () =>
            new Promise<{ default: React.ComponentType<unknown> }>((resolve, reject) => {
                const attempt = (n: number): void => {
                    factory()
                        .then(resolve)
                        .catch((err: unknown) => {
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
