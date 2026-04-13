import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, X, Globe, Lock, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import { uploadImageToImgBB } from "../../lib/imgbb";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState("");
  const [newGroupBanner, setNewGroupBanner] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload States
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconProgress, setIconProgress] = useState(0);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(0);

  const iconInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [allGroups, myJoinedIds] = await Promise.all([
        communityApi.getCommunities(),
        user ? communityApi.getJoinedCommunities(user.id) : Promise.resolve([]),
      ]);
      setGroups(allGroups || []);
      setJoinedIds(myJoinedIds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoinToggle = async (groupId, groupName) => {
    if (!user) {
      toast.error("Please login to join communities");
      return;
    }

    const isJoined = joinedIds.includes(groupId);
    try {
      if (isJoined) {
        await communityApi.leaveCommunity(groupId, user.id);
        setJoinedIds(prev => prev.filter(id => id !== groupId));
        toast.success(`Left ${groupName}`);
      } else {
        await communityApi.joinCommunity(groupId, user.id);
        setJoinedIds(prev => [...prev, groupId]);
        toast.success(`Joined ${groupName}!`);
      }
      const updatedGroups = await communityApi.getCommunities();
      setGroups(updatedGroups);
    } catch (e) {
      toast.error("Action failed. Try again.");
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingIcon(true);
    setIconProgress(0);
    try {
      const url = await uploadImageToImgBB(file, p => setIconProgress(p));
      setNewGroupAvatar(url);
      toast.success("Icon uploaded!");
    } catch (err) {
      toast.error("Icon upload failed");
    } finally {
      setUploadingIcon(false);
      setIconProgress(0);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingBanner(true);
    setBannerProgress(0);
    try {
      const url = await uploadImageToImgBB(file, p => setBannerProgress(p));
      setNewGroupBanner(url);
      toast.success("Banner uploaded!");
    } catch (err) {
      toast.error("Banner upload failed");
    } finally {
      setUploadingBanner(false);
      setBannerProgress(0);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newGroupName.trim()) {
      toast.error("Community name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const avatar = newGroupAvatar.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(newGroupName)}&background=random&color=fff`;
      await communityApi.createCommunity(newGroupName.trim(), newGroupDesc.trim(), avatar, user.id);
      
      // Note: community_groups doesn't have banner_url yet in all schemas, but we can store it in metadata if needed.
      // For now, we'll just focus on what's in the current schema (avatar_url).

      toast.success("Community created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (e) {
      toast.error(e.message || "Failed to create community");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupAvatar("");
    setNewGroupBanner("");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#e7e9ea]">Communities</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="p-2 rounded-full hover:bg-white/[0.06] transition-colors text-[#1d9bf0]"
          title="Create Community"
        >
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="divide-y divide-[#2f3336]">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 px-4 py-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#2f3336] flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-[#2f3336] rounded w-1/4" />
                <div className="h-3 bg-[#2f3336] rounded w-2/4" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-8 text-center">
          <div className="w-24 h-24 rounded-full border border-[#2f3336] flex items-center justify-center mb-6">
            <Users size={44} className="text-[#71767b]" />
          </div>
          <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-3 leading-tight">
            No communities yet
          </h2>
          <p className="text-[#71767b] text-[17px] max-w-[360px] leading-relaxed mb-8">
            Be the first to create a community for others to join!
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-8 py-3 rounded-full text-[17px] transition-all"
          >
            Create a Community
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#2f3336]">
          {groups.map((g) => {
            const isJoined = joinedIds.includes(g.id);
            return (
              <div
                key={g.id}
                onClick={() => navigate(`/community/group/${g.id}`)}
                className="flex items-center gap-4 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2f3336] flex-shrink-0">
                  {g.avatar_url
                    ? <img src={g.avatar_url} alt={g.name} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users size={22} className="text-[#71767b]" />
                      </div>
                    )
                  }
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-[#e7e9ea] text-[15px] truncate">{g.name}</p>
                    <ShieldCheck size={14} className="text-[#1d9bf0]" />
                  </div>
                  {g.description && (
                    <p className="text-[#71767b] text-[14px] truncate">{g.description}</p>
                  )}
                  <p className="text-[#71767b] text-[13px] mt-0.5 font-medium">
                    {(g.members_count || 0).toLocaleString()} members
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleJoinToggle(g.id, g.name); }}
                  className={`flex-shrink-0 rounded-full px-5 py-1.5 text-[14px] font-bold border transition-all ${
                    isJoined
                      ? "border-[#536471] text-[#e7e9ea] hover:border-[#f4212e]/50 hover:text-[#f4212e] hover:bg-[#f4212e]/5"
                      : "bg-[#eff3f4] text-black border-transparent hover:bg-[#d7dbdc]"
                  }`}
                >
                  {isJoined ? "Following" : "Join"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE COMMUNITY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-[#5b7083]/40 backdrop-blur-[2px] flex items-start justify-center pt-[5vh] px-4 overflow-y-auto pb-10">
          <div className="bg-black w-full max-w-[600px] rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-[#2f3336] mb-10">
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#2f3336] sticky top-0 bg-black/80 backdrop-blur-md z-30">
              <div className="flex items-center gap-6">
                <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/[0.1] p-2 rounded-full transition-colors">
                  <X size={20} className="text-[#e7e9ea]" />
                </button>
                <h2 className="text-xl font-bold text-[#e7e9ea]">Create Community</h2>
              </div>
              <button 
                onClick={handleCreateCommunity}
                disabled={isSubmitting || !newGroupName.trim() || uploadingIcon || uploadingBanner}
                className="bg-[#eff3f4] text-black px-4 py-1.5 rounded-full font-bold text-[15px] hover:bg-[#d7dbdc] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>

            <div className="p-0 space-y-0">
              {/* BANNER UPLOAD */}
              <div 
                className="w-full h-40 bg-[#333639] relative group cursor-pointer overflow-hidden"
                onClick={() => bannerInputRef.current?.click()}
              >
                {newGroupBanner ? (
                  <img src={newGroupBanner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center border-b border-[#2f3336]">
                    <div className="bg-black/50 p-3 rounded-full">
                       <Camera size={24} className="text-white" />
                    </div>
                  </div>
                )}
                
                {/* Banner Upload Progress Overlay */}
                {uploadingBanner && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="w-10 h-10 rounded-full border-4 border-[#1d9bf0]/20 border-t-[#1d9bf0] animate-spin mb-2"></div>
                    <span className="text-white font-bold text-lg">{bannerProgress}%</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </div>

              {/* ICON UPLOAD */}
              <div className="px-4 relative -mt-10 mb-14">
                <div 
                  className="w-24 h-24 rounded-full bg-black border-4 border-black relative group cursor-pointer overflow-hidden"
                  onClick={() => iconInputRef.current?.click()}
                >
                  <div className="w-full h-full bg-[#333639] rounded-full overflow-hidden flex items-center justify-center">
                    {newGroupAvatar ? (
                      <img src={newGroupAvatar} alt="Icon" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={28} className="text-white/70" />
                    )}
                  </div>
                  
                  {/* Icon Upload Progress Overlay */}
                  {uploadingIcon && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                      <div className="w-8 h-8 rounded-full border-4 border-[#1d9bf0]/20 border-t-[#1d9bf0] animate-spin mb-1"></div>
                      <span className="text-white font-bold text-sm">{iconProgress}%</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full" />
                  <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} />
                </div>
              </div>

              <form className="px-4 pb-6 space-y-6" onSubmit={handleCreateCommunity}>
                <div className="relative group">
                  <input 
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-transparent border border-[#2f3336] rounded-md px-3 pt-6 pb-2 text-[#e7e9ea] focus:border-[#1d9bf0] outline-none transition-colors"
                  />
                  <label className="absolute left-3 top-2 text-[#71767b] text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#1d9bf0]">
                    Community Name
                  </label>
                </div>

                <div className="relative group">
                  <textarea 
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder=" "
                    rows={3}
                    className="peer w-full bg-transparent border border-[#2f3336] rounded-md px-3 pt-6 pb-2 text-[#e7e9ea] focus:border-[#1d9bf0] outline-none transition-colors resize-none"
                  />
                  <label className="absolute left-3 top-2 text-[#71767b] text-xs transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#1d9bf0]">
                    Description
                  </label>
                </div>

                <div className="flex gap-4 p-3 bg-[#1d9bf0]/10 rounded-xl border border-[#1d9bf0]/20">
                   <Globe size={20} className="text-[#1d9bf0] flex-shrink-0" />
                   <div>
                      <p className="text-[#e7e9ea] font-bold text-sm">Public Community</p>
                      <p className="text-[#71767b] text-xs">Anyone can see and join this community.</p>
                   </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
