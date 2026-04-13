import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Camera, 
  X, 
  Loader2, 
  Settings,
  Mail
} from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import { uploadImageToImgBB } from "../../lib/imgbb";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import PostCard from "../../components/PostCard";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit States
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editBanner, setEditBanner] = useState("");
  const [updating, setUpdating] = useState(false);

  // Upload Progress
  const [uploadProgress, setUploadProgress] = useState({ type: null, percent: 0 });

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const isOwnProfile = user && profile && user.id === profile.user_id;

  const fetchData = async () => {
    try {
      const p = await communityApi.getUserProfile(username);
      if (!p) {
        toast.error("User not found");
        navigate("/community");
        return;
      }
      setProfile(p);
      
      // Prep edit fields
      setEditDisplayName(p.display_name || "");
      setEditBio(p.bio || "");
      setEditLocation(p.location || "");
      setEditWebsite(p.website || "");
      setEditAvatar(p.avatar_url || "");
      setEditBanner(p.banner_url || "");

      // Fetch user posts
      const userPosts = await communityApi.getUserPosts(p.user_id);
      setPosts(userPosts || []);
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [username]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!isOwnProfile || updating) return;

    setUpdating(true);
    try {
      const updated = await communityApi.updateUserProfile(user.id, {
        display_name: editDisplayName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
        avatar_url: editAvatar,
        banner_url: editBanner
      });
      setProfile(updated);
      setShowEditModal(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setUploadProgress({ type, percent: 0 });
    try {
      const url = await uploadImageToImgBB(file, (p) => {
        setUploadProgress({ type, percent: p });
      });
      if (type === 'avatar') setEditAvatar(url);
      else setEditBanner(url);
      toast.success(`${type === 'avatar' ? 'Photo' : 'Banner'} uploaded!`);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploadProgress({ type: null, percent: 0 });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-[#1d9bf0]" size={32} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-1.5 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/[0.1] transition-colors">
          <ArrowLeft size={20} className="text-[#e7e9ea]" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-xl font-bold text-[#e7e9ea] truncate">{profile.display_name}</h1>
          <p className="text-[#71767b] text-[13px]">{posts.length} Posts</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-32 sm:h-48 bg-[#333639] overflow-hidden">
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1d9bf0]/20 to-[#16181c]" />
          )}
        </div>
        
        <div className="px-4">
          <div className="relative flex justify-between items-start h-16 sm:h-20">
            <div className="absolute -top-12 sm:-top-16 left-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-[#2f3336] overflow-hidden">
              <img 
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random&color=fff&bold=true`} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="ml-auto pt-3">
              {isOwnProfile ? (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-1.5 rounded-full border border-[#536471] text-[#e7e9ea] font-bold text-[15px] hover:bg-white/[0.05] transition-colors"
                >
                  Edit profile
                </button>
              ) : (
                <div className="flex gap-2">
                   <button className="p-2 rounded-full border border-[#536471] text-[#1d9bf0] hover:bg-white/[0.05]">
                      <Mail size={20} />
                   </button>
                   <button className="bg-[#eff3f4] text-black px-4 py-1.5 rounded-full font-bold text-[15px] hover:bg-[#d7dbdc]">
                      Follow
                   </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <h2 className="text-[20px] font-extrabold text-[#e7e9ea] leading-tight">
               {profile.display_name}
            </h2>
            <p className="text-[#71767b] text-[15px]">@{profile.username}</p>
            
            {profile.bio && (
              <p className="mt-3 text-[15px] text-[#e7e9ea] leading-5 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[#71767b] text-[15px]">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon size={16} />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#1d9bf0] hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-3 mb-1">
              <div className="flex gap-1 text-[14px]">
                <span className="font-bold text-[#e7e9ea]">{profile.following_count || 0}</span>
                <span className="text-[#71767b]">Following</span>
              </div>
              <div className="flex gap-1 text-[14px]">
                <span className="font-bold text-[#e7e9ea]">{profile.followers_count || 0}</span>
                <span className="text-[#71767b]">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="border-b border-[#2f3336] flex mt-2">
        {["Posts", "Replies", "Highlights", "Media", "Likes"].map((tab) => (
          <button 
            key={tab}
            className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${
              tab === "Posts" ? "text-[#e7e9ea]" : "text-[#71767b] hover:bg-white/[0.03]"
            }`}
          >
            {tab}
            {tab === "Posts" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />}
          </button>
        ))}
      </div>

      {/* User Feed */}
      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-[20px] font-bold text-[#e7e9ea]">@{profile.username} hasn't posted yet</h3>
            <p className="text-[#71767b] mt-1 text-[15px]">When they do, their posts will show up here.</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))} />)
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] px-4 overflow-y-auto pb-10">
          <div className="bg-black w-full max-w-[600px] rounded-2xl overflow-hidden border border-[#2f3336] shadow-2xl">
             <div className="px-4 py-3 flex items-center justify-between border-b border-[#2f3336]">
               <div className="flex items-center gap-6">
                 <button onClick={() => setShowEditModal(false)} className="hover:bg-white/[0.1] p-2 rounded-full transition-colors">
                   <X size={20} className="text-[#e7e9ea]" />
                 </button>
                 <h2 className="text-xl font-bold text-[#e7e9ea]">Edit profile</h2>
               </div>
               <button 
                onClick={handleUpdateProfile}
                disabled={updating || uploadProgress.type !== null}
                className="bg-[#eff3f4] text-black px-4 py-1.5 rounded-full font-bold text-[15px] hover:bg-[#d7dbdc] transition-colors"
               >
                 {updating ? <Loader2 className="animate-spin" size={18} /> : "Save"}
               </button>
             </div>

             <div className="relative">
                {/* Banner Edit */}
                <div 
                  className="w-full h-40 bg-[#333639] relative group cursor-pointer"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <img src={editBanner || profile.banner_url || ''} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploadProgress.type === 'banner' ? (
                       <span className="text-white font-bold">{uploadProgress.percent}%</span>
                    ) : (
                       <div className="bg-black/50 p-3 rounded-full"><Camera size={24} className="text-white" /></div>
                    )}
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" 
                    onChange={(e) => handleImageUpload(e.target.files[0], 'banner')} />
                </div>

                {/* Avatar Edit */}
                <div className="px-4 relative -mt-10 mb-10">
                  <div 
                    className="w-24 h-24 rounded-full bg-black border-4 border-black relative group cursor-pointer overflow-hidden"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <img src={editAvatar || profile.avatar_url || ''} alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                    {uploadProgress.type === 'avatar' ? (
                       <span className="text-white font-bold text-sm">{uploadProgress.percent}%</span>
                    ) : (
                       <Camera size={20} className="text-white" />
                    )}
                    </div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" 
                      onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')} />
                  </div>
                </div>

                <div className="p-4 space-y-6">
                  {/* Fields */}
                   <div className="relative border border-[#2f3336] rounded-md px-3 py-2 flex flex-col focus-within:ring-1 focus-within:ring-[#1d9bf0]">
                      <label className="text-[13px] text-[#71767b]">Display Name</label>
                      <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} className="w-full bg-transparent text-[#e7e9ea] outline-none" />
                   </div>
                   <div className="relative border border-[#2f3336] rounded-md px-3 py-2 flex flex-col focus-within:ring-1 focus-within:ring-[#1d9bf0]">
                      <label className="text-[13px] text-[#71767b]">Bio</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="w-full bg-transparent text-[#e7e9ea] outline-none resize-none" maxLength={200} />
                   </div>
                   <div className="relative border border-[#2f3336] rounded-md px-3 py-2 flex flex-col focus-within:ring-1 focus-within:ring-[#1d9bf0]">
                      <label className="text-[13px] text-[#71767b]">Location</label>
                      <input value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full bg-transparent text-[#e7e9ea] outline-none" />
                   </div>
                   <div className="relative border border-[#2f3336] rounded-md px-3 py-2 flex flex-col focus-within:ring-1 focus-within:ring-[#1d9bf0]">
                      <label className="text-[13px] text-[#71767b]">Website</label>
                      <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="w-full bg-transparent text-[#e7e9ea] outline-none" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
