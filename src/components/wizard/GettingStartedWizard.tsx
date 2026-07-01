"use client";

import { CheckCircle2, ChevronRight, Circle, Copy, Facebook, Mail, MoreHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useModal } from "../../contexts/ModalContext";
import { getAllAvatars } from "../../lib/avatar";
import { supabase } from "../../lib/supabase";

interface ProfileData {
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    status: string;
    has_seen_onboarding: boolean;
}

export function GettingStartedWizard() {
    const { user } = useAuth();
    const { openAddModal } = useModal();

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData>({ username: "", display_name: "", bio: "", avatar_url: "", status: "", has_seen_onboarding: true });
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [hasGuides, setHasGuides] = useState(false);
    const [copiedLink, setCopiedLink] = useState("");

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from("zetsuguide_user_profiles")
                .select("username, display_name, bio, avatar_url, status, has_seen_onboarding")
                .eq("user_id", user.id)
                .single();

            if (data && !error) {
                setProfile({
                    username: data.username || "",
                    display_name: data.display_name || "",
                    bio: data.bio || "",
                    avatar_url: data.avatar_url || "",
                    status: data.status || "",
                    has_seen_onboarding: data.has_seen_onboarding || false
                });
            }

            // Check if user has any guides
            const { data: guides } = await supabase
                .from("guides")
                .select("id")
                .eq("created_by", user.id)
                .limit(1);
            setHasGuides((guides?.length || 0) > 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoaded(true);
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
            setActiveModal(null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const finishSetup = async () => {
        setActiveModal(null);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.origin + "/" + (profile.username || ""));
        setCopiedLink("Copied!");
        setTimeout(() => setCopiedLink(""), 2000);
    };

    const handleItemClick = (id: string) => {
        if (id === 'post') {
            openAddModal();
        } else if (id !== 'create') {
            setActiveModal(id);
        }
    };

    if (!loaded || profile.has_seen_onboarding) {
        return null; // hide completely if loading or if already finished setup
    }

    const isBasicsComplete = (profile.display_name || "").length > 0;

    const steps = [
        { id: 'basics', title: 'Set up the basics', completed: isBasicsComplete },
        { id: 'paid', title: 'Turn on paid subscriptions', completed: false },
        { id: 'subscribers', title: 'Get your first 10 subscribers', completed: false },
        { id: 'share', title: 'Share your publication', completed: false },
        { id: 'post', title: 'Create your first post', completed: hasGuides },
        { id: 'create', title: 'Create a publication', completed: true },
    ];

    const completedCount = steps.filter(s => s.completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-10 overflow-hidden font-sans">
                <div className="p-8">
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Getting started</h2>
                    <p className="text-gray-500 text-[15px] mt-1 mb-6">Congratulations on setting up your publication! Let's get you set up for success</p>

                    <div className="w-full h-[6px] bg-gray-200 rounded-full overflow-hidden mb-8">
                        <div className={`h-full bg-[#00A870]`} style={{ width: `${progressPercent}%`, transition: 'width 0.5s ease-in-out' }} />
                    </div>

                    <div className="space-y-3">
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => handleItemClick(step.id)}
                                disabled={step.completed}
                                className={`w-full bg-white border border-gray-200 rounded-[10px] px-5 py-4 flex items-center justify-between transition-all outline-none ${step.completed ? 'bg-gray-50 opacity-60 cursor-default' : 'hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-[#FF5500] focus:ring-offset-1'}`}
                            >
                                <div className="flex items-center gap-4">
                                    {step.completed ? (
                                        <CheckCircle2 className="w-6 h-6 text-[#00A870]" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-gray-400 stroke-[1.5]" />
                                    )}
                                    <span className={`text-[16px] font-medium ${step.completed ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-800'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {!step.completed && (
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={loading}
                        onClick={finishSetup}
                        className="w-full mt-6 bg-[#FFF2EB] text-[#FF5500] hover:bg-[#FFE5D6] font-semibold py-3.5 rounded-xl text-[16px] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Continue setup"}
                    </button>
                </div>
            </div>

            {/* MODALS */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-bold text-lg text-gray-900">
                                {steps.find(s => s.id === activeModal)?.title}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {activeModal === 'basics' && (
                                <div className="space-y-6">
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
                                            rows={3}
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

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleProfileUpdate}
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E64C00] text-white font-semibold rounded-lg text-[15px] transition-colors disabled:opacity-50"
                                        >
                                            {loading ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'subscribers' && (
                                <div className="space-y-6">
                                    <p className="text-gray-600">Jumpstart your publication by adding friends, family, and colleagues.</p>
                                    <div>
                                        <label className="block text-[15px] font-semibold text-gray-900 mb-2">Add emails (comma separated)</label>
                                        <textarea
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5500] text-[15px]"
                                            rows={4}
                                            placeholder="alice@example.com, bob@example.com"
                                        />
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={() => setActiveModal(null)}
                                            className="px-6 py-2.5 bg-[#FF5500] hover:bg-[#E64C00] text-white font-semibold rounded-lg text-[15px] transition-colors"
                                        >
                                            Add subscribers
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'share' && (
                                <div className="space-y-6">
                                    <p className="text-gray-600 mb-4">Let people know about your new publication across your network.</p>
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
                                </div>
                            )}

                            {activeModal === 'paid' && (
                                <div className="text-center py-6">
                                    <p className="text-gray-600 mb-6">Connect with Stripe to start accepting paid subscriptions.</p>
                                    <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[15px] transition-colors">
                                        Connect with Stripe
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
