"use client";

import { Copy, Facebook, Mail, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAllAvatars } from "../../lib/avatar";
import { supabase } from "../../lib/supabase";

interface ProfileData {
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    status: string;
}

export function PublicationSettings() {
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData>({ username: "", display_name: "", bio: "", avatar_url: "", status: "" });
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from("zetsuguide_user_profiles")
                .select("username, display_name, bio, avatar_url, status")
                .eq("user_id", user.id)
                .single();

            if (data && !error) {
                setProfile({
                    username: data.username || "",
                    display_name: data.display_name || "",
                    bio: data.bio || "",
                    avatar_url: data.avatar_url || "",
                    status: data.status || ""
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingInitial(false);
        }
    };

    const handleProfileUpdate = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await supabase
                .from("zetsuguide_user_profiles")
                .update({
                    display_name: profile.display_name,
                    bio: profile.bio,
                    avatar_url: profile.avatar_url,
                    status: profile.status,
                })
                .eq("user_id", user.id);
            /* alert("Settings saved successfully!"); */
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const [copiedLink, setCopiedLink] = useState("");
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.origin + "/" + (profile.username || ""));
        setCopiedLink("Copied!");
        setTimeout(() => setCopiedLink(""), 2000);
    };

    if (loadingInitial) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-10 overflow-hidden font-sans">
            <div className="p-6 border-b border-gray-100 bg-white">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Publication Settings</h2>
                <p className="text-[#555] text-[15px] mt-1">Manage your basic publication settings.</p>
            </div>

            <div className="p-8 space-y-10">

                {/* Basics Section */}
                <section className="space-y-6 max-w-2xl">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">The Basics</h3>

                    <div>
                        <h3 className="font-bold text-sm mb-4">Choose Your Avatar</h3>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                            {getAllAvatars().map((avatarPath: string) => (
                                <button
                                    key={avatarPath}
                                    onClick={() => setProfile({ ...profile, avatar_url: avatarPath })}
                                    className={`p-2 rounded border-2 transition-all ${profile.avatar_url === avatarPath ? "border-[#FF5500] bg-[#FF5500]/5" : "border-gray-200 hover:border-gray-300"}`}
                                >
                                    <img src={avatarPath} alt="avatar" className="w-full h-auto" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[15px] font-semibold text-gray-900 mb-2">Display Name</label>
                        <input
                            type="text"
                            value={profile.display_name}
                            onChange={e => setProfile({ ...profile, display_name: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px]"
                        />
                    </div>

                    <div>
                        <label className="block text-[15px] font-semibold text-gray-900 mb-2">Bio</label>
                        <textarea
                            value={profile.bio}
                            onChange={e => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            maxLength={200}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px] resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">{(profile.bio || "").length}/200 characters</p>
                    </div>

                    <div>
                        <label className="block text-[15px] font-semibold text-gray-900 mb-2">Profile Status (Bubble Text)</label>
                        <textarea
                            value={profile.status}
                            onChange={e => setProfile({ ...profile, status: e.target.value })}
                            placeholder="e.g., Working remotely, Writing a guide..."
                            maxLength={100}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white text-[15px] resize-none"
                            rows={2}
                        />
                        <p className="text-xs text-gray-500 mt-1">{(profile.status || "").length}/100 characters</p>
                    </div>

                    <div>
                        <button
                            onClick={handleProfileUpdate}
                            disabled={loading}
                            className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E64C00] text-white font-semibold rounded-lg text-[15px] transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </section>

                {/* Share Section */}
                <section className="space-y-6 max-w-lg">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Share & Grow</h3>
                    <p className="text-gray-600 text-[15px]">Let people know about your publication across your network.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleCopyLink} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                            <Copy className="w-5 h-5 text-gray-500" /> {copiedLink || "Copy link"}
                        </button>
                        <button onClick={() => window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.origin + "/" + profile.username), '_blank')} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                            <Facebook className="w-5 h-5 text-[#1877F2]" /> Facebook
                        </button>
                        <button onClick={() => window.open('mailto:?subject=Check out my publication on ZetsuGuide&body=' + encodeURIComponent(window.location.origin + "/" + profile.username), '_self')} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                            <Mail className="w-5 h-5 text-gray-500" /> Email
                        </button>
                        <button onClick={async () => {
                            try {
                                if (navigator.share) {
                                    await navigator.share({
                                        title: 'My ZetsuGuide Publication',
                                        text: 'Check out my publication on ZetsuGuide!',
                                        url: window.location.origin + "/" + profile.username,
                                    });
                                } else {
                                    handleCopyLink();
                                }
                            } catch (e) {
                                console.error('Share failed', e);
                            }
                        }} className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                            <MoreHorizontal className="w-5 h-5 text-gray-500" /> More options
                        </button>
                    </div>
                </section>

                {/* Subscriptions Section */}
                <section className="space-y-6 max-w-lg">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Paid Subscriptions</h3>
                    <p className="text-gray-600 text-[15px] pb-2">Connect with Stripe to start accepting paid subscriptions.</p>
                    <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[15px] transition-colors">
                        Connect with Stripe
                    </button>
                </section>

            </div>
        </div>
    );
}
