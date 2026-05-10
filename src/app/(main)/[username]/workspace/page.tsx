"use client";
import { BookOpen, Bot, Calendar, Edit2, Loader2, Mail, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ChangeEvent, useEffect, useState } from "react";
import FollowButton from "../../../../components/FollowButton";
import GuideEditModal from "../../../../components/GuideEditModal";
import Toast from "../../../../components/Toast";
import VerifiedBadge from "../../../../components/VerifiedBadge";
import { useAuth } from "../../../../contexts/AuthContext";
import { Guide } from "../../../../lib/api";
import { getAllAvatars, getAvatarForUser } from "../../../../lib/avatar";
import { supabase } from "../../../../lib/supabase";
import { GuideMetadata } from "../../../../types/index";

interface UserProfile {
  user_id?: string;
  user_email?: string;
  author_name?: string;
  author_email?: string;
  author_id?: string | null;
  bio?: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
  guides_count?: number;
  followers_count?: number;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

interface WorkspaceGuide extends GuideMetadata {
  user_email?: string;
}

export default function UserWorkspacePage() {
  const { username: rawUsername } = useParams();
  const { user } = useAuth();
  const normalizeUsername = (value: string | undefined | string[]) => {
    let raw = Array.isArray(value) ? value[0] : value || "";
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // Keep original if decode fails
    }
    return raw.replace(/^(?:@|%40)+/i, "").trim();
  };
  const username = normalizeUsername(rawUsername);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGuides, setUserGuides] = useState<WorkspaceGuide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showGuideEditModal, setShowGuideEditModal] = useState<boolean>(false);
  const [selectedGuideToEdit, setSelectedGuideToEdit] = useState<Guide | null>(null);
  const [editBio, setEditBio] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [userExists, setUserExists] = useState<boolean>(true);
  const [showStatusOnTap, setShowStatusOnTap] = useState<boolean>(false);

  // AI Generated Guides (private — owner only)
  const [aiGuides, setAiGuides] = useState<WorkspaceGuide[]>([]);
  const [aiGuidesLoading, setAiGuidesLoading] = useState<boolean>(false);
  const [aiGuidesLoaded, setAiGuidesLoaded] = useState<boolean>(false);

  // Check if this is the current user's workspace
  const isOwnWorkspace =
    user?.email && userProfile?.author_email === user.email;

  useEffect(() => {
    loadUserWorkspace();
  }, [username]);

  // Load AI guides once we know this is the owner's workspace
  useEffect(() => {
    if (isOwnWorkspace && user?.email && !aiGuidesLoaded) {
      loadAiGeneratedGuides();
    }
  }, [isOwnWorkspace, user?.email]);

  async function loadAiGeneratedGuides() {
    if (!user?.email) return;
    setAiGuidesLoading(true);
    try {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .eq("status", "ai_generated")
        .eq("user_email", user.email.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[AI Guides] Fetch error:", error);
      } else {
        // Since Supabase doesn't store the content column to save space, we pull the snippet from localStorage
        let localGuides: any[] = [];
        try {
          if (typeof window !== "undefined") {
            localGuides = JSON.parse(localStorage.getItem("guides") || "[]");
          }
        } catch(e) {}
        
        const mergedData = (data || []).map((g: any) => {
          const local = localGuides.find((lg: any) => lg.slug === g.slug);
          return {
            ...g,
            content: g.content || local?.content || "",
            markdown: g.markdown || local?.markdown || ""
          };
        });
        setAiGuides(mergedData);
      }
    } catch (err) {
      console.error("[AI Guides] Exception:", err);
    } finally {
      setAiGuidesLoading(false);
      setAiGuidesLoaded(true);
    }
  }

  async function loadUserWorkspace() {
    setLoading(true);
    setError(null);
    setUserExists(true);

    try {
      console.log("Loading workspace for username:", username);

      // First, check if user exists in zetsuguide_user_profiles
      const { data: existingProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("user_id, user_email")
        .or(`user_email.ilike.%${username}%,username.ilike.${username}`)
        .maybeSingle();

      if (!existingProfile) {
        // User doesn't exist in profiles - check if they have guides
        // Try to find guides with this username
        const { data: guidesWithUsername } = await supabase
          .from("guides")
          .select("user_email, author_name")
          .ilike("author_name", `%${username}%`)
          .limit(1);

        if (!guidesWithUsername || guidesWithUsername.length === 0) {
          setUserExists(false);
          setError(null); // Clear generic error - we'll show user not found banner
          setLoading(false);
          return;
        }
      }

      // PRIORITY: Fetch ONLY from Supabase (authoritative source)
      // Ignore localStorage to prevent inconsistencies
      let supabaseGuides: WorkspaceGuide[] = [];
      try {
        const { data, error: fetchError } = await supabase
          .from("guides")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Supabase fetch error:", fetchError);
        } else if (data) {
          console.log("Got", data.length, "guides from Supabase");
          supabaseGuides = data;
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
      }

      if (supabaseGuides.length === 0) {
        console.warn("No guides found in Supabase");
        setError("User not found or has no guides");
        setLoading(false);
        return;
      }

      // Filter guides by matching username/email
      const matchingGuides = supabaseGuides.filter((guide) => {
        const userEmail = guide.user_email || "";
        const authorName = guide.author_name || "";
        const emailPrefix = userEmail.split("@")[0]?.toLowerCase() || "";

        return (
          userEmail.toLowerCase().includes(username.toLowerCase()) ||
          emailPrefix === username.toLowerCase() ||
          authorName.toLowerCase().includes(username.toLowerCase()) ||
          authorName.toLowerCase() === username.toLowerCase()
        );
      });

      console.log("Matching guides found:", matchingGuides.length);

      if (matchingGuides.length === 0) {
        console.warn("No guides found for user:", username);
        setError("User not found or has no guides");
        setLoading(false);
        return;
      }

      // Get user profile from the first guide (they all have same author)
      const firstGuide = matchingGuides[0];
      const profile: UserProfile = {
        author_name:
          firstGuide.author_name ||
          firstGuide.user_email?.split("@")[0] ||
          "Anonymous",
        author_email: firstGuide.user_email || firstGuide.author_email,
        author_id: firstGuide.author_id,
        guides_count: matchingGuides.length,
        created_at: matchingGuides[matchingGuides.length - 1]?.created_at, // Earliest guide date
      };

      // Fetch complete user profile with avatar and bio from database
      let userAvatarUrl = null;
      let userBio = null;
      let userStatus = "";
      try {
        const { data: profileData } = await supabase
          .from("zetsuguide_user_profiles")
          .select("avatar_url, bio, status")
          .eq("user_email", firstGuide.user_email || firstGuide.author_email || "")
          .maybeSingle();

        if (profileData?.avatar_url) {
          userAvatarUrl = profileData.avatar_url;
        }
        if (profileData?.bio) {
          userBio = profileData.bio;
        }
        if (profileData?.status) {
          userStatus = profileData.status;
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }

      // Get avatar: from profile, or deterministic hash based on email
      const finalAvatarUrl = getAvatarForUser(
        firstGuide.user_email || firstGuide.author_email || "",
        userAvatarUrl,
      );
      setAvatarUrl(finalAvatarUrl);

      // Add bio and status to profile if available
      if (userBio) {
        profile.bio = userBio;
      }
      if (userStatus) {
        profile.status = userStatus;
      }

      setUserProfile(profile);
      setUserGuides(
        matchingGuides.sort(
          (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime(),
        ),
      );
      setEditBio(userBio || "");
      setEditStatus(userStatus || "");
      setSelectedAvatar(userAvatarUrl || null);
    } catch (err: unknown) {
      console.error("Error loading workspace:", err);
      setError("Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfileChanges() {
    if (!user?.email || !userProfile) return;

    setSavingProfile(true);
    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from("zetsuguide_user_profiles")
        .select("id")
        .eq("user_email", user.email)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("zetsuguide_user_profiles")
          .update({
            bio: editBio,
            status: editStatus,
            avatar_url: selectedAvatar,
            updated_at: new Date().toISOString(),
          })
          .eq("user_email", user.email);

        if (error) {
          console.error("Error updating profile:", error.message);
          setToast({
            type: "error",
            message: `Failed to save profile: ${error.message}`,
          });
          return;
        }
      } else {
        // Create new profile if it doesn't exist
        const { error } = await supabase
          .from("zetsuguide_user_profiles")
          .insert([
            {
              user_email: user.email,
              bio: editBio,
              status: editStatus,
              avatar_url: selectedAvatar,
              account_type: "individual",
            },
          ]);

        if (error) {
          console.error("Error creating profile:", error.message);
          setToast({
            type: "error",
            message: `Failed to create profile: ${error.message}`,
          });
          return;
        }
      }

      // Update local state
      setUserProfile({
        ...userProfile,
        bio: editBio,
        status: editStatus,
      });
      setAvatarUrl(getAvatarForUser(user.email, selectedAvatar));
      setShowEditModal(false);
      setToast({ type: "success", message: "Profile updated successfully!" });
    } catch (err: unknown) {
      console.error("Save error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setToast({
        type: "error",
        message: "Error saving profile: " + errorMessage,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin text-gray-400 mx-auto mb-4"
          />
          <p className="text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!userExists) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* User Not Found Banner */}
        <div className="bg-red-50 border-b-2 border-red-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center gap-3 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium text-lg">Account not found</span>
            </div>
            <p className="text-center text-gray-600 mt-2">
              The user "<strong>@{username}</strong>" does not created any Guids Yet, or the account was removed... if you are the owner of the account plz double check for :
              1: did you created any guids yet?
              2:did you  deleted your account?
            </p>
          </div>
        </div>

        {/* Return to guides button */}
        <div className="flex justify-center py-12">
          <a
            href="/guides"
            className="px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Browse All Guides
          </a>
        </div>
      </div>
    );
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
          <a
            href="/guides"
            className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Browse All Guides
          </a>
        </div>
      </div>
    );
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
          <a
            href="/guides"
            className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Browse All Guides
          </a>
        </div>
      </div>
    );
  }

  const memberYears = userProfile.created_at
    ? new Date().getFullYear() - new Date(userProfile.created_at).getFullYear()
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Profile Header */}
      <div className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Owner Guidance Banner */}
          {isOwnWorkspace && !userProfile?.status && (
            <div className="w-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💭</span>
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Let others know what you are up to! Set your custom <span className="underline decoration-indigo-400">Profile Status</span> like WhatsApp & Slack.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Set Status
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
            {/* Avatar with Status Bubble */}
            <div
              onClick={() => setShowStatusOnTap(!showStatusOnTap)}
              className="relative group flex-shrink-0 mt-12 sm:mt-12 cursor-pointer select-none"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userProfile?.author_name || "User avatar"}
                  className="w-24 h-24 rounded-full flex-shrink-0 object-cover border-2 border-black dark:border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0 border-2 border-black dark:border-white shadow-lg">
                  {userProfile?.author_name?.[0]?.toUpperCase() || "👤"}
                </div>
              )}

              {/* Status Cloud/Bubble */}
              {userProfile?.status && (
                <div className={`absolute -top-14 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-2xl px-3.5 py-2 shadow-xl min-w-[120px] max-w-[200px] transition-all duration-300 z-30 pointer-events-none ${
                  showStatusOnTap
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 translate-y-1 sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:translate-y-0"
                }`}>
                  {/* Bubble Pointer Tail */}
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-6 bottom-[-7px] w-3 h-3 bg-white dark:bg-zinc-900 border-r-2 border-b-2 border-black dark:border-white transform rotate-45 z-10" />
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-tight break-words relative z-20 text-center sm:text-left select-none">
                    {userProfile.status}
                  </p>
                </div>
              )}

              {/* Action/Prompt for Account Owner */}
              {isOwnWorkspace && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 border-2 border-white dark:border-zinc-900 shadow-md hover:scale-105 transition-all animate-pulse z-40"
                  title="Update status & profile"
                >
                  <Edit2 size={12} className="stroke-[3]" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black break-all flex items-center">
                  @{userProfile?.author_name}
                  <VerifiedBadge userEmail={userProfile?.author_email || ""} />
                </h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {!isOwnWorkspace && userProfile?.author_email && (
                    <FollowButton
                      targetUserEmail={userProfile.author_email}
                      targetUserName={userProfile.author_name}
                    />
                  )}
                  {isOwnWorkspace && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors font-medium text-sm"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>

              {userProfile?.bio && (
                <p className="text-gray-700 mb-4 text-lg italic">
                  "{userProfile.bio}"
                </p>
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
                    {userProfile?.guides_count} guide
                    {userProfile?.guides_count !== 1 ? "s" : ""} published
                  </span>
                </div>

                {userProfile?.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>
                      Joined{" "}
                      {new Date(userProfile.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4 sm:mt-0">
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

        {/* Stats Section */}
        {userGuides.length > 0 && (
          <div className="bg-gray-100 border-y-2 border-black">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {/* Top Keywords */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Top Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Map(
                        userGuides
                          .flatMap((g) => (g.keywords || []).map((k) => [k, 1] as const))
                          .reduce(
                            (acc, [k, v]) => acc.set(k, (acc.get(k) || 0) + v),
                            new Map<string, number>(),
                          )
                          .entries(),
                      ),
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([keyword]) => (
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
                    <p>
                      <span className="font-bold">{userGuides.length}</span>{" "}
                      Guides Published
                    </p>
                    <p>
                      <span className="font-bold">
                        {userGuides.reduce(
                          (acc, g) => acc + (g.keywords?.length || 0),
                          0,
                        )}
                      </span>{" "}
                      Total Topics Covered
                    </p>
                    <p>
                      <span className="font-bold">
                        {memberYears === 0 ? "This Year" : `${memberYears} Years`}
                      </span>{" "}
                      Member
                    </p>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h3 className="font-bold text-lg mb-3">Content Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set(
                        userGuides
                          .flatMap((g) => g.keywords || [])
                          .filter((k) =>
                            [
                              "python",
                              "javascript",
                              "typescript",
                              "react",
                              "nodejs",
                              "html",
                              "css",
                            ].includes(k.toLowerCase()),
                          ),
                      ),
                    )
                      .slice(0, 4)
                      .map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                        >
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userGuides.map((guide) => (
                  <a
                    key={guide.id || guide.slug}
                    href={`/guide/${guide.slug}`}
                    className="group border-2 border-black hover:bg-black transition-colors duration-200"
                  >
                    <div className="p-6">
                      {guide.cover_image && (
                        <div className="w-full h-44 overflow-hidden mb-4 border border-black dark:border-white rounded-lg">
                          <img
                            src={guide.cover_image}
                            alt={guide.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <h3 className="font-bold text-lg mb-2 group-hover:text-white transition-colors">
                        {guide.title}
                      </h3>

                      {guide.keywords && guide.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {guide.keywords.slice(0, 3).map((keyword: string, idx: number) => (
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
                        {(
                          guide.markdown ||
                          guide.content ||
                          guide.html_content ||
                          ""
                        )
                          .substring(0, 120)
                          .replace(/[#*`]/g, "")
                          .trim()}
                        ...
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 group-hover:border-gray-700 transition-colors">
                        <span className="text-xs text-gray-500 group-hover:text-gray-400">
                          {guide.created_at
                            ? new Date(guide.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                            : "Unknown date"}
                        </span>
                        <div className="flex items-center gap-2">
                          {isOwnWorkspace && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedGuideToEdit(guide as Guide);
                                setShowGuideEditModal(true);
                              }}
                              className="text-xs px-3 py-1 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                            Read →
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              {showGuideEditModal && selectedGuideToEdit && (
                <GuideEditModal
                  guide={selectedGuideToEdit}
                  onClose={() => setShowGuideEditModal(false)}
                  onSaved={(updatedGuide: Guide) => {
                    setUserGuides((prev) =>
                      prev.map((item) =>
                        item.id === updatedGuide.id ? { ...item, ...updatedGuide } : item,
                      ),
                    );
                    setSelectedGuideToEdit(null);
                    setShowGuideEditModal(false);
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* ── AI Generated Guides Section (Private – Owner Only) ── */}
        {isOwnWorkspace && (
          <div className="max-w-6xl mx-auto px-4 py-12 border-t-2 border-black">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36,
                  background: "#111",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">AI Generated Guides</h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Visible only to you • Generated via ZetsuGuide AI</p>
                </div>
              </div>
              <Link
                href="/zetsuguide-ai"
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Sparkles size={14} /> Create New
              </Link>
            </div>

            {/* Skeleton Loading */}
            {aiGuidesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-2 border-gray-100 rounded-lg overflow-hidden">
                    {/* Cover skeleton */}
                    <div
                      className="w-full h-44"
                      style={{
                        background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                        backgroundSize: "200% 100%",
                        animation: "ai-skeleton-shimmer 1.5s infinite linear",
                      }}
                    />
                    <div className="p-5 space-y-3">
                      {/* Title skeleton */}
                      <div
                        className="h-5 rounded-full w-3/4"
                        style={{
                          background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                          backgroundSize: "200% 100%",
                          animation: "ai-skeleton-shimmer 1.5s infinite linear",
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                      {/* Tags skeleton */}
                      <div className="flex gap-2">
                        {[1,2].map(j => (
                          <div key={j}
                            className="h-4 rounded-full w-16"
                            style={{
                              background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
                              backgroundSize: "200% 100%",
                              animation: "ai-skeleton-shimmer 1.5s infinite linear",
                              animationDelay: `${(i + j) * 0.12}s`,
                            }}
                          />
                        ))}
                      </div>
                      {/* Excerpt skeleton */}
                      <div className="space-y-2">
                        <div className="h-3 rounded-full w-full" style={{ background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", backgroundSize: "200% 100%", animation: "ai-skeleton-shimmer 1.5s infinite linear" }} />
                        <div className="h-3 rounded-full w-5/6" style={{ background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", backgroundSize: "200% 100%", animation: "ai-skeleton-shimmer 1.5s infinite linear" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shimmer keyframe */}
            <style>{`
              @keyframes ai-skeleton-shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>

            {/* Empty State */}
            {!aiGuidesLoading && aiGuidesLoaded && aiGuides.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-14 text-center">
                <div className="w-16 h-16 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot size={28} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-1">No AI Guides Yet</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                  Generate a guide using ZetsuGuide AI and approve it — it will appear here privately.
                </p>
                <Link
                  href="/zetsuguide-ai"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Sparkles size={14} /> Open ZetsuGuide AI
                </Link>
              </div>
            )}

            {/* Guide Cards */}
            {!aiGuidesLoading && aiGuides.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiGuides.map((guide) => (
                  <div
                    key={guide.id || guide.slug}
                    className="group border-2 border-gray-200 hover:border-black rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg relative"
                  >
                    {/* Private Badge */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      <Bot size={9} /> AI
                    </div>

                    {guide.cover_image ? (
                      <div className="w-full h-44 overflow-hidden">
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Bot size={32} className="text-gray-300" />
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-black transition-colors line-clamp-2">
                        {guide.title}
                      </h3>

                      {guide.keywords && guide.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {guide.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full"
                            >
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {(guide.markdown || guide.content || "")
                          .substring(0, 120)
                          .replace(/[#*`]/g, "")
                          .trim()}...
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {guide.created_at
                            ? new Date(guide.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Unknown date"}
                        </span>
                        <Link
                          href={`/guide/${guide.slug}`}
                          className="text-xs font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-1"
                        >
                          Read →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditModal && isOwnWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-black sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Avatar Picker */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Choose Your Avatar</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {getAllAvatars().map((avatarPath: string) => (
                      <button
                        key={avatarPath}
                        onClick={() => setSelectedAvatar(avatarPath)}
                        className={`p-2 rounded border-2 transition-all ${selectedAvatar === avatarPath
                          ? "border-black bg-black/5"
                          : "border-gray-300 hover:border-gray-400"
                          }`}
                      >
                        <img
                          src={avatarPath}
                          alt="avatar"
                          className="w-full h-auto"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio Editor */}
                <div>
                  <label className="block font-bold text-lg mb-2">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={200}
                    className="w-full p-3 border-2 border-gray-300 rounded focus:border-black outline-none resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editBio.length}/200 characters
                  </p>
                </div>

                {/* Status Editor */}
                <div>
                  <label className="block font-bold text-lg mb-2">Profile Status (Bubble Text)</label>
                  <textarea
                    value={editStatus}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditStatus(e.target.value)}
                    placeholder="e.g., Working remotely, Writing a guide, Out for lunch ☕..."
                    maxLength={100}
                    className="w-full p-3 border-2 border-gray-300 rounded focus:border-black outline-none resize-none"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editStatus.length}/100 characters
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t-2 border-black sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-black hover:bg-gray-100 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfileChanges}
                  disabled={savingProfile}
                  className="flex-1 px-4 py-3 bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-bold"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
