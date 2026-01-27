import { BookOpen, Calendar, Loader2, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAvatarForUser } from '../lib/avatar'
import { supabase } from '../lib/supabase'

export default function UserWorkspacePage() {
    const { username: rawUsername } = useParams()
    // Remove @ prefix if it exists
    const username = rawUsername?.replace(/^@/, '') || ''
    const [userProfile, setUserProfile] = useState(null)
    const [userGuides, setUserGuides] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)

    useEffect(() => {
        loadUserWorkspace()
    }, [username])

    async function loadUserWorkspace() {
        setLoading(true)
        setError(null)

        try {
            console.log('Loading workspace for username:', username)

            // PRIORITY: Fetch ONLY from Supabase (authoritative source)
            // Ignore localStorage to prevent inconsistencies
            let supabaseGuides = []
            try {
                const { data, error: fetchError } = await supabase
                    .from('guides')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (fetchError) {
                    console.error('Supabase fetch error:', fetchError)
                } else if (data) {
                    console.log('Got', data.length, 'guides from Supabase')
                    supabaseGuides = data
                }
            } catch (err) {
                console.error('Supabase connection error:', err)
            }

            if (supabaseGuides.length === 0) {
                console.warn('No guides found in Supabase')
                setError('User not found or has no guides')
                setLoading(false)
                return
            }

            // Filter guides by matching username/email
            const matchingGuides = supabaseGuides.filter(guide => {
                const userEmail = guide.user_email || ''
                const authorName = guide.author_name || ''
                const emailPrefix = userEmail.split('@')[0].toLowerCase()

                return (
                    userEmail.toLowerCase().includes(username.toLowerCase()) ||
                    emailPrefix === username.toLowerCase() ||
                    authorName.toLowerCase().includes(username.toLowerCase()) ||
                    authorName.toLowerCase() === username.toLowerCase()
                )
            })

            console.log('Matching guides found:', matchingGuides.length)

            if (matchingGuides.length === 0) {
                console.warn('No guides found for user:', username)
                setError('User not found or has no guides')
                setLoading(false)
                return
            }

            // Get user profile from the first guide (they all have same author)
            const firstGuide = matchingGuides[0]
            const profile = {
                author_name: firstGuide.author_name || firstGuide.user_email?.split('@')[0] || 'Anonymous',
                author_email: firstGuide.user_email,
                author_id: firstGuide.author_id,
                guides_count: matchingGuides.length,
                created_at: matchingGuides[matchingGuides.length - 1].created_at // Earliest guide date
            }

            // Fetch complete user profile with avatar and bio from database
            let userAvatarUrl = null
            let userBio = null
            try {
                const { data: profileData } = await supabase
                    .from('zetsuguide_user_profiles')
                    .select('avatar_url, bio')
                    .eq('user_email', firstGuide.user_email)
                    .maybeSingle()

                if (profileData?.avatar_url) {
                    userAvatarUrl = profileData.avatar_url
                }
                if (profileData?.bio) {
                    userBio = profileData.bio
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            }

            // Get avatar: from profile, or deterministic hash based on email
            const finalAvatarUrl = getAvatarForUser(firstGuide.user_email, userAvatarUrl)
            setAvatarUrl(finalAvatarUrl)

            // Add bio to profile if available
            if (userBio) {
                profile.bio = userBio
            }

            setUserProfile(profile)
            setUserGuides(matchingGuides.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))

        } catch (err) {
            console.error('Error loading workspace:', err)
            setError('Failed to load workspace')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading workspace...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">😔</div>
                    <h1 className="text-3xl font-bold mb-2">{error}</h1>
                    <p className="text-gray-500 mb-6">
                        We couldn't find a workspace for <strong>@{username}</strong>
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                        Make sure you have published at least one guide first!
                    </p>
                    <a href="/guides" className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors">
                        Browse All Guides
                    </a>
                </div>
            </div>
        )
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-3xl font-bold mb-2">No Profile Data</h1>
                    <p className="text-gray-500 mb-6">
                        Unable to load profile for <strong>@{username}</strong>
                    </p>
                    <a href="/guides" className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors">
                        Browse All Guides
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Profile Header */}
            <div className="border-b-2 border-black">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="flex items-start gap-8">
                        {/* Avatar */}
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={userProfile?.author_name}
                                className="w-24 h-24 rounded-full flex-shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
                                {userProfile?.author_name?.[0]?.toUpperCase() || '👤'}
                            </div>
                        )}

                        {/* Profile Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-black mb-2">@{userProfile?.author_name}</h1>

                            {userProfile?.bio && (
                                <p className="text-gray-700 mb-4 text-lg italic">"{userProfile.bio}"</p>
                            )}

                            <div className="flex flex-col gap-3 text-gray-600 mb-6">
                                {userProfile?.author_email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={18} />
                                        <span>{userProfile.author_email}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} />
                                    <span>
                                        {userProfile?.guides_count} guide{userProfile?.guides_count !== 1 ? 's' : ''} published
                                    </span>
                                </div>

                                {userProfile?.created_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} />
                                        <span>
                                            Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-block px-3 py-1 bg-black text-white text-sm font-medium rounded">
                                    Author
                                </span>
                                {userGuides.length > 0 && (
                                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                                        {userGuides.length} Guides
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            {userGuides.length > 0 && (
                <div className="bg-gray-100 border-y-2 border-black">
                    <div className="max-w-6xl mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Top Keywords */}
                            <div>
                                <h3 className="font-bold text-lg mb-3">Top Topics</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(
                                        new Map(
                                            userGuides
                                                .flatMap(g => (g.keywords || []).map(k => [k, 1]))
                                                .reduce((acc, [k, v]) => acc.set(k, (acc.get(k) || 0) + v), new Map())
                                                .entries()
                                        )
                                    )
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 5)
                                        .map(([keyword, count]) => (
                                            <span
                                                key={keyword}
                                                className="px-3 py-1 bg-black text-white text-xs font-medium rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                </div>
                            </div>

                            {/* Stats */}
                            <div>
                                <h3 className="font-bold text-lg mb-3">Statistics</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-bold">{userGuides.length}</span> Guides Published</p>
                                    <p><span className="font-bold">{userGuides.reduce((acc, g) => acc + (g.keywords?.length || 0), 0)}</span> Total Topics Covered</p>
                                    <p><span className="font-bold">{new Date().getFullYear() - new Date(userProfile?.created_at).getFullYear() === 0 ? 'This Year' : new Date().getFullYear() - new Date(userProfile?.created_at).getFullYear() + ' Years'}</span> Member</p>
                                </div>
                            </div>

                            {/* Languages */}
                            <div>
                                <h3 className="font-bold text-lg mb-3">Content Types</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(
                                        new Set(
                                            userGuides
                                                .flatMap(g => g.keywords || [])
                                                .filter(k => ['python', 'javascript', 'typescript', 'react', 'nodejs', 'html', 'css'].includes(k.toLowerCase()))
                                        )
                                    )
                                        .slice(0, 4)
                                        .map(lang => (
                                            <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                {lang}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Guides Section */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-black mb-8">
                    {userProfile?.author_name}'s Guides
                </h2>

                {userGuides.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 p-12 text-center">
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No guides yet</h3>
                        <p className="text-gray-500">
                            This user hasn't published any guides yet
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userGuides.map(guide => (
                            <a
                                key={guide.id || guide.slug}
                                href={`/guide/${guide.slug}`}
                                className="group border-2 border-black hover:bg-black transition-colors duration-200"
                            >
                                <div className="p-6">
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-white transition-colors">
                                        {guide.title}
                                    </h3>

                                    {guide.keywords && guide.keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {guide.keywords.slice(0, 3).map((keyword, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 group-hover:bg-gray-700 group-hover:text-white transition-colors rounded"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-gray-600 group-hover:text-gray-300 transition-colors text-sm mb-4 line-clamp-2">
                                        {(guide.markdown || guide.content || guide.html_content || '')
                                            .substring(0, 120)
                                            .replace(/[#*`]/g, '')
                                            .trim()}...
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 group-hover:border-gray-700 transition-colors">
                                        <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                            {new Date(guide.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                                            Read →
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
