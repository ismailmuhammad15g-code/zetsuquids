// Simple className utility function (no external dependencies)
export function cn(...inputs) {
    return inputs
        .flat()
        .filter(Boolean)
        .join(' ')
        .trim();
}
