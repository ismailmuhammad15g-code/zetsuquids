// Fallback avatar if nothing else works
import fallbackAvatar from '../assets/avatars/peep-1.svg'

// Eagerly load all avatars
const avatarModules = import.meta.glob('../assets/avatars/*.svg', { eager: true, as: 'url' })
const avatars = Object.values(avatarModules)

/**
 * Get a list of all available avatar URLs
 */
export function getAllAvatars() {
    return avatars
}

/**
 * Get the appropriate avatar for a user.
 * Priority:
 * 1. Saved custom avatar URL (from DB)
 * 2. Deterministic hash based on email (Life-Time persistence)
 * 3. Fallback
 */
export function getAvatarForUser(email, savedAvatarUrl = null) {
    // If user explicitly chose an avatar and it's saved
    if (savedAvatarUrl) return savedAvatarUrl

    // Fallback if no avatars found at all
    if (!avatars || avatars.length === 0) return fallbackAvatar

    // If no email provided, return first one
    if (!email) return avatars[0]

    // Deterministic hash function
    let hash = 0
    for (let i = 0; i < email.length; i++) {
        hash = ((hash << 5) - hash) + email.charCodeAt(i)
        hash |= 0 // Convert to 32bit integer
    }

    // Use hash to pick persistent index
    const index = Math.abs(hash) % avatars.length
    return avatars[index]
}
