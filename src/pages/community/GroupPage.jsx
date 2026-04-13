import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Globe, 
  Settings, 
  Trash2, 
  AlertTriangle,
  Lock,
  Camera,
  X,
  Check,
  UserPlus
} from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import { uploadImageToImgBB } from "../../lib/imgbb";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import PostCard from "../../components/PostCard";
import Composer from "../../components/community/Composer";

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("Posts");
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // Edit States
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconProgress, setIconProgress] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(0);

  // Deletion States
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const iconInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const isAdmin = user && group && user.id === group.creator_id;

  const fetchGroupData = async () => {
    try {
      const [g, groupPosts, joinedIds, memberList] = await Promise.all([
        communityApi.getGroup(id),
        communityApi.getPosts("All", user?.id, id),
        user ? communityApi.getJoinedCommunities(user.id) : Promise.resolve([]),
        communityApi.getCommunityMembers(id)
      ]);

      if (!g) {
        toast.error("Community not found");
        navigate("/community/communities");
        return;
      }

      setGroup(g);
      setPosts(groupPosts || []);
      setJoined(joinedIds.includes(id));
      setMembers(memberList || []);
      
      // Prep edit fields
      setEditName(g.name);
      setEditDesc(g.description || "");
      setEditAvatar(g.avatar_url || "");
      setEditBanner(g.banner_url || "");
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to load community details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id, user]);

  const handleJoinToggle = async () => {
    if (!user) {
      toast.error("Please login to join");
      return;
    }
    
    try {
      if (joined) {
        await communityApi.leaveCommunity(id, user.id);
        setJoined(false);
        toast.success("Left community");
      } else {
        await communityApi.joinCommunity(id, user.id);
        setJoined(true);
        toast.success("Joined community!");
      }
      // Refresh details and count
      fetchGroupData();
    } catch (e) {
      toast.error("Failed to update membership");
    }
  };

  const handleUpdateCommunity = async (e) => {
    e.preventDefault();
    if (!isAdmin || isUpdating) return;
    if (!editName.trim()) return toast.error("Name is required");

    setIsUpdating(true);
    try {
      const updated = await communityApi.updateCommunity(id, {
        name: editName.trim(),
        description: editDesc.trim(),
        avatar_url: editAvatar,
        banner_url: editBanner
      });
      setGroup(updated);
      setShowEditModal(false);
      toast.success("Community updated!");
    } catch (err) {
      toast.error("Update failed: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (deleteConfirmText !== group.name) {
      toast.error("Please type the community name correctly to confirm");
      return;
    }
    
    setIsDeleting(true);
    try {
      await communityApi.deleteCommunity(id);
      toast.success("Community permanently deleted");
      navigate("/community/communities");
    } catch (e) {
      toast.error("Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-2 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/[0.1] transition-colors">
          <ArrowLeft size={20} className="text-[#e7e9ea]" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-xl font-bold text-[#e7e9ea] truncate">{group.name}</h1>
          <p className="text-[#71767b] text-[13px]">{members.length} members</p>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
              title="Delete Community"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 sm:h-52 bg-[#333639] w-full overflow-hidden">
          {group.banner_url ? (
            <img src={group.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1d9bf0]/20 to-[#16181c]" />
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="px-4 pb-4">
          <div className="relative flex justify-between items-start">
            <div className="absolute -top-12 sm:-top-16 left-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-[#2f3336] overflow-hidden">
              <img 
                src={group.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&color=fff`} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="ml-auto pt-3 flex gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-2 rounded-full border border-[#536471] hover:bg-white/[0.05] transition-colors"
                  title="Settings"
                >
                  <Settings size={20} className="text-[#e7e9ea]" />
                </button>
              )}
              <button
                onClick={handleJoinToggle}
                className={`rounded-full px-5 py-2 font-bold text-[15px] transition-all ${
                  joined 
                    ? "border border-[#536471] text-[#e7e9ea] hover:border-red-500 hover:text-red-500"
                    : "bg-[#eff3f4] text-black hover:bg-[#d7dbdc]"
                }`}
              >
                {joined ? "Following" : "Join Community"}
              </button>
            </div>
          </div>

          <div className="mt-14 sm:mt-18">
            <div className="flex items-center gap-1">
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">{group.name}</h2>
              <ShieldCheck size={18} className="text-[#1d9bf0]" />
            </div>
            {group.description && (
              <p className="mt-3 text-[15px] text-[#e7e9ea] leading-5 whitespace-pre-wrap">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              <button 
                onClick={() => setShowMembersModal(true)}
                className="flex items-center gap-1 text-[#71767b] text-[15px] hover:underline"
              >
                <Users size={16} />
                <span className="font-bold text-[#e7e9ea]">{members.length}</span>
                <span>Members</span>
              </button>
              <div className="flex items-center gap-1 text-[#71767b] text-[15px]">
                <Globe size={16} />
                <span>Public Group</span>
              </div>
              <div className="flex items-center gap-1 text-[#71767b] text-[15px]">
                <Calendar size={16} />
                <span>Created April 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2f3336] flex">
        {["Posts", "Media", "Rules"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[15px] font-bold transition-colors ${
              activeTab === tab 
                ? "text-[#e7e9ea] border-b-4 border-[#1d9bf0]" 
                : "text-[#71767b] hover:bg-white/[0.03]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        {activeTab === "Posts" && (
          <>
            <div className="border-b border-[#2f3336]">
              <Composer 
                user={user} 
                onPostCreated={fetchGroupData} 
                groupId={id} 
                placeholder={`Post to ${group.name}...`}
              />
            </div>
            {posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mx-auto mb-4 border border-[#1d9bf0]/20">
                  <Lock size={24} className="text-[#1d9bf0]" />
                </div>
                <h3 className="text-[20px] font-bold text-[#e7e9ea]">No posts here yet</h3>
                <p className="text-[#71767b] mt-1">Be the first to share something with the community!</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} />)
            )}
          </>
        )}

        {activeTab === "Media" && (
          <div className="p-8 text-center text-[#71767b]">
            No photos or videos have been shared in this community yet.
          </div>
        )}

        {activeTab === "Rules" && (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#e7e9ea]">Community Rules</h3>
            <div className="space-y-4">
              {[
                { t: "Be kind and respectful", d: "Harassment, hate speech, or bullying of any kind will not be tolerated." },
                { t: "Keep it relevant", d: "Ensure your posts align with the goals and interests of this community." },
                { t: "No spam", d: "Do not post promotional content or repetitive messages without permission." }
              ].map((r, i) => (
                <div key={i} className="bg-[#16181c] p-4 rounded-xl border border-[#2f3336]">
                  <p className="font-bold text-[#e7e9ea]">{i+1}. {r.t}</p>
                  <p className="text-[#71767b] text-sm mt-1">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] px-4 overflow-y-auto pb-10">
          <div className="bg-black w-full max-w-[600px] rounded-2xl overflow-hidden border border-[#2f3336] shadow-2xl">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#2f3336]">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowEditModal(false)} className="hover:bg-white/[0.1] p-2 rounded-full transition-colors">
                  <X size={20} className="text-[#e7e9ea]" />
                </button>
                <h2 className="text-xl font-bold text-[#e7e9ea]">Edit Community</h2>
              </div>
              <button 
                onClick={handleUpdateCommunity}
                disabled={isUpdating || uploadingIcon || uploadingBanner || !editName.trim()}
                className="bg-[#eff3f4] text-black px-4 py-1.5 rounded-full font-bold text-[15px] hover:bg-[#d7dbdc] transition-colors"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : "Save"}
              </button>
            </div>

            <div className="relative">
              {/* Banner Edit */}
              <div 
                className="w-full h-40 bg-[#333639] relative group cursor-pointer"
                onClick={() => bannerInputRef.current?.click()}
              >
                <img src={editBanner || group.banner_url} alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {uploadingBanner ? (
                    <span className="text-white font-bold">{bannerProgress}%</span>
                  ) : (
                    <div className="bg-black/50 p-3 rounded-full"><Camera size={24} className="text-white" /></div>
                  )}
                </div>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" 
                  onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    setUploadingBanner(true);
                    try { const url = await uploadImageToImgBB(f, p => setBannerProgress(p)); setEditBanner(url); } catch(err) { toast.error("Fail"); }
                    finally { setUploadingBanner(false); }
                  }} 
                />
              </div>
              {/* Icon Edit */}
              <div className="px-4 relative -mt-10 mb-10">
                <div 
                  className="w-24 h-24 rounded-full bg-black border-4 border-black relative group cursor-pointer overflow-hidden"
                  onClick={() => iconInputRef.current?.click()}
                >
                  <img src={editAvatar || group.avatar_url} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploadingIcon ? (
                      <span className="text-white font-bold text-sm">{iconProgress}%</span>
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </div>
                  <input type="file" ref={iconInputRef} className="hidden" accept="image/*" 
                    onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      setUploadingIcon(true);
                      try { const url = await uploadImageToImgBB(f, p => setIconProgress(p)); setEditAvatar(url); } catch(err) { toast.error("Fail"); }
                      finally { setUploadingIcon(false); }
                    }} 
                  />
                </div>
              </div>

              <div className="p-4 space-y-6">
                 <div className="relative border border-[#2f3336] rounded-md px-3 py-2">
                    <label className="text-[13px] text-[#71767b]">Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-transparent text-[#e7e9ea] outline-none" />
                 </div>
                 <div className="relative border border-[#2f3336] rounded-md px-3 py-2">
                    <label className="text-[13px] text-[#71767b]">Description</label>
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} className="w-full bg-transparent text-[#e7e9ea] outline-none resize-none" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-black w-full max-w-[400px] rounded-2xl border border-[#2f3336] overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#e7e9ea]">Members</h2>
              <button onClick={() => setShowMembersModal(false)} className="hover:bg-white/[0.1] p-1.5 rounded-full transition-colors"><X size={20} className="text-[#e7e9ea]" /></button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#2f3336]">
              {members.length === 0 ? (
                <div className="p-8 text-center text-[#71767b]">No members found.</div>
              ) : (
                members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer" 
                    onClick={() => { setShowMembersModal(false); navigate(`/profile/${m.username || m.user_id}`); }}>
                    <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${m.display_name}&background=random`} alt="" className="w-10 h-10 rounded-full" />
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-[#e7e9ea] truncate">{m.display_name}</p>
                      <p className="text-[#71767b] text-sm truncate">@{m.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL (REUSED) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black w-full max-w-[400px] rounded-2xl p-6 border border-[#2f3336]">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle size={36} className="text-red-600 mb-4" />
              <h2 className="text-xl font-extrabold text-[#e7e9ea] mb-2">Delete community?</h2>
              <p className="text-[#71767b] text-[15px] mb-6">Type <strong>{group.name}</strong> to confirm permanent deletion.</p>
              <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="w-full bg-transparent border border-[#2f3336] rounded-lg px-4 py-3 text-[#e7e9ea] mb-4" />
              <button onClick={handleDeleteCommunity} disabled={isDeleting || deleteConfirmText !== group.name} className="w-full bg-[#f4212e] text-white font-bold py-3 rounded-full disabled:opacity-50">Permanently Delete</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full text-[#e7e9ea] font-medium mt-3">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
