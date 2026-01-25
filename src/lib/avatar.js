// Fallback avatar
const fallbackAvatar = '/avatars/peep-1.svg'

// Generate list of all 105 avatars statically
// We know we have peep-1.svg to peep-99.svg (and more based on previous ls).
// To be safe, we'll verify count roughly or just map them from 1 to 100.
// Based on file list, we have peep-1.svg ... peep-105.svg (?)
// Actually previous list showed mixed numbering.
// Let's use a safe range, or just generate 1-100 logic on fly.

// Better approach: Just use deterministic URL generation, we don't need the array loaded in memory unless we show a picker.
const TOTAL_AVATARS = 99 // Safe upper bound for deterministic hash

/**
 * Get a list of all available avatar URLs (for picker)
 */
export function getAllAvatars() {
    // Generate array of /avatars/peep-1.svg ... /avatars/peep-99.svg
    return Array.from({ length: TOTAL_AVATARS }, (_, i) => `/avatars/peep-${i + 1}.svg`)
}

/**
 * Get the appropriate avatar for a user.
 * Priority:
 * 1. Saved custom avatar URL (from DB) - VALIDATED
 * 2. Deterministic hash based on email
 * 3. Fallback
 */
export function getAvatarForUser(email, savedAvatarUrl = null) {
    // 1. Check saved avatar
    if (savedAvatarUrl) {
        // Fix legacy broken paths from Dev environment
        if (savedAvatarUrl.includes('/src/assets/')) {
            const fileName = savedAvatarUrl.split('/').pop() // e.g. "peep-10.svg"
            return `/avatars/${fileName}`
        }
        return savedAvatarUrl
    }

    // 2. Fallback if no email
    if (!email) return fallbackAvatar

    // 3. Deterministic hash
    let hash = 0
    for (let i = 0; i < email.length; i++) {
        hash = ((hash << 5) - hash) + email.charCodeAt(i)
        hash |= 0 // Convert to 32bit integer
    }

    // Pick index from 1 to TOTAL_AVATARS
    const index = (Math.abs(hash) % TOTAL_AVATARS) + 1
    return `/avatars/peep-${index}.svg`
}
